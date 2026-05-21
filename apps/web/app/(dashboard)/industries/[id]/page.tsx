import Image from "next/image";
import Link from "next/link";
import { BackLink } from "@/components/ui/BackLink";
import { ButtonLink } from "@/components/ui/Button";
import { EmptyState } from "@/components/ui/EmptyState";
import { ErrorState } from "@/components/ui/ErrorState";
import { GlassCard } from "@/components/ui/GlassCard";
import { KpiCard } from "@/components/ui/KpiCard";
import { SectionHeader } from "@/components/ui/SectionHeader";
import { StatusBadge } from "@/components/ui/StatusBadge";
import {
  formatCompactNumber,
  formatPercent,
  formatRoiMultiplier,
} from "@/lib/formatters";
import { fetchIndustryDetail } from "@/lib/industries";
import {
  formatIndustryWeight,
  getIndustryImage,
  type IndustryDetail,
  type IndustryInfluencer,
} from "@/lib/industry-utils";
import { routes } from "@/lib/routes";

export const dynamic = "force-dynamic";

export default async function IndustryDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const industryId = Number.parseInt(id, 10);

  if (!Number.isFinite(industryId)) {
    return <IndustryError title="Could not load industry details" />;
  }

  const result = await fetchIndustryDetail(industryId);

  if (!result.success) {
    return (
      <IndustryError
        title={
          result.status === 404
            ? "Industry not found"
            : "Could not load industry details"
        }
      />
    );
  }

  return <IndustryDetailView detail={result.data} />;
}

function IndustryDetailView({ detail }: { detail: IndustryDetail }) {
  const { industry, influencers, stats } = detail;

  return (
    <div className="space-y-5">
      <BackLink href={routes.industries()}>Back to Industries</BackLink>

      <section className="relative min-h-[300px] overflow-hidden rounded-[28px] border border-white/[0.10] bg-[#080807] shadow-[0_24px_80px_rgba(0,0,0,0.35)]">
        <Image
          src={getIndustryImage(industry.name)}
          alt={`${industry.name} industry`}
          fill
          priority
          sizes="(min-width: 1024px) calc(100vw - 320px), 100vw"
          className="object-cover opacity-70"
        />
        <div className="absolute inset-0 bg-gradient-to-r from-black via-black/75 to-black/20" />
        <div
          className="absolute inset-0 opacity-[0.07]"
          style={{
            backgroundImage: "url('/images/dashboard/pattern-gold.svg')",
            backgroundSize: "220px",
          }}
        />
        <div className="relative flex min-h-[300px] flex-col justify-end p-6 sm:p-8">
          <div className="flex flex-wrap gap-3">
            <StatusBadge className="text-sm" tone="green">
              {formatIndustryWeight(industry.industryWeight)} Industry Weight
            </StatusBadge>
            <StatusBadge className="text-sm" tone="gold">
              {stats.influencerCount} Matched Influencers
            </StatusBadge>
          </div>
          <h1 className="mt-5 text-4xl font-bold tracking-normal text-[#C9FBFF] lg:text-[#FFD700] sm:text-5xl">
            {industry.name}
          </h1>
          <p className="mt-4 max-w-3xl text-sm leading-7 text-white lg:text-white/88 lg:text-[#F5F2E9]/90 sm:text-base">
            {industry.description}
          </p>
          <div className="mt-6 flex flex-wrap gap-3">
            <ButtonLink href={routes.influencers()}>
              Explore Influencers
            </ButtonLink>
            <ButtonLink
              href={routes.newCampaign({ industryId: industry.id })}
              variant="secondary"
            >
              Create Campaign
            </ButtonLink>
          </div>
        </div>
      </section>

      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <KpiCard label="Matched Influencers" value={String(stats.influencerCount)} />
        <KpiCard
          label="Avg ROI Multiplier"
          value={`${stats.avgRoiMultiplier.toFixed(2)}x`}
          tone="green"
        />
        <KpiCard label="Avg Match Score" value={String(stats.avgMatchScore)} />
        <KpiCard label="Top Platform" value={stats.topPlatform} />
      </section>

      <GlassCard className="p-5 sm:p-6">
        <SectionHeader
          action={
            <Link
              className="text-sm font-semibold text-[#C9FBFF] lg:text-[#FFD700] transition hover:text-white lg:text-[#F5F2E9]"
              href={routes.influencers()}
            >
              View all
            </Link>
          }
          subtitle="Creators best aligned with this industry's audience, campaign goals, and platform reach."
          title="Matched Influencers"
        />

        {influencers.length > 0 ? (
          <div className="mt-5 grid gap-4 xl:grid-cols-2">
            {influencers.map((influencer) => (
              <MatchedInfluencerCard
                industryId={industry.id}
                influencer={influencer}
                key={influencer.id}
              />
            ))}
          </div>
        ) : (
          <EmptyInfluencers />
        )}
      </GlassCard>
    </div>
  );
}

