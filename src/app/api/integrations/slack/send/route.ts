import { NextResponse } from "next/server";
import { requireAuth } from "@/lib/api-auth";
import { getSupabaseAdmin } from "@/lib/supabase/admin";
import { postMeetingSummary } from "@/lib/integrations/slack";

/**
 * POST /api/integrations/slack/send
 * Body: { meetingId: string, channelId: string }
 *
 * Fetches meeting data from Supabase and posts a formatted
 * Block Kit summary to the specified Slack channel.
 */
export async function POST(request: Request) {
  try {
    const { user, error: authError } = await requireAuth();
    if (authError) return authError;

    const { meetingId, channelId } = await request.json();

    if (!meetingId || !channelId) {
      return NextResponse.json(
        { error: "Missing meetingId or channelId" },
        { status: 400 }
      );
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const admin = getSupabaseAdmin() as any;

    // Get user's org
    const { data: membership } = await admin
      .from("organization_members")
      .select("organization_id")
      .eq("user_id", user!.id)
      .limit(1)
      .single();

    if (!membership) {
      return NextResponse.json({ error: "No organization found" }, { status: 400 });
    }

    const orgId = membership.organization_id;

    // Fetch the Slack integration
    const { data: integration } = await admin
      .from("integrations")
      .select("access_token")
      .eq("organization_id", orgId)
      .eq("provider", "slack")
      .eq("enabled", true)
      .single();

    if (!integration?.access_token) {
      return NextResponse.json({ error: "Slack not connected" }, { status: 404 });
    }

    // Fetch meeting data (verify it belongs to the user's org)
    const { data: meeting } = await admin
      .from("meetings")
      .select(
        `
        id, title, summary, organization_id,
        meeting_key_points(text, sort_order),
        meeting_action_items(text, assignee_name, priority, sort_order)
      `
      )
      .eq("id", meetingId)
      .eq("organization_id", orgId)
      .single();

    if (!meeting) {
      return NextResponse.json({ error: "Meeting not found" }, { status: 404 });
    }

    // Build structured payload
    const keyPoints = (meeting.meeting_key_points ?? [])
      .sort((a: { sort_order: number }, b: { sort_order: number }) => (a.sort_order ?? 0) - (b.sort_order ?? 0))
      .map((kp: { text: string }) => kp.text);

    const actionItems = (meeting.meeting_action_items ?? [])
      .sort((a: { sort_order: number }, b: { sort_order: number }) => (a.sort_order ?? 0) - (b.sort_order ?? 0))
      .map((ai: { text: string; assignee_name: string | null; priority: string }) => ({
        text: ai.text,
        assignee: ai.assignee_name,
        priority: ai.priority || "medium",
      }));

    const appUrl = process.env.NEXT_PUBLIC_APP_URL || "https://reverbic.ai";
    const meetingUrl = `${appUrl}/meetings/${meeting.id}`;

    const result = await postMeetingSummary(integration.access_token, channelId, {
      title: meeting.title,
      summary: meeting.summary,
      keyPoints,
      actionItems,
      meetingUrl,
    });

    if (!result.ok) {
      console.error("[slack/send] Slack API error:", result.error);
      return NextResponse.json(
        { error: `Slack error: ${result.error}` },
        { status: 502 }
      );
    }

    return NextResponse.json({ success: true, ts: result.ts });
  } catch (err) {
    console.error("[slack/send] error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
