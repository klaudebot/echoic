import { NextResponse } from "next/server";
import { requireAuth } from "@/lib/api-auth";
import { getSupabaseAdmin } from "@/lib/supabase/admin";
import { listSlackChannels } from "@/lib/integrations/slack";

/**
 * GET /api/integrations/slack/channels
 *
 * Returns the list of Slack channels the bot can access,
 * using the stored bot token for the user's organization.
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

    const { data: integration } = await admin
      .from("integrations")
      .select("access_token")
      .eq("organization_id", membership.organization_id)
      .eq("provider", "slack")
      .eq("enabled", true)
      .single();

    if (!integration?.access_token) {
      return NextResponse.json({ error: "Slack not connected" }, { status: 404 });
    }

    const channels = await listSlackChannels(integration.access_token);

    return NextResponse.json({ channels });
  } catch (err) {
    console.error("[slack/channels] error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
