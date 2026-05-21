import type { ReactNode } from "react";
import { cn } from "@/lib/cn";

type KpiTone = "gold" | "green" | "neutral" | "danger";

const toneClasses: Record<KpiTone, string> = {
  danger: "text-[#FFB4BA] lg:text-[#FF8B95]",
  gold: "text-white lg:text-[#FFD700]",
  green: "text-[#9DFFCA] lg:text-[#45B36B]",
  neutral: "text-white/72 lg:text-[#B8B3A7]",
};

type KpiCardProps = {
  label: string;
  value: string;
  helper?: ReactNode;
  trend?: ReactNode;
  icon?: ReactNode;
  tone?: KpiTone;
  className?: string;
};

export function KpiCard({
  label,
  value,
  helper,
  trend,
  icon,
  tone = "gold",
  className,
}: KpiCardProps) {
  return (
    <article
      className={cn(
        "login-float-card mobile-glass-card min-h-28 rounded-2xl p-3 lg:min-h-0 lg:border-white/[0.10] lg:bg-white/[0.06] lg:p-5 lg:shadow-[0_24px_80px_rgba(0,0,0,0.24)]",
        className,
      )}
    >
      <div className="flex items-start justify-between gap-2">
        <p className="text-[11px] font-semibold uppercase leading-4 text-white/70 lg:text-xs lg:text-[#B8B3A7]">
          {label}
        </p>
        {icon ? (
          <div className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-[#1D4DFF]/28 text-[#9CEFFF] lg:h-auto lg:w-auto lg:bg-transparent lg:text-[#FFD700]">
            {icon}
          </div>
        ) : null}
      </div>
      <p
        className={cn(
          "mt-2 break-words text-[1.55rem] font-bold leading-none lg:mt-3 lg:text-3xl",
          toneClasses[tone],
        )}
      >
        {value}
      </p>
      {helper ? (
        <div className="mt-1 text-[11px] leading-4 text-white/70 lg:mt-2 lg:text-xs lg:text-[#B8B3A7]">
          {helper}
        </div>
      ) : null}
      {trend ? (
        <div className="mt-2 text-xs font-semibold lg:mt-3 lg:text-sm">{trend}</div>
      ) : null}
    </article>
  );
}
