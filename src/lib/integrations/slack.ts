/**
 * Slack OAuth + API helpers for Reverbic integration.
 *
 * Env vars required:
 *   SLACK_CLIENT_ID, SLACK_CLIENT_SECRET, SLACK_REDIRECT_URI
 */

// ─── OAuth ───────────────────────────────────────────────────────────

const SLACK_SCOPES = ["chat:write", "channels:read", "groups:read"];

export interface SlackTokenResponse {
  ok: boolean;
  access_token: string;
  token_type: string;
  scope: string;
  bot_user_id: string;
  app_id: string;
  team: { id: string; name: string };
  authed_user: { id: string };
  error?: string;
}

export interface SlackChannel {
  id: string;
  name: string;
  is_private: boolean;
  num_members: number;
}

/**
 * Build the Slack OAuth 2.0 authorization URL.
 * `state` should encode the org_id so we can match on callback.
 */
export function buildSlackOAuthURL(state: string): string {
  const clientId = process.env.SLACK_CLIENT_ID;
  const redirectUri = process.env.SLACK_REDIRECT_URI;

  if (!clientId || !redirectUri) {
    throw new Error("Missing SLACK_CLIENT_ID or SLACK_REDIRECT_URI env vars");
  }

  const params = new URLSearchParams({
    client_id: clientId,
    scope: SLACK_SCOPES.join(","),
    redirect_uri: redirectUri,
    state,
  });

  return `https://slack.com/oauth/v2/authorize?${params.toString()}`;
}

/**
 * Exchange an OAuth code for a bot access token via Slack's oauth.v2.access endpoint.
 */
export async function exchangeSlackCode(code: string): Promise<SlackTokenResponse> {
  const clientId = process.env.SLACK_CLIENT_ID;
  const clientSecret = process.env.SLACK_CLIENT_SECRET;
  const redirectUri = process.env.SLACK_REDIRECT_URI;

  if (!clientId || !clientSecret || !redirectUri) {
    throw new Error("Missing Slack OAuth env vars");
  }

  const res = await fetch("https://slack.com/api/oauth.v2.access", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      client_id: clientId,
      client_secret: clientSecret,
      code,
      redirect_uri: redirectUri,
    }),
  });

  const data = await res.json();

  if (!data.ok) {
    throw new Error(`Slack OAuth error: ${data.error ?? "unknown"}`);
  }

  return data as SlackTokenResponse;
}

// ─── API helpers ─────────────────────────────────────────────────────

/**
 * List channels the bot has been added to (public + private it can see).
 */
export async function listSlackChannels(botToken: string): Promise<SlackChannel[]> {
  const channels: SlackChannel[] = [];
  let cursor: string | undefined;

  do {
    const params = new URLSearchParams({
      types: "public_channel,private_channel",
      exclude_archived: "true",
      limit: "200",
    });
    if (cursor) params.set("cursor", cursor);

    const res = await fetch(`https://slack.com/api/conversations.list?${params.toString()}`, {
      headers: { Authorization: `Bearer ${botToken}` },
    });

    const data = await res.json();

    if (!data.ok) {
      throw new Error(`Slack API error: ${data.error ?? "unknown"}`);
    }

    for (const ch of data.channels ?? []) {
      channels.push({
        id: ch.id,
        name: ch.name,
        is_private: ch.is_private ?? false,
        num_members: ch.num_members ?? 0,
      });
    }

    cursor = data.response_metadata?.next_cursor || undefined;
  } while (cursor);

  return channels;
}

// ─── Block Kit message formatting ────────────────────────────────────

interface MeetingSummaryPayload {
  title: string;
  summary: string | null;
  keyPoints: string[];
  actionItems: { text: string; assignee: string | null; priority: string }[];
  meetingUrl: string;
}

/**
 * Post a rich Block Kit meeting summary message to a Slack channel.
 */
export async function postMeetingSummary(
  botToken: string,
  channelId: string,
  payload: MeetingSummaryPayload
): Promise<{ ok: boolean; ts?: string; error?: string }> {
  const blocks = buildMeetingBlocks(payload);

  const res = await fetch("https://slack.com/api/chat.postMessage", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${botToken}`,
      "Content-Type": "application/json; charset=utf-8",
    },
    body: JSON.stringify({
      channel: channelId,
      text: `Meeting summary: ${payload.title}`, // fallback for notifications
      blocks,
      unfurl_links: false,
    }),
  });

  const data = await res.json();
  return { ok: data.ok, ts: data.ts, error: data.error };
}

function buildMeetingBlocks(payload: MeetingSummaryPayload) {
  const { title, summary, keyPoints, actionItems, meetingUrl } = payload;

  // Truncate summary to ~500 chars for Slack readability
  const truncatedSummary = summary
    ? summary.length > 500
      ? summary.slice(0, 497) + "..."
      : summary
    : "_No summary available._";

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const blocks: any[] = [
    // Header
    {
      type: "header",
      text: {
        type: "plain_text",
        text: `\uD83C\uDFA4 ${title}`,
        emoji: true,
      },
    },
    // Summary section
    {
      type: "section",
      text: {
        type: "mrkdwn",
        text: `*Summary*\n${truncatedSummary}`,
      },
    },
  ];

  // Key points
  if (keyPoints.length > 0) {
    blocks.push({ type: "divider" });
    const pointsList = keyPoints
      .slice(0, 10) // cap at 10 for readability
      .map((pt) => `\u2022 ${pt}`)
      .join("\n");
    blocks.push({
      type: "section",
      text: {
        type: "mrkdwn",
        text: `*Key Points*\n${pointsList}`,
      },
    });
  }

  // Action items
  if (actionItems.length > 0) {
    blocks.push({ type: "divider" });

    const priorityIcon: Record<string, string> = {
      high: "\uD83D\uDD34",
      medium: "\uD83D\uDFE1",
      low: "\uD83D\uDFE2",
    };

    const itemsList = actionItems
      .slice(0, 10)
      .map((ai) => {
        const icon = priorityIcon[ai.priority] ?? "\u2B1C";
        const assignee = ai.assignee ? ` \u2014 _${ai.assignee}_` : "";
        return `${icon} ${ai.text}${assignee}`;
      })
      .join("\n");

    blocks.push({
      type: "section",
      text: {
        type: "mrkdwn",
        text: `*Action Items*\n${itemsList}`,
      },
    });
  }

  // CTA button
  blocks.push({ type: "divider" });
  blocks.push({
    type: "actions",
    elements: [
      {
        type: "button",
        text: {
          type: "plain_text",
          text: "View in Reverbic",
          emoji: true,
        },
        url: meetingUrl,
        style: "primary",
      },
    ],
  });

  // Footer context
  blocks.push({
    type: "context",
    elements: [
      {
        type: "mrkdwn",
        text: "Sent from <https://reverbic.ai|Reverbic> \u2014 Meeting Intelligence",
      },
    ],
  });

  return blocks;
}
