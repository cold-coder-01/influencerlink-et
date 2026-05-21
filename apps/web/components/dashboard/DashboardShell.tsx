"use client";

import type { ReactNode } from "react";
import { useEffect, useState } from "react";
import { Sidebar } from "./Sidebar";
import { Topbar } from "./Topbar";

type DashboardShellProps = {
  children: ReactNode;
  displayName: string;
  role: "business_owner" | "influencer" | "admin";
  logout: () => Promise<void>;
};

export function DashboardShell({
  children,
  displayName,
  role,
  logout,
}: DashboardShellProps) {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  useEffect(() => {
    if (!isSidebarOpen) {
      return;
    }

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, [isSidebarOpen]);

  return (
    <main className="mobile-app-surface relative min-h-dvh overflow-x-hidden text-white lg:bg-[#050505] lg:text-[#F5F2E9]">
      <div className="pointer-events-none fixed inset-0 z-0">
        <div className="mobile-glow absolute -right-28 top-20 h-[420px] w-36 rotate-[18deg] rounded-full bg-[#00D4FF]/36 blur-3xl lg:hidden" />
        <div className="absolute -left-32 -top-32 h-80 w-80 rounded-full bg-[#00D4FF]/16 blur-3xl lg:bg-[#FFD700]/12" />
        <div className="absolute bottom-0 right-0 h-96 w-96 rounded-full bg-white/10 blur-3xl lg:bg-[#2D5A27]/24" />
        <div className="mobile-app-grid absolute inset-0 opacity-[0.12] lg:opacity-[0.045] lg:[background-image:linear-gradient(rgba(255,255,255,.5)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,.5)_1px,transparent_1px)] lg:[background-size:48px_48px]" />
        <div
          className="absolute inset-0 hidden opacity-[0.035] lg:block"
          style={{
            backgroundImage: "url('/images/dashboard/pattern-gold.svg')",
            backgroundSize: "260px",
          }}
        />
      </div>

      {isSidebarOpen ? (
        <button
          aria-label="Close navigation"
        className="fixed inset-0 z-40 bg-[#050B3D]/72 backdrop-blur-sm lg:hidden"
          onClick={() => setIsSidebarOpen(false)}
          type="button"
        />
      ) : null}

      <Sidebar
        isMobileOpen={isSidebarOpen}
        onClose={() => setIsSidebarOpen(false)}
        role={role}
      />

      <div className="relative z-10 min-h-dvh lg:ml-[260px]">
        <Topbar
          displayName={displayName}
          isMenuOpen={isSidebarOpen}
          logout={logout}
          onMenuClick={() => setIsSidebarOpen(true)}
          role={role}
        />
        <div className="mobile-safe-area mobile-bottom-spacing w-full px-3 py-4 sm:px-6 md:px-7 lg:px-8 lg:py-7">
          {children}
        </div>
      </div>
    </main>
  );
}
