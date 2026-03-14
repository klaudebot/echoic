"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { getSupabaseBrowser } from "@/lib/supabase/client";
import { Users, CheckCircle2, XCircle, Clock, Loader2, AlertTriangle, RefreshCw, Mail } from "lucide-react";

interface InviteData {
  id: string;
  email: string;
  role: string;
  status: string;
  expires_at: string;
  orgName: string;
  inviterName: string;
  inviterEmail: string;
  invitedById: string | null;
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
  const [inviteState, setInviteState] = useState<"valid" | "expired" | "accepted" | "declined_already" | "invalid">("valid");
  const [requestedResend, setRequestedResend] = useState(false);

  useEffect(() => {
    async function load() {
      const supabase = getSupabaseBrowser();

      // Check auth state
      const { data: { user } } = await supabase.auth.getUser();
      setIsLoggedIn(!!user);
      setUserEmail(user?.email ?? null);

      // Fetch invite details via server API (bypasses RLS for unauthenticated users)
      let inviteData: {
        id: string; email: string; role: string; status: string;
        expiresAt: string; orgName: string | null; inviterName: string | null;
        inviterEmail: string | null; invitedById: string | null;
      } | null = null;

      try {
        const res = await fetch(`/api/team/invite-details?token=${encodeURIComponent(token)}`);
        if (res.ok) {
          inviteData = await res.json();
        }
      } catch {
        // fetch failed
      }

      if (!inviteData) {
        setInviteState("invalid");
        setError("This invitation link is invalid or has already been replaced by a newer invite.");
        setLoading(false);
        return;
      }

      // Always store invite data so we can show context in error states
      const parsed: InviteData = {
        id: inviteData.id,
        email: inviteData.email,
        role: inviteData.role,
        status: inviteData.status,
        expires_at: inviteData.expiresAt,
        orgName: inviteData.orgName ?? "a team",
        inviterName: inviteData.inviterName ?? "A teammate",
        inviterEmail: inviteData.inviterEmail ?? "",
        invitedById: inviteData.invitedById,
      };
      setInvite(parsed);

      // Check if already accepted
      if (inviteData.status === "accepted") {
        setInviteState("accepted");
        // If the current user's email matches, they might already be in — redirect
        if (user && user.email?.toLowerCase() === inviteData.email.toLowerCase()) {
          setSuccess(true);
          setTimeout(() => router.push("/dashboard"), 1500);
        }
        setLoading(false);
        return;
      }

      // Check if declined
      if (inviteData.status === "declined") {
        setInviteState("declined_already");
        setLoading(false);
        return;
      }

      // Check if expired
      if (inviteData.status === "expired" || (inviteData.expiresAt && new Date(inviteData.expiresAt) < new Date())) {
        setInviteState("expired");
        setLoading(false);
        return;
      }

      if (inviteData.status !== "pending") {
        setInviteState("invalid");
        setError(`This invitation has an unexpected status: ${inviteData.status}`);
        setLoading(false);
        return;
      }

      // Valid invite — check email mismatch
      setInviteState("valid");
      if (user && user.email?.toLowerCase() !== inviteData.email.toLowerCase()) {
        setEmailMismatch(true);
      }
      setLoading(false);
    }
    load();
  }, [token, router]);

