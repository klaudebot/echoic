import { NextResponse } from "next/server";
import { requireAuth } from "@/lib/api-auth";
import { getSupabaseAdmin } from "@/lib/supabase/admin";

/**
 * GET /api/integrations/zoom/status
 *
 * Returns the Zoom integration status for the authenticated user's organization.
 */
export async function GET() {
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
        { connected: false, error: "No organization found" },
        { status: 200 }
      );
    }

    const orgId = membership.organization_id;

    // Check for Zoom integration
    const { data: integration, error: intError } = await admin
      .from("integrations")
      .select("id, enabled, config, created_at, updated_at, connected_by")
      .eq("organization_id", orgId)
      .eq("provider", "zoom")
      .limit(1)
      .single();

    if (intError || !integration) {
      return NextResponse.json({
        connected: false,
        provider: "zoom",
      });
    }

    return NextResponse.json({
      connected: true,
      enabled: integration.enabled,
      provider: "zoom",
      config: integration.config || {},
      connectedAt: integration.created_at,
      updatedAt: integration.updated_at,
      connectedBy: integration.connected_by,
    });
  } catch (err) {
    console.error("[zoom:status] Error:", err);
    return NextResponse.json(
      { error: "Failed to check Zoom status" },
      { status: 500 }
    );
  }
}
