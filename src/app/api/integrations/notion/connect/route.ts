import { NextResponse } from "next/server";
import { requireAuth } from "@/lib/api-auth";
import { getSupabaseAdmin } from "@/lib/supabase/admin";
import { getNotionOAuthURL } from "@/lib/integrations/notion";

/**
 * GET /api/integrations/notion/connect
 * Starts the Notion OAuth flow. Redirects the user to Notion's authorization page.
 */
export async function GET() {
  const { user, error } = await requireAuth();
  if (error) return error;

  // Resolve the user's organization
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const admin = getSupabaseAdmin() as any;
  const { data: membership } = await admin
    .from("organization_members")
    .select("organization_id")
    .eq("user_id", user!.id)
    .order("joined_at", { ascending: true })
    .limit(1)
    .single();

  if (!membership) {
    return NextResponse.json(
      { error: "No organization found for user" },
      { status: 400 }
    );
  }

  // Encode org_id + user_id in the state param for the callback
  const state = Buffer.from(
    JSON.stringify({
      org_id: membership.organization_id,
      user_id: user!.id,
    })
  ).toString("base64url");

  const url = getNotionOAuthURL(state);
  return NextResponse.redirect(url);
}
