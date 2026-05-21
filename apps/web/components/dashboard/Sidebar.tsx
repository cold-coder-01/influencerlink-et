"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";

const businessNavItems = [
  { label: "Mission Control", href: "/dashboard", icon: "MC" },
  { label: "Notifications", href: "/notifications", icon: "NO" },
  { label: "Industries", href: "/industries", icon: "IN" },
  { label: "Influencers", href: "/influencers", icon: "IF" },
  { label: "Campaigns", href: "/campaigns", icon: "CA" },
  { label: "Analytics", href: "/analytics", icon: "AN" },
  { label: "Messages", href: "/messages", icon: "ME" },
  { label: "Contracts", href: "/contracts", icon: "CO" },
  { label: "Payments", href: "/payments", icon: "PA" },
  { label: "Settings", href: "/settings", icon: "SE" },
];

const influencerNavItems = [
  { label: "Creator Dashboard", href: "/influencer/dashboard", icon: "CD" },
  { label: "Notifications", href: "/influencer/notifications", icon: "NO" },
  { label: "My Profile", href: "/influencer/profile", icon: "MP" },
  { label: "Social Accounts", href: "/influencer/social-accounts", icon: "SA" },
  { label: "Campaigns", href: "/influencer/campaigns", icon: "CA" },
  { label: "Messages", href: "/influencer/messages", icon: "ME" },
  { label: "Contracts", href: "/influencer/contracts", icon: "CO" },
  { label: "Earnings", href: "/influencer/earnings", icon: "EA" },
  { label: "Settings", href: "/influencer/settings", icon: "SE" },
];

const adminNavItems = [
  { label: "Verification Queue", href: "/admin/verifications", icon: "VQ" },
  { label: "Marketplace Dashboard", href: "/dashboard", icon: "MD" },
  { label: "Influencers", href: "/influencers", icon: "IF" },
  { label: "Campaigns", href: "/campaigns", icon: "CA" },
  { label: "Messages", href: "/messages", icon: "ME" },
  { label: "Contracts", href: "/contracts", icon: "CO" },
  { label: "Payments", href: "/payments", icon: "PA" },
  { label: "Settings", href: "/settings", icon: "SE" },
];

function isActive(pathname: string, href: string) {
  return pathname === href || pathname.startsWith(`${href}/`);
}

type SidebarProps = {
  isMobileOpen: boolean;
  onClose: () => void;
  role: "business_owner" | "influencer" | "admin";
};

