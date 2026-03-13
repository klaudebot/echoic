"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import {
  Sparkles,
  Lightbulb,
  ListChecks,
  Gavel,
  Clock,
  Calendar,
  Loader2,
  ShieldCheck,
  ExternalLink,
} from "lucide-react";
import dynamic from "next/dynamic";

const CopyForAI = dynamic(() => import("@/components/CopyForAI"), {
  loading: () => null,
  ssr: false,
});
type MeetingContext = import("@/components/CopyForAI").MeetingContext;

interface SharedContent {
  title: string;
  summary: string;
  keyPoints: string[];
  actionItems: { text: string; assignee: string | null; priority: string }[];
  decisions: { text: string; madeBy: string | null }[];
}

interface SharedMeeting {
  id: string;
  title: string;
  createdAt: string;
  duration: number | null;
  content: SharedContent | null;
}

function formatDuration(seconds: number | null): string {
  if (seconds == null) return "--";
  const m = Math.floor(seconds / 60);
  const s = Math.round(seconds % 60);
  return m > 0 ? `${m}m ${s}s` : `${s}s`;
}

function formatDate(iso: string): string {
  try {
    return new Date(iso).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  } catch {
    return iso;
  }
}

function PriorityBadge({ priority }: { priority: string }) {
  const p = priority.toLowerCase();
  if (p === "high") {
    return <span className="px-2 py-0.5 text-[11px] font-medium rounded-md bg-brand-rose/10 text-brand-rose">High</span>;
  }
  if (p === "medium") {
    return <span className="px-2 py-0.5 text-[11px] font-medium rounded-md bg-brand-amber/10 text-brand-amber">Medium</span>;
  }
  return <span className="px-2 py-0.5 text-[11px] font-medium rounded-md bg-brand-emerald/10 text-brand-emerald">Low</span>;
}

