"use client";

import { useState } from "react";
import {
  Users,
  Mail,
  Calendar,
  ListChecks,
  UserPlus,
  Scissors,
  Send,
} from "lucide-react";
import { demoMeetings, demoSmartClips, getAllActionItems } from "@/lib/demo-data";

interface TeamMember {
  name: string;
  email: string;
  role: string;
  meetingsAttended: number;
  actionItems: number;
  avatar: string;
}

function buildTeamMembers(): TeamMember[] {
  const memberMap = new Map<string, TeamMember>();
  const allItems = getAllActionItems();

  demoMeetings.forEach((m) => {
    m.participants.forEach((p) => {
      if (p.name === "You" || p.name.startsWith("Team")) return;
      const existing = memberMap.get(p.name);
      if (existing) {
        existing.meetingsAttended += 1;
      } else {
        memberMap.set(p.name, {
          name: p.name,
          email: p.email ?? `${p.name.toLowerCase().replace(/\s/g, ".")}@company.com`,
          role: p.role ?? "Team Member",
          meetingsAttended: 1,
          actionItems: allItems.filter((a) => a.assignee === p.name).length,
          avatar: p.name.split(" ").map((n) => n[0]).join(""),
        });
      }
    });
  });

  return Array.from(memberMap.values()).sort((a, b) => b.meetingsAttended - a.meetingsAttended);
}

export default function TeamPage() {
  const members = buildTeamMembers();
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteSent, setInviteSent] = useState(false);

  const sharedClipsCount = demoSmartClips.filter((c) => c.shared).length;

  // This week's meetings (demo: count all)
  const thisWeekMeetings = demoMeetings.length;

  function handleInvite(e: React.FormEvent) {
    e.preventDefault();
    if (!inviteEmail.trim()) return;
    setInviteSent(true);
    setInviteEmail("");
    setTimeout(() => setInviteSent(false), 3000);
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="font-heading text-2xl text-foreground">Team</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Manage your team members and collaboration
          </p>
        </div>
      </div>

      {/* Team Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {[
          { label: "Team Members", value: members.length, icon: Users, color: "text-brand-violet" },
          { label: "Meetings This Week", value: thisWeekMeetings, icon: Calendar, color: "text-brand-cyan" },
          { label: "Shared Clips", value: sharedClipsCount, icon: Scissors, color: "text-brand-emerald" },
        ].map((stat) => (
          <div key={stat.label} className="bg-card border border-border rounded-xl p-4 flex items-center gap-3">
            <div className={`w-10 h-10 rounded-lg bg-muted flex items-center justify-center ${stat.color}`}>
              <stat.icon className="w-5 h-5" />
            </div>
            <div>
              <div className="text-2xl font-semibold text-foreground">{stat.value}</div>
              <div className="text-xs text-muted-foreground">{stat.label}</div>
            </div>
          </div>
        ))}
      </div>

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
              onChange={(e) => setInviteEmail(e.target.value)}
              className="w-full bg-background border border-border rounded-lg pl-9 pr-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-brand-violet/30"
            />
          </div>
          <button
            type="submit"
            className="inline-flex items-center gap-2 px-4 py-2 bg-brand-violet text-white text-sm font-medium rounded-lg hover:bg-brand-violet/90 transition-colors"
          >
            <Send className="w-4 h-4" />
            Send Invite
          </button>
        </form>
        {inviteSent && (
          <p className="text-xs text-brand-emerald mt-2">Invite sent successfully!</p>
        )}
      </div>

      {/* Team Members Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        {members.map((member) => (
          <div key={member.name} className="bg-card border border-border rounded-xl p-4 space-y-3">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-brand-violet/10 flex items-center justify-center text-sm font-medium text-brand-violet shrink-0">
                {member.avatar}
              </div>
              <div className="min-w-0">
                <div className="text-sm font-semibold text-foreground truncate">{member.name}</div>
                <div className="text-xs text-muted-foreground truncate">{member.role}</div>
              </div>
            </div>

            <div className="text-xs text-muted-foreground flex items-center gap-1">
              <Mail className="w-3 h-3" />
              {member.email}
            </div>

            <div className="grid grid-cols-2 gap-3 pt-2 border-t border-border">
              <div className="flex items-center gap-2">
                <Calendar className="w-3.5 h-3.5 text-brand-cyan" />
                <div>
                  <div className="text-sm font-semibold text-foreground">{member.meetingsAttended}</div>
                  <div className="text-[10px] text-muted-foreground">Meetings</div>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <ListChecks className="w-3.5 h-3.5 text-brand-amber" />
                <div>
                  <div className="text-sm font-semibold text-foreground">{member.actionItems}</div>
                  <div className="text-[10px] text-muted-foreground">Action Items</div>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
