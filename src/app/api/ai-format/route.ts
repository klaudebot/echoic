import { NextResponse } from "next/server";
import { getOpenAI } from "@/lib/openai";

export const maxDuration = 30;

export async function POST(request: Request) {
  try {
    const { prompt } = await request.json();

    if (!prompt || typeof prompt !== "string") {
      return NextResponse.json({ error: "Missing prompt" }, { status: 400 });
    }

    const completion = await getOpenAI().chat.completions.create({
      model: "gpt-4o-mini",
      temperature: 0.4,
      max_tokens: 1500,
      messages: [
        {
          role: "system",
          content:
            "You are a professional meeting assistant. Transform the given meeting context into the requested format. Be concise, specific, and actionable. Output ONLY the formatted content — no preamble or explanation.",
        },
        { role: "user", content: prompt },
      ],
    });

    const text = completion.choices[0]?.message?.content ?? "";

    return NextResponse.json({ text });
  } catch (err) {
    console.error("[ai-format] Error:", err);
    const message = err instanceof Error ? err.message : "Format failed";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
