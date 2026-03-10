"use client";

import { useState, useMemo } from "react";
import {
  FolderOpen,
  Search,
  Clock,
  Calendar,
  ArrowUpDown,
  ChevronRight,
  Video,
  Upload,
  Mic,
  X,
} from "lucide-react";
import { demoMeetings, demoFolders } from "@/lib/demo-data";
import { AppLink } from "@/components/DemoContext";

const platformIcons: Record<string, React.ElementType> = {
  zoom: Video,
  google_meet: Video,
  teams: Video,
  upload: Upload,
  recording: Mic,
};

function formatDuration(seconds: number) {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  if (h > 0) return `${h}h ${m}m`;
  return `${m}m`;
}

function formatDate(dateStr: string) {
  const d = new Date(dateStr);
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

type SortKey = "date" | "duration" | "folder";

export default function LibraryPage() {
  const [selectedFolder, setSelectedFolder] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [sortBy, setSortBy] = useState<SortKey>("date");

  const filtered = useMemo(() => {
    let meetings = [...demoMeetings];

    if (selectedFolder) {
      meetings = meetings.filter((m) => m.folder === selectedFolder);
    }

    if (search.trim()) {
      const q = search.toLowerCase();
      meetings = meetings.filter(
        (m) =>
          m.title.toLowerCase().includes(q) ||
          m.summary?.toLowerCase().includes(q) ||
          m.tags.some((t) => t.toLowerCase().includes(q))
      );
    }

    meetings.sort((a, b) => {
      switch (sortBy) {
        case "date":
          return new Date(b.date).getTime() - new Date(a.date).getTime();
        case "duration":
          return b.duration - a.duration;
        case "folder":
          return (a.folder ?? "").localeCompare(b.folder ?? "");
        default:
          return 0;
      }
    });

    return meetings;
  }, [selectedFolder, search, sortBy]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="font-heading text-2xl text-foreground">Library</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Browse and organize your meeting recordings
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Folder sidebar */}
        <div className="lg:col-span-1 space-y-2">
          <h2 className="font-heading text-sm text-muted-foreground uppercase tracking-wider px-1 mb-3">
            Folders
          </h2>

          <button
            onClick={() => setSelectedFolder(null)}
            className={`w-full flex items-center justify-between px-3 py-2.5 rounded-lg text-sm transition-colors ${
              !selectedFolder
                ? "bg-brand-violet/10 text-brand-violet font-medium"
                : "text-muted-foreground hover:text-foreground hover:bg-muted"
            }`}
          >
            <span className="flex items-center gap-2">
              <FolderOpen className="w-4 h-4" />
              All Meetings
            </span>
            <span className="text-xs">{demoMeetings.length}</span>
          </button>

          {demoFolders.map((folder) => (
            <button
              key={folder.name}
              onClick={() => setSelectedFolder(folder.name)}
              className={`w-full flex items-center justify-between px-3 py-2.5 rounded-lg text-sm transition-colors ${
                selectedFolder === folder.name
                  ? "bg-brand-violet/10 text-brand-violet font-medium"
                  : "text-muted-foreground hover:text-foreground hover:bg-muted"
              }`}
            >
              <span className="flex items-center gap-2">
                <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: folder.color }} />
                {folder.name}
              </span>
              <span className="text-xs">{folder.count}</span>
            </button>
          ))}
        </div>

        {/* Meetings list */}
        <div className="lg:col-span-3 space-y-4">
          {/* Search and sort */}
          <div className="flex flex-wrap items-center gap-3">
            <div className="flex-1 min-w-[200px] relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <input
                type="text"
                placeholder="Search meetings..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full bg-card border border-border rounded-lg pl-9 pr-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-brand-violet/30"
              />
              {search && (
                <button
                  onClick={() => setSearch("")}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
            <div className="flex items-center gap-1.5">
              <ArrowUpDown className="w-4 h-4 text-muted-foreground" />
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as SortKey)}
                className="text-sm bg-card border border-border rounded-lg px-3 py-2 text-foreground"
              >
                <option value="date">Date</option>
                <option value="duration">Duration</option>
                <option value="folder">Folder</option>
              </select>
            </div>
          </div>

          {selectedFolder && (
            <div className="flex items-center gap-2">
              <span className="text-sm text-muted-foreground">Filtered by:</span>
              <span className="inline-flex items-center gap-1 text-xs font-medium px-2 py-1 rounded-full bg-brand-violet/10 text-brand-violet">
                {selectedFolder}
                <button onClick={() => setSelectedFolder(null)}>
                  <X className="w-3 h-3" />
                </button>
              </span>
            </div>
          )}

          {/* Meeting cards */}
          <div className="space-y-2">
            {filtered.map((meeting) => {
              const PlatformIcon = platformIcons[meeting.platform] ?? Video;
              return (
                <AppLink
                  key={meeting.id}
                  href={`/meetings/${meeting.id}`}
                  className="block bg-card border border-border rounded-xl p-4 hover:border-brand-violet/30 transition-colors group"
                >
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 rounded-lg bg-muted flex items-center justify-center text-muted-foreground shrink-0">
                      <PlatformIcon className="w-5 h-5" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <h3 className="text-sm font-semibold text-foreground truncate group-hover:text-brand-violet transition-colors">
                          {meeting.title}
                        </h3>
                        {meeting.folder && (
                          <span className="text-[10px] px-1.5 py-0.5 rounded bg-muted text-muted-foreground shrink-0">
                            {meeting.folder}
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-3 mt-1 text-xs text-muted-foreground">
                        <span className="flex items-center gap-1">
                          <Calendar className="w-3 h-3" />
                          {formatDate(meeting.date)}
                        </span>
                        <span className="flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          {formatDuration(meeting.duration)}
                        </span>
                        <span>{meeting.participants.length} participants</span>
                      </div>
                      {meeting.summary && (
                        <p className="text-xs text-muted-foreground mt-1.5 line-clamp-1">{meeting.summary}</p>
                      )}
                    </div>
                    <ChevronRight className="w-4 h-4 text-muted-foreground shrink-0 group-hover:text-brand-violet transition-colors" />
                  </div>
                </AppLink>
              );
            })}
          </div>

          {filtered.length === 0 && (
            <div className="text-center py-12 text-muted-foreground">
              <FolderOpen className="w-10 h-10 mx-auto mb-3 opacity-40" />
              <p className="text-sm">No meetings found</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
