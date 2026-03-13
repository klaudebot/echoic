#!/usr/bin/env python3
"""
Generate realistic demo meeting audio using edge-tts, then transcribe via OpenAI Whisper.
Outputs meeting JSON files ready to be imported as demo data.
"""

import asyncio
import json
import os
import subprocess
import sys
import tempfile
import time
from pathlib import Path
from datetime import datetime, timedelta
import random

# Edge-TTS voices — high quality, diverse
VOICES = {
    "Alex Kim": "en-US-GuyNeural",
    "Sarah Chen": "en-US-JennyNeural",
    "Marcus Johnson": "en-US-TonyNeural",
    "Priya Patel": "en-IN-NeerjaNeural",
    "David Park": "en-US-DavisNeural",
    "Lisa Wang": "en-US-AriaNeural",
    "James Rodriguez": "en-US-JasonNeural",
    "Emily Foster": "en-US-SaraNeural",
    "Ryan Mitchell": "en-US-BrandonNeural",
    "Olivia Taylor": "en-AU-NatashaNeural",
    "Chris Nakamura": "en-US-ChristopherNeural",
    "Jessica Brown": "en-US-MichelleNeural",
    "Tom Wright": "en-GB-RyanNeural",
    "Anna Kowalski": "en-US-AmberNeural",
    "Mike Chen": "en-US-EricNeural",
}

FFMPEG = os.environ.get("FFMPEG_PATH", "/home/primary/.local/bin/ffmpeg")

# ─── Meeting Scripts ───────────────────────────────────────────

