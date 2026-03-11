"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import {
  Wand2,
  Copy,
  Check,
  ChevronDown,
  Code,
  Mail,
  FileText,
  MessageSquare,
  ListTodo,
  Loader2,
  Clipboard,
  Briefcase,
  Terminal,
} from "lucide-react";

// ─── Format presets ───

export interface MeetingContext {
  title: string;
  date: string;
  summary: string | null;
  keyPoints: string[];
  actionItems: { text: string; assignee: string | null; priority: string; completed?: boolean }[];
  decisions: { text: string; madeBy: string | null }[];
}

interface FormatPreset {
  id: string;
  label: string;
  description: string;
  icon: React.ElementType;
  buildPrompt: (ctx: MeetingContext) => string;
  needsAI: boolean;
}

function buildRawContext(ctx: MeetingContext): string {
  const lines: string[] = [];
  lines.push(`# ${ctx.title}`);
  lines.push(`Date: ${ctx.date}`);
  lines.push("");

  if (ctx.summary) {
    lines.push("## Summary");
    lines.push(ctx.summary);
    lines.push("");
  }

  if (ctx.keyPoints.length > 0) {
    lines.push("## Key Points");
    ctx.keyPoints.forEach((p) => lines.push(`- ${p}`));
    lines.push("");
  }

  if (ctx.actionItems.length > 0) {
    lines.push("## Action Items");
    ctx.actionItems.forEach((item) => {
      const parts = [`- [${item.completed ? "x" : " "}] ${item.text}`];
      if (item.priority) parts.push(`(${item.priority})`);
      if (item.assignee) parts.push(`→ ${item.assignee}`);
      lines.push(parts.join(" "));
    });
    lines.push("");
  }

  if (ctx.decisions.length > 0) {
    lines.push("## Decisions");
    ctx.decisions.forEach((dec) => {
      let line = `- ${dec.text}`;
      if (dec.madeBy) line += ` — ${dec.madeBy}`;
      lines.push(line);
    });
    lines.push("");
  }

  return lines.join("\n");
}

