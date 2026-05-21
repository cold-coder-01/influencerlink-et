import "server-only";

import { createHmac, timingSafeEqual } from "crypto";

export const AUTH_SESSION_COOKIE = "influencer_link_session";

const SESSION_TTL_SECONDS = 60 * 60 * 24 * 7;

export type SessionRole = "business_owner" | "business" | "influencer" | "admin";
export type NormalizedSessionRole = "business_owner" | "influencer" | "admin";

export type AuthSession = {
  uid: number;
  email: string;
  name?: string;
  role: SessionRole;
  partnerId?: number;
  profileId?: number;
  handle?: string;
  platform?: string;
  bio?: string;
  expiresAt: number;
};

type SessionInput = Omit<AuthSession, "expiresAt">;

export function normalizeSessionRole(role?: string): NormalizedSessionRole {
  if (role === "influencer") return "influencer";
  if (role === "admin") return "admin";

  return "business_owner";
}

export function getSessionDisplayName(session: AuthSession) {
  return session.name || session.email || "InfluencerLink ET User";
}

function getSessionSecret() {
  return (
    process.env.AUTH_SESSION_SECRET ??
    process.env.NEXTAUTH_SECRET ??
    process.env.ODOO_PASSWORD ??
    "influencer-link-et-local-session-secret"
  );
}

function encodeJson(value: unknown) {
  return Buffer.from(JSON.stringify(value), "utf8").toString("base64url");
}

function decodeJson<T>(value: string): T | null {
  try {
    return JSON.parse(Buffer.from(value, "base64url").toString("utf8")) as T;
  } catch {
    return null;
  }
}

function sign(payload: string) {
  return createHmac("sha256", getSessionSecret())
    .update(payload)
    .digest("base64url");
}

function hasValidSignature(payload: string, signature: string) {
  const expected = sign(payload);
  const actualBuffer = Buffer.from(signature);
  const expectedBuffer = Buffer.from(expected);

  return (
    actualBuffer.length === expectedBuffer.length &&
    timingSafeEqual(actualBuffer, expectedBuffer)
  );
}

export function createAuthSessionCookie(session: SessionInput) {
  const payload = encodeJson({
    ...session,
    expiresAt: Math.floor(Date.now() / 1000) + SESSION_TTL_SECONDS,
  });

  return `${payload}.${sign(payload)}`;
}

export function readAuthSessionCookie(value?: string): AuthSession | null {
  if (!value) {
    return null;
  }

  const [payload, signature] = value.split(".");

  if (!payload || !signature || !hasValidSignature(payload, signature)) {
    return null;
  }

  const session = decodeJson<AuthSession>(payload);

  if (!session || session.expiresAt <= Math.floor(Date.now() / 1000)) {
    return null;
  }

  return {
    ...session,
    role: session.role ?? "business_owner",
  };
}

export function getAuthSessionCookieOptions() {
  return {
    httpOnly: true,
    sameSite: "lax" as const,
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: SESSION_TTL_SECONDS,
  };
}
