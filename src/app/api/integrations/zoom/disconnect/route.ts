import { NextResponse } from "next/server";
import { requireAuth } from "@/lib/api-auth";
import { getSupabaseAdmin } from "@/lib/supabase/admin";

/**
 * POST /api/integrations/zoom/disconnect
 *
 * Disconnects the Zoom integration for the authenticated user's organization.
 * Deletes the integration row from the database.
 */
export async function POST() {
  try {
    const { user, error: authError } = await requireAuth();
    if (authError) return authError;

    // Look up user's organization
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const admin = getSupabaseAdmin() as any;
    const { data: membership, error: membershipError } = await admin
      .from("organization_members")
      .select("organization_id")
      .eq("user_id", user!.id)
      .limit(1)
      .single();

    if (membershipError || !membership) {
      return NextResponse.json(
        { error: "No organization found" },
        { status: 400 }
      );
    }

    const orgId = membership.organization_id;

    // Delete the Zoom integration row
    const { error: deleteError } = await admin
      .from("integrations")
      .delete()
      .eq("organization_id", orgId)
      .eq("provider", "zoom");

    if (deleteError) {
      console.error("[zoom:disconnect] Delete failed:", deleteError);
      return NextResponse.json(
        { error: "Failed to disconnect Zoom" },
        { status: 500 }
      );
    }

    console.log(`[zoom:disconnect] Disconnected Zoom for org: ${orgId} by user: ${user!.id}`);

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("[zoom:disconnect] Error:", err);
    return NextResponse.json(
      { error: "Failed to disconnect Zoom" },
      { status: 500 }
    );
  }
}
