/**
 * Notion integration helpers — OAuth flow + API operations.
 * Uses raw fetch against the Notion API (no SDK dependency).
 */

const NOTION_API_BASE = "https://api.notion.com/v1";
const NOTION_VERSION = "2022-06-28";

// ─── OAuth helpers ──────────────────────────────────────────────────────────

export function getNotionOAuthURL(state: string): string {
  const clientId = process.env.NOTION_CLIENT_ID;
  const redirectUri = process.env.NOTION_REDIRECT_URI;

  if (!clientId || !redirectUri) {
    throw new Error("Missing NOTION_CLIENT_ID or NOTION_REDIRECT_URI env vars");
  }

  const params = new URLSearchParams({
    client_id: clientId,
    response_type: "code",
    owner: "user",
    redirect_uri: redirectUri,
    state,
  });

  return `https://api.notion.com/v1/oauth/authorize?${params.toString()}`;
}

export interface NotionTokenResponse {
  access_token: string;
  token_type: string;
  bot_id: string;
  workspace_id: string;
  workspace_name: string | null;
  workspace_icon: string | null;
  duplicated_template_id: string | null;
  owner: Record<string, unknown>;
}

export async function exchangeNotionCode(code: string): Promise<NotionTokenResponse> {
  const clientId = process.env.NOTION_CLIENT_ID;
  const clientSecret = process.env.NOTION_CLIENT_SECRET;
  const redirectUri = process.env.NOTION_REDIRECT_URI;

  if (!clientId || !clientSecret || !redirectUri) {
    throw new Error("Missing Notion OAuth env vars");
  }

  // Notion uses HTTP Basic Auth for token exchange
  const basicAuth = Buffer.from(`${clientId}:${clientSecret}`).toString("base64");

  const res = await fetch(`${NOTION_API_BASE}/oauth/token`, {
    method: "POST",
    headers: {
      Authorization: `Basic ${basicAuth}`,
      "Content-Type": "application/json",
      "Notion-Version": NOTION_VERSION,
    },
    body: JSON.stringify({
      grant_type: "authorization_code",
      code,
      redirect_uri: redirectUri,
    }),
  });

  if (!res.ok) {
    const body = await res.text();
    throw new Error(`Notion token exchange failed (${res.status}): ${body}`);
  }

  return res.json();
}

// ─── API helpers ────────────────────────────────────────────────────────────

function notionHeaders(accessToken: string) {
  return {
    Authorization: `Bearer ${accessToken}`,
    "Content-Type": "application/json",
    "Notion-Version": NOTION_VERSION,
  };
}

export interface NotionSearchResult {
  id: string;
  title: string;
  type: "page" | "database";
  icon: string | null;
  url: string;
}

/**
 * Search for pages and databases the integration has access to.
 */
