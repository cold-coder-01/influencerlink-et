import type { ReactNode } from "react";

type FormFieldProps = {
  label: string;
  error?: string;
  helper?: string;
  children: ReactNode;
};

export function FormField({ label, error, helper, children }: FormFieldProps) {
  return (
    <label className="block">
      <span className="text-sm font-semibold text-white lg:text-[#F5F2E9]">{label}</span>
      <div className="mt-2">{children}</div>
      {helper ? <p className="mt-2 text-xs text-white/70 lg:text-[#B8B3A7]">{helper}</p> : null}
      {error ? <p className="mt-2 text-sm font-semibold text-[#E63746]">{error}</p> : null}
    </label>
  );
}
