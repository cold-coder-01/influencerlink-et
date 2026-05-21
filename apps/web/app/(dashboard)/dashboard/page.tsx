import Image from "next/image";
import Link from "next/link";
import { redirect } from "next/navigation";
import type { ReactNode } from "react";
import { ProfileAvatarEditor } from "@/components/profile/ProfileAvatarEditor";
import { fetchCampaigns } from "@/lib/campaigns";
import { formatCompactNumber, getInitials } from "@/lib/formatters";
import { getIndustryImage } from "@/lib/industry-utils";
import { calculateAverageRoi, calculateMatchScore } from "@/lib/match-utils";
import {
  authenticateServiceUser,
  executeKw,
  getOdooConfig,
  type OdooConfig,
} from "@/lib/odoo-rpc";
import { platformOptions } from "@/lib/platform-utils";
import { routes } from "@/lib/routes";
import { getCurrentSession } from "@/lib/session";

export const dynamic = "force-dynamic";

type IconName =
  | "bell"
  | "briefcase"
  | "building"
  | "card"
  | "chart"
  | "craft"
  | "drink"
  | "eye"
  | "file"
  | "globe"
  | "home"
  | "leaf"
  | "logout"
  | "megaphone"
  | "message"
  | "rocket"
  | "search"
  | "settings"
  | "shield"
  | "thread"
  | "trending"
  | "user"
  | "users";

type RawIndustry = {
  id: number;
  name?: string | false;
  industry_weight?: number | false;
  industryWeight?: number | false;
  icon?: string | false;
};

type RawProfile = {
  id: number;
  name: string;
  handle?: string | false;
  industry?: string | false;
  industry_id?: [number, string] | false;
  industry_ids?: Array<[number, string]>;
  category?: string | false;
  platform?: string | false;
  follower_count?: number | false;
  followers?: number | false;
  avg_views?: number | false;
  roi_multiplier?: number | false;
  roiMultiplier?: number | false;
  addis_audience_percent?: number | false;
  addisAudiencePercent?: number | false;
};

type DashboardProfile = {
  id: number;
  name: string;
  handle: string;
  industry: string;
  platform: string;
  followers: number;
  roiMultiplier: number;
  matchScore: number;
};

type DashboardIndustry = {
  id: number;
  name: string;
  weight: number;
  image: string;
  influencerCount: number;
  icon: IconName;
};

const fallbackIndustries: RawIndustry[] = [
  { id: 1, name: "Agri-Tech", industry_weight: 1.25 },
  { id: 2, name: "Real Estate", industry_weight: 1.5 },
  { id: 3, name: "Textile", industry_weight: 1.35 },
  { id: 4, name: "Craft", industry_weight: 1.1 },
  { id: 5, name: "Beverage", industry_weight: 1.2 },
];

const fallbackProfiles: RawProfile[] = [
  {
    id: 101,
    name: "Mekdes Tech Talks",
    handle: "@mekdestech",
    industry: "Tech",
    platform: "TikTok",
    follower_count: 125000,
    roi_multiplier: 2.62,
  },
  {
    id: 102,
    name: "Addis Real Stories",
    handle: "@addisrealstories",
    industry: "Real Estate",
    platform: "YouTube",
    follower_count: 98000,
    roi_multiplier: 2.38,
  },
  {
    id: 103,
    name: "Ethio Threads",
    handle: "@ethiothreads",
    industry: "Textile",
    platform: "Instagram",
    follower_count: 82000,
    roi_multiplier: 2.16,
  },
  {
    id: 104,
    name: "Habesha Makers",
    handle: "@habeshamakers",
    industry: "Craft",
    platform: "Telegram",
    follower_count: 76000,
    roi_multiplier: 1.98,
  },
  {
    id: 105,
    name: "Brewed in Ethiopia",
    handle: "@brewed.eth",
    industry: "Beverage",
    platform: "TikTok",
    follower_count: 69000,
    roi_multiplier: 1.86,
  },
];

const platformDistribution = [
  { name: "TikTok", value: 42, color: "#E63746" },
  { name: "Instagram", value: 28, color: "#C83CA7" },
  { name: "YouTube", value: 16, color: "#FF2738" },
  { name: "Telegram", value: 9, color: "#3AA2E3" },
  { name: "Others", value: 5, color: "#77736A" },
];

async function readDashboardData() {
  try {
    const config = getOdooConfig();
    const uid = await authenticateServiceUser(config);
    const [industries, profiles] = await Promise.all([
      searchRead<RawIndustry>(
        uid,
        "influencer.industry",
        ["name", "industry_weight", "icon"],
        [["active", "=", true]],
        "name asc",
        config,
      ),
      searchRead<RawProfile>(
        uid,
        "influencer.profile",
        [
          "name",
          "industry_ids",
          "avg_views",
          "roi_multiplier",
          "addis_audience_percent",
        ],
        [],
        "roi_multiplier desc",
        config,
      ),
    ]);

    return { isOnline: true as const, industries, profiles };
  } catch (error) {
    return {
      isOnline: false as const,
      error:
        error instanceof Error
          ? error.message
          : "The Odoo backend could not be reached.",
      industries: [],
      profiles: [],
    };
  }
}