MEETINGS = [
    {
        "id": "demo-mtg-01",
        "title": "Q1 Product Roadmap Review",
        "date": "2026-01-15T10:00:00",
        "tags": ["roadmap", "quarterly-review", "product"],
        "folder": "Product",
        "segments": [
            ("Alex Kim", "Good morning everyone. Let's dive into the Q1 roadmap review. We have a lot to cover today so let's keep it tight. Sarah, why don't you kick us off with the engineering update."),
            ("Sarah Chen", "Thanks Alex. So the big news is that the authentication overhaul is complete. We migrated from our legacy auth system to the new OAuth 2.0 implementation. Login times dropped from three seconds to under 400 milliseconds. User complaints about authentication failures are down 90 percent."),
            ("Alex Kim", "That's a massive improvement. What about the API performance initiative?"),
            ("Sarah Chen", "David's been leading that. David, you want to give the update?"),
            ("David Park", "Sure. We've re-architected the core API endpoints. Average response times went from 850 milliseconds down to 120 milliseconds. We also implemented request batching which reduced the number of round trips by about 60 percent. The team is really proud of this one."),
            ("Alex Kim", "Those numbers are impressive. Marcus, how's the design system coming along?"),
            ("Marcus Johnson", "The component library is now at version 2.0. We shipped 47 new components, updated the design tokens, and we've got dark mode support across the entire application. The feedback from the beta users has been overwhelmingly positive. They especially love the new data visualization components."),
            ("Priya Patel", "I can back that up with data. User engagement with the new dashboard components is up 34 percent. Session duration increased by 22 percent since we rolled out the redesign. The heat maps show users are actually finding and using features that were previously buried."),
            ("Alex Kim", "Excellent work everyone. Now let's talk about Q2 priorities. I want to focus on three things. First, the AI features pipeline. Second, international expansion. Third, enterprise security compliance."),
            ("Sarah Chen", "For the AI pipeline, we need to hire at least two machine learning engineers. The current team is stretched thin between maintaining the recommendation engine and building the new natural language search feature."),
            ("Alex Kim", "Agreed. I'll approve those headcount requests today. What's the timeline for natural language search?"),
            ("David Park", "If we get the ML engineers onboarded by mid-February, we could have a working prototype by end of March. Full production rollout would be early Q2."),
            ("Marcus Johnson", "From the design side, I've already done the UX research for the search interface. We tested three prototypes with users and the conversational search pattern tested best. I can share the research deck after this meeting."),
            ("Priya Patel", "One thing to flag. Our data shows that 28 percent of our user base is now outside North America. We're seeing particularly strong growth in the UK, Germany, and Australia. We should prioritize localization."),
            ("Alex Kim", "Good point Priya. Let's add that to the Q2 roadmap. I want us to support at least five languages by end of Q2. Sarah, can your team handle the infrastructure for multi-language support?"),
            ("Sarah Chen", "Yes, we've actually been planning for this. The new i18n framework is already in the codebase. We just need the translation content and some UI adjustments for right-to-left languages."),
            ("Alex Kim", "Great. Let me summarize the decisions. We're approving two ML engineer hires. Natural language search prototype by end of March. Five language localization by end of Q2. And we're maintaining the current pace on the design system evolution. Any objections? Good. Let's execute."),
        ],
    },
    {
        "id": "demo-mtg-02",
        "title": "Weekly Engineering Standup",
        "date": "2026-01-20T09:00:00",
        "tags": ["standup", "engineering", "weekly"],
        "folder": "Engineering",
        "segments": [
            ("Sarah Chen", "Alright team, let's do our weekly sync. Keep it to blockers and wins. David, you're up first."),
            ("David Park", "So this week I finished the database migration for the analytics service. We're now running on PostgreSQL 16 with the new partitioning scheme. Query performance for the reporting dashboard improved by about 5x. No issues in production so far."),
            ("Sarah Chen", "That's great. Any blockers?"),
            ("David Park", "One thing. I need access to the staging environment for the new payment service. My credentials expired and IT hasn't responded to my ticket in three days."),
            ("Sarah Chen", "I'll escalate that today. Lisa, what's your update?"),
            ("Lisa Wang", "I shipped the new notification center this week. It supports real-time push notifications, email digest preferences, and in-app notification grouping. Early metrics show the click-through rate on notifications is up 45 percent compared to the old system."),
            ("Sarah Chen", "Nice work Lisa. James, how's the infrastructure side?"),
            ("James Rodriguez", "Two things. First, I completed the Kubernetes cluster upgrade. We're now on version 1.29 with zero downtime during the migration. Second, I set up the new monitoring stack with Grafana and Prometheus. We now have 200 custom metrics being tracked across all services."),
            ("Sarah Chen", "Excellent. Any concerns about the upcoming feature freeze for the release?"),
            ("James Rodriguez", "The only concern is the load testing. We haven't done a proper load test since the architecture changes. I'd like to schedule one before we cut the release branch."),
            ("Sarah Chen", "Good call. Let's block out Thursday afternoon for load testing. Everyone make sure your services are instrumented. David, can you coordinate with James on the test scenarios?"),
            ("David Park", "Will do. I'll draft the test plan by tomorrow morning."),
            ("Lisa Wang", "Quick question. Should I prioritize the accessibility audit or the mobile responsive fixes for next sprint?"),
            ("Sarah Chen", "Accessibility audit first. We have the compliance deadline coming up in February and we need to be WCAG 2.1 AA compliant. The mobile fixes can go in the following sprint."),
        ],
    },
    {
        "id": "demo-mtg-03",
        "title": "Enterprise Client Onboarding: Meridian Corp",
        "date": "2026-01-22T14:00:00",
        "tags": ["client", "onboarding", "enterprise", "meridian"],
        "folder": "Sales",
        "segments": [
            ("Emily Foster", "Welcome everyone. I'm Emily, your customer success manager. We're excited to get Meridian Corp set up on our platform. Tom, thanks for joining from the Meridian side."),
            ("Tom Wright", "Thanks Emily. We've been looking forward to this. We have about 200 users who'll need access, and we're particularly interested in the API integration capabilities."),
            ("Emily Foster", "Absolutely. Let me walk you through the onboarding process. First, we'll set up your organization workspace with single sign-on. Sarah from our engineering team is here to help with any technical questions."),
            ("Sarah Chen", "Hi Tom. For SSO, we support SAML 2.0 and OIDC. Most enterprise clients use Azure AD or Okta. Which identity provider are you on?"),
            ("Tom Wright", "We're on Azure AD. We also need to integrate with our existing Jira instance for the action item sync feature you demonstrated."),
            ("Sarah Chen", "Perfect. Azure AD integration is straightforward. I'll send you the configuration guide after this call. For the Jira integration, we have a native connector. You'll just need to generate an API token from your Jira admin panel."),
            ("Emily Foster", "Tom, we typically do a phased rollout. Week one, we onboard your leadership team, about 20 users. Week two, we expand to department heads. By week three, full company rollout. Does that timeline work?"),
            ("Tom Wright", "That works well for us. One concern though. We have strict data residency requirements. All our data needs to stay within the EU region. Is that possible?"),
            ("Sarah Chen", "Yes, we have EU data centers in Frankfurt and Amsterdam. We can configure your workspace to use EU-only infrastructure. All data at rest and in transit will stay within the EU boundary."),
            ("Tom Wright", "Excellent. That was actually our biggest concern going in. What about data export capabilities? Our compliance team needs to be able to export all meeting data monthly."),
            ("Emily Foster", "We have a full data export API. You can export meeting transcripts, action items, decisions, and analytics data in JSON or CSV format. We also support automated scheduled exports."),
            ("Tom Wright", "This is all sounding very good. When can we start the SSO setup?"),
            ("Emily Foster", "We can start right away. I'll send you the onboarding package today. Sarah will schedule a technical session for the SSO configuration. We should have your leadership team up and running by Friday."),
        ],
    },
    {
        "id": "demo-mtg-04",
        "title": "Design Sprint: Dashboard Redesign",
        "date": "2026-01-27T10:00:00",
        "tags": ["design", "sprint", "dashboard", "ux"],
        "folder": "Design",
        "segments": [
            ("Marcus Johnson", "Welcome to day one of our dashboard redesign sprint. We have three days to go from research to prototype. Let's start with the user research findings. Priya, you've been analyzing the usage data."),
            ("Priya Patel", "Right. So I analyzed six months of user behavior data. The key findings are pretty eye-opening. First, 73 percent of users only interact with three of the twelve widgets on the current dashboard. Second, the most-used feature, the meeting summary view, is buried behind two clicks. Third, users spend an average of 47 seconds looking for the search function."),
            ("Marcus Johnson", "Those are really telling numbers. The current design is clearly not serving users well. Lisa, what did the user interviews reveal?"),
            ("Lisa Wang", "I conducted 15 user interviews last week. The top three requests were: one, a customizable dashboard where they can pin their most-used features. Two, better meeting history search with filters. And three, a consolidated action item view across all meetings instead of having to check each meeting individually."),
            ("Marcus Johnson", "Great insights. Here's what I'm proposing for the new design. A three-panel layout. Left panel is a persistent navigation with quick access to recent meetings. Center panel is the main content area with a customizable widget grid. Right panel is a contextual sidebar that shows details for whatever you're focused on."),
            ("Priya Patel", "I like the three-panel approach. Based on the data, I'd suggest the default widget configuration should lead with the action items view, followed by upcoming meetings, and then the analytics summary."),
            ("Lisa Wang", "From a technical standpoint, the customizable grid is going to need drag-and-drop support. I've been evaluating libraries and I think we should use dnd-kit. It's accessible, performant, and plays well with our React component architecture."),
            ("Marcus Johnson", "Agreed. Let me also talk about the visual direction. We're moving away from the card-heavy design to something more streamlined. Think clean data tables, subtle borders instead of heavy shadows, and more white space. The goal is professional and focused, not flashy."),
            ("Lisa Wang", "One question about mobile. Are we doing a responsive adaptation of the three-panel layout or a completely different mobile experience?"),
            ("Marcus Johnson", "Good question. For mobile, we'll collapse to a single panel with a bottom navigation bar. The right sidebar becomes a slide-over sheet. I'll have the mobile wireframes ready by tomorrow afternoon."),
            ("Priya Patel", "Should we A/B test the new dashboard against the current one? I can set up the experiment framework."),
            ("Marcus Johnson", "Absolutely. Let's plan for a 50/50 split with a two-week test period. We'll measure task completion time, feature discovery rate, and overall satisfaction scores. Alright team, let's start sketching. We'll reconvene at 3 PM to share concepts."),
        ],
    },
    {
        "id": "demo-mtg-05",
        "title": "Series B Planning: Investor Update",
        "date": "2026-02-03T15:00:00",
        "tags": ["fundraising", "investor", "series-b", "executive"],
        "folder": "Executive",
        "segments": [
            ("Alex Kim", "Thanks for making time everyone. We need to finalize our Series B strategy. Our current runway takes us through September, so we need to close this round by June. Let me share where we stand."),
            ("Emily Foster", "From the sales side, our numbers are strong. We closed 47 new enterprise accounts this quarter, up from 31 last quarter. Average contract value increased from 18K to 24K annually. Net revenue retention is at 125 percent."),
            ("Alex Kim", "Those are great metrics for the pitch. What about the pipeline?"),
            ("Emily Foster", "Pipeline is at 3.2 million in qualified opportunities. We have 12 deals in late-stage negotiations, including two Fortune 500 companies. If even half of those close, we're looking at a record quarter."),
            ("Priya Patel", "I've been building the data room materials. Our key metrics: monthly recurring revenue is 1.8 million, growing 15 percent month over month. Gross margin is 78 percent. Customer acquisition cost payback period is 11 months. These are all in the top quartile for our stage."),
            ("Alex Kim", "Excellent work Priya. Sarah, what's the engineering story we want to tell?"),
            ("Sarah Chen", "I'd focus on three things. One, our AI technology moat. We've built proprietary models for meeting analysis that outperform generic solutions by 40 percent on accuracy. Two, our scalability. We processed 2 million meetings last month with 99.97 percent uptime. Three, our development velocity. We ship weekly with a team of 15 engineers, which is remarkably efficient for our feature set."),
            ("Alex Kim", "Perfect. I want us to target a 30 million dollar raise at a 150 million pre-money valuation. That gives us 18 months of runway at our planned burn rate and funds the international expansion."),
            ("Emily Foster", "Have we identified target investors?"),
            ("Alex Kim", "Yes. Sequoia and Lightspeed have both expressed interest through warm intros. We also have meetings set up with Accel, Index Ventures, and a16z. I want to run a competitive process to get the best terms."),
            ("Sarah Chen", "What's the timeline for the engineering due diligence? Investors always want to do deep technical reviews and I want my team prepared."),
            ("Alex Kim", "Good point. Let's budget two weeks for technical diligence. Sarah, prepare an architecture overview, security audit results, and the technology roadmap document. We should be ready to start the process in three weeks."),
            ("Priya Patel", "I'll have the complete data room ready in two weeks. Financial model, cohort analysis, unit economics breakdown, and the competitive landscape analysis."),
            ("Alex Kim", "Alright, let's execute. This is a company-defining moment. Everyone knows their deliverables. Let's reconvene next Monday for a dry run of the pitch deck."),
        ],
    },
    {
        "id": "demo-mtg-06",
        "title": "Customer Success: Quarterly Business Review",
        "date": "2026-02-10T11:00:00",
        "tags": ["customer-success", "qbr", "review"],
        "folder": "Sales",
        "segments": [
            ("Emily Foster", "Let's review our customer success metrics for Q4. Overall, customer health scores improved across the board. Our NPS went from 42 to 58, which puts us in the excellent category for B2B SaaS."),
            ("Olivia Taylor", "That's a significant jump. What's driving the improvement?"),
            ("Emily Foster", "Three main factors. First, the new onboarding flow that Marcus designed reduced time-to-value from 14 days to 3 days. Second, the proactive support alerts we implemented catch issues before customers notice them. Third, the monthly check-in cadence we established with enterprise accounts."),
            ("Olivia Taylor", "What about churn? Last quarter we had some concerning numbers."),
            ("Emily Foster", "Churn improved dramatically. We went from 4.2 percent monthly churn to 1.8 percent. The biggest improvement was in the SMB segment where we introduced the self-service knowledge base. Support ticket volume from SMB customers dropped 60 percent."),
            ("Olivia Taylor", "That's really encouraging. What are the top feature requests coming from customers?"),
            ("Emily Foster", "Number one by far is the Slack integration for meeting summaries. Customers want summaries automatically posted to relevant channels. Number two is mobile app access. Number three is custom reporting dashboards."),
            ("Olivia Taylor", "The Slack integration should be straightforward. Do we have it on the roadmap?"),
            ("Emily Foster", "Sarah's team has it scheduled for next sprint actually. It should be in production within three weeks. For mobile, that's a bigger lift. We're targeting Q2 for the mobile app launch."),
            ("Olivia Taylor", "Good. What about the expansion revenue targets?"),
            ("Emily Foster", "We hit 112 percent of our expansion target. Most upgrades came from teams growing from the Starter plan to Pro as they added more users. The team tier is also picking up. We now have 23 organizations on the Team plan, up from 8 last quarter."),
        ],
    },
    {
        "id": "demo-mtg-07",
        "title": "All-Hands: February Company Update",
        "date": "2026-02-14T16:00:00",
        "tags": ["all-hands", "company", "monthly-update"],
        "folder": "Company",
        "segments": [
            ("Alex Kim", "Happy Friday everyone. Welcome to our February all-hands. I have some exciting updates to share. First, the numbers. We crossed 2 million dollars in monthly recurring revenue this week. That's a huge milestone and it's thanks to every single person in this company."),
            ("Alex Kim", "Second, I'm thrilled to announce that we've been named to the Forbes Cloud 100 Rising Stars list. This is recognition of the incredible product we've built and the team behind it."),
            ("Alex Kim", "Third, and this is the big one. We're kicking off our Series B fundraise. I can't share all the details yet, but I can tell you that we've already had strong inbound interest from several top-tier firms. More details in the coming weeks."),
            ("Sarah Chen", "Quick engineering update. We shipped 23 features last month. Highlights include the new notification center, the analytics dashboard redesign, and the API performance improvements that David led. Uptime was 99.98 percent. I'm incredibly proud of this team."),
            ("Marcus Johnson", "On the design front, we completed the dashboard redesign sprint. The new design is in A/B testing now and early results are very promising. We're seeing a 40 percent improvement in task completion times."),
            ("Emily Foster", "Sales update. We signed 15 new customers in January, including our largest deal ever — a 200 seat deployment at Meridian Corporation. The pipeline for February is looking even stronger."),
            ("Priya Patel", "Data team update. We've built a new analytics pipeline that processes meeting data 10x faster. This enables real-time coaching insights that were previously only available after meetings ended. We're also launching a new benchmarking feature that lets teams compare their meeting efficiency against industry averages."),
            ("Alex Kim", "One more thing. We're growing the team. We have open positions for two ML engineers, a senior product manager, and a head of marketing. If you know great people, please refer them. Our referral bonus is now five thousand dollars."),
            ("Alex Kim", "Any questions from the team? Feel free to drop them in the chat or unmute."),
            ("Ryan Mitchell", "Alex, can you say more about the international expansion plans?"),
            ("Alex Kim", "Great question Ryan. We're planning to open a small office in London by Q3. We already have 28 percent of our revenue coming from outside North America, and we want to invest in that growth with local presence, local support hours, and of course EU data residency."),
        ],
    },
    {
        "id": "demo-mtg-08",
        "title": "Sprint Retrospective: Sprint 24",
        "date": "2026-02-18T16:00:00",
        "tags": ["retro", "sprint", "engineering"],
        "folder": "Engineering",
        "segments": [
            ("Sarah Chen", "Alright everyone, sprint 24 retro. Let's start with what went well. David?"),
            ("David Park", "The API migration went smoother than expected. We had zero production incidents during the cutover. I think the canary deployment strategy really paid off."),
            ("Lisa Wang", "Agreed. The automated rollback system James set up gave me a lot more confidence to deploy frequently. I shipped the notification center with 12 deployments over 3 days and every single one went smoothly."),
            ("James Rodriguez", "From the infrastructure side, the new monitoring stack is already paying dividends. We caught a memory leak in the transcription service before it impacted users. In the old system, that would have been a 2 AM pager alert."),
            ("Sarah Chen", "Great. Now what didn't go well?"),
            ("David Park", "Honestly, the code review process is becoming a bottleneck. We had PRs sitting for 48 hours without review. I think we need to establish an SLA for reviews."),
            ("Lisa Wang", "I agree. I also think we need better test coverage for the frontend. We had three visual regressions that only got caught in QA. If we had visual regression testing in CI, those would have been caught immediately."),
            ("James Rodriguez", "My concern is about documentation. We're moving so fast that our internal docs are getting stale. New engineers who join will have a hard time ramping up."),
            ("Sarah Chen", "All valid points. Let's set some action items. First, we'll establish a 4-hour code review SLA. If a PR hasn't been reviewed in 4 hours, it gets escalated. Second, Lisa, can you evaluate visual regression testing tools? Maybe Chromatic or Percy. Third, we'll dedicate every other Friday afternoon to documentation updates. Sound good?"),
            ("David Park", "I like the Friday documentation idea. Can we make it a team activity? Like a doc sprint?"),
            ("Sarah Chen", "Love it. Doc sprint every other Friday, starting this week. Last topic — anything we want to try differently next sprint?"),
            ("Lisa Wang", "I'd like to try pair programming more. Some of the cross-team features would benefit from having frontend and backend engineers working together in real-time instead of passing PRs back and forth."),
            ("Sarah Chen", "Let's experiment with that. David and Lisa, try pairing on the search feature next sprint and report back on how it goes. Alright, good retro everyone. Let's keep this momentum going."),
        ],
    },
    {
        "id": "demo-mtg-09",
        "title": "Marketing Strategy: Product-Led Growth",
        "date": "2026-02-24T13:00:00",
        "tags": ["marketing", "strategy", "plg", "growth"],
        "folder": "Marketing",
        "segments": [
            ("Anna Kowalski", "Thanks everyone for joining. Today we're going to map out our product-led growth strategy for the next two quarters. I've been analyzing our current funnel and I see some big opportunities."),
            ("Anna Kowalski", "Here are the current numbers. We get about 3000 website visitors per day. Of those, 8 percent start a free trial. Of the trial users, 12 percent convert to paid. That gives us roughly 29 new paying customers per day."),
            ("Chris Nakamura", "What's the industry benchmark for trial-to-paid conversion?"),
            ("Anna Kowalski", "Best-in-class B2B SaaS sees 15 to 25 percent trial-to-paid conversion. So we're below the benchmark at 12 percent. I think the main issue is time-to-value. Users start a trial but don't experience the core value quickly enough."),
            ("Emily Foster", "That tracks with what I'm hearing from churned trial users. The number one reason people don't convert is quote, I didn't have time to set it up properly."),
            ("Anna Kowalski", "Exactly. So here's my proposal. We need to get users to their first transcribed meeting within 10 minutes of signing up. Right now, the average time to first transcription is 3 days."),
            ("Chris Nakamura", "What if we offered a sample meeting? Like a pre-loaded demo that shows them what a fully transcribed meeting looks like with summaries, action items, the whole thing."),
            ("Anna Kowalski", "I love that idea. A guided demo experience that showcases the product's value immediately. We could even personalize it based on their industry or role during signup."),
            ("Emily Foster", "We should also look at the onboarding emails. Right now we send a generic welcome email. If we created a drip sequence that guides users through their first week with specific actions to take each day, I bet we'd see much higher activation."),
            ("Anna Kowalski", "Great point. Let me also share the content strategy. We need to invest heavily in SEO. The query meeting transcription software gets 12,000 searches per month and we're not even on page one. We need to create comparison pages, use case pages, and educational content around meeting productivity."),
            ("Chris Nakamura", "What about the pricing page? I feel like the free tier might be too generous. Five hours of transcription per month is a lot for a free user."),
            ("Anna Kowalski", "Actually, the data shows the opposite. Users on the free tier who hit the 5-hour limit convert at 3x the rate of users who don't. The free tier is working as intended — it lets people experience real value before they hit the paywall. I wouldn't change it."),
            ("Emily Foster", "Agreed. The free tier is our best acquisition channel."),
            ("Anna Kowalski", "Alright, here's the plan. Chris, you'll own the demo experience project. Emily, you'll redesign the onboarding email sequence. I'll tackle the SEO content strategy. Let's reconvene in two weeks with progress updates."),
        ],
    },
    {
        "id": "demo-mtg-10",
        "title": "1:1 with Sarah Chen",
        "date": "2026-02-28T10:30:00",
        "tags": ["1-on-1", "management", "career"],
        "folder": "1:1s",
        "segments": [
            ("Alex Kim", "Hey Sarah, thanks for sitting down. How are things going with the team?"),
            ("Sarah Chen", "Overall really good. Morale is high after the authentication migration success. The team is proud of what we shipped. I do have some concerns about burnout though. We've been running pretty hard since November."),
            ("Alex Kim", "I've noticed that too. What do you think we should do about it?"),
            ("Sarah Chen", "I'd like to institute a cooldown week after each major release. No new feature work, just bug fixes, tech debt, and personal development time. I think it would actually improve our long-term velocity."),
            ("Alex Kim", "I'm supportive of that. Let's plan the first cooldown week after the next release. What about your own career development? Where do you want to be in a year?"),
            ("Sarah Chen", "Honestly, I'm interested in growing into a VP of Engineering role. I love the technical leadership but I want to get more involved in company strategy and cross-functional work."),
            ("Alex Kim", "That's exactly where I see you heading. Let me think about how we can create opportunities for that. Maybe starting with having you present at the next board meeting? That would give you exposure to the strategic conversations."),
            ("Sarah Chen", "I'd love that. One more thing. David has been doing exceptional work. I want to make sure we recognize that and discuss promoting him to Senior Engineer. He's been operating at that level for months."),
            ("Alex Kim", "I agree. David's work on the API migration was outstanding. Let's plan the promotion for the next review cycle. Can you write up the justification and I'll approve it?"),
            ("Sarah Chen", "Will do. Thanks Alex. These conversations are really helpful."),
            ("Alex Kim", "Absolutely. My door is always open. Let's catch up again in two weeks."),
        ],
    },
    {
        "id": "demo-mtg-11",
        "title": "Security Audit Review",
        "date": "2026-03-03T11:00:00",
        "tags": ["security", "audit", "compliance"],
        "folder": "Engineering",
        "segments": [
            ("James Rodriguez", "Alright, we got the results back from the third-party security audit. Overall, we scored well. 94 out of 100 on the security posture assessment. No critical vulnerabilities found."),
            ("Sarah Chen", "That's a relief. What were the findings?"),
            ("James Rodriguez", "Three medium-severity items. First, some of our API endpoints don't have rate limiting configured. Second, we need to implement certificate pinning for mobile API calls. Third, our password policy allows passwords shorter than 12 characters. All fixable within a sprint."),
            ("David Park", "The rate limiting one is easy. I already have the middleware written, we just need to deploy it across the remaining services. I can have that done by Wednesday."),
            ("James Rodriguez", "Perfect. For the certificate pinning, that's more of a mobile concern. Since we're building the mobile app soon anyway, we should bake it in from the start rather than retrofitting."),
            ("Sarah Chen", "Agreed. What about the password policy?"),
            ("James Rodriguez", "Simple configuration change. We'll update the minimum length to 12 characters and add complexity requirements. I'd also like to add support for passkeys while we're at it. It's becoming the industry standard."),
            ("Sarah Chen", "Good idea on passkeys. Let's add that to the Q2 roadmap. For the audit remediation, let's commit to fixing all three items within two weeks. James, you'll own the tracking. Send daily updates to the security channel."),
            ("James Rodriguez", "On it. One more thing. The auditors were very impressed with our encryption implementation. They specifically called out our zero-knowledge architecture for meeting recordings as a best practice. That's worth mentioning to customers."),
            ("Sarah Chen", "Great point. I'll flag that for the marketing team. Having a third-party validation of our security architecture is a strong selling point, especially for enterprise deals."),
        ],
    },
    {
        "id": "demo-mtg-12",
        "title": "Product Analytics Deep Dive",
        "date": "2026-03-05T14:00:00",
        "tags": ["analytics", "product", "metrics", "data"],
        "folder": "Product",
        "segments": [
            ("Priya Patel", "I've prepared a deep dive into our product analytics for the last 90 days. Let me walk you through the key findings."),
            ("Priya Patel", "First, usage patterns. Our power users, which I define as users with more than 10 meetings per month, make up 18 percent of our user base but generate 67 percent of our revenue. These users are heavily concentrated in the Pro and Team tiers."),
            ("Alex Kim", "That's a classic power law distribution. What features do power users use most?"),
            ("Priya Patel", "The top three features for power users are: one, the search functionality at 89 percent weekly active usage. Two, the action items view at 84 percent. Three, the meeting coach at 72 percent. Interestingly, the coach feature has the highest correlation with user retention. Users who engage with coach are 3x less likely to churn."),
            ("Marcus Johnson", "That's really interesting about the coach feature. We've been treating it as a secondary feature but if it's driving retention, maybe we should make it more prominent in the product."),
            ("Priya Patel", "Exactly my recommendation. I'd suggest adding coach insights directly into the post-meeting summary view. Right now users have to navigate to a separate section to see their speaking analytics."),
            ("Alex Kim", "I agree. Marcus, can you design a coach summary card for the meeting detail page?"),
            ("Marcus Johnson", "Already thinking about it. A compact card showing talk ratio, pace, and clarity score right below the meeting summary would be natural."),
            ("Priya Patel", "Second finding. Our mobile web usage is growing fast. 38 percent of pageviews now come from mobile devices, up from 22 percent three months ago. But our mobile experience is terrible. The bounce rate on mobile is 72 percent versus 31 percent on desktop."),
            ("Alex Kim", "That's a big gap. This reinforces the urgency of the mobile app."),
            ("Priya Patel", "Third finding, and this one's positive. Our AI summary accuracy rating from users is 4.6 out of 5. Users particularly value the action item extraction. 91 percent of AI-generated action items are rated as accurate by users."),
            ("Alex Kim", "That's world-class accuracy. Let's make sure we highlight that in our marketing materials. Great analysis Priya. Let's schedule a follow-up to discuss the mobile strategy in detail."),
        ],
    },
    {
        "id": "demo-mtg-13",
        "title": "Hiring Committee: ML Engineer Candidates",
        "date": "2026-03-07T10:00:00",
        "tags": ["hiring", "ml-engineering", "candidates"],
        "folder": "Executive",
        "segments": [
            ("Alex Kim", "We have three final candidates for the ML engineer positions. Let's review each one. Sarah, you led the technical interviews."),
            ("Sarah Chen", "Right. Candidate one, Jordan Hayes. PhD from Stanford in NLP. Three years at Google working on language models. Very strong technically. Aced the coding assessment and the system design round. One concern — they've only worked at large companies and our pace might be a culture shock."),
            ("Alex Kim", "What's your gut feeling on culture fit?"),
            ("Sarah Chen", "They seemed genuinely excited about the startup environment. Asked great questions about our tech stack and autonomy level. I think they'd adapt well."),
            ("Alex Kim", "Candidate two?"),
            ("Sarah Chen", "Wei Zhang. Masters from CMU. Two years at a Series A startup building recommendation systems. Strong practical ML skills. Not as deep on the research side as Jordan but very pragmatic. They built and deployed a real-time inference system serving 50 million requests per day."),
            ("David Park", "I paired with Wei on the coding exercise. Their code quality was excellent. Clean, well-tested, and they thought about edge cases without prompting. I'd be very happy to work with them."),
            ("Sarah Chen", "Candidate three, Aisha Obi. Self-taught ML engineer with five years of experience. Currently at a fintech company. Strong production ML experience. They built a fraud detection system that reduced false positives by 60 percent. Very scrappy and resourceful."),
            ("Alex Kim", "All three sound strong. What's your recommendation?"),
            ("Sarah Chen", "I'd hire Jordan and Wei. Jordan brings the deep NLP expertise we need for the natural language search feature. Wei brings the production ML experience for scaling our inference systems. Aisha is strong but I think Jordan and Wei are better fits for our immediate needs."),
            ("Alex Kim", "I agree. Let's extend offers to Jordan and Wei today. Competitive packages. We don't want to lose them. Sarah, can you coordinate with HR on the offer details?"),
            ("Sarah Chen", "On it. I'll have the offers ready by end of day."),
        ],
    },
    {
        "id": "demo-mtg-14",
        "title": "Weekly Engineering Standup",
        "date": "2026-03-10T09:00:00",
        "tags": ["standup", "engineering", "weekly"],
        "folder": "Engineering",
        "segments": [
            ("Sarah Chen", "Monday standup. Let's go around. Lisa, kick us off."),
            ("Lisa Wang", "I finished the visual regression testing setup. We're using Chromatic now. It caught two visual bugs on the first run that we would have missed. The CI pipeline adds about 90 seconds to the build but I think it's worth it."),
            ("Sarah Chen", "Absolutely worth it. David?"),
            ("David Park", "Two things. The rate limiting middleware is deployed across all API services. We're currently set to 100 requests per minute per user with burst allowance up to 200. Second, I started on the natural language search prototype. Got the vector embeddings generating correctly, working on the query interface now."),
            ("James Rodriguez", "Infrastructure update. The load test last Thursday went well. We handled 10x our current peak traffic with p99 latency under 500 milliseconds. The auto-scaling kicked in correctly. One thing though, the transcription service needs more headroom. I'm going to increase the baseline replica count from 3 to 5."),
            ("Sarah Chen", "Good findings from the load test. Any blockers this week?"),
            ("Lisa Wang", "No blockers. I'm moving on to the accessibility audit. I've already run the automated scans and we have about 47 issues to fix. Most are minor things like missing ARIA labels and focus indicators."),
            ("David Park", "No blockers from me either. Jordan Hayes accepted our offer by the way. They start in two weeks."),
            ("Sarah Chen", "Fantastic news. Welcome to the team Jordan. Alright, quick reminder that Friday afternoon is doc sprint. Everyone come prepared with at least one document to update or create. Let's have a productive week."),
        ],
    },
    {
        "id": "demo-mtg-15",
        "title": "Board Meeting Prep",
        "date": "2026-03-11T15:00:00",
        "tags": ["board", "preparation", "executive"],
        "folder": "Executive",
        "segments": [
            ("Alex Kim", "The board meeting is next Tuesday. Let's run through the deck one more time and make sure we're telling a cohesive story. Priya, start with the financials."),
            ("Priya Patel", "Monthly recurring revenue is at 2.1 million, up from 1.4 million at the start of the quarter. That's 50 percent quarter-over-quarter growth. We're burning 800K per month, giving us a runway through September. The Series B will extend that to 24 months at our planned spend rate."),
            ("Alex Kim", "Good. Emily, the go-to-market narrative."),
            ("Emily Foster", "We added 62 new customers this quarter. Enterprise deals now make up 45 percent of new ARR, up from 30 percent last quarter. The Meridian Corp deal alone is worth 480K annually. Our sales cycle for enterprise has shortened from 90 days to 62 days thanks to the improved demo experience."),
            ("Alex Kim", "That's a compelling story. Sarah, the technology and product section."),
            ("Sarah Chen", "We'll highlight three things. The AI accuracy improvements, now at 99.2 percent for transcription. The architecture scalability, proven by our recent load tests. And the engineering velocity, 23 features shipped last month with 15 engineers. I'll also tease the natural language search feature as a competitive moat."),
            ("Alex Kim", "Perfect. One thing I want to add to the deck is our competitive positioning. We need to clearly articulate why we'll win against Otter, Fireflies, and Grain. Our differentiators are the meeting coach feature, the decision tracker, and the enterprise security architecture."),
            ("Priya Patel", "I have competitive analysis slides ready. We outperform on accuracy, features, and enterprise readiness. The only area where competitors have an advantage is mobile apps, and we're addressing that in Q2."),
            ("Alex Kim", "Good. Let's do one more dry run on Monday morning before the actual board meeting. Everyone should be prepared for tough questions about burn rate, competitive threats, and our path to profitability."),
        ],
    },
]

