import { NextResponse } from "next/server";
import { requireAuth } from "@/lib/api-auth";
import {
  sendTranscriptReadyEmail,
  sendProcessingFailedEmail,
  sendWelcomeEmail,
  sendTeamInviteEmail,
  sendTeamInviteAcceptedEmail,
  sendPasswordResetEmail,
} from "@/lib/resend";

/**
 * POST /api/notify — Send email notifications via Resend.
 * Called client-side after key events (welcome, transcript ready, processing failed, team invite, etc.).
 */
export async function POST(request: Request) {
  let type = "unknown";
  let to = "unknown";

  try {
    const body = await request.json();
    type = body.type ?? "unknown";
    to = body.to ?? "unknown";
    const { name, meetingTitle, meetingId, summary, actionItemCount, decisionCount, errorMessage, inviterName, inviterEmail, teamName, inviteToken, newMemberName, newMemberEmail, resetToken } = body;

    // Welcome and password-reset emails are sent pre-auth; all others require auth
    if (type !== "welcome" && type !== "password-reset") {
      const { error: authError } = await requireAuth();
      if (authError) return authError;
    }

    if (!body.type || !body.to) {
      return NextResponse.json({ error: "Missing type or to" }, { status: 400 });
    }

    // Check if Resend is configured
    if (!process.env.RESEND_API_KEY) {
      console.warn(`[notify] RESEND_API_KEY not set — skipping ${type} email to ${to}`);
      return NextResponse.json({ skipped: true, reason: "RESEND_API_KEY not configured" });
    }

    const from = process.env.RESEND_FROM_ADDRESS ?? "Reverbic <onboarding@resend.dev>";
    console.log(`[notify] Sending ${type} email to ${to} from ${from}`);

    switch (type) {
      case "transcript-ready":
        await sendTranscriptReadyEmail(
          to,
          meetingTitle ?? "Meeting",
          meetingId ?? "",
          summary ?? null,
          actionItemCount ?? 0,
          decisionCount ?? 0
        );
        break;

      case "processing-failed":
        await sendProcessingFailedEmail(
          to,
          meetingTitle ?? "Meeting",
          meetingId ?? "",
          errorMessage
        );
        break;

      case "welcome":
        await sendWelcomeEmail(to, name ?? "there");
        break;

      case "team-invite":
        await sendTeamInviteEmail(
          to,
          inviterName ?? "A teammate",
          inviterEmail ?? "",
          teamName,
          inviteToken
        );
        break;

      case "team-invite-accepted":
        await sendTeamInviteAcceptedEmail(
          to,
          newMemberName ?? "Someone",
          newMemberEmail ?? ""
        );
        break;

      case "password-reset":
        await sendPasswordResetEmail(to, resetToken ?? "");
        break;

      default:
        return NextResponse.json({ error: `Unknown notification type: ${type}` }, { status: 400 });
    }

    console.log(`[notify] ✓ ${type} email sent to ${to}`);
    return NextResponse.json({ sent: true });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Failed to send email";
    console.error(`[notify] ✗ ${type} email to ${to} FAILED:`, message, err);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
