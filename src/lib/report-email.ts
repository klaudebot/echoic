import type { GAReport } from "./google-analytics";

function pctChange(current: number, previous: number): string {
  if (previous === 0) return current > 0 ? "+∞%" : "0%";
  const pct = ((current - previous) / previous) * 100;
  const sign = pct >= 0 ? "+" : "";
  return `${sign}${pct.toFixed(1)}%`;
}

function changeColor(current: number, previous: number): string {
  if (current > previous) return "#10b981";
  if (current < previous) return "#ef4444";
  return "#94a3b8";
}

function fmtDuration(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = Math.round(seconds % 60);
  return `${m}m ${s}s`;
}

function fmtRate(rate: number): string {
  return `${(rate * 100).toFixed(1)}%`;
}

function metricRow(label: string, current: number, previous: number, formatter?: (n: number) => string): string {
  const fmt = formatter || ((n: number) => n.toLocaleString());
  const color = changeColor(current, previous);
  const change = pctChange(current, previous);
  return `
    <tr>
      <td style="padding:10px 16px;color:#94a3b8;font-size:14px;border-bottom:1px solid #1e293b">${label}</td>
      <td style="padding:10px 16px;color:#f1f5f9;font-size:14px;font-weight:600;text-align:right;border-bottom:1px solid #1e293b">${fmt(current)}</td>
      <td style="padding:10px 16px;color:#64748b;font-size:13px;text-align:right;border-bottom:1px solid #1e293b">${fmt(previous)}</td>
      <td style="padding:10px 16px;font-size:13px;font-weight:600;text-align:right;border-bottom:1px solid #1e293b;color:${color}">${change}</td>
    </tr>`;
}

