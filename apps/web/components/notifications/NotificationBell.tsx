"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

type NotificationBellProps = {
  href: string;
};

function BellIcon() {
  return (
    <svg aria-hidden="true" className="h-5 w-5" fill="none" viewBox="0 0 24 24">
      <path
        d="M18 9a6 6 0 0 0-12 0c0 7-3 7-3 9h18c0-2-3-2-3-9ZM10 21h4"
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="1.8"
      />
    </svg>
  );
}

export function NotificationBell({ href }: NotificationBellProps) {
  const [count, setCount] = useState(0);

  useEffect(() => {
    let cancelled = false;

    async function loadUnreadCount() {
      try {
        const response = await fetch("/api/notifications?unreadOnly=true&limit=5", {
          cache: "no-store",
        });
        const payload = (await response.json()) as {
          success?: boolean;
          data?: unknown[];
        };

        if (!cancelled) {
          setCount(response.ok && payload.success ? payload.data?.length ?? 0 : 0);
        }
      } catch {
        if (!cancelled) setCount(0);
      }
    }

    void loadUnreadCount();

    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <Link
      aria-label="Notifications"
      className="relative grid h-11 w-11 place-items-center rounded-2xl border border-white/[0.18] bg-white/[0.09] text-white shadow-[0_12px_34px_rgba(1,10,45,0.18)] sm:h-12 sm:w-12 lg:h-10 lg:w-10 lg:rounded-full lg:border-white/[0.10] lg:bg-white/[0.04] lg:text-[#F5F2E9]"
      href={href}
    >
      <BellIcon />
      {count > 0 ? (
        <span className="absolute -right-1 -top-1 grid h-5 min-w-5 place-items-center rounded-full bg-[#00D4FF] px-1 text-[10px] font-bold text-[#050B3D] lg:bg-[#FFD700] lg:text-black">
          {count > 9 ? "9+" : count}
        </span>
      ) : null}
    </Link>
  );
}
