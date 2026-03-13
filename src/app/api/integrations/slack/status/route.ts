import { NextResponse } from "next/server";
import { requireAuth } from "@/lib/api-auth";
import { getSupabaseAdmin } from "@/lib/supabase/admin";

/**
 * GET /api/integrations/slack/status
 *
 * Returns whether Slack is connected for the user's organization,
 * along with the team name if connected.
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
      .select("enabled, config")
      .eq("organization_id", membership.organization_id)
      .eq("provider", "slack")
      .single();

    if (!integration) {
      return NextResponse.json({ connected: false });
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const config = integration.config as any;

    return NextResponse.json({
      connected: integration.enabled,
      teamName: config?.team_name ?? null,
      teamId: config?.team_id ?? null,
    });
  } catch (err) {
    console.error("[slack/status] error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
