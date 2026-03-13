import { NextResponse } from "next/server";
import { requireAuth } from "@/lib/api-auth";
import { getSupabaseAdmin } from "@/lib/supabase/admin";

/**
 * POST /api/integrations/notion/disconnect
 * Removes the Notion integration for the current user's organization.
 */
export async function POST() {
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

  const { error: deleteError } = await admin
    .from("integrations")
    .delete()
    .eq("organization_id", membership.organization_id)
    .eq("provider", "notion");

  if (deleteError) {
    console.error("[notion/disconnect] Delete error:", deleteError);
    return NextResponse.json(
      { error: "Failed to disconnect Notion" },
      { status: 500 }
    );
  }

  return NextResponse.json({ success: true });
}
