import Link from "next/link";
import { InfluencerHeroCarousel } from "@/components/influencer/InfluencerHeroCarousel";
import { ButtonLink } from "@/components/ui/Button";
import { EmptyState } from "@/components/ui/EmptyState";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { getCampaignStatusDescription } from "@/lib/campaign-lifecycle";
import { fetchCampaigns, type Campaign } from "@/lib/campaigns";
import {
  formatCompactNumber,
  formatPercent,
  formatRoiMultiplier,
} from "@/lib/formatters";
import { fetchInfluencerDetail, type InfluencerDetail } from "@/lib/influencers";
import { fetchMessages } from "@/lib/messages";
import { getCurrentSession } from "@/lib/session";
import {
  fetchSocialAccounts,
  getSocialPlatformLabel,
  getVerificationStatusLabel,
  getVerificationStatusTone,
  type InfluencerSocialAccount,
  type SocialPlatform,
} from "@/lib/social-accounts";

export const dynamic = "force-dynamic";

const platformOrder: SocialPlatform[] = ["tiktok", "youtube", "telegram", "instagram"];
const platformRank = new Map(platformOrder.map((platform, index) => [platform, index]));

function displayMetric(value: number | null | undefined, formatter = formatCompactNumber) {
  return typeof value === "number" && Number.isFinite(value) && value > 0
    ? formatter(value)
    : "0";
}

function calculateProfileCompletion(
  profile: InfluencerDetail,
  accounts: InfluencerSocialAccount[],
) {
  const hasVerifiedAccount = accounts.some(
    (account) => account.verificationStatus === "verified",
  );
  const items = [
    Boolean(profile.handle),
    Boolean(profile.platform),
    Boolean(profile.bio),
    Boolean(profile.locationFocus),
    Boolean(profile.industry && profile.industry !== "Emerging Sector"),
    accounts.length > 0,
    hasVerifiedAccount,
    profile.avgFoodViews > 0 || accounts.some((account) => (account.avgViews || 0) > 0),
  ];

  return Math.round((items.filter(Boolean).length / items.length) * 100);
}

function campaignPreview(campaigns: Campaign[]) {
  const priorityStatuses = new Set(["pending", "draft", "sent", "active"]);
  const priority = campaigns.filter((campaign) => priorityStatuses.has(campaign.status));
  return (priority.length ? priority : campaigns).slice(0, 3);
}

function orderedPlatformAccounts(accounts: InfluencerSocialAccount[]) {
  return [...accounts].sort((a, b) => {
    const aRank = platformRank.get(a.platform) ?? platformOrder.length;
    const bRank = platformRank.get(b.platform) ?? platformOrder.length;

    return aRank - bRank || a.id - b.id;
  });
}

function platformIconClasses(platform: SocialPlatform) {
  const classes: Record<SocialPlatform, string> = {
    facebook: "bg-[#1877F2] text-white shadow-[#1877F2]/30",
    instagram:
      "bg-[linear-gradient(135deg,#FFB000_0%,#FF3869_45%,#7C3AED_100%)] text-white shadow-[#FF3869]/30",
    linkedin: "bg-[#0A66C2] text-white shadow-[#0A66C2]/30",
    other: "bg-[#EEF5FF] text-[#1D4DFF] shadow-[#1D4DFF]/16",
    telegram: "bg-[#2AABEE] text-white shadow-[#2AABEE]/30",
    tiktok:
      "bg-[linear-gradient(135deg,#050505_0%,#171717_58%,#00F2EA_59%,#FF0050_100%)] text-white shadow-[#00F2EA]/22",
    x_twitter: "bg-[#111827] text-white shadow-black/25",
    youtube: "bg-[#FF0033] text-white shadow-[#FF0033]/30",
  };

  return classes[platform] ?? classes.other;
}

