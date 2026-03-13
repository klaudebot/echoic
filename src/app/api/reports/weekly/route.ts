import { NextRequest, NextResponse } from "next/server";
import { Resend } from "resend";
import { fetchWeeklyReport } from "@/lib/google-analytics";
import { buildWeeklyReportEmail } from "@/lib/report-email";

const resend = new Resend(process.env.RESEND_API_KEY);
const ADMIN_EMAIL = process.env.ADMIN_EMAIL || "michael@apexrush.com";
const CRON_SECRET = process.env.CRON_SECRET;

export async function GET(req: NextRequest) {
  // Verify cron secret or allow in development
  const authHeader = req.headers.get("authorization");
  if (CRON_SECRET && authHeader !== `Bearer ${CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const report = await fetchWeeklyReport();
    const { subject, html } = buildWeeklyReportEmail(report);

    await resend.emails.send({
      from: "Reverbic Analytics <noreply@reverbic.ai>",
      to: ADMIN_EMAIL,
      subject,
      html,
    });

    return NextResponse.json({
      ok: true,
      sent_to: ADMIN_EMAIL,
      subject,
      metrics: {
        users: report.thisWeek.users,
        sessions: report.thisWeek.sessions,
        pageviews: report.thisWeek.pageviews,
      },
    });
  } catch (error) {
    console.error("Weekly report error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 }
    );
  }
}
