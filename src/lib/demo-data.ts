// ─── TYPES ───────────────────────────────────────

export interface Meeting {
  id: string;
  title: string;
  date: string;
  duration: number; // seconds
  platform: "zoom" | "google_meet" | "teams" | "upload" | "recording";
  participants: Participant[];
  status: "completed" | "processing" | "live" | "scheduled";
  summary?: string;
  keyPoints?: string[];
  actionItems?: ActionItem[];
  decisions?: Decision[];
  transcript?: TranscriptSegment[];
  sentiment?: number; // 0-100
  tags: string[];
  folder?: string;
}

export interface Participant {
  name: string;
  email?: string;
  role?: string;
  talkTime: number; // seconds
  avatar?: string;
}

export interface ActionItem {
  id: string;
  meetingId: string;
  text: string;
  assignee: string;
  dueDate?: string;
  status: "pending" | "in_progress" | "completed" | "overdue";
  priority: "high" | "medium" | "low";
  createdAt: string;
}

export interface Decision {
  id: string;
  meetingId: string;
  text: string;
  madeBy: string;
  context: string;
  timestamp: number; // seconds into meeting
  createdAt: string;
}

export interface TranscriptSegment {
  speaker: string;
  text: string;
  timestamp: number; // seconds
  confidence: number; // 0-1
  isHighlight?: boolean;
  sentiment?: "positive" | "neutral" | "negative";
}

export interface CoachMetric {
  meetingId: string;
  talkRatio: number; // % of time you spoke
  fillerWords: number;
  pace: number; // words per minute
  longestMonologue: number; // seconds
  questionsAsked: number;
  interruptionCount: number;
  clarity: number; // 1-10
  engagement: number; // 1-10
  sentiment: number; // 0-100
}

export interface SmartClip {
  id: string;
  meetingId: string;
  meetingTitle: string;
  title: string;
  description: string;
  startTime: number;
  endTime: number;
  type: "decision" | "action_item" | "highlight" | "question" | "insight";
  speaker: string;
  createdAt: string;
  shared: boolean;
  views: number;
}

export interface WeeklyDigest {
  weekOf: string;
  totalMeetings: number;
  totalHours: number;
  actionItemsCreated: number;
  actionItemsCompleted: number;
  decisionsLogged: number;
  topSpeakers: { name: string; minutes: number }[];
  coachScore: number;
  trend: "up" | "down" | "stable";
  insight: string;
}

// ─── DEMO MEETINGS ──────────────────────────────

