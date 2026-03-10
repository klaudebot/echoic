"use client";

import { useState, useMemo } from "react";
import { useParams } from "next/navigation";
import { AppLink } from "@/components/DemoContext";
import { demoMeetings, demoSmartClips } from "@/lib/demo-data";
import { formatDuration, formatDate, formatTime } from "@/lib/utils";
import {
  ArrowLeft,
  Calendar,
  Clock,
  Video,
  Users,
  MessageSquare,
  ListChecks,
  Lightbulb,
  Scissors,
  CheckCircle2,
  Circle,
  AlertCircle,
  Search,
  ChevronRight,
  Tag,
  FolderOpen,
  Sparkles,
} from "lucide-react";

const platformConfig: Record<string, { color: string; bg: string; label: string }> = {
  zoom: { color: "text-blue-600", bg: "bg-blue-50 border-blue-200", label: "Zoom" },
  google_meet: { color: "text-green-600", bg: "bg-green-50 border-green-200", label: "Google Meet" },
  teams: { color: "text-purple-600", bg: "bg-purple-50 border-purple-200", label: "Teams" },
  upload: { color: "text-gray-600", bg: "bg-gray-50 border-gray-200", label: "Upload" },
  recording: { color: "text-brand-rose", bg: "bg-red-50 border-red-200", label: "Recording" },
};

const priorityColors: Record<string, string> = {
  high: "bg-red-50 text-red-600 border-red-200",
  medium: "bg-amber-50 text-amber-600 border-amber-200",
  low: "bg-gray-50 text-gray-500 border-gray-200",
};

const statusConfig: Record<string, { icon: React.ElementType; color: string }> = {
  pending: { icon: Circle, color: "text-muted-foreground" },
  in_progress: { icon: AlertCircle, color: "text-brand-amber" },
  completed: { icon: CheckCircle2, color: "text-brand-emerald" },
  overdue: { icon: AlertCircle, color: "text-brand-rose" },
};

const clipTypeColors: Record<string, string> = {
  decision: "bg-brand-violet/10 text-brand-violet",
  action_item: "bg-brand-emerald/10 text-brand-emerald",
  highlight: "bg-brand-amber/10 text-brand-amber",
  question: "bg-brand-cyan/10 text-brand-cyan",
  insight: "bg-blue-50 text-blue-600",
};

type TabId = "summary" | "transcript" | "actions" | "decisions" | "clips";

const tabs: { id: TabId; label: string; icon: React.ElementType }[] = [
  { id: "summary", label: "Summary", icon: Sparkles },
  { id: "transcript", label: "Transcript", icon: MessageSquare },
  { id: "actions", label: "Action Items", icon: ListChecks },
  { id: "decisions", label: "Decisions", icon: Lightbulb },
  { id: "clips", label: "Clips", icon: Scissors },
];

