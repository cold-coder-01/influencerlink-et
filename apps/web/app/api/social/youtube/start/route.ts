import { randomBytes } from "crypto";
import { NextResponse } from "next/server";
import { isInfluencer } from "@/lib/permissions";
import { getCurrentSession } from "@/lib/session";
import { getYouTubeRedirectUri } from "@/lib/youtube-connect";

const GOOGLE_AUTH_URL = "https://accounts.google.com/o/oauth2/v2/auth";
const YOUTUBE_CONNECT_STATE_COOKIE = "youtube_connect_state";

function encodeState(value: { nonce: string; profileId: number }) {
  return Buffer.from(JSON.stringify(value), "utf8").toString("base64url");
}

export async function GET(request: Request) {
  const session = await getCurrentSession();
  const profileId = session?.influencerProfileId;

  if (!session || !isInfluencer(session) || !profileId) {
    return NextResponse.redirect(
      new URL("/login?error=Connect YouTube from an influencer account.", request.url),
    );
  }

  try {
    const state = encodeState({
      nonce: randomBytes(24).toString("base64url"),
      profileId,
    });
    const authorizationUrl = new URL(GOOGLE_AUTH_URL);

    authorizationUrl.searchParams.set("client_id", process.env.GOOGLE_CLIENT_ID || "");
    authorizationUrl.searchParams.set("redirect_uri", getYouTubeRedirectUri(request));
    authorizationUrl.searchParams.set("response_type", "code");
    authorizationUrl.searchParams.set("scope", "https://www.googleapis.com/auth/youtube.readonly");
    authorizationUrl.searchParams.set("state", state);
    authorizationUrl.searchParams.set("prompt", "consent select_account");
    authorizationUrl.searchParams.set("access_type", "offline");

    if (!process.env.GOOGLE_CLIENT_ID) {
      throw new Error("GOOGLE_CLIENT_ID is not configured.");
    }

    const response = NextResponse.redirect(authorizationUrl);
    response.cookies.set(YOUTUBE_CONNECT_STATE_COOKIE, state, {
      httpOnly: true,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
      path: "/",
      maxAge: 60 * 10,
    });

    return response;
  } catch (error) {
    return NextResponse.redirect(
      new URL(
        `/influencer/profile?social_error=${encodeURIComponent(
          error instanceof Error ? error.message : "YouTube connection failed.",
        )}`,
        request.url,
      ),
    );
  }
}
