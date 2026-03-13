import { NextResponse } from "next/server";
import { requireAuth } from "@/lib/api-auth";
import { getSupabaseAdmin } from "@/lib/supabase/admin";

/**
 * GET /api/integrations/notion/status
 * Returns the current Notion connection status for the user's organization.
 */
export async function GET() {
  const { user, error } = await requireAuth();
  if (error) return error;

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const admin = getSupabaseAdmin() as any;

  // Resolve org
  const { data: membership } = await admin
    .from("organization_members")
    .select("organization_id")
    .eq("user_id", user!.id)
    .order("joined_at", { ascending: true })
    .limit(1)
    .single();

  if (!membership) {
    return NextResponse.json(
      { error: "No organization found" },
      { status: 400 }
    );
  }

  const { data: integration } = await admin
    .from("integrations")
    .select("enabled, config, connected_by, created_at")
    .eq("organization_id", membership.organization_id)
    .eq("provider", "notion")
    .single();

  if (!integration) {
    return NextResponse.json({
      connected: false,
      workspace_name: null,
    });
  }

  const config = integration.config as Record<string, unknown> | null;

  return NextResponse.json({
    connected: integration.enabled,
    workspace_name: config?.workspace_name ?? null,
    workspace_icon: config?.workspace_icon ?? null,
    connected_by: integration.connected_by,
    connected_at: integration.created_at,
  });
}