export function buildWeeklyReportEmail(report: GAReport): { subject: string; html: string } {
  const { thisWeek: tw, lastWeek: lw, topPages, trafficSources, countries, devices, dailyTrend, signupFunnel } = report;

  const now = new Date();
  const weekEnd = now.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
  const weekStart = new Date(now.getTime() - 6 * 86400000).toLocaleDateString("en-US", { month: "short", day: "numeric" });

  const userChange = pctChange(tw.users, lw.users);
  const subject = `Reverbic Weekly: ${tw.users} users (${userChange}) — ${weekStart}–${weekEnd}`;

  // Sparkline as ASCII bar chart in the daily trend
  const maxUsers = Math.max(...dailyTrend.map((d) => d.users), 1);
  const trendRows = dailyTrend
    .map((d) => {
      const barWidth = Math.max(Math.round((d.users / maxUsers) * 120), 2);
      const dateStr = `${d.date.slice(4, 6)}/${d.date.slice(6, 8)}`;
      return `
      <tr>
        <td style="padding:4px 12px;color:#94a3b8;font-size:12px;white-space:nowrap">${dateStr}</td>
        <td style="padding:4px 8px;width:100%">
          <div style="background:linear-gradient(90deg,#7c3aed,#06b6d4);height:16px;width:${barWidth}px;border-radius:3px"></div>
        </td>
        <td style="padding:4px 12px;color:#f1f5f9;font-size:12px;text-align:right;white-space:nowrap">${d.users}</td>
      </tr>`;
    })
    .join("");

  // Top pages rows
  const pageRows = topPages
    .slice(0, 8)
    .map(
      (p) => `
    <tr>
      <td style="padding:8px 16px;color:#e2e8f0;font-size:13px;font-family:monospace;border-bottom:1px solid #1e293b">${p.path}</td>
      <td style="padding:8px 16px;color:#f1f5f9;font-size:13px;text-align:right;border-bottom:1px solid #1e293b">${p.pageviews}</td>
      <td style="padding:8px 16px;color:#94a3b8;font-size:13px;text-align:right;border-bottom:1px solid #1e293b">${p.users}</td>
    </tr>`
    )
    .join("");

  // Sources rows
  const sourceRows = trafficSources
    .slice(0, 8)
    .map(
      (s) => `
    <tr>
      <td style="padding:8px 16px;color:#e2e8f0;font-size:13px;border-bottom:1px solid #1e293b">${s.source} / ${s.medium}</td>
      <td style="padding:8px 16px;color:#f1f5f9;font-size:13px;text-align:right;border-bottom:1px solid #1e293b">${s.users}</td>
      <td style="padding:8px 16px;color:#94a3b8;font-size:13px;text-align:right;border-bottom:1px solid #1e293b">${s.sessions}</td>
    </tr>`
    )
    .join("");

  // Countries
  const countryRows = countries
    .slice(0, 6)
    .map(
      (c) => `
    <tr>
      <td style="padding:8px 16px;color:#e2e8f0;font-size:13px;border-bottom:1px solid #1e293b">${c.country}</td>
      <td style="padding:8px 16px;color:#f1f5f9;font-size:13px;text-align:right;border-bottom:1px solid #1e293b">${c.users}</td>
    </tr>`
    )
    .join("");

  // Devices
  const deviceRows = devices
    .map(
      (d) => `
    <tr>
      <td style="padding:8px 16px;color:#e2e8f0;font-size:13px;border-bottom:1px solid #1e293b">${d.category}</td>
      <td style="padding:8px 16px;color:#f1f5f9;font-size:13px;text-align:right;border-bottom:1px solid #1e293b">${d.users}</td>
      <td style="padding:8px 16px;color:#94a3b8;font-size:13px;text-align:right;border-bottom:1px solid #1e293b">${d.percentage}%</td>
    </tr>`
    )
    .join("");

  // Funnel
  const funnelRate1 = signupFunnel.landingPageUsers > 0 ? ((signupFunnel.signupPageUsers / signupFunnel.landingPageUsers) * 100).toFixed(1) : "0";
  const funnelRate2 = signupFunnel.signupPageUsers > 0 ? ((signupFunnel.dashboardUsers / signupFunnel.signupPageUsers) * 100).toFixed(1) : "0";

  const html = `<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width"></head>
<body style="margin:0;padding:0;background:#0a0c10;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif">
<div style="max-width:640px;margin:0 auto;padding:24px 16px">

  <!-- Header -->
  <div style="text-align:center;padding:32px 0 24px">
    <img src="https://reverbic.ai/icon-transparent.png" alt="Reverbic" width="40" height="40" style="margin-bottom:12px">
    <h1 style="margin:0;color:#f1f5f9;font-size:22px;font-weight:700">Weekly Analytics Report</h1>
    <p style="margin:6px 0 0;color:#64748b;font-size:14px">${weekStart} – ${weekEnd}</p>
  </div>

  <!-- Key Metrics -->
  <div style="background:#0f172a;border:1px solid #1e293b;border-radius:12px;overflow:hidden;margin-bottom:20px">
    <div style="padding:16px 16px 8px;border-bottom:1px solid #1e293b">
      <h2 style="margin:0;color:#f1f5f9;font-size:15px;font-weight:600">Key Metrics</h2>
    </div>
    <table style="width:100%;border-collapse:collapse">
      <tr>
        <td style="padding:8px 16px;color:#64748b;font-size:12px;text-transform:uppercase;letter-spacing:0.05em"></td>
        <td style="padding:8px 16px;color:#64748b;font-size:12px;text-transform:uppercase;letter-spacing:0.05em;text-align:right">This Week</td>
        <td style="padding:8px 16px;color:#64748b;font-size:12px;text-transform:uppercase;letter-spacing:0.05em;text-align:right">Last Week</td>
        <td style="padding:8px 16px;color:#64748b;font-size:12px;text-transform:uppercase;letter-spacing:0.05em;text-align:right">Change</td>
      </tr>
      ${metricRow("Users", tw.users, lw.users)}
      ${metricRow("New Users", tw.newUsers, lw.newUsers)}
      ${metricRow("Sessions", tw.sessions, lw.sessions)}
      ${metricRow("Pageviews", tw.pageviews, lw.pageviews)}
      ${metricRow("Avg Duration", tw.avgSessionDuration, lw.avgSessionDuration, fmtDuration)}
      ${metricRow("Bounce Rate", tw.bounceRate, lw.bounceRate, fmtRate)}
    </table>
  </div>

  <!-- Daily Trend -->
  <div style="background:#0f172a;border:1px solid #1e293b;border-radius:12px;overflow:hidden;margin-bottom:20px">
    <div style="padding:16px 16px 8px;border-bottom:1px solid #1e293b">
      <h2 style="margin:0;color:#f1f5f9;font-size:15px;font-weight:600">Daily Users (14 days)</h2>
    </div>
    <table style="width:100%;border-collapse:collapse;padding:8px 0">
      ${trendRows}
    </table>
  </div>

  <!-- Signup Funnel -->
  <div style="background:#0f172a;border:1px solid #1e293b;border-radius:12px;overflow:hidden;margin-bottom:20px">
    <div style="padding:16px 16px 8px;border-bottom:1px solid #1e293b">
      <h2 style="margin:0;color:#f1f5f9;font-size:15px;font-weight:600">Signup Funnel</h2>
    </div>
    <table style="width:100%;border-collapse:collapse">
      <tr>
        <td style="padding:12px 16px;color:#94a3b8;font-size:14px;border-bottom:1px solid #1e293b">Landing Page (/)</td>
        <td style="padding:12px 16px;color:#f1f5f9;font-size:14px;font-weight:600;text-align:right;border-bottom:1px solid #1e293b">${signupFunnel.landingPageUsers} users</td>
        <td style="padding:12px 16px;color:#64748b;font-size:13px;text-align:right;border-bottom:1px solid #1e293b">—</td>
      </tr>
      <tr>
        <td style="padding:12px 16px;color:#94a3b8;font-size:14px;border-bottom:1px solid #1e293b">Sign Up (/sign-up)</td>
        <td style="padding:12px 16px;color:#f1f5f9;font-size:14px;font-weight:600;text-align:right;border-bottom:1px solid #1e293b">${signupFunnel.signupPageUsers} users</td>
        <td style="padding:12px 16px;color:#10b981;font-size:13px;font-weight:600;text-align:right;border-bottom:1px solid #1e293b">${funnelRate1}% of landing</td>
      </tr>
      <tr>
        <td style="padding:12px 16px;color:#94a3b8;font-size:14px">Dashboard (/dashboard)</td>
        <td style="padding:12px 16px;color:#f1f5f9;font-size:14px;font-weight:600;text-align:right">${signupFunnel.dashboardUsers} users</td>
        <td style="padding:12px 16px;color:#10b981;font-size:13px;font-weight:600;text-align:right">${funnelRate2}% of signups</td>
      </tr>
    </table>
  </div>

  <!-- Top Pages -->
  <div style="background:#0f172a;border:1px solid #1e293b;border-radius:12px;overflow:hidden;margin-bottom:20px">
    <div style="padding:16px 16px 8px;border-bottom:1px solid #1e293b">
      <h2 style="margin:0;color:#f1f5f9;font-size:15px;font-weight:600">Top Pages</h2>
    </div>
    <table style="width:100%;border-collapse:collapse">
      <tr>
        <td style="padding:8px 16px;color:#64748b;font-size:12px;text-transform:uppercase;letter-spacing:0.05em">Page</td>
        <td style="padding:8px 16px;color:#64748b;font-size:12px;text-transform:uppercase;letter-spacing:0.05em;text-align:right">Views</td>
        <td style="padding:8px 16px;color:#64748b;font-size:12px;text-transform:uppercase;letter-spacing:0.05em;text-align:right">Users</td>
      </tr>
      ${pageRows}
    </table>
  </div>

  <!-- Traffic Sources -->
  <div style="background:#0f172a;border:1px solid #1e293b;border-radius:12px;overflow:hidden;margin-bottom:20px">
    <div style="padding:16px 16px 8px;border-bottom:1px solid #1e293b">
      <h2 style="margin:0;color:#f1f5f9;font-size:15px;font-weight:600">Traffic Sources</h2>
    </div>
    <table style="width:100%;border-collapse:collapse">
      <tr>
        <td style="padding:8px 16px;color:#64748b;font-size:12px;text-transform:uppercase;letter-spacing:0.05em">Source / Medium</td>
        <td style="padding:8px 16px;color:#64748b;font-size:12px;text-transform:uppercase;letter-spacing:0.05em;text-align:right">Users</td>
        <td style="padding:8px 16px;color:#64748b;font-size:12px;text-transform:uppercase;letter-spacing:0.05em;text-align:right">Sessions</td>
      </tr>
      ${sourceRows}
    </table>
  </div>

  <!-- Countries & Devices side by side -->
  <table style="width:100%;border-collapse:collapse;margin-bottom:20px" cellpadding="0" cellspacing="0">
    <tr>
      <td style="width:50%;vertical-align:top;padding-right:10px">
        <div style="background:#0f172a;border:1px solid #1e293b;border-radius:12px;overflow:hidden">
          <div style="padding:16px 16px 8px;border-bottom:1px solid #1e293b">
            <h2 style="margin:0;color:#f1f5f9;font-size:15px;font-weight:600">Countries</h2>
          </div>
          <table style="width:100%;border-collapse:collapse">
            ${countryRows}
          </table>
        </div>
      </td>
      <td style="width:50%;vertical-align:top;padding-left:10px">
        <div style="background:#0f172a;border:1px solid #1e293b;border-radius:12px;overflow:hidden">
          <div style="padding:16px 16px 8px;border-bottom:1px solid #1e293b">
            <h2 style="margin:0;color:#f1f5f9;font-size:15px;font-weight:600">Devices</h2>
          </div>
          <table style="width:100%;border-collapse:collapse">
            ${deviceRows}
          </table>
        </div>
      </td>
    </tr>
  </table>

  <!-- Footer -->
  <div style="text-align:center;padding:16px 0 32px">
    <p style="margin:0;color:#475569;font-size:12px">Reverbic Analytics Report • <a href="https://analytics.google.com" style="color:#7c3aed;text-decoration:none">Open Google Analytics</a></p>
  </div>

</div>
</body>
</html>`;

  return { subject, html };
}

