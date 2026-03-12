/**
 * Client-side orchestrator for the staged processing pipeline.
 * Calls prepare → transcribe (per chunk) → summarize in sequence,
 * updating the Supabase meeting store after each step.
 */

import { getMeeting, updateMeeting, type Meeting } from "./meeting-store";
import {
  notifyTranscriptComplete,
  notifyProcessingFailed,
  notifySilentRecording,
} from "./notifications";

/** Active pipeline IDs in this browser tab */
const activePids = new Set<string>();

interface ChunkInfo {
  s3Key: string;
  index: number;
  startTime: number;
  duration: number;
}

interface PrepareResult {
  status: "prepared" | "silent";
  audioAnalysis: Meeting["audioAnalysis"];
  totalDuration: number;
  chunks: ChunkInfo[];
}

interface TranscribeResult {
  text: string;
  segments: { start: number; end: number; text: string }[];
  language?: string;
  duration?: number;
}

interface SummarizeResult {
  suggestedTitle: string | null;
  summary: string | null;
  keyPoints: string[];
  actionItems: { text: string; assignee: string | null; priority: string }[];
  decisions: { text: string; madeBy: string | null }[];
  note?: string;
}

export interface PipelineCallbacks {
  onStep?: (step: string, detail?: string) => void;
  onComplete?: (meeting: Partial<Meeting>) => void;
  onError?: (step: string, error: string) => void;
}

function generatePid(): string {
  return `pid-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 6)}`;
}

/**
 * Check if a meeting's pipeline is orphaned (no active tab owns it).
 */
export async function isPipelineOrphaned(meetingId: string): Promise<boolean> {
  const m = await getMeeting(meetingId);
  if (!m || m.status !== "processing") return false;
  if (m.processingPid && activePids.has(m.processingPid)) return false;
  return true;
}

/**
 * Run the full processing pipeline for a meeting.
 * Updates Supabase at each step. Safe to call on refresh.
 */
