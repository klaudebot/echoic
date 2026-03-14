"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { useUser, type OrgRole } from "@/components/UserContext";
import { getSupabaseBrowser } from "@/lib/supabase/client";
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
  Shield,
  ShieldCheck,
  Crown,
  Eye,
  ChevronDown,
  ArrowRightLeft,
  LogOut,
  Loader2,
} from "lucide-react";

// ─── Types ───

interface TeamMember {
  id: string;
  userId?: string;
  email: string;
  name?: string;
  role: string;
  status: "pending" | "accepted" | "declined" | "expired";
  invitedAt: string;
  respondedAt?: string;
}

// ─── Role badge ───

const ROLE_CONFIG: Record<string, { label: string; icon: typeof Crown; color: string }> = {
  owner: { label: "Owner", icon: Crown, color: "text-brand-amber" },
  admin: { label: "Admin", icon: ShieldCheck, color: "text-brand-violet" },
  member: { label: "Member", icon: Shield, color: "text-muted-foreground" },
  viewer: { label: "Viewer", icon: Eye, color: "text-muted-foreground" },
};

function RoleBadge({ role }: { role: string }) {
  const config = ROLE_CONFIG[role] ?? ROLE_CONFIG.member;
  const Icon = config.icon;
  return (
    <span className={`inline-flex items-center gap-1 text-xs font-medium ${config.color}`}>
      <Icon className="w-3 h-3" />
      {config.label}
    </span>
  );
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
          <CheckCircle2 className="w-3 h-3" /> Active
        </span>
      );
    case "declined":
      return (
        <span className="inline-flex items-center gap-1 px-2 py-0.5 text-xs font-medium rounded-full bg-brand-rose/10 text-brand-rose">
          <XCircle className="w-3 h-3" /> Declined
        </span>
      );
    case "expired":
      return (
        <span className="inline-flex items-center gap-1 px-2 py-0.5 text-xs font-medium rounded-full bg-muted-foreground/10 text-muted-foreground">
          <Clock className="w-3 h-3" /> Expired
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

// ─── Role Change Dropdown ───

function RoleDropdown({
  member,
  callerRole,
  onChange,
}: {
  member: TeamMember;
  callerRole: OrgRole | null;
  onChange: (newRole: string) => void;
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [open]);

  // Determine which roles this caller can assign
  const availableRoles: string[] = [];
  if (callerRole === "owner") {
    availableRoles.push("admin", "member", "viewer");
  } else if (callerRole === "admin") {
    // Admins can only set member/viewer, can't promote to admin
    availableRoles.push("member", "viewer");
  }

  // Remove current role from options
  const options = availableRoles.filter((r) => r !== member.role);

  if (options.length === 0) return <RoleBadge role={member.role} />;

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setOpen(!open)}
        className="inline-flex items-center gap-1 text-xs font-medium hover:bg-muted px-2 py-1 rounded-md transition-colors"
      >
        <RoleBadge role={member.role} />
        <ChevronDown className="w-3 h-3 text-muted-foreground" />
      </button>
      {open && (
        <div className="absolute right-0 top-full mt-1 w-36 bg-card border border-border rounded-lg shadow-lg z-50 py-1">
          {options.map((role) => {
            const config = ROLE_CONFIG[role] ?? ROLE_CONFIG.member;
            const Icon = config.icon;
            return (
              <button
                key={role}
                onClick={() => { onChange(role); setOpen(false); }}
                className="flex items-center gap-2 w-full px-3 py-2 text-sm text-foreground hover:bg-muted transition-colors"
              >
                <Icon className={`w-3.5 h-3.5 ${config.color}`} />
                {config.label}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}

// ─── Transfer Ownership Modal ───

function TransferOwnershipModal({
  members,
  onTransfer,
  onClose,
}: {
  members: TeamMember[];
  onTransfer: (memberId: string) => void;
  onClose: () => void;
}) {
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [confirming, setConfirming] = useState(false);

  const eligibleMembers = members.filter(
    (m) => m.status === "accepted" && m.role !== "owner"
  );

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="bg-card border border-border rounded-2xl shadow-xl w-full max-w-md p-6">
        <h2 className="font-heading text-lg text-foreground mb-1">Transfer Ownership</h2>
        <p className="text-sm text-muted-foreground mb-4">
          Choose a team member to become the new owner. You&apos;ll become an admin.
        </p>

        {eligibleMembers.length === 0 ? (
          <p className="text-sm text-muted-foreground py-4 text-center">
            No eligible members. Invite someone and wait for them to accept first.
          </p>
        ) : (
          <div className="space-y-2 max-h-60 overflow-y-auto mb-4">
            {eligibleMembers.map((m) => (
              <button
                key={m.id}
                onClick={() => setSelectedId(m.id)}
                className={`w-full flex items-center gap-3 px-3 py-3 rounded-xl border transition-colors ${
                  selectedId === m.id
                    ? "border-brand-violet bg-brand-violet/5"
                    : "border-border hover:border-brand-violet/30"
                }`}
              >
                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-brand-violet to-violet-400 flex items-center justify-center text-white text-xs font-bold shrink-0">
                  {(m.name || m.email).charAt(0).toUpperCase()}
                </div>
                <div className="flex-1 min-w-0 text-left">
                  <p className="text-sm font-medium text-foreground truncate">
                    {m.name || m.email}
                  </p>
                  {m.name && (
                    <p className="text-xs text-muted-foreground truncate">{m.email}</p>
                  )}
                </div>
                <RoleBadge role={m.role} />
              </button>
            ))}
          </div>
        )}

        {!confirming ? (
          <div className="flex items-center gap-3">
            <button
              onClick={() => setConfirming(true)}
              disabled={!selectedId}
              className="flex-1 px-4 py-2.5 bg-brand-violet text-white rounded-xl text-sm font-medium hover:bg-brand-violet/90 transition-colors disabled:opacity-50"
            >
              Transfer Ownership
            </button>
            <button
              onClick={onClose}
              className="flex-1 px-4 py-2.5 border border-border text-foreground rounded-xl text-sm font-medium hover:bg-muted transition-colors"
            >
              Cancel
            </button>
          </div>
        ) : (
          <div className="space-y-3">
            <div className="rounded-xl border border-brand-amber/30 bg-brand-amber/5 p-3">
              <p className="text-sm font-medium text-foreground">Are you sure?</p>
              <p className="text-xs text-muted-foreground mt-1">
                This will make them the owner and demote you to admin. This action is irreversible unless the new owner transfers it back.
              </p>
            </div>
            <div className="flex items-center gap-3">
              <button
                onClick={() => {
                  if (selectedId) onTransfer(selectedId);
                }}
                className="flex-1 px-4 py-2.5 bg-brand-rose text-white rounded-xl text-sm font-medium hover:bg-brand-rose/90 transition-colors"
              >
                Confirm Transfer
              </button>
              <button
                onClick={() => setConfirming(false)}
                className="flex-1 px-4 py-2.5 border border-border text-foreground rounded-xl text-sm font-medium hover:bg-muted transition-colors"
              >
                Go Back
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Page ───

export default function TeamPage() {
  const { user, refreshPlan } = useUser();
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteRole, setInviteRole] = useState<string>("member");
  const [inviteSent, setInviteSent] = useState(false);
  const [inviteError, setInviteError] = useState<string | null>(null);
  const [inviteLoading, setInviteLoading] = useState(false);
  const [members, setMembers] = useState<TeamMember[]>([]);
  const [owner, setOwner] = useState<TeamMember | null>(null);
  const [openMenu, setOpenMenu] = useState<string | null>(null);
  const [menuPos, setMenuPos] = useState<{ top: number; left: number } | null>(null);
  const menuBtnRefs = useRef<Map<string, HTMLButtonElement>>(new Map());
  const [resendingId, setResendingId] = useState<string | null>(null);
  const [resendResult, setResendResult] = useState<{ id: string; ok: boolean } | null>(null);
  const [showTransfer, setShowTransfer] = useState(false);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [confirmRemove, setConfirmRemove] = useState<string | null>(null);
  const [orgName, setOrgName] = useState<string>("");

  const callerRole = user?.orgRole ?? null;
  const isOwnerOrAdmin = callerRole === "owner" || callerRole === "admin";

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const sb = getSupabaseBrowser() as any;

  const loadMembers = useCallback(async () => {
    if (!user?.organizationId) return;

    // Fetch org name
    const { data: org } = await sb
      .from("organizations")
      .select("name")
      .eq("id", user.organizationId)
      .single();
    if (org) setOrgName(org.name);

    // Fetch ALL org members (including current user)
    const { data: orgMembers } = await sb
      .from("organization_members")
      .select("id, user_id, role, joined_at")
      .eq("organization_id", user.organizationId) as {
      data: { id: string; user_id: string; role: string; joined_at: string }[] | null;
    };

    const { data: invites } = await sb
      .from("team_invites")
      .select("*")
      .eq("organization_id", user.organizationId)
      .in("status", ["pending", "declined", "expired"]) as {
      data: {
        id: string;
        email: string;
        role: string;
        status: string;
        invited_at: string;
        responded_at: string | null;
      }[] | null;
    };

    const memberList: TeamMember[] = [];

    // Add org members (accepted) — fetch profiles separately
    if (orgMembers && orgMembers.length > 0) {
      const userIds = orgMembers.map((m) => m.user_id);
      const { data: profiles } = await sb
        .from("profiles")
        .select("id, email, full_name")
        .in("id", userIds) as {
        data: { id: string; email: string; full_name: string | null }[] | null;
      };
      const profileMap = new Map(
        (profiles ?? []).map((p) => [p.id, p])
      );

      for (const m of orgMembers) {
        const profile = profileMap.get(m.user_id);
        memberList.push({
          id: m.id,
          userId: m.user_id,
          email: profile?.email || "",
          name: profile?.full_name || undefined,
          role: m.role,
          status: "accepted",
          invitedAt: m.joined_at,
        });
      }
    }

    // Add pending/declined invites
    if (invites) {
      for (const inv of invites) {
        memberList.push({
          id: inv.id,
          email: inv.email,
          role: inv.role,
          status: inv.status as TeamMember["status"],
          invitedAt: inv.invited_at,
          respondedAt: inv.responded_at || undefined,
        });
      }
    }

    // Separate owner from other members
    const ownerMember = memberList.find((m) => m.role === "owner") ?? null;
    const otherMembers = memberList.filter((m) => m.role !== "owner");

    setOwner(ownerMember);
    setMembers(otherMembers);
  }, [user?.organizationId]);

  useEffect(() => {
    loadMembers();
  }, [loadMembers]);

  function isValidEmail(email: string): boolean {
    return /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email);
  }

  async function handleInvite(e: React.FormEvent) {
    e.preventDefault();
    const email = inviteEmail.trim().toLowerCase();
    if (!email || inviteLoading || !user?.organizationId) return;

    setInviteError(null);

    if (!isValidEmail(email)) {
      setInviteError("Please enter a valid email address (e.g. name@company.com)");
      return;
    }

    // Check for duplicate
    const allMembers = [...members, ...(owner ? [owner] : [])];
    if (allMembers.some((m) => m.email === email)) {
      setInviteError("This email is already on the team");
      return;
    }

    // Check member limit
    const membersLimit = user.orgPlan?.membersLimit ?? 1;
    if (membersLimit !== -1) {
      const activeCount =
        allMembers.filter(
          (m) => m.status === "accepted" || m.status === "pending"
        ).length;
      if (activeCount >= membersLimit) {
        setInviteError(
          `Your plan allows ${membersLimit} team member${membersLimit === 1 ? "" : "s"}. Upgrade to invite more.`
        );
        return;
      }
    }

    setInviteLoading(true);

    const token = crypto.randomUUID();
    const expiresAt = new Date(
      Date.now() + 7 * 24 * 60 * 60 * 1000
    ).toISOString();

    try {
      const { data: inserted, error } = await sb.from("team_invites").insert({
        organization_id: user.organizationId,
        invited_by: user.id,
        email,
        role: inviteRole,
        status: "pending",
        token,
        expires_at: expiresAt,
      }).select("id").single();

      if (error || !inserted) {
        console.error("[team] Invite insert failed:", error);
        setInviteError(
          error?.message?.includes("unique")
            ? "This email already has a pending invite. Try resending from the menu."
            : "Failed to create invite. Please try again."
        );
        setInviteLoading(false);
        return;
      }

      // Send invite email
      let emailOk = false;
      try {
        const res = await fetch("/api/notify", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            type: "team-invite",
            to: email,
            inviterName: user.name,
            inviterEmail: user.email,
            inviteToken: token,
            inviteRole,
          }),
        });
        if (!res.ok) {
          const data = await res.json().catch(() => ({}));
          console.error("[team] Invite email failed:", data);
        } else {
          emailOk = true;
        }
      } catch (err) {
        console.error("[team] Invite email error:", err);
      }

      await loadMembers();
      if (emailOk) {
        setInviteSent(true);
      } else {
        setInviteError(
          "Invite created but email failed to send. Try resending from the menu."
        );
      }
      setInviteEmail("");
      setTimeout(() => setInviteSent(false), 3000);
    } catch (err) {
      console.error("[team] Invite error:", err);
      setInviteError("Something went wrong. Please try again.");
    } finally {
      setInviteLoading(false);
    }
  }

  async function handleResend(member: TeamMember) {
    setOpenMenu(null);
    if (!user) return;

    setResendingId(member.id);
    setResendResult(null);

    const newToken = crypto.randomUUID();
    await sb
      .from("team_invites")
      .update({
        status: "pending",
        token: newToken,
        invited_at: new Date().toISOString(),
        responded_at: null,
        expires_at: new Date(
          Date.now() + 7 * 24 * 60 * 60 * 1000
        ).toISOString(),
      })
      .eq("id", member.id);

    // Re-send email
    let emailOk = false;
    try {
      const res = await fetch("/api/notify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type: "team-invite",
          to: member.email,
          inviterName: user.name,
          inviterEmail: user.email,
          inviteToken: newToken,
        }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        console.error("[team] Resend invite email failed:", data);
      } else {
        emailOk = true;
      }
    } catch (err) {
      console.error("[team] Resend invite email error:", err);
    }

    setResendingId(null);
    setResendResult({ id: member.id, ok: emailOk });
    setTimeout(() => setResendResult(null), 3000);
    await loadMembers();
  }

  async function handleRemove(memberId: string, isInvite: boolean) {
    setOpenMenu(null);
    setConfirmRemove(null);
    setActionLoading(memberId);

    if (isInvite) {
      // Delete invite directly (client-side, RLS allows admin)
      await sb.from("team_invites").delete().eq("id", memberId);
    } else {
      // Use server API for proper authorization
      const res = await fetch(`/api/team/members/${memberId}`, {
        method: "DELETE",
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        console.error("[team] Remove member failed:", data);
      }
    }

    setActionLoading(null);
    await loadMembers();
  }

  async function handleRoleChange(memberId: string, newRole: string) {
    setActionLoading(memberId);
    const res = await fetch(`/api/team/members/${memberId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ role: newRole }),
    });
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      console.error("[team] Role change failed:", data);
    }
    setActionLoading(null);
    await loadMembers();
  }

  async function handleTransferOwnership(memberId: string) {
    setShowTransfer(false);
    setActionLoading("transfer");
    const res = await fetch("/api/team/transfer-ownership", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ memberId }),
    });
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      console.error("[team] Transfer ownership failed:", data);
    }
    setActionLoading(null);
    await refreshPlan();
    await loadMembers();
  }

  async function handleLeaveTeam() {
    // Find current user's membership ID
    const myMembership = [...members, ...(owner ? [owner] : [])].find(
      (m) => m.userId === user?.id
    );
    if (!myMembership) return;

    setActionLoading("leave");
    const res = await fetch(`/api/team/members/${myMembership.id}`, {
      method: "DELETE",
    });
    if (res.ok) {
      window.location.href = "/dashboard";
    } else {
      const data = await res.json().catch(() => ({}));
      console.error("[team] Leave team failed:", data);
    }
    setActionLoading(null);
  }

  const pendingCount = members.filter((m) => m.status === "pending").length;
  const acceptedCount =
    members.filter((m) => m.status === "accepted").length + (owner ? 1 : 0);
  const totalSeats = user?.orgPlan?.membersLimit ?? 1;
  const seatLabel =
    totalSeats === -1 ? "Unlimited" : `${acceptedCount + pendingCount} / ${totalSeats}`;

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="font-heading text-2xl text-foreground">Team</h1>
          <p className="text-sm text-muted-foreground mt-1">
            {orgName ? `Manage ${orgName}` : "Manage your team members and collaboration"}
          </p>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          {callerRole === "owner" && (
            <button
              onClick={() => setShowTransfer(true)}
              disabled={actionLoading === "transfer"}
              className="inline-flex items-center gap-1.5 px-3 py-2 border border-border text-foreground rounded-xl text-sm font-medium hover:bg-muted transition-colors disabled:opacity-50"
            >
              <ArrowRightLeft className="w-3.5 h-3.5" />
              Transfer Ownership
            </button>
          )}
          {callerRole !== "owner" && (
            <button
              onClick={handleLeaveTeam}
              disabled={actionLoading === "leave"}
              className="inline-flex items-center gap-1.5 px-3 py-2 border border-border text-foreground rounded-xl text-sm font-medium hover:bg-muted transition-colors disabled:opacity-50"
            >
              {actionLoading === "leave" ? (
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
              ) : (
                <LogOut className="w-3.5 h-3.5" />
              )}
              Leave Team
            </button>
          )}
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-3">
        <div className="bg-card border border-border rounded-xl p-4 text-center">
          <div className="text-2xl font-heading text-foreground">{acceptedCount}</div>
          <div className="text-xs text-muted-foreground mt-0.5">Active Members</div>
        </div>
        <div className="bg-card border border-border rounded-xl p-4 text-center">
          <div className="text-2xl font-heading text-brand-amber">{pendingCount}</div>
          <div className="text-xs text-muted-foreground mt-0.5">Pending Invites</div>
        </div>
        <div className="bg-card border border-border rounded-xl p-4 text-center">
          <div className="text-2xl font-heading text-brand-violet">{seatLabel}</div>
          <div className="text-xs text-muted-foreground mt-0.5">Seats Used</div>
        </div>
      </div>

      {/* Invite — only visible to owner/admin */}
      {isOwnerOrAdmin && (
        <div className="bg-card border border-border rounded-xl p-5">
          <h2 className="font-heading text-lg text-foreground mb-3">
            Invite Team Member
          </h2>
          <form onSubmit={handleInvite} className="flex gap-3">
            <div className="flex-1 relative">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <input
                type="email"
                placeholder="colleague@company.com"
                value={inviteEmail}
                onChange={(e) => {
                  setInviteEmail(e.target.value);
                  setInviteError(null);
                }}
                pattern="[^\s@]+@[^\s@]+\.[^\s@]{2,}"
                title="Please include a domain extension (e.g. .com, .io)"
                className="w-full bg-background border border-border rounded-lg pl-9 pr-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-brand-violet/30"
              />
            </div>
            {/* Role selector */}
            <select
              value={inviteRole}
              onChange={(e) => setInviteRole(e.target.value)}
              className="bg-background border border-border rounded-lg px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-brand-violet/30"
            >
              {callerRole === "owner" && (
                <option value="admin">Admin</option>
              )}
              <option value="member">Member</option>
              <option value="viewer">Viewer</option>
            </select>
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
            <p className="text-xs text-brand-emerald mt-2">
              Invite sent successfully!
            </p>
          )}
          {inviteError && (
            <p className="text-xs text-brand-rose mt-2">{inviteError}</p>
          )}
        </div>
      )}

      {/* Owner card */}
      {owner && (
        <div className="bg-card border border-border rounded-xl overflow-hidden">
          <div className="px-5 py-3 border-b border-border">
            <h2 className="font-heading text-lg text-foreground">
              Organization Owner
            </h2>
          </div>
          <div className="flex items-center gap-4 px-5 py-4">
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-brand-amber to-amber-400 flex items-center justify-center text-white font-semibold text-sm shrink-0">
              {(owner.name || owner.email).charAt(0).toUpperCase()}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-foreground truncate">
                {owner.name || owner.email}
                {owner.userId === user?.id && (
                  <span className="text-xs text-muted-foreground ml-2">(you)</span>
                )}
              </p>
              {owner.name && (
                <p className="text-xs text-muted-foreground truncate">
                  {owner.email}
                </p>
              )}
            </div>
            <RoleBadge role="owner" />
          </div>
        </div>
      )}

      {/* Members list */}
      {members.length > 0 ? (
        <div className="bg-card border border-border rounded-xl overflow-hidden">
          <div className="px-5 py-3 border-b border-border">
            <h2 className="font-heading text-lg text-foreground">
              Team Members
            </h2>
          </div>
          <div className="divide-y divide-border">
            {members.map((member) => (
              <div
                key={member.id}
                className={`flex items-center gap-4 px-5 py-4 ${actionLoading === member.id ? "opacity-50" : ""}`}
              >
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
                  {(member.name || member.email).charAt(0).toUpperCase()}
                </div>

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-foreground truncate">
                    {member.name || member.email}
                    {member.userId === user?.id && (
                      <span className="text-xs text-muted-foreground ml-2">
                        (you)
                      </span>
                    )}
                  </p>
                  {member.name && (
                    <p className="text-xs text-muted-foreground truncate">
                      {member.email}
                    </p>
                  )}
                  <p className="text-[11px] text-muted-foreground mt-0.5">
                    {resendingId === member.id ? (
                      <span className="text-brand-violet">
                        Resending invite...
                      </span>
                    ) : resendResult?.id === member.id ? (
                      resendResult.ok ? (
                        <span className="text-brand-emerald">
                          Invite resent!
                        </span>
                      ) : (
                        <span className="text-brand-rose">
                          Email failed — check email config
                        </span>
                      )
                    ) : member.status === "accepted" ? (
                      <>Joined {timeAgo(member.invitedAt)}</>
                    ) : (
                      <>Invited {timeAgo(member.invitedAt)}</>
                    )}
                  </p>
                </div>

                {/* Role (editable for owner/admin if member is accepted) */}
                {member.status === "accepted" && isOwnerOrAdmin && member.userId !== user?.id ? (
                  <RoleDropdown
                    member={member}
                    callerRole={callerRole}
                    onChange={(role) => handleRoleChange(member.id, role)}
                  />
                ) : (
                  <RoleBadge role={member.role} />
                )}

                {/* Status */}
                {member.status !== "accepted" && (
                  <StatusBadge status={member.status} />
                )}

                {/* Actions menu — only for owner/admin */}
                {isOwnerOrAdmin && member.userId !== user?.id && (
                  <div>
                    <button
                      ref={(el) => {
                        if (el) menuBtnRefs.current.set(member.id, el);
                      }}
                      onClick={() => {
                        if (openMenu === member.id) {
                          setOpenMenu(null);
                          setMenuPos(null);
                        } else {
                          const btn = menuBtnRefs.current.get(member.id);
                          if (btn) {
                            const rect = btn.getBoundingClientRect();
                            setMenuPos({
                              top: rect.bottom + 4,
                              left: rect.right - 176,
                            });
                          }
                          setOpenMenu(member.id);
                          setConfirmRemove(null);
                        }
                      }}
                      className="p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
                    >
                      <MoreHorizontal className="w-4 h-4" />
                    </button>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      ) : (
        !owner && (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <div className="w-16 h-16 rounded-2xl bg-brand-violet/10 flex items-center justify-center mb-5">
              <Users className="w-7 h-7 text-brand-violet" />
            </div>
            <h2 className="font-heading text-2xl text-foreground mb-2">
              Invite your team
            </h2>
            <p className="text-muted-foreground text-sm max-w-md">
              Add team members to collaborate on meeting transcripts, action
              items, and decisions together.
              {isOwnerOrAdmin && " Use the invite form above to get started."}
            </p>
          </div>
        )
      )}

      {/* Floating actions menu */}
      {openMenu &&
        menuPos &&
        (() => {
          const member = members.find((m) => m.id === openMenu);
          if (!member) return null;
          const isInvite = member.status !== "accepted";
          return (
            <>
              <div
                className="fixed inset-0 z-40"
                onClick={() => {
                  setOpenMenu(null);
                  setMenuPos(null);
                  setConfirmRemove(null);
                }}
              />
              <div
                className="fixed z-50 w-48 bg-card border border-border rounded-lg shadow-lg overflow-hidden"
                style={{
                  top: menuPos.top,
                  left: Math.max(8, menuPos.left),
                }}
              >
                {confirmRemove === member.id ? (
                  <div className="p-3 space-y-2">
                    <p className="text-xs font-medium text-foreground">
                      Remove {member.name || member.email}?
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {isInvite
                        ? "This will cancel the invitation."
                        : "They will lose access to all team meetings and data."}
                    </p>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => handleRemove(member.id, isInvite)}
                        className="flex-1 px-3 py-1.5 text-xs font-medium rounded-md bg-brand-rose text-white hover:bg-brand-rose/90 transition-colors"
                      >
                        Remove
                      </button>
                      <button
                        onClick={() => setConfirmRemove(null)}
                        className="flex-1 px-3 py-1.5 text-xs font-medium rounded-md bg-muted text-foreground hover:bg-muted/80 transition-colors"
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="py-1">
                    {(member.status === "pending" ||
                      member.status === "expired") && (
                      <button
                        onClick={() => handleResend(member)}
                        disabled={resendingId === member.id}
                        className="flex items-center gap-2 w-full px-3 py-2 text-sm text-foreground hover:bg-muted transition-colors disabled:opacity-50"
                      >
                        <RefreshCw
                          className={`w-3.5 h-3.5 ${resendingId === member.id ? "animate-spin" : ""}`}
                        />
                        {resendingId === member.id
                          ? "Sending..."
                          : "Resend Invite"}
                      </button>
                    )}
                    <button
                      onClick={() => setConfirmRemove(member.id)}
                      className="flex items-center gap-2 w-full px-3 py-2 text-sm text-brand-rose hover:bg-brand-rose/5 transition-colors"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      {isInvite ? "Cancel Invite" : "Remove Member"}
                    </button>
                  </div>
                )}
              </div>
            </>
          );
        })()}

      {/* Transfer Ownership Modal */}
      {showTransfer && (
        <TransferOwnershipModal
          members={members}
          onTransfer={handleTransferOwnership}
          onClose={() => setShowTransfer(false)}
        />
      )}
    </div>
  );
}
