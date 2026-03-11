/**
 * Meeting store backed by Supabase.
 * All functions are async — use the hooks in @/hooks/use-meetings for React components.
 */

import { getSupabaseBrowser } from "@/lib/supabase/client";

export interface TranscriptVersion {
  id: string;
  createdAt: string;
  label: string;
  audioAnalysis: {
    isSilent: boolean;
    silencePercent: number;
    peakDb: number;
    recommendation: string;
  } | null;
  transcript: {
    text: string;
    language: string;
    duration: number;
    segments: { start: number; end: number; text: string }[];
  } | null;
  summary: string | null;
  keyPoints: string[];
  actionItems: { text: string; assignee: string | null; priority: string; completed?: boolean }[];
  decisions: { text: string; madeBy: string | null }[];
}

export interface Meeting {
  id: string;
  title: string;
  originalTitle?: string;
  s3Key: string;
  fileName: string;
  fileSize: number;
  duration: number | null;
  language: string;
  tags: string[];
  notes: string;
  createdAt: string;
  status: "uploading" | "processing" | "completed" | "failed" | "silent";
  processingStep?: "preparing" | "transcribing" | "summarizing";
  processingProgress?: string;
  processingPid?: string;
  errorMessage?: string;
  audioAnalysis: {
    isSilent: boolean;
    silencePercent: number;
    peakDb: number;
    recommendation: string;
  } | null;
  transcript: {
    text: string;
    language: string;
    duration: number;
    segments: { start: number; end: number; text: string }[];
  } | null;
  summary: string | null;
  keyPoints: string[];
  actionItems: { text: string; assignee: string | null; priority: string; completed?: boolean }[];
  decisions: { text: string; madeBy: string | null }[];
  transcriptVersions?: TranscriptVersion[];
}

// ─── Row → Meeting transform ───

/* eslint-disable @typescript-eslint/no-explicit-any */
function rowToMeeting(row: any): Meeting {
  const kp = row.meeting_key_points ?? [];
  const ai = row.meeting_action_items ?? [];
  const dec = row.meeting_decisions ?? [];
  const segs = row.transcript_segments ?? [];
  const vers = row.transcript_versions ?? [];

  const hasTranscript = row.transcript_text && row.transcript_text.length > 0;

  return {
    id: row.id,
    title: row.title,
    originalTitle: row.original_title || undefined,
    s3Key: row.s3_key || "",
    fileName: row.file_name || "",
    fileSize: Number(row.file_size) || 0,
    duration: row.duration != null ? Number(row.duration) : null,
    language: row.language || "en",
    tags: [],
    notes: row.notes || "",
    createdAt: row.created_at,
    status: row.status,
    processingStep: row.processing_step || undefined,
    processingProgress: row.processing_progress || undefined,
    processingPid: row.processing_pid || undefined,
    errorMessage: row.error_message || undefined,
    audioAnalysis: row.is_silent != null ? {
      isSilent: row.is_silent,
      silencePercent: Number(row.silence_percent) || 0,
      peakDb: Number(row.peak_db) || 0,
      recommendation: row.audio_recommendation || "",
    } : null,
    transcript: hasTranscript ? {
      text: row.transcript_text,
      language: row.language || "en",
      duration: Number(row.duration) || 0,
      segments: segs
        .sort((a: any, b: any) => (a.segment_index ?? 0) - (b.segment_index ?? 0))
        .map((s: any) => ({
          start: Number(s.start_time),
          end: Number(s.end_time),
          text: s.text,
        })),
    } : null,
    summary: row.summary || null,
    keyPoints: kp
      .sort((a: any, b: any) => (a.sort_order ?? 0) - (b.sort_order ?? 0))
      .map((k: any) => k.text),
    actionItems: ai
      .sort((a: any, b: any) => (a.sort_order ?? 0) - (b.sort_order ?? 0))
      .map((a: any) => ({
        text: a.text,
        assignee: a.assignee_name || null,
        priority: a.priority || "medium",
        completed: a.completed || false,
      })),
    decisions: dec
      .sort((a: any, b: any) => (a.sort_order ?? 0) - (b.sort_order ?? 0))
      .map((d: any) => ({
        text: d.text,
        madeBy: d.made_by_name || null,
      })),
    transcriptVersions: vers.length > 0 ? vers
      .sort((a: any, b: any) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime())
      .map((v: any) => ({
        id: v.id,
        createdAt: v.created_at,
        label: v.label,
        audioAnalysis: v.is_silent != null ? {
          isSilent: v.is_silent,
          silencePercent: Number(v.silence_percent) || 0,
          peakDb: Number(v.peak_db) || 0,
          recommendation: v.audio_recommendation || "",
        } : null,
        transcript: null,
        summary: v.summary || null,
        keyPoints: [],
        actionItems: [],
        decisions: [],
      })) : undefined,
  };
}
/* eslint-enable @typescript-eslint/no-explicit-any */

