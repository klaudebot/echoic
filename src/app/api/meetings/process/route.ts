import { NextResponse } from "next/server";
import { S3Client, GetObjectCommand } from "@aws-sdk/client-s3";
import { openai } from "@/lib/openai";
import type { Readable } from "stream";

const s3Client = new S3Client({
  region: process.env.AWS_REGION ?? "us-east-1",
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID ?? "",
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY ?? "",
  },
});

const BUCKET = process.env.AWS_S3_BUCKET ?? "";
const MAX_FILE_SIZE = 25 * 1024 * 1024;
const SILENCE_THRESHOLD_PERCENT = 80;

const SUMMARIZE_SYSTEM_PROMPT = `You are a professional meeting summarization assistant. Given a meeting transcript, produce a structured JSON analysis. Use a professional, concise business voice.

Output ONLY valid JSON in this exact format:
{
  "summary": "2-3 paragraph professional summary of the meeting",
  "keyPoints": ["point 1", "point 2", ...],
  "actionItems": [
    { "text": "description", "assignee": "person name or null", "priority": "high|medium|low" }
  ],
  "decisions": [
    { "text": "what was decided", "madeBy": "person name or null" }
  ]
}

Rules:
- summary: 2-3 paragraphs capturing the purpose, discussion, and outcomes
- keyPoints: 3-8 concise bullet points of the most important topics discussed
- actionItems: extract every follow-up task; infer priority from context
- decisions: capture explicit decisions or agreements
- Do NOT invent information not in the transcript`;

async function streamToBuffer(stream: Readable): Promise<Buffer> {
  const chunks: Buffer[] = [];
  for await (const chunk of stream) {
    chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk));
  }
  return Buffer.concat(chunks);
}

