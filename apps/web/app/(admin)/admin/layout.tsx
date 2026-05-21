import "server-only";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import type { ReactNode } from "react";
import { DashboardShell } from "@/components/dashboard/DashboardShell";
import { AUTH_SESSION_COOKIE } from "@/lib/auth-session";
import { isAdmin, isBusinessOwner, isInfluencer } from "@/lib/permissions";
import { routes } from "@/lib/routes";
import { getCurrentSession } from "@/lib/session";

export const dynamic = "force-dynamic";

export default async function AdminLayout({ children }: { children: ReactNode }) {
  const session = await getCurrentSession();

  if (!session) {
    redirect(routes.login());
  }

  if (!isAdmin(session)) {
    if (isInfluencer(session)) {
      redirect(routes.influencerDashboard());
    }

    if (isBusinessOwner(session)) {
      redirect(routes.dashboard());
    }

    redirect(routes.login());
  }

  async function logout() {
    "use server";

    (await cookies()).delete(AUTH_SESSION_COOKIE);
    redirect(routes.login());
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