export function Sidebar({ isMobileOpen, onClose, role }: SidebarProps) {
  const pathname = usePathname();
  const navItems =
    role === "admin"
      ? adminNavItems
      : role === "influencer"
        ? influencerNavItems
        : businessNavItems;
  const homeHref =
    role === "admin"
      ? "/admin/verifications"
      : role === "influencer"
        ? "/influencer/dashboard"
        : "/dashboard";

  return (
    <aside
      className={`fixed inset-y-0 left-0 z-50 flex min-h-dvh w-[min(86vw,300px)] flex-col overflow-y-auto border-r border-white/[0.18] bg-[#050B3D]/94 px-4 py-5 pb-[max(1.25rem,env(safe-area-inset-bottom))] text-white shadow-[16px_0_70px_rgba(0,0,0,0.32)] backdrop-blur-xl transition-transform duration-200 will-change-transform sm:px-5 sm:py-6 lg:w-[260px] lg:translate-x-0 lg:border-white/[0.10] lg:bg-[#090909]/95 lg:text-[#F5F2E9] ${
        isMobileOpen ? "translate-x-0" : "-translate-x-full"
      }`}
      id="dashboard-sidebar"
    >
      <div className="flex items-center justify-between gap-3">
        <Link className="flex items-center gap-3" href={homeHref} onClick={onClose}>
          <div className="relative grid h-10 w-10 shrink-0 place-items-center overflow-hidden rounded-xl border border-[#00D4FF]/45 bg-[#081B5D] text-sm font-black text-[#C9FBFF] lg:border-[#FFD700]/40">
            <span className="absolute inset-0 grid place-items-center">IL</span>
            <Image
              alt="InfluencerLink ET"
              className="relative h-full w-full object-contain"
              height={40}
              src="/icons/influencerlink-et-blue-logo.png"
              width={40}
            />
          </div>
          <div>
            <p className="text-xs font-bold uppercase tracking-wide sm:text-sm">
              InfluencerLink ET
            </p>
            <p className="hidden text-[10px] font-semibold uppercase tracking-[0.18em] text-white/70 sm:block lg:text-[#B8B3A7]">
              Connect. Collaborate. Grow.
            </p>
          </div>
        </Link>
        <button
          aria-label="Close navigation"
          className="grid h-9 w-9 place-items-center rounded-lg border border-white/[0.18] bg-white/[0.10] text-[#C9FBFF] lg:hidden"
          onClick={onClose}
          type="button"
        >
          <span className="text-lg leading-none">x</span>
        </button>
      </div>

      <nav className="mt-7 space-y-2 sm:mt-9" aria-label="Main navigation">
        {navItems.map((item) => {
          const active = isActive(pathname, item.href);

          return (
            <Link
              className={`flex min-h-11 items-center gap-3 rounded-lg px-3 py-3 text-sm transition ${
                active
                  ? "border border-[#00D4FF]/35 bg-[#00D4FF]/14 text-[#C9FBFF] lg:border-[#FFD700]/25 lg:bg-[#FFD700]/15 lg:text-[#FFD700]"
                  : "border border-transparent text-white/82 hover:bg-white/[0.08] hover:text-[#C9FBFF] lg:text-[#F5F2E9]/80 lg:hover:bg-white/[0.06] lg:hover:text-[#FFD700]"
              }`}
              href={item.href}
              key={item.href}
              onClick={onClose}
            >
              <span className="grid h-6 w-6 place-items-center rounded-md border border-current/25 text-[10px] font-bold">
                {item.icon}
              </span>
              <span>{item.label}</span>
            </Link>
          );
        })}
      </nav>

      <div className="mt-auto hidden space-y-5 pt-6 sm:block">
        <div className="rounded-2xl border border-white/[0.10] bg-white/[0.05] p-4 shadow-[0_0_32px_rgba(255,215,0,0.08),0_0_40px_rgba(69,179,107,0.06)]">
          <div className="flex items-center justify-between">
            <p className="text-sm font-semibold text-[#C9FBFF] lg:text-[#FFD700]">
              {role === "admin"
                ? "Admin Console"
                : role === "influencer"
                  ? "Creator Plan"
                  : "Enterprise Plan"}
            </p>
            <span className="flex items-center gap-1 text-xs text-[#45B36B]">
              <span className="h-1.5 w-1.5 rounded-full bg-[#45B36B]" />
              Active
            </span>
          </div>
          <p className="mt-3 text-xs text-white/70 lg:text-[#B8B3A7]">
            {role === "admin"
              ? "Verification tools enabled"
              : role === "influencer"
                ? "Profile active"
                : "Valid until Dec 31, 2026"}
          </p>
          <Link
            className="mt-4 flex w-full justify-center rounded-lg border border-[#00D4FF]/50 px-3 py-2 text-xs font-semibold text-[#C9FBFF] transition hover:bg-white hover:text-[#182CFF] lg:border-[#FFD700]/50 lg:text-[#FFD700] lg:hover:bg-[#FFD700] lg:hover:text-black"
            href={role === "influencer" ? "/influencer/settings" : "/settings"}
            onClick={onClose}
          >
            {role === "admin" ? "Open Settings" : "Manage Plan"}
          </Link>
        </div>

        <div className="relative overflow-hidden rounded-2xl border border-white/[0.10] bg-white/[0.05] p-5 backdrop-blur-xl">
          <div
            className="absolute inset-0 opacity-15"
            style={{
              backgroundImage: "url('/images/dashboard/pattern-gold.svg')",
              backgroundSize: "180px",
            }}
          />
          <div className="relative">
            <p className="text-lg leading-7 text-white lg:text-[#F5F2E9]">
              Grow Smarter.
              <br />
              Collaborate Better.
              <br />
              Achieve More.
            </p>
            <p className="mt-5 text-sm font-semibold text-[#C9FBFF] lg:text-[#FFD700]">
              InfluencerLink ET
            </p>
          </div>
        </div>
      </div>
    </aside>
  );
}
