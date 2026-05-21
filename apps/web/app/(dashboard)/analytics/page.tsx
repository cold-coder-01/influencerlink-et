import Link from "next/link";
import { ButtonLink } from "@/components/ui/Button";
import { EmptyState as SharedEmptyState } from "@/components/ui/EmptyState";
import { ErrorState as SharedErrorState } from "@/components/ui/ErrorState";
import { GlassCard } from "@/components/ui/GlassCard";
import { KpiCard } from "@/components/ui/KpiCard";
import { PageHeader } from "@/components/ui/PageHeader";
import { SectionHeader } from "@/components/ui/SectionHeader";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { fetchAnalytics, type AnalyticsData } from "@/lib/analytics";
import { routes } from "@/lib/routes";

export const dynamic = "force-dynamic";

function formatRoi(value: number) {
  return value > 0 ? `${value.toFixed(1)}x` : "0.0x";
}

function ProgressRow({
  label,
  value,
  max,
  tone = "gold",
}: {
  label: string;
  value: number;
  max: number;
  tone?: "gold" | "green" | "muted";
}) {
  const percent = max > 0 ? Math.round((value / max) * 100) : 0;
  const barClass =
    tone === "green"
      ? "bg-[#45B36B]"
      : tone === "muted"
        ? "bg-[#B8B3A7]"
        : "bg-white lg:bg-[#FFD700]";

  return (
    <div>
      <div className="mb-2 flex items-center justify-between gap-4 text-sm">
        <span className="font-semibold text-white lg:text-[#F5F2E9]">{label}</span>
        <span className="text-white/72 lg:text-[#B8B3A7]">{value}</span>
      </div>
      <div className="h-2 overflow-hidden rounded-full bg-white/[0.08]">
        <div
          className={`h-full rounded-full ${barClass}`}
          style={{ width: `${percent}%` }}
        />
      </div>
    </div>
  );
}

function SectionCard({
  title,
  subtitle,
  children,
}: {
  title: string;
  subtitle: string;
  children: React.ReactNode;
}) {
  return (
    <GlassCard className="space-y-5 p-5" hover>
      <SectionHeader subtitle={subtitle} title={title} />
      {children}
    </GlassCard>
  );
}

function Header() {
  return (
    <PageHeader
      actions={<ButtonLink href={routes.newCampaign()}>Create Campaign</ButtonLink>}
      eyebrow="PERFORMANCE INTELLIGENCE"
      subtitle="Measure campaign performance, influencer ROI, and industry growth opportunities."
      title="Analytics"
    />
  );
}

function ErrorState() {
  return (
    <div className="space-y-5">
      <Header />
      <SharedErrorState
        action={
          <ButtonLink href={routes.analytics()} variant="secondary">
            Refresh
          </ButtonLink>
        }
        description="Please check your Odoo connection and try again."
        title="Could not load analytics"
      />
    </div>
  );
}

function EmptyState() {
  return (
    <div className="space-y-5">
      <Header />
      <SharedEmptyState
        action={<ButtonLink href={routes.newCampaign()}>Create Campaign</ButtonLink>}
        description="Create your first campaign to start tracking ROI, platform performance, and influencer impact."
        title="No analytics yet"
      />
    </div>
  );
}