const presets: FormatPreset[] = [
  {
    id: "raw",
    label: "Copy as Markdown",
    description: "Raw meeting context — paste anywhere",
    icon: Clipboard,
    needsAI: false,
    buildPrompt: (ctx) => buildRawContext(ctx),
  },
  {
    id: "dev-tasks",
    label: "Dev Tasks",
    description: "GitHub issues, Linear tickets, or coding todos",
    icon: Terminal,
    needsAI: true,
    buildPrompt: (ctx) => {
      const raw = buildRawContext(ctx);
      return [
        "Transform this meeting context into a structured list of developer tasks. For each task:",
        "- Write a clear, actionable title",
        "- Add 1-2 sentence description with acceptance criteria",
        "- Tag with priority (P0/P1/P2) and rough effort estimate (S/M/L)",
        "- Group by assignee when possible",
        "",
        "Format as markdown task list. Be specific and technical. If the action items reference code, APIs, or systems, include those details.",
        "",
        "Meeting context:",
        "---",
        raw,
      ].join("\n");
    },
  },
  {
    id: "email-recap",
    label: "Email Recap",
    description: "Professional follow-up email to share with attendees",
    icon: Mail,
    needsAI: true,
    buildPrompt: (ctx) => {
      const raw = buildRawContext(ctx);
      return [
        "Write a professional, concise follow-up email summarizing this meeting. Include:",
        "- Brief 2-3 sentence summary of what was discussed",
        "- Bulleted list of decisions made",
        "- Bulleted list of action items with owners",
        "- Next steps or follow-up date if mentioned",
        "",
        "Tone: professional but warm. Keep it under 200 words. Start with 'Hi team,' and end with a forward-looking closing.",
        "",
        "Meeting context:",
        "---",
        raw,
      ].join("\n");
    },
  },
  {
    id: "exec-brief",
    label: "Executive Brief",
    description: "TL;DR for leadership — decisions and impact only",
    icon: Briefcase,
    needsAI: true,
    buildPrompt: (ctx) => {
      const raw = buildRawContext(ctx);
      return [
        "Distill this meeting into an executive brief. Focus on:",
        "- One-liner: what was this meeting about (max 15 words)",
        "- Decisions made and their business impact",
        "- Key risks or blockers raised",
        "- Resource/budget commitments",
        "- Timeline changes",
        "",
        "Skip tactical details. Use bullet points. Keep it under 100 words. Executives will scan this in 30 seconds.",
        "",
        "Meeting context:",
        "---",
        raw,
      ].join("\n");
    },
  },
  {
    id: "doc-draft",
    label: "Document Draft",
    description: "Spec, proposal, or plan seeded from meeting outcomes",
    icon: FileText,
    needsAI: true,
    buildPrompt: (ctx) => {
      const raw = buildRawContext(ctx);
      return [
        "Using this meeting context, create a structured document draft. Infer the appropriate document type from the meeting content (could be a project spec, proposal, plan, RFC, or design doc). Include:",
        "- Title and purpose",
        "- Background/context section",
        "- Requirements or deliverables (from action items and decisions)",
        "- Timeline and ownership",
        "- Open questions or risks",
        "",
        "Write in a professional tone suitable for sharing with stakeholders. Use markdown formatting with headers, bullets, and bold for emphasis.",
        "",
        "Meeting context:",
        "---",
        raw,
      ].join("\n");
    },
  },
  {
    id: "standup",
    label: "Standup Update",
    description: "Quick yesterday/today/blockers from the meeting",
    icon: MessageSquare,
    needsAI: true,
    buildPrompt: (ctx) => {
      const raw = buildRawContext(ctx);
      return [
        "Convert this meeting context into a standup-style update. Format:",
        "",
        "**Discussed:**",
        "- (key topics from the meeting, 2-4 bullets)",
        "",
        "**Decided:**",
        "- (decisions made, 1-3 bullets)",
        "",
        "**Next:**",
        "- (action items and next steps, 2-4 bullets with owners)",
        "",
        "**Blockers:**",
        "- (any blockers or risks mentioned, or 'None')",
        "",
        "Keep each bullet under 15 words. This should be pasteable into Slack/Teams.",
        "",
        "Meeting context:",
        "---",
        raw,
      ].join("\n");
    },
  },
];

// ─── Component ───

