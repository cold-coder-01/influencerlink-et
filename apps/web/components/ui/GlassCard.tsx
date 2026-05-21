import type { ComponentPropsWithoutRef, ElementType, ReactNode } from "react";
import { cn } from "@/lib/cn";

type GlassCardProps<T extends ElementType = "section"> = {
  as?: T;
  children: ReactNode;
  className?: string;
  hover?: boolean;
} & Omit<ComponentPropsWithoutRef<T>, "as" | "children" | "className">;

export function GlassCard<T extends ElementType = "section">({
  as,
  children,
  className,
  hover = false,
  ...props
}: GlassCardProps<T>) {
  const Component = as || "section";

  return (
    <Component
      className={cn(
        "mobile-glass-card rounded-2xl lg:rounded-[24px] lg:border-white/[0.10] lg:bg-white/[0.06] lg:shadow-[0_24px_80px_rgba(0,0,0,0.25)]",
        hover &&
          "transition duration-300 hover:-translate-y-0.5 hover:border-[#00D4FF]/50 lg:hover:border-[#FFD700]/40",
        className,
      )}
      {...props}
    >
      {children}
    </Component>
  );
}