function PlatformBrandIcon({ platform }: { platform: SocialPlatform }) {
  const common = {
    fill: "none",
    stroke: "currentColor",
    strokeLinecap: "round" as const,
    strokeLinejoin: "round" as const,
    strokeWidth: 2,
  };

  return (
    <svg aria-hidden="true" className="h-5 w-5" viewBox="0 0 24 24">
      {platform === "youtube" ? (
        <path
          d="M9.5 8.4v7.2l6.2-3.6-6.2-3.6Z"
          fill="currentColor"
        />
      ) : platform === "telegram" ? (
        <path
          d="M20.5 4.5 3.8 11.1c-.9.4-.9 1.6.1 1.9l4.2 1.3 1.7 4.9c.3.9 1.5 1 2 .2l2.4-3.2 4.1 3c.8.6 1.9.1 2.1-.9l2-12.2c.2-1.1-.8-2-1.9-1.6Z"
          fill="currentColor"
        />
      ) : platform === "tiktok" ? (
        <>
          <path {...common} d="M14 4v10.2a4.2 4.2 0 1 1-3.2-4.1" />
          <path {...common} d="M14 4c.6 3 2.5 4.9 5.4 5.4" />
        </>
      ) : platform === "instagram" ? (
        <>
          <rect {...common} height="14" rx="4" width="14" x="5" y="5" />
          <circle {...common} cx="12" cy="12" r="3" />
          <path {...common} d="M16.5 7.6h.01" />
        </>
      ) : (
        <>
          <circle {...common} cx="12" cy="12" r="8" />
          <path {...common} d="M3.5 12h17M12 3.8c2 2.2 3 4.9 3 8.2s-1 6-3 8.2c-2-2.2-3-4.9-3-8.2s1-6 3-8.2Z" />
        </>
      )}
    </svg>
  );
}

function platformStatusText(account: InfluencerSocialAccount) {
  if (account.verificationStatus === "verified") return "Verified";
  if (account.verificationStatus === "pending" || account.verificationStatus === "needs_review") {
    return "Pending";
  }
  if (account.lastSyncedAt) return "Connected";

  return getVerificationStatusLabel(account.verificationStatus);
}

function PlatformChip({
  account,
}: {
  account: InfluencerSocialAccount;
}) {
  return (
    <Link
      className="inline-flex min-h-12 shrink-0 items-center gap-2 rounded-full border border-white/34 bg-white/20 py-1 pl-1.5 pr-3 text-white shadow-[0_14px_34px_rgba(0,0,0,0.18),inset_0_1px_0_rgba(255,255,255,0.18)] backdrop-blur-xl transition active:scale-95"
      href="/influencer/social-accounts"
    >
      <span className={`grid h-10 w-10 place-items-center rounded-full ring-1 ring-white/24 shadow-lg ${platformIconClasses(account.platform)}`}>
        <PlatformBrandIcon platform={account.platform} />
      </span>
      <span className="min-w-0">
        <span className="block max-w-[7.5rem] truncate text-xs font-black leading-4">
          {getSocialPlatformLabel(account.platform)}
        </span>
        <span className="flex items-center gap-1 text-[10px] font-bold leading-3 text-white/70">
          <span
            className={`h-1.5 w-1.5 rounded-full ${
              account.verificationStatus === "verified" ? "bg-[#32D583]" : "bg-[#9CEFFF]"
            }`}
          />
          <span className="max-w-[7.25rem] truncate">
            {account.handle || platformStatusText(account)}
          </span>
        </span>
      </span>
    </Link>
  );
}

function PlatformChips({ accounts }: { accounts: InfluencerSocialAccount[] }) {
  const ordered = orderedPlatformAccounts(accounts);

  return (
    <section className="overflow-hidden">
      {ordered.length ? (
        <div className="no-scrollbar -mx-3 flex gap-2 overflow-x-auto px-3 pb-1">
          {ordered.map((account) => (
            <PlatformChip account={account} key={account.id} />
          ))}
        </div>
      ) : (
        <Link
          className="flex min-h-12 items-center justify-between rounded-2xl border border-white/18 bg-white/14 px-4 text-sm font-bold text-white backdrop-blur-xl transition active:scale-[0.99]"
          href="/influencer/social-accounts"
        >
          <span>Connect platforms</span>
          <span aria-hidden="true">+</span>
        </Link>
      )}
    </section>
  );
}

