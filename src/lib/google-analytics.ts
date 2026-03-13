import { BetaAnalyticsDataClient } from "@google-analytics/data";

function getClient() {
  const keyJson = process.env.GOOGLE_SERVICE_ACCOUNT_KEY;
  if (!keyJson) throw new Error("GOOGLE_SERVICE_ACCOUNT_KEY not set");
  const credentials = JSON.parse(keyJson);
  return new BetaAnalyticsDataClient({ credentials });
}

const PROPERTY_ID = process.env.GA_PROPERTY_ID || "528307740";

export interface GAReport {
  thisWeek: PeriodMetrics;
  lastWeek: PeriodMetrics;
  topPages: PageMetric[];
  trafficSources: SourceMetric[];
  countries: GeoMetric[];
  devices: DeviceMetric[];
  dailyTrend: DailyMetric[];
  signupFunnel: FunnelMetrics;
}

interface PeriodMetrics {
  users: number;
  newUsers: number;
  sessions: number;
  pageviews: number;
  avgSessionDuration: number;
  bounceRate: number;
}

interface PageMetric {
  path: string;
  pageviews: number;
  users: number;
}

interface SourceMetric {
  source: string;
  medium: string;
  users: number;
  sessions: number;
}

interface GeoMetric {
  country: string;
  users: number;
  sessions: number;
}

interface DeviceMetric {
  category: string;
  users: number;
  percentage: number;
}

interface DailyMetric {
  date: string;
  users: number;
  sessions: number;
  pageviews: number;
}

interface FunnelMetrics {
  landingPageUsers: number;
  signupPageUsers: number;
  dashboardUsers: number;
}

function num(val: string | undefined | null): number {
  return val ? Number(val) : 0;
}

function formatDate(d: Date): string {
  return d.toISOString().split("T")[0];
}

export async function fetchWeeklyReport(): Promise<GAReport> {
  const client = getClient();
  const now = new Date();

  const thisWeekEnd = formatDate(now);
  const thisWeekStart = formatDate(new Date(now.getTime() - 6 * 86400000));
  const lastWeekEnd = formatDate(new Date(now.getTime() - 7 * 86400000));
  const lastWeekStart = formatDate(new Date(now.getTime() - 13 * 86400000));

  // Core metrics for this week and last week
  const [thisWeekRes] = await client.runReport({
    property: `properties/${PROPERTY_ID}`,
    dateRanges: [
      { startDate: thisWeekStart, endDate: thisWeekEnd },
      { startDate: lastWeekStart, endDate: lastWeekEnd },
    ],
    metrics: [
      { name: "totalUsers" },
      { name: "newUsers" },
      { name: "sessions" },
      { name: "screenPageViews" },
      { name: "averageSessionDuration" },
      { name: "bounceRate" },
    ],
  });

  const parsePeriod = (rowIndex: number): PeriodMetrics => {
    const row = thisWeekRes.rows?.[rowIndex];
    const vals = row?.metricValues || [];
    return {
      users: num(vals[0]?.value),
      newUsers: num(vals[1]?.value),
      sessions: num(vals[2]?.value),
      pageviews: num(vals[3]?.value),
      avgSessionDuration: num(vals[4]?.value),
      bounceRate: num(vals[5]?.value),
    };
  };

  const thisWeek = parsePeriod(0);
  const lastWeek = thisWeekRes.rows?.[1] ? parsePeriod(1) : { users: 0, newUsers: 0, sessions: 0, pageviews: 0, avgSessionDuration: 0, bounceRate: 0 };

  // Top pages
  const [pagesRes] = await client.runReport({
    property: `properties/${PROPERTY_ID}`,
    dateRanges: [{ startDate: thisWeekStart, endDate: thisWeekEnd }],
    dimensions: [{ name: "pagePath" }],
    metrics: [{ name: "screenPageViews" }, { name: "totalUsers" }],
    orderBys: [{ metric: { metricName: "screenPageViews" }, desc: true }],
    limit: 10,
  });

  const topPages: PageMetric[] = (pagesRes.rows || []).map((r) => ({
    path: r.dimensionValues?.[0]?.value || "",
    pageviews: num(r.metricValues?.[0]?.value),
    users: num(r.metricValues?.[1]?.value),
  }));

  // Traffic sources
  const [sourcesRes] = await client.runReport({
    property: `properties/${PROPERTY_ID}`,
    dateRanges: [{ startDate: thisWeekStart, endDate: thisWeekEnd }],
    dimensions: [{ name: "sessionSource" }, { name: "sessionMedium" }],
    metrics: [{ name: "totalUsers" }, { name: "sessions" }],
    orderBys: [{ metric: { metricName: "totalUsers" }, desc: true }],
    limit: 10,
  });

  const trafficSources: SourceMetric[] = (sourcesRes.rows || []).map((r) => ({
    source: r.dimensionValues?.[0]?.value || "(direct)",
    medium: r.dimensionValues?.[1]?.value || "(none)",
    users: num(r.metricValues?.[0]?.value),
    sessions: num(r.metricValues?.[1]?.value),
  }));

  // Countries
  const [geoRes] = await client.runReport({
    property: `properties/${PROPERTY_ID}`,
    dateRanges: [{ startDate: thisWeekStart, endDate: thisWeekEnd }],
    dimensions: [{ name: "country" }],
    metrics: [{ name: "totalUsers" }, { name: "sessions" }],
    orderBys: [{ metric: { metricName: "totalUsers" }, desc: true }],
    limit: 10,
  });

  const countries: GeoMetric[] = (geoRes.rows || []).map((r) => ({
    country: r.dimensionValues?.[0]?.value || "",
    users: num(r.metricValues?.[0]?.value),
    sessions: num(r.metricValues?.[1]?.value),
  }));

  // Devices
  const [deviceRes] = await client.runReport({
    property: `properties/${PROPERTY_ID}`,
    dateRanges: [{ startDate: thisWeekStart, endDate: thisWeekEnd }],
    dimensions: [{ name: "deviceCategory" }],
    metrics: [{ name: "totalUsers" }],
    orderBys: [{ metric: { metricName: "totalUsers" }, desc: true }],
  });

  const totalDeviceUsers = (deviceRes.rows || []).reduce((s, r) => s + num(r.metricValues?.[0]?.value), 0);
  const devices: DeviceMetric[] = (deviceRes.rows || []).map((r) => {
    const users = num(r.metricValues?.[0]?.value);
    return {
      category: r.dimensionValues?.[0]?.value || "",
      users,
      percentage: totalDeviceUsers > 0 ? Math.round((users / totalDeviceUsers) * 100) : 0,
    };
  });

  // Daily trend (last 14 days for sparkline context)
  const trendStart = formatDate(new Date(now.getTime() - 13 * 86400000));
  const [trendRes] = await client.runReport({
    property: `properties/${PROPERTY_ID}`,
    dateRanges: [{ startDate: trendStart, endDate: thisWeekEnd }],
    dimensions: [{ name: "date" }],
    metrics: [{ name: "totalUsers" }, { name: "sessions" }, { name: "screenPageViews" }],
    orderBys: [{ dimension: { dimensionName: "date" } }],
  });

  const dailyTrend: DailyMetric[] = (trendRes.rows || []).map((r) => ({
    date: r.dimensionValues?.[0]?.value || "",
    users: num(r.metricValues?.[0]?.value),
    sessions: num(r.metricValues?.[1]?.value),
    pageviews: num(r.metricValues?.[2]?.value),
  }));

  // Signup funnel — users who hit landing, signup, dashboard
  const [funnelRes] = await client.runReport({
    property: `properties/${PROPERTY_ID}`,
    dateRanges: [{ startDate: thisWeekStart, endDate: thisWeekEnd }],
    dimensions: [{ name: "pagePath" }],
    metrics: [{ name: "totalUsers" }],
    dimensionFilter: {
      orGroup: {
        expressions: [
          { filter: { fieldName: "pagePath", stringFilter: { value: "/", matchType: "EXACT" } } },
          { filter: { fieldName: "pagePath", stringFilter: { value: "/sign-up", matchType: "EXACT" } } },
          { filter: { fieldName: "pagePath", stringFilter: { value: "/dashboard", matchType: "EXACT" } } },
        ],
      },
    },
  });

  const funnelMap: Record<string, number> = {};
  for (const r of funnelRes.rows || []) {
    funnelMap[r.dimensionValues?.[0]?.value || ""] = num(r.metricValues?.[0]?.value);
  }

  const signupFunnel: FunnelMetrics = {
    landingPageUsers: funnelMap["/"] || 0,
    signupPageUsers: funnelMap["/sign-up"] || 0,
    dashboardUsers: funnelMap["/dashboard"] || 0,
  };

  return { thisWeek, lastWeek, topPages, trafficSources, countries, devices, dailyTrend, signupFunnel };
}

