"use client";

import { useState, useMemo } from "react";
import { AppLink } from "@/components/DemoContext";
import { demoMeetings } from "@/lib/demo-data";
import { formatDuration, formatDate, formatTime } from "@/lib/utils";
import {
  Search,
  Calendar,
  Clock,
  Video,
  Filter,
  ChevronDown,
  Users,
  X,
} from "lucide-react";

const platformConfig: Record<string, { color: string; bg: string; label: string }> = {
  zoom: { color: "text-blue-600", bg: "bg-blue-50", label: "Zoom" },
  google_meet: { color: "text-green-600", bg: "bg-green-50", label: "Google Meet" },
  teams: { color: "text-purple-600", bg: "bg-purple-50", label: "Teams" },
  upload: { color: "text-gray-600", bg: "bg-gray-100", label: "Upload" },
  recording: { color: "text-brand-rose", bg: "bg-red-50", label: "Recording" },
};

const statusColors: Record<string, string> = {
  completed: "bg-brand-emerald/10 text-brand-emerald",
  processing: "bg-brand-amber/10 text-brand-amber",
  live: "bg-brand-rose/10 text-brand-rose",
  scheduled: "bg-brand-slate/10 text-brand-slate",
};

const platforms = ["zoom", "google_meet", "teams", "upload", "recording"] as const;
const folders = [...new Set(demoMeetings.map((m) => m.folder).filter(Boolean))];