function Icon({
  className = "h-5 w-5",
  name,
}: {
  className?: string;
  name: "chart" | "check" | "coins" | "message" | "profile" | "rocket" | "social";
}) {
  const common = {
    fill: "none",
    stroke: "currentColor",
    strokeLinecap: "round" as const,
    strokeLinejoin: "round" as const,
    strokeWidth: 1.9,
  };

  return (
    <svg aria-hidden="true" className={className} viewBox="0 0 24 24">
      {name === "chart" ? (
        <>
          <path {...common} d="M4 19V5" />
          <path {...common} d="M8 17V9" />
          <path {...common} d="M13 17V6" />
          <path {...common} d="M18 17v-4" />
          <path {...common} d="M3 19h18" />
        </>
      ) : name === "check" ? (
        <path {...common} d="m5 12 4 4L19 6" />
      ) : name === "coins" ? (
        <>
          <ellipse {...common} cx="8" cy="7" rx="5" ry="3" />
          <path {...common} d="M3 7v8c0 1.7 2.2 3 5 3s5-1.3 5-3V7" />
          <path {...common} d="M13 11c.9-.6 2.1-1 3.5-1 2.5 0 4.5 1.1 4.5 2.5S19 15 16.5 15c-1.4 0-2.6-.4-3.5-1" />
        </>
      ) : name === "message" ? (
        <path {...common} d="M21 15a4 4 0 0 1-4 4H8l-5 3V7a4 4 0 0 1 4-4h10a4 4 0 0 1 4 4Z" />
      ) : name === "profile" ? (
        <>
          <circle {...common} cx="12" cy="8" r="4" />
          <path {...common} d="M4 21a8 8 0 0 1 16 0" />
        </>
      ) : name === "rocket" ? (
        <>
          <path {...common} d="M4.5 16.5c-1 1-1.5 2.5-1.5 4.5 2 0 3.5-.5 4.5-1.5" />
          <path {...common} d="M9 15 7 13a14 14 0 0 1 8-9l4-1-1 4a14 14 0 0 1-9 8Z" />
          <path {...common} d="M9 15v4h4l2-5M7 13H3V9l5-2" />
        </>
      ) : (
        <>
          <path {...common} d="M12 3 14.5 5 18 5.5l.5 3.5 2.5 3-2.5 3-.5 3.5-3.5.5-2.5 2-2.5-2-3.5-.5-.5-3.5-2.5-3 2.5-3 .5-3.5L9.5 5Z" />
          <path {...common} d="m8.5 12 2.2 2.2 4.8-5" />
        </>
      )}
    </svg>
  );
}

