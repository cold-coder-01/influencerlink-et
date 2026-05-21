import Link from "next/link";
import { AuthFooter } from "@/components/auth/AuthFooter";

function RoleCard({
  title,
  text,
  href,
  button,
}: {
  title: string;
  text: string;
  href: string;
  button: string;
}) {
  return (
    <article className="login-float-card mobile-glass-card rounded-2xl p-5 transition hover:border-[#00D4FF]/50 sm:rounded-[24px] sm:p-8">
      <div className="mb-6 h-1 w-16 rounded-full bg-[#00D4FF]" />
      <h2 className="text-2xl font-black text-white sm:text-3xl">{title}</h2>
      <p className="mt-4 min-h-24 text-base leading-7 text-white/72">{text}</p>
      <Link
        className="login-cta mt-7 inline-flex min-h-12 w-full justify-center rounded-xl bg-white px-5 py-3 text-center text-sm font-black text-[#182CFF] shadow-[0_18px_42px_rgba(0,0,0,0.20)] transition hover:bg-[#EAFBFF]"
        href={href}
      >
        {button}
      </Link>
    </article>
  );
}

export default function SignupPage() {
  return (
    <main className="mobile-app-surface relative min-h-dvh overflow-hidden px-5 py-8 text-white sm:px-8 sm:py-10">
      <div className="mobile-glow absolute -right-20 top-24 h-[480px] w-44 rotate-[18deg] rounded-full bg-[#00D4FF]/35 blur-3xl" />
      <div className="mobile-app-grid absolute inset-0 opacity-[0.12]" />
      <div className="absolute bottom-20 right-[-10rem] h-80 w-[30rem] rounded-[50%] border border-white/20" />
      <section className="relative mx-auto flex min-h-[calc(100dvh-64px)] max-w-6xl flex-col justify-center">
        <Link className="mb-8 w-fit text-sm font-semibold text-[#C9FBFF]" href="/login">
          Back to sign in
        </Link>
        <div className="max-w-3xl">
          <p className="mb-4 inline-flex rounded-full border border-[#00D4FF]/45 bg-[#00D4FF]/12 px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] text-[#C9FBFF]">
            Account Type
          </p>
          <h1 className="text-4xl font-black tracking-normal text-white sm:text-6xl">
            Join <span className="login-hero-shimmer bg-gradient-to-r from-[#7CF7FF] via-[#00D4FF] to-white bg-clip-text text-transparent">InfluencerLink ET</span>
          </h1>
          <p className="mt-5 max-w-2xl text-base leading-7 text-white/72">
            Choose how you want to use Ethiopia&apos;s B2B influencer marketplace.
          </p>
        </div>

        <div className="mt-10 grid gap-5 lg:grid-cols-2">
          <RoleCard
            button="Continue as Business Owner"
            href="/signup/business"
            text="Find suitable influencers, launch campaigns, and measure ROI across your preferred platforms."
            title="Business Owner"
          />
          <RoleCard
            button="Continue as Influencer"
            href="/signup/influencer"
            text="Create your professional profile, showcase your audience, and receive business partnership opportunities."
            title="Influencer"
          />
        </div>
      </section>
      <AuthFooter />
    </main>
  );
}
