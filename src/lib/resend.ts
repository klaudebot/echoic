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

// Use Resend's shared sender until custom domain is verified
const FROM_ADDRESS = process.env.RESEND_FROM_ADDRESS ?? "Reverbic <onboarding@resend.dev>";
const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? "https://reverbic.ai";

// ─── Brand tokens ───
const VIOLET = "#7C3AED";
const VIOLET_LIGHT = "#A78BFA";
const CYAN = "#06B6D4";
const DEEP = "#0F172A";
const EMERALD = "#10B981";
const ROSE = "#F43F5E";
const AMBER = "#F59E0B";

// ─── Shared email shell ───

function emailShell(body: string, preheader?: string): string {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <meta name="color-scheme" content="light" />
  <meta name="supported-color-schemes" content="light" />
  <!--[if mso]><noscript><xml><o:OfficeDocumentSettings><o:PixelsPerInch>96</o:PixelsPerInch></o:OfficeDocumentSettings></xml></noscript><![endif]-->
  <style>
    body { margin: 0; padding: 0; -webkit-text-size-adjust: 100%; }
    a { color: ${VIOLET}; }
  </style>
</head>
<body style="margin: 0; padding: 0; background-color: #f4f4f7; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;">
  ${preheader ? `<div style="display:none;max-height:0;overflow:hidden;mso-hide:all;">${esc(preheader)}</div>` : ""}
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color: #f4f4f7;">
    <tr><td align="center" style="padding: 40px 16px;">
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width: 560px; background: #ffffff; border-radius: 16px; overflow: hidden; box-shadow: 0 1px 3px rgba(0,0,0,0.06);">
        <!-- Header -->
        <tr>
          <td style="background: linear-gradient(135deg, ${DEEP} 0%, #1e1b4b 100%); padding: 32px 40px;">
            <table role="presentation" cellpadding="0" cellspacing="0">
              <tr>
                <td style="padding-right: 10px; vertical-align: middle;">
                  <!-- Waveform bars -->
                  <table role="presentation" cellpadding="0" cellspacing="0"><tr>
                    <td style="width:3px;height:10px;background:${VIOLET_LIGHT};border-radius:2px;"></td>
                    <td style="width:2px;"></td>
                    <td style="width:3px;height:18px;background:${VIOLET_LIGHT};border-radius:2px;"></td>
                    <td style="width:2px;"></td>
                    <td style="width:3px;height:14px;background:${CYAN};border-radius:2px;"></td>
                    <td style="width:2px;"></td>
                    <td style="width:3px;height:22px;background:${CYAN};border-radius:2px;"></td>
                    <td style="width:2px;"></td>
                    <td style="width:3px;height:12px;background:${VIOLET_LIGHT};border-radius:2px;"></td>
                  </tr></table>
                </td>
                <td style="vertical-align: middle;">
                  <span style="font-size: 22px; font-weight: 800; color: #ffffff; letter-spacing: -0.5px;">Reverbic</span>
                </td>
              </tr>
            </table>
          </td>
        </tr>
        <!-- Body -->
        <tr>
          <td style="padding: 40px;">
            ${body}
          </td>
        </tr>
        <!-- Footer -->
        <tr>
          <td style="padding: 0 40px 32px;">
            <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
              <tr><td style="border-top: 1px solid #e5e7eb; padding-top: 24px;">
                <p style="font-size: 12px; color: #9ca3af; margin: 0 0 8px; line-height: 1.5;">
                  Sent by <a href="${APP_URL}" style="color: ${VIOLET}; text-decoration: none; font-weight: 600;">Reverbic</a> — AI-powered meeting intelligence
                </p>
                <p style="font-size: 11px; color: #d1d5db; margin: 0;">
                  <a href="${APP_URL}/settings" style="color: #9ca3af; text-decoration: underline;">Manage email preferences</a>
                </p>
              </td></tr>
            </table>
          </td>
        </tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`;
}

function primaryButton(text: string, href: string): string {
  return `<table role="presentation" cellpadding="0" cellspacing="0" style="margin-top: 8px;">
    <tr>
      <td style="background: ${VIOLET}; border-radius: 10px; padding: 14px 28px;">
        <a href="${href}" style="color: #ffffff; font-size: 14px; font-weight: 700; text-decoration: none; display: inline-block; letter-spacing: 0.2px;">${text}</a>
      </td>
    </tr>
  </table>`;
}

function secondaryButton(text: string, href: string): string {
  return `<table role="presentation" cellpadding="0" cellspacing="0" style="margin-top: 8px;">
    <tr>
      <td style="border: 2px solid #e5e7eb; border-radius: 10px; padding: 12px 24px;">
        <a href="${href}" style="color: ${DEEP}; font-size: 14px; font-weight: 600; text-decoration: none; display: inline-block;">${text}</a>
      </td>
    </tr>
  </table>`;
}

function statCard(value: string, label: string, color: string): string {
  return `<td style="background: #f9fafb; border-radius: 12px; padding: 16px 20px; text-align: center; width: 50%;">
    <div style="font-size: 28px; font-weight: 800; color: ${color}; line-height: 1;">${value}</div>
    <div style="font-size: 12px; color: #6b7280; margin-top: 6px; font-weight: 500;">${label}</div>
  </td>`;
}

function heading(text: string): string {
  return `<h1 style="font-size: 24px; font-weight: 800; color: ${DEEP}; margin: 0 0 8px; line-height: 1.3;">${text}</h1>`;
}

function paragraph(text: string): string {
  return `<p style="font-size: 15px; color: #4b5563; margin: 0 0 20px; line-height: 1.7;">${text}</p>`;
}

function infoBox(label: string, content: string, color: string, bgColor: string): string {
  return `<div style="background: ${bgColor}; border-radius: 12px; padding: 20px; margin-bottom: 24px; border-left: 4px solid ${color};">
    <p style="font-size: 11px; font-weight: 700; color: ${color}; margin: 0 0 8px; text-transform: uppercase; letter-spacing: 0.8px;">${label}</p>
    <p style="font-size: 14px; color: #374151; margin: 0; line-height: 1.7;">${content}</p>
  </div>`;
}

// ─── Email Templates ───

/** 1. Welcome — sent on sign-up */
export async function sendWelcomeEmail(to: string, name: string): Promise<void> {
  const body = `
    ${heading(`Welcome to Reverbic, ${esc(name)}`)}
    ${paragraph("Your AI meeting assistant is ready. Record, transcribe, and analyze your meetings with 99.2% accuracy — no more lost action items or forgotten decisions.")}

    <div style="margin: 28px 0;">
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="border-collapse: separate; border-spacing: 0 12px;">
        <tr>
          <td style="width: 44px; vertical-align: top;">
            <div style="width: 36px; height: 36px; background: linear-gradient(135deg, ${VIOLET}, ${VIOLET_LIGHT}); border-radius: 10px; text-align: center; line-height: 36px; font-size: 15px; font-weight: 800; color: white;">1</div>
          </td>
          <td style="vertical-align: middle; padding-left: 4px;">
            <div style="font-size: 15px; font-weight: 700; color: ${DEEP};">Record your meeting</div>
            <div style="font-size: 13px; color: #6b7280; margin-top: 2px;">Click the mic button or press <code style="background: #f3f4f6; padding: 2px 6px; border-radius: 4px; font-size: 12px; font-weight: 600; color: ${VIOLET};">R</code> to start</div>
          </td>
        </tr>
        <tr>
          <td style="width: 44px; vertical-align: top;">
            <div style="width: 36px; height: 36px; background: linear-gradient(135deg, ${CYAN}, #22d3ee); border-radius: 10px; text-align: center; line-height: 36px; font-size: 15px; font-weight: 800; color: white;">2</div>
          </td>
          <td style="vertical-align: middle; padding-left: 4px;">
            <div style="font-size: 15px; font-weight: 700; color: ${DEEP};">AI transcribes & summarizes</div>
            <div style="font-size: 13px; color: #6b7280; margin-top: 2px;">Automatic speaker detection, key points, and action items</div>
          </td>
        </tr>
        <tr>
          <td style="width: 44px; vertical-align: top;">
            <div style="width: 36px; height: 36px; background: linear-gradient(135deg, ${EMERALD}, #34d399); border-radius: 10px; text-align: center; line-height: 36px; font-size: 15px; font-weight: 800; color: white;">3</div>
          </td>
          <td style="vertical-align: middle; padding-left: 4px;">
            <div style="font-size: 15px; font-weight: 700; color: ${DEEP};">Never miss a decision</div>
            <div style="font-size: 13px; color: #6b7280; margin-top: 2px;">Track decisions, share clips, and collaborate with your team</div>
          </td>
        </tr>
      </table>
    </div>

    ${primaryButton("Go to Dashboard &rarr;", `${APP_URL}/dashboard`)}

    <p style="font-size: 13px; color: #9ca3af; margin: 24px 0 0; line-height: 1.6;">
      Your free tier includes <strong style="color: #6b7280;">5 hours</strong> of transcription every month. No credit card required.
    </p>
  `;

  await getResend().emails.send({
    from: FROM_ADDRESS,
    to,
    subject: "Welcome to Reverbic — your AI meeting assistant",
    html: emailShell(body, `Welcome ${name}! Your AI meeting assistant is ready.`),
  });
}

/** 2. Transcript Ready — sent when processing completes */
export async function sendTranscriptReadyEmail(
  to: string,
  meetingTitle: string,
  meetingId: string,
  summary: string | null,
  actionItemCount: number,
  decisionCount: number
): Promise<void> {
  const meetingUrl = `${APP_URL}/meetings/${meetingId}`;

  const statsRow = (actionItemCount > 0 || decisionCount > 0) ? `
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin-bottom: 24px;">
      <tr>
        ${actionItemCount > 0 ? statCard(String(actionItemCount), "Action Items", VIOLET) : ""}
        ${(actionItemCount > 0 && decisionCount > 0) ? '<td style="width: 12px;"></td>' : ""}
        ${decisionCount > 0 ? statCard(String(decisionCount), "Decisions", EMERALD) : ""}
      </tr>
    </table>` : "";

  const body = `
    <div style="display: inline-block; background: linear-gradient(135deg, #ecfdf5, #f0fdf4); border-radius: 8px; padding: 6px 12px; margin-bottom: 16px;">
      <span style="font-size: 12px; font-weight: 700; color: ${EMERALD}; letter-spacing: 0.5px;">&#10003; TRANSCRIPT READY</span>
    </div>
    ${heading("Your meeting has been transcribed")}
    ${paragraph(`<strong style="color: ${DEEP};">&ldquo;${esc(meetingTitle)}&rdquo;</strong> has been transcribed, summarized, and analyzed by AI.`)}

    ${summary ? infoBox("AI Summary", esc(summary.slice(0, 600)) + (summary.length > 600 ? "..." : ""), VIOLET, "#faf5ff") : ""}

    ${statsRow}

    ${primaryButton("View Full Transcript &rarr;", meetingUrl)}
  `;

  await getResend().emails.send({
    from: FROM_ADDRESS,
    to,
    subject: `✓ Transcript ready: ${meetingTitle}`,
    html: emailShell(body, `Your transcript for "${meetingTitle}" is ready with ${actionItemCount} action items.`),
  });
}

/** 3. Processing Failed — sent when processing errors out */
export async function sendProcessingFailedEmail(
  to: string,
  meetingTitle: string,
  meetingId: string,
  errorMessage?: string
): Promise<void> {
  const meetingUrl = `${APP_URL}/meetings/${meetingId}`;

  const body = `
    <div style="display: inline-block; background: #fef2f2; border-radius: 8px; padding: 6px 12px; margin-bottom: 16px;">
      <span style="font-size: 12px; font-weight: 700; color: ${ROSE}; letter-spacing: 0.5px;">PROCESSING FAILED</span>
    </div>
    ${heading("We couldn't process your recording")}
    ${paragraph(`Something went wrong while processing <strong style="color: ${DEEP};">&ldquo;${esc(meetingTitle)}&rdquo;</strong>. You can retry from the meeting page.`)}

    ${errorMessage ? infoBox("Error Details", esc(errorMessage), ROSE, "#fef2f2") : ""}

    ${primaryButton("Retry Processing &rarr;", meetingUrl)}

    <p style="font-size: 13px; color: #9ca3af; margin: 20px 0 0; line-height: 1.6;">
      If the issue persists, try re-uploading the file or recording again. Large files (100MB+) are automatically compressed before processing.
    </p>
  `;

  await getResend().emails.send({
    from: FROM_ADDRESS,
    to,
    subject: `Processing failed: ${meetingTitle}`,
    html: emailShell(body, `We couldn't process "${meetingTitle}". Click to retry.`),
  });
}

