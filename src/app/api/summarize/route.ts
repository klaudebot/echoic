import { NextResponse } from "next/server";
import { openai } from "@/lib/openai";

const SYSTEM_PROMPT = `You are a professional meeting summarization assistant. Given a meeting transcript, produce a structured JSON analysis. Use a professional, concise business voice.

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
- actionItems: extract every follow-up task mentioned; infer priority from context (deadlines = high, nice-to-haves = low, everything else = medium); set assignee to null if no specific person is mentioned
- decisions: capture any explicit decisions or agreements; set madeBy to null if the decision-maker is unclear
- If the transcript is too short or unclear for a section, return an empty array for that section
- Do NOT invent information not present in the transcript`;

const MAX_TRANSCRIPT_LENGTH = 100_000; // ~25k tokens

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { transcript, meetingTitle } = body;

    if (!transcript || typeof transcript !== "string") {
      return NextResponse.json(
        { error: "Missing or invalid transcript" },
        { status: 400 }
      );
    }

    if (transcript.trim().length < 20) {
      return NextResponse.json(
        { error: "Transcript too short to summarize" },
        { status: 400 }
      );
    }

    const trimmedTranscript =
      transcript.length > MAX_TRANSCRIPT_LENGTH
        ? transcript.slice(0, MAX_TRANSCRIPT_LENGTH) +
          "\n\n[TRANSCRIPT TRUNCATED]"
        : transcript;

    const userPrompt = meetingTitle
      ? `Meeting Title: ${meetingTitle}\n\nTranscript:\n${trimmedTranscript}`
      : `Transcript:\n${trimmedTranscript}`;

    const completion = await openai.chat.completions.create({
      model: "gpt-4o",
      temperature: 0.3,
      response_format: { type: "json_object" },
      messages: [
        { role: "system", content: SYSTEM_PROMPT },
        { role: "user", content: userPrompt },
      ],
    });

    const content = completion.choices[0]?.message?.content;

    if (!content) {
      return NextResponse.json(
        { error: "Empty response from GPT-4o" },
        { status: 500 }
      );
    }

    let parsed;
    try {
      parsed = JSON.parse(content);
    } catch {
      return NextResponse.json(
        { error: "Failed to parse GPT-4o response as JSON" },
        { status: 500 }
      );
    }

    // Normalize the response shape
    const result = {
      summary: parsed.summary ?? "",
      keyPoints: Array.isArray(parsed.keyPoints) ? parsed.keyPoints : [],
      actionItems: Array.isArray(parsed.actionItems)
        ? parsed.actionItems.map(
            (item: { text?: string; assignee?: string; priority?: string }) => ({
              text: item.text ?? "",
              assignee: item.assignee ?? null,
              priority: item.priority ?? "medium",
            })
          )
        : [],
      decisions: Array.isArray(parsed.decisions)
        ? parsed.decisions.map(
            (item: { text?: string; madeBy?: string }) => ({
              text: item.text ?? "",
              madeBy: item.madeBy ?? null,
            })
          )
        : [],
      usage: {
        promptTokens: completion.usage?.prompt_tokens ?? 0,
        completionTokens: completion.usage?.completion_tokens ?? 0,
      },
    };

    return NextResponse.json(result);
  } catch (err: unknown) {
    console.error("Summarization error:", err);

    const message =
      err instanceof Error ? err.message : "Summarization failed";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
