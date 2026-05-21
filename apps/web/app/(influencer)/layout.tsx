import "server-only";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import type { ReactNode } from "react";
import { DashboardShell } from "@/components/dashboard/DashboardShell";
import { AUTH_SESSION_COOKIE } from "@/lib/auth-session";
import {
  canAccessInfluencerDashboard,
  isBusinessOwner,
} from "@/lib/permissions";
import { getCurrentSession } from "@/lib/session";

export const dynamic = "force-dynamic";

export default async function InfluencerLayout({
  children,
}: {
  children: ReactNode;
}) {
  const session = await getCurrentSession();

  if (!session) {
    redirect("/login");
  }

  if (isBusinessOwner(session)) {
    redirect("/dashboard");
  }

  if (!canAccessInfluencerDashboard(session)) {
    redirect("/login");
  }

  async function logout() {
    "use server";

    (await cookies()).delete(AUTH_SESSION_COOKIE);
    redirect("/login");
  }

  return (
    <DashboardShell
      displayName={session.displayName}
      logout={logout}
      role={session.normalizedRole}
    >
      {children}
    </DashboardShell>
  );
}
