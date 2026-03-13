"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useState, useEffect, useRef, useCallback } from "react";
import { useTheme } from "next-themes";
import { useUser } from "@/components/UserContext";
import { getMeetings, type Meeting } from "@/lib/meeting-store";
import { NotificationCenter } from "@/components/NotificationCenter";
import {
  LayoutDashboard,
  Mic,
  ListChecks,
  Scissors,
  BarChart3,
  Users,
  Plug,
  Settings,
  Search,
  Sun,
  Moon,
  Menu,
  X,
  Upload,
  ChevronDown,
  ChevronRight,
  FolderOpen,
  Sparkles,
  LogOut,
  Target,
  CheckCircle2,
  Loader2,
  XCircle,
  VolumeX,
  Calendar,
  Plus,
  Video,
  Link as LinkIcon,
} from "lucide-react";

interface NavItem {
  href: string;
  label: string;
  icon: React.ElementType;
  badge?: string;
  children?: { href: string; label: string }[];
}

const navItems: NavItem[] = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  {
    href: "/meetings",
    label: "Meetings",
    icon: Mic,
    children: [
      { href: "/meetings", label: "All Meetings" },
      { href: "/meetings/upload", label: "Upload Recording" },
      { href: "/meetings/record", label: "Record" },
    ],
  },
  { href: "/library", label: "Library", icon: FolderOpen },
  { href: "/action-items", label: "Action Items", icon: ListChecks },
  { href: "/decisions", label: "Decision Log", icon: Target },
  { href: "/coach", label: "AI Coach", icon: Sparkles },
  { href: "/clips", label: "Smart Clips", icon: Scissors },
  { href: "/analytics", label: "Analytics", icon: BarChart3 },
  { href: "/team", label: "Team", icon: Users },
  { href: "/integrations", label: "Integrations", icon: Plug },
  { href: "/settings", label: "Settings", icon: Settings },
];

interface SearchResult {
  meeting: Meeting;
  snippet: string;
  matchField: string;
}