function QuickActions({
  pendingCampaigns,
  pendingSocial,
  unreadMessages,
}: {
  pendingCampaigns: number;
  pendingSocial: number;
  unreadMessages: number;
}) {
  const actions = [
    {
      badge: pendingCampaigns,
      glow: "bg-[#2ED3FF]/28",
      gradient: "bg-[linear-gradient(135deg,#1D4DFF_0%,#2ED3FF_100%)]",
      href: "/influencer/campaigns",
      icon: "rocket" as const,
      subtitle: "Review invites",
      title: "Campaigns",
    },
    {
      badge: unreadMessages,
      glow: "bg-[#7C3AED]/24",
      gradient: "bg-[linear-gradient(135deg,#7C3AED_0%,#1D4DFF_100%)]",
      href: "/influencer/messages",
      icon: "message" as const,
      subtitle: "Brand inbox",
      title: "Messages",
    },
    {
      glow: "bg-[#32D583]/24",
      gradient: "bg-[linear-gradient(135deg,#16A34A_0%,#2ED3FF_100%)]",
      href: "/influencer/earnings",
      icon: "coins" as const,
      subtitle: "Track payouts",
      title: "Earnings",
    },
    {
      badge: pendingSocial,
      glow: "bg-[#8B5CF6]/24",
      gradient: "bg-[linear-gradient(135deg,#9333EA_0%,#2563EB_100%)]",
      href: "/influencer/social-accounts",
      icon: "social" as const,
      subtitle: "Sync profiles",
      title: "Social",
    },
  ];

  return (
    <section className="grid grid-cols-2 gap-2.5 min-[390px]:gap-3">
      {actions.map((action) => (
        <Link
          className="group relative flex min-h-[104px] overflow-hidden rounded-3xl border border-white/75 bg-[linear-gradient(145deg,#FFFFFF_0%,#F7FBFF_52%,#EAF3FF_100%)] p-3.5 text-[#071E73] shadow-[0_18px_40px_rgba(5,20,92,0.16),inset_0_1px_0_rgba(255,255,255,0.95)] transition active:scale-[0.98] min-[390px]:min-h-[112px] min-[390px]:p-4"
          href={action.href}
          key={action.href}
        >
          <span className={`pointer-events-none absolute -left-4 -top-5 h-20 w-20 rounded-full blur-2xl ${action.glow}`} />
          <span className="relative flex items-start justify-between gap-2">
            <span className={`grid h-[52px] w-[52px] place-items-center rounded-[20px] text-white shadow-[0_14px_30px_rgba(29,77,255,0.24),inset_0_1px_0_rgba(255,255,255,0.28)] ${action.gradient}`}>
              <Icon className="h-7 w-7" name={action.icon} />
            </span>
            <span className="mt-1 text-[#7E95BD] transition group-active:translate-x-0.5" aria-hidden="true">
              ›
            </span>
          </span>
          {action.badge ? (
            <span className="absolute right-8 top-3 grid h-6 min-w-6 place-items-center rounded-full bg-[#071E73] px-2 text-[11px] font-black text-white shadow-[0_8px_18px_rgba(7,30,115,0.24)]">
              {action.badge}
            </span>
          ) : null}
          <span className="relative mt-2 block">
            <span className="block text-[15px] font-black leading-4 text-[#061A55]">
              {action.title}
            </span>
            <span className="mt-1 block text-[11px] font-bold leading-4 text-[#5E759F] min-[390px]:text-xs">
              {action.subtitle}
            </span>
          </span>
        </Link>
      ))}
    </section>
  );
}

function KpiGrid({
  completion,
  profile,
}: {
  completion: number;
  profile: InfluencerDetail;
}) {
  const items = [
    {
      helper: "Profile strength",
      label: "Profile Completion",
      value: `${completion}%`,
      progress: completion,
      tone: "green",
    },
    {
      helper: "Synced average",
      label: "Avg Views",
      value: displayMetric(profile.avgFoodViews),
      progress: profile.avgFoodViews > 0 ? Math.min(100, Math.max(18, profile.avgFoodViews / 1000)) : 0,
      tone: "cyan",
    },
    {
      helper: "Campaign return",
      label: "ROI Multiplier",
      value: formatRoiMultiplier(profile.roiMultiplier, "0x"),
      progress: profile.roiMultiplier > 0 ? Math.min(100, profile.roiMultiplier * 28) : 0,
      tone: "blue",
    },
    {
      helper: "Brand fit",
      label: "Match Score",
      value: `${profile.matchScore || 0}%`,
      progress: profile.matchScore || 0,
      tone: "cyan",
    },
  ];

  return (
    <section className="grid grid-cols-2 gap-2.5 min-[390px]:gap-3">
      {items.map((item) => (
        <article
          className="min-h-[92px] overflow-hidden rounded-[20px] border border-white/18 bg-white/14 p-3 text-white shadow-[0_14px_38px_rgba(0,0,0,0.13)] backdrop-blur-xl min-[390px]:min-h-[104px] min-[390px]:p-3.5"
          key={item.label}
        >
          <div className="flex items-start justify-between gap-2">
            <div className="min-w-0">
              <p className="text-[10px] font-bold uppercase leading-3 tracking-[0.06em] text-white/65 min-[390px]:text-[11px]">
                {item.label}
              </p>
              <p className="mt-2 text-[22px] font-black leading-none min-[390px]:text-2xl">
                {item.value}
              </p>
            </div>
            {item.label === "Profile Completion" ? (
              <ProgressRing progress={item.progress} />
            ) : (
              <MiniTrend progress={item.progress} tone={item.tone} />
            )}
          </div>
          <p className="mt-1 text-[11px] font-semibold leading-4 text-[#9CEFFF] min-[390px]:text-xs">
            {item.helper}
          </p>
          <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-white/16">
            <div
              className={`influencer-kpi-fill h-full rounded-full ${
                item.tone === "green"
                  ? "bg-[#32D583]"
                  : item.tone === "blue"
                    ? "bg-[#1D4DFF]"
                    : "bg-[#2ED3FF]"
              }`}
              style={{ width: `${Math.max(0, Math.min(100, item.progress))}%` }}
            />
          </div>
        </article>
      ))}
    </section>
  );
}

