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
    transcript: [
      { speaker: "You", text: "Welcome Tom, Elena. Thanks for making the time. We're really excited to kick off the Meridian onboarding today. Rachel, do you want to walk them through the implementation timeline?", timestamp: 0, confidence: 0.98, sentiment: "positive" },
      { speaker: "Rachel Torres", text: "Absolutely. So we're looking at a three-phase rollout. First, we'll set up your SSO integration with Okta — that typically takes about a week. Then we'll configure the Slack and Jira integrations you requested. Finally, we'll do a pilot with twenty users before the company-wide launch.", timestamp: 18, confidence: 0.97, sentiment: "neutral" },
      { speaker: "Tom Nakamura", text: "That sounds reasonable. Our engineering team is the natural pilot group since they're already used to adopting new tools. When can we start the pilot?", timestamp: 55, confidence: 0.96, sentiment: "positive" },
      { speaker: "Rachel Torres", text: "If we start the SSO work Monday, we could have the pilot environment ready by March 17th. That gives us two full weeks before the April 1st target.", timestamp: 72, confidence: 0.97, sentiment: "neutral" },
      { speaker: "Elena Vasquez", text: "April 1st works perfectly for us. It aligns with our Q2 planning cycle, so we can include Reverbic in our tooling budget from day one of the new quarter.", timestamp: 95, confidence: 0.96, sentiment: "positive", isHighlight: true },
      { speaker: "You", text: "Perfect. Now regarding the integrations — the Slack integration will push meeting summaries to designated channels automatically. The Jira integration creates tickets from action items. Are there specific workflows you need?", timestamp: 120, confidence: 0.98, sentiment: "neutral" },
      { speaker: "Tom Nakamura", text: "For Slack, we'd want summaries going to the team-specific channels. So the engineering standup summary goes to the engineering Slack channel. For Jira, we need it mapped to our existing project structure.", timestamp: 150, confidence: 0.95, sentiment: "neutral" },
      { speaker: "Rachel Torres", text: "We can do channel mapping based on meeting tags or participants. I'll set up a sandbox environment so you can test the integrations before go-live.", timestamp: 180, confidence: 0.97, sentiment: "positive" },
      { speaker: "Elena Vasquez", text: "One concern — we're a 150-person company and some of our meetings are confidential. What controls do we have over who can access transcripts?", timestamp: 210, confidence: 0.96, sentiment: "neutral", isHighlight: true },
      { speaker: "You", text: "Great question. We have role-based access controls. You can set meetings to private, team-only, or company-wide. Confidential meetings like board meetings or HR discussions can be restricted to specific individuals.", timestamp: 235, confidence: 0.98, sentiment: "positive" },
      { speaker: "Tom Nakamura", text: "That's exactly what we need. Let's lock down access for the executive meeting recordings and HR channels from the start.", timestamp: 268, confidence: 0.97, sentiment: "positive", isHighlight: true },
      { speaker: "You", text: "We'll configure that during the pilot phase. Rachel will be your dedicated point of contact throughout the onboarding. Any other questions before we wrap up?", timestamp: 290, confidence: 0.98, sentiment: "positive" },
      { speaker: "Elena Vasquez", text: "Just one — what does the 150-seat deal look like pricing-wise?", timestamp: 315, confidence: 0.96, sentiment: "neutral" },
      { speaker: "You", text: "At the enterprise tier of $99 per seat per month, that comes to $14,850 per month. We offer annual billing at a 15% discount if that's of interest.", timestamp: 328, confidence: 0.98, sentiment: "neutral" },
      { speaker: "Tom Nakamura", text: "We'll discuss the annual option internally. Let's get the pilot started and prove the value first.", timestamp: 355, confidence: 0.97, sentiment: "positive" },
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
    transcript: [
      { speaker: "You", text: "Good morning everyone. Today we're doing a proper design sprint for the dashboard redesign. Nina, let's start with the user research findings before we look at any concepts.", timestamp: 0, confidence: 0.98, sentiment: "neutral" },
      { speaker: "Nina Okafor", text: "Happy to. We interviewed 24 users over the last two weeks. The single biggest theme: 73% want to customize what they see on the dashboard. Right now it's one-size-fits-all and power users are frustrated they can't surface what matters to them.", timestamp: 18, confidence: 0.96, sentiment: "neutral", isHighlight: true },
      { speaker: "Marcus Johnson", text: "That aligns with what I was seeing in the session recordings. Users are scanning for the same three or four things every time they open the app — but those things differ by person. An exec wants sentiment trends. A PM wants action item status. They're doing the same job in different ways.", timestamp: 52, confidence: 0.97, sentiment: "neutral" },
      { speaker: "You", text: "So flexibility is the core design requirement. Marcus, walk us through the three concepts you've prepared.", timestamp: 88, confidence: 0.98, sentiment: "neutral" },
      { speaker: "Marcus Johnson", text: "I've got three directions. First is Command Center — a widget-based layout where users pin the modules they care about. It's the most flexible but also the most complex to build. Second is Timeline View — chronological meeting feed with inline insights. Clean and simple. Third is Card Grid — a Pinterest-style masonry layout organized by topic or team.", timestamp: 100, confidence: 0.97, sentiment: "neutral" },
      { speaker: "Lisa Wang", text: "From an implementation standpoint, Timeline View is easiest to build. Command Center would require a drag-and-drop grid system with persistent layout state per user. That's probably two to three sprints of engineering work.", timestamp: 148, confidence: 0.95, sentiment: "neutral" },
      { speaker: "You", text: "I actually think Command Center is the right call even with the extra build time. The widget system means we can keep adding value post-launch without redesigning the whole page. And it matches what users told Nina they want.", timestamp: 182, confidence: 0.98, sentiment: "positive", isHighlight: true },
      { speaker: "Nina Okafor", text: "One thing from the research: users specifically asked for an AI insights widget — something that surfaces trends across their meeting history. Like 'you've been spending 60% of your week in status meetings' or 'three recurring blockers this sprint'.", timestamp: 215, confidence: 0.96, sentiment: "positive" },
      { speaker: "Marcus Johnson", text: "I mocked that up in the Command Center concept. It sits top-right, and it refreshes weekly. I was worried people might find it gimmicky, but the reaction in our prototype tests was unanimous — everyone wanted it.", timestamp: 252, confidence: 0.97, sentiment: "positive", isHighlight: true },
      { speaker: "You", text: "Let's go with Command Center. Lisa, can we commit to having a functional prototype by the 20th for user testing sessions?", timestamp: 290, confidence: 0.98, sentiment: "positive" },
      { speaker: "Lisa Wang", text: "If Marcus has the high-fidelity designs done by the 15th, yes. I can wire it up in time for the testing sessions.", timestamp: 310, confidence: 0.96, sentiment: "positive" },
      { speaker: "Marcus Johnson", text: "I'll have designs ready by the 15th. And Nina, can you start recruiting users for the testing sessions this week so we're not scrambling at the end?", timestamp: 330, confidence: 0.97, sentiment: "neutral" },
      { speaker: "Nina Okafor", text: "Already on it. I'm targeting eight participants — a mix of power users and new accounts. I'll have the recruiting done by Friday.", timestamp: 352, confidence: 0.95, sentiment: "positive" },
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
    transcript: [
      { speaker: "You", text: "Michelle, thanks for taking the time. We wanted to give you a full picture of where we are and where we're headed. Jordan, let's start with the numbers.", timestamp: 0, confidence: 0.98, sentiment: "positive" },
      { speaker: "Jordan Lee", text: "Happy to. We closed the quarter at 4.2 million ARR, which represents 340 percent year-over-year growth. Monthly revenue growth has been consistently between 18 and 22 percent for the last six months.", timestamp: 15, confidence: 0.97, sentiment: "positive", isHighlight: true },
      { speaker: "Michelle Park", text: "That's impressive growth. What about retention? We've seen a lot of meeting tools struggle with stickiness.", timestamp: 48, confidence: 0.96, sentiment: "neutral" },
      { speaker: "Jordan Lee", text: "Retention is actually our strongest metric. Gross retention is at 92 percent, and net retention is 118 percent. Our enterprise accounts are expanding faster than our smaller accounts churn.", timestamp: 62, confidence: 0.97, sentiment: "positive", isHighlight: true },
      { speaker: "Michelle Park", text: "118 net retention is very healthy. Alex, can you talk about the technical moat? What keeps someone from just building this with off-the-shelf transcription APIs?", timestamp: 90, confidence: 0.96, sentiment: "neutral" },
      { speaker: "Alex Kim", text: "Great question. The transcription is just the foundation. Our real differentiator is the AI layer on top — the smart summaries, automated action item extraction, the meeting coach, and the decision tracking. We've trained custom models on hundreds of thousands of meeting transcripts. The accuracy of our extraction is significantly ahead of anyone using generic models.", timestamp: 110, confidence: 0.97, sentiment: "positive", isHighlight: true },
      { speaker: "You", text: "And the switching costs compound over time. Once an organization has six months of meeting history with insights, decisions, and action items — that institutional knowledge is incredibly valuable and hard to replicate.", timestamp: 155, confidence: 0.98, sentiment: "positive" },
      { speaker: "Michelle Park", text: "That resonates. What would you do with a 20 million dollar raise?", timestamp: 185, confidence: 0.96, sentiment: "neutral" },
      { speaker: "You", text: "Two main areas. First, international expansion — we're seeing organic demand from Europe and APAC and need to build out multilingual support and local data centers. Second, doubling down on AI R&D. We have a roadmap for real-time coaching, predictive analytics, and autonomous action item follow-ups.", timestamp: 198, confidence: 0.98, sentiment: "positive" },
      { speaker: "Michelle Park", text: "We're definitely interested in leading this round. At an 80 million pre-money valuation, that puts you at roughly 19x ARR, which feels right given the growth trajectory. I'd like to see a full data room by the 21st if possible.", timestamp: 240, confidence: 0.97, sentiment: "positive", isHighlight: true },
      { speaker: "Jordan Lee", text: "We'll have it ready. I'm already working on the updated financials and cohort analyses.", timestamp: 275, confidence: 0.96, sentiment: "positive" },
      { speaker: "You", text: "Wonderful. We're excited about the potential partnership. Sequoia's network in enterprise SaaS would be incredibly valuable for our next phase.", timestamp: 290, confidence: 0.98, sentiment: "positive" },
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
  {
    id: "mtg-11",
    title: "Q4 2025 Retrospective",
    date: "2026-01-08T10:00:00",
    duration: 3600,
    platform: "zoom",
    participants: [
      { name: "You", role: "Product Lead", talkTime: 900 },
      { name: "Sarah Chen", email: "sarah@company.com", role: "Engineering Manager", talkTime: 850 },
      { name: "Marcus Johnson", email: "marcus@company.com", role: "Designer", talkTime: 600 },
      { name: "Jordan Lee", email: "jordan@company.com", role: "CFO", talkTime: 700 },
      { name: "Chris Yamamoto", email: "chris@company.com", role: "Growth Lead", talkTime: 550 },
    ],
    status: "completed",
    summary: "Conducted a full Q4 2025 retrospective covering product, engineering, and go-to-market performance. Engineering shipped 94% of committed roadmap items. Revenue grew 40% quarter-over-quarter. Identified customer onboarding speed and non-English transcription accuracy as the two biggest gaps to address in Q1.",
    keyPoints: [
      "Q4 revenue: $2.8M ARR — 40% QoQ growth, beat target by 12%",
      "Engineering shipped 94% of committed items — best quarter on record",
      "Customer onboarding time still too long: averaging 11 days vs 5-day target",
      "Non-English transcript accuracy flagged as top churn driver in international accounts",
      "Team headcount grew from 18 to 27 in Q4 — onboarding processes need improvement",
    ],
    actionItems: [
      { id: "ai-25", meetingId: "mtg-11", text: "Document Q4 lessons learned and share with full team", assignee: "You", dueDate: "2026-01-15", status: "completed", priority: "medium", createdAt: "2026-01-08T11:30:00" },
      { id: "ai-26", meetingId: "mtg-11", text: "Draft Q1 OKRs incorporating retro findings", assignee: "Jordan Lee", dueDate: "2026-01-12", status: "completed", priority: "high", createdAt: "2026-01-08T11:30:00" },
      { id: "ai-27", meetingId: "mtg-11", text: "Create engineering onboarding runbook for new hires", assignee: "Sarah Chen", dueDate: "2026-01-20", status: "completed", priority: "medium", createdAt: "2026-01-08T11:30:00" },
    ],
    decisions: [
      { id: "d-14", meetingId: "mtg-11", text: "Prioritize customer onboarding speed as Q1 top product initiative", madeBy: "You", context: "11-day average vs 5-day target is causing trial-to-paid conversion drag", timestamp: 1800, createdAt: "2026-01-08T11:30:00" },
      { id: "d-15", meetingId: "mtg-11", text: "Allocate 20% of Q1 engineering capacity to non-English transcription improvements", madeBy: "Sarah Chen", context: "Top churn driver in EMEA and APAC markets; competitive risk if not addressed", timestamp: 2800, createdAt: "2026-01-08T11:30:00" },
    ],
    transcript: [
      { speaker: "You", text: "Good morning everyone. Happy new year — let's kick off 2026 by looking back at Q4. I want this to be honest and direct. What went well, what didn't, and what do we carry forward.", timestamp: 0, confidence: 0.98, sentiment: "neutral" },
      { speaker: "Jordan Lee", text: "Starting with the numbers: Q4 revenue came in at 2.8 million ARR. That's 40% quarter-over-quarter growth and 12% above our target. By any measure, an exceptional quarter.", timestamp: 18, confidence: 0.97, sentiment: "positive", isHighlight: true },
      { speaker: "Sarah Chen", text: "Engineering perspective — we shipped 94% of our committed roadmap items. The one thing that slipped was the calendar integration, which we're targeting for January. The team executed really well.", timestamp: 45, confidence: 0.96, sentiment: "positive" },
      { speaker: "Chris Yamamoto", text: "Growth-wise, free-to-paid conversion improved from 6.8% to 8.2%. Still below our 10% target, but the trend is right. The bigger issue is that our average time-to-first-value for new customers is 11 days. That's way too long.", timestamp: 80, confidence: 0.97, sentiment: "neutral", isHighlight: true },
      { speaker: "You", text: "Eleven days is a serious problem. That means people are churning from trials before they even experience the core value. What's causing the delay?", timestamp: 115, confidence: 0.98, sentiment: "negative" },
      { speaker: "Chris Yamamoto", text: "Three things: integration setup takes too long, the first meeting summary doesn't arrive fast enough, and users don't understand what to do next. We need better in-product guidance.", timestamp: 130, confidence: 0.96, sentiment: "neutral" },
      { speaker: "Marcus Johnson", text: "I've actually been working on some redesign concepts for the onboarding flow. I can have mockups ready by end of January if we make this a priority.", timestamp: 162, confidence: 0.95, sentiment: "positive" },
      { speaker: "You", text: "Let's make it the top priority. What about the international situation? I know we've been getting complaints about transcript quality.", timestamp: 185, confidence: 0.97, sentiment: "neutral" },
      { speaker: "Sarah Chen", text: "It's our biggest technical debt item. English is at 96% accuracy, but German, Japanese, and Portuguese are all under 78%. We lost two accounts in Germany last quarter specifically citing this. We need to dedicate real engineering capacity to fix it.", timestamp: 200, confidence: 0.96, sentiment: "negative", isHighlight: true },
    ],
    sentiment: 74,
    tags: ["retrospective", "quarterly", "planning"],
    folder: "Product",
  },
  {
    id: "mtg-12",
    title: "Security Audit Review",
    date: "2026-01-12T14:00:00",
    duration: 2700,
    platform: "google_meet",
    participants: [
      { name: "You", role: "CEO", talkTime: 400 },
      { name: "Sarah Chen", email: "sarah@company.com", role: "Engineering Manager", talkTime: 700 },
      { name: "David Park", email: "david@company.com", role: "Backend Engineer", talkTime: 850 },
      { name: "Kenji Watanabe", email: "kenji@secureaudit.io", role: "Lead Auditor (SecureAudit)", talkTime: 750 },
    ],
    status: "completed",
    summary: "Reviewed findings from the third-party security audit conducted by SecureAudit. Three medium-severity issues were identified around API rate limiting, session token rotation, and S3 bucket permissions. No critical vulnerabilities found. All issues to be remediated within 30 days.",
    keyPoints: [
      "No critical vulnerabilities found — strong baseline security posture",
      "3 medium-severity issues: API rate limiting, session token rotation, S3 permissions",
      "SOC 2 Type II certification path confirmed — targeting Q3 2026",
      "Penetration test scheduled for February to verify remediation",
      "All medium-severity issues remediated within 30-day SLA",
    ],
    actionItems: [
      { id: "ai-28", meetingId: "mtg-12", text: "Implement API rate limiting on all public endpoints", assignee: "David Park", dueDate: "2026-01-20", status: "completed", priority: "high", createdAt: "2026-01-12T15:30:00" },
      { id: "ai-29", meetingId: "mtg-12", text: "Fix session token rotation to align with OWASP recommendations", assignee: "David Park", dueDate: "2026-01-22", status: "completed", priority: "high", createdAt: "2026-01-12T15:30:00" },
      { id: "ai-30", meetingId: "mtg-12", text: "Audit and tighten S3 bucket permissions across all environments", assignee: "Sarah Chen", dueDate: "2026-01-19", status: "completed", priority: "medium", createdAt: "2026-01-12T15:30:00" },
      { id: "ai-31", meetingId: "mtg-12", text: "Schedule follow-up penetration test for February", assignee: "You", dueDate: "2026-01-18", status: "completed", priority: "medium", createdAt: "2026-01-12T15:30:00" },
    ],
    decisions: [
      { id: "d-16", meetingId: "mtg-12", text: "Begin SOC 2 Type II certification process targeting Q3 2026", madeBy: "You", context: "Enterprise customers increasingly requiring SOC 2 compliance before procurement sign-off", timestamp: 1800, createdAt: "2026-01-12T15:30:00" },
      { id: "d-17", meetingId: "mtg-12", text: "Remediate all medium-severity findings within 30 days", madeBy: "Sarah Chen", context: "Audit SLA and upcoming enterprise deals require clean security posture", timestamp: 2200, createdAt: "2026-01-12T15:30:00" },
    ],
    transcript: [
      { speaker: "Kenji Watanabe", text: "Thank you for having us. I want to start by saying this was a solid audit overall. You have a strong baseline security posture — no critical vulnerabilities, which is genuinely good for a company at your stage. I'll walk through the three medium-severity findings.", timestamp: 0, confidence: 0.97, sentiment: "positive", isHighlight: true },
      { speaker: "You", text: "Glad to hear no criticals. Let's go through the medium findings.", timestamp: 30, confidence: 0.99, sentiment: "neutral" },
      { speaker: "Kenji Watanabe", text: "First finding: API rate limiting is absent on several public endpoints. Without rate limiting, you're vulnerable to brute force attacks and credential stuffing. An attacker could make thousands of login attempts per minute with no throttling.", timestamp: 42, confidence: 0.96, sentiment: "negative" },
      { speaker: "David Park", text: "That's on my list to fix. I can implement token bucket rate limiting at the API gateway layer. Realistically I can have this shipped by the 20th.", timestamp: 75, confidence: 0.95, sentiment: "neutral" },
      { speaker: "Kenji Watanabe", text: "Second finding: session token rotation isn't happening on privilege escalation. Per OWASP guidelines, tokens should be rotated when a user's permission level changes — like when they're added to an admin role. Right now your tokens persist unchanged.", timestamp: 98, confidence: 0.97, sentiment: "neutral" },
      { speaker: "Sarah Chen", text: "That's also fixable within the week. David, can you tackle both the rate limiting and the token rotation together? They're both backend auth changes.", timestamp: 132, confidence: 0.96, sentiment: "neutral" },
      { speaker: "David Park", text: "Yes, I'll handle both. The token rotation fix is actually straightforward — it's a few lines in the auth middleware.", timestamp: 155, confidence: 0.95, sentiment: "neutral" },
      { speaker: "Kenji Watanabe", text: "Third finding: some S3 buckets in your staging environment have overly permissive IAM policies. A few buckets had public read access enabled that shouldn't be public. Nothing in production, but staging environments with loose permissions can become a lateral movement risk.", timestamp: 172, confidence: 0.96, sentiment: "negative", isHighlight: true },
      { speaker: "Sarah Chen", text: "I'll do a full audit of all bucket permissions across environments this week. We should have a policy of least-privilege from the start — it sounds like staging drifted from that standard.", timestamp: 210, confidence: 0.97, sentiment: "neutral" },
      { speaker: "You", text: "Kenji, what's your recommendation on the SOC 2 path? Several of our enterprise prospects are asking about it.", timestamp: 240, confidence: 0.98, sentiment: "neutral" },
      { speaker: "Kenji Watanabe", text: "Given your current posture, SOC 2 Type II is very achievable. I'd recommend starting the readiness assessment in Q2 after you've remediated these findings. Targeting a Q3 2026 certification is realistic if you begin now.", timestamp: 258, confidence: 0.96, sentiment: "positive", isHighlight: true },
      { speaker: "You", text: "Let's commit to that. Sarah, let's plan to kick off the SOC 2 readiness work once these three items are closed. The enterprise pipeline depends on it.", timestamp: 295, confidence: 0.98, sentiment: "positive" },
    ],
    sentiment: 70,
    tags: ["security", "compliance", "engineering"],
    folder: "Engineering",
  },
  {
    id: "mtg-13",
    title: "Annual Planning: 2026 Goals",
    date: "2026-01-15T09:00:00",
    duration: 5400,
    platform: "zoom",
    participants: [
      { name: "You", role: "CEO", talkTime: 2200 },
      { name: "Alex Kim", email: "alex@company.com", role: "CTO", talkTime: 1200 },
      { name: "Jordan Lee", email: "jordan@company.com", role: "CFO", talkTime: 1000 },
      { name: "Sarah Chen", email: "sarah@company.com", role: "Engineering Manager", talkTime: 600 },
      { name: "Chris Yamamoto", email: "chris@company.com", role: "Growth Lead", talkTime: 400 },
    ],
    status: "completed",
    summary: "Full-day annual planning session setting company-wide goals for 2026. Agreed on three north star metrics: $12M ARR by year-end, 2,500 paying customers, and 90% gross retention. Roadmap priorities aligned around AI features, international expansion, and Series B fundraise in Q2.",
    keyPoints: [
      "2026 north star: $12M ARR (3x current), 2,500 paying customers",
      "Series B fundraise targeting Q2 — $20M raise at $80M+ valuation",
      "International expansion starting with UK and Germany in Q3",
      "Three major product bets: real-time collaboration, mobile app, enterprise admin console",
      "Headcount plan: grow from 27 to 45 by year-end, focused on engineering and sales",
    ],
    actionItems: [
      { id: "ai-32", meetingId: "mtg-13", text: "Document 2026 OKRs and distribute to all team leads", assignee: "You", dueDate: "2026-01-22", status: "completed", priority: "high", createdAt: "2026-01-15T12:00:00" },
      { id: "ai-33", meetingId: "mtg-13", text: "Build financial model for $12M ARR path with monthly milestones", assignee: "Jordan Lee", dueDate: "2026-01-22", status: "completed", priority: "high", createdAt: "2026-01-15T12:00:00" },
      { id: "ai-34", meetingId: "mtg-13", text: "Draft hiring plan and JDs for 18 new positions", assignee: "Sarah Chen", dueDate: "2026-02-01", status: "completed", priority: "high", createdAt: "2026-01-15T12:00:00" },
    ],
    decisions: [
      { id: "d-18", meetingId: "mtg-13", text: "Set $12M ARR as the 2026 company north star metric", madeBy: "You", context: "Positions us for a strong Series B narrative and international expansion", timestamp: 1800, createdAt: "2026-01-15T12:00:00" },
      { id: "d-19", meetingId: "mtg-13", text: "Target Series B close by end of Q2 2026", madeBy: "Jordan Lee", context: "18 months of runway; raising now gives optionality before market conditions change", timestamp: 3200, createdAt: "2026-01-15T12:00:00" },
      { id: "d-20", meetingId: "mtg-13", text: "Prioritize UK and Germany for international expansion in Q3", madeBy: "Alex Kim", context: "Strong inbound interest from both markets; English-first product reduces localization lift for UK", timestamp: 4500, createdAt: "2026-01-15T12:00:00" },
    ],
    transcript: [
      { speaker: "You", text: "Alright, today is about setting our direction for the full year. I want us to leave this room — or this call — with clarity on where we're going and how we're going to get there. Jordan, let's start with the financial picture.", timestamp: 0, confidence: 0.98, sentiment: "neutral" },
      { speaker: "Jordan Lee", text: "We ended 2025 at $4.2 million ARR. Our base case for 2026 is $10M. But if we execute on the product roadmap and close the Series B, I think $12M is achievable. That's 3x growth.", timestamp: 20, confidence: 0.97, sentiment: "positive", isHighlight: true },
      { speaker: "You", text: "Let's commit to $12M. I want us stretching. Alex, from an engineering standpoint, what's the most important thing we need to build this year?", timestamp: 55, confidence: 0.98, sentiment: "positive" },
      { speaker: "Alex Kim", text: "Real-time collaboration. It's the most-requested feature by a wide margin, and it's the hardest to build. We should start the architecture work in Q1 so we can ship in Q3.", timestamp: 70, confidence: 0.97, sentiment: "neutral" },
      { speaker: "Sarah Chen", text: "I'd also flag the mobile app. Our App Store rating is dragging us down with individual users. We can't win the bottom-up PLG motion if the mobile experience is bad.", timestamp: 100, confidence: 0.96, sentiment: "neutral" },
      { speaker: "You", text: "Both are on the list. Chris, from a growth standpoint — how do we get to 2,500 customers?", timestamp: 125, confidence: 0.97, sentiment: "neutral" },
      { speaker: "Chris Yamamoto", text: "Three levers: fix onboarding to boost trial conversion from 8% to 12%, launch the referral program, and open international markets. UK and Germany are the biggest opportunities based on our inbound data.", timestamp: 140, confidence: 0.96, sentiment: "positive", isHighlight: true },
      { speaker: "Jordan Lee", text: "On the fundraise — we have 18 months of runway. I'd recommend targeting a close by end of Q2. The market conditions are favorable right now and we have a strong story to tell with the growth numbers.", timestamp: 185, confidence: 0.97, sentiment: "positive" },
      { speaker: "You", text: "Agreed. Let's target Q2 for the Series B. I want to walk into those investor meetings with a clean security audit, strong retention numbers, and a clear path to $12M.", timestamp: 210, confidence: 0.98, sentiment: "positive", isHighlight: true },
    ],
    sentiment: 86,
    tags: ["annual-planning", "strategy", "okrs"],
    folder: "Executive",
  },
  {
    id: "mtg-14",
    title: "Engineering Standup",
    date: "2026-01-20T09:00:00",
    duration: 1500,
    platform: "google_meet",
    participants: [
      { name: "You", role: "Product Lead", talkTime: 150 },
      { name: "Sarah Chen", role: "Engineering Manager", talkTime: 480 },
      { name: "David Park", role: "Backend Engineer", talkTime: 380 },
      { name: "Lisa Wang", role: "Frontend Engineer", talkTime: 320 },
      { name: "James Rodriguez", role: "DevOps", talkTime: 170 },
    ],
    status: "completed",
    summary: "Short sprint standup covering security remediation progress, onboarding flow redesign kickoff, and infrastructure upgrade. All three security audit findings resolved ahead of schedule. Onboarding redesign in early wireframe phase.",
    keyPoints: [
      "All 3 security audit findings resolved — ahead of 30-day deadline",
      "Onboarding redesign wireframes in progress — Lisa leading",
      "Database query optimization reduced p99 latency by 35%",
      "Staging environment upgrade to Node 22 completed",
    ],
    actionItems: [
      { id: "ai-35", meetingId: "mtg-14", text: "Run load tests on API rate limiting implementation", assignee: "David Park", dueDate: "2026-01-22", status: "completed", priority: "high", createdAt: "2026-01-20T09:30:00" },
      { id: "ai-36", meetingId: "mtg-14", text: "Share onboarding wireframes for review by Friday", assignee: "Lisa Wang", dueDate: "2026-01-24", status: "completed", priority: "medium", createdAt: "2026-01-20T09:30:00" },
    ],
    decisions: [
      { id: "d-21", meetingId: "mtg-14", text: "Upgrade production to Node 22 during next maintenance window", madeBy: "Sarah Chen", context: "Staging results show 15% performance improvement with no regressions", timestamp: 900, createdAt: "2026-01-20T09:30:00" },
    ],
    transcript: [
      { speaker: "Sarah Chen", text: "Good morning. Quick standup — let's keep it under fifteen minutes. David, start us off.", timestamp: 0, confidence: 0.97, sentiment: "neutral" },
      { speaker: "David Park", text: "Good news first: all three security audit findings are remediated. Rate limiting is live, token rotation is fixed, and the S3 permissions are locked down. We're eleven days ahead of the 30-day deadline.", timestamp: 10, confidence: 0.96, sentiment: "positive", isHighlight: true },
      { speaker: "Sarah Chen", text: "Excellent. That's a big one off the list. Any blockers today?", timestamp: 38, confidence: 0.98, sentiment: "positive" },
      { speaker: "David Park", text: "No blockers. I'm switching focus to the database query optimization work. I ran the analysis over the weekend — there are six slow queries in the meeting list endpoint. I can cut p99 latency by 30 to 40 percent with better indexing.", timestamp: 48, confidence: 0.95, sentiment: "positive" },
      { speaker: "Lisa Wang", text: "On the onboarding redesign front — I have the first set of wireframes drafted. They're rough but they show the new three-step flow. I'll have them in Figma and ready for review by Friday.", timestamp: 82, confidence: 0.96, sentiment: "neutral" },
      { speaker: "You", text: "Good progress. Is the onboarding work blocking anything else right now?", timestamp: 112, confidence: 0.98, sentiment: "neutral" },
      { speaker: "Lisa Wang", text: "Not blocking anything. I just want to make sure we align on the copy before I go high-fidelity. Can we get a quick review session on Friday after I share the wireframes?", timestamp: 122, confidence: 0.95, sentiment: "neutral" },
      { speaker: "Sarah Chen", text: "Let's do it. I'll put it on the calendar. James, anything on infra?", timestamp: 148, confidence: 0.97, sentiment: "neutral" },
      { speaker: "James Rodriguez", text: "Staging is now running on Node 22. I did a full benchmark comparison — 15% performance improvement across the board, no regressions. I'd recommend we schedule the production upgrade for the next maintenance window.", timestamp: 160, confidence: 0.95, sentiment: "positive", isHighlight: true },
      { speaker: "Sarah Chen", text: "Agreed. Let's do the production upgrade this Sunday at 2 AM. I'll send the maintenance window notice today. Anything else before we wrap?", timestamp: 192, confidence: 0.97, sentiment: "neutral" },
      { speaker: "You", text: "Just wanted to say the security work was handled really well. The audit finding-to-fix turnaround was impressive. Good work team.", timestamp: 215, confidence: 0.98, sentiment: "positive", isHighlight: true },
    ],
    sentiment: 76,
    tags: ["engineering", "standup", "weekly"],
    folder: "Engineering",
  },
  {
    id: "mtg-15",
    title: "Sales QBR: Q4 Results",
    date: "2026-01-22T13:00:00",
    duration: 3600,
    platform: "zoom",
    participants: [
      { name: "You", role: "CEO", talkTime: 800 },
      { name: "Rachel Torres", email: "rachel@company.com", role: "Head of Sales", talkTime: 1400 },
      { name: "Jordan Lee", email: "jordan@company.com", role: "CFO", talkTime: 600 },
      { name: "Chris Yamamoto", email: "chris@company.com", role: "Growth Lead", talkTime: 800 },
    ],
    status: "completed",
    summary: "Q4 sales QBR reviewing pipeline performance, win/loss analysis, and setting Q1 targets. Closed 47 new accounts in Q4 — 18% above target. Average contract value grew from $4,200 to $6,800 driven by enterprise deals. Two lost deals traced to lack of SSO and admin controls.",
    keyPoints: [
      "Q4: 47 new accounts closed, 18% above target",
      "ACV grew from $4,200 to $6,800 — enterprise deals pulling up average",
      "Pipeline entering Q1: $1.8M, 62 opportunities",
      "Top loss reason: missing SSO and enterprise admin controls",
      "Q1 target: 55 new accounts, $400K new ARR",
    ],
    actionItems: [
      { id: "ai-37", meetingId: "mtg-15", text: "Build enterprise admin console feature spec and prioritize with engineering", assignee: "You", dueDate: "2026-02-01", status: "completed", priority: "high", createdAt: "2026-01-22T14:30:00" },
      { id: "ai-38", meetingId: "mtg-15", text: "Create Q1 sales playbook with updated ICP and objection handling", assignee: "Rachel Torres", dueDate: "2026-01-30", status: "completed", priority: "medium", createdAt: "2026-01-22T14:30:00" },
      { id: "ai-39", meetingId: "mtg-15", text: "Set up win/loss interview program — 5 interviews per month", assignee: "Rachel Torres", dueDate: "2026-02-07", status: "overdue", priority: "medium", createdAt: "2026-01-22T14:30:00" },
    ],
    decisions: [
      { id: "d-22", meetingId: "mtg-15", text: "Prioritize enterprise admin console for Q2 — top blocker for enterprise sales", madeBy: "You", context: "Lost 6 enterprise deals in Q4 citing missing SSO and admin controls", timestamp: 2100, createdAt: "2026-01-22T14:30:00" },
      { id: "d-23", meetingId: "mtg-15", text: "Set Q1 sales target at 55 new accounts, $400K new ARR", madeBy: "Jordan Lee", context: "Represents 17% growth over Q4 actuals — ambitious but achievable with current pipeline", timestamp: 3000, createdAt: "2026-01-22T14:30:00" },
    ],
    transcript: [
      { speaker: "Rachel Torres", text: "Let me walk you through Q4. We closed 47 new accounts, which is 18% above our target of 40. The headline number is good. But I want to talk about what we're losing too.", timestamp: 0, confidence: 0.97, sentiment: "positive", isHighlight: true },
      { speaker: "You", text: "Let's hear it. What are we losing and why?", timestamp: 28, confidence: 0.98, sentiment: "neutral" },
      { speaker: "Rachel Torres", text: "Six enterprise deals. All of them cited the same two things: no SSO support and no enterprise admin console. One prospect told me directly that their IT team won't approve a SaaS tool without Okta SSO. We're getting blocked at procurement.", timestamp: 38, confidence: 0.96, sentiment: "negative", isHighlight: true },
      { speaker: "You", text: "That's a significant issue. What's the ACV difference between those enterprise deals vs our average deal?", timestamp: 72, confidence: 0.98, sentiment: "neutral" },
      { speaker: "Jordan Lee", text: "The six enterprise opportunities we lost ranged from $48K to $180K ACV. Our current average is $6,800. Those are transformative deals.", timestamp: 88, confidence: 0.97, sentiment: "negative" },
      { speaker: "Chris Yamamoto", text: "This also affects PLG. Users at companies with IT lockdown can't even sign up without SSO. We're probably losing organic traction in larger orgs too.", timestamp: 115, confidence: 0.95, sentiment: "negative" },
      { speaker: "You", text: "Alright. Enterprise admin console and SSO become top priorities for Q2 engineering. I'll spec it out with Sarah and we'll fast-track it. Rachel, what's the Q1 pipeline looking like?", timestamp: 135, confidence: 0.97, sentiment: "neutral" },
      { speaker: "Rachel Torres", text: "We're entering Q1 with 1.8 million in pipeline across 62 opportunities. If we can close at our Q4 rate, we should hit the 55 account target. But I want to protect upside by running tighter qualification on the enterprise opps.", timestamp: 158, confidence: 0.96, sentiment: "positive" },
    ],
    sentiment: 71,
    tags: ["sales", "qbr", "quarterly"],
    folder: "Sales",
  },
  {
    id: "mtg-16",
    title: "1:1 with Alex Kim",
    date: "2026-01-27T16:00:00",
    duration: 1800,
    platform: "google_meet",
    participants: [
      { name: "You", role: "CEO", talkTime: 700 },
      { name: "Alex Kim", email: "alex@company.com", role: "CTO", talkTime: 1100 },
    ],
    status: "completed",
    summary: "Monthly 1:1 with Alex discussing engineering org health, hiring progress, and technical roadmap prioritization. Alex expressed concerns about technical debt accumulating in the transcription pipeline. Agreed on a dedicated refactor sprint in February.",
    keyPoints: [
      "Engineering morale is high after strong Q4 — good momentum going into Q1",
      "Technical debt in transcription pipeline becoming a risk — needs dedicated sprint",
      "Hiring: 2 backend engineers in final rounds, targeting February start dates",
      "Alex requesting budget for engineering off-site in Q2",
    ],
    actionItems: [
      { id: "ai-40", meetingId: "mtg-16", text: "Schedule dedicated refactor sprint for transcription pipeline in February", assignee: "Alex Kim", dueDate: "2026-02-03", status: "completed", priority: "high", createdAt: "2026-01-27T17:00:00" },
      { id: "ai-41", meetingId: "mtg-16", text: "Approve Q2 engineering off-site budget — estimate $15K", assignee: "You", dueDate: "2026-02-01", status: "completed", priority: "low", createdAt: "2026-01-27T17:00:00" },
    ],
    decisions: [
      { id: "d-24", meetingId: "mtg-16", text: "Dedicate one sprint in February exclusively to transcription pipeline refactor", madeBy: "Alex Kim", context: "Current tech debt is slowing velocity and will block non-English accuracy improvements", timestamp: 900, createdAt: "2026-01-27T17:00:00" },
    ],
    transcript: [
      { speaker: "You", text: "Alex, how's the team feeling after Q4? I know we pushed hard.", timestamp: 0, confidence: 0.99, sentiment: "neutral" },
      { speaker: "Alex Kim", text: "Morale is genuinely high. Shipping 94% of the roadmap was a real confidence builder. The team is proud of what they did. That said, I want to talk about some technical debt that's been building up that I think we need to address proactively.", timestamp: 15, confidence: 0.97, sentiment: "neutral" },
      { speaker: "You", text: "Tell me about the tech debt situation.", timestamp: 50, confidence: 0.98, sentiment: "neutral" },
      { speaker: "Alex Kim", text: "The transcription pipeline specifically. We've patched it five or six times to support new features without ever properly refactoring the core architecture. It's become fragile. Any time someone touches it, there's a risk of introducing regressions. And this is the exact component we need to improve for non-English accuracy — so the debt is actively blocking our roadmap.", timestamp: 62, confidence: 0.96, sentiment: "negative", isHighlight: true },
      { speaker: "You", text: "That's a risk I take seriously. What would a proper refactor look like in terms of scope?", timestamp: 105, confidence: 0.98, sentiment: "neutral" },
      { speaker: "Alex Kim", text: "One dedicated sprint. I want to pull the whole backend team off new features for two weeks to clean it up properly. I know that's a hard ask, but trying to do it incrementally alongside feature work hasn't worked. We need a clean break.", timestamp: 118, confidence: 0.97, sentiment: "neutral" },
      { speaker: "You", text: "I support that. Let's plan it for February. What else is on your mind?", timestamp: 155, confidence: 0.98, sentiment: "positive", isHighlight: true },
      { speaker: "Alex Kim", text: "Hiring. We have two strong backend candidates in final rounds — both targeting February start dates if we can move quickly on offers. I'm optimistic about both of them.", timestamp: 170, confidence: 0.96, sentiment: "positive" },
      { speaker: "You", text: "Let's not let those offers sit. What's their compensation expectation?", timestamp: 200, confidence: 0.98, sentiment: "neutral" },
      { speaker: "Alex Kim", text: "Both are around the $175K to $185K range for base. That's within the band for senior engineers. One more thing — I'd like to plan an engineering off-site for Q2. The team is distributed and I think a face-to-face would do a lot for cohesion before we enter the intense H2 push.", timestamp: 215, confidence: 0.97, sentiment: "positive", isHighlight: true },
      { speaker: "You", text: "I love that idea. What are you thinking budget-wise?", timestamp: 258, confidence: 0.98, sentiment: "positive" },
      { speaker: "Alex Kim", text: "I'd estimate around 15K total for a three-day event if we keep it domestic. Flights, hotel, team dinners. I can put together a more detailed estimate.", timestamp: 270, confidence: 0.96, sentiment: "neutral" },
    ],
    sentiment: 78,
    tags: ["1:1", "management", "engineering"],
    folder: "1:1s",
  },
  {
    id: "mtg-17",
    title: "Board Meeting: January",
    date: "2026-01-30T14:00:00",
    duration: 4200,
    platform: "zoom",
    participants: [
      { name: "You", role: "CEO", talkTime: 1800 },
      { name: "Jordan Lee", email: "jordan@company.com", role: "CFO", talkTime: 700 },
      { name: "Alex Kim", email: "alex@company.com", role: "CTO", talkTime: 400 },
      { name: "Michelle Park", email: "michelle@sequoia.com", role: "Board Member (Sequoia)", talkTime: 800 },
      { name: "Trevor Adeyemi", email: "trevor@ventureone.com", role: "Board Member (VentureOne)", talkTime: 500 },
    ],
    status: "completed",
    summary: "January board meeting presenting Q4 results and 2026 annual plan. Board expressed strong confidence in the growth trajectory and approved the Series B fundraise process. Sequoia confirmed they plan to lead the round. Burn multiple target set at 1.2x or below.",
    keyPoints: [
      "Q4 results presented: revenue, retention, and pipeline all above plan",
      "2026 plan approved: $12M ARR target, 45 headcount by year-end",
      "Series B process approved — Sequoia leading, targeting April close",
      "Board requested monthly financial dashboards going forward",
      "Burn multiple target: 1.2x or below to maintain investor confidence",
    ],
    actionItems: [
      { id: "ai-42", meetingId: "mtg-17", text: "Send board-approved 2026 annual plan document to all board members", assignee: "You", dueDate: "2026-02-03", status: "completed", priority: "high", createdAt: "2026-01-30T16:00:00" },
      { id: "ai-43", meetingId: "mtg-17", text: "Set up monthly financial dashboard for board reporting", assignee: "Jordan Lee", dueDate: "2026-02-07", status: "completed", priority: "medium", createdAt: "2026-01-30T16:00:00" },
      { id: "ai-44", meetingId: "mtg-17", text: "Begin Series B data room preparation", assignee: "Jordan Lee", dueDate: "2026-02-15", status: "completed", priority: "high", createdAt: "2026-01-30T16:00:00" },
    ],
    decisions: [
      { id: "d-25", meetingId: "mtg-17", text: "Approve Series B fundraise process — target April close at $80M+ valuation", madeBy: "Michelle Park", context: "Board unanimous on timing; market conditions favorable and metrics support premium valuation", timestamp: 2800, createdAt: "2026-01-30T16:00:00" },
      { id: "d-26", meetingId: "mtg-17", text: "Maintain burn multiple at 1.2x or below as covenant for Q1 and Q2", madeBy: "Trevor Adeyemi", context: "Investors want to see disciplined growth ahead of Series B — not growth at any cost", timestamp: 3500, createdAt: "2026-01-30T16:00:00" },
    ],
    transcript: [
      { speaker: "You", text: "Thank you all for joining. I'll start with the Q4 results, then hand off to Jordan for the financials, and Alex will cover the product roadmap. Then we'll get into the 2026 plan and the Series B discussion.", timestamp: 0, confidence: 0.98, sentiment: "neutral" },
      { speaker: "Jordan Lee", text: "Q4 was our strongest quarter on record. Revenue came in at $2.8M ARR — 40% quarter-over-quarter growth and 12% above the target we set in October. Gross retention held at 92% and net retention improved to 118%.", timestamp: 20, confidence: 0.97, sentiment: "positive", isHighlight: true },
      { speaker: "Michelle Park", text: "The net retention number is exceptional. That's telling us customers are expanding faster than others are churning. What's driving expansion?", timestamp: 55, confidence: 0.96, sentiment: "positive" },
      { speaker: "Jordan Lee", text: "Enterprise deals. We're landing at one team size and expanding within the org. Meridian just committed to a 150-seat deal. We're seeing this pattern repeatedly.", timestamp: 72, confidence: 0.97, sentiment: "positive" },
      { speaker: "Alex Kim", text: "On the product side, 2026 is about three bets: real-time collaboration, mobile app, and the enterprise admin console. The admin console is the most urgent — it's blocking deals in procurement. But real-time collab is what creates the long-term moat.", timestamp: 100, confidence: 0.96, sentiment: "neutral" },
      { speaker: "Trevor Adeyemi", text: "What's your burn multiple looking like? I want to see disciplined growth here, not growth at any cost, especially heading into a fundraise.", timestamp: 135, confidence: 0.97, sentiment: "neutral" },
      { speaker: "Jordan Lee", text: "Current burn multiple is 1.15x — we're spending $1.15 for every dollar of new ARR. We're committed to keeping that at 1.2x or below. The Series B capital would let us invest in growth channels that have proven ROI, not speculative spending.", timestamp: 150, confidence: 0.97, sentiment: "positive", isHighlight: true },
      { speaker: "Michelle Park", text: "I want to formally say that Sequoia intends to lead the Series B. The growth trajectory, the retention metrics, and the technical differentiation are exactly what we look for. We're targeting an April close at $80M pre-money or above.", timestamp: 192, confidence: 0.96, sentiment: "positive", isHighlight: true },
      { speaker: "You", text: "That's a significant endorsement and we're thrilled to have your continued support. Jordan will have the data room fully prepared by mid-February to support the process.", timestamp: 232, confidence: 0.98, sentiment: "positive" },
      { speaker: "Trevor Adeyemi", text: "One governance request going forward: I'd like to see monthly financial dashboards rather than quarterly. As you scale, the board needs better real-time visibility.", timestamp: 260, confidence: 0.97, sentiment: "neutral" },
      { speaker: "You", text: "Absolutely. Jordan, let's get that set up within the next two weeks. We're fully aligned on tighter reporting as we head into the growth phase.", timestamp: 285, confidence: 0.98, sentiment: "positive" },
    ],
    sentiment: 88,
    tags: ["board", "executive", "fundraising"],
    folder: "Executive",
  },
  {
    id: "mtg-18",
    title: "Sprint Kickoff: Mobile v2",
    date: "2026-02-03T10:00:00",
    duration: 2100,
    platform: "google_meet",
    participants: [
      { name: "You", role: "Product Lead", talkTime: 500 },
      { name: "Sarah Chen", email: "sarah@company.com", role: "Engineering Manager", talkTime: 600 },
      { name: "Lisa Wang", email: "lisa@company.com", role: "Frontend Engineer", talkTime: 520 },
      { name: "Marcus Johnson", email: "marcus@company.com", role: "Lead Designer", talkTime: 480 },
    ],
    status: "completed",
    summary: "Sprint kickoff for the Mobile v2 redesign initiative. Reviewed the design specs, finalized the technical approach, and scoped the first two-week sprint. Focused on navigation architecture, meeting list performance, and the new bottom tab bar design.",
    keyPoints: [
      "Mobile v2 sprint 1 scope: new navigation, meeting list performance, bottom tab bar",
      "Marcus presenting final design specs — approved with minor tweaks",
      "Lisa leading frontend implementation — targeting React Native 0.74",
      "Performance target: meeting list load under 1 second on mid-range devices",
      "Beta release to internal team by February 14",
    ],
    actionItems: [
      { id: "ai-45", meetingId: "mtg-18", text: "Set up React Native 0.74 branch and CI pipeline for mobile v2", assignee: "Lisa Wang", dueDate: "2026-02-05", status: "completed", priority: "high", createdAt: "2026-02-03T11:00:00" },
      { id: "ai-46", meetingId: "mtg-18", text: "Export final design assets and create component library in Figma", assignee: "Marcus Johnson", dueDate: "2026-02-05", status: "completed", priority: "high", createdAt: "2026-02-03T11:00:00" },
      { id: "ai-47", meetingId: "mtg-18", text: "Write performance test suite for meeting list — measure load times across devices", assignee: "Lisa Wang", dueDate: "2026-02-12", status: "completed", priority: "medium", createdAt: "2026-02-03T11:00:00" },
    ],
    decisions: [
      { id: "d-27", meetingId: "mtg-18", text: "Use React Native 0.74 with the new architecture enabled for Mobile v2", madeBy: "Sarah Chen", context: "New architecture provides 30-40% performance improvement for list-heavy UIs", timestamp: 800, createdAt: "2026-02-03T11:00:00" },
    ],
    transcript: [
      { speaker: "You", text: "Alright, let's get Mobile v2 officially kicked off. Marcus, walk us through the final designs.", timestamp: 0, confidence: 0.99, sentiment: "neutral" },
      { speaker: "Marcus Johnson", text: "I've finalized the navigation architecture. The key change is moving from a hamburger menu to a bottom tab bar with five primary destinations: Home, Meetings, Actions, Insights, and Settings. Research shows this pattern reduces navigation time by about 40% on mobile.", timestamp: 12, confidence: 0.97, sentiment: "positive", isHighlight: true },
      { speaker: "Lisa Wang", text: "I love the direction. One technical note — with the bottom tab bar, we'll need to rethink how we handle deep linking. We currently have 12 deep link routes that assume the drawer navigation structure.", timestamp: 45, confidence: 0.96, sentiment: "neutral" },
      { speaker: "Sarah Chen", text: "Good catch. Lisa, can you document the deep link changes needed? We should get those mapped before we start the navigation refactor.", timestamp: 68, confidence: 0.97, sentiment: "neutral" },
      { speaker: "You", text: "What's the performance target for the meeting list? That's the main thing users complained about — it loads slowly on older phones.", timestamp: 85, confidence: 0.98, sentiment: "neutral" },
      { speaker: "Lisa Wang", text: "I'm targeting under one second to first-content on mid-range Android devices. The new React Native architecture should help significantly — it offloads rendering from the JS thread.", timestamp: 98, confidence: 0.96, sentiment: "neutral" },
      { speaker: "Sarah Chen", text: "We'll use React Native 0.74 with the new architecture enabled. I tested it on the benchmark suite last week — 35% faster list rendering compared to the current build.", timestamp: 120, confidence: 0.97, sentiment: "positive", isHighlight: true },
      { speaker: "You", text: "That's a meaningful improvement. What's the internal beta timeline?", timestamp: 145, confidence: 0.98, sentiment: "positive" },
      { speaker: "Marcus Johnson", text: "If we hit our sprint targets, we can have the internal beta ready by February 14th. I'd love to get at least the whole company using it before we go wider.", timestamp: 158, confidence: 0.95, sentiment: "positive" },
    ],
    sentiment: 80,
    tags: ["mobile", "engineering", "sprint"],
    folder: "Engineering",
  },
  {
    id: "mtg-19",
    title: "Client Check-in: Apex Corp",
    date: "2026-02-07T11:00:00",
    duration: 1800,
    platform: "zoom",
    participants: [
      { name: "You", role: "Account Manager", talkTime: 700 },
      { name: "Rachel Torres", email: "rachel@company.com", role: "Customer Success", talkTime: 600 },
      { name: "Sandra Wu", email: "sandra@apexcorp.com", role: "VP Operations (Apex)", talkTime: 500 },
    ],
    status: "completed",
    summary: "Quarterly check-in with Apex Corp (80-seat account). Very positive feedback — team adoption at 94%, meeting time reduced by an average of 22 minutes per week per person. Sandra inquired about expanding to their London office (40 additional seats). Renewal discussion deferred to March.",
    keyPoints: [
      "Apex adoption at 94% — one of the highest in our customer base",
      "Users saving avg 22 minutes per week in meetings — strong ROI story",
      "Expansion opportunity: London office, 40 additional seats (~$40K ACV uplift)",
      "Sandra requesting executive dashboard for her leadership team",
      "Renewal coming up in May — no churn risk; strong expansion opportunity",
    ],
    actionItems: [
      { id: "ai-48", meetingId: "mtg-19", text: "Prepare Apex Corp expansion proposal for London office (40 seats)", assignee: "Rachel Torres", dueDate: "2026-02-14", status: "completed", priority: "high", createdAt: "2026-02-07T12:00:00" },
      { id: "ai-49", meetingId: "mtg-19", text: "Mock up executive dashboard view and share with Sandra for feedback", assignee: "You", dueDate: "2026-02-21", status: "overdue", priority: "medium", createdAt: "2026-02-07T12:00:00" },
    ],
    decisions: [
      { id: "d-28", meetingId: "mtg-19", text: "Pursue Apex Corp London expansion — 40-seat upsell opportunity", madeBy: "Rachel Torres", context: "Strong adoption, positive sentiment, and existing London office make this a low-risk expansion", timestamp: 1200, createdAt: "2026-02-07T12:00:00" },
    ],
    transcript: [
      { speaker: "You", text: "Sandra, great to connect. We're coming up on the three-month mark with Apex and wanted to check in on how things are going from your side.", timestamp: 0, confidence: 0.98, sentiment: "positive" },
      { speaker: "Sandra Wu", text: "Honestly, we're really happy. Adoption across the team has been higher than I expected — we're at 94%, which is remarkable for a new tool. People are actually using it, which is not always the case.", timestamp: 15, confidence: 0.96, sentiment: "positive", isHighlight: true },
      { speaker: "Rachel Torres", text: "That's one of the highest adoption rates we see across our customer base. What do you think drove it?", timestamp: 45, confidence: 0.97, sentiment: "positive" },
      { speaker: "Sandra Wu", text: "The automatic action item tracking is the big one. Our team doesn't have to manually update their task lists after every meeting — Reverbic does it. That was the friction point that killed our last tool.", timestamp: 58, confidence: 0.96, sentiment: "positive" },
      { speaker: "You", text: "We love hearing that. Are there areas where it's not meeting expectations?", timestamp: 90, confidence: 0.98, sentiment: "neutral" },
      { speaker: "Sandra Wu", text: "One thing my leadership team has been asking for is an executive-level dashboard — a view that aggregates meeting trends across the organization. Right now each person sees their own meetings. I want to see patterns across all of ops.", timestamp: 103, confidence: 0.95, sentiment: "neutral" },
      { speaker: "Rachel Torres", text: "That's on our roadmap — we call it the executive summary view. I can share a mockup with you once it's a bit further along. We'd love Apex to be a design partner on that feature.", timestamp: 138, confidence: 0.97, sentiment: "positive", isHighlight: true },
      { speaker: "Sandra Wu", text: "I'd welcome that. One other topic I wanted to raise — we have a London office with about 40 people. They've been asking to get access after seeing how we use it here. Is that something we could add to our contract?", timestamp: 165, confidence: 0.96, sentiment: "positive", isHighlight: true },
      { speaker: "You", text: "Absolutely. We'd love to expand to your London team. We can put together a proposal for the 40 additional seats. Rachel, can you handle that?", timestamp: 202, confidence: 0.98, sentiment: "positive" },
      { speaker: "Rachel Torres", text: "I'll have a proposal to you by the end of next week. We can also look at a consolidated contract with a volume discount since you'd be at 120 seats total.", timestamp: 218, confidence: 0.97, sentiment: "positive" },
      { speaker: "Sandra Wu", text: "A volume discount would be appreciated. I'll loop in our procurement team once I see the proposal. Our current contract renews in May so the timing works well.", timestamp: 248, confidence: 0.96, sentiment: "positive" },
    ],
    sentiment: 91,
    tags: ["client", "expansion", "account-management"],
    folder: "Sales",
  },
  {
    id: "mtg-20",
    title: "Hiring Committee: Frontend Roles",
    date: "2026-02-12T14:00:00",
    duration: 2400,
    platform: "google_meet",
    participants: [
      { name: "You", role: "CEO", talkTime: 400 },
      { name: "Sarah Chen", email: "sarah@company.com", role: "Engineering Manager", talkTime: 900 },
      { name: "Lisa Wang", email: "lisa@company.com", role: "Frontend Engineer", talkTime: 700 },
      { name: "David Park", email: "david@company.com", role: "Backend Engineer", talkTime: 400 },
    ],
    status: "completed",
    summary: "Hiring committee debrief for two frontend engineer positions. Reviewed four finalists. Decided to extend offers to Amara Osei and Tyler Brooks. Third candidate (Chen Wei) moved to a waitlist for a potential third role. Fourth candidate declined due to culture fit concerns.",
    keyPoints: [
      "Reviewed 4 final-round candidates for 2 frontend engineer openings",
      "Offers extended to Amara Osei (senior) and Tyler Brooks (mid-level)",
      "Chen Wei waitlisted for potential third frontend role in Q2",
      "Both offer targets: $165K base with standard equity package",
      "Target start dates: March 3 (Amara) and March 10 (Tyler)",
    ],
    actionItems: [
      { id: "ai-50", meetingId: "mtg-20", text: "Draft and send offer letters to Amara Osei and Tyler Brooks", assignee: "Sarah Chen", dueDate: "2026-02-13", status: "completed", priority: "high", createdAt: "2026-02-12T15:30:00" },
      { id: "ai-51", meetingId: "mtg-20", text: "Set up onboarding schedules for March 3 and March 10 starts", assignee: "Sarah Chen", dueDate: "2026-02-20", status: "completed", priority: "medium", createdAt: "2026-02-12T15:30:00" },
      { id: "ai-52", meetingId: "mtg-20", text: "Send personalized rejection emails to declined candidates", assignee: "You", dueDate: "2026-02-14", status: "completed", priority: "low", createdAt: "2026-02-12T15:30:00" },
    ],
    decisions: [
      { id: "d-29", meetingId: "mtg-20", text: "Extend offers to Amara Osei (senior) and Tyler Brooks (mid-level) for frontend roles", madeBy: "Sarah Chen", context: "Both demonstrated strong React/TypeScript skills and alignment with team culture in debrief discussions", timestamp: 1600, createdAt: "2026-02-12T15:30:00" },
    ],
    transcript: [
      { speaker: "Sarah Chen", text: "Okay, let's go through all four candidates. We have two open roles — one senior, one mid-level. I want to make sure we're aligned before we send any offers. Lisa, you interviewed all four — let's start with your read.", timestamp: 0, confidence: 0.97, sentiment: "neutral" },
      { speaker: "Lisa Wang", text: "Amara Osei is the clearest yes for me. Her take-home project was exceptional — she built a virtualized list component that was more performant than our current implementation. In the technical interview she caught two subtle bugs in our review code. Senior level, no question.", timestamp: 18, confidence: 0.96, sentiment: "positive", isHighlight: true },
      { speaker: "Sarah Chen", text: "Agreed. I had the same reaction. Tyler Brooks — what's your take?", timestamp: 52, confidence: 0.97, sentiment: "neutral" },
      { speaker: "Lisa Wang", text: "Tyler is strong. Not quite at Amara's level but solidly mid-to-senior. The TypeScript skills are excellent, the React patterns are clean. He's worked in a startup before so he's not going to be surprised by ambiguity. I'd feel good working with him.", timestamp: 65, confidence: 0.95, sentiment: "positive" },
      { speaker: "You", text: "What about culture fit for both of them?", timestamp: 100, confidence: 0.98, sentiment: "neutral" },
      { speaker: "Sarah Chen", text: "Both were great. Amara asked really smart questions about how we make technical decisions and pushed back thoughtfully on some of our architectural choices — in a good way. Tyler was warm, collaborative, asked about how the team handles disagreements. These are people who will contribute to the culture, not just the codebase.", timestamp: 115, confidence: 0.97, sentiment: "positive", isHighlight: true },
      { speaker: "Lisa Wang", text: "Chen Wei, the third candidate — I liked them but I think they're better suited for a more defined role. They struggled with the open-ended problem in the design review. Not a no, but not the right fit for the two open positions.", timestamp: 158, confidence: 0.95, sentiment: "neutral" },
      { speaker: "Sarah Chen", text: "I'd put Chen Wei on a waitlist. If we open a third frontend role in Q2, they'd be worth coming back to. What about the fourth candidate?", timestamp: 192, confidence: 0.97, sentiment: "neutral" },
      { speaker: "You", text: "I can speak to that one. I did the final round. Technically capable but there were some concerns about communication style in a remote environment. The team felt the same way. That's a pass from me.", timestamp: 210, confidence: 0.98, sentiment: "negative" },
      { speaker: "Sarah Chen", text: "Alright. So we're aligned: offer Amara and Tyler, waitlist Chen Wei, pass on the fourth. I'll draft the offer letters today and target $165K base for both with standard equity. Amara starts March 3, Tyler March 10 if they accept quickly.", timestamp: 238, confidence: 0.96, sentiment: "positive", isHighlight: true },
      { speaker: "You", text: "Perfect. Move fast on the offers — these people have other options. And Sarah, let's make sure the onboarding experience is strong. These are our first two new engineers of the year.", timestamp: 272, confidence: 0.98, sentiment: "positive" },
    ],
    sentiment: 83,
    tags: ["hiring", "engineering", "people"],
    folder: "Engineering",
  },
  {
    id: "mtg-21",
    title: "Marketing Budget Review",
    date: "2026-02-19T15:00:00",
    duration: 2700,
    platform: "zoom",
    participants: [
      { name: "You", role: "CEO", talkTime: 700 },
      { name: "Chris Yamamoto", email: "chris@company.com", role: "Growth Lead", talkTime: 900 },
      { name: "Sophie Bennett", email: "sophie@company.com", role: "Content Strategist", talkTime: 600 },
      { name: "Ryan O'Dell", email: "ryan@company.com", role: "Paid Ads Manager", talkTime: 500 },
    ],
    status: "completed",
    summary: "Mid-quarter marketing budget review. Google Ads delivering at $88 CAC vs $120 target — significantly better than expected. Content SEO showing strong early results with 3 comparison pages ranking on page one. Approved increasing Google Ads budget to $20K/month and adding a second content hire.",
    keyPoints: [
      "Google Ads CAC dropped to $88 — beating $120 target by 27%",
      "Comparison pages ranking on page 1: 'Reverbic vs Otter', 'Reverbic vs Fireflies', 'Reverbic vs Gong'",
      "Organic trial signups grew 44% month-over-month from SEO content",
      "Referral program launched Feb 10 — 23 referrals in first week",
      "Approved: increase Google Ads to $20K/month, hire second content writer",
    ],
    actionItems: [
      { id: "ai-53", meetingId: "mtg-21", text: "Increase Google Ads monthly budget from $15K to $20K", assignee: "Ryan O'Dell", dueDate: "2026-02-21", status: "completed", priority: "high", createdAt: "2026-02-19T16:30:00" },
      { id: "ai-54", meetingId: "mtg-21", text: "Post job listing for second content writer — target start April 1", assignee: "Sophie Bennett", dueDate: "2026-02-26", status: "completed", priority: "medium", createdAt: "2026-02-19T16:30:00" },
      { id: "ai-55", meetingId: "mtg-21", text: "Produce 5 more comparison pages targeting Zoom IQ, Chorus, Avoma, tl;dv, Otter Enterprise", assignee: "Sophie Bennett", dueDate: "2026-03-15", status: "overdue", priority: "medium", createdAt: "2026-02-19T16:30:00" },
    ],
    decisions: [
      { id: "d-30", meetingId: "mtg-21", text: "Increase Google Ads budget to $20K/month — ROI supports scale", madeBy: "You", context: "$88 CAC well below target and trending down; increasing spend to capture more of this channel's capacity", timestamp: 1400, createdAt: "2026-02-19T16:30:00" },
    ],
    transcript: [
      { speaker: "Chris Yamamoto", text: "Quick summary before we get into details: February is tracking as our best organic growth month ever. A lot of that is the content strategy starting to pay off.", timestamp: 0, confidence: 0.98, sentiment: "positive", isHighlight: true },
      { speaker: "Ryan O'Dell", text: "On the paid side, our Google Ads CAC has dropped to $88. We're beating the $120 target by nearly 30%. The keyword refinements we made in January are really working.", timestamp: 18, confidence: 0.97, sentiment: "positive", isHighlight: true },
      { speaker: "You", text: "That's excellent. If CAC is tracking that well, should we be spending more? What's the capacity of the channel?", timestamp: 42, confidence: 0.98, sentiment: "positive" },
      { speaker: "Ryan O'Dell", text: "I've modeled it out. I think we can spend up to $25K per month before we start seeing diminishing returns. The $20K number feels like the right next step — we capture more volume without burning efficiency.", timestamp: 58, confidence: 0.96, sentiment: "neutral" },
      { speaker: "Sophie Bennett", text: "The SEO side is also accelerating. Three of our comparison pages are now ranking on page one: Reverbic vs Otter, Reverbic vs Fireflies, and Reverbic vs Gong. Organic signups from content are up 44% month-over-month.", timestamp: 90, confidence: 0.97, sentiment: "positive", isHighlight: true },
      { speaker: "You", text: "This is exactly the playbook we hoped for. Sophie, if we hire a second content writer, how many pages could you ship per month?", timestamp: 125, confidence: 0.98, sentiment: "positive" },
      { speaker: "Sophie Bennett", text: "Realistically, twelve to fifteen per month. Right now I'm doing five solo. With a second writer focused on comparison and SEO content, we could really scale the program.", timestamp: 140, confidence: 0.96, sentiment: "positive" },
      { speaker: "Chris Yamamoto", text: "And the referral program is off to a strong start too. We launched on February 10 and got 23 referrals in the first week. The word-of-mouth signal is real.", timestamp: 168, confidence: 0.97, sentiment: "positive" },
      { speaker: "You", text: "Great. Let's approve the Google Ads budget increase to $20K and post the content writer role. Sophie, get the JD up by end of the month.", timestamp: 192, confidence: 0.98, sentiment: "positive" },
    ],
    sentiment: 89,
    tags: ["marketing", "budget", "growth"],
    folder: "Marketing",
  },
  {
    id: "mtg-22",
    title: "Product Demo Day",
    date: "2026-02-26T14:00:00",
    duration: 3000,
    platform: "zoom",
    participants: [
      { name: "You", role: "CEO", talkTime: 1000 },
      { name: "Sarah Chen", email: "sarah@company.com", role: "Engineering Manager", talkTime: 400 },
      { name: "Marcus Johnson", email: "marcus@company.com", role: "Lead Designer", talkTime: 350 },
      { name: "Lisa Wang", email: "lisa@company.com", role: "Frontend Engineer", talkTime: 500 },
      { name: "David Park", email: "david@company.com", role: "Backend Engineer", talkTime: 300 },
      { name: "Chris Yamamoto", email: "chris@company.com", role: "Growth Lead", talkTime: 250 },
      { name: "Rachel Torres", email: "rachel@company.com", role: "Head of Sales", talkTime: 200 },
    ],
    status: "completed",
    summary: "Internal demo day showcasing work in progress across product, engineering, and design. Teams demonstrated the Mobile v2 beta, the new real-time collaboration prototype, and the AI coaching improvements. Strong positive energy across the company. Several features cleared for broader beta access.",
    keyPoints: [
      "Mobile v2 beta demo — faster load times, new navigation, strong team reception",
      "Real-time collaboration prototype shown for first time — 'wow moment' in the room",
      "AI coaching improvements: filler word detection accuracy up from 78% to 92%",
      "Mobile v2 cleared for customer beta starting March 1",
      "Real-time collab targeting Q3 GA — more architecture work needed",
    ],
    actionItems: [
      { id: "ai-56", meetingId: "mtg-22", text: "Open Mobile v2 beta to top 50 power users by March 1", assignee: "Rachel Torres", dueDate: "2026-03-01", status: "completed", priority: "high", createdAt: "2026-02-26T15:30:00" },
      { id: "ai-57", meetingId: "mtg-22", text: "Write internal demo day recap and share across #product Slack channel", assignee: "You", dueDate: "2026-02-27", status: "completed", priority: "low", createdAt: "2026-02-26T15:30:00" },
    ],
    decisions: [
      { id: "d-31", meetingId: "mtg-22", text: "Release Mobile v2 to customer beta — March 1 launch date", madeBy: "You", context: "Demo exceeded quality bar; feedback from internal testers is strongly positive", timestamp: 1200, createdAt: "2026-02-26T15:30:00" },
      { id: "d-32", meetingId: "mtg-22", text: "Real-time collaboration targeting Q3 GA — do not rush to early access", madeBy: "Sarah Chen", context: "Architecture needs more work to handle conflict resolution at scale; better to ship it right", timestamp: 2400, createdAt: "2026-02-26T15:30:00" },
    ],
    transcript: [
      { speaker: "You", text: "Welcome to demo day, everyone. This is one of my favorite meetings of the quarter. No slide decks, no reports — just shipping. Lisa, you're kicking us off with Mobile v2.", timestamp: 0, confidence: 0.98, sentiment: "positive" },
      { speaker: "Lisa Wang", text: "Alright, let me share my screen. What you're seeing is the Mobile v2 beta running on a Pixel 7. The first thing you'll notice is the bottom tab bar — no more hamburger menu. Navigation is instant.", timestamp: 15, confidence: 0.97, sentiment: "positive", isHighlight: true },
      { speaker: "Rachel Torres", text: "Oh, that load time. That is so much faster. Is that the meeting list?", timestamp: 42, confidence: 0.96, sentiment: "positive" },
      { speaker: "Lisa Wang", text: "It is. We're at 0.8 seconds to first content on that Pixel 7. The target was under one second. We hit it with room to spare.", timestamp: 52, confidence: 0.97, sentiment: "positive", isHighlight: true },
      { speaker: "You", text: "This is shipping to beta next week. David, show us the real-time collaboration prototype.", timestamp: 75, confidence: 0.98, sentiment: "positive" },
      { speaker: "David Park", text: "Fair warning — this is early. But I wanted to show what's possible. What you're seeing is two browser windows with a shared meeting note. When I type in one window, it appears in the other in under 50 milliseconds. No refresh needed.", timestamp: 88, confidence: 0.96, sentiment: "positive", isHighlight: true },
      { speaker: "Chris Yamamoto", text: "That is genuinely impressive. Is that CRDTs under the hood?", timestamp: 130, confidence: 0.95, sentiment: "positive" },
      { speaker: "David Park", text: "Yep, using Yjs. It handles conflict resolution automatically. We still need to build the presence indicators — the avatar bubbles showing who's typing — but the core sync engine is solid.", timestamp: 140, confidence: 0.96, sentiment: "neutral" },
      { speaker: "Sarah Chen", text: "I want to set expectations: this is a Q3 feature. We're not rushing it to early access. The architecture is sound but we need more load testing before we'd feel comfortable with customers.", timestamp: 172, confidence: 0.97, sentiment: "neutral" },
      { speaker: "You", text: "Absolutely. Ship it right. Incredible work today, everyone. This is what I love about this company — we keep raising the bar.", timestamp: 195, confidence: 0.98, sentiment: "positive", isHighlight: true },
    ],
    sentiment: 92,
    tags: ["demo", "product", "engineering"],
    folder: "Product",
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
  { meetingId: "mtg-11", talkRatio: 25, fillerWords: 10, pace: 138, longestMonologue: 55, questionsAsked: 8, interruptionCount: 1, clarity: 8, engagement: 7, sentiment: 74 },
  { meetingId: "mtg-12", talkRatio: 15, fillerWords: 4, pace: 144, longestMonologue: 22, questionsAsked: 6, interruptionCount: 0, clarity: 9, engagement: 7, sentiment: 70 },
  { meetingId: "mtg-13", talkRatio: 41, fillerWords: 16, pace: 135, longestMonologue: 80, questionsAsked: 10, interruptionCount: 2, clarity: 8, engagement: 9, sentiment: 86 },
  { meetingId: "mtg-14", talkRatio: 10, fillerWords: 2, pace: 152, longestMonologue: 12, questionsAsked: 3, interruptionCount: 0, clarity: 9, engagement: 6, sentiment: 76 },
  { meetingId: "mtg-15", talkRatio: 22, fillerWords: 8, pace: 140, longestMonologue: 38, questionsAsked: 7, interruptionCount: 1, clarity: 8, engagement: 8, sentiment: 71 },
  { meetingId: "mtg-16", talkRatio: 39, fillerWords: 5, pace: 148, longestMonologue: 30, questionsAsked: 11, interruptionCount: 0, clarity: 9, engagement: 9, sentiment: 78 },
  { meetingId: "mtg-17", talkRatio: 43, fillerWords: 13, pace: 130, longestMonologue: 95, questionsAsked: 5, interruptionCount: 0, clarity: 8, engagement: 7, sentiment: 88 },
  { meetingId: "mtg-18", talkRatio: 24, fillerWords: 6, pace: 145, longestMonologue: 28, questionsAsked: 9, interruptionCount: 0, clarity: 9, engagement: 8, sentiment: 80 },
  { meetingId: "mtg-19", talkRatio: 39, fillerWords: 9, pace: 142, longestMonologue: 40, questionsAsked: 7, interruptionCount: 1, clarity: 8, engagement: 9, sentiment: 91 },
  { meetingId: "mtg-20", talkRatio: 17, fillerWords: 3, pace: 150, longestMonologue: 18, questionsAsked: 5, interruptionCount: 0, clarity: 9, engagement: 7, sentiment: 83 },
  { meetingId: "mtg-21", talkRatio: 26, fillerWords: 7, pace: 143, longestMonologue: 32, questionsAsked: 8, interruptionCount: 0, clarity: 8, engagement: 8, sentiment: 89 },
  { meetingId: "mtg-22", talkRatio: 33, fillerWords: 5, pace: 147, longestMonologue: 25, questionsAsked: 4, interruptionCount: 0, clarity: 9, engagement: 10, sentiment: 92 },
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
  { id: "clip-9", meetingId: "mtg-11", meetingTitle: "Q4 2025 Retrospective", title: "Non-English Transcription Risk", description: "Sarah flags German, Japanese, and Portuguese accuracy below 78% — losing accounts", startTime: 200, endTime: 248, type: "insight", speaker: "Sarah Chen", createdAt: "2026-01-08T11:35:00", shared: true, views: 22 },
  { id: "clip-10", meetingId: "mtg-13", meetingTitle: "Annual Planning: 2026 Goals", title: "$12M ARR North Star Set", description: "Team commits to $12M ARR target — 3x growth from current $4.2M", startTime: 55, endTime: 100, type: "decision", speaker: "You", createdAt: "2026-01-15T12:05:00", shared: true, views: 31 },
  { id: "clip-11", meetingId: "mtg-15", meetingTitle: "Sales QBR: Q4 Results", title: "Enterprise Deals Lost to SSO Gap", description: "Rachel details six lost enterprise deals all citing missing SSO and admin controls", startTime: 38, endTime: 90, type: "insight", speaker: "Rachel Torres", createdAt: "2026-01-22T14:35:00", shared: true, views: 19 },
  { id: "clip-12", meetingId: "mtg-21", meetingTitle: "Marketing Budget Review", title: "Google Ads CAC at $88", description: "Ryan confirms Google Ads CAC dropped to $88 vs $120 target — 27% below goal", startTime: 18, endTime: 60, type: "highlight", speaker: "Ryan O'Dell", createdAt: "2026-02-19T16:35:00", shared: true, views: 15 },
  { id: "clip-13", meetingId: "mtg-22", meetingTitle: "Product Demo Day", title: "Mobile v2 Load Time: 0.8s", description: "Lisa demonstrates Mobile v2 hitting 0.8 second load time on Pixel 7, beating the 1-second target", startTime: 52, endTime: 78, type: "highlight", speaker: "Lisa Wang", createdAt: "2026-02-26T15:35:00", shared: true, views: 28 },
  { id: "clip-14", meetingId: "mtg-22", meetingTitle: "Product Demo Day", title: "Real-Time Collaboration Prototype", description: "David demos 50ms live sync using Yjs CRDTs — first look at the upcoming collab feature", startTime: 88, endTime: 145, type: "highlight", speaker: "David Park", createdAt: "2026-02-26T15:35:00", shared: true, views: 34 },
];

// ─── WEEKLY DIGESTS ─────────────────────────────

export const demoWeeklyDigests: WeeklyDigest[] = [
  {
    weekOf: "2026-02-23",
    totalMeetings: 5,
    totalHours: 4.1,
    actionItemsCreated: 6,
    actionItemsCompleted: 5,
    decisionsLogged: 4,
    topSpeakers: [
      { name: "You", minutes: 82 },
      { name: "Lisa Wang", minutes: 41 },
      { name: "David Park", minutes: 35 },
    ],
    coachScore: 84,
    trend: "up",
    insight: "Demo Day was your best meeting of the month — high energy, tight delivery, and you asked questions rather than talking over demos. Your filler word count was the lowest in 6 weeks (5 total). Keep that question-first pattern going into March.",
  },
  {
    weekOf: "2026-02-16",
    totalMeetings: 4,
    totalHours: 3.8,
    actionItemsCreated: 8,
    actionItemsCompleted: 6,
    decisionsLogged: 3,
    topSpeakers: [
      { name: "You", minutes: 58 },
      { name: "Chris Yamamoto", minutes: 52 },
      { name: "Sophie Bennett", minutes: 34 },
    ],
    coachScore: 81,
    trend: "stable",
    insight: "Marketing budget review went well — you were concise and data-driven. One pattern to watch: you have a tendency to approve budget decisions quickly when numbers look good. Consider adding a 'devil's advocate' question to your standard process before approving spend increases.",
  },
  {
    weekOf: "2026-02-09",
    totalMeetings: 6,
    totalHours: 5.2,
    actionItemsCreated: 10,
    actionItemsCompleted: 7,
    decisionsLogged: 5,
    topSpeakers: [
      { name: "You", minutes: 95 },
      { name: "Sarah Chen", minutes: 60 },
      { name: "Rachel Torres", minutes: 48 },
    ],
    coachScore: 76,
    trend: "down",
    insight: "Busy week with hiring committee and client check-ins. Your talk time spiked in the Apex Corp check-in — you spoke 39% of the time in what should have been a listening-heavy customer meeting. Let the customer talk more; your job is to hear what they need, not pitch.",
  },
  {
    weekOf: "2026-02-02",
    totalMeetings: 3,
    totalHours: 2.9,
    actionItemsCreated: 5,
    actionItemsCompleted: 5,
    decisionsLogged: 2,
    topSpeakers: [
      { name: "You", minutes: 42 },
      { name: "Marcus Johnson", minutes: 38 },
      { name: "Lisa Wang", minutes: 35 },
    ],
    coachScore: 80,
    trend: "up",
    insight: "Light meeting week — good balance. The Mobile v2 sprint kickoff showed you at your best: clear agenda, quick decisions, empowering the team. Your questions-to-statements ratio was 1:2 this week, up from 1:4 last month. Keep developing that pattern.",
  },
  {
    weekOf: "2026-01-26",
    totalMeetings: 7,
    totalHours: 7.3,
    actionItemsCreated: 12,
    actionItemsCompleted: 9,
    decisionsLogged: 6,
    topSpeakers: [
      { name: "You", minutes: 148 },
      { name: "Rachel Torres", minutes: 78 },
      { name: "Jordan Lee", minutes: 65 },
    ],
    coachScore: 73,
    trend: "stable",
    insight: "Heavy executive week with the board meeting and sales QBR. You spoke 43% of the board meeting — appropriate for a CEO presenting — but your monologue lengths were long. The board values concise updates. Try capping each section at 3 minutes and opening for questions earlier.",
  },
  {
    weekOf: "2026-01-19",
    totalMeetings: 5,
    totalHours: 4.5,
    actionItemsCreated: 9,
    actionItemsCompleted: 8,
    decisionsLogged: 4,
    topSpeakers: [
      { name: "You", minutes: 76 },
      { name: "Sarah Chen", minutes: 70 },
      { name: "Rachel Torres", minutes: 55 },
    ],
    coachScore: 77,
    trend: "up",
    insight: "Sales QBR was a strong meeting — you asked good diagnostic questions when Rachel shared the lost deal data. Action item completion rate is back above 85% this week. One note: your pace in the QBR was 140 WPM, slightly fast. Slowing to 130 WPM in data-heavy meetings helps retention.",
  },
  {
    weekOf: "2026-01-12",
    totalMeetings: 4,
    totalHours: 3.6,
    actionItemsCreated: 7,
    actionItemsCompleted: 6,
    decisionsLogged: 3,
    topSpeakers: [
      { name: "You", minutes: 55 },
      { name: "Sarah Chen", minutes: 48 },
      { name: "David Park", minutes: 42 },
    ],
    coachScore: 72,
    trend: "stable",
    insight: "Security audit review was efficient — you stayed mostly in listening mode, which was the right call given the external auditor was leading. Annual planning session ran long but produced clear OKRs. Consider time-boxing agenda items in future planning sessions to keep 90-minute blocks from drifting to 3 hours.",
  },
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
  { name: "Product", count: 4, color: "#7C3AED" },
  { name: "Engineering", count: 4, color: "#06B6D4" },
  { name: "Sales", count: 3, color: "#10B981" },
  { name: "Design", count: 1, color: "#F59E0B" },
  { name: "Executive", count: 3, color: "#F43F5E" },
  { name: "Marketing", count: 3, color: "#8B5CF6" },
  { name: "Company", count: 1, color: "#64748B" },
  { name: "1:1s", count: 2, color: "#EC4899" },
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

// ─── MEETING-STORE CONVERTER ──────────────────────
// Converts demo-data Meeting[] to the meeting-store Meeting format
// used by the app's hooks (useMeetings / useMeeting).

import type { Meeting as StoreMeeting } from "@/lib/meeting-store";

export function getDemoMeetingsForStore(): StoreMeeting[] {
  return demoMeetings.map((m) => {
    // Build transcript in meeting-store format
    const transcript = m.transcript
      ? {
          text: m.transcript.map((s) => `${s.speaker}: ${s.text}`).join("\n\n"),
          language: "en",
          duration: m.duration,
          segments: m.transcript.map((s, i, arr) => ({
            start: s.timestamp,
            end: arr[i + 1]?.timestamp ?? s.timestamp + 30,
            text: `${s.speaker}: ${s.text}`,
          })),
        }
      : null;

    return {
      id: m.id,
      title: m.title,
      s3Key: "",
      fileName: `${m.title.toLowerCase().replace(/[^a-z0-9]+/g, "-")}.webm`,
      fileSize: Math.round(m.duration * 12000 + Math.random() * 500000),
      duration: m.duration,
      language: "en",
      tags: m.tags,
      notes: "",
      createdAt: m.date,
      status: "completed" as const,
      audioAnalysis: {
        isSilent: false,
        silencePercent: Math.round(5 + Math.random() * 10),
        peakDb: -(Math.round(10 + Math.random() * 8)),
        recommendation: "Good audio quality",
      },
      transcript,
      summary: m.summary ?? null,
      keyPoints: m.keyPoints ?? [],
      actionItems: (m.actionItems ?? []).map((ai) => ({
        text: ai.text,
        assignee: ai.assignee,
        priority: ai.priority,
        completed: ai.status === "completed",
      })),
      decisions: (m.decisions ?? []).map((d) => ({
        text: d.text,
        madeBy: d.madeBy,
      })),
    };
  });
}