export const demoMeetings: Meeting[] = [
  {
    id: "mtg-1",
    title: "Q1 Product Roadmap Review",
    date: "2026-03-10T10:00:00",
    duration: 3420,
    platform: "zoom",
    participants: [
      { name: "You", role: "Product Lead", talkTime: 1200 },
      { name: "Sarah Chen", email: "sarah@company.com", role: "Engineering Manager", talkTime: 980 },
      { name: "Marcus Johnson", email: "marcus@company.com", role: "Designer", talkTime: 620 },
      { name: "Priya Patel", email: "priya@company.com", role: "Data Analyst", talkTime: 420 },
      { name: "Alex Kim", email: "alex@company.com", role: "CTO", talkTime: 200 },
    ],
    status: "completed",
    summary: "Reviewed Q1 roadmap progress. AI features are on track for April launch. Mobile app redesign pushed to Q2 due to resource constraints. Agreed to hire two more frontend developers. Data pipeline upgrade approved with $50K budget.",
    keyPoints: [
      "AI-powered search launching April 15th — ahead of schedule",
      "Mobile redesign delayed to Q2 — need 2 more frontend devs",
      "Data pipeline upgrade approved — $50K budget, Sarah leading",
      "Customer churn reduced 12% after onboarding flow changes",
      "New enterprise tier pricing finalized at $99/seat/month",
    ],
    actionItems: [
      { id: "ai-1", meetingId: "mtg-1", text: "Draft job descriptions for 2 frontend developer positions", assignee: "Sarah Chen", dueDate: "2026-03-14", status: "in_progress", priority: "high", createdAt: "2026-03-10T11:00:00" },
      { id: "ai-2", meetingId: "mtg-1", text: "Finalize data pipeline migration plan and timeline", assignee: "Priya Patel", dueDate: "2026-03-17", status: "pending", priority: "high", createdAt: "2026-03-10T11:00:00" },
      { id: "ai-3", meetingId: "mtg-1", text: "Update pricing page with new enterprise tier", assignee: "Marcus Johnson", dueDate: "2026-03-12", status: "completed", priority: "medium", createdAt: "2026-03-10T11:00:00" },
      { id: "ai-4", meetingId: "mtg-1", text: "Schedule deep-dive on AI search feature with engineering", assignee: "You", dueDate: "2026-03-11", status: "completed", priority: "medium", createdAt: "2026-03-10T11:00:00" },
    ],
    decisions: [
      { id: "d-1", meetingId: "mtg-1", text: "Hire 2 frontend developers to support mobile redesign", madeBy: "Alex Kim", context: "Mobile redesign cannot proceed with current team capacity", timestamp: 1200, createdAt: "2026-03-10T11:00:00" },
      { id: "d-2", meetingId: "mtg-1", text: "Approve $50K budget for data pipeline upgrade", madeBy: "Alex Kim", context: "Current pipeline hitting performance limits at scale", timestamp: 2400, createdAt: "2026-03-10T11:00:00" },
      { id: "d-3", meetingId: "mtg-1", text: "Set enterprise tier pricing at $99/seat/month", madeBy: "You", context: "Competitive analysis shows this positions us below Datadog but above smaller players", timestamp: 3000, createdAt: "2026-03-10T11:00:00" },
    ],
    transcript: [
      { speaker: "You", text: "Alright everyone, let's kick off the Q1 roadmap review. Sarah, can you start with the engineering update?", timestamp: 0, confidence: 0.98, sentiment: "neutral" },
      { speaker: "Sarah Chen", text: "Sure. So the AI-powered search feature is actually ahead of schedule. We've completed the vector embedding pipeline and the query interface is in final testing. We're targeting April 15th for the launch.", timestamp: 15, confidence: 0.97, sentiment: "positive", isHighlight: true },
      { speaker: "You", text: "That's great news. What about the mobile app redesign?", timestamp: 45, confidence: 0.99, sentiment: "positive" },
      { speaker: "Sarah Chen", text: "That's where we have a challenge. We're short on frontend resources. The redesign is going to need to move to Q2 unless we can bring on more help.", timestamp: 55, confidence: 0.96, sentiment: "negative" },
      { speaker: "Alex Kim", text: "How many people do we need?", timestamp: 80, confidence: 0.99, sentiment: "neutral" },
      { speaker: "Sarah Chen", text: "Two senior frontend developers would get us back on track. I can have job descriptions ready by end of week.", timestamp: 88, confidence: 0.97, sentiment: "neutral" },
      { speaker: "Alex Kim", text: "Let's do it. I'll approve the headcount. Sarah, get those JDs drafted by Friday.", timestamp: 105, confidence: 0.98, sentiment: "positive", isHighlight: true },
      { speaker: "Priya Patel", text: "On the data side, our pipeline is hitting some performance bottlenecks. We're processing 2 million events per day now and the current architecture isn't scaling well.", timestamp: 130, confidence: 0.95, sentiment: "negative" },
      { speaker: "You", text: "What would the upgrade look like cost-wise?", timestamp: 155, confidence: 0.99, sentiment: "neutral" },
      { speaker: "Priya Patel", text: "We've scoped it at about 50K for the migration to the new streaming architecture. Should handle 10x our current volume.", timestamp: 162, confidence: 0.96, sentiment: "neutral" },
      { speaker: "Alex Kim", text: "That seems reasonable. Approved. Priya, can you put together a detailed migration plan by next week?", timestamp: 185, confidence: 0.98, sentiment: "positive", isHighlight: true },
      { speaker: "Marcus Johnson", text: "Quick design update — the onboarding flow changes we shipped last month are showing really positive results. Customer churn dropped 12 percent.", timestamp: 210, confidence: 0.94, sentiment: "positive", isHighlight: true },
      { speaker: "You", text: "That's a significant improvement. Nice work, Marcus. Let's talk about the enterprise pricing. I've been analyzing competitor pricing and I think $99 per seat per month positions us well.", timestamp: 240, confidence: 0.97, sentiment: "positive" },
      { speaker: "Alex Kim", text: "Where does that put us relative to the competition?", timestamp: 275, confidence: 0.99, sentiment: "neutral" },
      { speaker: "You", text: "Below Datadog and Splunk, but above the smaller monitoring tools. It's a sweet spot for mid-market companies.", timestamp: 282, confidence: 0.98, sentiment: "neutral" },
      { speaker: "Alex Kim", text: "I'm comfortable with that. Let's go with $99 per seat. Marcus, can you update the pricing page?", timestamp: 305, confidence: 0.97, sentiment: "positive", isHighlight: true },
    ],
    sentiment: 72,
    tags: ["roadmap", "quarterly-review", "product"],
    folder: "Product",
  },
  {
    id: "mtg-2",
    title: "Weekly Engineering Standup",
    date: "2026-03-10T09:00:00",
    duration: 1800,
    platform: "google_meet",
    participants: [
      { name: "You", role: "Product Lead", talkTime: 300 },
      { name: "Sarah Chen", role: "Engineering Manager", talkTime: 600 },
      { name: "David Park", role: "Backend Engineer", talkTime: 400 },
      { name: "Lisa Wang", role: "Frontend Engineer", talkTime: 350 },
      { name: "James Rodriguez", role: "DevOps", talkTime: 150 },
    ],
    status: "completed",
    summary: "Sprint review for week 10. Auth microservice migration complete. Performance regression found in search — hotfix in progress. Frontend team blocked on API schema changes.",
    keyPoints: [
      "Auth microservice migration to Kubernetes completed successfully",
      "Search performance regression identified — 200ms→800ms latency increase",
      "David deploying hotfix for search by end of day",
      "Frontend team blocked on API v3 schema — needs backend coordination",
      "CI/CD pipeline improvements reduced build times by 40%",
    ],
    actionItems: [
      { id: "ai-5", meetingId: "mtg-2", text: "Deploy search performance hotfix", assignee: "David Park", dueDate: "2026-03-10", status: "completed", priority: "high", createdAt: "2026-03-10T09:30:00" },
      { id: "ai-6", meetingId: "mtg-2", text: "Schedule API v3 schema review with frontend team", assignee: "Sarah Chen", dueDate: "2026-03-11", status: "in_progress", priority: "medium", createdAt: "2026-03-10T09:30:00" },
      { id: "ai-7", meetingId: "mtg-2", text: "Document new CI/CD pipeline configuration", assignee: "James Rodriguez", dueDate: "2026-03-14", status: "pending", priority: "low", createdAt: "2026-03-10T09:30:00" },
    ],
    decisions: [
      { id: "d-4", meetingId: "mtg-2", text: "Prioritize search hotfix over new feature work today", madeBy: "Sarah Chen", context: "Search latency regression affecting production users", timestamp: 600, createdAt: "2026-03-10T09:30:00" },
    ],
    transcript: [
      { speaker: "Sarah Chen", text: "Good morning everyone. Let's go around. David, what's the update on the auth migration?", timestamp: 0, confidence: 0.97, sentiment: "neutral" },
      { speaker: "David Park", text: "Auth microservice is fully migrated to Kubernetes. All health checks are green, latency is actually better than before — down to 45ms average.", timestamp: 12, confidence: 0.96, sentiment: "positive", isHighlight: true },
      { speaker: "Sarah Chen", text: "Excellent. Lisa, how's the frontend looking?", timestamp: 35, confidence: 0.98, sentiment: "positive" },
      { speaker: "Lisa Wang", text: "I'm blocked on the dashboard redesign. The API v3 schema changes haven't been finalized yet, so I can't wire up the new components.", timestamp: 42, confidence: 0.95, sentiment: "negative" },
      { speaker: "Sarah Chen", text: "Let me schedule a quick sync between you and David to finalize that schema. We can't have you blocked.", timestamp: 65, confidence: 0.97, sentiment: "neutral" },
      { speaker: "James Rodriguez", text: "CI update — I've optimized the build pipeline. We're seeing 40% faster builds across all repos now.", timestamp: 85, confidence: 0.94, sentiment: "positive", isHighlight: true },
      { speaker: "David Park", text: "One thing — I noticed the search service is showing some performance regression. Response times went from 200ms to about 800ms after last night's deploy.", timestamp: 110, confidence: 0.96, sentiment: "negative", isHighlight: true },
      { speaker: "Sarah Chen", text: "That's critical. David, can you get a hotfix out today? Let's prioritize that over the new feature work.", timestamp: 135, confidence: 0.98, sentiment: "neutral" },
    ],
    sentiment: 65,
    tags: ["engineering", "standup", "weekly"],
    folder: "Engineering",
  },
  {
    id: "mtg-3",
    title: "Client Onboarding: Meridian Corp",
    date: "2026-03-09T14:00:00",
    duration: 2700,
    platform: "zoom",
    participants: [
      { name: "You", role: "Account Manager", talkTime: 1100 },
      { name: "Rachel Torres", role: "Customer Success", talkTime: 800 },
      { name: "Tom Nakamura", email: "tom@meridiancorp.com", role: "VP Engineering (Meridian)", talkTime: 500 },
      { name: "Elena Vasquez", email: "elena@meridiancorp.com", role: "CTO (Meridian)", talkTime: 300 },
    ],
    status: "completed",
    summary: "Onboarding kickoff for Meridian Corp (150-seat enterprise deal). Discussed implementation timeline, SSO requirements, and custom integration needs. Meridian wants Slack and Jira integrations before go-live. Target launch: April 1st.",
    keyPoints: [
      "150-seat enterprise deal — $14,850/month",
      "SSO integration required (Okta) — Rachel leading",
      "Custom Slack and Jira integrations needed before go-live",
      "Target go-live: April 1st",
      "Meridian running pilot with 20 users starting March 17",
    ],
    actionItems: [
      { id: "ai-8", meetingId: "mtg-3", text: "Set up Okta SSO integration for Meridian", assignee: "Rachel Torres", dueDate: "2026-03-14", status: "in_progress", priority: "high", createdAt: "2026-03-09T15:00:00" },
      { id: "ai-9", meetingId: "mtg-3", text: "Deploy Slack integration to Meridian sandbox", assignee: "You", dueDate: "2026-03-16", status: "pending", priority: "high", createdAt: "2026-03-09T15:00:00" },
      { id: "ai-10", meetingId: "mtg-3", text: "Prepare 20-user pilot environment", assignee: "Rachel Torres", dueDate: "2026-03-15", status: "pending", priority: "medium", createdAt: "2026-03-09T15:00:00" },
    ],
    decisions: [
      { id: "d-5", meetingId: "mtg-3", text: "April 1st go-live date for full Meridian rollout", madeBy: "Tom Nakamura", context: "Aligns with Meridian's Q2 planning cycle", timestamp: 1800, createdAt: "2026-03-09T15:00:00" },
      { id: "d-6", meetingId: "mtg-3", text: "20-user pilot starting March 17 to validate SSO and integrations", madeBy: "Elena Vasquez", context: "Want to test with engineering team before company-wide rollout", timestamp: 2200, createdAt: "2026-03-09T15:00:00" },
    ],
    sentiment: 82,
    tags: ["client", "onboarding", "enterprise"],
    folder: "Sales",
  },
  {
    id: "mtg-4",
    title: "Design Sprint: Dashboard Redesign",
    date: "2026-03-08T13:00:00",
    duration: 5400,
    platform: "zoom",
    participants: [
      { name: "You", role: "Product Lead", talkTime: 1800 },
      { name: "Marcus Johnson", role: "Lead Designer", talkTime: 2000 },
      { name: "Lisa Wang", role: "Frontend Engineer", talkTime: 1000 },
      { name: "Nina Okafor", role: "UX Researcher", talkTime: 600 },
    ],
    status: "completed",
    summary: "Full-day design sprint for dashboard redesign. Reviewed user research findings, created wireframes for 3 layout concepts, and voted on final direction. Going with 'Command Center' layout featuring customizable widgets and AI-powered insights.",
    keyPoints: [
      "User research: 73% of users want customizable dashboard widgets",
      "3 concepts explored: Command Center, Timeline View, Card Grid",
      "Team voted for Command Center — most flexible and powerful",
      "AI insights widget showing meeting trends approved unanimously",
      "Prototype deadline: March 20 for user testing",
    ],
    actionItems: [
      { id: "ai-11", meetingId: "mtg-4", text: "Build high-fidelity prototype of Command Center layout", assignee: "Marcus Johnson", dueDate: "2026-03-20", status: "in_progress", priority: "high", createdAt: "2026-03-08T15:30:00" },
      { id: "ai-12", meetingId: "mtg-4", text: "Recruit 8 users for prototype testing sessions", assignee: "Nina Okafor", dueDate: "2026-03-18", status: "pending", priority: "medium", createdAt: "2026-03-08T15:30:00" },
      { id: "ai-13", meetingId: "mtg-4", text: "Spec out AI insights widget data requirements", assignee: "You", dueDate: "2026-03-14", status: "in_progress", priority: "high", createdAt: "2026-03-08T15:30:00" },
    ],
    decisions: [
      { id: "d-7", meetingId: "mtg-4", text: "Go with Command Center layout for dashboard redesign", madeBy: "You", context: "Most flexible, supports customizable widgets, aligns with power-user feedback", timestamp: 3600, createdAt: "2026-03-08T15:30:00" },
    ],
    sentiment: 88,
    tags: ["design", "sprint", "dashboard"],
    folder: "Design",
  },
  {
    id: "mtg-5",
    title: "Investor Update - Series B Planning",
    date: "2026-03-07T16:00:00",
    duration: 3600,
    platform: "zoom",
    participants: [
      { name: "You", role: "CEO", talkTime: 1500 },
      { name: "Alex Kim", role: "CTO", talkTime: 900 },
      { name: "Jordan Lee", role: "CFO", talkTime: 800 },
      { name: "Michelle Park", email: "michelle@sequoia.com", role: "Partner (Sequoia)", talkTime: 400 },
    ],
    status: "completed",
    summary: "Series B planning discussion with Sequoia. Presented growth metrics: 340% YoY revenue growth, 92% gross retention. Sequoia interested in leading at $80M valuation. Need to prepare full data room by March 21.",
    keyPoints: [
      "Revenue: $4.2M ARR, growing 340% YoY",
      "92% gross retention, 118% net retention",
      "Sequoia interested in leading Series B at $80M valuation",
      "Data room preparation needed by March 21",
      "Target raise: $20M for international expansion and AI R&D",
    ],
    actionItems: [
      { id: "ai-14", meetingId: "mtg-5", text: "Prepare Series B data room with updated financials", assignee: "Jordan Lee", dueDate: "2026-03-21", status: "in_progress", priority: "high", createdAt: "2026-03-07T17:00:00" },
      { id: "ai-15", meetingId: "mtg-5", text: "Create technical architecture overview document for investors", assignee: "Alex Kim", dueDate: "2026-03-18", status: "pending", priority: "medium", createdAt: "2026-03-07T17:00:00" },
      { id: "ai-16", meetingId: "mtg-5", text: "Draft international expansion plan for data room", assignee: "You", dueDate: "2026-03-20", status: "pending", priority: "high", createdAt: "2026-03-07T17:00:00" },
    ],
    decisions: [
      { id: "d-8", meetingId: "mtg-5", text: "Target $20M Series B raise at $80M pre-money valuation", madeBy: "You", context: "Sequoia expressed strong interest; valuation aligns with 19x ARR multiple", timestamp: 2400, createdAt: "2026-03-07T17:00:00" },
    ],
    sentiment: 90,
    tags: ["investor", "fundraising", "series-b"],
    folder: "Executive",
  },
  {
    id: "mtg-6",
    title: "Customer Feedback Review",
    date: "2026-03-07T11:00:00",
    duration: 2400,
    platform: "google_meet",
    participants: [
      { name: "You", role: "Product Lead", talkTime: 800 },
      { name: "Rachel Torres", role: "Customer Success", talkTime: 700 },
      { name: "Nina Okafor", role: "UX Researcher", talkTime: 600 },
      { name: "Marcus Johnson", role: "Designer", talkTime: 300 },
    ],
    status: "completed",
    summary: "Reviewed Q1 customer feedback themes. Top requests: real-time collaboration, calendar blocking, and mobile app improvements. NPS increased from 42 to 58. Biggest complaint: transcript accuracy for non-English meetings.",
    keyPoints: [
      "NPS improved from 42 to 58 quarter-over-quarter",
      "Top feature request: real-time collaborative editing of notes",
      "Calendar blocking feature requested by 34% of enterprise users",
      "Transcript accuracy for non-English meetings is #1 complaint",
      "Mobile app rated 3.2/5 stars — needs significant improvement",
    ],
    sentiment: 68,
    tags: ["feedback", "customer-success", "research"],
    folder: "Product",
  },
  {
    id: "mtg-7",
    title: "All-Hands: March Company Update",
    date: "2026-03-06T10:00:00",
    duration: 3600,
    platform: "zoom",
    participants: [
      { name: "You", role: "CEO", talkTime: 2000 },
      { name: "Alex Kim", role: "CTO", talkTime: 600 },
      { name: "Jordan Lee", role: "CFO", talkTime: 400 },
      { name: "Team (42 attendees)", role: "Various", talkTime: 600 },
    ],
    status: "completed",
    summary: "Monthly all-hands meeting. Celebrated crossing 1,000 paying customers. Announced new VP of Marketing hire (starting March 24). Engineering team demonstrated AI summary improvements. Q&A covered remote work policy and equity refresh program.",
    keyPoints: [
      "Crossed 1,000 paying customers milestone",
      "New VP Marketing (Diana Chen) starting March 24",
      "AI summary accuracy improved from 87% to 94%",
      "Remote-first policy confirmed for 2026",
      "Equity refresh program launching April 1",
    ],
    sentiment: 85,
    tags: ["all-hands", "company-update", "milestone"],
    folder: "Company",
  },
  {
    id: "mtg-8",
    title: "Marketing Strategy: Product-Led Growth",
    date: "2026-03-05T15:00:00",
    duration: 2700,
    platform: "google_meet",
    participants: [
      { name: "You", role: "CEO", talkTime: 900 },
      { name: "Chris Yamamoto", role: "Growth Lead", talkTime: 800 },
      { name: "Sophie Bennett", role: "Content Strategist", talkTime: 600 },
      { name: "Ryan O'Dell", role: "Paid Ads Manager", talkTime: 400 },
    ],
    status: "completed",
    summary: "Discussed shift to product-led growth strategy. Free tier conversion at 8.2% — goal is 12% by Q2. Content strategy pivot to video tutorials and comparison pages. Pausing LinkedIn ads (low ROI), doubling down on Google Ads and SEO.",
    keyPoints: [
      "Free-to-paid conversion at 8.2%, targeting 12% by end of Q2",
      "Pausing LinkedIn ads — CAC too high ($340 vs $120 target)",
      "Doubling Google Ads budget to $15K/month",
      "New content strategy: 3 video tutorials + 5 comparison pages per month",
      "Referral program design approved — 1 month free per referral",
    ],
    sentiment: 72,
    tags: ["marketing", "growth", "strategy"],
    folder: "Marketing",
  },
  {
    id: "mtg-9",
    title: "1:1 with Sarah Chen",
    date: "2026-03-10T15:00:00",
    duration: 1800,
    platform: "google_meet",
    participants: [
      { name: "You", role: "Manager", talkTime: 600 },
      { name: "Sarah Chen", role: "Engineering Manager", talkTime: 1200 },
    ],
    status: "completed",
    summary: "Regular 1:1 check-in. Sarah raised concerns about team burnout from aggressive roadmap. Discussed hiring timeline and temporary scope reduction. Sarah interested in attending KubeCon in April — approved.",
    keyPoints: [
      "Team showing signs of burnout from sprint pace",
      "Proposal to reduce sprint scope by 20% for next 2 sprints",
      "KubeCon attendance approved for Sarah ($2K budget)",
      "Hiring pipeline: 3 candidates in final round for frontend roles",
    ],
    sentiment: 62,
    tags: ["1:1", "management", "team-health"],
    folder: "1:1s",
  },
  {
    id: "mtg-10",
    title: "Podcast Interview: Future of Work",
    date: "2026-03-04T12:00:00",
    duration: 2400,
    platform: "upload",
    participants: [
      { name: "You", role: "Guest", talkTime: 1400 },
      { name: "Jake Morrison", role: "Host - TechTalk Podcast", talkTime: 1000 },
    ],
    status: "completed",
    summary: "Interviewed on TechTalk podcast about the future of async work and AI in productivity. Discussed Echoic's origin story, the problem of meeting overload, and predictions for AI-native workflows by 2028.",
    keyPoints: [
      "Average knowledge worker spends 31 hours/week in meetings",
      "Echoic origin story: founder missing key decisions in back-to-back meetings",
      "Prediction: 50% of meetings will be async by 2028",
      "AI will replace note-taking entirely within 2 years",
      "Remote work driving 3x growth in transcription tool adoption",
    ],
    sentiment: 88,
    tags: ["podcast", "press", "thought-leadership"],
    folder: "Marketing",
  },
];

