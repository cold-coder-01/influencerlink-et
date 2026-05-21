import type { ReactNode } from "react";
import { getCampaignStatusLabel } from "@/lib/campaign-lifecycle";
import { getCampaignStatusStyle } from "@/lib/campaign-utils";
import { cn } from "@/lib/cn";

type BadgeTone = "gold" | "green" | "blue" | "red" | "gray";

const toneClasses: Record<BadgeTone, string> = {
  blue: "border-[#00D4FF]/45 bg-[#00D4FF]/12 text-[#C9FBFF] lg:border-[#3AA2E3]/35 lg:bg-[#3AA2E3]/10 lg:text-[#8FD3FF]",
  gold: "border-white/28 bg-white/12 text-white lg:border-[#FFD700]/35 lg:bg-[#FFD700]/10 lg:text-[#FFD700]",
  gray: "border-white/[0.20] bg-white/[0.08] text-white/72 lg:border-white/[0.14] lg:bg-white/[0.06] lg:text-[#B8B3A7]",
  green: "border-[#32D583]/40 bg-[#32D583]/12 text-[#9DFFCA] lg:border-[#45B36B]/35 lg:bg-[#45B36B]/10 lg:text-[#45B36B]",
  red: "border-[#E63746]/35 bg-[#E63746]/10 text-[#FF8B95]",
};

type StatusBadgeProps = {
  children?: ReactNode;
  label?: string;
  status?: string;
  tone?: BadgeTone;
  className?: string;
};

export function StatusBadge({
  children,
  label,
  status,
  tone = "gray",
  className,
}: StatusBadgeProps) {
  return (
    <span
      className={cn(
        "inline-flex rounded-full border px-3 py-1 text-xs font-bold capitalize",
        status ? getCampaignStatusStyle(status) : toneClasses[tone],
        className,
      )}
    >
      {children ?? label ?? (status ? getCampaignStatusLabel(status) : status)}
    </span>
  );
}