export async function fetchDailyMetrics(): Promise<{ today: PeriodMetrics; avg7d: PeriodMetrics }> {
  const client = getClient();
  const now = new Date();
  const today = formatDate(now);
  const weekAgo = formatDate(new Date(now.getTime() - 7 * 86400000));

  const [res] = await client.runReport({
    property: `properties/${PROPERTY_ID}`,
    dateRanges: [
      { startDate: today, endDate: today },
      { startDate: weekAgo, endDate: formatDate(new Date(now.getTime() - 86400000)) },
    ],
    metrics: [
      { name: "totalUsers" },
      { name: "newUsers" },
      { name: "sessions" },
      { name: "screenPageViews" },
      { name: "averageSessionDuration" },
      { name: "bounceRate" },
    ],
  });

  const parse = (idx: number): PeriodMetrics => {
    const row = res.rows?.[idx];
    const vals = row?.metricValues || [];
    return {
      users: num(vals[0]?.value),
      newUsers: num(vals[1]?.value),
      sessions: num(vals[2]?.value),
      pageviews: num(vals[3]?.value),
      avgSessionDuration: num(vals[4]?.value),
      bounceRate: num(vals[5]?.value),
    };
  };

  const todayMetrics = parse(0);
  const weekMetrics = res.rows?.[1] ? parse(1) : { users: 0, newUsers: 0, sessions: 0, pageviews: 0, avgSessionDuration: 0, bounceRate: 0 };

  // Average the 7-day period
  const avg7d: PeriodMetrics = {
    users: Math.round(weekMetrics.users / 7),
    newUsers: Math.round(weekMetrics.newUsers / 7),
    sessions: Math.round(weekMetrics.sessions / 7),
    pageviews: Math.round(weekMetrics.pageviews / 7),
    avgSessionDuration: weekMetrics.avgSessionDuration,
    bounceRate: weekMetrics.bounceRate,
  };

  return { today: todayMetrics, avg7d };
}
