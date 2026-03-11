"use client";

import { useState, useEffect, useCallback } from "react";
import {
  Users,
  Mail,
  Send,
  Clock,
  CheckCircle2,
  XCircle,
  MoreHorizontal,
  Trash2,
  RefreshCw,
} from "lucide-react";

// ─── Team member store (localStorage) ───

interface TeamMember {
  id: string;
  email: string;
  name?: string;
  status: "pending" | "accepted" | "declined";
  invitedAt: string;
  respondedAt?: string;
}

const TEAM_STORAGE_KEY = "reverbic_team";

function getTeamMembers(): TeamMember[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(TEAM_STORAGE_KEY);
    return raw ? (JSON.parse(raw) as TeamMember[]) : [];
  } catch {
    return [];
  }
}

function saveTeamMembers(members: TeamMember[]): void {
  if (typeof window === "undefined") return;
  localStorage.setItem(TEAM_STORAGE_KEY, JSON.stringify(members));
}

function addTeamMember(email: string): TeamMember {
  const members = getTeamMembers();
  const member: TeamMember = {
    id: `tm-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 6)}`,
    email: email.toLowerCase().trim(),
    status: "pending",
    invitedAt: new Date().toISOString(),
  };
  members.push(member);
  saveTeamMembers(members);
  return member;
}

function removeTeamMember(id: string): void {
  const members = getTeamMembers().filter((m) => m.id !== id);
  saveTeamMembers(members);
}

function resendInvite(id: string): void {
  const members = getTeamMembers();
  const idx = members.findIndex((m) => m.id === id);
  if (idx >= 0) {
    members[idx].invitedAt = new Date().toISOString();
    members[idx].status = "pending";
    members[idx].respondedAt = undefined;
    saveTeamMembers(members);
  }
}

// ─── Status badge ───

function StatusBadge({ status }: { status: TeamMember["status"] }) {
  switch (status) {
    case "pending":
      return (
        <span className="inline-flex items-center gap-1 px-2 py-0.5 text-xs font-medium rounded-full bg-brand-amber/10 text-brand-amber">
          <Clock className="w-3 h-3" /> Pending
        </span>
      );
    case "accepted":
      return (
        <span className="inline-flex items-center gap-1 px-2 py-0.5 text-xs font-medium rounded-full bg-brand-emerald/10 text-brand-emerald">
          <CheckCircle2 className="w-3 h-3" /> Accepted
        </span>
      );
    case "declined":
      return (
        <span className="inline-flex items-center gap-1 px-2 py-0.5 text-xs font-medium rounded-full bg-brand-rose/10 text-brand-rose">
          <XCircle className="w-3 h-3" /> Declined
        </span>
      );
  }
}

function timeAgo(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "Just now";
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  return `${days}d ago`;
}

// ─── Page ───