export async function runProcessingPipeline(
  meetingId: string,
  s3Key: string,
  title: string,
  userId: string,
  language?: string,
  callbacks?: PipelineCallbacks
): Promise<void> {
  const { onStep, onComplete, onError } = callbacks ?? {};
  const pid = generatePid();
  const t0 = Date.now();
  const log = (msg: string) => console.log(`[pipeline:${meetingId.slice(0, 8)}] ${msg} (+${Date.now() - t0}ms)`);

  activePids.add(pid);

  try {
    log(`START pid=${pid} s3Key=${s3Key} title="${title}"`);

    await updateMeeting(meetingId, {
      status: "processing",
      processingPid: pid,
      processingStep: "preparing",
      processingProgress: "Analyzing and compressing audio...",
    });

    // ─── Stage 1: Prepare ───
    log("Stage 1: Prepare — analyzing and compressing audio");
    onStep?.("preparing", "Analyzing and compressing audio...");

    const prepRes = await fetch("/api/meetings/process/prepare", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ s3Key }),
    });

    if (!prepRes.ok) {
      const err = await prepRes.json().catch(() => ({ error: `Prepare failed (${prepRes.status})` }));
      log(`Prepare FAILED: ${err.error}`);
      throw new StageError("preparing", err.error || "Audio preparation failed");
    }

    const prepData: PrepareResult = await prepRes.json();
    log(`Prepare done: status=${prepData.status} chunks=${prepData.chunks.length} duration=${prepData.totalDuration?.toFixed(1)}s peak=${prepData.audioAnalysis?.peakDb}dB`);

    if (prepData.status === "silent") {
      log("Recording is silent — aborting pipeline");
      await updateMeeting(meetingId, {
        status: "silent",
        audioAnalysis: prepData.audioAnalysis,
        processingStep: undefined,
        processingProgress: undefined,
        processingPid: undefined,
      });
      await notifySilentRecording(userId, title, meetingId);
      sendEmailNotification("processing-failed", meetingId, title, userId, undefined, "Recording appears to be mostly silence.");
      onComplete?.({ status: "silent", audioAnalysis: prepData.audioAnalysis });
      return;
    }

    await updateMeeting(meetingId, {
      audioAnalysis: prepData.audioAnalysis,
      processingStep: "transcribing",
      processingProgress: `Transcribing${prepData.chunks.length > 1 ? ` (0/${prepData.chunks.length} chunks)` : ""}...`,
    });

    // ─── Stage 2: Transcribe ───
    log(`Stage 2: Transcribe — ${prepData.chunks.length} chunk(s)`);
    onStep?.("transcribing", `Transcribing ${prepData.chunks.length} chunk(s)...`);

    const allText: string[] = [];
    const allSegments: { start: number; end: number; text: string }[] = [];
    let detectedLanguage: string | undefined;
    let totalDuration = prepData.totalDuration;

    for (let i = 0; i < prepData.chunks.length; i++) {
      const chunk = prepData.chunks[i];
      const progress = prepData.chunks.length > 1
        ? `Transcribing chunk ${i + 1}/${prepData.chunks.length}...`
        : "Transcribing audio...";

      log(`Transcribing chunk ${i + 1}/${prepData.chunks.length}: s3Key=${chunk.s3Key} startTime=${chunk.startTime}`);
      onStep?.("transcribing", progress);
      await updateMeeting(meetingId, { processingProgress: progress });

      const txRes = await fetch("/api/meetings/process/transcribe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          s3Key: chunk.s3Key,
          startTime: chunk.startTime,
          language,
        }),
      });

      if (!txRes.ok) {
        const err = await txRes.json().catch(() => ({ error: `Transcription failed (${txRes.status})` }));
        log(`Transcribe chunk ${i + 1} FAILED: ${err.error}`);
        throw new StageError("transcribing", `Chunk ${i + 1} failed: ${err.error || "Transcription failed"}`);
      }

      const txData: TranscribeResult = await txRes.json();
      log(`Chunk ${i + 1} done: ${txData.segments.length} segments, ${txData.text.length} chars`);
      allText.push(txData.text);
      allSegments.push(...txData.segments);

      if (i === 0 && txData.language) {
        detectedLanguage = txData.language;
      }
      if (txData.duration != null) {
        if (i === 0) totalDuration = txData.duration;
        else totalDuration = Math.max(totalDuration, chunk.startTime + (txData.duration ?? 0));
      }
    }

    const fullText = allText.join(" ");
    const transcript = {
      text: fullText,
      language: detectedLanguage ?? language ?? "en",
      duration: totalDuration,
      segments: allSegments,
    };

    log(`All chunks transcribed: ${allSegments.length} total segments, ${fullText.length} chars, duration=${totalDuration.toFixed(1)}s`);

    // Save transcript immediately
    await updateMeeting(meetingId, {
      transcript,
      duration: totalDuration,
      processingStep: "summarizing",
      processingProgress: "Generating summary and action items...",
    });

    // ─── Stage 3: Summarize ───
    log("Stage 3: Summarize — calling GPT-4o");
    onStep?.("summarizing", "Generating summary and action items...");

    const sumRes = await fetch("/api/meetings/process/summarize", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ text: fullText, title }),
    });

    if (!sumRes.ok) {
      const err = await sumRes.json().catch(() => ({ error: `Summarization failed (${sumRes.status})` }));
      log(`Summarize FAILED: ${err.error}`);
      throw new StageError("summarizing", err.error || "Summarization failed");
    }

    const sumData: SummarizeResult = await sumRes.json();
    const sugTitle = sumData.suggestedTitle || "(none)";
    const sumLen = sumData.summary?.length || 0;
    log(`Summarize done: suggestedTitle="${sugTitle}" summary=${sumLen} chars, keyPoints=${sumData.keyPoints.length}, actionItems=${sumData.actionItems.length}, decisions=${sumData.decisions.length}`);

    // ─── Done ───
    const aiTitle = sumData.suggestedTitle?.trim();
    const finalTitle = aiTitle && aiTitle.length > 2 ? aiTitle : title;

    const finalUpdates: Partial<Meeting> = {
      status: "completed",
      title: finalTitle,
      originalTitle: title,
      transcript,
      summary: sumData.summary,
      keyPoints: sumData.keyPoints,
      actionItems: sumData.actionItems,
      decisions: sumData.decisions,
      duration: totalDuration,
      processingStep: undefined,
      processingProgress: undefined,
      processingPid: undefined,
      errorMessage: undefined,
    };

    await updateMeeting(meetingId, finalUpdates);
    log(`PIPELINE COMPLETE — title="${finalTitle}" total time: ${((Date.now() - t0) / 1000).toFixed(1)}s`);

    // Track transcription usage (hours)
    trackTranscriptionUsage(totalDuration).catch((e) =>
      console.error("[pipeline] Usage tracking failed:", e)
    );

    await notifyTranscriptComplete(userId, finalTitle, meetingId);
    sendEmailNotification("transcript-ready", meetingId, finalTitle, userId, sumData.summary, undefined, sumData.actionItems.length, sumData.decisions.length);

    onComplete?.(finalUpdates);
  } catch (err) {
    const step = err instanceof StageError ? err.stage : "unknown";
    const message = err instanceof Error ? err.message : "Processing failed";
    log(`PIPELINE FAILED at stage=${step}: ${message}`);

    await updateMeeting(meetingId, {
      status: "failed",
      errorMessage: message,
      processingStep: undefined,
      processingProgress: undefined,
      processingPid: undefined,
    });

    await notifyProcessingFailed(userId, title, meetingId, message);
    sendEmailNotification("processing-failed", meetingId, title, userId, undefined, message);

    onError?.(step, message);
  } finally {
    activePids.delete(pid);
  }
}

