import { createHmac, randomBytes, timingSafeEqual } from "crypto";
import { NextResponse } from "next/server";
import {
  AUTH_SESSION_COOKIE,
  createAuthSessionCookie,
  getAuthSessionCookieOptions,
} from "@/lib/auth-session";
import {
  authenticateServiceUser,
  executeKw,
  getOdooConfig,
} from "@/lib/odoo-rpc";

const GOOGLE_TOKEN_URL = "https://oauth2.googleapis.com/token";
const GOOGLE_USERINFO_URL = "https://openidconnect.googleapis.com/v1/userinfo";
const GOOGLE_OAUTH_STATE_COOKIE = "google_oauth_state";
type AuthRole = "business" | "influencer";

type GoogleTokenResponse = {
  access_token?: string;
  token_type?: string;
  expires_in?: number;
  id_token?: string;
  error?: string;
  error_description?: string;
};

type GoogleUserInfo = {
  sub: string;
  email?: string;
  email_verified?: boolean;
  name?: string;
  picture?: string;
};

type OdooUser = {
  id: number;
  name: string;
  login: string;
  email?: string | false;
  partner_id?: [number, string] | false;
};

type OdooPartner = {
  id: number;
  name: string;
  email?: string | false;
};

type OdooModelData = {
  res_id: number;
};

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

function signaturesMatch(actual: string, expected: string) {
  const actualBuffer = Buffer.from(actual);
  const expectedBuffer = Buffer.from(expected);

  return (
    actualBuffer.length === expectedBuffer.length &&
    timingSafeEqual(actualBuffer, expectedBuffer)
  );
}

function decodeState(value: string): { nonce: string; role: AuthRole } | null {
  try {
    const decoded = JSON.parse(
      Buffer.from(value, "base64url").toString("utf8"),
    ) as Partial<{ nonce: unknown; role: unknown; signature: unknown }>;

    if (
      typeof decoded.nonce !== "string" ||
      (decoded.role !== "business" && decoded.role !== "influencer") ||
      typeof decoded.signature !== "string"
    ) {
      return null;
    }

    if (
      !signaturesMatch(
        decoded.signature,
        signState({ nonce: decoded.nonce, role: decoded.role }),
      )
    ) {
      return null;
    }

    return {
      nonce: decoded.nonce,
      role: decoded.role,
    };
  } catch {
    return null;
  }
}

function getGoogleClientId() {
  const clientId = process.env.GOOGLE_CLIENT_ID;

  if (!clientId) {
    throw new Error("GOOGLE_CLIENT_ID is not configured.");
  }

  return clientId;
}

function getGoogleClientSecret() {
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET;

  if (!clientSecret) {
    throw new Error("GOOGLE_CLIENT_SECRET is not configured.");
  }

  return clientSecret;
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

function getPublicUrl(request: Request, path: string) {
  return new URL(path, getPublicOrigin(request));
}

function redirectToLogin(request: Request, message: string) {
  return NextResponse.redirect(
    getPublicUrl(request, `/login?error=${encodeURIComponent(message)}`),
  );
}

async function exchangeCodeForToken(request: Request, code: string) {
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
      redirect_uri: getRedirectUri(request),
    }),
    cache: "no-store",
  });
  const payload = (await response.json()) as GoogleTokenResponse;

  if (!response.ok || !payload.access_token) {
    throw new Error(
      payload.error_description ||
        payload.error ||
        "Google token exchange failed.",
    );
  }

  return payload.access_token;
}

async function fetchGoogleUserInfo(accessToken: string) {
  const response = await fetch(GOOGLE_USERINFO_URL, {
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
    cache: "no-store",
  });

  if (!response.ok) {
    throw new Error("Unable to fetch Google account information.");
  }

  return (await response.json()) as GoogleUserInfo;
}