export default function TeamPage() {
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteSent, setInviteSent] = useState(false);
  const [inviteError, setInviteError] = useState<string | null>(null);
  const [inviteLoading, setInviteLoading] = useState(false);
  const [members, setMembers] = useState<TeamMember[]>([]);
  const [openMenu, setOpenMenu] = useState<string | null>(null);

  const loadMembers = useCallback(() => {
    setMembers(getTeamMembers());
  }, []);

  useEffect(() => {
    loadMembers();
  }, [loadMembers]);

  // Validate email has a proper TLD (e.g. .com, .io, .co.uk)
  function isValidEmail(email: string): boolean {
    return /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email);
  }

  async function handleInvite(e: React.FormEvent) {
    e.preventDefault();
    const email = inviteEmail.trim().toLowerCase();
    if (!email || inviteLoading) return;

    setInviteError(null);

    // Validate email format with TLD
    if (!isValidEmail(email)) {
      setInviteError("Please enter a valid email address (e.g. name@company.com)");
      return;
    }

    // Check for duplicate
    if (members.some((m) => m.email === email)) {
      setInviteError("This email has already been invited");
      return;
    }

    setInviteLoading(true);

    // Get current user info from localStorage
    let inviterName = "A teammate";
    let inviterEmail = "";
    try {
      const stored = localStorage.getItem("reverbic_user");
      if (stored) {
        const user = JSON.parse(stored);
        inviterName = user.name || inviterName;
        inviterEmail = user.email || "";
      }
    } catch {}

    // Add to local store
    addTeamMember(email);
    loadMembers();

    // Send the invite email
    try {
      const res = await fetch("/api/notify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type: "team-invite",
          to: email,
          inviterName,
          inviterEmail,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        console.error("[team] Invite email failed:", data);
      } else {
        console.log("[team] Invite email result:", data);
      }
    } catch (err) {
      console.error("[team] Invite email error:", err);
    }

    setInviteSent(true);
    setInviteEmail("");
    setInviteLoading(false);
    setTimeout(() => setInviteSent(false), 3000);
  }

  async function handleResend(member: TeamMember) {
    setOpenMenu(null);
    resendInvite(member.id);
    loadMembers();

    let inviterName = "A teammate";
    let inviterEmail = "";
    try {
      const stored = localStorage.getItem("reverbic_user");
      if (stored) {
        const user = JSON.parse(stored);
        inviterName = user.name || inviterName;
        inviterEmail = user.email || "";
      }
    } catch {}

    try {
      await fetch("/api/notify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type: "team-invite",
          to: member.email,
          inviterName,
          inviterEmail,
        }),
      });
    } catch {}
  }

  function handleRemove(id: string) {
    setOpenMenu(null);
    removeTeamMember(id);
    loadMembers();
  }

  const pendingCount = members.filter((m) => m.status === "pending").length;
  const acceptedCount = members.filter((m) => m.status === "accepted").length;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-heading text-2xl text-foreground">Team</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Manage your team members and collaboration
        </p>
      </div>

      {/* Stats */}
      {members.length > 0 && (
        <div className="grid grid-cols-3 gap-3">
          <div className="bg-card border border-border rounded-xl p-4 text-center">
            <div className="text-2xl font-heading text-foreground">{members.length}</div>
            <div className="text-xs text-muted-foreground mt-0.5">Total Invited</div>
          </div>
          <div className="bg-card border border-border rounded-xl p-4 text-center">
            <div className="text-2xl font-heading text-brand-emerald">{acceptedCount}</div>
            <div className="text-xs text-muted-foreground mt-0.5">Accepted</div>
          </div>
          <div className="bg-card border border-border rounded-xl p-4 text-center">
            <div className="text-2xl font-heading text-brand-amber">{pendingCount}</div>
            <div className="text-xs text-muted-foreground mt-0.5">Pending</div>
          </div>
        </div>
      )}

      {/* Invite */}
      <div className="bg-card border border-border rounded-xl p-5">
        <h2 className="font-heading text-lg text-foreground mb-3">Invite Team Member</h2>
        <form onSubmit={handleInvite} className="flex gap-3">
          <div className="flex-1 relative">
            <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <input
              type="email"
              placeholder="colleague@company.com"
              value={inviteEmail}
              onChange={(e) => { setInviteEmail(e.target.value); setInviteError(null); }}
              pattern="[^\s@]+@[^\s@]+\.[^\s@]{2,}"
              title="Please include a domain extension (e.g. .com, .io)"
              className="w-full bg-background border border-border rounded-lg pl-9 pr-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-brand-violet/30"
            />
          </div>
          <button
            type="submit"
            disabled={inviteLoading}
            className="inline-flex items-center gap-2 px-4 py-2 bg-brand-violet text-white text-sm font-medium rounded-lg hover:bg-brand-violet/90 transition-colors disabled:opacity-50"
          >
            <Send className="w-4 h-4" />
            {inviteLoading ? "Sending..." : "Send Invite"}
          </button>
        </form>
        {inviteSent && (
          <p className="text-xs text-brand-emerald mt-2">Invite sent successfully!</p>
        )}
        {inviteError && (
          <p className="text-xs text-brand-rose mt-2">{inviteError}</p>
        )}
      </div>

      {/* Members list */}
      {members.length > 0 ? (
        <div className="bg-card border border-border rounded-xl overflow-hidden">
          <div className="px-5 py-3 border-b border-border">
            <h2 className="font-heading text-lg text-foreground">Team Members</h2>
          </div>
          <div className="divide-y divide-border">
            {members.map((member) => (
              <div key={member.id} className="flex items-center gap-4 px-5 py-4">
                {/* Avatar */}
                <div
                  className={`w-10 h-10 rounded-full flex items-center justify-center text-white font-semibold text-sm shrink-0 ${
                    member.status === "accepted"
                      ? "bg-gradient-to-br from-brand-emerald to-emerald-400"
                      : member.status === "declined"
                        ? "bg-gradient-to-br from-brand-rose to-rose-400"
                        : "bg-gradient-to-br from-brand-violet to-violet-400"
                  }`}
                >
                  {member.email.charAt(0).toUpperCase()}
                </div>

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-foreground truncate">
                    {member.name || member.email}
                  </p>
                  {member.name && (
                    <p className="text-xs text-muted-foreground truncate">{member.email}</p>
                  )}
                  <p className="text-[11px] text-muted-foreground mt-0.5">
                    Invited {timeAgo(member.invitedAt)}
                  </p>
                </div>

                {/* Status */}
                <StatusBadge status={member.status} />

                {/* Actions menu */}
                <div className="relative">
                  <button
                    onClick={() => setOpenMenu(openMenu === member.id ? null : member.id)}
                    className="p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
                  >
                    <MoreHorizontal className="w-4 h-4" />
                  </button>
                  {openMenu === member.id && (
                    <>
                      <div className="fixed inset-0 z-10" onClick={() => setOpenMenu(null)} />
                      <div className="absolute right-0 top-full mt-1 z-20 w-44 bg-card border border-border rounded-lg shadow-lg py-1">
                        {member.status === "pending" && (
                          <button
                            onClick={() => handleResend(member)}
                            className="flex items-center gap-2 w-full px-3 py-2 text-sm text-foreground hover:bg-muted transition-colors"
                          >
                            <RefreshCw className="w-3.5 h-3.5" />
                            Resend Invite
                          </button>
                        )}
                        <button
                          onClick={() => handleRemove(member.id)}
                          className="flex items-center gap-2 w-full px-3 py-2 text-sm text-brand-rose hover:bg-brand-rose/5 transition-colors"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                          Remove
                        </button>
                      </div>
                    </>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      ) : (
        /* Empty state */
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <div className="w-16 h-16 rounded-2xl bg-brand-violet/10 flex items-center justify-center mb-5">
            <Users className="w-7 h-7 text-brand-violet" />
          </div>
          <h2 className="font-heading text-2xl text-foreground mb-2">Invite your team</h2>
          <p className="text-muted-foreground text-sm max-w-md">
            Add team members to collaborate on meeting notes, share clips, and track action items together. Use the invite form above to get started.
          </p>
        </div>
      )}
    </div>
  );
}
