import type { SelectHTMLAttributes } from "react";
import { cn } from "@/lib/cn";

type SelectInputProps = SelectHTMLAttributes<HTMLSelectElement>;

export function SelectInput({ className, ...props }: SelectInputProps) {
  return (
    <select
      className={cn(
        "min-h-11 w-full rounded-xl border border-white/[0.18] bg-[#050B3D]/60 px-4 py-3 text-base text-white outline-none transition focus:border-[#00D4FF]/70 focus:ring-2 focus:ring-[#00D4FF]/15 sm:text-sm lg:border-white/[0.10] lg:bg-[#10100d] lg:text-[#F5F2E9] lg:focus:border-[#FFD700]/60 lg:focus:ring-0",
        className,
      )}
      {...props}
    />
  );
}
