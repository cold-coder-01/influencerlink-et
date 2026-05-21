"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import type { FormEvent, ReactNode } from "react";
import { useEffect, useState } from "react";
import { AuthFooter } from "@/components/auth/AuthFooter";

type IconProps = {
  className?: string;
};

type Role = "business" | "influencer";
type AuthMode = "login" | "signup";
type FormStatus = {
  message: string;
  tone: "success" | "error" | "info";
};

type IndustryOption = {
  id: number;
  name: string;
};

type TelegramLoginFlow = {
  code: string;
  botLink: string;
};

const features = [
  { label: "Trusted & Verified", icon: ShieldIcon },
  { label: "Secure Payments", icon: HandshakeIcon },
  { label: "Local Support", icon: GlobeIcon },
];

const platforms = ["TikTok", "Instagram", "YouTube", "Telegram"];

function MailIcon({ className }: IconProps) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path d="M4.5 6.5h15v11h-15v-11Z" stroke="currentColor" strokeWidth="1.7" />
      <path d="m5.2 7.2 6.8 5.2 6.8-5.2" stroke="currentColor" strokeWidth="1.7" />
    </svg>
  );
}

function LockIcon({ className }: IconProps) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path d="M7 10.5h10v8H7v-8Z" stroke="currentColor" strokeWidth="1.7" />
      <path d="M9 10.5V8a3 3 0 0 1 6 0v2.5" stroke="currentColor" strokeWidth="1.7" />
      <path d="M12 14v1.8" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" />
    </svg>
  );
}

function EyeIcon({ className }: IconProps) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path d="M3.5 12s3-5 8.5-5 8.5 5 8.5 5-3 5-8.5 5-8.5-5-8.5-5Z" stroke="currentColor" strokeWidth="1.7" />
      <circle cx="12" cy="12" r="2.4" stroke="currentColor" strokeWidth="1.7" />
    </svg>
  );
}

function BriefcaseIcon({ className }: IconProps) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path d="M4.5 8.5h15v10h-15v-10Z" stroke="currentColor" strokeWidth="1.7" />
      <path d="M9 8.5V6h6v2.5M4.5 12h15M10.5 12v2h3v-2" stroke="currentColor" strokeWidth="1.7" />
    </svg>
  );
}

function UserIcon({ className }: IconProps) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <circle cx="12" cy="8" r="3.5" stroke="currentColor" strokeWidth="1.7" />
      <path d="M5.5 19c.8-3.2 3.1-5 6.5-5s5.7 1.8 6.5 5" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" />
    </svg>
  );
}

function ArrowRightIcon({ className }: IconProps) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path d="M5 12h14M13 6l6 6-6 6" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function RocketIcon({ className }: IconProps) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path d="M13.5 5.5c1.8-1.7 4.1-2.3 6-2-0.3 2-1 4.3-2.6 6l-5.7 5.7-3.4-3.4 5.7-6.3Z" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round" />
      <path d="M8.1 12H5.3l-2 3.4 4.1-.6M12 15.9v2.8l-3.4 2 .6-4.1M14.7 8.8h.1" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function GlobeIcon({ className }: IconProps) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <circle cx="12" cy="12" r="8.5" stroke="currentColor" strokeWidth="1.7" />
      <path d="M3.5 12h17M12 3.5c2.2 2.4 3.2 5.2 3.2 8.5s-1 6.1-3.2 8.5M12 3.5C9.8 5.9 8.8 8.7 8.8 12s1 6.1 3.2 8.5" stroke="currentColor" strokeWidth="1.7" />
    </svg>
  );
}

function ShieldIcon({ className }: IconProps) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path d="M12 3.8 19 6v5.2c0 4.1-2.7 7.5-7 9-4.3-1.5-7-4.9-7-9V6l7-2.2Z" stroke="currentColor" strokeWidth="1.7" />
      <path d="m8.8 12.1 2.1 2.1 4.5-5" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function TrendingIcon({ className }: IconProps) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path d="M5 17h14M7 15v-4M12 15V8M17 15V6" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" />
      <path d="m14 6 3-2 2.5 3" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function HandshakeIcon({ className }: IconProps) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path d="m7.5 12.2 3.1 3.1c.9.9 2.1.9 3 0l3-3M9.5 10l2-2 2.1 2.1c.8.8 1.9.8 2.7.1l.5-.5" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M4.5 13.5 7 16l2-2M19.5 13.5 17 16l-2-2M7.5 8.5l2-2h5l2 2" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function GoogleIcon({ className }: IconProps) {
  return (
    <svg className={className} viewBox="0 0 24 24" aria-hidden="true">
      <path
        fill="#4285F4"
        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09Z"
      />
      <path
        fill="#34A853"
        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23Z"
      />
      <path
        fill="#FBBC05"
        d="M5.84 14.1c-.22-.66-.35-1.36-.35-2.1s.13-1.44.35-2.1V7.06H2.18A10.96 10.96 0 0 0 1 12c0 1.77.42 3.45 1.18 4.94l3.66-2.84Z"
      />
      <path
        fill="#EA4335"
        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06L5.84 9.9C6.71 7.31 9.14 5.38 12 5.38Z"
      />
    </svg>
  );
}

function TikTokIcon({ className }: IconProps) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <path d="M16.8 3.2c.4 2.3 1.8 3.9 4 4.1v4.1c-1.6 0-3-.5-4-1.3v5.9c0 3.4-2.4 5.8-5.9 5.8-3.3 0-5.8-2.3-5.8-5.4 0-3.4 2.7-5.7 6.2-5.5v4.1c-1.3-.2-2.2.4-2.2 1.4 0 .9.7 1.5 1.7 1.5 1.1 0 1.8-.7 1.8-2V3.2h4.2Z" />
    </svg>
  );
}

function InstagramIcon({ className }: IconProps) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <rect x="3.2" y="3.2" width="17.6" height="17.6" rx="5.2" stroke="currentColor" strokeWidth="2" />
      <circle cx="12" cy="12" r="4.2" stroke="currentColor" strokeWidth="2" />
      <circle cx="17.2" cy="6.8" r="1.2" fill="currentColor" />
    </svg>
  );
}