function ProgressRing({ progress }: { progress: number }) {
  const safeProgress = Math.max(0, Math.min(100, progress));

  return (
    <span
      aria-hidden="true"
      className="grid h-10 w-10 shrink-0 place-items-center rounded-full text-[10px] font-black text-white"
      style={{
        background: `conic-gradient(#32D583 ${safeProgress * 3.6}deg, rgba(255,255,255,0.16) 0deg)`,
      }}
    >
      <span className="grid h-7 w-7 place-items-center rounded-full bg-[#071E73]/90">
        {safeProgress}
      </span>
    </span>
  );
}

function MiniTrend({ progress, tone }: { progress: number; tone: string }) {
  const safeProgress = Math.max(0, Math.min(100, progress));
  const heights = [28, 44, 36, 54, Math.max(18, safeProgress)];
  const color =
    tone === "blue" ? "bg-[#8EA6FF]" : tone === "green" ? "bg-[#9DFFCA]" : "bg-[#9CEFFF]";

  return (
    <span aria-hidden="true" className="flex h-10 shrink-0 items-end gap-1">
      {heights.map((height, index) => (
        <span
          className={`w-1.5 rounded-full ${color}`}
          key={`${height}-${index}`}
          style={{
            height: `${height}%`,
            opacity: index === heights.length - 1 ? 1 : 0.55,
          }}
        />
      ))}
    </span>
  );
}

function SectionTitle({
  action,
  title,
}: {
  action?: { href: string; label: string };
  title: string;
}) {
  return (
    <div className="flex items-center justify-between gap-3">
      <h2 className="text-lg font-black text-white">{title}</h2>
      {action ? (
        <Link className="text-xs font-black text-[#C9FBFF]" href={action.href}>
          {action.label}
        </Link>
      ) : null}
    </div>
  );
}

function CampaignInvitations({ campaigns }: { campaigns: Campaign[] }) {
  const previews = campaignPreview(campaigns);

  return (
    <section className="space-y-3">
      <SectionTitle
        action={{ href: "/influencer/campaigns", label: "View all" }}
        title="Campaign Invitations"
      />
      {previews.length ? (
        <div className="space-y-3">
          {previews.map((campaign) => (
            <article
              className="rounded-[24px] border border-white/18 bg-white/92 p-4 text-[#071E73] shadow-[0_18px_48px_rgba(5,20,92,0.16)]"
              key={campaign.id}
            >
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="truncate text-base font-black">{campaign.name}</p>
                  <p className="mt-1 truncate text-sm font-semibold text-[#43608E]">
                    {campaign.businessName || "Business"} - {campaign.platform || "Platform TBD"}
                  </p>
                </div>
                <StatusBadge status={campaign.status} />
              </div>
              <div className="mt-3 flex items-center justify-between gap-3">
                <p className="text-xs font-bold text-[#43608E]">
                  {campaign.budgetRange || "Budget TBD"}
                </p>
                <ButtonLink href="/influencer/campaigns" size="sm">
                  View
                </ButtonLink>
              </div>
              <p className="mt-3 line-clamp-2 text-xs leading-5 text-[#43608E]">
                {getCampaignStatusDescription(campaign.status)}
              </p>
            </article>
          ))}
        </div>
      ) : (
        <article className="rounded-[24px] border border-white/18 bg-white/12 p-5 text-center text-white backdrop-blur-xl">
          <p className="text-base font-black">No campaign invitations yet</p>
          <p className="mt-2 text-sm leading-6 text-white/72">
            Keep your profile updated so brands can discover you.
          </p>
        </article>
      )}
    </section>
  );
}

