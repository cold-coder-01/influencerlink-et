import Link from "next/link";
import { AuthFooter } from "@/components/auth/AuthFooter";

export default function PrivacyPage() {
  return (
    <main className="mobile-app-surface relative flex min-h-dvh flex-col overflow-hidden px-5 py-8 text-white sm:px-8">
      <div className="mobile-glow pointer-events-none absolute -right-20 top-24 h-[480px] w-44 rotate-[18deg] rounded-full bg-[#00D4FF]/35 blur-3xl" />
      <div className="mobile-app-grid pointer-events-none absolute inset-0 opacity-[0.12]" />
      <section className="relative z-10 mx-auto flex w-full max-w-3xl flex-1 flex-col justify-center">
        <Link className="mb-8 w-fit text-sm font-semibold text-[#C9FBFF]" href="/login">
          Back to sign in
        </Link>
        <div className="mobile-glass-card rounded-2xl p-6 sm:rounded-[24px] sm:p-8">
          <p className="mb-4 inline-flex rounded-full border border-[#00D4FF]/45 bg-[#00D4FF]/12 px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] text-[#C9FBFF]">
            Legal
          </p>
          <h1 className="text-3xl font-black text-white sm:text-5xl">
            Privacy Policy
          </h1>
          <p className="mt-5 text-base leading-7 text-white/72">
            Full legal policy coming soon. For now, contact the InfluencerLink ET team for details.
          </p>
        </div>
      </section>
      <AuthFooter />
    </main>
  );
}