function analyzeAudioLevels(buffer: Buffer): {
  isSilent: boolean;
  silencePercent: number;
  peakDb: number;
  recommendation: string;
} {
  if (buffer.length < 44) {
    return {
      isSilent: true,
      silencePercent: 100,
      peakDb: -Infinity,
      recommendation:
        "This recording appears to be blank. Check your microphone settings.",
    };
  }

  const sampleCount = Math.floor(buffer.length / 2);
  const silenceThreshold = 0.00316;
  let silentSamples = 0;
  let peak = 0;

  for (let i = 0; i < sampleCount; i++) {
    const sample = buffer.readInt16LE(i * 2);
    const normalized = Math.abs(sample) / 32768;
    if (normalized < silenceThreshold) silentSamples++;
    if (normalized > peak) peak = normalized;
  }

  const silencePercent =
    sampleCount > 0
      ? Math.round((silentSamples / sampleCount) * 10000) / 100
      : 100;
  const peakDb =
    peak > 0 ? Math.round(20 * Math.log10(peak) * 100) / 100 : -Infinity;

  let recommendation: string;
  if (silencePercent > SILENCE_THRESHOLD_PERCENT) {
    recommendation =
      "This recording appears to be blank. Check your microphone settings.";
  } else if (peakDb < -30) {
    recommendation =
      "Audio levels are low. Consider re-recording or using volume boost.";
  } else {
    recommendation = "Audio levels look good.";
  }

  return { isSilent: silencePercent > SILENCE_THRESHOLD_PERCENT, silencePercent, peakDb, recommendation };
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { s3Key, title, language } = body;

    if (!s3Key || typeof s3Key !== "string") {
      return NextResponse.json(
        { error: "Missing or invalid s3Key" },
        { status: 400 }
      );
    }

    // Step 1: Download audio from S3
    const getCommand = new GetObjectCommand({ Bucket: BUCKET, Key: s3Key });
    let s3Response;
    try {
      s3Response = await s3Client.send(getCommand);
    } catch (err: unknown) {
      const code = (err as { name?: string }).name;
      if (code === "NoSuchKey") {
        return NextResponse.json(
          { error: "Audio file not found in S3" },
          { status: 404 }
        );
      }
      throw err;
    }

    if (!s3Response.Body) {
      return NextResponse.json(
        { error: "Empty response from S3" },
        { status: 500 }
      );
    }

    const audioBuffer = await streamToBuffer(s3Response.Body as Readable);

    if (audioBuffer.length > MAX_FILE_SIZE) {
      return NextResponse.json(
        {
          error: `File too large (${Math.round(audioBuffer.length / 1024 / 1024)}MB). Maximum supported size is 25MB.`,
        },
        { status: 413 }
      );
    }

    // Step 2: Analyze audio for silence
    const audioAnalysis = analyzeAudioLevels(audioBuffer);

    if (audioAnalysis.isSilent) {
      return NextResponse.json({
        status: "silent",
        audioAnalysis,
        transcript: null,
        summary: null,
        keyPoints: null,
        actionItems: null,
        decisions: null,
      });
    }

    // Step 3: Transcribe with Whisper
    const ext = s3Key.split(".").pop()?.toLowerCase() ?? "webm";
    const filename = s3Key.split("/").pop() ?? `audio.${ext}`;
    const file = new File([new Uint8Array(audioBuffer)], filename, {
      type: `audio/${ext === "mp3" ? "mpeg" : ext}`,
    });

    const transcription = await openai.audio.transcriptions.create({
      file,
      model: "whisper-1",
      response_format: "verbose_json",
      ...(language ? { language } : {}),
    });

    const segments =
      (
        transcription as unknown as {
          segments?: { start: number; end: number; text: string }[];
        }
      ).segments?.map((seg) => ({
        start: seg.start,
        end: seg.end,
        text: seg.text.trim(),
      })) ?? [];

    const transcript = {
      text: transcription.text,
      language: (transcription as unknown as { language?: string }).language,
      duration: (transcription as unknown as { duration?: number }).duration,
      segments,
    };

    // Step 4: Summarize with GPT-4o
    if (!transcription.text || transcription.text.trim().length < 20) {
      return NextResponse.json({
        status: "completed",
        audioAnalysis,
        transcript,
        summary: null,
        keyPoints: [],
        actionItems: [],
        decisions: [],
        note: "Transcript too short to summarize.",
      });
    }

    const userPrompt = title
      ? `Meeting Title: ${title}\n\nTranscript:\n${transcription.text}`
      : `Transcript:\n${transcription.text}`;

    const completion = await openai.chat.completions.create({
      model: "gpt-4o",
      temperature: 0.3,
      response_format: { type: "json_object" },
      messages: [
        { role: "system", content: SUMMARIZE_SYSTEM_PROMPT },
        { role: "user", content: userPrompt },
      ],
    });

    const content = completion.choices[0]?.message?.content;
    let parsed: Record<string, unknown> = {};

    if (content) {
      try {
        parsed = JSON.parse(content);
      } catch {
        console.error("Failed to parse GPT-4o summary response");
      }
    }

    // Step 5: Return complete result
    return NextResponse.json({
      status: "completed",
      audioAnalysis,
      transcript,
      summary: parsed.summary ?? null,
      keyPoints: Array.isArray(parsed.keyPoints) ? parsed.keyPoints : [],
      actionItems: Array.isArray(parsed.actionItems)
        ? (parsed.actionItems as { text?: string; assignee?: string; priority?: string }[]).map((item) => ({
            text: item.text ?? "",
            assignee: item.assignee ?? null,
            priority: item.priority ?? "medium",
          }))
        : [],
      decisions: Array.isArray(parsed.decisions)
        ? (parsed.decisions as { text?: string; madeBy?: string }[]).map((item) => ({
            text: item.text ?? "",
            madeBy: item.madeBy ?? null,
          }))
        : [],
    });
  } catch (err: unknown) {
    console.error("Meeting processing error:", err);

    const message =
      err instanceof Error ? err.message : "Meeting processing failed";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