function ConnectedPlatforms({ accounts }: { accounts: InfluencerSocialAccount[] }) {
  return (
    <section className="space-y-3">
      <SectionTitle
        action={{ href: "/influencer/social-accounts", label: "Manage" }}
        title="Connected Platforms"
      />
      {accounts.length ? (
        <div className="space-y-2">
          {orderedPlatformAccounts(accounts).map((account) => (
            <Link
              className="flex min-h-[72px] items-center gap-3 rounded-[22px] border border-white/16 bg-white/12 p-3 text-white backdrop-blur-xl transition active:scale-[0.99]"
              href="/influencer/social-accounts"
              key={account.id}
            >
              <span className={`grid h-11 w-11 shrink-0 place-items-center rounded-2xl ${platformIconClasses(account.platform)}`}>
                <PlatformBrandIcon platform={account.platform} />
              </span>
              <span className="min-w-0 flex-1">
                <span className="block truncate text-sm font-black">
                  {getSocialPlatformLabel(account.platform)}
                </span>
                <span className="mt-1 block truncate text-xs font-semibold text-white/68">
                  {account.handle || "Handle missing"}
                </span>
                {account.lastSyncedAt ? (
                  <span className="mt-1 block text-[11px] font-semibold text-[#9CEFFF]">
                    Synced
                  </span>
                ) : null}
              </span>
              <StatusBadge tone={getVerificationStatusTone(account.verificationStatus)}>
                {getVerificationStatusLabel(account.verificationStatus)}
              </StatusBadge>
            </Link>
          ))}
        </div>
      ) : (
        <article className="rounded-[24px] border border-white/18 bg-white/12 p-5 text-white backdrop-blur-xl">
          <p className="text-base font-black">Connect your first platform</p>
          <p className="mt-2 text-sm leading-6 text-white/72">
            Add TikTok, YouTube, Telegram, or Instagram to unlock verified metrics.
          </p>
          <ButtonLink className="mt-4 w-full" href="/influencer/social-accounts">
            Connect Platform
          </ButtonLink>
        </article>
      )}
    </section>
  );
}

function buildPerformance(accounts: InfluencerSocialAccount[], profile: InfluencerDetail) {
  const syncedAccounts = accounts.filter(
    (account) =>
      (account.avgViews || 0) > 0 ||
      (account.followersCount || 0) > 0 ||
      (account.engagementRate || 0) > 0,
  );
  const avgViews =
    syncedAccounts.reduce((sum, account) => sum + (account.avgViews || 0), 0) ||
    profile.avgFoodViews;
  const avgLikes = syncedAccounts.reduce((sum, account) => sum + (account.avgLikes || 0), 0);
  const avgComments = syncedAccounts.reduce(
    (sum, account) => sum + (account.avgComments || 0),
    0,
  );
  const engagementRates = syncedAccounts
    .map((account) => account.engagementRate || 0)
    .filter((value) => value > 0);
  const engagementRate = engagementRates.length
    ? engagementRates.reduce((sum, value) => sum + value, 0) / engagementRates.length
    : null;
  const audienceGrowth = Math.max(
    profile.addisAudiencePercent,
    ...syncedAccounts.map((account) => account.audienceAddisPercent || 0),
  );

  return {
    audienceGrowth,
    avgComments,
    avgLikes,
    avgViews,
    engagementRate,
    hasData:
      avgViews > 0 ||
      avgLikes > 0 ||
      avgComments > 0 ||
      Boolean(engagementRate) ||
      audienceGrowth > 0,
  };
}

function Sparkline({ values }: { values: number[] }) {
  const max = Math.max(...values, 1);
  const points = values
    .map((value, index) => {
      const x = (index / Math.max(values.length - 1, 1)) * 120;
      const y = 48 - (value / max) * 38;
      return `${x},${y}`;
    })
    .join(" ");

  return (
    <svg className="h-16 w-full" preserveAspectRatio="none" viewBox="0 0 120 56">
      <polyline
        fill="none"
        points={points}
        stroke="#8EF8FF"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="4"
      />
    </svg>
  );
}