OUTPUT_DIR = Path("/home/primary/reverbic/scripts/demo-audio")
OUTPUT_DIR.mkdir(parents=True, exist_ok=True)

OPENAI_API_KEY = os.environ.get("OPENAI_API_KEY", "")


async def generate_segment_audio(speaker: str, text: str, output_path: str) -> None:
    """Generate audio for a single segment using edge-tts."""
    voice = VOICES.get(speaker, "en-US-GuyNeural")
    import edge_tts
    communicate = edge_tts.Communicate(text, voice)
    await communicate.save(output_path)


async def generate_meeting_audio(meeting: dict) -> str:
    """Generate full meeting audio by concatenating speaker segments."""
    meeting_id = meeting["id"]
    meeting_dir = OUTPUT_DIR / meeting_id
    meeting_dir.mkdir(exist_ok=True)

    segment_files = []
    for i, (speaker, text) in enumerate(meeting["segments"]):
        seg_path = str(meeting_dir / f"seg_{i:03d}.mp3")
        print(f"  Generating segment {i+1}/{len(meeting['segments'])}: {speaker[:15]}...")
        await generate_segment_audio(speaker, text, seg_path)
        segment_files.append(seg_path)

    # Add small silence between segments for natural feel
    silence_path = str(meeting_dir / "silence.mp3")
    subprocess.run([
        FFMPEG, "-y", "-f", "lavfi", "-i", "anullsrc=r=24000:cl=mono",
        "-t", "0.8", "-q:a", "9", silence_path
    ], capture_output=True)

    # Build concat list
    concat_list = str(meeting_dir / "concat.txt")
    with open(concat_list, "w") as f:
        for seg in segment_files:
            f.write(f"file '{seg}'\n")
            f.write(f"file '{silence_path}'\n")

    output_path = str(OUTPUT_DIR / f"{meeting_id}.mp3")
    subprocess.run([
        FFMPEG, "-y", "-f", "concat", "-safe", "0", "-i", concat_list,
        "-c:a", "libmp3lame", "-q:a", "4", output_path
    ], capture_output=True)

    print(f"  -> {output_path}")
    return output_path


