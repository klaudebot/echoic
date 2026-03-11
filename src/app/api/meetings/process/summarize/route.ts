import { NextResponse } from "next/server";
import { getOpenAI } from "@/lib/openai";

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

export const maxDuration = 60;

/**
 * Stage 3: Summarize — Summarize transcript text with GPT-4o.
 */
export async function POST(request: Request) {
  const t0 = Date.now();
  const log = (msg: string) => console.log(`[summarize] ${msg} (+${Date.now() - t0}ms)`);

  try {
    const body = await request.json();
    const { text, title } = body;
    log(`START title="${title ?? "(none)"}" textLength=${text?.length ?? 0}`);

    if (!text || typeof text !== "string" || text.trim().length < 20) {
      log("SKIP: transcript too short");
      return NextResponse.json({
        summary: null,
        keyPoints: [],
        actionItems: [],
        decisions: [],
        note: "Transcript too short to summarize.",
      });
    }

    const userPrompt = title
      ? `Meeting Title: ${title}\n\nTranscript:\n${text}`
      : `Transcript:\n${text}`;

    log("Calling GPT-4o...");
    const completion = await getOpenAI().chat.completions.create({
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
        log(`GPT-4o response parsed: summary=${(parsed.summary as string)?.length ?? 0} chars, keyPoints=${(parsed.keyPoints as unknown[])?.length ?? 0}, actionItems=${(parsed.actionItems as unknown[])?.length ?? 0}, decisions=${(parsed.decisions as unknown[])?.length ?? 0}`);
      } catch {
        log("ERROR: failed to parse GPT-4o JSON response");
      }
    } else {
      log("WARNING: empty GPT-4o response");
    }

    log("DONE");
    return NextResponse.json({
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
    log(`ERROR: ${err}`);
    console.error("Summarize error:", err);
    const message = err instanceof Error ? err.message : "Summarization failed";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
