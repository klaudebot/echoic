import { NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabase/admin";
import { exchangeSlackCode } from "@/lib/integrations/slack";

/**
 * GET /api/integrations/slack/callback
 *
 * OAuth callback from Slack. Exchanges the authorization code for a bot token
 * and upserts the integration record in Supabase.
 */
export async function GET(request: Request) {
  try {
    const url = new URL(request.url);
    const code = url.searchParams.get("code");
    const stateParam = url.searchParams.get("state");
    const errorParam = url.searchParams.get("error");

    const appUrl = process.env.NEXT_PUBLIC_APP_URL || "https://reverbic.ai";

    // Slack sends error param if user denies
    if (errorParam) {
      console.warn("[slack/callback] user denied:", errorParam);
      return NextResponse.redirect(`${appUrl}/integrations?error=slack_denied`);
    }

    if (!code || !stateParam) {
      return NextResponse.redirect(`${appUrl}/integrations?error=slack_missing_params`);
    }

    // Decode state
    let state: { org_id: string; user_id: string };
    try {
      state = JSON.parse(Buffer.from(stateParam, "base64url").toString("utf-8"));
    } catch {
      return NextResponse.redirect(`${appUrl}/integrations?error=slack_invalid_state`);
    }

    // Exchange code for token
    const tokenData = await exchangeSlackCode(code);

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const admin = getSupabaseAdmin() as any;

    // Upsert into integrations table (one Slack integration per org)
    const { error: dbError } = await admin
      .from("integrations")
      .upsert(
        {
          organization_id: state.org_id,
          provider: "slack",
          access_token: tokenData.access_token,
          refresh_token: null, // Slack bot tokens don't use refresh tokens
          token_expires_at: null,
          config: {
            team_id: tokenData.team.id,
            team_name: tokenData.team.name,
            bot_user_id: tokenData.bot_user_id,
            app_id: tokenData.app_id,
            authed_user_id: tokenData.authed_user.id,
            scope: tokenData.scope,
          },
          enabled: true,
          connected_by: state.user_id,
        },
        { onConflict: "organization_id,provider" }
      );

    if (dbError) {
      console.error("[slack/callback] DB upsert error:", dbError);
      return NextResponse.redirect(`${appUrl}/integrations?error=slack_save_failed`);
    }

    return NextResponse.redirect(`${appUrl}/integrations?slack=connected`);
  } catch (err) {
    console.error("[slack/callback] error:", err);
    const appUrl = process.env.NEXT_PUBLIC_APP_URL || "https://reverbic.ai";
    return NextResponse.redirect(`${appUrl}/integrations?error=slack_exchange_failed`);
  }
}
