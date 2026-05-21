import Image from "next/image";
import Link from "next/link";
import { NotificationBell } from "@/components/notifications/NotificationBell";
import { routes } from "@/lib/routes";

type TopbarProps = {
  displayName: string;
  isMenuOpen: boolean;
  role: "business_owner" | "influencer" | "admin";
  logout: () => Promise<void>;
  onMenuClick: () => void;
};

function getInitials(name: string) {
  return name
    .split(" ")
    .map((part) => part[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
}

function MenuIcon() {
  return (
    <svg aria-hidden="true" className="h-5 w-5" fill="none" viewBox="0 0 24 24">
      <path
        d="M4 7h16M4 12h16M4 17h16"
        stroke="currentColor"
        strokeLinecap="round"
        strokeWidth="1.8"
      />
    </svg>
  );
}

function MessageIcon() {
  return (
    <svg aria-hidden="true" className="h-5 w-5" fill="none" viewBox="0 0 24 24">
      <path
        d="M21 15a4 4 0 0 1-4 4H8l-5 3V7a4 4 0 0 1 4-4h10a4 4 0 0 1 4 4z"
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="1.8"
      />
    </svg>
  );
}

function ChevronIcon() {
  return (
    <svg aria-hidden="true" className="h-4 w-4" fill="none" viewBox="0 0 24 24">
      <path
        d="m6 9 6 6 6-6"
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="1.8"
      />
    </svg>
  );
}

function LogoTile() {
  return (
    <div className="relative grid h-11 w-11 shrink-0 place-items-center overflow-hidden rounded-2xl border border-[#2ED3FF]/55 bg-[#081B5D] text-sm font-black text-white shadow-[0_0_26px_rgba(46,211,255,0.22)] sm:h-12 sm:w-12">
      <span className="absolute inset-0 grid place-items-center">IL</span>
      <Image
        alt="InfluencerLink ET"
        className="relative h-full w-full object-contain"
        height={48}
        src="/icons/influencerlink-et-blue-logo.png"
        width={48}
      />
    </div>
  );
}

export function Topbar({
  displayName,
  isMenuOpen,
  role,
  logout,
  onMenuClick,
}: TopbarProps) {
  const safeDisplayName = displayName || "InfluencerLink ET User";
  const messagesHref = role === "influencer" ? "/influencer/messages" : "/messages";
  const notificationsHref =
    role === "influencer"
      ? routes.influencerNotifications()
      : role === "admin"
        ? routes.adminVerifications()
        : routes.notifications();
  const roleLabel =
    role === "influencer"
      ? "Influencer"
      : role === "admin"
        ? "Admin"
        : "Business Owner";

  return (
    <header className="sticky top-0 z-20 border-b border-white/[0.10] bg-[#1D4DFF]/72 px-3 py-3 pt-[max(0.75rem,env(safe-area-inset-top))] text-white backdrop-blur-xl sm:px-6 lg:min-h-20 lg:border-white/[0.08] lg:bg-[#050505]/88 lg:px-8">
      <div className="flex items-center justify-between gap-2 lg:flex-row">
        <div className="flex min-w-0 flex-1 items-center gap-2">
          <button
            aria-label="Open navigation"
            aria-controls="dashboard-sidebar"
            aria-expanded={isMenuOpen}
            className="grid h-11 w-11 shrink-0 touch-manipulation place-items-center rounded-2xl border border-white/[0.18] bg-white/[0.09] text-white shadow-[0_12px_34px_rgba(1,10,45,0.18)] active:scale-95 sm:h-12 sm:w-12 lg:hidden"
            onClick={onMenuClick}
            type="button"
          >
            <MenuIcon />
          </button>
          <div className="flex min-w-0 flex-1 items-center gap-2 lg:hidden">
            <LogoTile />
            <div className="min-w-0 flex-1">
              <p className="whitespace-nowrap text-[15px] font-bold leading-5 text-white min-[390px]:text-base">
                InfluencerLink ET
              </p>
              <p className="truncate text-xs font-medium text-[#9CEFFF]">{roleLabel}</p>
            </div>
          </div>
          <label className="hidden min-h-11 flex-1 items-center gap-3 rounded-lg border border-white/[0.18] bg-white/[0.08] px-4 text-white/72 md:flex lg:min-w-[360px] lg:max-w-2xl lg:border-white/[0.10] lg:bg-white/[0.04] lg:text-[#B8B3A7]">
            <span className="text-sm text-[#C9FBFF] lg:text-[#FFD700]">Search</span>
            <input
              className="w-full bg-transparent text-sm text-white outline-none placeholder:text-white/55 lg:text-[#F5F2E9] lg:placeholder:text-[#B8B3A7]/75"
              placeholder="Search industries, influencers, campaigns..."
              type="search"
            />
          </label>
        </div>

        <div className="flex shrink-0 items-center justify-end gap-2">
          <label className="hidden min-h-11 flex-1 items-center gap-3 rounded-lg border border-white/[0.18] bg-white/[0.08] px-4 text-white/72 sm:flex md:hidden">
            <span className="text-sm text-[#C9FBFF]">Search</span>
            <input
              className="w-full bg-transparent text-sm text-white outline-none placeholder:text-white/55"
              placeholder="Search..."
              type="search"
            />
          </label>
          <div className="flex shrink-0 items-center gap-2 sm:gap-3">
            <Link
              aria-label="Messages"
              className="relative grid h-11 w-11 place-items-center rounded-2xl border border-white/[0.18] bg-white/[0.09] text-white shadow-[0_12px_34px_rgba(1,10,45,0.18)] sm:h-12 sm:w-12 lg:h-10 lg:w-10 lg:rounded-full lg:border-white/[0.10] lg:bg-white/[0.04] lg:text-[#F5F2E9]"
              href={messagesHref}
            >
              <MessageIcon />
            </Link>
            <NotificationBell href={notificationsHref} />
            <div className="hidden h-11 w-11 place-items-center rounded-full border border-[#00D4FF]/45 bg-[#00D4FF]/14 text-sm font-bold text-[#C9FBFF] lg:grid lg:border-[#FFD700]/30 lg:bg-[#FFD700]/15 lg:text-[#FFD700]">
              {getInitials(safeDisplayName)}
            </div>
            <div className="hidden sm:block">
              <p className="text-sm font-semibold text-white lg:text-[#F5F2E9]">
                {safeDisplayName}
              </p>
              <p className="text-xs text-white/72 lg:text-[#B8B3A7]">
                {roleLabel}
              </p>
            </div>
            <span className="hidden text-[#C9FBFF] sm:block lg:text-[#FFD700]">
              <ChevronIcon />
            </span>
            <form action={logout}>
              <button
                className="hidden min-h-10 rounded-lg border border-white/25 px-3 py-2 text-xs font-semibold text-white transition hover:bg-white hover:text-[#182CFF] lg:inline-flex lg:items-center lg:border-[#FFD700]/35 lg:text-[#FFD700] lg:hover:bg-[#FFD700] lg:hover:text-black"
                type="submit"
              >
                Logout
              </button>
            </form>
          </div>
        </div>
      </div>
    </header>
  );
}
