import type { ReactNode } from "react";
import { cn } from "@/lib/cn";

type PageHeaderProps = {
  title: string;
  subtitle: string;
  eyebrow?: string;
  actions?: ReactNode;
  className?: string;
};

export function PageHeader({
  title,
  subtitle,
  eyebrow,
  actions,
  className,
}: PageHeaderProps) {
  return (
    <section
      className={cn(
        "relative overflow-hidden rounded-2xl border border-white/20 bg-[radial-gradient(circle_at_18%_10%,rgba(0,212,255,0.38),transparent_30%),radial-gradient(circle_at_88%_18%,rgba(255,255,255,0.18),transparent_26%),linear-gradient(135deg,rgba(24,44,255,0.92),rgba(5,11,61,0.92)_72%)] p-5 shadow-[0_24px_80px_rgba(0,0,0,0.22)] backdrop-blur-xl sm:rounded-[24px] sm:p-8 lg:border-white/[0.10] lg:bg-[radial-gradient(circle_at_82%_18%,rgba(255,215,0,0.20),transparent_30%),linear-gradient(135deg,#11110e,#050505_68%)] lg:shadow-[0_24px_80px_rgba(0,0,0,0.35)]",
        className,
      )}
    >
      <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
        <div className="max-w-3xl">
          {eyebrow ? (
            <p className="mb-4 inline-flex max-w-full rounded-full border border-[#00D4FF]/45 bg-[#00D4FF]/12 px-3 py-1 text-xs font-semibold uppercase tracking-[0.14em] text-[#C9FBFF] sm:tracking-[0.18em] lg:border-[#FFD700]/30 lg:bg-[#FFD700]/10 lg:text-[#FFD700]">
              {eyebrow}
            </p>
          ) : null}
          <h1 className="text-3xl font-semibold tracking-normal text-white sm:text-5xl lg:text-[#F5F2E9]">
            {title}
          </h1>
          <p className="mt-5 max-w-2xl text-sm leading-7 text-white/72 sm:text-base lg:text-[#B8B3A7]">
            {subtitle}
          </p>
        </div>
        {actions ? <div className="flex w-full flex-wrap gap-3 sm:w-auto">{actions}</div> : null}
      </div>
    </section>
  );
}