def transcribe_with_whisper(audio_path: str) -> dict:
    """Transcribe audio using OpenAI Whisper API."""
    import urllib.request
    import urllib.error

    api_key = OPENAI_API_KEY
    if not api_key:
        # Try reading from .env.local
        env_path = Path("/home/primary/reverbic/.env.local")
        if env_path.exists():
            for line in env_path.read_text().splitlines():
                if line.startswith("OPENAI_API_KEY="):
                    api_key = line.split("=", 1)[1].strip()
                    break

    if not api_key:
        print("WARNING: No OpenAI API key found. Skipping transcription.")
        return {}

    # Use multipart form upload
    boundary = f"----FormBoundary{int(time.time()*1000)}"
    file_data = open(audio_path, "rb").read()
    filename = os.path.basename(audio_path)

    body = b""
    # File field
    body += f"--{boundary}\r\n".encode()
    body += f'Content-Disposition: form-data; name="file"; filename="{filename}"\r\n'.encode()
    body += b"Content-Type: audio/mpeg\r\n\r\n"
    body += file_data
    body += b"\r\n"
    # Model field
    body += f"--{boundary}\r\n".encode()
    body += b'Content-Disposition: form-data; name="model"\r\n\r\n'
    body += b"whisper-1\r\n"
    # Response format
    body += f"--{boundary}\r\n".encode()
    body += b'Content-Disposition: form-data; name="response_format"\r\n\r\n'
    body += b"verbose_json\r\n"
    # Timestamp granularities
    body += f"--{boundary}\r\n".encode()
    body += b'Content-Disposition: form-data; name="timestamp_granularities[]"\r\n\r\n'
    body += b"segment\r\n"
    body += f"--{boundary}--\r\n".encode()

    req = urllib.request.Request(
        "https://api.openai.com/v1/audio/transcriptions",
        data=body,
        headers={
            "Authorization": f"Bearer {api_key}",
            "Content-Type": f"multipart/form-data; boundary={boundary}",
        },
        method="POST",
    )

    try:
        with urllib.request.urlopen(req, timeout=300) as resp:
            return json.loads(resp.read().decode())
    except urllib.error.HTTPError as e:
        print(f"  Whisper API error: {e.code} {e.read().decode()[:200]}")
        return {}