function MatchedInfluencerCard({
  influencer,
  industryId,
}: {
  influencer: IndustryInfluencer;
  industryId: number;
}) {
  return (
    <GlassCard as="article" className="bg-black/20 p-5" hover>
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0">
          <h3 className="truncate text-xl font-bold text-white lg:text-[#F5F2E9]">
            {influencer.name}
          </h3>
          <p className="mt-1 text-sm text-white/72 lg:text-[#B8B3A7]">{influencer.handle}</p>
          <StatusBadge className="mt-3" tone="gray">{influencer.platform}</StatusBadge>
        </div>
        <div className="rounded-2xl border border-[#45B36B]/30 bg-[#45B36B]/10 px-4 py-3 text-center">
          <p className="text-xs uppercase text-white/72 lg:text-[#B8B3A7]">Match</p>
          <p className="text-3xl font-bold text-[#45B36B]">
            {influencer.matchScore}
          </p>
        </div>
      </div>

      <div className="mt-5 grid grid-cols-2 gap-3 lg:grid-cols-4">
        <Metric label="Followers" value={formatCompactNumber(influencer.followers)} />
        <Metric label="Avg Views" value={formatCompactNumber(influencer.avgFoodViews)} />
        <Metric
          label="Addis Audience"
          value={formatPercent(influencer.addisAudiencePercent)}
        />
        <Metric label="ROI" value={formatRoiMultiplier(influencer.roiMultiplier)} />
      </div>

      <div className="mt-5 flex flex-col gap-3 sm:flex-row">
        <ButtonLink
          className="flex-1"
          href={routes.influencerDetail(influencer.id)}
          variant="secondary"
        >
          View Profile
        </ButtonLink>
        <ButtonLink
          className="flex-1"
          href={routes.newCampaign({ industryId, influencerId: influencer.id })}
        >
          Book Campaign
        </ButtonLink>
      </div>
    </GlassCard>
  );
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-white/[0.08] bg-white/[0.04] p-3">
      <p className="text-xs text-white/72 lg:text-[#B8B3A7]">{label}</p>
      <p className="mt-1 break-words text-lg font-bold text-white lg:text-[#F5F2E9]">
        {value}
      </p>
    </div>
  );
}

function EmptyInfluencers() {
  return (
    <div className="mt-5">
      <EmptyState
        action={<ButtonLink href={routes.influencers()}>View All Influencers</ButtonLink>}
        description="Add influencer profiles in Odoo and assign them to this industry to start building campaign matches."
        title="No influencers matched yet"
      />
    </div>
  );
}

function IndustryError({ title }: { title: string }) {
  return (
    <div className="space-y-5">
      <ErrorState
        action={<ButtonLink href={routes.industries()}>Back to Industries</ButtonLink>}
        description="Please check your Odoo connection and try again."
        title={title}
      />
    </div>
  );
}
