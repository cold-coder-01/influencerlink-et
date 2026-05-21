import Image from "next/image";
import { ButtonLink } from "@/components/ui/Button";
import { EmptyState } from "@/components/ui/EmptyState";
import { GlassCard } from "@/components/ui/GlassCard";
import { KpiCard } from "@/components/ui/KpiCard";
import { PageHeader } from "@/components/ui/PageHeader";
import { StatusBadge } from "@/components/ui/StatusBadge";

type MarketplaceIndustry = {
  id: number;
  name: string;
};

type MarketplaceInfluencer = {
  id: number;
  name: string;
  handle: string;
  platform: string;
  bio: string;
  avgViews: number;
  roiMultiplier: number;
  roiScore: number;
  imageUrl: string | null;
  industries: MarketplaceIndustry[];
};

type CurrentInfluencerProfile = Omit<MarketplaceInfluencer, "id"> & {
  id: number | null;
  email: string;
};

type InfluencerMarketplaceProps = {
  currentInfluencer: CurrentInfluencerProfile | null;
  industries: MarketplaceIndustry[];
  influencers: MarketplaceInfluencer[];
  isOnline: boolean;
  error: string | null;
};

function formatNumber(value: number) {
  return new Intl.NumberFormat("en", { notation: "compact" }).format(value);
}

function creatorInitials(name: string) {
  return name
    .split(/\s+/)
    .map((part) => part[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
}

function CreatorAvatar({ influencer }: { influencer: MarketplaceInfluencer }) {
  if (influencer.imageUrl) {
    return (
      <Image
        alt=""
        className="h-16 w-16 rounded-2xl object-cover"
        height={64}
        src={influencer.imageUrl}
        unoptimized
        width={64}
      />
    );
  }

  return (
    <div className="flex h-16 w-16 items-center justify-center rounded-2xl border border-[#00D4FF]/35 lg:border-[#FFD700]/25 bg-[#00D4FF]/12 lg:bg-white lg:bg-[#FFD700]/10 text-lg font-bold text-[#C9FBFF] lg:text-[#FFD700]">
      {creatorInitials(influencer.name)}
    </div>
  );
}

function CreatorCard({ influencer }: { influencer: MarketplaceInfluencer }) {
  return (
    <GlassCard as="article" className="p-5" hover>
      <div className="flex items-start gap-4">
        <CreatorAvatar influencer={influencer} />
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <h2 className="text-lg font-bold text-white lg:text-[#F5F2E9]">{influencer.name}</h2>
              <p className="mt-1 text-sm text-white/72 lg:text-[#B8B3A7]">
                {influencer.handle} - {influencer.platform}
              </p>
            </div>
            <StatusBadge tone="green">
              {influencer.roiMultiplier.toFixed(1)}x ROI
            </StatusBadge>
          </div>
          <p className="mt-4 line-clamp-2 text-sm leading-6 text-white/72 lg:text-[#B8B3A7]">
            {influencer.bio}
          </p>
        </div>
      </div>

      <div className="mt-5 grid grid-cols-2 gap-3">
        <div className="rounded-2xl border border-white/[0.08] bg-black/20 p-3">
          <p className="text-xs font-semibold uppercase text-white/72 lg:text-[#B8B3A7]">Avg Views</p>
          <p className="mt-1 text-lg font-bold text-[#C9FBFF] lg:text-[#FFD700]">
            {formatNumber(influencer.avgViews)}
          </p>
        </div>
        <div className="rounded-2xl border border-white/[0.08] bg-black/20 p-3">
          <p className="text-xs font-semibold uppercase text-white/72 lg:text-[#B8B3A7]">ROI Score</p>
          <p className="mt-1 text-lg font-bold text-[#45B36B]">
            {influencer.roiScore}%
          </p>
        </div>
      </div>

      <div className="mt-5 flex flex-wrap gap-2">
        {influencer.industries.slice(0, 3).map((industry) => (
          <StatusBadge
            key={`${influencer.id}-${industry.id}-${industry.name}`}
            tone="gray"
          >
            {industry.name}
          </StatusBadge>
        ))}
      </div>

      <ButtonLink
        className="mt-5 w-full"
        href={`/influencers/${influencer.id}`}
        variant="secondary"
      >
        View Profile
      </ButtonLink>
    </GlassCard>
  );
}

export function InfluencerMarketplace({
  currentInfluencer,
  industries,
  influencers,
  isOnline,
  error,
}: InfluencerMarketplaceProps) {
  return (
    <div className="space-y-5">
      <PageHeader
        actions={
          <div className="grid gap-3 sm:grid-cols-2 lg:min-w-80">
            <KpiCard className="p-4" label="Creators" value={String(influencers.length)} />
            <KpiCard
              className="p-4"
              label="Industries"
              tone="green"
              value={String(industries.length)}
            />
          </div>
        }
        eyebrow="CREATOR DISCOVERY"
        subtitle="Discover Ethiopian creators by industry fit, channel strength, and ROI signals."
        title="Influencers"
      />

      {!isOnline && error ? (
        <GlassCard className="border-[#00D4FF]/35 lg:border-[#FFD700]/25 bg-[#00D4FF]/12 lg:bg-white lg:bg-[#FFD700]/10 p-5 text-sm leading-6 text-[#C9FBFF] lg:text-[#FFD700]">
          {error}
        </GlassCard>
      ) : null}

      {currentInfluencer ? (
        <GlassCard className="border-[#45B36B]/25 bg-[#45B36B]/10 p-5">
          <p className="text-xs font-semibold uppercase text-[#45B36B]">
            Your Creator Profile
          </p>
          <p className="mt-2 text-xl font-bold text-white lg:text-[#F5F2E9]">
            {currentInfluencer.name}
          </p>
          <p className="mt-1 text-sm text-white/72 lg:text-[#B8B3A7]">
            {currentInfluencer.email} - {currentInfluencer.handle}
          </p>
        </GlassCard>
      ) : null}

      {influencers.length > 0 ? (
        <section className="grid gap-4 xl:grid-cols-2">
          {influencers.map((influencer) => (
            <CreatorCard influencer={influencer} key={influencer.id} />
          ))}
        </section>
      ) : (
        <EmptyState
          description="Once Odoo has influencer profiles, they will appear here with ROI and industry fit."
          title="No influencers yet"
        />
      )}
    </div>
  );
}
