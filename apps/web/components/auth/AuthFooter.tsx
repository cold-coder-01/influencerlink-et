import Link from "next/link";

export function AuthFooter() {
  return (
    <footer className="relative z-20 px-4 pb-[max(1.25rem,env(safe-area-inset-bottom))] pt-5 text-center text-xs text-white/68 sm:px-6">
      <div className="mx-auto inline-flex max-w-full flex-wrap items-center justify-center gap-x-2 gap-y-1 rounded-full border border-white/[0.12] bg-white/[0.06] px-4 py-2.5 shadow-[0_16px_44px_rgba(0,0,0,0.16),inset_0_1px_0_rgba(255,255,255,0.10)] backdrop-blur-xl">
        <span>© 2026 InfluencerLink ET</span>
        <span className="text-[#00D4FF]/75" aria-hidden="true">
          ·
        </span>
        <Link
          className="font-semibold text-white transition hover:text-[#00D4FF]"
          href="/privacy"
        >
          Privacy
        </Link>
        <span className="text-[#00D4FF]/75" aria-hidden="true">
          ·
        </span>
        <Link
          className="font-semibold text-white transition hover:text-[#00D4FF]"
          href="/terms"
        >
          Terms
        </Link>
      </div>
    </footer>
  );
}
