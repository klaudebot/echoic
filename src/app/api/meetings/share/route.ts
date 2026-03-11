import { NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabase/admin";
import { getOpenAI } from "@/lib/openai";

export const maxDuration = 45;

/**
 * POST /api/meetings/share
 * Body: { meetingId: string, enable: boolean }
 *
 * Toggles public sharing for a meeting.
 * When enabling, fetches all meeting data via admin (bypasses RLS),
 * asks AI to censor PII, and stores the censored version in shared_content.
 */
export async function POST(request: Request) {
  try {
    const { meetingId, enable } = await request.json();

    if (!meetingId || typeof enable !== "boolean") {
      return NextResponse.json({ error: "Missing meetingId or enable" }, { status: 400 });
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const admin = getSupabaseAdmin() as any;

    if (!enable) {
      // Disable sharing
      await admin
        .from("meetings")
        .update({ is_public: false })
        .eq("id", meetingId);

      return NextResponse.json({ ok: true, isPublic: false });
    }

    // Fetch full meeting data with admin (bypasses RLS for child tables)
    const { data: meeting, error: meetingErr } = await admin
      .from("meetings")
      .select("*, meeting_key_points(*), meeting_action_items(*), meeting_decisions(*)")
      .eq("id", meetingId)
      .single();

    if (meetingErr || !meeting) {
      return NextResponse.json({ error: "Meeting not found" }, { status: 404 });
    }

    // Build the raw content to censor
    const keyPoints = (meeting.meeting_key_points || [])
      .sort((a: { sort_order: number }, b: { sort_order: number }) => (a.sort_order ?? 0) - (b.sort_order ?? 0))
      .map((k: { text: string }) => k.text);

    const actionItems = (meeting.meeting_action_items || [])
      .sort((a: { sort_order: number }, b: { sort_order: number }) => (a.sort_order ?? 0) - (b.sort_order ?? 0))
      .map((a: { text: string; assignee_name: string | null; priority: string }) => ({
        text: a.text,
        assignee: a.assignee_name || null,
        priority: a.priority || "medium",
      }));

    const decisions = (meeting.meeting_decisions || [])
      .sort((a: { sort_order: number }, b: { sort_order: number }) => (a.sort_order ?? 0) - (b.sort_order ?? 0))
      .map((d: { text: string; made_by_name: string | null }) => ({
        text: d.text,
        madeBy: d.made_by_name || null,
      }));

    const rawContent = {
      title: meeting.title,
      summary: meeting.summary || "",
      keyPoints,
      actionItems,
      decisions,
    };

    // Ask AI to censor PII
    const prompt = `You are a privacy assistant. Given the following meeting content, return a censored version with all personally identifiable information (PII) removed or replaced with generic placeholders.

Replace:
- Real names → generic roles like "Team Lead", "Developer", "Participant A", "Stakeholder"
- Email addresses → "[email removed]"
- Phone numbers → "[phone removed]"
- Company/organization names (if they seem internal) → "the team" or "the company"
- Addresses, account numbers, SSNs, or any other PII → "[redacted]"

Keep the content meaningful and readable. Preserve the structure exactly as JSON.

Input:
${JSON.stringify(rawContent, null, 2)}

Return ONLY valid JSON with the same structure: { title, summary, keyPoints, actionItems, decisions }
Action items should keep their structure: { text, assignee, priority }
Decisions should keep: { text, madeBy }`;

    const completion = await getOpenAI().chat.completions.create({
      model: "gpt-4o-mini",
      temperature: 0.2,
      max_tokens: 3000,
      messages: [
        { role: "system", content: "You are a privacy-focused assistant that censors PII from meeting content. Always return valid JSON." },
        { role: "user", content: prompt },
      ],
    });

    let censoredContent = rawContent; // fallback to raw if AI fails
    const aiText = completion.choices[0]?.message?.content ?? "";

    try {
      // Extract JSON from possible markdown code fences
      const jsonMatch = aiText.match(/```(?:json)?\s*([\s\S]*?)```/) || [null, aiText];
      censoredContent = JSON.parse(jsonMatch[1]!.trim());
    } catch {
      console.error("[share] Failed to parse AI censored content, using raw");
    }

    // Store censored content and enable sharing
    await admin
      .from("meetings")
      .update({
        is_public: true,
        shared_content: censoredContent,
      })
      .eq("id", meetingId);

    return NextResponse.json({
      ok: true,
      isPublic: true,
      shareToken: meeting.share_token,
    });
  } catch (err) {
    console.error("[share] Error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