export async function searchNotionPages(
  accessToken: string,
  query?: string
): Promise<NotionSearchResult[]> {
  const body: Record<string, unknown> = {
    page_size: 50,
    sort: { direction: "descending", timestamp: "last_edited_time" },
  };

  if (query) {
    body.query = query;
  }

  // Only search for pages (not databases) as parents
  body.filter = { property: "object", value: "page" };

  const res = await fetch(`${NOTION_API_BASE}/search`, {
    method: "POST",
    headers: notionHeaders(accessToken),
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Notion search failed (${res.status}): ${text}`);
  }

  const data = await res.json();

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return (data.results ?? []).map((item: any) => {
    const titleProp =
      item.properties?.title?.title?.[0]?.plain_text ??
      item.properties?.Name?.title?.[0]?.plain_text ??
      extractPageTitle(item) ??
      "Untitled";

    return {
      id: item.id,
      title: titleProp,
      type: item.object as "page" | "database",
      icon: item.icon?.emoji ?? item.icon?.external?.url ?? null,
      url: item.url,
    };
  });
}

/** Try to extract a title from any title-type property on the page. */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function extractPageTitle(item: any): string | null {
  if (!item.properties) return null;
  for (const prop of Object.values(item.properties) as any[]) {
    if (prop?.type === "title" && prop.title?.[0]?.plain_text) {
      return prop.title[0].plain_text;
    }
  }
  return null;
}

// ─── Page creation ──────────────────────────────────────────────────────────

export interface MeetingExportData {
  id: string;
  title: string;
  summary: string | null;
  keyPoints: string[];
  actionItems: { text: string; assignee: string | null; priority: string; completed?: boolean }[];
  decisions: { text: string; madeBy: string | null }[];
  duration: number | null;
  createdAt: string;
  participants: string[];
}

/**
 * Create a beautifully formatted Notion page with meeting data.
 * Returns the URL of the created page.
 */
export async function createMeetingNotionPage(
  accessToken: string,
  meeting: MeetingExportData,
  parentPageId?: string
): Promise<{ url: string; pageId: string }> {
  const meetingDate = new Date(meeting.createdAt).toLocaleDateString("en-US", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  const durationText = meeting.duration
    ? formatDuration(meeting.duration)
    : "Unknown";

  const participantText =
    meeting.participants.length > 0
      ? meeting.participants.join(", ")
      : "Not specified";

  // Build the page content blocks
  const children: NotionBlock[] = [
    // Callout with meeting metadata
    calloutBlock(
      `📅 ${meetingDate}  •  ⏱ ${durationText}  •  👥 ${participantText}`,
      "📋"
    ),
    // Spacer
    dividerBlock(),
  ];

  // Summary section
  if (meeting.summary) {
    children.push(headingBlock("Summary", 2));
    // Split summary into paragraphs
    const paragraphs = meeting.summary.split("\n").filter((p) => p.trim());
    for (const p of paragraphs) {
      children.push(paragraphBlock(p));
    }
    children.push(dividerBlock());
  }

  // Key Points section
  if (meeting.keyPoints.length > 0) {
    children.push(headingBlock("Key Points", 2));
    for (const point of meeting.keyPoints) {
      children.push(bulletBlock(point));
    }
    children.push(dividerBlock());
  }

  // Action Items section
  if (meeting.actionItems.length > 0) {
    children.push(headingBlock("Action Items", 2));
    for (const item of meeting.actionItems) {
      const label = item.assignee
        ? `${item.text} — @${item.assignee}`
        : item.text;
      children.push(todoBlock(label, item.completed ?? false));
    }
    children.push(dividerBlock());
  }

  // Decisions section
  if (meeting.decisions.length > 0) {
    children.push(headingBlock("Decisions", 2));
    for (const d of meeting.decisions) {
      const label = d.madeBy ? `${d.text} (decided by ${d.madeBy})` : d.text;
      children.push(bulletBlock(label));
    }
    children.push(dividerBlock());
  }

  // Link back to Reverbic
  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "https://reverbic.ai";
  children.push(
    paragraphBlock(""),
    paragraphBlockWithLink(
      "View full meeting in Reverbic →",
      `${appUrl}/meetings/${meeting.id}`
    )
  );

  // Build the parent reference
  const parent: Record<string, string> = parentPageId
    ? { type: "page_id", page_id: parentPageId }
    : { type: "page_id", page_id: parentPageId ?? "" };

  // If no parent page provided, create in the workspace (Notion defaults to workspace root)
  const pagePayload: Record<string, unknown> = {
    parent: parentPageId
      ? { type: "page_id", page_id: parentPageId }
      : { type: "workspace", workspace: true },
    icon: { type: "emoji", emoji: "🎙️" },
    properties: {
      title: {
        title: [
          {
            text: {
              content: `${meeting.title} — ${meetingDate}`,
            },
          },
        ],
      },
    },
    children,
  };

  const res = await fetch(`${NOTION_API_BASE}/pages`, {
    method: "POST",
    headers: notionHeaders(accessToken),
    body: JSON.stringify(pagePayload),
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Notion page creation failed (${res.status}): ${text}`);
  }

  const page = await res.json();
  return { url: page.url, pageId: page.id };
}

// ─── Block builder helpers ──────────────────────────────────────────────────

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type NotionBlock = Record<string, any>;

function richText(content: string) {
  // Notion limits rich text content to 2000 chars per text object
  const truncated = content.length > 2000 ? content.slice(0, 1997) + "..." : content;
  return [{ type: "text", text: { content: truncated } }];
}

function headingBlock(text: string, level: 2 | 3): NotionBlock {
  const key = `heading_${level}`;
  return {
    object: "block",
    type: key,
    [key]: { rich_text: richText(text) },
  };
}

function paragraphBlock(text: string): NotionBlock {
  return {
    object: "block",
    type: "paragraph",
    paragraph: { rich_text: richText(text) },
  };
}

function paragraphBlockWithLink(text: string, url: string): NotionBlock {
  return {
    object: "block",
    type: "paragraph",
    paragraph: {
      rich_text: [
        {
          type: "text",
          text: { content: text, link: { url } },
          annotations: { bold: true, color: "blue" },
        },
      ],
    },
  };
}

function bulletBlock(text: string): NotionBlock {
  return {
    object: "block",
    type: "bulleted_list_item",
    bulleted_list_item: { rich_text: richText(text) },
  };
}

function todoBlock(text: string, checked: boolean): NotionBlock {
  return {
    object: "block",
    type: "to_do",
    to_do: { rich_text: richText(text), checked },
  };
}

function calloutBlock(text: string, emoji: string): NotionBlock {
  return {
    object: "block",
    type: "callout",
    callout: {
      rich_text: richText(text),
      icon: { type: "emoji", emoji },
    },
  };
}

function dividerBlock(): NotionBlock {
  return { object: "block", type: "divider", divider: {} };
}

// ─── Utilities ──────────────────────────────────────────────────────────────

function formatDuration(seconds: number): string {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = Math.floor(seconds % 60);
  if (h > 0) return `${h}h ${m}m`;
  if (m > 0) return `${m}m ${s}s`;
  return `${s}s`;
}
