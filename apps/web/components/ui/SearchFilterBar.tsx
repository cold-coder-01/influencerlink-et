import type { ReactNode } from "react";
import { GlassCard } from "./GlassCard";

type SearchFilterBarProps = {
  children: ReactNode;
};

export function SearchFilterBar({ children }: SearchFilterBarProps) {
  return <GlassCard className="p-4">{children}</GlassCard>;
}
