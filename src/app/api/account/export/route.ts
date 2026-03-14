import { NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabase/admin";
import { requireAuth } from "@/lib/api-auth";

/**
 * POST /api/account/export — Export all user data as JSON.
 * Returns a JSON object with profile, meetings, transcripts, action items,
 * decisions, and settings.
 */
export async function POST() {
  const { user, error: authError } = await requireAuth();
  if (authError) return authError;

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const admin = getSupabaseAdmin() as any;

  // Get user's org
  const { data: membership } = await admin
    .from("organization_members")
    .select("organization_id, role")
    .eq("user_id", user!.id)
    .limit(1)
    .single();

  const orgId = membership?.organization_id;

  // Profile
  const { data: profile } = await admin
    .from("profiles")
    .select("*")
    .eq("id", user!.id)
    .single();

  // Organization
  const { data: org } = orgId
    ? await admin.from("organizations").select("name, slug, plan").eq("id", orgId).single()
    : { data: null };

  // Meetings (only those created by this user)
  const { data: meetings } = orgId
    ? await admin
        .from("meetings")
        .select("id, title, status, duration, language, created_at, summary, notes, transcript_text")
        .eq("organization_id", orgId)
        .eq("created_by", user!.id)
        .order("created_at", { ascending: false })
    : { data: [] };

  // Action items
  const { data: actionItems } = orgId
    ? await admin
        .from("meeting_action_items")
        .select("meeting_id, text, assignee_name, priority, completed")
        .eq("organization_id", orgId)
    : { data: [] };

  // Decisions
  const { data: decisions } = orgId
    ? await admin
        .from("meeting_decisions")
        .select("meeting_id, text, made_by_name")
        .eq("organization_id", orgId)
    : { data: [] };

  // Key points
  const { data: keyPoints } = orgId
    ? await admin
        .from("meeting_key_points")
        .select("meeting_id, text")
        .eq("organization_id", orgId)
    : { data: [] };

  const exportData = {
    exportedAt: new Date().toISOString(),
    profile: {
      id: profile?.id,
      email: profile?.email,
      fullName: profile?.full_name,
      timezone: profile?.timezone,
      createdAt: profile?.created_at,
    },
    organization: org ? { name: org.name, slug: org.slug, plan: org.plan } : null,
    meetings: (meetings ?? []).map((m: Record<string, unknown>) => ({
      id: m.id,
      title: m.title,
      status: m.status,
      duration: m.duration,
      language: m.language,
      createdAt: m.created_at,
      summary: m.summary,
      notes: m.notes,
      transcript: m.transcript_text,
      actionItems: (actionItems ?? [])
        .filter((ai: Record<string, unknown>) => ai.meeting_id === m.id)
        .map((ai: Record<string, unknown>) => ({ text: ai.text, assignee: ai.assignee_name, priority: ai.priority, completed: ai.completed })),
      decisions: (decisions ?? [])
        .filter((d: Record<string, unknown>) => d.meeting_id === m.id)
        .map((d: Record<string, unknown>) => ({ text: d.text, madeBy: d.made_by_name })),
      keyPoints: (keyPoints ?? [])
        .filter((k: Record<string, unknown>) => k.meeting_id === m.id)
        .map((k: Record<string, unknown>) => k.text),
    })),
  };

  return new NextResponse(JSON.stringify(exportData, null, 2), {
    headers: {
      "Content-Type": "application/json",
      "Content-Disposition": `attachment; filename="reverbic-export-${new Date().toISOString().split("T")[0]}.json"`,
    },
  });
}