/** 4. Team Invite — sent when a user invites someone to their team */
export async function sendTeamInviteEmail(
  to: string,
  inviterName: string,
  inviterEmail: string,
  teamName?: string
): Promise<void> {
  const joinUrl = `${APP_URL}/sign-up?invite=true&team=${encodeURIComponent(teamName ?? "")}&from=${encodeURIComponent(inviterEmail)}`;

  const body = `
    <div style="display: inline-block; background: linear-gradient(135deg, #ede9fe, #f5f3ff); border-radius: 8px; padding: 6px 12px; margin-bottom: 16px;">
      <span style="font-size: 12px; font-weight: 700; color: ${VIOLET}; letter-spacing: 0.5px;">TEAM INVITATION</span>
    </div>
    ${heading(`${esc(inviterName)} invited you to Reverbic`)}
    ${paragraph(`You've been invited to collaborate on meeting transcripts, shared action items, and team insights${teamName ? ` on the <strong style="color: ${DEEP};">${esc(teamName)}</strong> team` : ""}.`)}

    <div style="background: #f9fafb; border-radius: 12px; padding: 24px; margin-bottom: 24px; text-align: center;">
      <div style="width: 56px; height: 56px; background: linear-gradient(135deg, ${VIOLET}, ${VIOLET_LIGHT}); border-radius: 16px; margin: 0 auto 16px; line-height: 56px; text-align: center;">
        <span style="font-size: 24px; color: white; font-weight: 800;">${esc(inviterName.charAt(0).toUpperCase())}</span>
      </div>
      <div style="font-size: 16px; font-weight: 700; color: ${DEEP};">${esc(inviterName)}</div>
      <div style="font-size: 13px; color: #6b7280; margin-top: 2px;">${esc(inviterEmail)}</div>
    </div>

    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin-bottom: 24px;">
      <tr>
        ${statCard("99.2%", "Accuracy", VIOLET)}
        <td style="width: 12px;"></td>
        ${statCard("50+", "Languages", CYAN)}
      </tr>
    </table>

    ${primaryButton("Accept Invitation &rarr;", joinUrl)}

    <p style="font-size: 13px; color: #9ca3af; margin: 20px 0 0; line-height: 1.6;">
      Don't know ${esc(inviterName.split(" ")[0])}? You can safely ignore this email.
    </p>
  `;

  await getResend().emails.send({
    from: FROM_ADDRESS,
    to,
    subject: `${inviterName} invited you to Reverbic`,
    html: emailShell(body, `${inviterName} invited you to collaborate on Reverbic.`),
  });
}

/** 5. Team Invite Accepted — sent to the inviter when someone joins */
export async function sendTeamInviteAcceptedEmail(
  to: string,
  newMemberName: string,
  newMemberEmail: string
): Promise<void> {
  const teamUrl = `${APP_URL}/team`;

  const body = `
    <div style="display: inline-block; background: linear-gradient(135deg, #ecfdf5, #f0fdf4); border-radius: 8px; padding: 6px 12px; margin-bottom: 16px;">
      <span style="font-size: 12px; font-weight: 700; color: ${EMERALD}; letter-spacing: 0.5px;">&#10003; INVITE ACCEPTED</span>
    </div>
    ${heading(`${esc(newMemberName)} joined your team`)}
    ${paragraph(`Great news! <strong style="color: ${DEEP};">${esc(newMemberName)}</strong> (${esc(newMemberEmail)}) has accepted your invitation and joined your Reverbic team.`)}

    <div style="background: #f9fafb; border-radius: 12px; padding: 20px; margin-bottom: 24px;">
      <table role="presentation" cellpadding="0" cellspacing="0">
        <tr>
          <td style="vertical-align: middle; padding-right: 16px;">
            <div style="width: 48px; height: 48px; background: linear-gradient(135deg, ${EMERALD}, #34d399); border-radius: 14px; text-align: center; line-height: 48px;">
              <span style="font-size: 20px; color: white; font-weight: 800;">${esc(newMemberName.charAt(0).toUpperCase())}</span>
            </div>
          </td>
          <td style="vertical-align: middle;">
            <div style="font-size: 16px; font-weight: 700; color: ${DEEP};">${esc(newMemberName)}</div>
            <div style="font-size: 13px; color: #6b7280; margin-top: 2px;">${esc(newMemberEmail)}</div>
          </td>
        </tr>
      </table>
    </div>

    ${paragraph("They can now view shared meeting transcripts, collaborate on action items, and access team analytics.")}

    ${primaryButton("View Team &rarr;", teamUrl)}
  `;

  await getResend().emails.send({
    from: FROM_ADDRESS,
    to,
    subject: `${newMemberName} joined your Reverbic team`,
    html: emailShell(body, `${newMemberName} has accepted your invitation and joined your team.`),
  });
}

/** 6. Password Reset — sent when user requests a password reset */
export async function sendPasswordResetEmail(
  to: string,
  resetToken: string
): Promise<void> {
  const resetUrl = `${APP_URL}/reset-password?token=${encodeURIComponent(resetToken)}`;

  const body = `
    ${heading("Reset your password")}
    ${paragraph("We received a request to reset your Reverbic password. Click the button below to choose a new one. This link expires in 1 hour.")}

    ${primaryButton("Reset Password &rarr;", resetUrl)}

    <div style="background: #fffbeb; border-radius: 12px; padding: 16px; margin: 24px 0; border-left: 4px solid ${AMBER};">
      <p style="font-size: 13px; color: #92400e; margin: 0; line-height: 1.6;">
        <strong>Didn't request this?</strong> You can safely ignore this email. Your password won't change unless you click the link above.
      </p>
    </div>

    <p style="font-size: 12px; color: #d1d5db; margin: 0; line-height: 1.5; word-break: break-all;">
      Or copy this link: <span style="color: #9ca3af;">${resetUrl}</span>
    </p>
  `;

  await getResend().emails.send({
    from: FROM_ADDRESS,
    to,
    subject: "Reset your Reverbic password",
    html: emailShell(body, "Reset your Reverbic password. This link expires in 1 hour."),
  });
}

/** 7. Subscription Confirmation — sent when a user subscribes */
export async function sendSubscriptionConfirmationEmail(
  to: string,
  planName: string,
  price: string
): Promise<void> {
  const settingsUrl = `${APP_URL}/settings`;

  const body = `
    <div style="display: inline-block; background: linear-gradient(135deg, #ecfdf5, #f0fdf4); border-radius: 8px; padding: 6px 12px; margin-bottom: 16px;">
      <span style="font-size: 12px; font-weight: 700; color: ${EMERALD}; letter-spacing: 0.5px;">&#10003; SUBSCRIPTION CONFIRMED</span>
    </div>
    ${heading(`Welcome to Reverbic ${esc(planName)}`)}
    ${paragraph(`Your upgrade is complete! You're now on the <strong style="color: ${DEEP};">${esc(planName)} plan</strong>${price ? ` at <strong style="color: ${DEEP};">${esc(price)}/mo</strong>` : ""}.`)}

    <div style="background: #f9fafb; border-radius: 12px; padding: 24px; margin-bottom: 24px;">
      <p style="font-size: 13px; font-weight: 700; color: ${DEEP}; margin: 0 0 12px;">What's unlocked:</p>
      <table role="presentation" cellpadding="0" cellspacing="0" width="100%">
        ${planName === "Starter" ? `
        <tr><td style="padding: 4px 0; font-size: 14px; color: #374151;"><span style="color: ${EMERALD}; margin-right: 8px;">&#10003;</span> 30 hours of transcription / month</td></tr>
        <tr><td style="padding: 4px 0; font-size: 14px; color: #374151;"><span style="color: ${EMERALD}; margin-right: 8px;">&#10003;</span> AI summaries + action items</td></tr>
        <tr><td style="padding: 4px 0; font-size: 14px; color: #374151;"><span style="color: ${EMERALD}; margin-right: 8px;">&#10003;</span> 3 integrations</td></tr>
        ` : planName === "Pro" ? `
        <tr><td style="padding: 4px 0; font-size: 14px; color: #374151;"><span style="color: ${EMERALD}; margin-right: 8px;">&#10003;</span> Unlimited transcription</td></tr>
        <tr><td style="padding: 4px 0; font-size: 14px; color: #374151;"><span style="color: ${EMERALD}; margin-right: 8px;">&#10003;</span> AI Coach + Smart Clips</td></tr>
        <tr><td style="padding: 4px 0; font-size: 14px; color: #374151;"><span style="color: ${EMERALD}; margin-right: 8px;">&#10003;</span> All integrations + analytics</td></tr>
        ` : `
        <tr><td style="padding: 4px 0; font-size: 14px; color: #374151;"><span style="color: ${EMERALD}; margin-right: 8px;">&#10003;</span> Everything in Pro</td></tr>
        <tr><td style="padding: 4px 0; font-size: 14px; color: #374151;"><span style="color: ${EMERALD}; margin-right: 8px;">&#10003;</span> SSO / SAML + admin controls</td></tr>
        <tr><td style="padding: 4px 0; font-size: 14px; color: #374151;"><span style="color: ${EMERALD}; margin-right: 8px;">&#10003;</span> API access + priority support</td></tr>
        `}
      </table>
    </div>

    ${primaryButton("Go to Dashboard &rarr;", `${APP_URL}/dashboard`)}

    <p style="font-size: 13px; color: #9ca3af; margin: 24px 0 0; line-height: 1.6;">
      Manage your subscription anytime from <a href="${settingsUrl}" style="color: ${VIOLET}; text-decoration: none; font-weight: 600;">Settings</a>.
    </p>
  `;

  await getResend().emails.send({
    from: FROM_ADDRESS,
    to,
    subject: `You're on Reverbic ${planName}!`,
    html: emailShell(body, `Your upgrade to Reverbic ${planName} is confirmed.`),
  });
}

