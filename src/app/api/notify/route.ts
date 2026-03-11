import { NextResponse } from "next/server";
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
  try {
    const body = await request.json();
    const { type, to, name, meetingTitle, meetingId, summary, actionItemCount, decisionCount, errorMessage, inviterName, inviterEmail, teamName, newMemberName, newMemberEmail, resetToken } = body;

    if (!type || !to) {
      return NextResponse.json({ error: "Missing type or to" }, { status: 400 });
    }

    // Check if Resend is configured
    if (!process.env.RESEND_API_KEY) {
      console.log(`[notify] RESEND_API_KEY not set — skipping ${type} email to ${to}`);
      return NextResponse.json({ skipped: true, reason: "RESEND_API_KEY not configured" });
    }

    console.log(`[notify] Sending ${type} email to ${to}`);

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
          teamName
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

    console.log(`[notify] ${type} email sent to ${to}`);
    return NextResponse.json({ sent: true });
  } catch (err: unknown) {
    console.error("[notify] Email send error:", err);
    const message = err instanceof Error ? err.message : "Failed to send email";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
