import { createHmac, randomBytes } from "crypto";
import { NextResponse } from "next/server";

const GOOGLE_AUTH_URL = "https://accounts.google.com/o/oauth2/v2/auth";
const GOOGLE_OAUTH_STATE_COOKIE = "google_oauth_state";
type AuthRole = "business" | "influencer";

function getStateSecret() {
  const secret = process.env.GOOGLE_OAUTH_STATE_SECRET ?? process.env.GOOGLE_CLIENT_SECRET;

  if (!secret) {
    throw new Error("GOOGLE_OAUTH_STATE_SECRET or GOOGLE_CLIENT_SECRET is not configured.");
  }

  return secret;
}

function signState(value: { nonce: string; role: AuthRole }) {
  return createHmac("sha256", getStateSecret())
    .update(`${value.nonce}.${value.role}`)
    .digest("base64url");
}

function encodeState(value: { nonce: string; role: AuthRole }) {
  return Buffer.from(
    JSON.stringify({
      ...value,
      signature: signState(value),
    }),
    "utf8",
  ).toString("base64url");
}

function getRole(request: Request): AuthRole {
  const role = new URL(request.url).searchParams.get("role");

  return role === "influencer" ? "influencer" : "business";
}

function getGoogleClientId() {
  const clientId = process.env.GOOGLE_CLIENT_ID;

  if (!clientId) {
    throw new Error("GOOGLE_CLIENT_ID is not configured.");
  }

  return clientId;
}

function isLocalhostUrl(value: string) {
  try {
    const { hostname } = new URL(value);

    return hostname === "localhost" || hostname === "127.0.0.1" || hostname === "::1";
  } catch {
    return false;
  }
}

function isLocalhostHost(value: string | null) {
  if (!value) {
    return false;
  }

  const host = value.split(":")[0];

  return host === "localhost" || host === "127.0.0.1" || host === "[::1]";
}

function isNgrokHost(value: string | null) {
  return value?.toLowerCase().includes("ngrok") ?? false;
}

function getRedirectUri(request: Request) {
  const explicitRedirectUri = process.env.GOOGLE_REDIRECT_URI;
  const forwardedHost = request.headers.get("x-forwarded-host");
  const forwardedProto = request.headers.get("x-forwarded-proto") ?? "https";
  const requestHost = request.headers.get("host");
  const tunnelHost = forwardedHost ?? requestHost;
  const requestIsLocal = isLocalhostHost(tunnelHost);

  if (
    explicitRedirectUri &&
    !isNgrokHost(explicitRedirectUri) &&
    (!isLocalhostUrl(explicitRedirectUri) || requestIsLocal)
  ) {
    return explicitRedirectUri;
  }

  const publicUrl = process.env.NEXT_PUBLIC_APP_URL ?? process.env.APP_PUBLIC_URL;

  if (publicUrl) {
    return new URL("/api/auth/google/callback", publicUrl).toString();
  }

  if (forwardedHost && !isNgrokHost(forwardedHost)) {
    return `${forwardedProto}://${forwardedHost}/api/auth/google/callback`;
  }

  return new URL("/api/auth/google/callback", request.url).toString();
}

function getPublicOrigin(request: Request) {
  const explicitRedirectUri = process.env.GOOGLE_REDIRECT_URI;

  if (
    explicitRedirectUri &&
    !isNgrokHost(explicitRedirectUri) &&
    !isLocalhostUrl(explicitRedirectUri)
  ) {
    return new URL(explicitRedirectUri).origin;
  }

  const publicUrl = process.env.NEXT_PUBLIC_APP_URL ?? process.env.APP_PUBLIC_URL;

  if (publicUrl && !isLocalhostUrl(publicUrl)) {
    return new URL(publicUrl).origin;
  }

  const forwardedHost = request.headers.get("x-forwarded-host");
  const forwardedProto = request.headers.get("x-forwarded-proto") ?? "https";

  if (forwardedHost && !isNgrokHost(forwardedHost)) {
    return `${forwardedProto}://${forwardedHost}`;
  }

  return new URL(request.url).origin;
}

export async function GET(request: Request) {
  try {
    const state = encodeState({
      nonce: randomBytes(24).toString("base64url"),
      role: getRole(request),
    });
    const authorizationUrl = new URL(GOOGLE_AUTH_URL);

    authorizationUrl.searchParams.set("client_id", getGoogleClientId());
    authorizationUrl.searchParams.set("redirect_uri", getRedirectUri(request));
    authorizationUrl.searchParams.set("response_type", "code");
    authorizationUrl.searchParams.set("scope", "openid email profile");
    authorizationUrl.searchParams.set("state", state);
    authorizationUrl.searchParams.set("prompt", "select_account");

    const response = NextResponse.redirect(authorizationUrl);
    response.cookies.set(GOOGLE_OAUTH_STATE_COOKIE, state, {
      httpOnly: true,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
      path: "/",
      maxAge: 60 * 10,
    });

    return response;
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Google login is unavailable.";

    return NextResponse.redirect(
      new URL(`/login?error=${encodeURIComponent(message)}`, getPublicOrigin(request)),
    );
  }
}
