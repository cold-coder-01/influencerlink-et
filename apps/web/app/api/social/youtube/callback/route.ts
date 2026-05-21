import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { isInfluencer } from "@/lib/permissions";
import { saveVerifiedSocialMetrics } from "@/lib/social-accounts";
import { getCurrentSession } from "@/lib/session";
import {
  exchangeYouTubeCode,
  fetchVerifiedYouTubeMetrics,
} from "@/lib/youtube-connect";

const YOUTUBE_CONNECT_STATE_COOKIE = "youtube_connect_state";

function decodeState(value: string): { nonce: string; profileId: number } | null {
  try {
    const decoded = JSON.parse(
      Buffer.from(value, "base64url").toString("utf8"),
    ) as Partial<{ nonce: unknown; profileId: unknown }>;

    if (typeof decoded.nonce !== "string" || typeof decoded.profileId !== "number") {
      return null;
    }

    return {
      nonce: decoded.nonce,
      profileId: decoded.profileId,
    };
  } catch {
    return null;
  }
}

function redirectToProfile(request: Request, key: "social_connected" | "social_error", value: string) {
  return NextResponse.redirect(
    new URL(`/influencer/profile?${key}=${encodeURIComponent(value)}`, request.url),
  );
}

export async function GET(request: Request) {
  const requestUrl = new URL(request.url);
  const code = requestUrl.searchParams.get("code");
  const state = requestUrl.searchParams.get("state");
  const expectedState = (await cookies()).get(YOUTUBE_CONNECT_STATE_COOKIE)?.value;
  const decodedState = state ? decodeState(state) : null;
  const decodedExpectedState = expectedState ? decodeState(expectedState) : null;
  const session = await getCurrentSession();

  if (
    !code ||
    !state ||
    !expectedState ||
    state !== expectedState ||
    !decodedState ||
    !decodedExpectedState ||
    decodedState.nonce !== decodedExpectedState.nonce
  ) {
    return redirectToProfile(request, "social_error", "YouTube connection could not be verified.");
  }

  if (
    !session ||
    !isInfluencer(session) ||
    !session.influencerProfileId ||
    session.influencerProfileId !== decodedState.profileId
  ) {
    return redirectToProfile(request, "social_error", "YouTube must be connected from your influencer account.");
  }

  try {
    const accessToken = await exchangeYouTubeCode(request, code);
    const metrics = await fetchVerifiedYouTubeMetrics(
      accessToken,
      session.influencerProfileId,
    );

    await saveVerifiedSocialMetrics(metrics);

    const response = redirectToProfile(request, "social_connected", "YouTube metrics synced.");
    response.cookies.delete(YOUTUBE_CONNECT_STATE_COOKIE);

    return response;
  } catch (error) {
    const response = redirectToProfile(
      request,
      "social_error",
      error instanceof Error ? error.message : "YouTube connection failed.",
    );
    response.cookies.delete(YOUTUBE_CONNECT_STATE_COOKIE);

    return response;
  }
}
