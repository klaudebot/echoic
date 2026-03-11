import { Resend } from "resend";

let _resend: Resend | null = null;

export function getResend(): Resend {
  if (!_resend) {
    const key = process.env.RESEND_API_KEY;
    if (!key) throw new Error("RESEND_API_KEY is not set");
    _resend = new Resend(key);
  }
  return _resend;
}

const FROM_ADDRESS = "Reverbic <notifications@reverbic.ai>";
const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? "https://reverbic.ai";

// ─── Email templates ───

export async function sendTranscriptReadyEmail(
  to: string,
  meetingTitle: string,
  meetingId: string,
  summary: string | null,
  actionItemCount: number,
  decisionCount: number
): Promise<void> {
  const meetingUrl = `${APP_URL}/meetings/${meetingId}`;

  const html = `
    <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 560px; margin: 0 auto; padding: 32px 0;">
      <div style="margin-bottom: 24px;">
        <span style="font-size: 20px; font-weight: 700; color: #7C3AED;">Reverbic</span>
      </div>
      <h1 style="font-size: 22px; font-weight: 600; color: #111; margin: 0 0 8px;">Your transcript is ready</h1>
      <p style="font-size: 14px; color: #666; margin: 0 0 24px;">
        <strong>"${escapeHtml(meetingTitle)}"</strong> has been transcribed and analyzed.
      </p>
      ${summary ? `
      <div style="background: #f9f5ff; border-radius: 12px; padding: 16px; margin-bottom: 20px;">
        <p style="font-size: 12px; font-weight: 600; color: #7C3AED; margin: 0 0 8px; text-transform: uppercase; letter-spacing: 0.5px;">AI Summary</p>
        <p style="font-size: 14px; color: #333; margin: 0; line-height: 1.6;">${escapeHtml(summary.slice(0, 500))}${summary.length > 500 ? "..." : ""}</p>
      </div>` : ""}
      <div style="display: flex; gap: 16px; margin-bottom: 24px;">
        ${actionItemCount > 0 ? `<div style="background: #f0f0ff; border-radius: 8px; padding: 12px 16px; flex: 1;"><span style="font-size: 20px; font-weight: 700; color: #7C3AED;">${actionItemCount}</span><br/><span style="font-size: 12px; color: #666;">Action Items</span></div>` : ""}
        ${decisionCount > 0 ? `<div style="background: #f0fdf4; border-radius: 8px; padding: 12px 16px; flex: 1;"><span style="font-size: 20px; font-weight: 700; color: #059669;">${decisionCount}</span><br/><span style="font-size: 12px; color: #666;">Decisions</span></div>` : ""}
      </div>
      <a href="${meetingUrl}" style="display: inline-block; background: #7C3AED; color: white; text-decoration: none; padding: 12px 24px; border-radius: 8px; font-size: 14px; font-weight: 600;">View Full Transcript</a>
      <hr style="border: none; border-top: 1px solid #eee; margin: 32px 0 16px;" />
      <p style="font-size: 12px; color: #999; margin: 0;">You're receiving this because you recorded a meeting on Reverbic. <a href="${APP_URL}/settings" style="color: #7C3AED;">Manage preferences</a></p>
    </div>
  `;

  await getResend().emails.send({
    from: FROM_ADDRESS,
    to,
    subject: `Transcript ready: ${meetingTitle}`,
    html,
  });
}