function YouTubeIcon({ className }: IconProps) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <path d="M21.3 7.4a3 3 0 0 0-2.1-2.1C17.4 4.8 12 4.8 12 4.8s-5.4 0-7.2.5a3 3 0 0 0-2.1 2.1A31 31 0 0 0 2.2 12c0 1.5.1 3.2.5 4.6a3 3 0 0 0 2.1 2.1c1.8.5 7.2.5 7.2.5s5.4 0 7.2-.5a3 3 0 0 0 2.1-2.1c.4-1.4.5-3.1.5-4.6s-.1-3.2-.5-4.6ZM10 15.4V8.6l5.8 3.4-5.8 3.4Z" />
    </svg>
  );
}

function AppleIcon({ className }: IconProps) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <path d="M16.8 12.7c0-2.4 2-3.5 2.1-3.6-1.1-1.7-2.9-1.9-3.5-1.9-1.5-.2-2.9.9-3.6.9-.8 0-1.9-.9-3.1-.9-1.6 0-3.1.9-3.9 2.4-1.7 2.9-.4 7.2 1.2 9.6.8 1.2 1.8 2.5 3.1 2.4 1.2 0 1.7-.8 3.2-.8s1.9.8 3.2.8c1.3 0 2.2-1.2 3-2.4.9-1.4 1.3-2.7 1.3-2.8 0 0-2.9-1.1-3-3.7ZM14.4 5.6c.7-.8 1.1-1.9 1-3-.9 0-2 .6-2.7 1.4-.6.7-1.1 1.9-1 2.9 1 .1 2-.5 2.7-1.3Z" />
    </svg>
  );
}

function TelegramIcon({ className }: IconProps) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <path d="M21.7 4.4 18.5 19c-.2 1.1-.9 1.4-1.9.9l-5.1-3.8-2.5 2.4c-.3.3-.5.5-1 .5l.4-5.2 9.5-8.6c.4-.4-.1-.6-.6-.2L5.5 12.5.4 10.9c-1.1-.3-1.1-1.1.2-1.6L20.5 1.6c.9-.3 1.7.2 1.2 2.8Z" />
    </svg>
  );
}

function SocialButton({
  children,
  href,
  icon,
  onClick,
}: {
  children: ReactNode;
  href?: string;
  icon: ReactNode;
  onClick?: () => void;
}) {
  const className =
    "flex min-h-14 w-full items-center justify-center gap-4 rounded-xl border border-white/[0.14] bg-white/[0.08] px-5 text-base font-semibold text-white shadow-[inset_0_1px_0_rgba(255,255,255,0.08)] transition hover:border-[#00D4FF]/55 hover:bg-[#00D4FF]/10 active:scale-[0.99]";
  const content = (
    <>
      <span className="grid size-7 place-items-center">{icon}</span>
      <span>{children}</span>
    </>
  );

  if (href) {
    return (
      <a className={className} href={href}>
        {content}
      </a>
    );
  }

  return (
    <button
      type="button"
      onClick={onClick}
      className={className}
    >
      {content}
    </button>
  );
}

function LogoMark() {
  return (
    <div className="relative grid size-12 place-items-center">
      <div className="absolute inset-1 rotate-45 rounded-xl border-[3px] border-[#7CF7FF]" />
      <div className="absolute inset-3 -rotate-45 rounded-lg border-[3px] border-white" />
      <div className="h-7 w-2.5 rotate-45 rounded-full bg-gradient-to-b from-white to-[#00D4FF]" />
      <div className="absolute h-7 w-2.5 -rotate-45 rounded-full bg-gradient-to-b from-white to-[#00D4FF]" />
    </div>
  );
}

function PlatformChip({
  label,
  tone,
  icon,
}: {
  label: string;
  tone: string;
  icon: ReactNode;
}) {
  return (
    <span className="login-chip-float inline-flex min-h-12 items-center gap-2 rounded-full border border-white/20 bg-white/10 px-4 text-sm font-bold text-white shadow-[inset_0_1px_0_rgba(255,255,255,0.22),0_12px_30px_rgba(0,0,0,0.16)] backdrop-blur-xl">
      <span className={`grid size-8 place-items-center rounded-full ${tone}`}>{icon}</span>
      {label}
    </span>
  );
}

function readImageFile(file: File) {
  return new Promise<string>((resolve, reject) => {
    const reader = new FileReader();

    reader.onload = () => {
      const result = typeof reader.result === "string" ? reader.result : "";
      const [, base64 = ""] = result.split(",");

      resolve(base64);
    };
    reader.onerror = () => reject(new Error("Could not read image file."));
    reader.readAsDataURL(file);
  });
}

