import { NextResponse } from "next/server";
import { requireAuth } from "@/lib/api-auth";
import { getSupabaseAdmin } from "@/lib/supabase/admin";
import { buildSlackOAuthURL } from "@/lib/integrations/slack";

/**
 * GET /api/integrations/slack/connect
 *
 * Starts the Slack OAuth flow. Redirects to Slack's authorization page.
 * Encodes the user's org_id in the state parameter.
 */
export async function GET() {
  try {
    const { user, error: authError } = await requireAuth();
    if (authError) return authError;

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const admin = getSupabaseAdmin() as any;

    const { data: membership } = await admin
      .from("organization_members")
      .select("organization_id")
      .eq("user_id", user!.id)
      .limit(1)
      .single();

    if (!membership) {
      return NextResponse.json({ error: "No organization found" }, { status: 400 });
    }

    // Encode org_id + user_id in state (base64 JSON)
    const state = Buffer.from(
      JSON.stringify({
        org_id: membership.organization_id,
        user_id: user!.id,
      })
    ).toString("base64url");

    const url = buildSlackOAuthURL(state);
    return NextResponse.redirect(url);
  } catch (err) {
    console.error("[slack/connect] error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
