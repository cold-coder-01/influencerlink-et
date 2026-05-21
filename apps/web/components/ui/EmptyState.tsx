import type { ReactNode } from "react";
import { GlassCard } from "./GlassCard";

type EmptyStateProps = {
  title: string;
  description: string;
  icon?: ReactNode;
  action?: ReactNode;
};

export function EmptyState({
  title,
  description,
  icon,
  action,
}: EmptyStateProps) {
  return (
    <GlassCard className="p-8 text-center">
      {icon ? (
        <div className="mx-auto mb-5 grid h-12 w-12 place-items-center rounded-2xl border border-[#00D4FF]/40 bg-[#00D4FF]/12 text-[#C9FBFF] lg:border-[#FFD700]/30 lg:bg-[#FFD700]/10 lg:text-[#FFD700]">
          {icon}
        </div>
      ) : null}
      <h2 className="text-2xl font-bold text-white lg:text-[#F5F2E9]">{title}</h2>
      <p className="mx-auto mt-3 max-w-xl text-sm leading-6 text-white/72 lg:text-[#B8B3A7]">
        {description}
      </p>
      {action ? <div className="mt-6">{action}</div> : null}
    </GlassCard>
  );
}