export async function sendProcessingFailedEmail(
  to: string,
  meetingTitle: string,
  meetingId: string,
  errorMessage?: string
): Promise<void> {
  const meetingUrl = `${APP_URL}/meetings/${meetingId}`;

  const html = `
    <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 560px; margin: 0 auto; padding: 32px 0;">
      <div style="margin-bottom: 24px;">
        <span style="font-size: 20px; font-weight: 700; color: #7C3AED;">Reverbic</span>
      </div>
      <h1 style="font-size: 22px; font-weight: 600; color: #111; margin: 0 0 8px;">Processing failed</h1>
      <p style="font-size: 14px; color: #666; margin: 0 0 16px;">
        We couldn't process <strong>"${escapeHtml(meetingTitle)}"</strong>.
      </p>
      ${errorMessage ? `<div style="background: #fef2f2; border-radius: 12px; padding: 16px; margin-bottom: 20px;"><p style="font-size: 14px; color: #991b1b; margin: 0;">${escapeHtml(errorMessage)}</p></div>` : ""}
      <a href="${meetingUrl}" style="display: inline-block; background: #7C3AED; color: white; text-decoration: none; padding: 12px 24px; border-radius: 8px; font-size: 14px; font-weight: 600;">Retry Processing</a>
      <hr style="border: none; border-top: 1px solid #eee; margin: 32px 0 16px;" />
      <p style="font-size: 12px; color: #999; margin: 0;">You're receiving this because you recorded a meeting on Reverbic. <a href="${APP_URL}/settings" style="color: #7C3AED;">Manage preferences</a></p>
    </div>
  `;

  await getResend().emails.send({
    from: FROM_ADDRESS,
    to,
    subject: `Processing failed: ${meetingTitle}`,
    html,
  });
}

export async function sendWelcomeEmail(to: string, name: string): Promise<void> {
  const html = `
    <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 560px; margin: 0 auto; padding: 32px 0;">
      <div style="margin-bottom: 24px;">
        <span style="font-size: 20px; font-weight: 700; color: #7C3AED;">Reverbic</span>
      </div>
      <h1 style="font-size: 22px; font-weight: 600; color: #111; margin: 0 0 8px;">Welcome to Reverbic, ${escapeHtml(name)}!</h1>
      <p style="font-size: 14px; color: #666; margin: 0 0 24px; line-height: 1.6;">
        You're all set to start recording and transcribing your meetings with AI-powered accuracy. Here's what you can do:
      </p>
      <div style="margin-bottom: 24px;">
        <div style="display: flex; align-items: center; gap: 12px; margin-bottom: 12px;">
          <div style="width: 28px; height: 28px; background: #f0f0ff; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-size: 14px; font-weight: 700; color: #7C3AED;">1</div>
          <span style="font-size: 14px; color: #333;"><strong>Record</strong> — Click the mic or press <kbd style="background: #f0f0ff; padding: 2px 6px; border-radius: 4px; font-size: 12px;">R</kbd> to start recording</span>
        </div>
        <div style="display: flex; align-items: center; gap: 12px; margin-bottom: 12px;">
          <div style="width: 28px; height: 28px; background: #f0f0ff; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-size: 14px; font-weight: 700; color: #7C3AED;">2</div>
          <span style="font-size: 14px; color: #333;"><strong>Transcribe</strong> — We'll automatically transcribe and summarize</span>
        </div>
        <div style="display: flex; align-items: center; gap: 12px;">
          <div style="width: 28px; height: 28px; background: #f0f0ff; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-size: 14px; font-weight: 700; color: #7C3AED;">3</div>
          <span style="font-size: 14px; color: #333;"><strong>Review</strong> — Get action items, decisions, and key points</span>
        </div>
      </div>
      <a href="${APP_URL}/dashboard" style="display: inline-block; background: #7C3AED; color: white; text-decoration: none; padding: 12px 24px; border-radius: 8px; font-size: 14px; font-weight: 600;">Go to Dashboard</a>
      <hr style="border: none; border-top: 1px solid #eee; margin: 32px 0 16px;" />
      <p style="font-size: 12px; color: #999; margin: 0;">Questions? Just reply to this email. We're here to help.</p>
    </div>
  `;

  await getResend().emails.send({
    from: FROM_ADDRESS,
    to,
    subject: "Welcome to Reverbic — your AI meeting assistant",
    html,
  });
}

function escapeHtml(str: string): string {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}
