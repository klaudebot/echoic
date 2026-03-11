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
    actionItems: [
      { id: "ai-17", meetingId: "mtg-6", text: "Create roadmap proposal for real-time collaborative editing feature", assignee: "You", dueDate: "2026-03-14", status: "in_progress", priority: "high", createdAt: "2026-03-07T12:00:00" },
      { id: "ai-18", meetingId: "mtg-6", text: "Research multi-language transcription providers and present options", assignee: "Nina Okafor", dueDate: "2026-03-17", status: "pending", priority: "high", createdAt: "2026-03-07T12:00:00" },
      { id: "ai-19", meetingId: "mtg-6", text: "Design improved mobile app navigation based on user complaints", assignee: "Marcus Johnson", dueDate: "2026-03-21", status: "pending", priority: "medium", createdAt: "2026-03-07T12:00:00" },
    ],
    decisions: [
      { id: "d-9", meetingId: "mtg-6", text: "Prioritize non-English transcript accuracy as top engineering initiative for Q2", madeBy: "You", context: "Number one customer complaint driving churn in international accounts", timestamp: 1600, createdAt: "2026-03-07T12:00:00" },
      { id: "d-10", meetingId: "mtg-6", text: "Commission dedicated mobile UX audit before redesign work begins", madeBy: "Nina Okafor", context: "3.2-star rating is below acceptable threshold; need data-driven fixes", timestamp: 2000, createdAt: "2026-03-07T12:00:00" },
    ],
    transcript: [
      { speaker: "You", text: "Let's dive into the Q1 feedback data. Rachel, can you walk us through the top themes you've been hearing from customers?", timestamp: 0, confidence: 0.98, sentiment: "neutral" },
      { speaker: "Rachel Torres", text: "Sure. The number one request by far is real-time collaboration. Customers want to edit meeting notes together, live, instead of passing documents back and forth after the meeting.", timestamp: 18, confidence: 0.97, sentiment: "neutral" },
      { speaker: "Nina Okafor", text: "That aligns with what we saw in our survey. Seventy-three percent of respondents mentioned some form of collaborative editing as a top want.", timestamp: 45, confidence: 0.96, sentiment: "neutral", isHighlight: true },
      { speaker: "You", text: "That's a strong signal. What about the NPS numbers? I know we made some changes last quarter.", timestamp: 72, confidence: 0.98, sentiment: "neutral" },
      { speaker: "Rachel Torres", text: "Good news there — NPS jumped from 42 to 58. The onboarding improvements and the new summary format are getting really positive reactions.", timestamp: 88, confidence: 0.97, sentiment: "positive", isHighlight: true },
      { speaker: "Marcus Johnson", text: "What's driving the negative scores? Anything specific on the design side?", timestamp: 115, confidence: 0.95, sentiment: "neutral" },
      { speaker: "Rachel Torres", text: "The biggest complaint is transcript accuracy for non-English meetings. We have customers in Germany, Japan, and Brazil who say the transcripts are basically unusable in their languages.", timestamp: 128, confidence: 0.96, sentiment: "negative" },
      { speaker: "Nina Okafor", text: "I pulled the accuracy data. English transcripts are at 96 percent accuracy, but German drops to 78, Japanese to 71, and Portuguese to 74. That's a major gap.", timestamp: 160, confidence: 0.95, sentiment: "negative", isHighlight: true },
      { speaker: "You", text: "We need to fix that. Let's make non-English accuracy a top priority for Q2 engineering. Nina, can you research alternative providers that handle multi-language better?", timestamp: 195, confidence: 0.98, sentiment: "neutral" },
      { speaker: "Rachel Torres", text: "Another big theme is calendar blocking. About 34 percent of our enterprise users have requested the ability to block focus time directly from our app after seeing their meeting load.", timestamp: 225, confidence: 0.96, sentiment: "neutral" },
      { speaker: "Marcus Johnson", text: "And the mobile app is dragging us down. We're at 3.2 stars on the App Store. The main complaints are slow load times and confusing navigation.", timestamp: 260, confidence: 0.94, sentiment: "negative" },
      { speaker: "You", text: "Marcus, let's get a proper mobile UX audit done before we start any redesign work. Nina, can you help scope that? We need data-driven fixes, not guesswork.", timestamp: 290, confidence: 0.97, sentiment: "neutral" },
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
    transcript: [
      { speaker: "You", text: "Welcome everyone to the March all-hands. I've got some exciting updates to share, so let's jump right in. First — and this is a big one — we officially crossed one thousand paying customers last week.", timestamp: 0, confidence: 0.97, sentiment: "positive", isHighlight: true },
      { speaker: "You", text: "When we started this company eighteen months ago, I wasn't sure we'd hit that milestone this quickly. This is a testament to every single person on this call.", timestamp: 30, confidence: 0.96, sentiment: "positive" },
      { speaker: "Alex Kim", text: "On the engineering side, I want to highlight the AI summary improvements. We've pushed our accuracy from 87 percent to 94 percent. The team has been working incredibly hard on the new transformer models.", timestamp: 75, confidence: 0.97, sentiment: "positive", isHighlight: true },
      { speaker: "You", text: "Great work, Alex. Next, I'm thrilled to announce we've hired a new VP of Marketing. Diana Chen will be joining us on March 24th. She previously led growth at Loom and brings exactly the experience we need for our next phase.", timestamp: 120, confidence: 0.98, sentiment: "positive" },
      { speaker: "Jordan Lee", text: "Quick finance update. Revenue is tracking ahead of plan — we're at 4.2 million ARR now. Burn rate is healthy and we have 18 months of runway at current spend.", timestamp: 180, confidence: 0.96, sentiment: "positive" },
      { speaker: "You", text: "Now for the policy updates. I want to confirm that we are staying remote-first through 2026 and beyond. This is working for us and we're not changing it.", timestamp: 230, confidence: 0.98, sentiment: "positive", isHighlight: true },
      { speaker: "Team (42 attendees)", text: "Question from the chat: can you share details about the equity refresh program that was mentioned in the email last week?", timestamp: 280, confidence: 0.94, sentiment: "neutral" },
      { speaker: "Jordan Lee", text: "Absolutely. We're launching an equity refresh program on April 1st. Employees who have been here over a year will be eligible for additional option grants. Details will be sent out individually by the end of this month.", timestamp: 295, confidence: 0.96, sentiment: "positive" },
      { speaker: "Team (42 attendees)", text: "Follow-up question: will the equity refresh apply to contractors as well, or just full-time employees?", timestamp: 340, confidence: 0.95, sentiment: "neutral" },
      { speaker: "Jordan Lee", text: "For now it's full-time employees only, but we're exploring options for long-term contractors. We'll have more details in April.", timestamp: 355, confidence: 0.97, sentiment: "neutral" },
      { speaker: "You", text: "Any other questions? Alright, thanks everyone. Let's keep the momentum going — next month I want to be telling you about two thousand customers.", timestamp: 390, confidence: 0.98, sentiment: "positive" },
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
    actionItems: [
      { id: "ai-20", meetingId: "mtg-8", text: "Draft referral program landing page and email sequence", assignee: "Sophie Bennett", dueDate: "2026-03-14", status: "pending", priority: "high", createdAt: "2026-03-05T16:30:00" },
      { id: "ai-21", meetingId: "mtg-8", text: "Reallocate LinkedIn Ads budget to Google Ads campaigns", assignee: "Ryan O'Dell", dueDate: "2026-03-10", status: "completed", priority: "high", createdAt: "2026-03-05T16:30:00" },
      { id: "ai-22", meetingId: "mtg-8", text: "Produce first batch of 3 video tutorials for top use cases", assignee: "Sophie Bennett", dueDate: "2026-03-21", status: "in_progress", priority: "medium", createdAt: "2026-03-05T16:30:00" },
    ],
    decisions: [
      { id: "d-11", meetingId: "mtg-8", text: "Pause all LinkedIn advertising due to high CAC ($340 vs $120 target)", madeBy: "You", context: "LinkedIn CAC nearly 3x target; budget better allocated to Google Ads with proven lower CAC", timestamp: 1200, createdAt: "2026-03-05T16:30:00" },
      { id: "d-12", meetingId: "mtg-8", text: "Launch referral program offering 1 free month per successful referral", madeBy: "Chris Yamamoto", context: "Referral programs in similar SaaS products show 2-3x lower CAC than paid channels", timestamp: 2100, createdAt: "2026-03-05T16:30:00" },
    ],
    transcript: [
      { speaker: "You", text: "Thanks for joining everyone. I want to talk about our growth strategy. Chris, where are we on free-to-paid conversion right now?", timestamp: 0, confidence: 0.98, sentiment: "neutral" },
      { speaker: "Chris Yamamoto", text: "We're sitting at 8.2 percent conversion from free to paid. It's decent, but I think we can push to 12 percent by end of Q2 if we optimize the activation flow and add more in-product nudges.", timestamp: 15, confidence: 0.97, sentiment: "neutral" },
      { speaker: "You", text: "What's driving the drop-off? Where are we losing free users?", timestamp: 45, confidence: 0.99, sentiment: "neutral" },
      { speaker: "Chris Yamamoto", text: "Most users who don't convert never record a second meeting. They try it once, see the transcript, and don't come back. We need to show them more value faster — the AI summaries, the action items, the coaching.", timestamp: 55, confidence: 0.96, sentiment: "negative", isHighlight: true },
      { speaker: "Ryan O'Dell", text: "On the paid acquisition side, I have some hard numbers to share. LinkedIn Ads are killing us — our CAC there is $340. Google Ads are at $95. The gap is enormous.", timestamp: 90, confidence: 0.95, sentiment: "negative" },
      { speaker: "You", text: "Three hundred and forty dollars? That's almost three times our target. I think we need to pause LinkedIn entirely and put that budget into Google.", timestamp: 120, confidence: 0.98, sentiment: "negative", isHighlight: true },
      { speaker: "Ryan O'Dell", text: "Agreed. If we shift the LinkedIn budget over, we can take Google Ads to 15K per month. Our cost per trial on Google has actually been trending down as we refine the targeting.", timestamp: 140, confidence: 0.96, sentiment: "neutral" },
      { speaker: "Sophie Bennett", text: "On the content side, I've been analyzing what drives organic traffic. Comparison pages — like 'Reverbic vs Otter' — convert three times better than blog posts. And video tutorials on YouTube are our fastest-growing traffic source.", timestamp: 175, confidence: 0.97, sentiment: "positive" },
      { speaker: "You", text: "Let's lean into that. Can we commit to three video tutorials and five comparison pages per month?", timestamp: 210, confidence: 0.98, sentiment: "positive" },
      { speaker: "Sophie Bennett", text: "Definitely. I already have a content calendar drafted. The first batch of tutorials can be ready by the 21st.", timestamp: 225, confidence: 0.96, sentiment: "positive" },
      { speaker: "Chris Yamamoto", text: "One more thing — I want to propose a referral program. One free month for every successful referral. In similar SaaS products, referral CAC is usually two to three times lower than paid channels.", timestamp: 255, confidence: 0.97, sentiment: "positive", isHighlight: true },
      { speaker: "You", text: "I like it. Sophie, can you draft the landing page and email sequence for the referral program? Let's get it launched before Diana starts so she can build on it.", timestamp: 285, confidence: 0.98, sentiment: "positive" },
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
    actionItems: [
      { id: "ai-23", meetingId: "mtg-9", text: "Reduce next two sprint scopes by 20% to address team burnout", assignee: "You", dueDate: "2026-03-12", status: "in_progress", priority: "high", createdAt: "2026-03-10T15:30:00" },
      { id: "ai-24", meetingId: "mtg-9", text: "Book KubeCon travel and registration for Sarah", assignee: "Sarah Chen", dueDate: "2026-03-17", status: "pending", priority: "low", createdAt: "2026-03-10T15:30:00" },
    ],
    decisions: [
      { id: "d-13", meetingId: "mtg-9", text: "Approve KubeCon attendance for Sarah with $2K budget", madeBy: "You", context: "Professional development opportunity and relevant to Kubernetes migration work", timestamp: 1200, createdAt: "2026-03-10T15:30:00" },
    ],
    transcript: [
      { speaker: "You", text: "Hey Sarah, how's the week going? How are you feeling about things?", timestamp: 0, confidence: 0.99, sentiment: "neutral" },
      { speaker: "Sarah Chen", text: "Honestly? I'm a bit worried about the team. We've been pushing really hard the last three sprints and I'm seeing signs of burnout. Two people mentioned fatigue in our retro last week.", timestamp: 12, confidence: 0.97, sentiment: "negative", isHighlight: true },
      { speaker: "You", text: "That's concerning. What do you think would help? Do we need to slow down the pace?", timestamp: 40, confidence: 0.98, sentiment: "neutral" },
      { speaker: "Sarah Chen", text: "I think if we reduced sprint scope by about twenty percent for the next two sprints, it would give people breathing room without derailing the roadmap. We've been overcommitting.", timestamp: 55, confidence: 0.96, sentiment: "neutral" },
      { speaker: "You", text: "I'm okay with that. Let's plan for it. Better to ship slightly less now than lose people to burnout. Where are we on the hiring pipeline?", timestamp: 82, confidence: 0.98, sentiment: "positive" },
      { speaker: "Sarah Chen", text: "Good news there. We have three candidates in final rounds for the frontend roles. I'm optimistic about two of them — strong React and TypeScript backgrounds, both have startup experience.", timestamp: 100, confidence: 0.97, sentiment: "positive", isHighlight: true },
      { speaker: "You", text: "Great. Hopefully we can extend offers by end of month. Anything else on your mind?", timestamp: 130, confidence: 0.99, sentiment: "positive" },
      { speaker: "Sarah Chen", text: "Actually, yes. KubeCon is in April and I'd really like to attend. It's directly relevant to our Kubernetes migration work and there are some talks on scaling microservices that would be valuable.", timestamp: 142, confidence: 0.96, sentiment: "neutral" },
      { speaker: "You", text: "Absolutely, let's make that happen. What's the budget look like?", timestamp: 170, confidence: 0.98, sentiment: "positive" },
      { speaker: "Sarah Chen", text: "Registration is about 800 dollars, plus travel and hotel. I'd estimate around 2K total.", timestamp: 180, confidence: 0.95, sentiment: "neutral" },
      { speaker: "You", text: "Approved. You've earned it. Book it whenever you're ready. And let me know if any of the team wants to attend too — we can probably send one more person.", timestamp: 195, confidence: 0.98, sentiment: "positive", isHighlight: true },
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
    summary: "Interviewed on TechTalk podcast about the future of async work and AI in productivity. Discussed Reverbic's origin story, the problem of meeting overload, and predictions for AI-native workflows by 2028.",
    keyPoints: [
      "Average knowledge worker spends 31 hours/week in meetings",
      "Reverbic origin story: founder missing key decisions in back-to-back meetings",
      "Prediction: 50% of meetings will be async by 2028",
      "AI will replace note-taking entirely within 2 years",
      "Remote work driving 3x growth in transcription tool adoption",
    ],
    transcript: [
      { speaker: "Jake Morrison", text: "Welcome back to TechTalk. Today I'm joined by the founder and CEO of Reverbic, the AI meeting assistant that's been blowing up in the productivity space. Thanks for being here.", timestamp: 0, confidence: 0.98, sentiment: "positive" },
      { speaker: "You", text: "Thanks for having me, Jake. Big fan of the show.", timestamp: 15, confidence: 0.99, sentiment: "positive" },
      { speaker: "Jake Morrison", text: "So let's start with the origin story. What made you decide to build yet another meeting tool in an already crowded market?", timestamp: 22, confidence: 0.97, sentiment: "neutral" },
      { speaker: "You", text: "It came from personal pain. I was in back-to-back meetings all day, and I kept missing key decisions because I couldn't be fully present while also taking notes. I'd leave a meeting and immediately forget who agreed to do what.", timestamp: 35, confidence: 0.96, sentiment: "neutral", isHighlight: true },
      { speaker: "Jake Morrison", text: "I think a lot of people can relate to that. What's the actual scope of the problem? How much time are knowledge workers spending in meetings?", timestamp: 70, confidence: 0.97, sentiment: "neutral" },
      { speaker: "You", text: "The average knowledge worker spends 31 hours per week in meetings. That's nearly four full workdays. And studies show that about half of those meetings are considered unproductive by the attendees themselves.", timestamp: 85, confidence: 0.98, sentiment: "negative", isHighlight: true },
      { speaker: "Jake Morrison", text: "Thirty-one hours. That's staggering. So what's your prediction — where does this go in the next few years?", timestamp: 115, confidence: 0.96, sentiment: "neutral" },
      { speaker: "You", text: "I believe fifty percent of meetings will be async by 2028. The tools are catching up to the workflow. You record a short video update, AI summarizes it, people respond on their own time. No more synchronous status updates.", timestamp: 128, confidence: 0.97, sentiment: "positive" },
      { speaker: "Jake Morrison", text: "And what role does AI play specifically? Beyond transcription, I mean.", timestamp: 165, confidence: 0.98, sentiment: "neutral" },
      { speaker: "You", text: "AI will completely replace note-taking within two years. But more importantly, it will start making meetings smarter — flagging when a decision was made, tracking action items automatically, even coaching you on how to run better meetings.", timestamp: 175, confidence: 0.97, sentiment: "positive", isHighlight: true },
      { speaker: "Jake Morrison", text: "You mentioned remote work is driving a lot of this. What are you seeing in terms of adoption?", timestamp: 215, confidence: 0.95, sentiment: "neutral" },
      { speaker: "You", text: "Remote work has driven three times growth in transcription tool adoption over the past two years. When everyone's on video calls, the need for automated documentation becomes critical. You can't just lean over and ask your colleague what was decided.", timestamp: 228, confidence: 0.96, sentiment: "positive" },
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
