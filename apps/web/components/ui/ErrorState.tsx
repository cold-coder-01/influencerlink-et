import type { ReactNode } from "react";
import { GlassCard } from "./GlassCard";

type ErrorStateProps = {
  title: string;
  description: string;
  action?: ReactNode;
};

export function ErrorState({ title, description, action }: ErrorStateProps) {
  return (
    <GlassCard className="border-[#00D4FF]/35 p-8 text-center lg:border-[#FFD700]/30">
      <p className="text-sm font-semibold uppercase tracking-[0.16em] text-[#C9FBFF] lg:text-[#FFD700]">
        Attention Required
      </p>
      <h2 className="mt-3 text-2xl font-bold text-white lg:text-[#F5F2E9]">{title}</h2>
      <p className="mx-auto mt-3 max-w-xl text-sm leading-6 text-white/72 lg:text-[#B8B3A7]">
        {description}
      </p>
      {action ? <div className="mt-6">{action}</div> : null}
    </GlassCard>
  );
}