async function searchRead<T>(
  uid: number,
  model: string,
  fields: string[],
  domain: unknown[] = [],
  order?: string,
  config: OdooConfig = getOdooConfig(),
) {
  return executeKw<T[]>(
    uid,
    model,
    "search_read",
    [domain],
    { fields, order },
    config,
  );
}

async function resolveDisplayName(session: {
  uid: number;
  name?: string;
  partnerId?: number;
}) {
  try {
    const config = getOdooConfig();
    const uid = await authenticateServiceUser(config);

    if (session.partnerId) {
      const partners = await searchRead<{ name?: string | false }>(
        uid,
        "res.partner",
        ["name"],
        [["id", "=", session.partnerId]],
        undefined,
        config,
      );

      if (partners[0]?.name) return partners[0].name;
    }

    const users = await searchRead<{ name?: string | false }>(
      uid,
      "res.users",
      ["name"],
      [["id", "=", session.uid]],
      undefined,
      config,
    );

    return users[0]?.name || session.name || "Business Owner";
  } catch {
    return session.name || "Business Owner";
  }
}

function readIndustries(profile: RawProfile) {
  if (Array.isArray(profile.industry_ids) && profile.industry_ids.length > 0) {
    const names = profile.industry_ids
      .map((industry) => industry?.[1])
      .filter((name): name is string => typeof name === "string" && name.length > 0);

    if (names.length > 0) return names;
  }

  if (
    Array.isArray(profile.industry_id) &&
    typeof profile.industry_id[1] === "string" &&
    profile.industry_id[1].length > 0
  ) {
    return [profile.industry_id[1]];
  }

  if (typeof profile.industry === "string" && profile.industry.length > 0) {
    return [profile.industry];
  }

  if (typeof profile.category === "string" && profile.category.length > 0) {
    return [profile.category];
  }

  return ["Emerging Sector"];
}

function readFollowers(profile: RawProfile) {
  return (
    numberOrZero(profile.follower_count) ||
    numberOrZero(profile.followers) ||
    numberOrZero(profile.avg_views)
  );
}

function readRoi(profile: RawProfile) {
  return numberOrZero(profile.roi_multiplier) || numberOrZero(profile.roiMultiplier);
}

function numberOrZero(value: number | false | undefined) {
  return typeof value === "number" && Number.isFinite(value) ? value : 0;
}

function normalizeProfile(profile: RawProfile, index: number): DashboardProfile {
  const industry = readIndustries(profile)[0] ?? "Emerging Sector";
  const handle =
    profile.handle ||
    `@${profile.name.toLowerCase().replace(/[^a-z0-9]+/g, "").slice(0, 18)}`;
  const nonMultiPlatformOptions = platformOptions.filter(
    (platform) => platform !== "Multi-platform",
  );
  const followers = readFollowers(profile);
  const roiMultiplier = readRoi(profile);

  return {
    id: profile.id,
    name: profile.name,
    handle,
    industry,
    platform: profile.platform || nonMultiPlatformOptions[index % nonMultiPlatformOptions.length],
    followers,
    roiMultiplier,
    matchScore: calculateMatchScore({
      addisAudiencePercent:
        numberOrZero(profile.addis_audience_percent) ||
        numberOrZero(profile.addisAudiencePercent),
      followers,
      roiMultiplier,
    }),
  };
}

function normalizeIndustry(
  industry: RawIndustry,
  profiles: RawProfile[],
): DashboardIndustry {
  const name =
    typeof industry.name === "string" && industry.name.length > 0
      ? industry.name
      : "Emerging Sector";
  const weight =
    numberOrZero(industry.industry_weight) ||
    numberOrZero(industry.industryWeight) ||
    1;
  const influencerCount =
    profiles.filter((profile) =>
      readIndustries(profile).some(
        (profileIndustry) => profileIndustry.toLowerCase() === name.toLowerCase(),
      ),
    ).length || Math.max(12, Math.round(24 * weight));

  return {
    id: industry.id,
    name,
    weight,
    image: getIndustryImage(name),
    influencerCount,
    icon: getIndustryIcon(name),
  };
}

function getIndustryIcon(name: string): IconName {
  const normalized = name.toLowerCase();

  if (normalized.includes("agri")) return "leaf";
  if (normalized.includes("real") || normalized.includes("estate")) return "building";
  if (normalized.includes("textile") || normalized.includes("fashion")) return "thread";
  if (normalized.includes("craft") || normalized.includes("handmade")) return "craft";
  if (normalized.includes("beverage") || normalized.includes("coffee")) return "drink";

  return "briefcase";
}