class StageError extends Error {
  stage: string;
  constructor(stage: string, message: string) {
    super(message);
    this.stage = stage;
    this.name = "StageError";
  }
}

/** Increment org's transcription_hours_used after a successful transcription */
async function trackTranscriptionUsage(durationSeconds: number): Promise<void> {
  const hours = durationSeconds / 3600;
  if (hours <= 0) return;
  try {
    const { getSupabaseBrowser } = await import("@/lib/supabase/client");
    const supabase = getSupabaseBrowser();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: membership } = await (supabase as any)
      .from("organization_members")
      .select("organization_id")
      .eq("user_id", user.id)
      .limit(1)
      .single();

    if (!membership?.organization_id) return;

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: org } = await (supabase as any)
      .from("organizations")
      .select("transcription_hours_used")
      .eq("id", membership.organization_id)
      .single();

    const currentUsed = org?.transcription_hours_used ?? 0;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    await (supabase as any)
      .from("organizations")
      .update({ transcription_hours_used: Math.round((currentUsed + hours) * 100) / 100 })
      .eq("id", membership.organization_id);

    console.log(`[pipeline] Usage tracked: +${hours.toFixed(2)}hrs (total: ${(currentUsed + hours).toFixed(2)}hrs)`);
  } catch (e) {
    console.error("[pipeline] Usage tracking error:", e);
  }
}

/** Fire-and-forget email notification via the /api/notify route */
function sendEmailNotification(
  type: "transcript-ready" | "processing-failed",
  meetingId: string,
  meetingTitle: string,
  userId: string,
  summary?: string | null,
  errorMessage?: string,
  actionItemCount?: number,
  decisionCount?: number
): void {
  // Get user email from Supabase auth
  import("@/lib/supabase/client").then(({ getSupabaseBrowser }) => {
    const supabase = getSupabaseBrowser();
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (!user?.email) return;
      fetch("/api/notify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type,
          to: user.email,
          meetingTitle,
          meetingId,
          summary,
          errorMessage,
          actionItemCount,
          decisionCount,
        }),
      })
        .then((r) => { if (!r.ok) r.json().then((d) => console.error(`[pipeline] ${type} email failed:`, d)); })
        .catch((err) => console.error(`[pipeline] ${type} email error:`, err));
    });
  }).catch((err) => console.error("[pipeline] Email notification error:", err));
}
