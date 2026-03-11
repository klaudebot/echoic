"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useState, useEffect } from "react";
import { useTheme } from "next-themes";
import { useUser } from "@/components/UserContext";
import {
  LayoutDashboard,
  Mic,
  FileText,
  ListChecks,
  Lightbulb,
  Scissors,
  BarChart3,
  Users,
  Plug,
  Settings,
  Search,
  Bell,
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
  { href: "/action-items", label: "Action Items", icon: ListChecks, badge: "9" },
  { href: "/decisions", label: "Decision Log", icon: Target },
  { href: "/coach", label: "AI Coach", icon: Sparkles },
  { href: "/clips", label: "Smart Clips", icon: Scissors },
  { href: "/analytics", label: "Analytics", icon: BarChart3 },
  { href: "/team", label: "Team", icon: Users },
  { href: "/integrations", label: "Integrations", icon: Plug },
  { href: "/settings", label: "Settings", icon: Settings },
];

function isActive(pathname: string, href: string): boolean {
  if (href === "/dashboard") return pathname === "/dashboard" || pathname === "/demo/dashboard";
  const cleanPath = pathname.replace(/^\/demo/, "");
  return cleanPath.startsWith(href);
}

export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const isDemo = pathname.startsWith("/demo");
  const { user, clearUser } = useUser();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [expandedSections, setExpandedSections] = useState<string[]>(["/meetings"]);
  const { resolvedTheme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => setMounted(true), []);

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
    <div className="flex items-end gap-[2px] h-6 w-6">
      {[10, 18, 14, 22, 12].map((h, i) => (
        <div
          key={i}
          className="wave-bar w-[3px] rounded-full bg-brand-violet"
          style={{ height: `${h}px` }}
        />
      ))}
    </div>
  );

  const sidebar = (
    <div className="flex flex-col h-full">
      <div className="px-4 h-14 flex items-center gap-2.5 border-b border-border shrink-0">
        <Link href={navHref("/dashboard")} className="flex items-center gap-2.5">
          <WaveformLogo />
          <span className="font-heading text-lg font-normal text-foreground tracking-tight">
            Reverbic
          </span>
        </Link>
      </div>

      <div className="px-3 py-3">
        <button className="w-full flex items-center gap-2 px-3 py-2 bg-brand-violet text-white rounded-lg text-sm font-medium hover:bg-brand-violet/90 transition-colors">
          <Upload className="w-4 h-4" />
          Upload or Record
        </button>
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
              onClick={() => {
                clearUser();
                router.push("/");
              }}
              className="text-muted-foreground hover:text-foreground transition-colors p-1"
              title="Sign out"
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
              <button onClick={() => setSidebarOpen(false)} className="p-1 text-muted-foreground hover:text-foreground">
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
              <button onClick={() => setSidebarOpen(true)} className="lg:hidden text-muted-foreground hover:text-foreground">
                <Menu className="w-5 h-5" />
              </button>
              <div className="hidden sm:flex items-center bg-muted rounded-lg px-3 py-1.5 w-80">
                <Search className="w-4 h-4 text-muted-foreground mr-2" />
                <span className="text-sm text-muted-foreground">Search meetings, transcripts, clips...</span>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setTheme(resolvedTheme === "dark" ? "light" : "dark")}
                className="text-muted-foreground hover:text-foreground transition-colors p-1.5 rounded-lg hover:bg-muted"
                title="Toggle theme"
              >
                {mounted && resolvedTheme === "dark" ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
              </button>
              <button className="relative text-muted-foreground hover:text-foreground transition-colors p-1.5">
                <Bell className="w-5 h-5" />
                <span className="absolute top-1 right-1 w-2 h-2 bg-brand-rose rounded-full" />
              </button>
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