function Icon({
  name,
  className = "h-5 w-5",
}: {
  name: IconName;
  className?: string;
}) {
  const paths: Record<IconName, ReactNode> = {
    bell: <path d="M18 8a6 6 0 0 0-12 0c0 7-3 7-3 9h18c0-2-3-2-3-9M10 21h4" />,
    briefcase: <path d="M10 6V5a2 2 0 0 1 2-2h1a2 2 0 0 1 2 2v1M3 7h18v13H3zM3 12h18" />,
    building: <path d="M4 21V5l10-2v18M4 9h10M8 21v-4h2v4M18 21V9h2v12M17 13h4M17 17h4" />,
    card: <path d="M3 6h18v12H3zM3 10h18M7 15h4" />,
    chart: <path d="M4 20V10M10 20V4M16 20v-7M22 20H2" />,
    craft: <path d="M4 13h16M6 9h12M8 5h8M7 13l2 8h6l2-8M9 17h6" />,
    drink: <path d="M8 3h8l-1 6v10a2 2 0 0 1-2 2h-2a2 2 0 0 1-2-2V9zM9 9h6M8 14h8" />,
    eye: <path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7S2 12 2 12zM12 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6z" />,
    file: <path d="M14 3H6a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V9zM14 3v6h6M8 13h8M8 17h5" />,
    globe: <path d="M12 22a10 10 0 1 0 0-20 10 10 0 0 0 0 20zM2 12h20M12 2a15 15 0 0 1 0 20M12 2a15 15 0 0 0 0 20" />,
    home: <path d="M3 10.8 12 3l9 7.8V21h-6v-6H9v6H3z" />,
    leaf: <path d="M5 21c1-9 7-15 16-17-1 9-7 15-16 17zM5 21c0-5 3-9 8-12" />,
    logout: <path d="M10 17l5-5-5-5M15 12H3M21 3v18h-6" />,
    megaphone: <path d="M3 11v3a2 2 0 0 0 2 2h2l4 4v-4l8-3V6L7 9H5a2 2 0 0 0-2 2zM19 6l2-2M19 13l2 2" />,
    message: <path d="M21 15a4 4 0 0 1-4 4H8l-5 3V7a4 4 0 0 1 4-4h10a4 4 0 0 1 4 4z" />,
    rocket: <path d="M5 16c-1.5 1-2 3-2 5 2 0 4-.5 5-2M9 15l-3-3c2-5 6-8 13-9-1 7-4 11-9 13zM15 6h.01M13 17l-1 4 3-3" />,
    search: <path d="m21 21-4.3-4.3M10.8 18a7.2 7.2 0 1 1 0-14.4 7.2 7.2 0 0 1 0 14.4z" />,
    settings: <path d="M12 15.5A3.5 3.5 0 1 0 12 8a3.5 3.5 0 0 0 0 7.5zM19.4 15a1.8 1.8 0 0 0 .36 2l.06.06-2.12 2.12-.06-.06a1.8 1.8 0 0 0-2-.36 1.8 1.8 0 0 0-1.1 1.66V20h-3v-.08a1.8 1.8 0 0 0-1.1-1.66 1.8 1.8 0 0 0-2 .36l-.06.06-2.12-2.12.06-.06a1.8 1.8 0 0 0 .36-2 1.8 1.8 0 0 0-1.66-1.1H5v-3h.08a1.8 1.8 0 0 0 1.66-1.1 1.8 1.8 0 0 0-.36-2l-.06-.06 2.12-2.12.06.06a1.8 1.8 0 0 0 2 .36A1.8 1.8 0 0 0 11.6 3.9V3h3v.9a1.8 1.8 0 0 0 1.1 1.66 1.8 1.8 0 0 0 2-.36l.06-.06 2.12 2.12-.06.06a1.8 1.8 0 0 0-.36 2 1.8 1.8 0 0 0 1.66 1.1H21v3h-.08A1.8 1.8 0 0 0 19.4 15z" />,
    shield: <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10zM9 12l2 2 4-5" />,
    thread: <path d="M7 3h10M8 7h8M9 21h6M12 7v14M8 11h8M8 15h8" />,
    trending: <path d="M3 17 9 11l4 4 8-8M15 7h6v6" />,
    user: <path d="M20 21a8 8 0 1 0-16 0M12 13a5 5 0 1 0 0-10 5 5 0 0 0 0 10z" />,
    users: <path d="M16 21v-2a4 4 0 0 0-4-4H7a4 4 0 0 0-4 4v2M9.5 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8M22 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75" />,
  };

  return (
    <svg
      aria-hidden="true"
      className={className}
      fill="none"
      stroke="currentColor"
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth="1.8"
      viewBox="0 0 24 24"
    >
      {paths[name]}
    </svg>
  );
}