function HeroPanel() {
  const platformStyles = [
    "bg-black text-white",
    "bg-gradient-to-br from-[#FF3B30] via-[#FF2DAA] to-[#FFC400] text-white",
    "bg-[#FF3B30] text-white",
    "bg-[#2CA5E0] text-white",
  ];
  const platformIcons = [
    <TikTokIcon key="tiktok" className="size-5" />,
    <InstagramIcon key="instagram" className="size-5" />,
    <YouTubeIcon key="youtube" className="size-5" />,
    <TelegramIcon key="telegram" className="size-5" />,
  ];

  return (
    <section className="relative overflow-hidden border-b border-white/15 bg-[#1200FF] px-5 pb-8 pt-[max(1.25rem,env(safe-area-inset-top))] text-white sm:px-8 lg:min-h-dvh lg:border-b-0 lg:border-r lg:border-white/15 lg:px-10 lg:py-9">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_18%_10%,rgba(0,212,255,0.48),transparent_28%),radial-gradient(circle_at_88%_28%,rgba(255,255,255,0.24),transparent_24%),radial-gradient(circle_at_62%_88%,rgba(0,212,255,0.24),transparent_28%),linear-gradient(155deg,#182CFF_0%,#1200FF_42%,#050B3D_100%)]" />
      <div className="login-light-streak absolute -right-20 top-24 h-[480px] w-44 rotate-[18deg] rounded-full bg-[#00D4FF]/40 blur-3xl" />
      <div className="absolute inset-0 opacity-[0.16] [background-image:radial-gradient(rgba(255,255,255,.75)_1px,transparent_1px)] [background-size:18px_18px]" />
      <div className="absolute bottom-28 right-[-12rem] h-96 w-[34rem] rounded-[50%] border border-[#00D4FF]/45" />
      <div className="absolute bottom-10 right-[-9rem] h-80 w-[30rem] rounded-[50%] border border-white/20" />

      <div className="relative z-10 flex items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="grid size-12 place-items-center rounded-2xl border border-white/20 bg-white/10 shadow-[0_0_28px_rgba(0,212,255,0.45)] backdrop-blur">
            <LogoMark />
          </div>
          <p className="text-xl font-black tracking-tight min-[390px]:text-2xl">
            InfluencerLink <span className="text-[#00D4FF]">ET</span>
          </p>
        </div>
        <a
          className="touch-target grid place-items-center rounded-2xl border border-white/20 bg-white/10 text-white backdrop-blur transition active:scale-95"
          href="#login-form"
          aria-label="Go to sign in"
        >
          <span className="relative block h-4 w-6">
            <span className="absolute left-0 top-0 h-0.5 w-6 rounded bg-white" />
            <span className="absolute left-0 top-2 h-0.5 w-6 rounded bg-white" />
            <span className="absolute left-0 top-4 h-0.5 w-6 rounded bg-white" />
          </span>
        </a>
      </div>

      <div className="relative z-10 mt-9 max-w-3xl">
        <p className="inline-flex items-center gap-2 rounded-full border border-[#7CF7FF]/45 bg-white/10 px-3.5 py-2 text-sm font-semibold text-white shadow-[inset_0_1px_0_rgba(255,255,255,0.2)] backdrop-blur-xl">
          <span className="grid size-7 place-items-center rounded-full bg-[#00D4FF] text-base">ET</span>
          Ethiopia&apos;s #1 Influencer Marketplace
        </p>

        <h1 className="mt-7 max-w-[11ch] text-[clamp(3.2rem,16vw,5.9rem)] font-black leading-[0.92] tracking-normal text-white sm:max-w-[12ch] lg:text-[clamp(4rem,7vw,6.4rem)]">
          Grow with the{" "}
          <span className="login-hero-shimmer block bg-gradient-to-r from-[#7CF7FF] via-[#00D4FF] to-white bg-clip-text text-transparent">
            Right Creators
          </span>
        </h1>
        <p className="mt-6 max-w-2xl text-lg leading-8 text-white/78 sm:text-xl">
          Connect your brand with trusted influencers across{" "}
          <span className="font-bold text-[#7CF7FF]">TikTok</span>,{" "}
          <span className="font-bold text-white">Instagram</span>,{" "}
          <span className="font-bold text-[#FF6B61]">YouTube</span> and{" "}
          <span className="font-bold text-[#00D4FF]">Telegram</span>. Real audiences. Real results.
        </p>

        <div className="mt-7 grid gap-3 min-[390px]:grid-cols-2">
          <Link
            className="login-cta inline-flex min-h-14 items-center justify-center gap-3 rounded-2xl bg-white px-5 text-base font-black text-[#182CFF] shadow-[0_18px_42px_rgba(0,0,0,0.24)] transition hover:bg-[#EAFBFF] active:scale-[0.98]"
            href="/signup"
          >
            <RocketIcon className="size-6" />
            Get Started
          </Link>
          <Link
            className="login-cta inline-flex min-h-14 items-center justify-center gap-3 rounded-2xl border border-white/35 bg-white/10 px-5 text-base font-black text-white shadow-[inset_0_1px_0_rgba(255,255,255,0.18)] backdrop-blur transition hover:bg-white/16 active:scale-[0.98]"
            href="/signup/influencer"
          >
            <UserIcon className="size-6" />
            I&apos;m a Creator
          </Link>
        </div>

        <div className="mt-6 flex flex-wrap gap-3">
          {platforms.map((platform, index) => (
            <PlatformChip
              key={platform}
              label={platform}
              tone={platformStyles[index]}
              icon={platformIcons[index]}
            />
          ))}
        </div>
      </div>

      <div className="relative z-10 mt-7 grid gap-4 lg:grid-cols-[0.88fr_1.12fr]">
        <article className="login-float-card rounded-2xl border border-white/20 bg-white/10 p-4 shadow-[0_24px_80px_rgba(0,0,0,0.22)] backdrop-blur-2xl">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-black">Top Creator</h2>
            <span className="text-2xl leading-none text-white/72">...</span>
          </div>
          <div className="mt-4 flex items-center gap-4">
            <div className="grid size-24 shrink-0 place-items-center rounded-full bg-[radial-gradient(circle,#7CF7FF_0_34%,#1B8DFF_35_54%,transparent_55%)] p-2">
              <div className="grid size-full place-items-center rounded-full bg-gradient-to-br from-[#D9F9FF] to-[#317DFF] text-4xl font-black text-[#050B3D]">
                ST
              </div>
            </div>
            <div>
              <p className="text-xl font-black">Selam Tesfaye</p>
              <p className="mt-1 rounded-full bg-[#00D4FF]/22 px-3 py-1 text-xs font-bold text-[#C9FBFF]">Lifestyle</p>
            </div>
          </div>
          <div className="mt-4 grid grid-cols-3 gap-2 text-center">
            {[
              ["125K", "Followers"],
              ["8.7%", "Eng. Rate"],
              ["4.9", "Rating"],
            ].map(([value, label]) => (
              <div key={label} className="rounded-xl border border-white/14 bg-white/10 p-2">
                <p className="text-lg font-black">{value}</p>
                <p className="text-[11px] text-white/68">{label}</p>
              </div>
            ))}
          </div>
        </article>

        <article className="login-float-card login-float-delay rounded-2xl border border-white/20 bg-white/10 p-4 shadow-[0_24px_80px_rgba(0,0,0,0.22)] backdrop-blur-2xl">
          <div className="flex items-center gap-3">
            <div className="grid size-12 place-items-center rounded-2xl bg-[#1B8DFF] text-white">
              <TrendingIcon className="size-7" />
            </div>
            <h2 className="text-lg font-black">Campaign Overview</h2>
          </div>
          <div className="mt-4 grid grid-cols-2 gap-3">
            {[
              ["Active Campaigns", "24", "18%"],
              ["Total Reach", "2.4M", "32%"],
              ["Engagements", "178K", "26%"],
              ["Conversions", "12.6K", "21%"],
            ].map(([label, value, change]) => (
              <div key={label} className="rounded-xl border border-white/14 bg-white/10 p-3">
                <p className="text-xs text-white/70">{label}</p>
                <div className="mt-2 flex items-end justify-between gap-2">
                  <p className="text-2xl font-black">{value}</p>
                  <span className="rounded-full bg-[#32D583]/20 px-2 py-1 text-xs font-bold text-[#9DFFCA]">+{change}</span>
                </div>
              </div>
            ))}
          </div>
          <div className="mt-3 flex items-center gap-3 rounded-xl border border-white/14 bg-[#050B3D]/30 p-3">
            <div className="grid size-12 place-items-center rounded-full bg-[#00D4FF] text-[#050B3D]">
              <GlobeIcon className="size-7" />
            </div>
            <div>
              <p className="font-black">Smart Matching</p>
              <p className="text-sm text-white/70">AI matches brands with high-performing creators in seconds.</p>
            </div>
          </div>
        </article>

        <article className="login-float-card login-float-slow rounded-2xl border border-white/20 bg-white/10 p-4 shadow-[0_24px_80px_rgba(0,0,0,0.22)] backdrop-blur-2xl lg:col-span-2">
          <div className="flex items-center justify-between gap-3">
            <h2 className="text-lg font-black">Performance Over Time</h2>
            <span className="rounded-xl border border-white/15 bg-white/10 px-3 py-1 text-sm text-white/78">Last 7 Days</span>
          </div>
          <div className="mt-4 grid gap-4 sm:grid-cols-[0.32fr_0.68fr] sm:items-end">
            <div>
              <p className="text-4xl font-black text-[#9DFFCA]">+35.6%</p>
              <p className="text-sm text-white/72">vs previous 7 days</p>
            </div>
            <div className="relative h-28 overflow-hidden rounded-xl border border-white/10 bg-[#050B3D]/28">
              <div className="absolute inset-x-0 bottom-0 h-20 bg-gradient-to-t from-[#00D4FF]/50 to-transparent" />
              <svg className="absolute inset-0 h-full w-full" viewBox="0 0 360 112" preserveAspectRatio="none" aria-hidden="true">
                <path d="M0 88 C38 70 46 88 78 56 S134 86 170 52 218 78 252 42 306 56 360 32" fill="none" stroke="#7CF7FF" strokeWidth="5" strokeLinecap="round" />
              </svg>
            </div>
          </div>
        </article>
      </div>

      <div className="relative z-10 mt-5 grid gap-3 rounded-2xl bg-white px-4 py-4 text-[#062078] shadow-[0_16px_42px_rgba(0,0,0,0.18)] sm:grid-cols-3">
        {features.map(({ label, icon: Icon }) => (
          <div key={label} className="flex items-center gap-3">
            <Icon className="size-7 shrink-0 text-[#182CFF]" />
            <p className="text-sm font-black">{label}</p>
          </div>
        ))}
      </div>
    </section>
  );
}