  async function handleAccept() {
    if (!isLoggedIn) {
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
        await fetch("/api/team/decline-invite", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ token }),
        });
      } else {
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

  async function handleRequestResend() {
    setRequestedResend(true);
    // Nothing server-side needed — just show confirmation
    // The inviter will see the expired status on their Team page and can resend
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

          {/* ── Invalid (token not found) ── */}
          {!loading && inviteState === "invalid" && (
            <div className="flex flex-col items-center gap-4 py-4 text-center">
              <div className="w-14 h-14 rounded-2xl bg-brand-rose/10 flex items-center justify-center">
                <XCircle className="w-7 h-7 text-brand-rose" />
              </div>
              <h1 className="font-heading text-xl text-foreground">Invitation Not Found</h1>
              <p className="text-sm text-muted-foreground">
                {error || "This link may have been replaced by a newer invitation. Check your email for the latest invite, or ask your team admin to resend it."}
              </p>
              <Link
                href="/dashboard"
                className="inline-flex items-center gap-2 px-4 py-2.5 bg-brand-violet text-white rounded-xl text-sm font-medium hover:bg-brand-violet/90 transition-colors mt-2"
              >
                Go to Dashboard
              </Link>
            </div>
          )}

          {/* ── Expired ── */}
          {!loading && inviteState === "expired" && invite && (
            <div className="flex flex-col items-center gap-4 py-4 text-center">
              <div className="w-14 h-14 rounded-2xl bg-brand-amber/10 flex items-center justify-center">
                <Clock className="w-7 h-7 text-brand-amber" />
              </div>
              <h1 className="font-heading text-xl text-foreground">Invitation Expired</h1>
              <p className="text-sm text-muted-foreground">
                The invitation from <strong className="text-foreground">{invite.inviterName}</strong> to join <strong className="text-foreground">{invite.orgName}</strong> has expired.
              </p>

              {!requestedResend ? (
                <div className="space-y-3 w-full mt-2">
                  <p className="text-xs text-muted-foreground">
                    Ask <strong>{invite.inviterName}</strong> to resend the invitation from their Team page, or let them know by email:
                  </p>
                  <a
                    href={`mailto:${invite.inviterEmail}?subject=${encodeURIComponent("Re: Reverbic team invitation")}&body=${encodeURIComponent(`Hi ${invite.inviterName.split(" ")[0]},\n\nThe invitation to join ${invite.orgName} on Reverbic has expired. Could you resend it?\n\nThanks!`)}`}
                    className="w-full inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-brand-violet text-white rounded-xl text-sm font-medium hover:bg-brand-violet/90 transition-colors"
                    onClick={handleRequestResend}
                  >
                    <Mail className="w-4 h-4" />
                    Ask {invite.inviterName.split(" ")[0]} to Resend
                  </a>
                  <Link
                    href="/dashboard"
                    className="block w-full text-center px-4 py-2.5 border border-border text-foreground rounded-xl text-sm font-medium hover:bg-muted transition-colors"
                  >
                    Go to Dashboard
                  </Link>
                </div>
              ) : (
                <div className="space-y-3 w-full mt-2">
                  <div className="rounded-xl bg-brand-emerald/5 border border-brand-emerald/20 p-4">
                    <div className="flex items-center gap-2">
                      <CheckCircle2 className="w-5 h-5 text-brand-emerald shrink-0" />
                      <p className="text-sm text-foreground">
                        Email opened! Once {invite.inviterName.split(" ")[0]} resends the invite, check your inbox for a new link.
                      </p>
                    </div>
                  </div>
                  <Link
                    href="/dashboard"
                    className="block w-full text-center px-4 py-2.5 border border-border text-foreground rounded-xl text-sm font-medium hover:bg-muted transition-colors"
                  >
                    Go to Dashboard
                  </Link>
                </div>
              )}
            </div>
          )}

          {/* ── Already accepted ── */}
          {!loading && inviteState === "accepted" && invite && (
            <div className="flex flex-col items-center gap-4 py-4 text-center">
              <div className="w-14 h-14 rounded-2xl bg-brand-emerald/10 flex items-center justify-center">
                <CheckCircle2 className="w-7 h-7 text-brand-emerald" />
              </div>
              <h1 className="font-heading text-xl text-foreground">
                {success ? "You're in!" : "Already Accepted"}
              </h1>
              <p className="text-sm text-muted-foreground">
                {success
                  ? <>Welcome to <strong className="text-foreground">{invite.orgName}</strong>. Redirecting to your dashboard...</>
                  : <>This invitation to join <strong className="text-foreground">{invite.orgName}</strong> has already been accepted.</>
                }
              </p>
              {!success && (
                <Link
                  href="/dashboard"
                  className="inline-flex items-center gap-2 px-4 py-2.5 bg-brand-violet text-white rounded-xl text-sm font-medium hover:bg-brand-violet/90 transition-colors mt-2"
                >
                  Go to Dashboard
                </Link>
              )}
            </div>
          )}

          {/* ── Previously declined ── */}
          {!loading && inviteState === "declined_already" && invite && (
            <div className="flex flex-col items-center gap-4 py-4 text-center">
              <div className="w-14 h-14 rounded-2xl bg-muted flex items-center justify-center">
                <XCircle className="w-7 h-7 text-muted-foreground" />
              </div>
              <h1 className="font-heading text-xl text-foreground">Invitation Declined</h1>
              <p className="text-sm text-muted-foreground">
                You previously declined the invitation to join <strong className="text-foreground">{invite.orgName}</strong>.
              </p>
              <p className="text-xs text-muted-foreground">
                Changed your mind? Ask <strong>{invite.inviterName}</strong> to send a new invitation.
              </p>
              <Link
                href="/"
                className="text-sm text-brand-violet hover:text-brand-violet/80 transition-colors font-medium mt-2"
              >
                Go to Reverbic
              </Link>
            </div>
          )}

          {/* ── Success (from accepting) ── */}
          {!loading && success && inviteState === "valid" && (
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

          {/* ── Declined (just now) ── */}
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

          {/* ── Valid invite — accept/decline ── */}
          {!loading && inviteState === "valid" && invite && !success && !declined && (
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