export default function MeetingsPage() {
  const [search, setSearch] = useState("");
  const [platformFilter, setPlatformFilter] = useState<string>("");
  const [folderFilter, setFolderFilter] = useState<string>("");
  const [showFilters, setShowFilters] = useState(false);

  const filtered = useMemo(() => {
    return demoMeetings
      .filter((m) => {
        if (search && !m.title.toLowerCase().includes(search.toLowerCase())) return false;
        if (platformFilter && m.platform !== platformFilter) return false;
        if (folderFilter && m.folder !== folderFilter) return false;
        return true;
      })
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }, [search, platformFilter, folderFilter]);

  const totalHours = Math.round(demoMeetings.reduce((s, m) => s + m.duration, 0) / 3600 * 10) / 10;
  const avgDuration = Math.round(demoMeetings.reduce((s, m) => s + m.duration, 0) / demoMeetings.length);
  const thisWeekCount = demoMeetings.filter((m) => {
    const d = new Date(m.date);
    return d >= new Date("2026-03-09") && d <= new Date("2026-03-15");
  }).length;

  const hasFilters = platformFilter || folderFilter;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-heading text-3xl text-foreground">Meetings</h1>
        <p className="text-muted-foreground text-sm mt-1">Browse, search, and filter all your recorded meetings</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-card border border-border rounded-xl p-4">
          <div className="text-2xl font-semibold text-foreground">{demoMeetings.length}</div>
          <div className="text-xs text-muted-foreground">Total Meetings</div>
        </div>
        <div className="bg-card border border-border rounded-xl p-4">
          <div className="text-2xl font-semibold text-foreground">{thisWeekCount}</div>
          <div className="text-xs text-muted-foreground">This Week</div>
        </div>
        <div className="bg-card border border-border rounded-xl p-4">
          <div className="text-2xl font-semibold text-foreground">{totalHours}h</div>
          <div className="text-xs text-muted-foreground">Total Hours</div>
        </div>
        <div className="bg-card border border-border rounded-xl p-4">
          <div className="text-2xl font-semibold text-foreground">{formatDuration(avgDuration)}</div>
          <div className="text-xs text-muted-foreground">Avg Duration</div>
        </div>
      </div>

      {/* Search & Filters */}
      <div className="bg-card border border-border rounded-xl p-4">
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <input
              type="text"
              placeholder="Search by title..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-3 py-2 bg-muted rounded-lg text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-brand-violet/30"
            />
          </div>
          <button
            onClick={() => setShowFilters(!showFilters)}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium border transition-colors ${
              showFilters || hasFilters
                ? "border-brand-violet/30 bg-brand-violet/5 text-brand-violet"
                : "border-border text-muted-foreground hover:text-foreground hover:bg-muted"
            }`}
          >
            <Filter className="w-4 h-4" />
            Filters
            {hasFilters && (
              <span className="w-5 h-5 rounded-full bg-brand-violet text-white text-[10px] flex items-center justify-center">
                {(platformFilter ? 1 : 0) + (folderFilter ? 1 : 0)}
              </span>
            )}
          </button>
        </div>

        {showFilters && (
          <div className="flex flex-wrap gap-3 mt-3 pt-3 border-t border-border">
            <div className="flex flex-col gap-1">
              <label className="text-[11px] font-medium text-muted-foreground uppercase tracking-wide">Platform</label>
              <select
                value={platformFilter}
                onChange={(e) => setPlatformFilter(e.target.value)}
                className="text-sm px-3 py-1.5 rounded-lg border border-border bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-brand-violet/30"
              >
                <option value="">All Platforms</option>
                {platforms.map((p) => (
                  <option key={p} value={p}>{platformConfig[p].label}</option>
                ))}
              </select>
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-[11px] font-medium text-muted-foreground uppercase tracking-wide">Folder</label>
              <select
                value={folderFilter}
                onChange={(e) => setFolderFilter(e.target.value)}
                className="text-sm px-3 py-1.5 rounded-lg border border-border bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-brand-violet/30"
              >
                <option value="">All Folders</option>
                {folders.map((f) => (
                  <option key={f} value={f}>{f}</option>
                ))}
              </select>
            </div>
            {hasFilters && (
              <button
                onClick={() => { setPlatformFilter(""); setFolderFilter(""); }}
                className="self-end flex items-center gap-1 text-xs text-brand-violet hover:underline pb-1.5"
              >
                <X className="w-3 h-3" /> Clear filters
              </button>
            )}
          </div>
        )}
      </div>

      {/* Meeting list */}
      <div className="bg-card border border-border rounded-xl divide-y divide-border overflow-hidden">
        {filtered.length === 0 ? (
          <div className="py-16 text-center text-muted-foreground text-sm">
            No meetings match your filters
          </div>
        ) : (
          filtered.map((meeting) => {
            const platform = platformConfig[meeting.platform];
            return (
              <AppLink
                key={meeting.id}
                href={`/meetings/${meeting.id}`}
                className="flex items-center gap-4 px-5 py-4 hover:bg-muted/30 transition-colors group"
              >
                <div className={`w-10 h-10 rounded-lg ${platform.bg} flex items-center justify-center shrink-0`}>
                  <Video className={`w-4.5 h-4.5 ${platform.color}`} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="font-medium text-sm text-foreground group-hover:text-brand-violet transition-colors truncate">
                    {meeting.title}
                  </div>
                  <div className="flex flex-wrap items-center gap-x-3 gap-y-1 mt-1">
                    <span className="flex items-center gap-1 text-xs text-muted-foreground">
                      <Calendar className="w-3 h-3" />
                      {formatDate(meeting.date)} at {formatTime(meeting.date)}
                    </span>
                    <span className="flex items-center gap-1 text-xs text-muted-foreground">
                      <Clock className="w-3 h-3" />
                      {formatDuration(meeting.duration)}
                    </span>
                    <span className="flex items-center gap-1 text-xs text-muted-foreground">
                      <Users className="w-3 h-3" />
                      {meeting.participants.length}
                    </span>
                  </div>
                </div>
                <div className="hidden sm:flex items-center gap-2 shrink-0">
                  {meeting.tags.slice(0, 2).map((tag) => (
                    <span key={tag} className="text-[11px] px-2 py-0.5 rounded-full bg-muted text-muted-foreground">
                      {tag}
                    </span>
                  ))}
                </div>
                <div className="shrink-0">
                  <span className={`text-[11px] px-2 py-1 rounded-md font-medium capitalize ${statusColors[meeting.status]}`}>
                    {meeting.status}
                  </span>
                </div>
              </AppLink>
            );
          })
        )}
      </div>
    </div>
  );
}