// ─── ALL ACTION ITEMS (flattened) ────────────────

export function getAllActionItems(): ActionItem[] {
  return demoMeetings.flatMap((m) => m.actionItems ?? []);
}

// ─── ALL DECISIONS (flattened) ───────────────────

export function getAllDecisions(): Decision[] {
  return demoMeetings.flatMap((m) => m.decisions ?? []);
}

// ─── COACH METRICS ──────────────────────────────

export const demoCoachMetrics: CoachMetric[] = [
  { meetingId: "mtg-1", talkRatio: 35, fillerWords: 8, pace: 142, longestMonologue: 45, questionsAsked: 12, interruptionCount: 1, clarity: 8, engagement: 7, sentiment: 72 },
  { meetingId: "mtg-2", talkRatio: 17, fillerWords: 3, pace: 155, longestMonologue: 20, questionsAsked: 5, interruptionCount: 0, clarity: 9, engagement: 6, sentiment: 65 },
  { meetingId: "mtg-3", talkRatio: 41, fillerWords: 12, pace: 138, longestMonologue: 60, questionsAsked: 8, interruptionCount: 2, clarity: 7, engagement: 8, sentiment: 82 },
  { meetingId: "mtg-4", talkRatio: 33, fillerWords: 5, pace: 145, longestMonologue: 35, questionsAsked: 15, interruptionCount: 0, clarity: 9, engagement: 9, sentiment: 88 },
  { meetingId: "mtg-5", talkRatio: 42, fillerWords: 14, pace: 132, longestMonologue: 90, questionsAsked: 6, interruptionCount: 3, clarity: 7, engagement: 7, sentiment: 90 },
  { meetingId: "mtg-6", talkRatio: 33, fillerWords: 6, pace: 148, longestMonologue: 30, questionsAsked: 10, interruptionCount: 1, clarity: 8, engagement: 8, sentiment: 68 },
  { meetingId: "mtg-7", talkRatio: 56, fillerWords: 18, pace: 125, longestMonologue: 120, questionsAsked: 3, interruptionCount: 0, clarity: 8, engagement: 7, sentiment: 85 },
  { meetingId: "mtg-8", talkRatio: 33, fillerWords: 7, pace: 140, longestMonologue: 40, questionsAsked: 9, interruptionCount: 1, clarity: 8, engagement: 8, sentiment: 72 },
  { meetingId: "mtg-9", talkRatio: 33, fillerWords: 4, pace: 152, longestMonologue: 25, questionsAsked: 14, interruptionCount: 0, clarity: 9, engagement: 9, sentiment: 62 },
  { meetingId: "mtg-10", talkRatio: 58, fillerWords: 22, pace: 128, longestMonologue: 150, questionsAsked: 2, interruptionCount: 0, clarity: 7, engagement: 8, sentiment: 88 },
];