export default function CopyForAI({ context }: { context: MeetingContext }) {
  const [open, setOpen] = useState(false);
  const [copied, setCopied] = useState<string | null>(null);
  const [loading, setLoading] = useState<string | null>(null);
  const [preview, setPreview] = useState<{ id: string; text: string } | null>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  // Close on outside click
  useEffect(() => {
    if (!open) return;
    function handleClick(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [open]);

  const copyToClipboard = useCallback(async (text: string, id: string) => {
    await navigator.clipboard.writeText(text);
    setCopied(id);
    setTimeout(() => setCopied(null), 2000);
  }, []);

  async function handlePresetClick(preset: FormatPreset) {
    if (!preset.needsAI) {
      // Direct copy, no AI needed
      const text = preset.buildPrompt(context);
      await copyToClipboard(text, preset.id);
      setOpen(false);
      return;
    }

    // AI-powered: generate the formatted text
    setLoading(preset.id);
    try {
      const prompt = preset.buildPrompt(context);
      const response = await fetch("/api/ai-format", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt }),
      });

      if (!response.ok) throw new Error("Format request failed");
      const { text } = await response.json();

      setPreview({ id: preset.id, text });
      setOpen(false);
    } catch (err) {
      console.error("AI format error:", err);
      // Fallback: copy the raw prompt so user can paste it into their AI tool directly
      const fallback = preset.buildPrompt(context);
      await copyToClipboard(fallback, preset.id);
      setOpen(false);
    } finally {
      setLoading(null);
    }
  }

  return (
    <>
      <div className="relative" ref={menuRef}>
        <button
          onClick={() => { setOpen(!open); setPreview(null); }}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg bg-gradient-to-r from-brand-violet to-brand-cyan text-white hover:opacity-90 transition-opacity"
        >
          <Wand2 className="w-3.5 h-3.5" />
          Copy for AI
          <ChevronDown className={`w-3 h-3 transition-transform ${open ? "rotate-180" : ""}`} />
        </button>

        {open && (
          <>
            <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />
            <div className="absolute right-0 top-full mt-2 z-50 w-80 bg-card border border-border rounded-xl shadow-xl overflow-hidden">
              <div className="px-4 py-3 border-b border-border bg-muted/30">
                <p className="text-xs font-semibold text-foreground">Copy for AI</p>
                <p className="text-[11px] text-muted-foreground mt-0.5">
                  Transform meeting insights for your workflow
                </p>
              </div>
              <div className="py-1 max-h-[360px] overflow-y-auto">
                {presets.map((preset) => {
                  const Icon = preset.icon;
                  const isLoading = loading === preset.id;
                  const isCopied = copied === preset.id;

                  return (
                    <button
                      key={preset.id}
                      onClick={() => handlePresetClick(preset)}
                      disabled={isLoading}
                      className="w-full flex items-start gap-3 px-4 py-2.5 text-left hover:bg-muted/50 transition-colors disabled:opacity-60"
                    >
                      <div className="w-7 h-7 rounded-md bg-brand-violet/10 flex items-center justify-center shrink-0 mt-0.5">
                        {isLoading ? (
                          <Loader2 className="w-3.5 h-3.5 text-brand-violet animate-spin" />
                        ) : isCopied ? (
                          <Check className="w-3.5 h-3.5 text-brand-emerald" />
                        ) : (
                          <Icon className="w-3.5 h-3.5 text-brand-violet" />
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-1.5">
                          <span className="text-sm font-medium text-foreground">
                            {preset.label}
                          </span>
                          {preset.needsAI && (
                            <span className="px-1.5 py-0.5 text-[9px] font-semibold rounded bg-brand-violet/10 text-brand-violet leading-none">
                              AI
                            </span>
                          )}
                        </div>
                        <p className="text-[11px] text-muted-foreground mt-0.5 leading-tight">
                          {preset.description}
                        </p>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          </>
        )}
      </div>

      {/* Preview modal for AI-generated output */}
      {preview && (
        <>
          <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm" onClick={() => setPreview(null)} />
          <div className="fixed inset-4 sm:inset-auto sm:left-1/2 sm:top-1/2 sm:-translate-x-1/2 sm:-translate-y-1/2 sm:w-full sm:max-w-2xl sm:max-h-[80vh] z-50 bg-card border border-border rounded-2xl shadow-2xl flex flex-col overflow-hidden">
            {/* Modal header */}
            <div className="flex items-center justify-between px-5 py-4 border-b border-border shrink-0">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-brand-violet to-brand-cyan flex items-center justify-center">
                  <Wand2 className="w-3.5 h-3.5 text-white" />
                </div>
                <div>
                  <h3 className="text-sm font-semibold text-foreground">
                    {presets.find((p) => p.id === preview.id)?.label}
                  </h3>
                  <p className="text-[11px] text-muted-foreground">AI-generated — review and copy</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={async () => {
                    await copyToClipboard(preview.text, "preview");
                  }}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg bg-brand-violet text-white hover:bg-brand-violet/90 transition-colors"
                >
                  {copied === "preview" ? (
                    <>
                      <Check className="w-3.5 h-3.5" />
                      Copied!
                    </>
                  ) : (
                    <>
                      <Copy className="w-3.5 h-3.5" />
                      Copy to Clipboard
                    </>
                  )}
                </button>
                <button
                  onClick={() => setPreview(null)}
                  className="p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
                >
                  ✕
                </button>
              </div>
            </div>

            {/* Modal body */}
            <div className="flex-1 overflow-y-auto p-5">
              <pre className="text-sm text-foreground whitespace-pre-wrap font-sans leading-relaxed">
                {preview.text}
              </pre>
            </div>

            {/* Modal footer */}
            <div className="px-5 py-3 border-t border-border bg-muted/30 shrink-0">
              <p className="text-[11px] text-muted-foreground text-center">
                Paste into ChatGPT, Claude, Codex, or any AI tool — the context is optimized for follow-up prompting
              </p>
            </div>
          </div>
        </>
      )}
    </>
  );
}
