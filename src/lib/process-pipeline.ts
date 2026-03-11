/**
 * Client-side orchestrator for the staged processing pipeline.
 * Calls prepare → transcribe (per chunk) → summarize in sequence,
 * updating the meeting store after each step.
 * Each API call is small enough to fit within serverless timeouts.
 */

import { updateMeeting, type Meeting } from "./meeting-store";

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

/**
 * Run the full processing pipeline for a meeting.
 * Updates localStorage meeting store at each step.
 */
export async function runProcessingPipeline(
  meetingId: string,
  s3Key: string,
  title: string,
  language?: string,
  callbacks?: PipelineCallbacks
): Promise<void> {
  const { onStep, onComplete, onError } = callbacks ?? {};
  const t0 = Date.now();
  const log = (msg: string) => console.log(`[pipeline:${meetingId.slice(0, 8)}] ${msg} (+${Date.now() - t0}ms)`);

  try {
    log(`START s3Key=${s3Key} title="${title}"`);

    // ─── Stage 1: Prepare ───
    log("Stage 1: Prepare — analyzing and compressing audio");
    onStep?.("preparing", "Analyzing and compressing audio...");
    updateMeeting(meetingId, {
      status: "processing",
      processingStep: "preparing",
      processingProgress: "Analyzing and compressing audio...",
    });

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
      updateMeeting(meetingId, {
        status: "silent",
        audioAnalysis: prepData.audioAnalysis,
        processingStep: undefined,
        processingProgress: undefined,
      });
      onComplete?.({ status: "silent", audioAnalysis: prepData.audioAnalysis });
      return;
    }

    // Save audio analysis immediately
    updateMeeting(meetingId, {
      audioAnalysis: prepData.audioAnalysis,
      processingStep: "transcribing",
      processingProgress: `Transcribing${prepData.chunks.length > 1 ? ` (0/${prepData.chunks.length} chunks)` : ""}...`,
    });

    // ─── Stage 2: Transcribe (per chunk) ───
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
      updateMeeting(meetingId, { processingProgress: progress });

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

      // Accumulate duration
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
    updateMeeting(meetingId, {
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
    log(`Summarize done: summary=${sumData.summary?.length ?? 0} chars, keyPoints=${sumData.keyPoints.length}, actionItems=${sumData.actionItems.length}, decisions=${sumData.decisions.length}`);

    // ─── Done ───
    const finalUpdates: Partial<Meeting> = {
      status: "completed",
      transcript,
      summary: sumData.summary,
      keyPoints: sumData.keyPoints,
      actionItems: sumData.actionItems,
      decisions: sumData.decisions,
      duration: totalDuration,
      processingStep: undefined,
      processingProgress: undefined,
      errorMessage: undefined,
    };

    updateMeeting(meetingId, finalUpdates);
    log(`PIPELINE COMPLETE — total time: ${((Date.now() - t0) / 1000).toFixed(1)}s`);
    onComplete?.(finalUpdates);
  } catch (err) {
    const step = err instanceof StageError ? err.stage : "unknown";
    const message = err instanceof Error ? err.message : "Processing failed";
    log(`PIPELINE FAILED at stage=${step}: ${message}`);

    updateMeeting(meetingId, {
      status: "failed",
      errorMessage: message,
      processingStep: undefined,
      processingProgress: undefined,
    });

    onError?.(step, message);
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