// ─── Queries ───

const LIST_SELECT = `
  *,
  meeting_key_points(id, text, sort_order),
  meeting_action_items(id, text, assignee_name, priority, completed, sort_order),
  meeting_decisions(id, text, made_by_name, sort_order)
`;

const DETAIL_SELECT = `
  *,
  meeting_key_points(id, text, sort_order),
  meeting_action_items(id, text, assignee_name, priority, completed, sort_order),
  meeting_decisions(id, text, made_by_name, sort_order),
  transcript_segments(id, segment_index, start_time, end_time, text, speaker),
  transcript_versions(id, label, summary, peak_db, is_silent, silence_percent, audio_recommendation, segment_count, created_at)
`;

/** Get all meetings for an organization, newest first */
export async function getMeetings(orgId: string): Promise<Meeting[]> {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const supabase = getSupabaseBrowser() as any;
  const { data, error } = await supabase
    .from("meetings")
    .select(LIST_SELECT)
    .eq("organization_id", orgId)
    .order("created_at", { ascending: false });

  if (error || !data) return [];
  return data.map(rowToMeeting);
}

/** Get a single meeting by ID with full details */
export async function getMeeting(id: string): Promise<Meeting | null> {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const supabase = getSupabaseBrowser() as any;
  const { data, error } = await supabase
    .from("meetings")
    .select(DETAIL_SELECT)
    .eq("id", id)
    .single();

  if (error || !data) return null;
  return rowToMeeting(data);
}

/** Create a new meeting */
export async function saveMeeting(
  meeting: Meeting,
  orgId: string,
  userId: string
): Promise<void> {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const supabase = getSupabaseBrowser() as any;
  await supabase.from("meetings").insert({
    id: meeting.id,
    organization_id: orgId,
    created_by: userId,
    title: meeting.title,
    original_title: meeting.originalTitle || null,
    s3_key: meeting.s3Key,
    file_name: meeting.fileName,
    file_size: meeting.fileSize,
    duration: meeting.duration,
    language: meeting.language,
    notes: meeting.notes,
    status: meeting.status,
    source: "upload",
  });
}

/** Partially update a meeting and its related data */
export async function updateMeeting(
  id: string,
  updates: Partial<Meeting>
): Promise<void> {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const supabase = getSupabaseBrowser() as any;

  // Build flat column updates for the meetings table
  const db: Record<string, unknown> = {};
  if (updates.title !== undefined) db.title = updates.title;
  if (updates.originalTitle !== undefined) db.original_title = updates.originalTitle ?? null;
  if (updates.status !== undefined) db.status = updates.status;
  if (updates.processingStep !== undefined) db.processing_step = updates.processingStep ?? null;
  if (updates.processingProgress !== undefined) db.processing_progress = updates.processingProgress ?? null;
  if (updates.processingPid !== undefined) db.processing_pid = updates.processingPid ?? null;
  if (updates.errorMessage !== undefined) db.error_message = updates.errorMessage ?? null;
  if (updates.duration !== undefined) db.duration = updates.duration;
  if (updates.summary !== undefined) db.summary = updates.summary;
  if (updates.notes !== undefined) db.notes = updates.notes;

  // Audio analysis → flat columns
  if (updates.audioAnalysis !== undefined) {
    if (updates.audioAnalysis) {
      db.is_silent = updates.audioAnalysis.isSilent;
      db.silence_percent = updates.audioAnalysis.silencePercent;
      db.peak_db = updates.audioAnalysis.peakDb;
      db.audio_recommendation = updates.audioAnalysis.recommendation;
    } else {
      db.is_silent = null;
      db.silence_percent = null;
      db.peak_db = null;
      db.audio_recommendation = null;
    }
  }

  // Transcript → text column + segments table
  if (updates.transcript !== undefined) {
    db.transcript_text = updates.transcript?.text ?? null;
    if (updates.transcript?.language) db.language = updates.transcript.language;
    if (updates.transcript?.duration != null) db.duration = updates.transcript.duration;
  }

  // Update meetings row
  if (Object.keys(db).length > 0) {
    await supabase.from("meetings").update(db).eq("id", id);
  }

  // Replace transcript segments
  if (updates.transcript?.segments) {
    await supabase
      .from("transcript_segments")
      .delete()
      .eq("meeting_id", id)
      .is("version_id", null);

    if (updates.transcript.segments.length > 0) {
      const rows = updates.transcript.segments.map((s, i) => ({
        meeting_id: id,
        segment_index: i,
        start_time: s.start,
        end_time: s.end,
        text: s.text,
      }));
      // Insert in batches of 500 to avoid payload limits
      for (let i = 0; i < rows.length; i += 500) {
        await supabase.from("transcript_segments").insert(rows.slice(i, i + 500));
      }
    }
  }

  // Replace key points
  if (updates.keyPoints !== undefined) {
    await supabase.from("meeting_key_points").delete().eq("meeting_id", id);
    if (updates.keyPoints.length > 0) {
      await supabase.from("meeting_key_points").insert(
        updates.keyPoints.map((text, i) => ({
          meeting_id: id,
          text,
          sort_order: i,
        }))
      );
    }
  }

  // Replace action items (needs org_id)
  if (updates.actionItems !== undefined) {
    const { data: meeting } = await supabase
      .from("meetings")
      .select("organization_id")
      .eq("id", id)
      .single();
    const orgId = meeting?.organization_id;

    await supabase.from("meeting_action_items").delete().eq("meeting_id", id);
    if (updates.actionItems.length > 0 && orgId) {
      await supabase.from("meeting_action_items").insert(
        updates.actionItems.map((a, i) => ({
          meeting_id: id,
          organization_id: orgId,
          text: a.text,
          assignee_name: a.assignee,
          priority: a.priority || "medium",
          completed: a.completed || false,
          sort_order: i,
        }))
      );
    }
  }

  // Replace decisions (needs org_id)
  if (updates.decisions !== undefined) {
    const { data: meeting } = await supabase
      .from("meetings")
      .select("organization_id")
      .eq("id", id)
      .single();
    const orgId = meeting?.organization_id;

    await supabase.from("meeting_decisions").delete().eq("meeting_id", id);
    if (updates.decisions.length > 0 && orgId) {
      await supabase.from("meeting_decisions").insert(
        updates.decisions.map((d, i) => ({
          meeting_id: id,
          organization_id: orgId,
          text: d.text,
          made_by_name: d.madeBy,
          sort_order: i,
        }))
      );
    }
  }
}