function RoleSelector({ role, onChange }: { role: Role; onChange: (role: Role) => void }) {
  const options = [
    { id: "business" as const, label: "Business Owner", icon: BriefcaseIcon },
    { id: "influencer" as const, label: "Influencer", icon: UserIcon },
  ];

  return (
    <div className="grid grid-cols-2 overflow-hidden rounded-xl border border-white/[0.18] bg-[#050B3D]/45 p-1">
      {options.map(({ id, label, icon: Icon }) => {
        const selected = role === id;
        return (
          <button
            key={id}
            type="button"
            onClick={() => onChange(id)}
            className={`flex min-h-14 items-center justify-center gap-3 rounded-lg px-3 text-sm font-semibold transition sm:text-base ${
              selected
                ? "border border-[#00D4FF] bg-[#00D4FF]/14 text-[#C9FBFF] shadow-[0_0_30px_rgba(0,212,255,0.18)]"
                : "text-white/72 hover:bg-white/[0.08] hover:text-white"
            }`}
          >
            <Icon className="size-6" />
            <span>{label}</span>
          </button>
        );
      })}
    </div>
  );
}

function AuthInput({
  id,
  label,
  type,
  placeholder,
  icon: Icon,
  trailing,
  value,
  onChange,
  autoComplete,
  required,
}: {
  id: string;
  label: string;
  type: string;
  placeholder: string;
  icon: (props: IconProps) => ReactNode;
  trailing?: ReactNode;
  value: string;
  onChange: (value: string) => void;
  autoComplete?: string;
  required?: boolean;
}) {
  return (
    <div>
      <label htmlFor={id} className="text-sm font-medium text-white">
        {label}
      </label>
      <div className="mt-3 flex min-h-14 items-center gap-3 rounded-xl border border-white/[0.18] bg-[#050B3D]/45 px-4 text-white shadow-[inset_0_1px_0_rgba(255,255,255,0.08)] focus-within:border-[#00D4FF]/80 focus-within:ring-2 focus-within:ring-[#00D4FF]/18">
        <Icon className="size-5 shrink-0 text-white/65" />
        <input
          id={id}
          type={type}
          placeholder={placeholder}
          value={value}
          onChange={(event) => onChange(event.target.value)}
          autoComplete={autoComplete}
          required={required}
          className="min-w-0 flex-1 bg-transparent text-base text-white outline-none placeholder:text-white/45"
        />
        {trailing}
      </div>
    </div>
  );
}

