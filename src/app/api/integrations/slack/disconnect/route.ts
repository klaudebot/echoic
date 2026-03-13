import { NextResponse } from "next/server";
import { requireAuth } from "@/lib/api-auth";
import { getSupabaseAdmin } from "@/lib/supabase/admin";

/**
 * POST /api/integrations/slack/disconnect
 *
 * Removes the Slack integration for the user's organization.
 */
export async function POST() {
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

    const { error: dbError } = await admin
      .from("integrations")
      .delete()
      .eq("organization_id", membership.organization_id)
      .eq("provider", "slack");

    if (dbError) {
      console.error("[slack/disconnect] DB error:", dbError);
      return NextResponse.json({ error: "Failed to disconnect" }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("[slack/disconnect] error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