// ─── SMART CLIPS (UNIQUE FEATURE #3) ────────────

export const demoSmartClips: SmartClip[] = [
  { id: "clip-1", meetingId: "mtg-1", meetingTitle: "Q1 Product Roadmap Review", title: "AI Search Launch Confirmed", description: "Sarah confirms AI-powered search is ahead of schedule, launching April 15", startTime: 15, endTime: 44, type: "highlight", speaker: "Sarah Chen", createdAt: "2026-03-10T11:05:00", shared: true, views: 12 },
  { id: "clip-2", meetingId: "mtg-1", meetingTitle: "Q1 Product Roadmap Review", title: "Hiring Decision: 2 Frontend Devs", description: "Alex approves headcount for two frontend developer positions", startTime: 80, endTime: 120, type: "decision", speaker: "Alex Kim", createdAt: "2026-03-10T11:05:00", shared: true, views: 8 },
  { id: "clip-3", meetingId: "mtg-1", meetingTitle: "Q1 Product Roadmap Review", title: "$50K Pipeline Upgrade Approved", description: "Budget approved for data pipeline migration to streaming architecture", startTime: 155, endTime: 200, type: "decision", speaker: "Alex Kim", createdAt: "2026-03-10T11:05:00", shared: false, views: 5 },
  { id: "clip-4", meetingId: "mtg-1", meetingTitle: "Q1 Product Roadmap Review", title: "12% Churn Reduction Win", description: "Marcus shares that onboarding changes reduced customer churn by 12%", startTime: 210, endTime: 245, type: "insight", speaker: "Marcus Johnson", createdAt: "2026-03-10T11:05:00", shared: true, views: 18 },
  { id: "clip-5", meetingId: "mtg-2", meetingTitle: "Weekly Engineering Standup", title: "Search Performance Regression", description: "David reports critical latency increase from 200ms to 800ms", startTime: 110, endTime: 150, type: "highlight", speaker: "David Park", createdAt: "2026-03-10T09:35:00", shared: true, views: 6 },
  { id: "clip-6", meetingId: "mtg-3", meetingTitle: "Client Onboarding: Meridian Corp", title: "April 1st Go-Live Confirmed", description: "Tom confirms Meridian's full rollout date aligning with Q2 planning", startTime: 1800, endTime: 1860, type: "decision", speaker: "Tom Nakamura", createdAt: "2026-03-09T15:05:00", shared: true, views: 14 },
  { id: "clip-7", meetingId: "mtg-5", meetingTitle: "Investor Update - Series B Planning", title: "$80M Valuation Discussion", description: "Sequoia expresses interest in leading Series B at $80M pre-money", startTime: 2400, endTime: 2520, type: "highlight", speaker: "Michelle Park", createdAt: "2026-03-07T17:05:00", shared: false, views: 3 },
  { id: "clip-8", meetingId: "mtg-7", meetingTitle: "All-Hands: March Company Update", title: "1,000 Customers Milestone", description: "Celebrating crossing the 1,000 paying customer milestone", startTime: 120, endTime: 180, type: "highlight", speaker: "You", createdAt: "2026-03-06T11:05:00", shared: true, views: 42 },
];

