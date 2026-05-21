import Link from "next/link";
import type { ReactNode } from "react";

type BackLinkProps = {
  href: string;
  children: ReactNode;
};

export function BackLink({ href, children }: BackLinkProps) {
  return (
    <Link
      className="inline-flex text-sm font-semibold text-white/72 transition hover:text-[#00D4FF] lg:text-[#B8B3A7] lg:hover:text-[#FFD700]"
      href={href}
    >
      &larr; {children}
    </Link>
  );
}