function getInsights(data: AnalyticsData) {
  const bestPlatform = [...data.platformDistribution].sort((a, b) => b.value - a.value)[0];
  const strongestIndustry = [...data.industryPerformance].sort(
    (a, b) =>
      b.avgRoiMultiplier - a.avgRoiMultiplier ||
      b.campaigns - a.campaigns ||
      b.influencers - a.influencers,
  )[0];
  const growthOpportunity = data.industryPerformance
    .filter((industry) => industry.influencers > 0)
    .sort(
      (a, b) =>
        a.campaigns - b.campaigns ||
        b.influencers - a.influencers ||
        b.avgRoiMultiplier - a.avgRoiMultiplier,
    )[0];

  return [
    {
      title: "Best ROI Channel",
      value:
        bestPlatform && bestPlatform.value > 0
          ? bestPlatform.label
          : "Not enough data yet.",
      detail:
        bestPlatform && bestPlatform.value > 0
          ? `${bestPlatform.value} campaign or creator signals.`
          : "Add campaign and influencer activity to compare platforms.",
    },
    {
      title: "Strongest Industry",
      value:
        strongestIndustry && strongestIndustry.avgRoiMultiplier > 0
          ? strongestIndustry.industry
          : "Not enough data yet.",
      detail:
        strongestIndustry && strongestIndustry.avgRoiMultiplier > 0
          ? `${formatRoi(strongestIndustry.avgRoiMultiplier)} average ROI.`
          : "Industry ROI appears after campaigns or creator ROI data are available.",
    },
    {
      title: "Growth Opportunity",
      value:
        growthOpportunity && growthOpportunity.influencers > 0
          ? growthOpportunity.industry
          : "Not enough data yet.",
      detail:
        growthOpportunity && growthOpportunity.influencers > 0
          ? `${growthOpportunity.influencers} influencers and ${growthOpportunity.campaigns} campaigns.`
          : "Add influencers by industry to reveal underserved sectors.",
    },
  ];
}