// ─── WEEKLY DIGESTS ─────────────────────────────

export const demoWeeklyDigests: WeeklyDigest[] = [
  {
    weekOf: "2026-03-09",
    totalMeetings: 10,
    totalHours: 8.5,
    actionItemsCreated: 16,
    actionItemsCompleted: 7,
    decisionsLogged: 8,
    topSpeakers: [
      { name: "You", minutes: 182 },
      { name: "Sarah Chen", minutes: 85 },
      { name: "Marcus Johnson", minutes: 62 },
    ],
    coachScore: 78,
    trend: "up",
    insight: "You asked 25% more questions this week compared to last week. Your talk-to-listen ratio improved from 42% to 35%. Consider reducing your longest monologue length — your 90-second investor pitch monologue was effective, but shorter segments tend to keep engagement higher in team meetings.",
  },
  {
    weekOf: "2026-03-02",
    totalMeetings: 8,
    totalHours: 6.2,
    actionItemsCreated: 11,
    actionItemsCompleted: 9,
    decisionsLogged: 5,
    topSpeakers: [
      { name: "You", minutes: 155 },
      { name: "Sarah Chen", minutes: 72 },
      { name: "Alex Kim", minutes: 45 },
    ],
    coachScore: 74,
    trend: "stable",
    insight: "Good week for action item completion (82% rate). Your filler word count is trending down — from 15/meeting to 10/meeting over the past month. One area to improve: you dominated the conversation in the strategy meeting (42% talk time). Try the 'ask, then wait' technique.",
  },
  {
    weekOf: "2026-02-23",
    totalMeetings: 12,
    totalHours: 9.8,
    actionItemsCreated: 18,
    actionItemsCompleted: 5,
    decisionsLogged: 7,
    topSpeakers: [
      { name: "You", minutes: 210 },
      { name: "Sarah Chen", minutes: 98 },
      { name: "Chris Yamamoto", minutes: 55 },
    ],
    coachScore: 68,
    trend: "down",
    insight: "Meeting overload alert! 12 meetings totaling nearly 10 hours. Your action item completion rate dropped to 28%. Consider canceling or making async: the status update meetings where you spoke less than 10% of the time. Your pace was faster than usual (158 WPM vs 140 WPM average) — a sign of rushing.",
  },
];