function formatTimestamp(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m}:${s.toString().padStart(2, "0")}`;
}

export default function MeetingDetailPage() {
  const params = useParams();
  const id = params.id as string;
  const meeting = demoMeetings.find((m) => m.id === id);
  const [activeTab, setActiveTab] = useState<TabId>("summary");
  const [transcriptSearch, setTranscriptSearch] = useState("");

  const meetingClips = useMemo(
    () => demoSmartClips.filter((c) => c.meetingId === id),
    [id]
  );

  const filteredTranscript = useMemo(() => {
    if (!meeting?.transcript) return [];
    if (!transcriptSearch) return meeting.transcript;
    return meeting.transcript.filter((seg) =>
      seg.text.toLowerCase().includes(transcriptSearch.toLowerCase()) ||
      seg.speaker.toLowerCase().includes(transcriptSearch.toLowerCase())
    );
  }, [meeting?.transcript, transcriptSearch]);

  if (!meeting) {
    return (
      <div className="flex flex-col items-center justify-center py-24 text-center">
        <h2 className="font-heading text-2xl text-foreground mb-2">Meeting not found</h2>
        <p className="text-muted-foreground text-sm mb-4">The meeting you are looking for does not exist.</p>
        <AppLink href="/meetings" className="text-sm text-brand-violet hover:underline flex items-center gap-1">
          <ArrowLeft className="w-4 h-4" /> Back to Meetings
        </AppLink>
      </div>
    );
  }

  const platform = platformConfig[meeting.platform];
  const totalTalkTime = meeting.participants.reduce((s, p) => s + p.talkTime, 0);

  // Speaker color map
  const speakerColors = [
    "bg-brand-violet text-white",
    "bg-brand-cyan text-white",
    "bg-brand-emerald text-white",
    "bg-brand-amber text-white",
    "bg-brand-rose text-white",
    "bg-brand-slate text-white",
  ];
  const speakerColorMap: Record<string, string> = {};
  meeting.participants.forEach((p, i) => {
    speakerColorMap[p.name] = speakerColors[i % speakerColors.length];
  });

  return (
    <div className="space-y-6">
      {/* Back link */}
      <AppLink href="/meetings" className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors">
        <ArrowLeft className="w-4 h-4" /> Back to Meetings
      </AppLink>

      {/* Header */}
      <div className="bg-card border border-border rounded-xl p-5">
        <div className="flex flex-col sm:flex-row sm:items-start gap-4">
          <div className="flex-1 min-w-0">
            <div className="flex flex-wrap items-center gap-2 mb-2">
              <span className={`text-[11px] px-2 py-0.5 rounded-md font-medium border ${platform.bg} ${platform.color}`}>
                {platform.label}
              </span>
              {meeting.folder && (
                <span className="text-[11px] px-2 py-0.5 rounded-md font-medium bg-muted text-muted-foreground flex items-center gap-1">
                  <FolderOpen className="w-3 h-3" /> {meeting.folder}
                </span>
              )}
            </div>
            <h1 className="font-heading text-2xl sm:text-3xl text-foreground">{meeting.title}</h1>
            <div className="flex flex-wrap items-center gap-x-4 gap-y-1 mt-2">
              <span className="flex items-center gap-1.5 text-sm text-muted-foreground">
                <Calendar className="w-4 h-4" />
                {formatDate(meeting.date)} at {formatTime(meeting.date)}
              </span>
              <span className="flex items-center gap-1.5 text-sm text-muted-foreground">
                <Clock className="w-4 h-4" />
                {formatDuration(meeting.duration)}
              </span>
              <span className="flex items-center gap-1.5 text-sm text-muted-foreground">
                <Users className="w-4 h-4" />
                {meeting.participants.length} participants
              </span>
            </div>
            {/* Tags */}
            <div className="flex flex-wrap gap-1.5 mt-3">
              {meeting.tags.map((tag) => (
                <span key={tag} className="flex items-center gap-1 text-[11px] px-2 py-0.5 rounded-full bg-brand-violet/5 text-brand-violet border border-brand-violet/10">
                  <Tag className="w-2.5 h-2.5" /> {tag}
                </span>
              ))}
            </div>
          </div>
          {/* Participant avatars */}
          <div className="flex -space-x-2 shrink-0">
            {meeting.participants.slice(0, 5).map((p, i) => (
              <div
                key={p.name}
                className={`w-9 h-9 rounded-full flex items-center justify-center text-xs font-medium border-2 border-card ${speakerColorMap[p.name]}`}
                title={p.name}
              >
                {p.name === "You" ? "Y" : p.name.split(" ").map((n) => n[0]).join("").slice(0, 2)}
              </div>
            ))}
            {meeting.participants.length > 5 && (
              <div className="w-9 h-9 rounded-full bg-muted flex items-center justify-center text-xs font-medium text-muted-foreground border-2 border-card">
                +{meeting.participants.length - 5}
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="flex flex-col lg:flex-row gap-6">
        {/* Main content */}
        <div className="flex-1 min-w-0">
          {/* Tabs */}
          <div className="flex gap-1 bg-card border border-border rounded-xl p-1 mb-4 overflow-x-auto">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              const active = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center gap-1.5 px-3 py-2 text-sm rounded-lg whitespace-nowrap transition-colors ${
                    active
                      ? "bg-brand-violet text-white font-medium"
                      : "text-muted-foreground hover:text-foreground hover:bg-muted"
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  {tab.label}
                  {tab.id === "actions" && meeting.actionItems && (
                    <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-semibold ${
                      active ? "bg-white/20" : "bg-brand-violet/10 text-brand-violet"
                    }`}>
                      {meeting.actionItems.length}
                    </span>
                  )}
                </button>
              );
            })}
          </div>

          {/* Tab content */}
          <div className="bg-card border border-border rounded-xl p-5">
            {/* Summary Tab */}
            {activeTab === "summary" && (
              <div className="space-y-5">
                {meeting.sentiment !== undefined && (
                  <div className="flex items-center gap-4">
                    <div className="text-sm font-medium text-muted-foreground">Sentiment</div>
                    <div className="flex-1 h-2 bg-muted rounded-full overflow-hidden">
                      <div
                        className={`h-full rounded-full transition-all ${
                          meeting.sentiment >= 75
                            ? "bg-brand-emerald"
                            : meeting.sentiment >= 50
                              ? "bg-brand-amber"
                              : "bg-brand-rose"
                        }`}
                        style={{ width: `${meeting.sentiment}%` }}
                      />
                    </div>
                    <div className={`text-sm font-semibold ${
                      meeting.sentiment >= 75
                        ? "text-brand-emerald"
                        : meeting.sentiment >= 50
                          ? "text-brand-amber"
                          : "text-brand-rose"
                    }`}>
                      {meeting.sentiment}/100
                    </div>
                  </div>
                )}

                <div>
                  <h3 className="font-heading text-lg text-foreground mb-2">AI Summary</h3>
                  <p className="text-sm text-muted-foreground leading-relaxed">{meeting.summary}</p>
                </div>

                {meeting.keyPoints && meeting.keyPoints.length > 0 && (
                  <div>
                    <h3 className="font-heading text-lg text-foreground mb-3">Key Points</h3>
                    <ul className="space-y-2">
                      {meeting.keyPoints.map((point, i) => (
                        <li key={i} className="flex items-start gap-2.5">
                          <div className="w-5 h-5 rounded-full bg-brand-violet/10 flex items-center justify-center shrink-0 mt-0.5">
                            <span className="text-[10px] font-bold text-brand-violet">{i + 1}</span>
                          </div>
                          <span className="text-sm text-foreground">{point}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            )}

            {/* Transcript Tab */}
            {activeTab === "transcript" && (
              <div className="space-y-4">
                {meeting.transcript && meeting.transcript.length > 0 ? (
                  <>
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                      <input
                        type="text"
                        placeholder="Search transcript..."
                        value={transcriptSearch}
                        onChange={(e) => setTranscriptSearch(e.target.value)}
                        className="w-full pl-9 pr-3 py-2 bg-muted rounded-lg text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-brand-violet/30"
                      />
                    </div>
                    <div className="space-y-1">
                      {filteredTranscript.map((seg, i) => {
                        const avatarColor = speakerColorMap[seg.speaker] || "bg-brand-slate text-white";
                        const isHighlighted = seg.isHighlight;
                        return (
                          <div
                            key={i}
                            className={`flex gap-3 p-3 rounded-lg transition-colors ${
                              isHighlighted
                                ? "bg-brand-violet/5 border border-brand-violet/10"
                                : "hover:bg-muted/50"
                            }`}
                          >
                            <div className={`w-7 h-7 rounded-full flex items-center justify-center text-[10px] font-medium shrink-0 ${avatarColor}`}>
                              {seg.speaker === "You" ? "Y" : seg.speaker.split(" ").map((n) => n[0]).join("").slice(0, 2)}
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2 mb-0.5">
                                <span className="text-sm font-medium text-foreground">{seg.speaker}</span>
                                <span className="text-[11px] text-muted-foreground font-mono">
                                  {formatTimestamp(seg.timestamp)}
                                </span>
                                {isHighlighted && (
                                  <span className="text-[10px] px-1.5 py-0.5 rounded bg-brand-violet/10 text-brand-violet font-medium">
                                    Highlight
                                  </span>
                                )}
                                {seg.sentiment && seg.sentiment !== "neutral" && (
                                  <span className={`text-[10px] px-1.5 py-0.5 rounded font-medium ${
                                    seg.sentiment === "positive"
                                      ? "bg-brand-emerald/10 text-brand-emerald"
                                      : "bg-brand-rose/10 text-brand-rose"
                                  }`}>
                                    {seg.sentiment}
                                  </span>
                                )}
                                {/* Confidence indicator */}
                                <div className="hidden sm:flex items-center gap-0.5" title={`Confidence: ${Math.round(seg.confidence * 100)}%`}>
                                  {[...Array(5)].map((_, j) => (
                                    <div
                                      key={j}
                                      className={`w-1 h-1 rounded-full ${
                                        j < Math.round(seg.confidence * 5)
                                          ? "bg-brand-emerald"
                                          : "bg-muted"
                                      }`}
                                    />
                                  ))}
                                </div>
                              </div>
                              <p className="text-sm text-foreground/80 leading-relaxed">
                                {transcriptSearch
                                  ? highlightText(seg.text, transcriptSearch)
                                  : seg.text}
                              </p>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                    {filteredTranscript.length === 0 && transcriptSearch && (
                      <p className="text-center text-sm text-muted-foreground py-8">
                        No transcript segments match &quot;{transcriptSearch}&quot;
                      </p>
                    )}
                  </>
                ) : (
                  <p className="text-center text-sm text-muted-foreground py-12">No transcript available for this meeting</p>
                )}
              </div>
            )}

            {/* Action Items Tab */}
            {activeTab === "actions" && (
              <div className="space-y-3">
                {meeting.actionItems && meeting.actionItems.length > 0 ? (
                  meeting.actionItems.map((item) => {
                    const statusCfg = statusConfig[item.status];
                    const StatusIcon = statusCfg.icon;
                    return (
                      <div key={item.id} className="flex items-start gap-3 p-3 rounded-lg border border-border">
                        <StatusIcon className={`w-5 h-5 shrink-0 mt-0.5 ${statusCfg.color}`} />
                        <div className="flex-1 min-w-0">
                          <p className={`text-sm ${item.status === "completed" ? "text-muted-foreground line-through" : "text-foreground"}`}>
                            {item.text}
                          </p>
                          <div className="flex flex-wrap items-center gap-x-3 gap-y-1 mt-1.5">
                            <span className="text-xs text-muted-foreground">
                              Assigned to <span className="font-medium text-foreground">{item.assignee}</span>
                            </span>
                            {item.dueDate && (
                              <span className="flex items-center gap-1 text-xs text-muted-foreground">
                                <Calendar className="w-3 h-3" />
                                Due {formatDate(item.dueDate)}
                              </span>
                            )}
                          </div>
                        </div>
                        <div className="flex items-center gap-2 shrink-0">
                          <span className={`text-[10px] px-2 py-0.5 rounded-md font-medium border ${priorityColors[item.priority]}`}>
                            {item.priority}
                          </span>
                          <span className={`text-[10px] px-2 py-0.5 rounded-md font-medium capitalize ${
                            item.status === "completed"
                              ? "bg-brand-emerald/10 text-brand-emerald"
                              : item.status === "in_progress"
                                ? "bg-brand-amber/10 text-brand-amber"
                                : item.status === "overdue"
                                  ? "bg-brand-rose/10 text-brand-rose"
                                  : "bg-muted text-muted-foreground"
                          }`}>
                            {item.status.replace("_", " ")}
                          </span>
                        </div>
                      </div>
                    );
                  })
                ) : (
                  <p className="text-center text-sm text-muted-foreground py-12">No action items for this meeting</p>
                )}
              </div>
            )}

            {/* Decisions Tab */}
            {activeTab === "decisions" && (
              <div className="space-y-4">
                {meeting.decisions && meeting.decisions.length > 0 ? (
                  meeting.decisions.map((dec) => (
                    <div key={dec.id} className="bg-brand-violet/5 border border-brand-violet/10 rounded-lg p-4">
                      <div className="flex items-start gap-3">
                        <div className="w-8 h-8 rounded-lg bg-brand-violet/10 flex items-center justify-center shrink-0">
                          <Lightbulb className="w-4 h-4 text-brand-violet" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-foreground">{dec.text}</p>
                          <p className="text-xs text-muted-foreground mt-1.5 leading-relaxed">{dec.context}</p>
                          <div className="flex items-center gap-3 mt-2">
                            <span className="text-xs text-muted-foreground">
                              Decision by <span className="font-medium text-foreground">{dec.madeBy}</span>
                            </span>
                            <span className="text-xs text-muted-foreground font-mono">
                              at {formatTimestamp(dec.timestamp)}
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))
                ) : (
                  <p className="text-center text-sm text-muted-foreground py-12">No decisions logged for this meeting</p>
                )}
              </div>
            )}

            {/* Clips Tab */}
            {activeTab === "clips" && (
              <div className="space-y-3">
                {meetingClips.length > 0 ? (
                  meetingClips.map((clip) => (
                    <div key={clip.id} className="flex items-start gap-3 p-3 rounded-lg border border-border hover:bg-muted/30 transition-colors">
                      <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${clipTypeColors[clip.type]}`}>
                        <Scissors className="w-4 h-4" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-foreground">{clip.title}</p>
                        <p className="text-xs text-muted-foreground mt-0.5">{clip.description}</p>
                        <div className="flex items-center gap-3 mt-1.5">
                          <span className="text-[11px] text-muted-foreground font-mono">
                            {formatTimestamp(clip.startTime)} - {formatTimestamp(clip.endTime)}
                          </span>
                          <span className="text-[11px] text-muted-foreground">{clip.speaker}</span>
                          <span className={`text-[10px] px-1.5 py-0.5 rounded capitalize ${clipTypeColors[clip.type]}`}>
                            {clip.type.replace("_", " ")}
                          </span>
                          {clip.shared && (
                            <span className="text-[10px] text-brand-violet font-medium">Shared</span>
                          )}
                          <span className="text-[10px] text-muted-foreground">{clip.views} views</span>
                        </div>
                      </div>
                    </div>
                  ))
                ) : (
                  <p className="text-center text-sm text-muted-foreground py-12">No clips from this meeting</p>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Sidebar */}
        <div className="lg:w-72 shrink-0 space-y-4">
          {/* Participants */}
          <div className="bg-card border border-border rounded-xl p-4">
            <h3 className="font-heading text-base text-foreground mb-3">Participants</h3>
            <div className="space-y-3">
              {meeting.participants.map((p) => {
                const pct = totalTalkTime > 0 ? Math.round((p.talkTime / totalTalkTime) * 100) : 0;
                const avatarColor = speakerColorMap[p.name] || "bg-brand-slate text-white";
                return (
                  <div key={p.name} className="flex items-center gap-2.5">
                    <div className={`w-7 h-7 rounded-full flex items-center justify-center text-[10px] font-medium shrink-0 ${avatarColor}`}>
                      {p.name === "You" ? "Y" : p.name.split(" ").map((n) => n[0]).join("").slice(0, 2)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium text-foreground truncate">{p.name}</span>
                        <span className="text-[11px] text-muted-foreground shrink-0">{pct}%</span>
                      </div>
                      {p.role && (
                        <div className="text-[11px] text-muted-foreground truncate">{p.role}</div>
                      )}
                      <div className="h-1.5 bg-muted rounded-full mt-1 overflow-hidden">
                        <div
                          className="h-full bg-brand-violet/60 rounded-full"
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Meeting Info */}
          <div className="bg-card border border-border rounded-xl p-4">
            <h3 className="font-heading text-base text-foreground mb-3">Meeting Info</h3>
            <dl className="space-y-2.5 text-sm">
              <div className="flex justify-between">
                <dt className="text-muted-foreground">Platform</dt>
                <dd className={`font-medium ${platform.color}`}>{platform.label}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-muted-foreground">Duration</dt>
                <dd className="font-medium text-foreground">{formatDuration(meeting.duration)}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-muted-foreground">Date</dt>
                <dd className="font-medium text-foreground">{formatDate(meeting.date)}</dd>
              </div>
              {meeting.folder && (
                <div className="flex justify-between">
                  <dt className="text-muted-foreground">Folder</dt>
                  <dd className="flex items-center gap-1 font-medium text-foreground">
                    <FolderOpen className="w-3.5 h-3.5 text-muted-foreground" /> {meeting.folder}
                  </dd>
                </div>
              )}
              {meeting.sentiment !== undefined && (
                <div className="flex justify-between">
                  <dt className="text-muted-foreground">Sentiment</dt>
                  <dd className={`font-medium ${
                    meeting.sentiment >= 75
                      ? "text-brand-emerald"
                      : meeting.sentiment >= 50
                        ? "text-brand-amber"
                        : "text-brand-rose"
                  }`}>
                    {meeting.sentiment}/100
                  </dd>
                </div>
              )}
            </dl>
          </div>

          {/* Tags */}
          {meeting.tags.length > 0 && (
            <div className="bg-card border border-border rounded-xl p-4">
              <h3 className="font-heading text-base text-foreground mb-3">Tags</h3>
              <div className="flex flex-wrap gap-1.5">
                {meeting.tags.map((tag) => (
                  <span key={tag} className="text-[11px] px-2 py-1 rounded-full bg-brand-violet/5 text-brand-violet border border-brand-violet/10">
                    {tag}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function highlightText(text: string, query: string) {
  if (!query) return text;
  const parts = text.split(new RegExp(`(${query.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")})`, "gi"));
  return (
    <>
      {parts.map((part, i) =>
        part.toLowerCase() === query.toLowerCase() ? (
          <mark key={i} className="bg-brand-violet/20 text-foreground rounded px-0.5">{part}</mark>
        ) : (
          part
        )
      )}
    </>
  );
}