export function buildSpikeAlertEmail(
  todayUsers: number,
  avgUsers: number,
  todaySessions: number,
  avgSessions: number
): { subject: string; html: string } {
  const multiplier = avgUsers > 0 ? (todayUsers / avgUsers).toFixed(1) : "∞";
  const subject = `🚀 Reverbic Traffic Spike: ${todayUsers} users today (${multiplier}x average)`;

  const html = `<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width"></head>
<body style="margin:0;padding:0;background:#0a0c10;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif">
<div style="max-width:540px;margin:0 auto;padding:24px 16px">
  <div style="text-align:center;padding:32px 0 24px">
    <img src="https://reverbic.ai/icon-transparent.png" alt="Reverbic" width="40" height="40" style="margin-bottom:12px">
    <h1 style="margin:0;color:#f1f5f9;font-size:22px;font-weight:700">Traffic Spike Detected</h1>
  </div>

  <div style="background:#0f172a;border:1px solid #1e293b;border-radius:12px;padding:24px;text-align:center;margin-bottom:20px">
    <div style="font-size:48px;font-weight:700;background:linear-gradient(135deg,#7c3aed,#06b6d4);-webkit-background-clip:text;-webkit-text-fill-color:transparent">${todayUsers}</div>
    <div style="color:#94a3b8;font-size:14px;margin-top:4px">users today</div>
    <div style="margin-top:16px;color:#10b981;font-size:16px;font-weight:600">${multiplier}x your 7-day average (${avgUsers}/day)</div>
  </div>

  <div style="background:#0f172a;border:1px solid #1e293b;border-radius:12px;overflow:hidden;margin-bottom:20px">
    <table style="width:100%;border-collapse:collapse">
      <tr>
        <td style="padding:12px 16px;color:#94a3b8;font-size:14px;border-bottom:1px solid #1e293b">Today's Sessions</td>
        <td style="padding:12px 16px;color:#f1f5f9;font-size:14px;font-weight:600;text-align:right;border-bottom:1px solid #1e293b">${todaySessions}</td>
      </tr>
      <tr>
        <td style="padding:12px 16px;color:#94a3b8;font-size:14px">Avg Daily Sessions</td>
        <td style="padding:12px 16px;color:#f1f5f9;font-size:14px;font-weight:600;text-align:right">${avgSessions}</td>
      </tr>
    </table>
  </div>

  <div style="text-align:center;padding:8px 0">
    <a href="https://analytics.google.com" style="display:inline-block;background:linear-gradient(135deg,#7c3aed,#06b6d4);color:#fff;text-decoration:none;padding:12px 32px;border-radius:8px;font-size:14px;font-weight:600">View in Google Analytics</a>
  </div>

  <div style="text-align:center;padding:24px 0">
    <p style="margin:0;color:#475569;font-size:12px">Reverbic Traffic Alert</p>
  </div>
</div>
</body>
</html>`;

  return { subject, html };
}