// ─── AGGREGATE STATS ────────────────────────────

export function getDashboardStats() {
  const allItems = getAllActionItems();
  const allDecisions = getAllDecisions();

  return {
    totalMeetings: demoMeetings.length,
    totalHours: Math.round(demoMeetings.reduce((s, m) => s + m.duration, 0) / 3600 * 10) / 10,
    actionItemsOpen: allItems.filter((a) => a.status === "pending" || a.status === "in_progress").length,
    actionItemsCompleted: allItems.filter((a) => a.status === "completed").length,
    totalDecisions: allDecisions.length,
    avgSentiment: Math.round(demoMeetings.reduce((s, m) => s + (m.sentiment ?? 70), 0) / demoMeetings.length),
    clipsCreated: demoSmartClips.length,
    coachScore: demoWeeklyDigests[0]?.coachScore ?? 0,
  };
}

// ─── FOLDERS ────────────────────────────────────

export const demoFolders = [
  { name: "Product", count: 2, color: "#7C3AED" },
  { name: "Engineering", count: 1, color: "#06B6D4" },
  { name: "Sales", count: 1, color: "#10B981" },
  { name: "Design", count: 1, color: "#F59E0B" },
  { name: "Executive", count: 1, color: "#F43F5E" },
  { name: "Marketing", count: 2, color: "#8B5CF6" },
  { name: "Company", count: 1, color: "#64748B" },
  { name: "1:1s", count: 1, color: "#EC4899" },
];

