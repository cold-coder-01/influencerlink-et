import type { InputHTMLAttributes } from "react";
import { cn } from "@/lib/cn";

type TextInputProps = InputHTMLAttributes<HTMLInputElement>;

export function TextInput({ className, ...props }: TextInputProps) {
  return (
    <input
      className={cn(
        "min-h-11 w-full rounded-xl border border-white/[0.18] bg-white/[0.10] px-4 py-3 text-base text-white outline-none transition placeholder:text-white/50 focus:border-[#00D4FF]/70 focus:ring-2 focus:ring-[#00D4FF]/15 sm:text-sm lg:border-white/[0.10] lg:bg-black/25 lg:text-[#F5F2E9] lg:placeholder:text-[#B8B3A7] lg:focus:border-[#FFD700]/60 lg:focus:ring-0",
        className,
      )}
      {...props}
    />
  );
}
