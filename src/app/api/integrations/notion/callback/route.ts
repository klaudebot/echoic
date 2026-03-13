import { NextRequest, NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabase/admin";
import { exchangeNotionCode } from "@/lib/integrations/notion";

/**
 * GET /api/integrations/notion/callback
 * Handles the OAuth callback from Notion. Exchanges the code for an access token,
 * upserts the integration record, and redirects to /integrations.
 */
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const code = searchParams.get("code");
  const stateParam = searchParams.get("state");
  const errorParam = searchParams.get("error");

  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "";

  // Handle Notion denying the authorization
  if (errorParam) {
    console.error("[notion/callback] OAuth error:", errorParam);
    return NextResponse.redirect(
      `${appUrl}/integrations?error=notion_denied`
    );
  }

  if (!code || !stateParam) {
    return NextResponse.redirect(
      `${appUrl}/integrations?error=missing_params`
    );
  }

  // Decode state
  let orgId: string;
  let userId: string;
  try {
    const decoded = JSON.parse(
      Buffer.from(stateParam, "base64url").toString("utf-8")
    );
    orgId = decoded.org_id;
    userId = decoded.user_id;
    if (!orgId || !userId) throw new Error("Invalid state payload");
  } catch {
    return NextResponse.redirect(
      `${appUrl}/integrations?error=invalid_state`
    );
  }

  try {
    // Exchange the authorization code for tokens
    const token = await exchangeNotionCode(code);

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const admin = getSupabaseAdmin() as any;

    // Upsert the integration — one Notion connection per organization
    const { error: upsertError } = await admin
      .from("integrations")
      .upsert(
        {
          organization_id: orgId,
          provider: "notion",
          access_token: token.access_token,
          refresh_token: null, // Notion tokens don't expire / no refresh token
          token_expires_at: null,
          enabled: true,
          connected_by: userId,
          config: {
            workspace_id: token.workspace_id,
            workspace_name: token.workspace_name,
            workspace_icon: token.workspace_icon,
            bot_id: token.bot_id,
          },
        },
        { onConflict: "organization_id,provider" }
      );

    if (upsertError) {
      console.error("[notion/callback] Upsert error:", upsertError);
      return NextResponse.redirect(
        `${appUrl}/integrations?error=save_failed`
      );
    }

    return NextResponse.redirect(
      `${appUrl}/integrations?notion=connected`
    );
  } catch (err) {
    console.error("[notion/callback] Token exchange error:", err);
    return NextResponse.redirect(
      `${appUrl}/integrations?error=token_exchange_failed`
    );
  }
}