export default function SharedMeetingPage() {
  const params = useParams();
  const token = params.token as string;
  const [meeting, setMeeting] = useState<SharedMeeting | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    // Set noindex meta tag
    const meta = document.createElement("meta");
    meta.name = "robots";
    meta.content = "noindex, nofollow";
    document.head.appendChild(meta);
    return () => { document.head.removeChild(meta); };
  }, []);

  useEffect(() => {
    if (!token) return;
    fetch(`/api/share/${token}`)
      .then((r) => {
        if (!r.ok) throw new Error("not found");
        return r.json();
      })
      .then((data) => {
        setMeeting(data);
        setLoading(false);
      })
      .catch(() => {
        setNotFound(true);
        setLoading(false);
      });
  }, [token]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="w-8 h-8 text-brand-orange animate-spin" />
      </div>
    );
  }

  if (notFound || !meeting || !meeting.content) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center max-w-md px-6">
          <div className="w-16 h-16 rounded-2xl bg-muted flex items-center justify-center mb-5 mx-auto">
            <ShieldCheck className="w-7 h-7 text-muted-foreground" />
          </div>
          <h1 className="font-heading text-2xl text-foreground mb-2">Meeting not available</h1>
          <p className="text-muted-foreground text-sm">
            This shared meeting link is no longer active or doesn&apos;t exist.
          </p>
        </div>
      </div>
    );
  }

  const { content } = meeting;

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-3xl mx-auto px-4 py-8 sm:py-12">
        {/* Privacy banner */}
        <div className="flex items-center gap-2 mb-6 px-3 py-2 bg-brand-emerald/5 border border-brand-emerald/20 rounded-lg text-xs text-brand-emerald">
          <ShieldCheck className="w-3.5 h-3.5 shrink-0" />
          <span>Personal information has been removed from this shared meeting summary.</span>
        </div>

        {/* Header */}
        <div className="mb-8">
          <div className="flex items-start justify-between gap-4">
            <div>
              <h1 className="font-heading text-3xl text-foreground mb-3">
                {content.title}
              </h1>
              <div className="flex flex-wrap items-center gap-3 text-sm text-muted-foreground">
                <span className="inline-flex items-center gap-1">
                  <Calendar className="w-3.5 h-3.5" />
                  {formatDate(meeting.createdAt)}
                </span>
                {meeting.duration && (
                  <span className="inline-flex items-center gap-1">
                    <Clock className="w-3.5 h-3.5" />
                    {formatDuration(meeting.duration)}
                  </span>
                )}
              </div>
            </div>
            <CopyForAI
              context={{
                title: content.title,
                date: formatDate(meeting.createdAt),
                summary: content.summary,
                keyPoints: content.keyPoints,
                actionItems: content.actionItems,
                decisions: content.decisions,
              }}
            />
          </div>
        </div>

        <div className="space-y-6">
          {/* Summary */}
          {content.summary && (
            <div className="bg-card border border-border rounded-xl overflow-hidden">
              <div className="flex items-center gap-2 p-5 border-b border-border">
                <Sparkles className="w-4 h-4 text-brand-orange" />
                <h2 className="font-heading text-lg text-foreground">Summary</h2>
              </div>
              <div className="p-5">
                <p className="text-sm text-muted-foreground leading-relaxed whitespace-pre-wrap">
                  {content.summary}
                </p>
              </div>
            </div>
          )}

          {/* Key Points */}
          {content.keyPoints.length > 0 && (
            <div className="bg-card border border-border rounded-xl p-6">
              <div className="flex items-center gap-2 mb-4">
                <Lightbulb className="w-4 h-4 text-brand-amber" />
                <h2 className="font-heading text-lg text-foreground">Key Points</h2>
              </div>
              <ul className="space-y-2">
                {content.keyPoints.map((point, i) => (
                  <li key={i} className="flex items-start gap-2 text-sm text-foreground">
                    <span className="w-1.5 h-1.5 rounded-full bg-brand-amber mt-1.5 shrink-0" />
                    {point}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Action Items */}
          {content.actionItems.length > 0 && (
            <div className="bg-card border border-border rounded-xl p-6">
              <div className="flex items-center gap-2 mb-4">
                <ListChecks className="w-4 h-4 text-brand-orange" />
                <h2 className="font-heading text-lg text-foreground">Action Items</h2>
              </div>
              <div className="space-y-3">
                {content.actionItems.map((item, i) => (
                  <div
                    key={i}
                    className="flex items-start justify-between gap-3 bg-muted/30 rounded-lg p-3"
                  >
                    <div className="flex-1 min-w-0">
                      <p className="text-sm text-foreground">{item.text}</p>
                      {item.assignee && (
                        <p className="text-xs text-muted-foreground mt-1">
                          {item.assignee}
                        </p>
                      )}
                    </div>
                    <PriorityBadge priority={item.priority} />
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Decisions */}
          {content.decisions.length > 0 && (
            <div className="bg-card border border-border rounded-xl p-6">
              <div className="flex items-center gap-2 mb-4">
                <Gavel className="w-4 h-4 text-brand-teal" />
                <h2 className="font-heading text-lg text-foreground">Decisions</h2>
              </div>
              <div className="space-y-3">
                {content.decisions.map((dec, i) => (
                  <div key={i} className="flex items-start gap-3 bg-muted/30 rounded-lg p-3">
                    <div className="flex-1 min-w-0">
                      <p className="text-sm text-foreground">{dec.text}</p>
                      {dec.madeBy && (
                        <p className="text-xs text-muted-foreground mt-1">
                          {dec.madeBy}
                        </p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="mt-12 pt-6 border-t border-border text-center">
          <p className="text-xs text-muted-foreground">
            Shared via{" "}
            <a
              href="/"
              className="text-brand-orange hover:underline inline-flex items-center gap-0.5"
            >
              Reverbic
              <ExternalLink className="w-3 h-3" />
            </a>
            {" "}&mdash; AI-powered meeting transcription &amp; insights
          </p>
        </div>
      </div>
    </div>
  );
}