function formatSearchDate(iso: string): string {
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

function getSnippet(text: string, query: string, maxLen = 80): string {
  const lower = text.toLowerCase();
  const idx = lower.indexOf(query.toLowerCase());
  if (idx < 0) return text.slice(0, maxLen);
  const start = Math.max(0, idx - 30);
  const end = Math.min(text.length, idx + query.length + 50);
  let snippet = text.slice(start, end);
  if (start > 0) snippet = "..." + snippet;
  if (end < text.length) snippet = snippet + "...";
  return snippet;
}

async function searchMeetings(query: string, orgId: string): Promise<SearchResult[]> {
  if (!query.trim()) return [];
  const q = query.toLowerCase();
  const meetings = await getMeetings(orgId);
  const results: SearchResult[] = [];

  for (const m of meetings) {
    if (results.length >= 8) break;

    if (m.title.toLowerCase().includes(q)) {
      results.push({ meeting: m, snippet: m.title, matchField: "Title" });
      continue;
    }
    const matchTag = m.tags.find((t) => t.toLowerCase().includes(q));
    if (matchTag) {
      results.push({ meeting: m, snippet: `Tag: ${matchTag}`, matchField: "Tag" });
      continue;
    }
    if (m.transcript?.text.toLowerCase().includes(q)) {
      results.push({ meeting: m, snippet: getSnippet(m.transcript.text, query), matchField: "Transcript" });
      continue;
    }
    const matchDecision = m.decisions.find((d) => d.text.toLowerCase().includes(q));
    if (matchDecision) {
      results.push({ meeting: m, snippet: getSnippet(matchDecision.text, query), matchField: "Decision" });
      continue;
    }
    const matchAction = m.actionItems.find((a) => a.text.toLowerCase().includes(q));
    if (matchAction) {
      results.push({ meeting: m, snippet: getSnippet(matchAction.text, query), matchField: "Action Item" });
      continue;
    }
  }
  return results;
}

function SearchStatusBadge({ status }: { status: Meeting["status"] }) {
  switch (status) {
    case "uploading":
    case "processing":
      return (
        <span className="inline-flex items-center gap-1 px-1.5 py-0.5 text-[10px] font-medium rounded-md bg-brand-violet/10 text-brand-violet whitespace-nowrap">
          <Loader2 className="w-2.5 h-2.5 animate-spin" /> Processing
        </span>
      );
    case "completed":
      return (
        <span className="inline-flex items-center gap-1 px-1.5 py-0.5 text-[10px] font-medium rounded-md bg-brand-emerald/10 text-brand-emerald whitespace-nowrap">
          <CheckCircle2 className="w-2.5 h-2.5" /> Ready
        </span>
      );
    case "failed":
      return (
        <span className="inline-flex items-center gap-1 px-1.5 py-0.5 text-[10px] font-medium rounded-md bg-brand-rose/10 text-brand-rose whitespace-nowrap">
          <XCircle className="w-2.5 h-2.5" /> Failed
        </span>
      );
    case "silent":
      return (
        <span className="inline-flex items-center gap-1 px-1.5 py-0.5 text-[10px] font-medium rounded-md bg-brand-amber/10 text-brand-amber whitespace-nowrap">
          <VolumeX className="w-2.5 h-2.5" /> Silent
        </span>
      );
    default:
      return null;
  }
}

function isActive(pathname: string, href: string): boolean {
  if (href === "/dashboard") return pathname === "/dashboard" || pathname === "/demo/dashboard";
  const cleanPath = pathname.replace(/^\/demo/, "");
  return cleanPath.startsWith(href);
}

export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const isDemo = pathname.startsWith("/demo");
  const { user, signOut } = useUser();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [expandedSections, setExpandedSections] = useState<string[]>(["/meetings"]);
  const { resolvedTheme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
  const [showDropdown, setShowDropdown] = useState(false);
  const [selectedResultIndex, setSelectedResultIndex] = useState(-1);
  const searchRef = useRef<HTMLDivElement>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => setMounted(true), []);

  const handleSearch = useCallback((value: string) => {
    setSearchQuery(value);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    if (!value.trim()) {
      setSearchResults([]);
      setShowDropdown(false);
      return;
    }
    debounceRef.current = setTimeout(async () => {
      if (!user?.organizationId) return;
      const results = await searchMeetings(value, user.organizationId);
      setSearchResults(results);
      setSelectedResultIndex(-1);
      setShowDropdown(true);
    }, 300);
  }, [user]);

  // Close dropdown on click outside
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (searchRef.current && !searchRef.current.contains(e.target as Node)) {
        setShowDropdown(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Global keyboard shortcuts
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") {
        setShowDropdown(false);
        return;
      }

      // Skip if user is typing in an input, textarea, or contenteditable
      const target = e.target as HTMLElement;
      if (
        target.tagName === "INPUT" ||
        target.tagName === "TEXTAREA" ||
        target.isContentEditable
      ) {
        return;
      }

      // Skip if any modifier key is held (Cmd+R, Ctrl+R, etc.)
      if (e.metaKey || e.ctrlKey || e.altKey) return;

      // "R" → navigate to record page (unless already there)
      if (e.key === "r" || e.key === "R") {
        const cleanPath = pathname.replace(/^\/demo/, "");
        if (cleanPath !== "/meetings/record") {
          e.preventDefault();
          router.push(isDemo ? "/demo/meetings/record" : "/meetings/record");
        }
      }

      // "/" → focus search bar
      if (e.key === "/") {
        e.preventDefault();
        const searchInput = searchRef.current?.querySelector("input");
        if (searchInput) searchInput.focus();
      }
    }
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [pathname, router, isDemo]);

  const handleSearchKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (!showDropdown || searchResults.length === 0) return;
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setSelectedResultIndex((prev) => Math.min(prev + 1, searchResults.length - 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setSelectedResultIndex((prev) => Math.max(prev - 1, 0));
    } else if (e.key === "Enter" && selectedResultIndex >= 0) {
      e.preventDefault();
      navigateToResult(searchResults[selectedResultIndex].meeting.id);
    }
  }, [showDropdown, searchResults, selectedResultIndex]);

  function navigateToResult(meetingId: string) {
    setShowDropdown(false);
    setSearchQuery("");
    setSearchResults([]);
    router.push(isDemo ? `/demo/meetings/${meetingId}` : `/meetings/${meetingId}`);
  }

  function toggleSection(href: string) {
    setExpandedSections((prev) =>
      prev.includes(href) ? prev.filter((h) => h !== href) : [...prev, href]
    );
  }

  function isSectionExpanded(item: NavItem): boolean {
    if (!item.children) return false;
    const cleanPath = pathname.replace(/^\/demo/, "");
    return expandedSections.includes(item.href) || item.children.some((c) => cleanPath.startsWith(c.href));
  }

  function navHref(href: string) {
    return isDemo ? `/demo${href}` : href;
  }

  // Waveform logo
  const WaveformLogo = () => (
    <img src="/icon-transparent.svg" alt="" width={22} height={22} className="shrink-0" />
  );

  const [newMenuOpen, setNewMenuOpen] = useState(false);
  const newMenuRef = useRef<HTMLDivElement>(null);

  // Close "New" dropdown on outside click
  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (newMenuRef.current && !newMenuRef.current.contains(e.target as Node)) {
        setNewMenuOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  const closeMobile = () => setSidebarOpen(false);

  const sidebar = (
    <div className="flex flex-col h-full">
      <div className="px-4 h-14 flex items-center gap-2.5 border-b border-border shrink-0">
        <Link href={navHref("/dashboard")} onClick={closeMobile} className="flex items-center gap-2.5">
          <WaveformLogo />
          <span className="font-heading text-lg font-normal text-foreground tracking-tight">
            Reverbic
          </span>
        </Link>
      </div>

      <div className="px-3 py-3" ref={newMenuRef}>
        <button
          onClick={() => setNewMenuOpen((v) => !v)}
          aria-expanded={newMenuOpen}
          aria-haspopup="menu"
          className="w-full flex items-center justify-center gap-2 px-3 py-2 bg-brand-violet text-white rounded-lg text-sm font-medium hover:bg-brand-violet/90 transition-colors"
        >
          <Plus className="w-4 h-4" />
          New Meeting
          <ChevronDown className={`w-3.5 h-3.5 ml-auto transition-transform ${newMenuOpen ? "rotate-180" : ""}`} />
        </button>
        {newMenuOpen && (
          <div className="mt-1.5 bg-card border border-border rounded-lg shadow-lg overflow-hidden animate-in fade-in slide-in-from-top-1 duration-150">
            <Link
              href={navHref("/meetings/upload")}
              onClick={() => { setNewMenuOpen(false); closeMobile(); }}
              className="flex items-center gap-3 px-3 py-2.5 text-sm text-foreground hover:bg-muted transition-colors"
            >
              <div className="w-7 h-7 rounded-md bg-brand-violet/10 flex items-center justify-center">
                <Upload className="w-3.5 h-3.5 text-brand-violet" />
              </div>
              <div>
                <div className="font-medium text-[13px]">Upload File</div>
                <div className="text-[11px] text-muted-foreground">MP3, WAV, M4A, WebM</div>
              </div>
            </Link>
            <Link
              href={navHref("/meetings/record")}
              onClick={() => { setNewMenuOpen(false); closeMobile(); }}
              className="flex items-center gap-3 px-3 py-2.5 text-sm text-foreground hover:bg-muted transition-colors"
            >
              <div className="w-7 h-7 rounded-md bg-brand-rose/10 flex items-center justify-center">
                <Mic className="w-3.5 h-3.5 text-brand-rose" />
              </div>
              <div>
                <div className="font-medium text-[13px]">Record Live</div>
                <div className="text-[11px] text-muted-foreground">Use your microphone</div>
              </div>
            </Link>
            <Link
              href={navHref("/meetings/upload?tab=loom")}
              onClick={() => { setNewMenuOpen(false); closeMobile(); }}
              className="flex items-center gap-3 px-3 py-2.5 text-sm text-foreground hover:bg-muted transition-colors"
            >
              <div className="w-7 h-7 rounded-md bg-brand-cyan/10 flex items-center justify-center">
                <Video className="w-3.5 h-3.5 text-brand-cyan" />
              </div>
              <div>
                <div className="font-medium text-[13px]">Import Loom</div>
                <div className="text-[11px] text-muted-foreground">Paste a Loom share link</div>
              </div>
            </Link>
          </div>
        )}
      </div>

      <nav className="flex-1 overflow-y-auto px-2 space-y-0.5">
        {navItems.map((item) => {
          const active = isActive(pathname, item.href);
          const Icon = item.icon;
          const expanded = isSectionExpanded(item);

          if (item.children) {
            return (
              <div key={item.href}>
                <button
                  onClick={() => toggleSection(item.href)}
                  aria-expanded={expanded}
                  className={`w-full flex items-center justify-between px-3 py-2 text-sm rounded-lg transition-colors ${
                    active
                      ? "bg-brand-violet/10 text-brand-violet font-medium"
                      : "text-muted-foreground hover:text-foreground hover:bg-muted"
                  }`}
                >
                  <span className="flex items-center gap-2.5">
                    <Icon className="w-4 h-4" />
                    {item.label}
                  </span>
                  {expanded ? <ChevronDown className="w-3.5 h-3.5" /> : <ChevronRight className="w-3.5 h-3.5" />}
                </button>
                {expanded && (
                  <div className="ml-6 mt-0.5 space-y-0.5 border-l border-border pl-3">
                    {item.children.map((child) => {
                      const childPath = isDemo ? `/demo${child.href}` : child.href;
                      const childActive = pathname === childPath;
                      return (
                        <Link
                          key={child.href}
                          href={childPath}
                          onClick={closeMobile}
                          className={`block px-2 py-1.5 text-[13px] rounded-md transition-colors ${
                            childActive ? "text-brand-violet font-medium bg-brand-violet/5" : "text-muted-foreground hover:text-foreground"
                          }`}
                        >
                          {child.label}
                        </Link>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          }

          return (
            <Link
              key={item.href}
              href={navHref(item.href)}
              onClick={closeMobile}
              className={`flex items-center justify-between px-3 py-2 text-sm rounded-lg transition-colors ${
                active
                  ? "bg-brand-violet/10 text-brand-violet font-medium"
                  : "text-muted-foreground hover:text-foreground hover:bg-muted"
              }`}
            >
              <span className="flex items-center gap-2.5">
                <Icon className="w-4 h-4" />
                {item.label}
              </span>
              {item.badge && (
                <span className="bg-brand-violet/10 text-brand-violet text-[11px] font-semibold px-1.5 py-0.5 rounded-full">
                  {item.badge}
                </span>
              )}
            </Link>
          );
        })}
      </nav>

      {isDemo && (
        <div className="px-3 py-3 border-t border-border shrink-0">
          <div className="bg-brand-violet/5 border border-brand-violet/10 rounded-lg px-3 py-2">
            <div className="text-xs font-semibold text-brand-violet">Demo Mode</div>
            <div className="text-[11px] text-muted-foreground mt-0.5">Sample data. No login required.</div>
          </div>
        </div>
      )}

      {!isDemo && (
        <div className="px-3 py-3 border-t border-border shrink-0">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-full bg-brand-violet/10 flex items-center justify-center">
              <span className="text-xs font-medium text-brand-violet">
                {user?.name?.[0]?.toUpperCase() || "U"}
              </span>
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-sm font-medium text-foreground truncate">
                {user?.name || "User"}
              </div>
              <div className="text-xs text-muted-foreground truncate">
                {user?.email || ""}
              </div>
            </div>
            <button
              onClick={async () => {
                await signOut();
                router.replace("/sign-in");
              }}
              className="text-muted-foreground hover:text-foreground transition-colors p-2 -m-1"
              aria-label="Sign out"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}
    </div>
  );

  return (
    <div className="min-h-screen bg-background flex">
      <aside className="hidden lg:flex lg:w-60 lg:flex-col lg:fixed lg:inset-y-0 bg-card border-r border-border z-30">
        {sidebar}
      </aside>

      {sidebarOpen && (
        <div className="fixed inset-0 z-40 lg:hidden">
          <div className="fixed inset-0 bg-black/30" onClick={() => setSidebarOpen(false)} />
          <aside className="fixed inset-y-0 left-0 w-64 bg-card shadow-xl z-50">
            <div className="absolute top-3 right-3">
              <button onClick={() => setSidebarOpen(false)} className="p-2 text-muted-foreground hover:text-foreground" aria-label="Close navigation menu">
                <X className="w-5 h-5" />
              </button>
            </div>
            {sidebar}
          </aside>
        </div>
      )}

      <div className="lg:pl-60 flex-1 flex flex-col min-h-screen">
        <header className="bg-card border-b border-border sticky top-0 z-20">
          <div className="px-4 sm:px-6 h-14 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <button onClick={() => setSidebarOpen(true)} className="lg:hidden text-muted-foreground hover:text-foreground p-2 -m-2" aria-label="Open navigation menu">
                <Menu className="w-5 h-5" />
              </button>
              <div ref={searchRef} className="hidden sm:block relative w-80" role="combobox" aria-expanded={showDropdown} aria-haspopup="listbox" aria-owns="search-results-listbox">
                <div className="flex items-center bg-muted rounded-xl px-3 py-1.5">
                  <Search className="w-4 h-4 text-muted-foreground mr-2 shrink-0" aria-hidden="true" />
                  <label htmlFor="global-search" className="sr-only">Search meetings, transcripts, clips</label>
                  <input
                    id="global-search"
                    type="text"
                    value={searchQuery}
                    onChange={(e) => handleSearch(e.target.value)}
                    onFocus={() => { if (searchQuery.trim() && searchResults.length > 0) setShowDropdown(true); }}
                    onKeyDown={handleSearchKeyDown}
                    placeholder="Search meetings, transcripts, clips..."
                    className="w-full bg-transparent text-sm text-foreground placeholder:text-muted-foreground focus-visible:outline-none"
                    aria-autocomplete="list"
                    aria-controls="search-results-listbox"
                    aria-activedescendant={selectedResultIndex >= 0 ? `search-result-${selectedResultIndex}` : undefined}
                  />
                  {!searchQuery && (
                    <kbd className="hidden lg:inline-flex items-center px-1.5 py-0.5 text-[10px] font-mono text-muted-foreground bg-background border border-border rounded ml-1 shrink-0">/</kbd>
                  )}
                  {searchQuery && (
                    <button
                      onClick={() => { setSearchQuery(""); setSearchResults([]); setShowDropdown(false); }}
                      className="text-muted-foreground hover:text-foreground transition-colors ml-1"
                      aria-label="Clear search"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
                {showDropdown && (
                  <div id="search-results-listbox" role="listbox" aria-label="Search results" className="absolute top-full left-0 right-0 mt-2 bg-card border border-border rounded-xl shadow-lg overflow-hidden z-50 animate-in fade-in slide-in-from-top-1 duration-150">
                    {searchResults.length === 0 ? (
                      <div className="px-4 py-6 text-center" role="status">
                        <Search className="w-5 h-5 text-muted-foreground mx-auto mb-2" aria-hidden="true" />
                        <p className="text-sm text-muted-foreground">No results for &ldquo;{searchQuery}&rdquo;</p>
                      </div>
                    ) : (
                      <div className="max-h-[380px] overflow-y-auto py-1">
                        {searchResults.map((result, idx) => (
                          <button
                            id={`search-result-${idx}`}
                            key={result.meeting.id}
                            role="option"
                            aria-selected={idx === selectedResultIndex}
                            onClick={() => navigateToResult(result.meeting.id)}
                            className={`w-full text-left px-3 py-2.5 hover:bg-muted/60 transition-colors flex items-start gap-3 group ${idx === selectedResultIndex ? "bg-muted/60" : ""}`}
                          >
                            <div className="w-8 h-8 rounded-lg bg-brand-violet/10 flex items-center justify-center shrink-0 mt-0.5">
                              <FolderOpen className="w-3.5 h-3.5 text-brand-violet" />
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2">
                                <span className="text-sm font-medium text-foreground truncate group-hover:text-brand-violet transition-colors">
                                  {result.meeting.title}
                                </span>
                                <SearchStatusBadge status={result.meeting.status} />
                              </div>
                              <div className="flex items-center gap-2 mt-0.5">
                                <span className="text-[11px] text-muted-foreground inline-flex items-center gap-1">
                                  <Calendar className="w-2.5 h-2.5" />
                                  {formatSearchDate(result.meeting.createdAt)}
                                </span>
                                <span className="text-[10px] text-brand-violet/70 bg-brand-violet/5 px-1.5 py-0.5 rounded">
                                  {result.matchField}
                                </span>
                              </div>
                              {result.matchField !== "Title" && (
                                <p className="text-xs text-muted-foreground mt-1 line-clamp-1">
                                  {result.snippet}
                                </p>
                              )}
                            </div>
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setTheme(resolvedTheme === "dark" ? "light" : "dark")}
                className="text-muted-foreground hover:text-foreground transition-colors p-1.5 rounded-lg hover:bg-muted"
                aria-label={mounted && resolvedTheme === "dark" ? "Switch to light mode" : "Switch to dark mode"}
              >
                {mounted && resolvedTheme === "dark" ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
              </button>
              <NotificationCenter />
              {isDemo && (
                <span className="text-xs bg-brand-violet/10 text-brand-violet px-2 py-1 rounded-lg font-medium">DEMO</span>
              )}
            </div>
          </div>
        </header>

        <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-[1400px] w-full mx-auto">
          {children}
        </main>
      </div>
    </div>
  );
}
