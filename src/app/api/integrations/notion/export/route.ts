import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/api-auth";
import { getSupabaseAdmin } from "@/lib/supabase/admin";
import {
  createMeetingNotionPage,
  type MeetingExportData,
} from "@/lib/integrations/notion";

/**
 * POST /api/integrations/notion/export
 * Body: { meetingId: string, parentPageId?: string }
 *
 * Exports a meeting's data as a beautifully formatted Notion page.
 */
export async function POST(request: NextRequest) {
  const { user, error } = await requireAuth();
  if (error) return error;

  const body = await request.json().catch(() => null);
  if (!body?.meetingId) {
    return NextResponse.json(
      { error: "meetingId is required" },
      { status: 400 }
    );
  }

  const { meetingId, parentPageId } = body as {
    meetingId: string;
    parentPageId?: string;
  };

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

  const orgId = membership.organization_id;

  // Fetch the Notion integration
  const { data: integration } = await admin
    .from("integrations")
    .select("access_token, enabled")
    .eq("organization_id", orgId)
    .eq("provider", "notion")
    .single();

  if (!integration?.access_token || !integration.enabled) {
    return NextResponse.json(
      { error: "Notion is not connected" },
      { status: 404 }
    );
  }

  // Fetch meeting data — verify it belongs to the user's org
  const { data: meeting, error: meetingErr } = await admin
    .from("meetings")
    .select("id, title, summary, duration, created_at, organization_id")
    .eq("id", meetingId)
    .eq("organization_id", orgId)
    .single();

  if (meetingErr || !meeting) {
    return NextResponse.json(
      { error: "Meeting not found" },
      { status: 404 }
    );
  }

  // Fetch related data in parallel
  const [keyPointsRes, actionItemsRes, decisionsRes, participantsRes] =
    await Promise.all([
      admin
        .from("meeting_key_points")
        .select("text, sort_order")
        .eq("meeting_id", meetingId)
        .order("sort_order", { ascending: true }),
      admin
        .from("meeting_action_items")
        .select("text, assignee_name, priority, completed")
        .eq("meeting_id", meetingId)
        .order("sort_order", { ascending: true }),
      admin
        .from("meeting_decisions")
        .select("text, made_by_name, sort_order")
        .eq("meeting_id", meetingId)
        .order("sort_order", { ascending: true }),
      admin
        .from("meeting_participants")
        .select("name")
        .eq("meeting_id", meetingId),
    ]);

  const exportData: MeetingExportData = {
    id: meeting.id,
    title: meeting.title,
    summary: meeting.summary,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    keyPoints: (keyPointsRes.data ?? []).map((kp: any) => kp.text),
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    actionItems: (actionItemsRes.data ?? []).map((ai: any) => ({
      text: ai.text,
      assignee: ai.assignee_name,
      priority: ai.priority,
      completed: ai.completed,
    })),
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    decisions: (decisionsRes.data ?? []).map((d: any) => ({
      text: d.text,
      madeBy: d.made_by_name,
    })),
    duration: meeting.duration,
    createdAt: meeting.created_at,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    participants: (participantsRes.data ?? []).map((p: any) => p.name),
  };

  try {
    const result = await createMeetingNotionPage(
      integration.access_token,
      exportData,
      parentPageId
    );

    return NextResponse.json({
      success: true,
      url: result.url,
      pageId: result.pageId,
    });
  } catch (err) {
    console.error("[notion/export] Page creation error:", err);
    return NextResponse.json(
      {
        error:
          err instanceof Error
            ? err.message
            : "Failed to create Notion page",
      },
      { status: 502 }
    );
  }
}
