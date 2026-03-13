import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/api-auth";
import { getSupabaseAdmin } from "@/lib/supabase/admin";
import { searchNotionPages } from "@/lib/integrations/notion";

/**
 * GET /api/integrations/notion/pages?q=optional+search
 * Returns pages the Notion integration can access, for use as export targets.
 */
export async function GET(request: NextRequest) {
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

  // Fetch the Notion integration
  const { data: integration } = await admin
    .from("integrations")
    .select("access_token, enabled")
    .eq("organization_id", membership.organization_id)
    .eq("provider", "notion")
    .single();

  if (!integration?.access_token || !integration.enabled) {
    return NextResponse.json(
      { error: "Notion is not connected" },
      { status: 404 }
    );
  }

  const query = new URL(request.url).searchParams.get("q") ?? undefined;

  try {
    const pages = await searchNotionPages(integration.access_token, query);
    return NextResponse.json({ pages });
  } catch (err) {
    console.error("[notion/pages] Search error:", err);
    return NextResponse.json(
      { error: "Failed to search Notion pages" },
      { status: 502 }
    );
  }
}