/** Delete a meeting and all related data (cascade handles children) */
export async function deleteMeeting(id: string): Promise<void> {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const supabase = getSupabaseBrowser() as any;
  await supabase.from("meetings").delete().eq("id", id);
}

/** Snapshot current transcript results as a version before reprocessing */
export async function snapshotTranscriptVersion(
  id: string,
  label: string
): Promise<void> {
  const meeting = await getMeeting(id);
  if (!meeting || !meeting.transcript) return;

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const supabase = getSupabaseBrowser() as any;

  // Create version record
  const { data: version } = await supabase
    .from("transcript_versions")
    .insert({
      meeting_id: id,
      label,
      summary: meeting.summary,
      peak_db: meeting.audioAnalysis?.peakDb ?? null,
      is_silent: meeting.audioAnalysis?.isSilent ?? null,
      silence_percent: meeting.audioAnalysis?.silencePercent ?? null,
      audio_recommendation: meeting.audioAnalysis?.recommendation ?? null,
      segment_count: meeting.transcript.segments.length,
    })
    .select("id")
    .single();

  if (!version) return;

  // Copy current segments to this version
  if (meeting.transcript.segments.length > 0) {
    const rows = meeting.transcript.segments.map((s, i) => ({
      meeting_id: id,
      version_id: version.id,
      segment_index: i,
      start_time: s.start,
      end_time: s.end,
      text: s.text,
    }));
    for (let i = 0; i < rows.length; i += 500) {
      await supabase.from("transcript_segments").insert(rows.slice(i, i + 500));
    }
  }
}

/** Restore a previous transcript version */
export async function restoreTranscriptVersion(
  meetingId: string,
  versionId: string
): Promise<void> {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const supabase = getSupabaseBrowser() as any;

  // Get version metadata
  const { data: version } = await supabase
    .from("transcript_versions")
    .select("*")
    .eq("id", versionId)
    .single();
  if (!version) return;

  // Get version's segments
  const { data: segments } = await supabase
    .from("transcript_segments")
    .select("*")
    .eq("version_id", versionId)
    .order("segment_index");

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const segs: { start: number; end: number; text: string }[] = (segments ?? []).map((s: any) => ({
    start: Number(s.start_time),
    end: Number(s.end_time),
    text: s.text as string,
  }));

  const fullText = segs.map((s) => s.text).join(" ");

  // Update meeting with version data
  await updateMeeting(meetingId, {
    status: "completed",
    audioAnalysis: version.is_silent != null ? {
      isSilent: version.is_silent,
      silencePercent: Number(version.silence_percent) || 0,
      peakDb: Number(version.peak_db) || 0,
      recommendation: version.audio_recommendation || "",
    } : null,
    transcript: fullText ? {
      text: fullText,
      language: "en",
      duration: 0,
      segments: segs,
    } : null,
    summary: version.summary,
  });
}
