"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { getSupabaseBrowser } from "@/lib/supabase/client";
import { Users, CheckCircle2, XCircle, Clock, Loader2, AlertTriangle } from "lucide-react";

interface InviteData {
  id: string;
  email: string;
  role: string;
  status: string;
  expires_at: string;
  orgName: string;
  inviterName: string;
  inviterEmail: string;
}

export default function InviteAcceptPage() {
  const { token } = useParams<{ token: string }>();
  const router = useRouter();
  const [invite, setInvite] = useState<InviteData | null>(null);
  const [loading, setLoading] = useState(true);
  const [accepting, setAccepting] = useState(false);
  const [declining, setDeclining] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [declined, setDeclined] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [userEmail, setUserEmail] = useState<string | null>(null);
  const [emailMismatch, setEmailMismatch] = useState(false);

  useEffect(() => {
    async function load() {
      const supabase = getSupabaseBrowser();

      // Check auth state
      const { data: { user } } = await supabase.auth.getUser();
      setIsLoggedIn(!!user);
      setUserEmail(user?.email ?? null);

      // Fetch invite details (using admin-accessible endpoint or direct query)
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { data: inviteData, error: inviteError } = await (supabase as any)
        .from("team_invites")
        .select("id, email, role, status, expires_at, organization_id, invited_by, organizations(name), profiles!team_invites_invited_by_fkey(full_name, email)")
        .eq("token", token)
        .single();

      if (inviteError || !inviteData) {
        setError("This invitation link is invalid or has already been used.");
        setLoading(false);
        return;
      }

      // Check if expired
      if (inviteData.expires_at && new Date(inviteData.expires_at) < new Date()) {
        setError("This invitation has expired. Ask the person who invited you to send a new one.");
        setLoading(false);
        return;
      }

      if (inviteData.status !== "pending") {
        setError(`This invitation has already been ${inviteData.status}.`);
        setLoading(false);
        return;
      }

      // Check email mismatch
      if (user && user.email?.toLowerCase() !== inviteData.email.toLowerCase()) {
        setEmailMismatch(true);
      }

      setInvite({
        id: inviteData.id,
        email: inviteData.email,
        role: inviteData.role,
        status: inviteData.status,
        expires_at: inviteData.expires_at,
        orgName: inviteData.organizations?.name ?? "a team",
        inviterName: inviteData.profiles?.full_name ?? "A teammate",
        inviterEmail: inviteData.profiles?.email ?? "",
      });
      setLoading(false);
    }
    load();
  }, [token]);

  async function handleAccept() {
    if (!isLoggedIn) {
      // Redirect to sign-up with invite token
      router.push(`/sign-up?invite_token=${token}&email=${encodeURIComponent(invite?.email ?? "")}`);
      return;
    }

    setAccepting(true);
    setError(null);

    try {
      const res = await fetch("/api/team/accept-invite", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Failed to accept invitation");
        setAccepting(false);
        return;
      }

      setSuccess(true);
      setTimeout(() => router.push("/dashboard"), 2000);
    } catch {
      setError("Something went wrong. Please try again.");
      setAccepting(false);
    }
  }

  async function handleDecline() {
    setDeclining(true);
    try {
      if (isLoggedIn) {
        // Use server API for proper audit logging
        await fetch("/api/team/decline-invite", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ token }),
        });
      } else {
        // Unauthenticated — direct update (RLS allows viewing own invite by email)
        const supabase = getSupabaseBrowser();
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        await (supabase as any)
          .from("team_invites")
          .update({ status: "declined", responded_at: new Date().toISOString() })
          .eq("token", token);
      }
      setDeclined(true);
    } catch {
      setError("Failed to decline invitation.");
    }
    setDeclining(false);
  }

  // Determine days left
  const daysLeft = invite?.expires_at
    ? Math.max(0, Math.ceil((new Date(invite.expires_at).getTime() - Date.now()) / 86400000))
    : null;

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-6">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="flex items-center justify-center gap-2.5 mb-8">
          <img src="/icon-transparent.svg" alt="" width={24} height={24} className="shrink-0" />
          <span className="font-heading text-2xl tracking-tight text-foreground">Reverbic</span>
        </div>

        <div className="bg-card border border-border rounded-2xl p-8 shadow-sm">
          {loading && (
            <div className="flex flex-col items-center gap-3 py-8">
              <Loader2 className="w-8 h-8 text-brand-violet animate-spin" />
              <p className="text-sm text-muted-foreground">Loading invitation...</p>
            </div>
          )}

          {!loading && error && !invite && (
            <div className="flex flex-col items-center gap-4 py-4 text-center">
              <div className="w-14 h-14 rounded-2xl bg-brand-rose/10 flex items-center justify-center">
                <XCircle className="w-7 h-7 text-brand-rose" />
              </div>
              <h1 className="font-heading text-xl text-foreground">Invalid Invitation</h1>
              <p className="text-sm text-muted-foreground">{error}</p>
              <Link
                href="/"
                className="inline-flex items-center gap-2 px-4 py-2.5 bg-brand-violet text-white rounded-xl text-sm font-medium hover:bg-brand-violet/90 transition-colors mt-2"
              >
                Go to Reverbic
              </Link>
            </div>
          )}

          {!loading && success && (
            <div className="flex flex-col items-center gap-4 py-4 text-center">
              <div className="w-14 h-14 rounded-2xl bg-brand-emerald/10 flex items-center justify-center circle-fill">
                <CheckCircle2 className="w-7 h-7 text-brand-emerald" />
              </div>
              <h1 className="font-heading text-xl text-foreground">You&apos;re in!</h1>
              <p className="text-sm text-muted-foreground">
                Welcome to <strong className="text-foreground">{invite?.orgName}</strong>. Redirecting to your dashboard...
              </p>
            </div>
          )}

          {!loading && declined && (
            <div className="flex flex-col items-center gap-4 py-4 text-center">
              <div className="w-14 h-14 rounded-2xl bg-muted flex items-center justify-center">
                <XCircle className="w-7 h-7 text-muted-foreground" />
              </div>
              <h1 className="font-heading text-xl text-foreground">Invitation Declined</h1>
              <p className="text-sm text-muted-foreground">You&apos;ve declined this invitation.</p>
              <Link
                href="/"
                className="text-sm text-brand-violet hover:text-brand-violet/80 transition-colors font-medium mt-2"
              >
                Go to Reverbic
              </Link>
            </div>
          )}

          {!loading && invite && !success && !declined && (
            <>
              <div className="flex flex-col items-center gap-4 text-center mb-6">
                <div className="w-14 h-14 rounded-2xl bg-brand-violet/10 flex items-center justify-center">
                  <Users className="w-7 h-7 text-brand-violet" />
                </div>
                <div>
                  <h1 className="font-heading text-xl text-foreground">
                    Join {invite.orgName}
                  </h1>
                  <p className="text-sm text-muted-foreground mt-1">
                    <strong className="text-foreground">{invite.inviterName}</strong> invited you to collaborate on Reverbic
                  </p>
                </div>
              </div>

              {/* Invite details */}
              <div className="bg-muted/50 rounded-xl p-4 space-y-2 mb-6">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Role</span>
                  <span className="font-medium text-foreground capitalize">{invite.role}</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Invited as</span>
                  <span className="font-medium text-foreground">{invite.email}</span>
                </div>
                {daysLeft !== null && (
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">Expires in</span>
                    <span className="inline-flex items-center gap-1 font-medium text-foreground">
                      <Clock className="w-3 h-3 text-brand-amber" />
                      {daysLeft} day{daysLeft !== 1 ? "s" : ""}
                    </span>
                  </div>
                )}
              </div>

              {/* Email mismatch warning */}
              {emailMismatch && (
                <div className="rounded-xl border border-brand-amber/30 bg-brand-amber/5 p-4 mb-6">
                  <div className="flex items-start gap-3">
                    <AlertTriangle className="w-5 h-5 text-brand-amber shrink-0 mt-0.5" />
                    <div>
                      <p className="text-sm font-medium text-foreground">Email mismatch</p>
                      <p className="text-xs text-muted-foreground mt-1">
                        This invitation was sent to <strong>{invite.email}</strong> but you&apos;re signed in as <strong>{userEmail}</strong>.
                        You&apos;ll need to sign in with the invited email or ask for a new invite to this email.
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {error && (
                <div className="rounded-xl border border-brand-rose/20 bg-brand-rose/5 px-4 py-3 mb-4">
                  <p className="text-sm text-brand-rose">{error}</p>
                </div>
              )}

              {/* Actions */}
              <div className="space-y-3">
                {!emailMismatch && (
                  <button
                    onClick={handleAccept}
                    disabled={accepting}
                    className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-brand-violet text-white rounded-xl text-sm font-semibold hover:bg-brand-violet/90 transition-colors disabled:opacity-50"
                  >
                    {accepting ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        Joining...
                      </>
                    ) : isLoggedIn ? (
                      "Accept & Join Team"
                    ) : (
                      "Create Account & Join"
                    )}
                  </button>
                )}
                <button
                  onClick={handleDecline}
                  disabled={declining}
                  className="w-full px-4 py-2.5 border border-border text-foreground rounded-xl text-sm font-medium hover:bg-muted transition-colors disabled:opacity-50"
                >
                  {declining ? "Declining..." : "Decline Invitation"}
                </button>

                {emailMismatch && (
                  <Link
                    href={`/sign-in?redirect=${encodeURIComponent(`/invite/${token}`)}`}
                    className="block w-full text-center px-4 py-3 bg-brand-violet text-white rounded-xl text-sm font-semibold hover:bg-brand-violet/90 transition-colors"
                  >
                    Sign in as {invite.email}
                  </Link>
                )}
              </div>

              {!isLoggedIn && (
                <p className="text-xs text-muted-foreground text-center mt-4">
                  Already have an account?{" "}
                  <Link
                    href={`/sign-in?redirect=${encodeURIComponent(`/invite/${token}`)}`}
                    className="text-brand-violet font-medium hover:text-brand-violet/80 transition-colors"
                  >
                    Sign in
                  </Link>
                </p>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
