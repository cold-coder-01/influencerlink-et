import "server-only";

const YOUTUBE_CHANNELS_URL = "https://www.googleapis.com/youtube/v3/channels";

type YouTubeChannelResponse = {
  items?: Array<{
    id: string;
    snippet?: {
      title?: string;
      customUrl?: string;
    };
    statistics?: {
      hiddenSubscriberCount?: boolean;
      subscriberCount?: string;
      videoCount?: string;
      viewCount?: string;
    };
  }>;
  error?: {
    message?: string;
  };
};

export type YouTubePublicChannelMetrics = {
  channelId: string;
  title: string;
  handle?: string | null;
  profileUrl: string;
  subscriberCount?: number | null;
  videoCount?: number | null;
  avgViews?: number | null;
};

function getYouTubeApiKey() {
  const apiKey = process.env.YOUTUBE_API_KEY;

  if (!apiKey || apiKey === "change_me") {
    throw new Error("YOUTUBE_API_KEY is not configured.");
  }

  return apiKey;
}

function parseInteger(value: string | undefined) {
  if (!value) return null;
  const parsed = Number(value);

  return Number.isFinite(parsed) ? parsed : null;
}

function normalizeHandle(value: string) {
  const trimmed = value.trim();
  if (!trimmed) return "";
  const withoutUrl = trimmed
    .replace(/^https?:\/\/(www\.)?youtube\.com\//i, "")
    .replace(/^https?:\/\/youtu\.be\//i, "");
  const handleMatch = withoutUrl.match(/^@([^/?#]+)/);

  if (handleMatch?.[1]) return `@${handleMatch[1]}`;
  if (trimmed.startsWith("@")) return trimmed.split(/[/?#]/)[0] ?? trimmed;

  return "";
}

export function getYouTubeChannelIdentifier(input: {
  platformAccountId?: string | null;
  handle?: string | null;
  profileUrl?: string | null;
}) {
  const explicitId = input.platformAccountId?.trim();
  if (explicitId) return { type: "id" as const, value: explicitId };

  const profileUrl = input.profileUrl?.trim() ?? "";
  if (profileUrl) {
    try {
      const url = new URL(profileUrl);
      const parts = url.pathname.split("/").filter(Boolean);
      const channelIndex = parts.findIndex((part) => part.toLowerCase() === "channel");
      if (channelIndex >= 0 && parts[channelIndex + 1]) {
        return { type: "id" as const, value: parts[channelIndex + 1] };
      }
      const handle = normalizeHandle(profileUrl);
      if (handle) return { type: "handle" as const, value: handle };
    } catch {
      const handle = normalizeHandle(profileUrl);
      if (handle) return { type: "handle" as const, value: handle };
    }
  }

  const handle = normalizeHandle(input.handle ?? "");
  if (handle) return { type: "handle" as const, value: handle };

  return null;
}

function buildMetrics(payload: YouTubeChannelResponse): YouTubePublicChannelMetrics {
  const channel = payload.items?.[0];

  if (!channel) {
    throw new Error("No YouTube channel was found for this account identifier.");
  }

  const videoCount = parseInteger(channel.statistics?.videoCount);
  const viewCount = parseInteger(channel.statistics?.viewCount);
  const avgViews =
    videoCount && videoCount > 0 && viewCount !== null ? Math.round(viewCount / videoCount) : null;
  const handle = channel.snippet?.customUrl ?? null;

  return {
    avgViews,
    channelId: channel.id,
    handle,
    profileUrl: `https://www.youtube.com/channel/${channel.id}`,
    subscriberCount: channel.statistics?.hiddenSubscriberCount
      ? null
      : parseInteger(channel.statistics?.subscriberCount),
    title: channel.snippet?.title || handle || channel.id,
    videoCount,
  };
}

export async function fetchYouTubePublicChannelMetrics(identifier: {
  type: "id" | "handle";
  value: string;
}) {
  const url = new URL(YOUTUBE_CHANNELS_URL);
  url.searchParams.set("part", "snippet,statistics");
  url.searchParams.set("maxResults", "1");
  url.searchParams.set("key", getYouTubeApiKey());

  if (identifier.type === "id") {
    url.searchParams.set("id", identifier.value);
  } else {
    url.searchParams.set("forHandle", identifier.value);
  }

  const response = await fetch(url, {
    headers: { Accept: "application/json" },
    cache: "no-store",
  });
  const payload = (await response.json()) as YouTubeChannelResponse;

  if (!response.ok) {
    throw new Error(payload.error?.message || "Unable to fetch YouTube channel metrics.");
  }

  return buildMetrics(payload);
}