async function getPortalGroupId(uid: number, config = getOdooConfig()) {
  const portalGroups = await executeKw<OdooModelData[]>(
    uid,
    "ir.model.data",
    "search_read",
    [[["module", "=", "base"], ["name", "=", "group_portal"]]],
    { fields: ["res_id"], limit: 1 },
    config,
  );

  return portalGroups[0]?.res_id;
}

async function findOrCreateGoogleUser(userInfo: GoogleUserInfo) {
  if (!userInfo.email || !userInfo.email_verified) {
    throw new Error("Google account email must be verified.");
  }

  const config = getOdooConfig();
  const uid = await authenticateServiceUser(config);
  const email = userInfo.email.trim().toLowerCase();
  const name = userInfo.name?.trim() || email;
  const existingUsers = await executeKw<OdooUser[]>(
    uid,
    "res.users",
    "search_read",
    [[["login", "=", email]]],
    { fields: ["id", "name", "login", "email", "partner_id"], limit: 1 },
    config,
  );
  const existingUser = existingUsers[0];

  if (existingUser) {
    return {
      id: existingUser.id,
      email,
      name: existingUser.name || name,
      partnerId: Array.isArray(existingUser.partner_id)
        ? existingUser.partner_id[0]
        : undefined,
    };
  }

  const existingPartners = await executeKw<OdooPartner[]>(
    uid,
    "res.partner",
    "search_read",
    [[["email", "=", email]]],
    { fields: ["id", "name", "email"], limit: 1 },
    config,
  );
  const partnerId =
    existingPartners[0]?.id ??
    (await executeKw<number>(
      uid,
      "res.partner",
      "create",
      [
        {
          name,
          email,
          comment: `InfluencerLink ET Google signup\nGoogle subject: ${userInfo.sub}`,
        },
      ],
      {},
      config,
    ));
  const portalGroupId = await getPortalGroupId(uid, config);
  const userValues: Record<string, unknown> = {
    name,
    login: email,
    email,
    password: randomBytes(24).toString("base64url"),
    partner_id: partnerId,
  };

  if (portalGroupId) {
    userValues.groups_id = [[6, 0, [portalGroupId]]];
  }

  const userId = await executeKw<number>(
    uid,
    "res.users",
    "create",
    [userValues],
    { context: { no_reset_password: true } },
    config,
  );

  return {
    id: userId,
    email,
    name,
    partnerId,
  };
}

export async function GET(request: Request) {
  const requestUrl = new URL(request.url);
  const code = requestUrl.searchParams.get("code");
  const state = requestUrl.searchParams.get("state");
  const expectedState = request.headers
    .get("cookie")
    ?.split(";")
    .map((cookie) => cookie.trim())
    .find((cookie) => cookie.startsWith(`${GOOGLE_OAUTH_STATE_COOKIE}=`))
    ?.split("=")[1];
  const decodedState = state ? decodeState(state) : null;
  const decodedExpectedState = expectedState ? decodeState(expectedState) : null;

  if (
    !code ||
    !state ||
    !decodedState ||
    (decodedExpectedState &&
      (state !== expectedState || decodedState.nonce !== decodedExpectedState.nonce))
  ) {
    return redirectToLogin(request, "Google login could not be verified.");
  }

  try {
    const accessToken = await exchangeCodeForToken(request, code);
    const googleUser = await fetchGoogleUserInfo(accessToken);
    const odooUser = await findOrCreateGoogleUser(googleUser);
    const response = NextResponse.redirect(
      getPublicUrl(request, decodedState.role === "influencer" ? "/influencers" : "/"),
    );

    response.cookies.delete(GOOGLE_OAUTH_STATE_COOKIE);
    response.cookies.set(
      AUTH_SESSION_COOKIE,
      createAuthSessionCookie({
        uid: odooUser.id,
        email: odooUser.email,
        name: odooUser.name,
        role: decodedState.role,
        partnerId: odooUser.partnerId,
      }),
      getAuthSessionCookieOptions(),
    );

    return response;
  } catch (error) {
    return redirectToLogin(
      request,
      error instanceof Error ? error.message : "Google login failed.",
    );
  }
}