function AnalyticsDashboard({ data }: { data: AnalyticsData }) {
  const maxStatus = Math.max(...data.campaignStatus.map((item) => item.value), 1);
  const maxPlatform = Math.max(
    ...data.platformDistribution.map((item) => item.value),
    1,
  );
  const insights = getInsights(data);

  return (
    <div className="space-y-5">
      <Header />

      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
        <KpiCard label="Total Campaigns" value={String(data.summary.totalCampaigns)} />
        <KpiCard
          label="Active Campaigns"
          tone="green"
          value={String(data.summary.activeCampaigns)}
        />
        <KpiCard
          label="Avg ROI Multiplier"
          tone="green"
          value={formatRoi(data.summary.avgRoiMultiplier)}
        />
        <KpiCard label="Total Influencers" value={String(data.summary.totalInfluencers)} />
        <KpiCard
          label="Total Industries"
          tone="neutral"
          value={String(data.summary.totalIndustries)}
        />
      </section>

      <section className="grid gap-5 xl:grid-cols-2">
        <SectionCard
          title="Campaign Status"
          subtitle="Portfolio movement from draft through completed campaigns."
        >
          <div className="space-y-4">
            {data.campaignStatus.map((item) => (
              <ProgressRow
                key={item.label}
                label={item.label}
                max={maxStatus}
                tone={
                  item.label === "Active" || item.label === "Completed"
                    ? "green"
                    : item.label === "Draft" || item.label === "Cancelled"
                      ? "muted"
                      : "gold"
                }
                value={item.value}
              />
            ))}
          </div>
        </SectionCard>

        <SectionCard
          title="Platform Distribution"
          subtitle="Campaign and creator activity across the channels in use."
        >
          <div className="space-y-4">
            {data.platformDistribution.map((item) => (
              <ProgressRow
                key={item.label}
                label={item.label}
                max={maxPlatform}
                tone={item.label === "Other" ? "muted" : "gold"}
                value={item.value}
              />
            ))}
          </div>
        </SectionCard>
      </section>

      <section className="grid gap-5 xl:grid-cols-[1.3fr_0.9fr]">
        <SectionCard
          title="Industry Performance"
          subtitle="Campaign concentration, creator supply, and ROI by sector."
        >
          <div className="space-y-3">
            {data.industryPerformance.length > 0 ? (
              data.industryPerformance.map((industry) => (
                <article
                  className="grid gap-4 rounded-2xl border border-white/[0.10] bg-black/20 p-4 md:grid-cols-[1.2fr_0.7fr_0.7fr_0.7fr_auto] md:items-center"
                  key={industry.industryId}
                >
                  <div>
                    <p className="font-bold text-white lg:text-[#F5F2E9]">{industry.industry}</p>
                    <p className="mt-1 text-xs text-white/72 lg:text-[#B8B3A7]">Industry opportunity</p>
                  </div>
                  <Metric label="Campaigns" value={String(industry.campaigns)} />
                  <Metric label="Influencers" value={String(industry.influencers)} />
                  <Metric
                    label="Avg ROI"
                    tone="green"
                    value={formatRoi(industry.avgRoiMultiplier)}
                  />
                  <ButtonLink
                    href={routes.industryDetail(industry.industryId)}
                    size="sm"
                    variant="secondary"
                  >
                    View Industry
                  </ButtonLink>
                </article>
              ))
            ) : (
              <p className="text-sm text-white/72 lg:text-[#B8B3A7]">Not enough data yet.</p>
            )}
          </div>
        </SectionCard>

        <SectionCard
          title="Top Influencers by ROI"
          subtitle="Creators with the strongest ROI and match score signals."
        >
          <div className="space-y-3">
            {data.topInfluencers.length > 0 ? (
              data.topInfluencers.map((influencer) => (
                <article
                  className="rounded-2xl border border-white/[0.10] bg-black/20 p-4"
                  key={influencer.id}
                >
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <p className="font-bold text-white lg:text-[#F5F2E9]">{influencer.name}</p>
                      <p className="mt-1 text-sm text-white/72 lg:text-[#B8B3A7]">
                        {influencer.handle} - {influencer.platform}
                      </p>
                    </div>
                    <p className="text-lg font-bold text-[#45B36B]">
                      {formatRoi(influencer.roiMultiplier)}
                    </p>
                  </div>
                  <div className="mt-4 flex items-center justify-between gap-4">
                    <StatusBadge tone="gold">
                      {influencer.matchScore}% match
                    </StatusBadge>
                    <Link
                      className="text-xs font-bold text-[#C9FBFF] lg:text-[#FFD700] transition hover:text-white lg:text-[#F5F2E9]"
                      href={routes.influencerDetail(influencer.id)}
                    >
                      View Profile
                    </Link>
                  </div>
                </article>
              ))
            ) : (
              <p className="text-sm text-white/72 lg:text-[#B8B3A7]">Not enough data yet.</p>
            )}
          </div>
        </SectionCard>
      </section>

      <section className="grid gap-4 lg:grid-cols-3">
        {insights.map((insight) => (
          <GlassCard as="article" className="p-5" hover key={insight.title}>
            <p className="text-xs font-semibold uppercase text-white/72 lg:text-[#B8B3A7]">
              {insight.title}
            </p>
            <p className="mt-3 text-2xl font-bold text-[#C9FBFF] lg:text-[#FFD700]">{insight.value}</p>
            <p className="mt-3 text-sm leading-6 text-white/72 lg:text-[#B8B3A7]">{insight.detail}</p>
          </GlassCard>
        ))}
      </section>
    </div>
  );
}

function Metric({
  label,
  value,
  tone = "gold",
}: {
  label: string;
  value: string;
  tone?: "gold" | "green";
}) {
  return (
    <div>
      <p className="text-xs font-semibold uppercase text-white/72 lg:text-[#B8B3A7]">{label}</p>
      <p
        className={`mt-1 text-lg font-bold ${
          tone === "green" ? "text-[#45B36B]" : "text-[#C9FBFF] lg:text-[#FFD700]"
        }`}
      >
        {value}
      </p>
    </div>
  );
}

export default async function AnalyticsPage() {
  const result = await fetchAnalytics();

  if (!result.success) {
    return <ErrorState />;
  }

  if (result.data.summary.totalCampaigns === 0) {
    return <EmptyState />;
  }

  return <AnalyticsDashboard data={result.data} />;
}