/** 8. Subscription Cancelled — sent when subscription is cancelled */
export async function sendSubscriptionCancelledEmail(to: string): Promise<void> {
  const body = `
    ${heading("Your subscription has been cancelled")}
    ${paragraph("Your Reverbic subscription has been cancelled. You'll continue to have access to your current plan features until the end of your billing period.")}

    ${infoBox("After your plan expires", "Your account will revert to the Free plan with 3 hours of transcription per month. All your existing transcripts and data will remain accessible.", AMBER, "#fffbeb")}

    ${paragraph("We'd love to have you back. If you change your mind, you can resubscribe anytime.")}

    ${primaryButton("Resubscribe &rarr;", `${APP_URL}/settings`)}
  `;

  await getResend().emails.send({
    from: FROM_ADDRESS,
    to,
    subject: "Your Reverbic subscription has been cancelled",
    html: emailShell(body, "Your Reverbic subscription has been cancelled. Access continues until period end."),
  });
}

/** 9. Payment Failed — sent when a payment attempt fails */
export async function sendPaymentFailedEmail(to: string): Promise<void> {
  const body = `
    <div style="display: inline-block; background: #fef2f2; border-radius: 8px; padding: 6px 12px; margin-bottom: 16px;">
      <span style="font-size: 12px; font-weight: 700; color: ${ROSE}; letter-spacing: 0.5px;">PAYMENT FAILED</span>
    </div>
    ${heading("We couldn't process your payment")}
    ${paragraph("Your last payment attempt failed. Please update your payment method to avoid service interruption.")}

    ${primaryButton("Update Payment Method &rarr;", `${APP_URL}/settings`)}

    <p style="font-size: 13px; color: #9ca3af; margin: 20px 0 0; line-height: 1.6;">
      We'll retry the payment in a few days. If the issue persists, your account may be downgraded to the Free plan.
    </p>
  `;

  await getResend().emails.send({
    from: FROM_ADDRESS,
    to,
    subject: "Action required: Payment failed for Reverbic",
    html: emailShell(body, "Your Reverbic payment failed. Update your payment method to continue."),
  });
}

