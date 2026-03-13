import { NextResponse } from "next/server";
import { requireAuth } from "@/lib/api-auth";
import { getSupabaseAdmin } from "@/lib/supabase/admin";
import { buildZoomOAuthUrl } from "@/lib/integrations/zoom";

/**
 * GET /api/integrations/zoom/connect
 *
 * Starts the Zoom OAuth flow. Requires authentication.
 * Looks up the user's organization, builds the OAuth URL, and redirects.
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
      console.error("[zoom:connect] No org membership found for user:", user!.id);
      return NextResponse.json(
        { error: "No organization found. Please join or create an organization first." },
        { status: 400 }
      );
    }

    const oauthUrl = buildZoomOAuthUrl(membership.organization_id);
    console.log(`[zoom:connect] Redirecting user ${user!.id} (org: ${membership.organization_id}) to Zoom OAuth`);

    return NextResponse.redirect(oauthUrl);
  } catch (err) {
    console.error("[zoom:connect] Error:", err);
    return NextResponse.json(
      { error: "Failed to start Zoom connection" },
      { status: 500 }
    );
  }
}