def build_meeting_json(meeting: dict, whisper_result: dict, audio_duration: float) -> dict:
    """Build a meeting-store compatible JSON from meeting script + Whisper transcription."""
    segments_data = meeting["segments"]

    # Build transcript segments from Whisper result if available, otherwise from script
    transcript_segments = []
    if whisper_result and "segments" in whisper_result:
        # Use Whisper timestamps with our known speaker assignments
        whisper_segs = whisper_result["segments"]
        # Map Whisper segments back to our script segments by position
        seg_idx = 0
        for ws in whisper_segs:
            # Find which script segment this Whisper segment belongs to
            if seg_idx < len(segments_data):
                speaker = segments_data[seg_idx][0]
            else:
                speaker = "Unknown"

            transcript_segments.append({
                "start": ws.get("start", 0),
                "end": ws.get("end", 0),
                "text": ws.get("text", "").strip(),
            })

            # Advance to next script segment if this whisper segment
            # seems to be the end of the current speaker's turn
            text_so_far = " ".join(
                t["text"] for t in transcript_segments
                if t.get("_seg_idx", seg_idx) == seg_idx
            )
            if len(ws.get("text", "")) > 20:
                seg_idx = min(seg_idx + 1, len(segments_data) - 1)
    else:
        # Fallback: use script segments with estimated timestamps
        time_per_word = audio_duration / max(sum(len(s[1].split()) for s in segments_data), 1) if audio_duration > 0 else 0.4
        current_time = 0
        for speaker, text in segments_data:
            word_count = len(text.split())
            duration = word_count * time_per_word
            transcript_segments.append({
                "start": round(current_time, 2),
                "end": round(current_time + duration, 2),
                "text": text,
            })
            current_time += duration + 0.8  # 0.8s pause between segments

    # Build full transcript text
    full_text = " ".join(seg["text"] for seg in transcript_segments)

    # Build action items from the meeting content
    action_items = []
    decisions = []

    # Build key points from the actual content
    key_points = []
    for _, text in segments_data:
        if any(kw in text.lower() for kw in ["i'll", "let's", "we should", "we need to", "approved", "agreed", "decided"]):
            key_points.append(text[:120] + ("..." if len(text) > 120 else ""))
    key_points = key_points[:5]

    return {
        "id": meeting["id"],
        "title": meeting["title"],
        "createdAt": meeting["date"],
        "status": "completed",
        "duration": audio_duration or sum(len(s[1].split()) * 0.4 + 0.8 for s in segments_data),
        "tags": meeting.get("tags", []),
        "folder": meeting.get("folder", ""),
        "transcript_text": full_text,
        "transcript_language": "en",
        "transcript_duration": audio_duration,
        "transcript_segments": transcript_segments,
        "summary": generate_summary(segments_data),
        "key_points": key_points,
        "action_items": extract_action_items(meeting),
        "decisions": extract_decisions(meeting),
        "speakers": list(set(s[0] for s in segments_data)),
    }