/** 10. Admin Notification — new subscriber alert */
export async function sendAdminNewSubscriberEmail(
  to: string,
  buyerEmail: string,
  planName: string,
  price: string
): Promise<void> {
  const body = `
    <div style="display: inline-block; background: linear-gradient(135deg, #ecfdf5, #f0fdf4); border-radius: 8px; padding: 6px 12px; margin-bottom: 16px;">
      <span style="font-size: 12px; font-weight: 700; color: ${EMERALD}; letter-spacing: 0.5px;">&#128176; NEW SUBSCRIBER</span>
    </div>
    ${heading("New paying customer!")}
    ${paragraph(`<strong style="color: ${DEEP};">${esc(buyerEmail)}</strong> just subscribed to the <strong style="color: ${VIOLET};">${esc(planName)}</strong> plan at <strong>${esc(price)}</strong>.`)}

    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin-bottom: 24px;">
      <tr>
        ${statCard(esc(planName), "Plan", VIOLET)}
        <td style="width: 12px;"></td>
        ${statCard(esc(price), "Revenue", EMERALD)}
      </tr>
    </table>

    ${secondaryButton("View in Stripe &rarr;", "https://dashboard.stripe.com/subscriptions")}
  `;

  await getResend().emails.send({
    from: FROM_ADDRESS,
    to,
    subject: `New subscriber: ${buyerEmail} → ${planName} (${price})`,
    html: emailShell(body, `New subscriber! ${buyerEmail} joined ${planName} at ${price}.`),
  });
}

// ─── Utility ───

function esc(str: string): string {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}