function Hero({
  displayName,
  email,
}: {
  displayName: string;
  email: string;
}) {
  const initials = getInitials(displayName || "Business Owner");

  return (
    <section className="relative min-h-[270px] overflow-hidden rounded-[24px] border border-white/[0.16] bg-[radial-gradient(circle_at_74%_18%,rgba(46,211,255,0.26),transparent_30%),linear-gradient(135deg,#081B5D,#020A2C_76%)] shadow-[0_24px_80px_rgba(1,10,45,0.46)] lg:min-h-[280px] lg:border-white/[0.10] lg:bg-[radial-gradient(circle_at_70%_20%,rgba(255,215,0,0.20),transparent_28%),linear-gradient(135deg,#10100d,#050505_70%)]">
      <Image
        alt="Addis Ababa digital business skyline"
        className="object-cover opacity-70 lg:opacity-55"
        fill
        priority
        sizes="(min-width: 1024px) calc(100vw - 320px), 100vw"
        src="/images/dashboard/hero-addis-night.jpg"
      />
      <div className="absolute inset-0 bg-gradient-to-r from-[#020A2C]/98 via-[#020A2C]/72 to-[#06195A]/15 lg:from-black lg:via-black/70 lg:to-black/15" />
      <div
        className="absolute inset-0 opacity-[0.05] lg:opacity-[0.08]"
        style={{
          backgroundImage: "url('/images/dashboard/pattern-gold.svg')",
          backgroundSize: "220px",
        }}
      />
      <div className="absolute inset-x-4 bottom-0 h-px bg-gradient-to-r from-transparent via-[#2ED3FF]/60 to-transparent lg:hidden" />

      <div className="relative z-10 flex min-h-[270px] max-w-2xl flex-col justify-end px-5 py-7 sm:px-8 sm:py-10 lg:min-h-[280px] lg:justify-start">
        <div className="mb-5 flex items-start justify-between gap-3">
          <p className="inline-flex w-fit min-w-0 items-center gap-2 rounded-full border border-[#2ED3FF]/45 bg-[#081B5D]/54 px-3 py-1.5 text-[11px] font-semibold uppercase tracking-[0.18em] text-[#2ED3FF] shadow-[0_10px_30px_rgba(46,211,255,0.10)] lg:border-[#FFD700]/30 lg:bg-[#FFD700]/10 lg:text-[#FFD700]">
            <Icon className="h-3.5 w-3.5 shrink-0" name="shield" />
            <span className="whitespace-nowrap">Mission Control</span>
          </p>
          <div className="relative z-20 rounded-full border border-white/[0.18] bg-[#081B5D]/62 px-2 py-1.5 shadow-[0_16px_36px_rgba(0,0,0,0.22)] backdrop-blur-md">
            <ProfileAvatarEditor
              displayName={displayName}
              email={email}
              initials={initials}
              label="Business Owner"
            />
          </div>
        </div>
        <p className="text-2xl text-white lg:text-[#F5F2E9]">Welcome back,</p>
        <h1 className="mt-2 break-words text-5xl font-bold tracking-normal text-white sm:text-6xl lg:text-[#FFD700]">
          {displayName}
        </h1>
        <p className="mt-5 max-w-md text-base leading-7 text-white/82 lg:max-w-xl lg:text-[#F5F2E9]/90">
          Your dashboard for smarter influencer decisions and real impact.
        </p>
        <div className="mt-6 hidden gap-3 sm:flex lg:hidden">
          <Link
            className="mobile-blue-button inline-flex items-center justify-center px-5 text-sm font-bold"
            href={routes.newCampaign()}
          >
            Launch Campaign
          </Link>
          <Link
            className="mobile-blue-button-secondary inline-flex items-center justify-center px-5 text-sm font-bold"
            href={routes.influencers()}
          >
            Find Influencers
          </Link>
        </div>
      </div>
    </section>
  );
}

function QuickActions() {
  const actions: Array<{
    label: string;
    href: string;
    icon: IconName;
    tone: string;
  }> = [
    {
      label: "Find Influencers",
      href: routes.influencers(),
      icon: "search",
      tone: "from-[#0077FF] to-[#005FD4]",
    },
    {
      label: "Launch Campaign",
      href: routes.newCampaign(),
      icon: "rocket",
      tone: "from-[#1D4DFF] to-[#163BD0]",
    },
    {
      label: "View Analytics",
      href: routes.analytics(),
      icon: "chart",
      tone: "from-[#069DB6] to-[#057D93]",
    },
  ];

  return (
    <section aria-label="Quick actions" className="grid grid-cols-3 gap-2 sm:gap-4">
      {actions.map((action) => (
        <Link
          className="group grid min-h-[104px] grid-cols-1 content-between rounded-2xl border border-white/[0.16] bg-white/[0.09] p-3 shadow-[0_18px_46px_rgba(1,10,45,0.24)] backdrop-blur-xl transition active:scale-[0.98] lg:min-h-[108px] lg:bg-white/[0.06] lg:hover:-translate-y-0.5"
          href={action.href}
          key={action.href}
        >
          <span
            className={`grid h-11 w-11 place-items-center rounded-full bg-gradient-to-br ${action.tone} text-white shadow-[0_12px_30px_rgba(46,211,255,0.18)]`}
          >
            <Icon className="h-5 w-5" name={action.icon} />
          </span>
          <span className="flex items-end justify-between gap-1 text-sm font-semibold leading-5 text-white">
            {action.label}
            <span
              aria-hidden="true"
              className="text-xl leading-none text-white/86 transition group-hover:translate-x-0.5"
            >
              {">"}
            </span>
          </span>
        </Link>
      ))}
    </section>
  );
}

