import "server-only";

import type { VerifiedSocialMetricsInput } from "@/lib/social-accounts";

const GOOGLE_TOKEN_URL = "https://oauth2.googleapis.com/token";
const YOUTUBE_CHANNELS_URL = "https://www.googleapis.com/youtube/v3/channels";

type GoogleTokenResponse = {
  access_token?: string;
  error?: string;
  error_description?: string;
};

type YouTubeChannelResponse = {
  items?: Array<{
    id: string;
    snippet?: {
      title?: string;
      customUrl?: string;
      thumbnails?: Record<string, { url?: string }>;
    };
    statistics?: {
      subscriberCount?: string;
      hiddenSubscriberCount?: boolean;
      viewCount?: string;
      videoCount?: string;
    };
  }>;
};

function getGoogleClientId() {
  const clientId = process.env.GOOGLE_CLIENT_ID;

  if (!clientId) throw new Error("GOOGLE_CLIENT_ID is not configured.");

  return clientId;
}

function getGoogleClientSecret() {
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET;

  if (!clientSecret) throw new Error("GOOGLE_CLIENT_SECRET is not configured.");

  return clientSecret;
}

export function getYouTubeRedirectUri(request: Request) {
  const publicUrl = process.env.NEXT_PUBLIC_APP_URL ?? process.env.APP_PUBLIC_URL;

  if (publicUrl) {
    return new URL("/api/social/youtube/callback", publicUrl).toString();
  }

  const forwardedHost = request.headers.get("x-forwarded-host");
  const forwardedProto = request.headers.get("x-forwarded-proto") ?? "https";

  if (forwardedHost) {
    return `${forwardedProto}://${forwardedHost}/api/social/youtube/callback`;
  }

  return new URL("/api/social/youtube/callback", request.url).toString();
}

function parseInteger(value: string | undefined) {
  const parsed = Number(value);

  return Number.isFinite(parsed) ? parsed : 0;
}

export async function exchangeYouTubeCode(request: Request, code: string) {
  const response = await fetch(GOOGLE_TOKEN_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: new URLSearchParams({
      client_id: getGoogleClientId(),
      client_secret: getGoogleClientSecret(),
      code,
      grant_type: "authorization_code",
      redirect_uri: getYouTubeRedirectUri(request),
    }),
    cache: "no-store",
  });
  const payload = (await response.json()) as GoogleTokenResponse;

  if (!response.ok || !payload.access_token) {
    throw new Error(
      payload.error_description ||
        payload.error ||
        "YouTube token exchange failed.",
    );
  }

  return payload.access_token;
}

export async function fetchVerifiedYouTubeMetrics(
  accessToken: string,
  profileId: number,
): Promise<VerifiedSocialMetricsInput> {
  const url = new URL(YOUTUBE_CHANNELS_URL);
  url.searchParams.set("part", "snippet,statistics");
  url.searchParams.set("mine", "true");
  url.searchParams.set("maxResults", "1");

  const response = await fetch(url, {
    headers: {
      Authorization: `Bearer ${accessToken}`,
      Accept: "application/json",
    },
    cache: "no-store",
  });

  if (!response.ok) {
    throw new Error("Unable to fetch YouTube channel metrics.");
  }

  const payload = (await response.json()) as YouTubeChannelResponse;
  const channel = payload.items?.[0];

  if (!channel) {
    throw new Error("No YouTube channel was found for this Google account.");
  }

  const videoCount = parseInteger(channel.statistics?.videoCount);
  const totalViewCount = parseInteger(channel.statistics?.viewCount);
  const avgViews = videoCount > 0 ? Math.round(totalViewCount / videoCount) : 0;
  const username = channel.snippet?.customUrl || channel.id;

  return {
    provider: "youtube",
    profileId,
    externalAccountId: channel.id,
    username,
    displayName: channel.snippet?.title || username,
    profileUrl: `https://www.youtube.com/channel/${channel.id}`,
    followerCount: channel.statistics?.hiddenSubscriberCount
      ? 0
      : parseInteger(channel.statistics?.subscriberCount),
    mediaCount: videoCount,
    totalViewCount,
    avgViews,
    rawMetrics: payload as unknown as Record<string, unknown>,
  };
}