def generate_summary(segments: list) -> str:
    """Generate a brief summary from meeting segments."""
    # Take key sentences that mention decisions, actions, or results
    important = []
    for speaker, text in segments:
        if any(kw in text.lower() for kw in ["decided", "approved", "agreed", "result", "shipped", "completed", "launched", "million", "percent"]):
            important.append(text)
    # Take first 3 important sentences, truncated
    summary_parts = important[:3]
    if not summary_parts:
        summary_parts = [segments[0][1], segments[-1][1]]
    return " ".join(summary_parts)[:500]


def extract_action_items(meeting: dict) -> list:
    """Extract action items from meeting dialogue."""
    items = []
    item_id = 0
    for speaker, text in meeting["segments"]:
        lower = text.lower()
        if any(kw in lower for kw in ["can you", "i'll", "let's", "you'll own", "please", "by end of", "by friday", "by tomorrow", "schedule", "prepare", "draft", "send"]):
            # Find the assignee
            assignee = None
            for name in VOICES.keys():
                first = name.split()[0]
                if first.lower() in lower:
                    assignee = name
                    break
            if not assignee and "i'll" in lower or "i can" in lower:
                assignee = speaker

            if assignee:
                item_id += 1
                status = random.choice(["completed", "completed", "in_progress", "pending"])
                items.append({
                    "text": text[:150] + ("..." if len(text) > 150 else ""),
                    "assignee": assignee,
                    "priority": random.choice(["high", "medium", "medium", "low"]),
                    "completed": status == "completed",
                })

    return items[:4]  # Max 4 per meeting