function MetricCard({
  title,
  value,
  trend,
  icon,
}: {
  title: string;
  value: string;
  trend: string;
  icon: IconName;
}) {
  return (
    <article className="min-h-28 rounded-2xl border border-white/[0.16] bg-white/[0.09] p-3 shadow-[0_16px_44px_rgba(1,10,45,0.22)] backdrop-blur-xl lg:min-h-0 lg:border-white/[0.10] lg:bg-white/[0.06] lg:p-5">
      <div className="flex h-full flex-col justify-between gap-2 lg:flex-row lg:items-center lg:gap-4">
        <div className="grid h-9 w-9 shrink-0 place-items-center rounded-full border border-[#2ED3FF]/35 bg-gradient-to-br from-[#1D4DFF] to-[#081B5D] text-white shadow-[0_12px_28px_rgba(29,77,255,0.22)] lg:h-12 lg:w-12 lg:border-[#FFD700]/35 lg:bg-[#FFD700]/10 lg:text-[#FFD700]">
          <Icon className="h-[18px] w-[18px] lg:h-6 lg:w-6" name={icon} />
        </div>
        <div className="min-w-0">
          <p className="text-[11px] font-medium leading-4 text-white/82 lg:text-xs lg:font-semibold lg:uppercase lg:text-[#B8B3A7]">
            {title}
          </p>
          <div className="mt-1 flex flex-wrap items-end gap-x-1.5 gap-y-1">
            <p className="text-[1.55rem] font-bold leading-none text-white min-[390px]:text-3xl lg:text-[#F5F2E9]">
              {value}
            </p>
            <p className="inline-flex items-center gap-1 pb-0.5 text-[11px] font-semibold text-[#32D583]">
              <Icon className="h-3 w-3" name="trending" />
              {trend}
            </p>
          </div>
          <p className="mt-1 text-[11px] leading-4 text-white/62 lg:text-xs lg:text-[#B8B3A7]">
            vs last 30 days
          </p>
        </div>
      </div>
    </article>
  );
}

