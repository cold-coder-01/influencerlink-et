"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
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

type BottomNavItem = {
  href: string;
  icon: "coins" | "home" | "message" | "profile" | "rocket";
  label: string;
};

const influencerBottomNavItems: BottomNavItem[] = [
  { href: "/influencer/dashboard", icon: "home", label: "Home" },
  { href: "/influencer/campaigns", icon: "rocket", label: "Campaigns" },
  { href: "/influencer/messages", icon: "message", label: "Messages" },
  { href: "/influencer/earnings", icon: "coins", label: "Earnings" },
  { href: "/influencer/profile", icon: "profile", label: "Profile" },
];

const businessBottomNavItems: BottomNavItem[] = [
  { href: "/dashboard", icon: "home", label: "Home" },
  { href: "/campaigns", icon: "rocket", label: "Campaigns" },
  { href: "/messages", icon: "message", label: "Messages" },
  { href: "/payments", icon: "coins", label: "Payments" },
  { href: "/settings", icon: "profile", label: "Settings" },
];

function BottomNavIcon({ name }: { name: BottomNavItem["icon"] }) {
  const common = {
    fill: "none",
    stroke: "currentColor",
    strokeLinecap: "round" as const,
    strokeLinejoin: "round" as const,
    strokeWidth: 1.9,
  };

  return (
    <svg aria-hidden="true" className="h-5 w-5" viewBox="0 0 24 24">
      {name === "coins" ? (
        <>
          <ellipse {...common} cx="8" cy="7" rx="5" ry="3" />
          <path {...common} d="M3 7v8c0 1.7 2.2 3 5 3s5-1.3 5-3V7" />
          <path {...common} d="M13 10.2c.9-.7 2.2-1.2 3.7-1.2 2.4 0 4.3 1.1 4.3 2.5s-1.9 2.5-4.3 2.5c-1.4 0-2.7-.4-3.5-1" />
        </>
      ) : name === "message" ? (
        <path {...common} d="M21 15a4 4 0 0 1-4 4H8l-5 3V7a4 4 0 0 1 4-4h10a4 4 0 0 1 4 4Z" />
      ) : name === "profile" ? (
        <>
          <circle {...common} cx="12" cy="8" r="4" />
          <path {...common} d="M4 21a8 8 0 0 1 16 0" />
        </>
      ) : name === "rocket" ? (
        <>
          <path {...common} d="M4.5 16.5c-1 1-1.5 2.5-1.5 4.5 2 0 3.5-.5 4.5-1.5" />
          <path {...common} d="M9 15 7 13a14 14 0 0 1 8-9l4-1-1 4a14 14 0 0 1-9 8Z" />
          <path {...common} d="M9 15v4h4l2-5M7 13H3V9l5-2" />
        </>
      ) : (
        <>
          <path {...common} d="m3 11 9-8 9 8" />
          <path {...common} d="M5 10v10h14V10" />
          <path {...common} d="M10 20v-6h4v6" />
        </>
      )}
    </svg>
  );
}

function MobileBottomNav({ role }: { role: DashboardShellProps["role"] }) {
  const pathname = usePathname();
  const items =
    role === "influencer"
      ? influencerBottomNavItems
      : role === "admin"
        ? []
        : businessBottomNavItems;

  if (!items.length) return null;

  return (
    <nav
      aria-label="Mobile primary navigation"
      className="fixed inset-x-3 bottom-3 z-30 rounded-[24px] border border-white/[0.20] bg-[#071E73]/88 px-2 pb-[max(0.5rem,env(safe-area-inset-bottom))] pt-2 shadow-[0_22px_70px_rgba(0,0,0,0.32)] backdrop-blur-2xl lg:hidden"
    >
      <div className="grid grid-cols-5 gap-1">
        {items.map((item) => {
          const active =
            pathname === item.href || pathname.startsWith(`${item.href}/`);

          return (
            <Link
              className={`grid min-h-[58px] place-items-center rounded-[18px] px-1 text-[11px] font-bold transition active:scale-95 ${
                active
                  ? "bg-white text-[#182CFF] shadow-[0_12px_28px_rgba(255,255,255,0.18)]"
                  : "text-white/72 hover:bg-white/[0.10] hover:text-white"
              }`}
              href={item.href}
              key={item.href}
            >
              <BottomNavIcon name={item.icon} />
              <span className="mt-1 max-w-full truncate">{item.label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}

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
      <MobileBottomNav role={role} />
    </main>
  );
}
