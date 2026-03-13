import { NextRequest, NextResponse } from "next/server";
import { Resend } from "resend";
import { fetchDailyMetrics } from "@/lib/google-analytics";
import { buildSpikeAlertEmail } from "@/lib/report-email";

const resend = new Resend(process.env.RESEND_API_KEY);
const ADMIN_EMAIL = process.env.ADMIN_EMAIL || "michael@apexrush.com";
const CRON_SECRET = process.env.CRON_SECRET;
const SPIKE_THRESHOLD = 2; // Alert when traffic is 2x the 7-day average

export async function GET(req: NextRequest) {
  const authHeader = req.headers.get("authorization");
  if (CRON_SECRET && authHeader !== `Bearer ${CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { today, avg7d } = await fetchDailyMetrics();

    const isSpike = avg7d.users > 0 && today.users >= avg7d.users * SPIKE_THRESHOLD;

    if (isSpike) {
      const { subject, html } = buildSpikeAlertEmail(
        today.users,
        avg7d.users,
        today.sessions,
        avg7d.sessions
      );

      await resend.emails.send({
        from: "Reverbic Alerts <noreply@reverbic.ai>",
        to: ADMIN_EMAIL,
        subject,
        html,
      });

      return NextResponse.json({
        ok: true,
        spike: true,
        sent_to: ADMIN_EMAIL,
        today_users: today.users,
        avg_users: avg7d.users,
        multiplier: (today.users / avg7d.users).toFixed(1),
      });
    }

    return NextResponse.json({
      ok: true,
      spike: false,
      today_users: today.users,
      avg_users: avg7d.users,
      message: "No spike detected",
    });
  } catch (error) {
    console.error("Daily check error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 }
    );
  }
}
