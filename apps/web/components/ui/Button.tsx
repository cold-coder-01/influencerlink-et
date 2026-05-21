import Link from "next/link";
import type { ButtonHTMLAttributes, ReactNode } from "react";
import { cn } from "@/lib/cn";

type ButtonVariant = "primary" | "secondary" | "ghost" | "danger";
type ButtonSize = "sm" | "md" | "lg";

const variantClasses: Record<ButtonVariant, string> = {
  danger:
    "border border-[#E63746]/40 bg-[#E63746]/12 text-[#FF8B95] hover:border-[#FF8B95]/60 hover:bg-[#E63746]/20",
  ghost: "text-white/72 hover:bg-white/[0.10] hover:text-[#00D4FF] lg:text-[#B8B3A7] lg:hover:bg-white/[0.05] lg:hover:text-[#FFD700]",
  primary: "bg-white text-[#182CFF] shadow-[0_16px_36px_rgba(0,0,0,0.18)] hover:bg-[#EAFBFF] lg:bg-[#FFD700] lg:text-[#121212] lg:shadow-none lg:hover:bg-[#E6C200]",
  secondary:
    "border border-white/[0.22] bg-white/[0.10] text-white hover:border-[#00D4FF]/55 hover:text-[#C9FBFF] lg:border-white/[0.12] lg:bg-white/[0.06] lg:text-[#F5F2E9] lg:hover:border-[#FFD700]/40 lg:hover:text-[#FFD700]",
};

const sizeClasses: Record<ButtonSize, string> = {
  lg: "min-h-12 rounded-xl px-5 py-3 text-sm",
  md: "min-h-11 rounded-xl px-4 py-3 text-sm",
  sm: "min-h-10 rounded-xl px-3 py-2 text-xs",
};

export function buttonClasses({
  variant = "primary",
  size = "md",
  className,
}: {
  variant?: ButtonVariant;
  size?: ButtonSize;
  className?: string;
} = {}) {
  return cn(
    "inline-flex touch-manipulation items-center justify-center text-center font-bold transition disabled:cursor-not-allowed disabled:opacity-55",
    variantClasses[variant],
    sizeClasses[size],
    className,
  );
}

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: ButtonVariant;
  size?: ButtonSize;
};

export function Button({
  variant = "primary",
  size = "md",
  className,
  ...props
}: ButtonProps) {
  return (
    <button
      className={buttonClasses({ variant, size, className })}
      {...props}
    />
  );
}

type ButtonLinkProps = {
  href: string;
  children: ReactNode;
  variant?: ButtonVariant;
  size?: ButtonSize;
  className?: string;
};

export function ButtonLink({
  href,
  children,
  variant = "primary",
  size = "md",
  className,
}: ButtonLinkProps) {
  return (
    <Link className={buttonClasses({ variant, size, className })} href={href}>
      {children}
    </Link>
  );
}
