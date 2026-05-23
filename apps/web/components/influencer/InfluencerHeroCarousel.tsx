"use client";

import Image from "next/image";
import { useEffect, useMemo, useState } from "react";
import { ProfileAvatarEditor } from "@/components/profile/ProfileAvatarEditor";
import { getInitials } from "@/lib/formatters";

type InfluencerHeroCarouselProps = {
  displayName: string;
  handle?: string;
};

type Slide = {
  image: string;
  subtitle: string;
  title: string;
};

const slides: Slide[] = [
  {
    image: "/images/influencer-dashboard/creator-brand-collaboration.jpg",
    subtitle: "Turn your audience into trusted business partnerships.",
    title: "Grow your creator brand",
  },
  {
    image: "/images/influencer-dashboard/creator-campaign-growth.jpg",
    subtitle: "Review invitations and work with brands that match your niche.",
    title: "Win better campaigns",
  },
  {
    image: "/images/influencer-dashboard/creator-earnings-analytics.jpg",
    subtitle: "Measure views, engagement, earnings, and campaign performance.",
    title: "Track your influence",
  },
];

function firstName(name: string) {
  return name.trim().split(/\s+/)[0] || "Creator";
}

export function InfluencerHeroCarousel({
  displayName,
  handle,
}: InfluencerHeroCarouselProps) {
  const [activeSlide, setActiveSlide] = useState(0);
  const [touchStart, setTouchStart] = useState<number | null>(null);
  const initials = useMemo(
    () => getInitials(displayName || "Creator"),
    [displayName],
  );

  useEffect(() => {
    const prefersReducedMotion = window.matchMedia(
      "(prefers-reduced-motion: reduce)",
    ).matches;

    if (prefersReducedMotion) return undefined;

    const interval = window.setInterval(() => {
      setActiveSlide((current) => (current + 1) % slides.length);
    }, 4800);

    return () => window.clearInterval(interval);
  }, []);

  function showPreviousSlide() {
    setActiveSlide((current) => (current - 1 + slides.length) % slides.length);
  }

  function showNextSlide() {
    setActiveSlide((current) => (current + 1) % slides.length);
  }

  return (
    <section
      className="relative min-h-[330px] overflow-hidden rounded-[30px] border border-white/20 bg-[#1D4DFF] shadow-[0_28px_80px_rgba(3,19,106,0.34)] sm:min-h-[348px] lg:min-h-[332px]"
      onTouchEnd={(event) => {
        if (touchStart === null) return;

        const delta = touchStart - event.changedTouches[0].clientX;
        setTouchStart(null);

        if (Math.abs(delta) < 34) return;
        if (delta > 0) {
          showNextSlide();
        } else {
          showPreviousSlide();
        }
      }}
      onTouchStart={(event) => setTouchStart(event.touches[0].clientX)}
    >
      {slides.map((slide, index) => (
        <div
          aria-hidden={activeSlide !== index}
          className={`absolute inset-0 transition duration-700 motion-reduce:transition-none ${
            activeSlide === index
              ? "translate-x-0 opacity-100"
              : index < activeSlide
                ? "-translate-x-5 opacity-0"
                : "translate-x-5 opacity-0"
          }`}
          key={slide.title}
        >
          <Image
            alt=""
            className="object-cover"
            fill
            priority={index === 0}
            sizes="(min-width: 1024px) 1024px, 100vw"
            src={slide.image}
          />
          <div
            className="absolute inset-0"
            style={{
              background:
                "linear-gradient(90deg, rgba(5,11,61,0.72), rgba(24,44,255,0.25), rgba(46,211,255,0.08))",
            }}
          />
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_18%_82%,rgba(46,211,255,0.28),transparent_30%),radial-gradient(circle_at_88%_18%,rgba(255,255,255,0.22),transparent_32%)]" />
          <div className="absolute inset-0 opacity-[0.13] [background-image:linear-gradient(rgba(255,255,255,.55)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,.55)_1px,transparent_1px)] [background-size:34px_34px]" />
        </div>
      ))}

      <div className="relative z-10 flex min-h-[330px] flex-col justify-between p-4 min-[390px]:p-5 sm:min-h-[348px] sm:p-6 lg:min-h-[332px]">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <span className="inline-flex rounded-full border border-white/30 bg-white/15 px-3 py-1 text-[10px] font-black uppercase tracking-[0.16em] text-[#DDFBFF] shadow-[0_10px_30px_rgba(46,211,255,0.14)]">
              Creator Studio
            </span>
            <p className="mt-2 max-w-[11rem] truncate text-sm font-semibold text-white/84 min-[390px]:max-w-[13rem] sm:max-w-none">
              Welcome back, {firstName(displayName)}
            </p>
          </div>
          <div className="rounded-full border border-white/18 bg-[#081B5D]/42 p-1.5 shadow-[0_18px_42px_rgba(0,0,0,0.24)] backdrop-blur-md">
            <ProfileAvatarEditor
              displayName={displayName}
              initials={initials}
              label="Influencer"
              showDetails={false}
              variant="influencerHero"
            />
          </div>
        </div>

        <div className="max-w-[19rem] pb-1 sm:max-w-xl">
          <div className="grid min-h-[128px] content-end">
            {slides.map((slide, index) => (
              <div
                className={`col-start-1 row-start-1 transition duration-700 motion-reduce:transition-none ${
                  activeSlide === index
                    ? "translate-y-0 opacity-100"
                    : "translate-y-2 opacity-0"
                }`}
                key={slide.subtitle}
              >
                <h1 className="max-w-[11ch] text-[2.35rem] font-black leading-[0.95] text-white min-[390px]:text-[2.8rem] sm:max-w-[13ch] sm:text-6xl lg:text-[4.25rem]">
                  {slide.title}
                </h1>
                <p className="mt-3 max-w-sm text-sm font-semibold leading-6 text-white/84 sm:text-base">
                  {slide.subtitle}
                </p>
              </div>
            ))}
          </div>

          <div className="mt-4 flex items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              {slides.map((slide, index) => (
                <button
                  aria-label={`Show slide ${index + 1}: ${slide.title}`}
                  className={`h-2.5 rounded-full transition-all active:scale-95 ${
                    activeSlide === index ? "w-8 bg-[#2ED3FF]" : "w-2.5 bg-white/40"
                  }`}
                  key={slide.title}
                  onClick={() => setActiveSlide(index)}
                  type="button"
                />
              ))}
            </div>
            {handle ? (
              <span className="max-w-[9.5rem] truncate rounded-full border border-white/25 bg-white/14 px-3 py-1.5 text-xs font-black text-white backdrop-blur-md">
                {handle}
              </span>
            ) : null}
          </div>
        </div>
      </div>
    </section>
  );
}
