import "server-only";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import {
  AUTH_SESSION_COOKIE,
  normalizeSessionRole,
  readAuthSessionCookie,
} from "@/lib/auth-session";

export const dynamic = "force-dynamic";

export default async function Home() {
  const session = readAuthSessionCookie(
    (await cookies()).get(AUTH_SESSION_COOKIE)?.value,
  );

  if (!session) {
    redirect("/login");
  }

  const role = normalizeSessionRole(session.role);

  if (role === "influencer") {
    redirect("/influencer/dashboard");
  }

  if (role === "admin") {
    redirect("/admin/verifications");
  }

  redirect("/dashboard");
}
