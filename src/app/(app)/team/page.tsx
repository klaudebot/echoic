"use client";

import { useState } from "react";
import { AppLink } from "@/components/DemoContext";
import {
  Users,
  Mail,
  UserPlus,
  Send,
} from "lucide-react";

export default function TeamPage() {
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteSent, setInviteSent] = useState(false);

  function handleInvite(e: React.FormEvent) {
    e.preventDefault();
    if (!inviteEmail.trim()) return;
    setInviteSent(true);
    setInviteEmail("");
    setTimeout(() => setInviteSent(false), 3000);
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-heading text-2xl text-foreground">Team</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Manage your team members and collaboration
        </p>
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

      {/* Empty state */}
      <div className="flex flex-col items-center justify-center py-16 text-center">
        <div className="w-16 h-16 rounded-2xl bg-brand-violet/10 flex items-center justify-center mb-5">
          <Users className="w-7 h-7 text-brand-violet" />
        </div>
        <h2 className="font-heading text-2xl text-foreground mb-2">Invite your team</h2>
        <p className="text-muted-foreground text-sm max-w-md">
          Add team members to collaborate on meeting notes, share clips, and track action items together. Use the invite form above to get started.
        </p>
      </div>
    </div>
  );
}