function PerformanceSummary({
  accounts,
  profile,
}: {
  accounts: InfluencerSocialAccount[];
  profile: InfluencerDetail;
}) {
  const performance = buildPerformance(accounts, profile);

  return (
    <section className="space-y-3">
      <SectionTitle title="Performance Summary" />
      <article className="rounded-[28px] border border-white/18 bg-[#071E73]/62 p-5 text-white shadow-[0_18px_58px_rgba(0,0,0,0.20)] backdrop-blur-xl">
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="text-[11px] font-black uppercase tracking-[0.16em] text-[#9CEFFF]">
              Last 30 days
            </p>
            <p className="mt-2 text-3xl font-black">
              {displayMetric(performance.avgViews)}
            </p>
            <p className="text-sm font-semibold text-white/68">avg views</p>
          </div>
          <span className="grid h-12 w-12 place-items-center rounded-2xl bg-white/14 text-[#9CEFFF]">
            <Icon name="chart" />
          </span>
        </div>
        {performance.hasData ? (
          <>
            <div className="mt-4 rounded-2xl bg-white/10 p-3">
              <Sparkline
                values={[
                  performance.avgComments,
                  performance.avgLikes,
                  performance.avgViews,
                  performance.audienceGrowth,
                  performance.engagementRate || 0,
                ]}
              />
            </div>
            <div className="mt-4 grid grid-cols-2 gap-3 text-sm">
              <MetricPill
                label="Engagement"
                value={
                  performance.engagementRate
                    ? formatPercent(performance.engagementRate, 1)
                    : "0%"
                }
              />
              <MetricPill
                label="Audience Addis"
                value={formatPercent(performance.audienceGrowth || 0, 0)}
              />
            </div>
          </>
        ) : (
          <p className="mt-5 rounded-2xl border border-white/16 bg-white/10 p-4 text-sm leading-6 text-white/72">
            Performance data will appear after social sync.
          </p>
        )}
      </article>
    </section>
  );
}

function MetricPill({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl bg-white/10 p-3">
      <p className="text-[11px] font-bold uppercase tracking-[0.08em] text-white/58">
        {label}
      </p>
      <p className="mt-1 text-lg font-black">{value}</p>
    </div>
  );
}

function SuggestedImprovements({
  accounts,
  profile,
}: {
  accounts: InfluencerSocialAccount[];
  profile: InfluencerDetail;
}) {
  const hasYoutubeOrTelegram = accounts.some((account) =>
    ["youtube", "telegram"].includes(account.platform),
  );
  const items = [
    {
      complete: Boolean(profile.bio),
      href: "/influencer/profile",
      label: "Add bio",
    },
    {
      complete: Boolean(profile.locationFocus),
      href: "/influencer/profile",
      label: "Add location focus",
    },
    {
      complete: Boolean(profile.industry && profile.industry !== "Emerging Sector"),
      href: "/influencer/profile",
      label: "Add niche tags",
    },
    {
      complete: accounts.length > 0,
      href: "/influencer/social-accounts",
      label: "Connect social account",
    },
    {
      complete: hasYoutubeOrTelegram,
      href: "/influencer/social-accounts",
      label: "Sync YouTube or Telegram",
    },
    {
      complete: accounts.some((account) => account.verificationStatus === "verified"),
      href: "/influencer/social-accounts",
      label: "Verify social account",
    },
  ];
  const completeCount = items.filter((item) => item.complete).length;

  return (
    <section className="space-y-3">
      <div>
        <SectionTitle title="Suggested Improvements" />
        <p className="mt-1 text-sm font-semibold text-white/68">
          {completeCount}/{items.length} completed
        </p>
      </div>
      <div className="overflow-hidden rounded-[24px] border border-white/18 bg-white/12 backdrop-blur-xl">
        {items.map((item) => (
          <Link
            className="flex min-h-[54px] items-center gap-3 border-b border-white/10 px-4 text-white last:border-b-0"
            href={item.href}
            key={item.label}
          >
            <span
              className={`grid h-7 w-7 shrink-0 place-items-center rounded-full border ${
                item.complete
                  ? "border-[#32D583]/50 bg-[#32D583]/16 text-[#9DFFCA]"
                  : "border-white/28 bg-white/8 text-white/54"
              }`}
            >
              {item.complete ? <Icon name="check" /> : null}
            </span>
            <span className="flex-1 text-sm font-bold">{item.label}</span>
            <span className="text-lg text-white/54" aria-hidden="true">
              ›
            </span>
          </Link>
        ))}
      </div>
    </section>
  );
}