function AuthTextarea({
  id,
  label,
  placeholder,
  icon: Icon,
  value,
  onChange,
}: {
  id: string;
  label: string;
  placeholder: string;
  icon: (props: IconProps) => ReactNode;
  value: string;
  onChange: (value: string) => void;
}) {
  return (
    <div>
      <label htmlFor={id} className="text-sm font-medium text-white">
        {label}
      </label>
      <div className="mt-3 flex min-h-28 items-start gap-3 rounded-xl border border-white/[0.18] bg-[#050B3D]/45 px-4 py-4 text-white shadow-[inset_0_1px_0_rgba(255,255,255,0.08)] focus-within:border-[#00D4FF]/80 focus-within:ring-2 focus-within:ring-[#00D4FF]/18">
        <Icon className="mt-1 size-5 shrink-0 text-white/65" />
        <textarea
          id={id}
          placeholder={placeholder}
          value={value}
          onChange={(event) => onChange(event.target.value)}
          className="min-h-20 min-w-0 flex-1 resize-none bg-transparent text-base text-white outline-none placeholder:text-white/45"
        />
      </div>
    </div>
  );
}

function LoginCard() {
  const router = useRouter();
  const [role, setRole] = useState<Role>("business");
  const [authMode, setAuthMode] = useState<AuthMode>("login");
  const [industries, setIndustries] = useState<IndustryOption[]>([]);
  const [status, setStatus] = useState<FormStatus | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isTelegramSubmitting, setIsTelegramSubmitting] = useState(false);
  const [signupImagePreview, setSignupImagePreview] = useState("");
  const [telegramLoginFlow, setTelegramLoginFlow] =
    useState<TelegramLoginFlow | null>(null);
  const [loginForm, setLoginForm] = useState({
    email: "",
    password: "",
  });
  const [signupForm, setSignupForm] = useState({
    name: "",
    email: "",
    companyName: "",
    phone: "",
    industryId: "",
    platform: "",
    handle: "",
    profileImage: "",
    bio: "",
    password: "",
    confirmPassword: "",
  });

  useEffect(() => {
    const error = new URLSearchParams(window.location.search).get("error");

    const errorTimer = error
      ? window.setTimeout(() => {
          setStatus({
            tone: "error",
            message: error,
          });
        }, 0)
      : null;

    async function loadIndustries() {
      try {
        const response = await fetch("/api/auth/signup/industries");
        const payload = (await response.json()) as {
          success?: boolean;
          industries?: IndustryOption[];
          data?: IndustryOption[];
          message?: string;
        };

        if (!response.ok || payload.success === false) {
          throw new Error(payload.message ?? "Unable to load industries.");
        }

        setIndustries(payload.industries ?? payload.data ?? []);
      } catch {
        setIndustries([]);
        setStatus((current) =>
          current ?? {
            tone: "error",
            message: "Unable to load industries from the signup service.",
          },
        );
      }
    }

    loadIndustries();

    return () => {
      if (errorTimer) {
        window.clearTimeout(errorTimer);
      }
    };
  }, []);

  async function handleLogin(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setIsSubmitting(true);
    setStatus(null);

    try {
      const response = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...loginForm, role }),
      });
      const payload = (await response.json()) as {
        message?: string;
        redirectTo?: string;
      };

      if (!response.ok) {
        setStatus({
          tone: "error",
          message: payload.message ?? "Unable to sign in. Check your details.",
        });
        return;
      }

      setStatus({
        tone: "success",
        message: payload.message ?? "Signed in successfully.",
      });
      router.push(payload.redirectTo ?? "/");
    } catch {
      setStatus({
        tone: "error",
        message: "Unable to reach the login service. Confirm the app is running.",
      });
    } finally {
      setIsSubmitting(false);
    }
  }

  async function handleSignup(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (signupForm.password !== signupForm.confirmPassword) {
      setStatus({ tone: "error", message: "Passwords do not match." });
      return;
    }

    setIsSubmitting(true);
    setStatus(null);

    try {
      const response = await fetch("/api/auth/signup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...signupForm,
          role,
          industryId: Number(signupForm.industryId),
        }),
      });
      const payload = (await response.json()) as {
        message?: string;
        redirectTo?: string;
      };

      if (!response.ok) {
        setStatus({
          tone: "error",
          message:
            payload.message ?? "Unable to create account. Please review the form.",
        });
        return;
      }

      setStatus({
        tone: "success",
        message: payload.message ?? "Account created.",
      });
      router.push(payload.redirectTo ?? "/");
    } catch {
      setStatus({
        tone: "error",
        message: "Unable to reach the signup service. Confirm Odoo is online.",
      });
    } finally {
      setIsSubmitting(false);
    }
  }

  async function updateSignupProfileImage(file: File | undefined) {
    if (!file) {
      setSignupForm((form) => ({ ...form, profileImage: "" }));
      setSignupImagePreview("");
      return;
    }

    if (!file.type.startsWith("image/")) {
      setStatus({ tone: "error", message: "Choose an image file for the profile picture." });
      return;
    }

    if (file.size > 2 * 1024 * 1024) {
      setStatus({ tone: "error", message: "Use a profile picture smaller than 2 MB." });
      return;
    }

    try {
      const image = await readImageFile(file);

      setSignupForm((form) => ({ ...form, profileImage: image }));
      setSignupImagePreview(URL.createObjectURL(file));
      setStatus(null);
    } catch {
      setStatus({ tone: "error", message: "Could not read the selected profile picture." });
    }
  }

  async function handleTelegramLogin() {
    setIsTelegramSubmitting(true);
    setStatus(null);

    try {
      const response = await fetch("/api/auth/telegram/start");
      const payload = (await response.json()) as {
        success?: boolean;
        code?: string;
        botLink?: string;
        message?: string;
      };

      if (!response.ok || !payload.code || !payload.botLink) {
        setStatus({
          tone: "error",
          message: payload.message ?? "Unable to start Telegram login.",
        });
        return;
      }

      setTelegramLoginFlow({
        code: payload.code,
        botLink: payload.botLink,
      });
      window.open(payload.botLink, "_blank", "noopener,noreferrer");
      setStatus({
        tone: "info",
        message:
          "Telegram opened. Press Start in the bot, then return here and click Verify Telegram.",
      });
    } catch {
      setStatus({
        tone: "error",
        message: "Unable to reach the Telegram login service.",
      });
    } finally {
      setIsTelegramSubmitting(false);
    }
  }

  async function handleTelegramVerify() {
    if (!telegramLoginFlow) {
      return;
    }

    setIsTelegramSubmitting(true);
    setStatus(null);

    try {
      const response = await fetch("/api/auth/telegram/callback", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code: telegramLoginFlow.code, role }),
      });
      const payload = (await response.json()) as {
        message?: string;
        redirectTo?: string;
      };

      if (!response.ok) {
        setStatus({
          tone: "error",
          message: payload.message ?? "Unable to verify Telegram login.",
        });
        return;
      }

      setStatus({
        tone: "success",
        message: payload.message ?? "Signed in with Telegram.",
      });
      router.push(payload.redirectTo ?? "/");
    } catch {
      setStatus({
        tone: "error",
        message: "Unable to reach the Telegram verification service.",
      });
    } finally {
      setIsTelegramSubmitting(false);
    }
  }

  return (
    <section id="login-form" className="relative flex min-h-dvh scroll-mt-4 items-center justify-center px-4 py-10 sm:px-8 lg:px-12">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_72%_16%,rgba(0,212,255,.26),transparent_30%),radial-gradient(circle_at_20%_84%,rgba(24,44,255,.3),transparent_34%),linear-gradient(180deg,#06105F,#050B3D)]" />
      <div className="relative w-full max-w-xl rounded-2xl border border-white/[0.16] bg-white/[0.08] p-5 shadow-[0_30px_100px_rgba(0,0,0,0.35)] backdrop-blur-2xl sm:rounded-[32px] sm:p-10">
        <div className="absolute inset-0 rounded-2xl border border-[#00D4FF]/28 sm:rounded-[32px]" />
        <div className="absolute -right-10 -top-10 size-44 rounded-full bg-[#00D4FF]/24 blur-3xl" />
        <div className="relative">
          <div className="flex flex-col items-center text-center">
            <LogoMark />
            <h2 className="mt-5 text-3xl font-black tracking-tight text-white sm:text-5xl">
              InfluencerLink <span className="text-[#00D4FF]">ET</span>
            </h2>
            <p className="mt-4 max-w-md text-base leading-7 text-white/72">
              The marketplace that connects Business Owners with Influencers to grow your brand.
            </p>
            <div className="mt-5 h-1 w-16 rounded-full bg-[#00D4FF]" />
          </div>

          <div className="mt-7 text-center">
            <h3 className="text-2xl font-bold text-white">
              {authMode === "login"
                ? "Sign in to your account"
                : role === "business"
                  ? "Create a Business Owner account"
                  : "Create an Influencer account"}
            </h3>
            <p className="mt-2 text-base text-[#7CF7FF]">
              {authMode === "login"
                ? "For Business Owners and Influencers"
                : role === "business"
                  ? "Tell us your company and target industry"
                  : "Tell us about your creator profile"}
            </p>
          </div>

          <div className="mt-7">
            <RoleSelector
              role={role}
              onChange={(nextRole) => {
                setRole(nextRole);
                if (status?.tone === "info") {
                  setStatus(null);
                }
              }}
            />
          </div>

          {authMode === "login" ? (
            <form className="mt-7 space-y-6" onSubmit={handleLogin}>
              <AuthInput
                id="email"
                label="Email address"
                type="email"
                placeholder="name@company.com"
                icon={MailIcon}
                value={loginForm.email}
                onChange={(email) => setLoginForm((form) => ({ ...form, email }))}
                autoComplete="email"
                required
              />
              <AuthInput
                id="password"
                label="Password"
                type="password"
                placeholder="Enter your password"
                icon={LockIcon}
                value={loginForm.password}
                onChange={(password) =>
                  setLoginForm((form) => ({ ...form, password }))
                }
                autoComplete="current-password"
                required
                trailing={
                  <button type="button" className="text-white/70 transition hover:text-[#00D4FF]" aria-label="Show password">
                    <EyeIcon className="size-5" />
                  </button>
                }
              />

              <div className="flex flex-col gap-3 text-sm min-[430px]:flex-row min-[430px]:items-center min-[430px]:justify-between">
                <label className="flex items-center gap-3 text-white/85">
                  <input
                    type="checkbox"
                    className="size-5 rounded border-[#00D4FF] bg-[#00D4FF]/15 text-[#00D4FF] accent-[#00D4FF]"
                    defaultChecked
                  />
                  Remember me
                </label>
                <a href="#" className="font-medium text-[#7CF7FF] hover:text-white">
                  Forgot password?
                </a>
              </div>

              <button
                type="submit"
                disabled={isSubmitting}
                className="login-cta flex min-h-14 w-full items-center justify-center gap-3 rounded-xl bg-white px-5 text-lg font-black text-[#182CFF] shadow-[0_18px_45px_rgba(0,0,0,0.18)] transition hover:bg-[#EAFBFF] disabled:cursor-not-allowed disabled:opacity-70"
              >
                {isSubmitting ? "Signing In..." : "Sign In"}
                <ArrowRightIcon className="size-6" />
              </button>
            </form>
          ) : (
            <form className="mt-7 space-y-5" onSubmit={handleSignup}>
              <AuthInput
                id="signup-name"
                label="Full name"
                type="text"
                placeholder="Your full name"
                icon={UserIcon}
                value={signupForm.name}
                onChange={(name) => setSignupForm((form) => ({ ...form, name }))}
                autoComplete="name"
                required
              />
              {role === "business" ? (
                <AuthInput
                  id="signup-company"
                  label="Company name"
                  type="text"
                  placeholder="Your business or company"
                  icon={BriefcaseIcon}
                  value={signupForm.companyName}
                  onChange={(companyName) =>
                    setSignupForm((form) => ({ ...form, companyName }))
                  }
                  autoComplete="organization"
                  required
                />
              ) : (
                <div className="grid gap-5">
                  <div>
                    <label className="text-sm font-medium text-white" htmlFor="signup-profile-image">
                      Profile picture
                    </label>
                    <div className="mt-3 flex items-center gap-4 rounded-xl border border-white/[0.18] bg-[#050B3D]/45 p-4 text-white shadow-[inset_0_1px_0_rgba(255,255,255,0.08)]">
                      <div className="grid size-20 shrink-0 place-items-center overflow-hidden rounded-full border border-[#00D4FF]/45 bg-[#00D4FF]/12 text-lg font-black text-[#7CF7FF]">
                        {signupImagePreview ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img
                            alt="Selected creator profile"
                            className="h-full w-full object-cover"
                            src={signupImagePreview}
                          />
                        ) : (
                          "PIC"
                        )}
                      </div>
                      <div className="min-w-0 flex-1">
                        <input
                          accept="image/*"
                          className="block w-full text-sm text-white/70 file:mr-3 file:rounded-lg file:border-0 file:bg-white file:px-4 file:py-2 file:text-sm file:font-black file:text-[#182CFF]"
                          id="signup-profile-image"
                          onChange={(event) =>
                            updateSignupProfileImage(event.target.files?.[0])
                          }
                          type="file"
                        />
                        <p className="mt-2 text-xs leading-5 text-white/58">
                          Optional JPG or PNG under 2 MB for your creator card.
                        </p>
                      </div>
                    </div>
                  </div>
                  <div className="grid gap-5 sm:grid-cols-2">
                  <div>
                    <label
                      htmlFor="signup-platform"
                      className="text-sm font-medium text-white"
                    >
                      Main platform
                    </label>
                    <div className="mt-3 flex min-h-14 items-center gap-3 rounded-xl border border-white/[0.18] bg-[#050B3D]/45 px-4 text-white shadow-[inset_0_1px_0_rgba(255,255,255,0.08)] focus-within:border-[#00D4FF]/80 focus-within:ring-2 focus-within:ring-[#00D4FF]/18">
                      <GlobeIcon className="size-5 shrink-0 text-white/65" />
                      <select
                        id="signup-platform"
                        value={signupForm.platform}
                        onChange={(event) =>
                          setSignupForm((form) => ({
                            ...form,
                            platform: event.target.value,
                          }))
                        }
                        required
                        className="min-w-0 flex-1 bg-transparent text-base text-white outline-none"
                      >
                        <option value="" className="bg-[#050B3D] text-white">
                          Select platform
                        </option>
                        {platforms.map((platform) => (
                          <option
                            key={platform}
                            value={platform}
                            className="bg-[#050B3D] text-white"
                          >
                            {platform}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>
                  <AuthInput
                    id="signup-handle"
                    label="Creator handle"
                    type="text"
                    placeholder="@yourhandle"
                    icon={UserIcon}
                    value={signupForm.handle}
                    onChange={(handle) =>
                      setSignupForm((form) => ({ ...form, handle }))
                    }
                    autoComplete="username"
                    required
                  />
                  </div>
                </div>
              )}
              <AuthInput
                id="signup-email"
                label={role === "business" ? "Business email" : "Creator email"}
                type="email"
                placeholder={
                  role === "business" ? "name@company.com" : "you@example.com"
                }
                icon={MailIcon}
                value={signupForm.email}
                onChange={(email) => setSignupForm((form) => ({ ...form, email }))}
                autoComplete="email"
                required
              />
              <AuthInput
                id="signup-phone"
                label="Phone number"
                type="tel"
                placeholder="+251..."
                icon={GlobeIcon}
                value={signupForm.phone}
                onChange={(phone) => setSignupForm((form) => ({ ...form, phone }))}
                autoComplete="tel"
              />
              {role === "influencer" ? (
                <AuthTextarea
                  id="signup-bio"
                  label="Short creator bio"
                  placeholder="What kind of content do you create, and who is your audience?"
                  icon={TrendingIcon}
                  value={signupForm.bio}
                  onChange={(bio) => setSignupForm((form) => ({ ...form, bio }))}
                />
              ) : null}
              <AuthInput
                id="signup-password"
                label="Password"
                type="password"
                placeholder="Create a password"
                icon={LockIcon}
                value={signupForm.password}
                onChange={(password) =>
                  setSignupForm((form) => ({ ...form, password }))
                }
                autoComplete="new-password"
                required
              />
              <AuthInput
                id="signup-confirm-password"
                label="Confirm password"
                type="password"
                placeholder="Confirm your password"
                icon={LockIcon}
                value={signupForm.confirmPassword}
                onChange={(confirmPassword) =>
                  setSignupForm((form) => ({ ...form, confirmPassword }))
                }
                autoComplete="new-password"
                required
              />

              <div>
                <label htmlFor="signup-industry" className="text-sm font-medium text-white">
                  {role === "business" ? "Industry" : "Content niche"}
                </label>
                <div className="mt-3 flex min-h-14 items-center gap-3 rounded-xl border border-white/[0.18] bg-[#050B3D]/45 px-4 text-white shadow-[inset_0_1px_0_rgba(255,255,255,0.08)] focus-within:border-[#00D4FF]/80 focus-within:ring-2 focus-within:ring-[#00D4FF]/18">
                  <TrendingIcon className="size-5 shrink-0 text-white/65" />
                  <select
                    id="signup-industry"
                    value={signupForm.industryId}
                    onChange={(event) =>
                      setSignupForm((form) => ({
                        ...form,
                        industryId: event.target.value,
                      }))
                    }
                    required
                    className="min-w-0 flex-1 bg-transparent text-base text-white outline-none"
                  >
                    <option value="" className="bg-[#050B3D] text-white">
                      {role === "business"
                        ? "Select your industry"
                        : "Select your content niche"}
                    </option>
                    {industries.map((industry) => (
                      <option
                        key={industry.id}
                        value={industry.id}
                        className="bg-[#050B3D] text-white"
                      >
                        {industry.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <button
                type="submit"
                disabled={isSubmitting || industries.length === 0}
                className="login-cta flex min-h-14 w-full items-center justify-center gap-3 rounded-xl bg-white px-5 text-lg font-black text-[#182CFF] shadow-[0_18px_45px_rgba(0,0,0,0.18)] transition hover:bg-[#EAFBFF] disabled:cursor-not-allowed disabled:opacity-70"
              >
                {isSubmitting
                  ? "Creating Account..."
                  : industries.length === 0
                    ? "Loading industries..."
                  : role === "business"
                    ? "Create Business Account"
                    : "Create Influencer Account"}
                <ArrowRightIcon className="size-6" />
              </button>
            </form>
          )}

          {status ? (
            <p
              className={`mt-4 rounded-xl border px-4 py-3 text-center text-sm ${
                status.tone === "success"
                  ? "border-[#32D583]/40 bg-[#32D583]/12 text-[#E9FFF0]"
                  : status.tone === "error"
                    ? "border-red-400/40 bg-red-500/12 text-red-100"
                    : "border-[#00D4FF]/40 bg-[#00D4FF]/12 text-[#C9FBFF]"
              }`}
            >
              {status.message}
            </p>
          ) : null}

          <div className="mt-7 flex items-center gap-5 text-sm text-white/65">
            <div className="h-px flex-1 bg-white/14" />
            <span>or</span>
            <div className="h-px flex-1 bg-white/14" />
          </div>

          <div className="mt-5 space-y-3">
            <SocialButton
              href={`/api/auth/google/start?role=${role}`}
              icon={<GoogleIcon className="size-6" />}
            >
              Continue with Google
            </SocialButton>
            <SocialButton icon={<AppleIcon className="size-7 text-white" />}>
              Continue with Apple
            </SocialButton>
            <SocialButton
              icon={<TelegramIcon className="size-7 text-white" />}
              onClick={handleTelegramLogin}
            >
              {isTelegramSubmitting
                ? "Opening Telegram..."
                : "Continue with Telegram"}
            </SocialButton>
            {telegramLoginFlow ? (
              <div className="rounded-xl border border-[#00D4FF]/35 bg-[#00D4FF]/10 p-4 text-sm text-white">
                <p className="font-semibold text-[#7CF7FF]">
                  Telegram verification code
                </p>
                <p className="mt-2 break-all rounded-lg border border-white/[0.10] bg-[#050B3D]/55 px-3 py-2 font-mono text-white">
                  {telegramLoginFlow.code}
                </p>
                <div className="mt-3 grid gap-2 sm:grid-cols-2">
                  <a
                    className="rounded-lg border border-white/[0.18] px-4 py-3 text-center font-semibold text-white transition hover:border-[#00D4FF]/55 hover:text-[#7CF7FF]"
                    href={telegramLoginFlow.botLink}
                    rel="noreferrer"
                    target="_blank"
                  >
                    Open Telegram Bot
                  </a>
                  <button
                    className="rounded-lg bg-white px-4 py-3 font-bold text-[#182CFF] transition hover:bg-[#EAFBFF] disabled:cursor-not-allowed disabled:opacity-70"
                    disabled={isTelegramSubmitting}
                    onClick={handleTelegramVerify}
                    type="button"
                  >
                    Verify Telegram
                  </button>
                </div>
              </div>
            ) : null}
          </div>

          <p className="mt-6 text-center text-sm leading-7 text-white/70 sm:text-base">
            {authMode === "login" ? (
              <>
                New here?{" "}
                <Link
                  className="font-medium text-[#7CF7FF] hover:text-white"
                  href="/signup/business"
                >
                  Create a Business Owner account
                </Link>{" "}
                or{" "}
                <Link
                  className="font-medium text-[#7CF7FF] hover:text-white"
                  href="/signup/influencer"
                >
                  Sign up as an Influencer
                </Link>
                .{" "}
                <Link
                  className="font-medium text-white hover:text-[#7CF7FF]"
                  href="/signup"
                >
                  Not sure? Choose account type
                </Link>
              </>
            ) : (
              <>
                Already have an account?{" "}
                <button
                  type="button"
                  onClick={() => {
                    setAuthMode("login");
                    setStatus(null);
                  }}
                  className="font-medium text-[#7CF7FF] hover:text-white"
                >
                  Back to Sign In
                </button>
                .
              </>
            )}
          </p>
        </div>
      </div>
    </section>
  );
}

function TrustFooter() {
  return (
    <footer className="relative z-20 grid gap-4 border-t border-white/15 bg-[#050B3D]/94 px-6 py-5 text-sm text-white/72 backdrop-blur md:grid-cols-3 md:px-12">
      <div className="flex items-center justify-center gap-3 md:justify-start">
        <ShieldIcon className="size-6 text-[#00D4FF]" />
        Trusted &amp; Verified
      </div>
      <div className="flex items-center justify-center gap-3">
        <GlobeIcon className="size-6 text-[#00D4FF]" />
        Secure Payments
      </div>
      <div className="flex items-center justify-center gap-3 md:justify-end">
        <LockIcon className="size-6 text-[#00D4FF]" />
        Local Support
      </div>
    </footer>
  );
}

export default function LoginPage() {
  return (
    <main className="relative min-h-dvh overflow-hidden bg-[#050B3D] text-white">
      <div className="absolute -left-32 -top-32 size-[420px] rounded-full bg-[#00D4FF]/18 blur-3xl" />
      <div className="absolute -right-44 top-12 size-[460px] rounded-full bg-[#182CFF]/45 blur-3xl" />
      <div className="absolute bottom-0 right-1/3 size-[360px] rounded-full bg-white/10 blur-3xl" />
      <div className="absolute inset-0 opacity-[0.08] [background-image:linear-gradient(rgba(255,255,255,.5)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,.5)_1px,transparent_1px)] [background-size:44px_44px]" />

      <div className="relative z-10 grid min-h-dvh lg:grid-cols-[54fr_46fr]">
        <HeroPanel />
        <LoginCard />
      </div>
      <TrustFooter />
      <AuthFooter />
    </main>
  );
}