def extract_decisions(meeting: dict) -> list:
    """Extract decisions from meeting dialogue."""
    decs = []
    for speaker, text in meeting["segments"]:
        lower = text.lower()
        if any(kw in lower for kw in ["approved", "decided", "agreed", "let's go with", "we'll do", "let's commit", "i'll approve"]):
            decs.append({
                "text": text[:150] + ("..." if len(text) > 150 else ""),
                "madeBy": speaker,
            })
    return decs[:3]  # Max 3 per meeting


def get_audio_duration(path: str) -> float:
    """Get duration of an audio file using ffprobe."""
    ffprobe = FFMPEG.replace("ffmpeg", "ffprobe")
    result = subprocess.run(
        [ffprobe, "-v", "quiet", "-show_entries", "format=duration", "-of", "csv=p=0", path],
        capture_output=True, text=True
    )
    try:
        return float(result.stdout.strip())
    except (ValueError, AttributeError):
        return 0


async def main():
    print(f"=== Generating {len(MEETINGS)} demo meetings ===\n")

    all_meetings = []

    for meeting in MEETINGS:
        print(f"\n--- {meeting['title']} ---")

        # Step 1: Generate audio
        print("  Step 1: Generating audio with edge-tts...")
        audio_path = await generate_meeting_audio(meeting)

        # Get duration
        duration = get_audio_duration(audio_path)
        print(f"  Audio duration: {duration:.1f}s")

        # Step 2: Transcribe with Whisper
        print("  Step 2: Transcribing with Whisper API...")
        whisper_result = transcribe_with_whisper(audio_path)
        if whisper_result:
            print(f"  Transcription: {len(whisper_result.get('text', ''))} chars")
            duration = whisper_result.get("duration", duration)
        else:
            print("  Using script-based transcription (Whisper unavailable)")

        # Step 3: Build meeting JSON
        meeting_json = build_meeting_json(meeting, whisper_result, duration)
        all_meetings.append(meeting_json)

        # Save individual meeting JSON
        json_path = OUTPUT_DIR / f"{meeting['id']}.json"
        with open(json_path, "w") as f:
            json.dump(meeting_json, f, indent=2)
        print(f"  Saved: {json_path}")

    # Save combined output
    combined_path = OUTPUT_DIR / "all-demo-meetings.json"
    with open(combined_path, "w") as f:
        json.dump(all_meetings, f, indent=2)
    print(f"\n=== Done! Combined output: {combined_path} ===")
    print(f"Total meetings: {len(all_meetings)}")
    total_duration = sum(m.get("duration", 0) or 0 for m in all_meetings)
    print(f"Total audio duration: {total_duration/60:.1f} minutes")


if __name__ == "__main__":
    asyncio.run(main())