function OpportunityCta() {
  return (
    <section className="rounded-[30px] border border-white/20 bg-[#1D4DFF] p-5 text-white shadow-[0_24px_70px_rgba(3,19,106,0.28)]">
      <p className="text-2xl font-black">New opportunities daily!</p>
      <p className="mt-2 text-sm leading-6 text-white/78">
        Keep your profile updated to get matched with the best brands.
      </p>
      <ButtonLink className="mt-4 w-full" href="/influencer/profile">
        Update Profile
      </ButtonLink>
    </section>
  );
}

function EmptyProfileCard() {
  return (
    <EmptyState
      action={<ButtonLink href="/influencer/profile" variant="secondary">View Profile</ButtonLink>}
      description="Once your Odoo influencer profile is linked to this session, your creator metrics and campaign invitations will appear here."
      title="Your influencer profile is being prepared."
    />
  );
}

export default async function CreatorDashboardPage() {
  const session = await getCurrentSession();
  const profileId = session?.influencerProfileId;

  if (!profileId) {
    return (
      <div className="mx-auto max-w-md pb-[calc(11rem+env(safe-area-inset-bottom))] lg:max-w-5xl lg:pb-0">
        <EmptyProfileCard />
      </div>
    );
  }

  const [profileResult, socialResult, campaignResult, messageResult] =
    await Promise.all([
      fetchInfluencerDetail(profileId),
      fetchSocialAccounts(profileId),
      fetchCampaigns([["influencer_id", "=", profileId]]),
      fetchMessages([
        ["influencer_id", "=", profileId],
        ["direction", "=", "business_to_influencer"],
        ["is_read", "=", false],
      ]),
    ]);

  const profile = profileResult.success ? profileResult.data : null;
  const accounts = socialResult.success
    ? socialResult.data.filter((account) => account.influencerId === profileId)
    : [];
  const campaigns = campaignResult.success
    ? campaignResult.data.filter((campaign) => campaign.influencerId === profileId)
    : [];
  const unreadMessages = messageResult.success
    ? messageResult.data.filter((message) => !message.isRead).length
    : 0;

  if (!profile) {
    return (
      <div className="mx-auto max-w-md pb-[calc(11rem+env(safe-area-inset-bottom))] lg:max-w-5xl lg:pb-0">
        <EmptyProfileCard />
      </div>
    );
  }

  const displayName = profile.name || session.displayName || "Creator";
  const completion = calculateProfileCompletion(profile, accounts);
  const pendingCampaigns = campaigns.filter((campaign) =>
    ["pending", "draft", "sent"].includes(campaign.status),
  ).length;
  const pendingSocial = accounts.filter((account) =>
    ["draft", "pending", "needs_review"].includes(account.verificationStatus),
  ).length;

  return (
    <div className="mx-auto max-w-md space-y-3.5 pb-[calc(11rem+env(safe-area-inset-bottom))] lg:max-w-6xl lg:space-y-4 lg:pb-0">
      <InfluencerHeroCarousel displayName={displayName} handle={profile.handle} />
      <PlatformChips accounts={accounts} />
      <QuickActions
        pendingCampaigns={pendingCampaigns}
        pendingSocial={pendingSocial}
        unreadMessages={unreadMessages}
      />
      <KpiGrid completion={completion} profile={profile} />
      <div className="grid gap-4 lg:grid-cols-[1.05fr_0.95fr]">
        <CampaignInvitations campaigns={campaigns} />
        <ConnectedPlatforms accounts={accounts} />
      </div>
      <div className="grid gap-4 lg:grid-cols-[0.95fr_1.05fr]">
        <PerformanceSummary accounts={accounts} profile={profile} />
        <SuggestedImprovements accounts={accounts} profile={profile} />
      </div>
      <OpportunityCta />
    </div>
  );
}