function IndustriesOverview({ industries }: { industries: DashboardIndustry[] }) {
  return (
    <section className="overflow-hidden rounded-[24px] border border-white/[0.16] bg-white/[0.09] p-4 shadow-[0_24px_80px_rgba(1,10,45,0.35)] backdrop-blur-xl sm:p-5 lg:border-white/[0.10] lg:bg-white/[0.06]">
      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-2xl font-bold text-white lg:text-lg lg:font-semibold lg:text-[#F5F2E9]">
          Industries Overview
        </h2>
        <Link
          className="text-sm font-bold text-[#2ED3FF] lg:text-xs lg:text-[#FFD700]"
          href={routes.industries()}
        >
          View all
        </Link>
      </div>
      <div className="no-scrollbar -mx-4 flex snap-x snap-mandatory gap-4 overflow-x-auto px-4 pb-4 sm:-mx-5 sm:px-5 lg:mx-0 lg:grid lg:snap-none lg:grid-cols-2 lg:overflow-visible lg:px-0 lg:pb-0 xl:grid-cols-5">
        {industries.slice(0, 5).map((industry) => (
          <Link
            className="group relative min-h-[220px] w-[230px] shrink-0 snap-start overflow-hidden rounded-2xl border border-white/[0.16] bg-[linear-gradient(135deg,#081B5D,#020A2C)] shadow-[0_16px_42px_rgba(0,0,0,0.28)] lg:w-auto lg:border-white/[0.10] lg:bg-[linear-gradient(135deg,#151515,#050505)]"
            href={routes.industryDetail(industry.id)}
            id={`industry-${industry.id}`}
            key={industry.id}
          >
            <Image
              alt={`${industry.name} industry`}
              className="object-cover opacity-70 transition duration-500 group-hover:scale-105 group-hover:opacity-80 lg:opacity-55 lg:group-hover:opacity-70"
              fill
              sizes="(min-width: 1280px) 170px, (min-width: 640px) 50vw, 100vw"
              src={industry.image}
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black via-black/45 to-transparent" />
            <div className="relative flex h-full min-h-[220px] flex-col justify-end p-4">
              <div className="mb-5 grid h-16 w-16 place-items-center rounded-full border border-[#B7FF2E]/45 bg-[#5C7E09]/78 text-white shadow-[0_12px_30px_rgba(0,0,0,0.35)] lg:h-12 lg:w-12 lg:border-[#FFD700]/50 lg:text-[#F5F2E9]">
                <Icon className="h-6 w-6" name={industry.icon} />
              </div>
              <h3 className="text-xl font-bold text-white lg:text-base lg:font-semibold lg:text-[#F5F2E9]">
                {industry.name}
              </h3>
              <div className="mt-4 flex items-center justify-between text-sm text-white/78 lg:text-xs lg:text-[#B8B3A7]">
                <span>Match Score</span>
                <span className="text-lg font-bold text-[#2ED3FF] lg:text-base lg:text-[#45B36B]">
                  {industry.weight.toFixed(2)}x
                </span>
              </div>
              <p className="mt-3 text-sm text-white lg:text-xs lg:text-[#F5F2E9]/85">
                {industry.influencerCount} Influencers
              </p>
            </div>
          </Link>
        ))}
      </div>
      <div className="mx-auto mt-1 flex w-fit items-center gap-2 lg:hidden" aria-hidden="true">
        <span className="h-2 w-7 rounded-full bg-[#2ED3FF]" />
        <span className="h-2 w-2 rounded-full bg-white/25" />
        <span className="h-2 w-2 rounded-full bg-white/25" />
        <span className="h-2 w-2 rounded-full bg-white/25" />
      </div>
    </section>
  );
}

function MobileBottomNav() {
  const items: Array<{ label: string; href: string; icon: IconName; active?: boolean }> = [
    { label: "Home", href: routes.dashboard(), icon: "home", active: true },
    { label: "Influencers", href: routes.influencers(), icon: "users" },
    { label: "Campaigns", href: routes.campaigns(), icon: "rocket" },
    { label: "Analytics", href: routes.analytics(), icon: "chart" },
    { label: "Profile", href: routes.settings(), icon: "user" },
  ];

  return (
    <nav
      aria-label="Mobile quick navigation"
      className="fixed inset-x-3 bottom-[max(0.75rem,env(safe-area-inset-bottom))] z-30 grid grid-cols-5 rounded-[24px] border border-white/[0.18] bg-[#07133F]/88 px-2 py-2 shadow-[0_18px_60px_rgba(0,0,0,0.40)] backdrop-blur-xl lg:hidden"
    >
      {items.map((item) => (
        <Link
          className={`relative flex min-h-14 flex-col items-center justify-center gap-1 rounded-2xl text-[11px] transition active:scale-95 ${
            item.active ? "text-[#2ED3FF]" : "text-white/72"
          }`}
          href={item.href}
          key={item.href}
        >
          {item.active ? (
            <span className="absolute -top-2 h-1 w-10 rounded-full bg-[#1D9DFF]" />
          ) : null}
          <Icon className="h-6 w-6" name={item.icon} />
          <span>{item.label}</span>
        </Link>
      ))}
    </nav>
  );
}

function TopInfluencers({ profiles }: { profiles: DashboardProfile[] }) {
  return (
    <section className="rounded-[24px] border border-white/[0.10] bg-white/[0.06] p-5 shadow-[0_24px_80px_rgba(0,0,0,0.35)] backdrop-blur-xl">
      <div className="mb-5 flex items-center justify-between">
        <h2 className="text-lg font-semibold text-white lg:text-[#F5F2E9]">
          Top Influencers
        </h2>
        <Link
          className="text-xs font-semibold text-[#C9FBFF] lg:text-[#FFD700]"
          href={routes.influencers()}
        >
          View all
        </Link>
      </div>
      <div className="space-y-1">
        {profiles.slice(0, 5).map((profile) => (
          <div
            className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-3 border-b border-white/[0.08] py-3 last:border-b-0 sm:grid-cols-[minmax(0,1fr)_auto_auto]"
            key={profile.id}
          >
            <div className="flex min-w-0 items-center gap-3">
              <div className="relative grid h-11 w-11 shrink-0 place-items-center rounded-full bg-[#00D4FF]/14 text-sm font-bold text-[#C9FBFF] lg:bg-[#FFD700]/15 lg:text-[#FFD700]">
                {getInitials(profile.name)}
                <span className="absolute -bottom-1 -right-1 rounded-full bg-black px-1.5 py-0.5 text-[9px] font-bold text-white lg:text-[#F5F2E9]">
                  {profile.platform[0]}
                </span>
              </div>
              <div className="min-w-0">
                <p className="truncate text-sm font-semibold text-white lg:text-[#F5F2E9]">
                  {profile.name}
                </p>
                <p className="truncate text-xs text-white/72 lg:text-[#B8B3A7]">
                  {profile.handle}
                </p>
                <p className="mt-0.5 text-[11px] text-white/72 lg:text-[#B8B3A7]/80">
                  {formatCompactNumber(profile.followers)} followers
                </p>
              </div>
            </div>
            <span className="hidden rounded-full border border-white/[0.10] px-2 py-1 text-xs text-white lg:text-[#F5F2E9]/85 sm:inline">
              {profile.industry}
            </span>
            <div className="text-right">
              <p className="text-[10px] uppercase text-white/72 lg:text-[#B8B3A7]">
                Match
              </p>
              <p className="text-xl font-bold text-[#45B36B]">{profile.matchScore}</p>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}

function RecentActivity({ firstInfluencer }: { firstInfluencer: string }) {
  const items: Array<{
    icon: IconName;
    color: string;
    title: string;
    detail: string;
    time: string;
  }> = [
    {
      icon: "trending",
      color: "bg-[#45B36B]/15 text-[#45B36B]",
      title: `New influencer joined: ${firstInfluencer}`,
      detail: "Tech - 125K followers",
      time: "2h ago",
    },
    {
      icon: "briefcase",
      color: "bg-[#00D4FF]/14 text-[#C9FBFF] lg:bg-[#FFD700]/15 lg:text-[#FFD700]",
      title: 'Campaign "Agri-Tech Awareness" is now live',
      detail: "12 influencers - Ends in 18 days",
      time: "5h ago",
    },
    {
      icon: "chart",
      color: "bg-[#3AA2E3]/15 text-[#3AA2E3]",
      title: "ROI update: Beverage Promotion Campaign",
      detail: "Current ROI: 3.82x",
      time: "1d ago",
    },
  ];

  return (
    <section className="rounded-[24px] border border-white/[0.10] bg-white/[0.06] p-5 shadow-[0_24px_80px_rgba(0,0,0,0.35)] backdrop-blur-xl">
      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-lg font-semibold text-white lg:text-[#F5F2E9]">
          Recent Activity
        </h2>
        <Link
          className="text-xs font-semibold text-[#C9FBFF] lg:text-[#FFD700]"
          href="/messages"
        >
          View all
        </Link>
      </div>
      <div className="space-y-3">
        {items.map((item) => (
          <div
            className="grid grid-cols-[40px_minmax(0,1fr)] gap-3 border-b border-white/[0.08] pb-3 last:border-b-0 last:pb-0 sm:grid-cols-[40px_minmax(0,1fr)_auto]"
            key={item.title}
          >
            <div className={`grid h-10 w-10 place-items-center rounded-full ${item.color}`}>
              <Icon className="h-5 w-5" name={item.icon} />
            </div>
            <div className="min-w-0">
              <p className="truncate text-sm text-white lg:text-[#F5F2E9]">
                {item.title}
              </p>
              <p className="mt-1 text-xs text-white/72 lg:text-[#B8B3A7]">
                {item.detail}
              </p>
            </div>
            <p className="col-start-2 text-xs text-white/72 lg:text-[#B8B3A7] sm:col-start-auto">
              {item.time}
            </p>
          </div>
        ))}
      </div>
    </section>
  );
}

function PlatformDistribution() {
  return (
    <section className="rounded-[24px] border border-white/[0.10] bg-white/[0.06] p-5 shadow-[0_24px_80px_rgba(0,0,0,0.35)] backdrop-blur-xl">
      <div className="mb-5 flex items-center justify-between">
        <h2 className="text-lg font-semibold text-white lg:text-[#F5F2E9]">
          Platform Distribution
        </h2>
        <Link
          className="text-xs font-semibold text-[#C9FBFF] lg:text-[#FFD700]"
          href={routes.analytics()}
        >
          View report
        </Link>
      </div>
      <div className="flex flex-col items-center gap-6 sm:flex-row">
        <div
          aria-label="Platform distribution donut chart"
          className="h-36 w-36 shrink-0 rounded-full"
          style={{
            background:
              "conic-gradient(#E63746 0 42%, #C83CA7 42% 70%, #FF2738 70% 86%, #3AA2E3 86% 95%, #77736A 95% 100%)",
          }}
        >
          <div className="m-8 h-20 w-20 rounded-full bg-[#101010]" />
        </div>
        <div className="w-full space-y-3">
          {platformDistribution.map((platform) => (
            <div className="flex items-center gap-3 text-sm" key={platform.name}>
              <span
                className="h-2.5 w-2.5 rounded-full"
                style={{ backgroundColor: platform.color }}
              />
              <span className="flex-1 text-white lg:text-[#F5F2E9]">
                {platform.name}
              </span>
              <span className="font-semibold text-white lg:text-[#F5F2E9]">
                {platform.value}%
              </span>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function GrowthCta() {
  return (
    <section className="relative min-h-[232px] overflow-hidden rounded-[24px] border border-[#00D4FF]/35 bg-[linear-gradient(135deg,rgba(45,90,39,0.72),rgba(8,8,8,0.98)_62%)] p-6 shadow-[0_24px_80px_rgba(0,0,0,0.35)] lg:border-[#FFD700]/25">
      <Image
        alt="Business growth partnership"
        className="object-cover opacity-20"
        fill
        sizes="(min-width: 1024px) 330px, 100vw"
        src="/images/dashboard/cta-growth.jpg"
      />
      <div className="absolute bottom-5 right-5 text-[#C9FBFF] lg:text-[#FFD700]/55">
        <Icon className="h-24 w-24" name="rocket" />
      </div>
      <div className="relative max-w-xs">
        <h2 className="text-xl font-bold leading-8 text-[#C9FBFF] lg:text-[#FFD700]">
          Find the Right Influencers. Grow Your Business.
        </h2>
        <p className="mt-4 text-sm leading-6 text-white lg:text-[#F5F2E9]/90">
          Connect with verified influencers across multiple platforms and industries.
        </p>
        <Link
          className="mt-6 inline-flex rounded-lg bg-white px-5 py-3 text-sm font-bold text-black transition hover:bg-[#C8A94B] lg:bg-[#FFD700]"
          href={routes.influencers()}
        >
          Explore Influencers
        </Link>
      </div>
    </section>
  );
}

function BackendOffline({ error }: { error?: string }) {
  return (
    <div className="rounded-2xl border border-[#00D4FF]/40 bg-[#00D4FF]/12 p-5 text-white shadow-[0_24px_80px_rgba(0,0,0,0.34)] backdrop-blur-xl lg:border-[#FFD700]/35 lg:bg-[#FFD700]/10 lg:text-[#F5F2E9]">
      <p className="text-sm font-semibold uppercase text-[#C9FBFF] lg:text-[#FFD700]">
        Backend Offline
      </p>
      <h2 className="mt-2 text-2xl font-semibold">Odoo ERP is not responding</h2>
      <p className="mt-2 max-w-2xl text-sm leading-6 text-white/72 lg:text-[#B8B3A7]">
        Start Odoo on localhost:8069 and confirm the influencer_link_db database
        is available. The dashboard stays usable with safe fallback content while
        the backend is offline.
      </p>
      {error ? (
        <p className="mt-3 text-xs text-white/72 lg:text-[#B8B3A7]">{error}</p>
      ) : null}
    </div>
  );
}

export default async function DashboardPage() {
  const session = await getCurrentSession();

  if (!session) {
    redirect(routes.login());
  }

  if (session.normalizedRole === "influencer") {
    redirect(routes.influencerDashboard());
  }

  const [dashboardData, campaignsResult, displayName] = await Promise.all([
    readDashboardData(),
    fetchCampaigns(),
    resolveDisplayName(session),
  ]);
  const rawIndustries = dashboardData.isOnline
    ? dashboardData.industries
    : fallbackIndustries;
  const rawProfiles = dashboardData.isOnline ? dashboardData.profiles : fallbackProfiles;
  const profiles = rawProfiles
    .map(normalizeProfile)
    .sort((first, second) => second.matchScore - first.matchScore);
  const industries = rawIndustries.map((industry) =>
    normalizeIndustry(industry, rawProfiles),
  );
  const averageRoi =
    calculateAverageRoi(profiles.map((profile) => profile.roiMultiplier)) || 3.46;
  const activeCampaigns = campaignsResult.success
    ? campaignsResult.data.filter(
        (campaign) =>
          !["completed", "cancelled", "canceled"].includes(campaign.status),
      ).length
    : 0;

  return (
    <div className="space-y-5 pb-[calc(10rem+env(safe-area-inset-bottom))] lg:pb-0">
      {dashboardData.isOnline ? null : <BackendOffline error={dashboardData.error} />}
      <Hero displayName={displayName} email={session.email} />
      <QuickActions />
      <section className="grid grid-cols-2 gap-3 sm:gap-4 xl:grid-cols-4">
        <MetricCard
          icon="building"
          title="Industries Matched"
          trend="+20%"
          value={String(dashboardData.isOnline ? dashboardData.industries.length : 0)}
        />
        <MetricCard
          icon="users"
          title="Influencers"
          trend="+15%"
          value={String(dashboardData.isOnline ? dashboardData.profiles.length : 0)}
        />
        <MetricCard
          icon="rocket"
          title="Active Campaigns"
          trend="+33%"
          value={String(activeCampaigns)}
        />
        <MetricCard
          icon="trending"
          title="Avg. ROI Multiplier"
          trend="+12%"
          value={`${averageRoi.toFixed(2)}x`}
        />
      </section>
      <div className="grid gap-5 xl:grid-cols-[minmax(0,2fr)_minmax(320px,1fr)]">
        <div className="space-y-5">
          <IndustriesOverview industries={industries} />
          <div className="grid gap-5 xl:grid-cols-2">
            <RecentActivity
              firstInfluencer={profiles[0]?.name ?? "Mekdes Tech Talks"}
            />
            <PlatformDistribution />
          </div>
        </div>
        <div className="space-y-5">
          <TopInfluencers profiles={profiles} />
          <GrowthCta />
        </div>
      </div>
      <footer className="hidden flex-col gap-2 border-t border-white/[0.08] py-4 text-xs text-white/72 sm:flex-row sm:items-center sm:justify-between lg:flex lg:text-[#B8B3A7]">
        <p>(c) 2026 InfluencerLink ET. All rights reserved.</p>
        <p>Built in Ethiopia. Built for the World.</p>
      </footer>
      <MobileBottomNav />
    </div>
  );
}
