import { NextRequest, NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabase/admin";
import {
  decodeOAuthState,
  exchangeCodeForTokens,
} from "@/lib/integrations/zoom";

/**
 * GET /api/integrations/zoom/callback
 *
 * OAuth callback from Zoom. Exchanges the auth code for tokens,
 * upserts the integration record, and redirects to /integrations.
 */
export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const code = searchParams.get("code");
  const state = searchParams.get("state");
  const errorParam = searchParams.get("error");

  const appUrl = process.env.NEXT_PUBLIC_APP_URL || "https://reverbic.ai";
  const redirectBase = `${appUrl}/settings?tab=integrations`;

  // Handle Zoom returning an error (user denied access, etc.)
  if (errorParam) {
    console.error("[zoom:callback] Zoom returned error:", errorParam);
    return NextResponse.redirect(
      `${redirectBase}?error=${encodeURIComponent(`Zoom authorization failed: ${errorParam}`)}`
    );
  }

  if (!code || !state) {
    console.error("[zoom:callback] Missing code or state param");
    return NextResponse.redirect(
      `${redirectBase}?error=${encodeURIComponent("Invalid callback: missing authorization code or state")}`
    );
  }

  try {
    // Decode the state to get org_id
    const { org_id } = decodeOAuthState(state);
    console.log(`[zoom:callback] Processing callback for org: ${org_id}`);

    // Exchange authorization code for tokens
    const tokens = await exchangeCodeForTokens(code);
    console.log(`[zoom:callback] Token exchange successful, scope: ${tokens.scope}`);

    // Calculate token expiry timestamp
    const tokenExpiresAt = new Date(
      Date.now() + tokens.expires_in * 1000
    ).toISOString();

    // Upsert integration record (on conflict of org_id + provider)
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const admin = getSupabaseAdmin() as any;

    // Check if integration already exists
    const { data: existing } = await admin
      .from("integrations")
      .select("id")
      .eq("organization_id", org_id)
      .eq("provider", "zoom")
      .limit(1)
      .single();

    if (existing) {
      // Update existing integration
      const { error: updateError } = await admin
        .from("integrations")
        .update({
          access_token: tokens.access_token,
          refresh_token: tokens.refresh_token,
          token_expires_at: tokenExpiresAt,
          enabled: true,
          config: { scope: tokens.scope },
          updated_at: new Date().toISOString(),
        })
        .eq("id", existing.id);

      if (updateError) {
        console.error("[zoom:callback] Failed to update integration:", updateError);
        throw new Error("Failed to save Zoom credentials");
      }

      console.log(`[zoom:callback] Updated existing integration ${existing.id}`);
    } else {
      // Insert new integration
      const { error: insertError } = await admin.from("integrations").insert({
        organization_id: org_id,
        provider: "zoom",
        access_token: tokens.access_token,
        refresh_token: tokens.refresh_token,
        token_expires_at: tokenExpiresAt,
        enabled: true,
        config: { scope: tokens.scope },
      });

      if (insertError) {
        console.error("[zoom:callback] Failed to insert integration:", insertError);
        throw new Error("Failed to save Zoom credentials");
      }

      console.log(`[zoom:callback] Created new integration for org: ${org_id}`);
    }

    return NextResponse.redirect(`${redirectBase}?success=zoom`);
  } catch (err) {
    console.error("[zoom:callback] Error:", err);
    const message = err instanceof Error ? err.message : "Failed to connect Zoom";
    return NextResponse.redirect(
      `${redirectBase}?error=${encodeURIComponent(message)}`
    );
  }
}