// ─── INTEGRATIONS ───────────────────────────────

export const demoIntegrations = [
  { id: "int-1", name: "Zoom", icon: "video", status: "connected", description: "Auto-record and transcribe Zoom meetings", lastSync: "2026-03-10T10:00:00" },
  { id: "int-2", name: "Google Meet", icon: "video", status: "connected", description: "Record Google Meet calls with one click", lastSync: "2026-03-10T09:00:00" },
  { id: "int-3", name: "Google Calendar", icon: "calendar", status: "connected", description: "Auto-join scheduled meetings", lastSync: "2026-03-10T08:00:00" },
  { id: "int-4", name: "Slack", icon: "message", status: "connected", description: "Share summaries and clips to channels", lastSync: "2026-03-10T11:00:00" },
  { id: "int-5", name: "Notion", icon: "file", status: "connected", description: "Export meeting notes to Notion pages", lastSync: "2026-03-09T16:00:00" },
  { id: "int-6", name: "Microsoft Teams", icon: "video", status: "available", description: "Record and transcribe Teams meetings" },
  { id: "int-7", name: "Linear", icon: "task", status: "available", description: "Create issues from action items" },
  { id: "int-8", name: "Jira", icon: "task", status: "available", description: "Sync action items with Jira tickets" },
  { id: "int-9", name: "HubSpot", icon: "crm", status: "available", description: "Log meeting notes to CRM contacts" },
  { id: "int-10", name: "Salesforce", icon: "crm", status: "available", description: "Auto-log calls and meetings" },
];
