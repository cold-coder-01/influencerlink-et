import "server-only";

import { cookies } from "next/headers";
import {
  AUTH_SESSION_COOKIE,
  getSessionDisplayName,
  normalizeSessionRole,
  readAuthSessionCookie,
} from "@/lib/auth-session";

export async function getCurrentSession() {
  const session = readAuthSessionCookie(
    (await cookies()).get(AUTH_SESSION_COOKIE)?.value,
  );

  if (!session) {
    return null;
  }

  return {
    ...session,
    normalizedRole: normalizeSessionRole(session.role),
    displayName: getSessionDisplayName(session),
    influencerProfileId: session.profileId ?? null,
  };
}
