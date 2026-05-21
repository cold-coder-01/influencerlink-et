import { BackLink } from "@/components/ui/BackLink";
import { ButtonLink } from "@/components/ui/Button";
import { ErrorState } from "@/components/ui/ErrorState";
import { GlassCard } from "@/components/ui/GlassCard";
import { KpiCard } from "@/components/ui/KpiCard";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { cn } from "@/lib/cn";
import {
  formatCompactNumber,
  formatDate,
  formatPercent,
  formatRoiMultiplier,
  getInitials,
} from "@/lib/formatters";
import { fetchInfluencerDetail, type InfluencerDetail } from "@/lib/influencers";
import { getSuggestedCampaignFit } from "@/lib/match-utils";
import { getPlatformBadgeClass } from "@/lib/platform-utils";
import { routes } from "@/lib/routes";
import {
  fetchSocialAccountsByDomain,
  getSocialPlatformLabel,
  getVerificationStatusLabel,
  getVerificationStatusTone,
  sanitizeSocialAccountForClient,
  type InfluencerSocialAccount,
} from "@/lib/social-accounts";

export const dynamic = "force-dynamic";

export default async function InfluencerDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const influencerId = Number.parseInt(id, 10);

  if (!Number.isFinite(influencerId)) {
    return <InfluencerError title="Influencer not found" />;
  }

  const result = await fetchInfluencerDetail(influencerId);

  if (!result.success) {
    return (
      <InfluencerError
        title={
          result.status === 404
            ? "Influencer not found"
            : "Could not load influencer profile"
        }
      />
    );
  }

  const socialResult = await fetchSocialAccountsByDomain([
    ["influencer_id", "=", influencerId],
    ["verification_status", "=", "verified"],
  ]);
  const socialAccounts = socialResult.success
    ? socialResult.data.map(sanitizeSocialAccountForClient)
    : [];

  return <InfluencerProfile influencer={result.data} socialAccounts={socialAccounts} />;
}

function InfluencerProfile({
  influencer,
  socialAccounts,
}: {
  influencer: InfluencerDetail;
  socialAccounts: InfluencerSocialAccount[];
}) {
  const campaignHref = buildCampaignHref(influencer);

  return (
    <div className="space-y-5">
      <BackLink href={routes.influencers()}>Back to Influencers</BackLink>

      <section className="relative overflow-hidden rounded-[28px] border border-white/[0.10] bg-[radial-gradient(circle_at_78%_16%,rgba(255,215,0,0.18),transparent_30%),linear-gradient(135deg,#11110e,#050505_72%)] p-6 shadow-[0_24px_80px_rgba(0,0,0,0.35)] sm:p-8">
        <div
          className="absolute inset-0 opacity-[0.07]"
          style={{
            backgroundImage: "url('/images/dashboard/pattern-gold.svg')",
            backgroundSize: "220px",
          }}
        />
        <div className="relative flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
          <div className="flex flex-col gap-5 sm:flex-row sm:items-center">
            <div className="grid h-24 w-24 shrink-0 place-items-center rounded-full border border-[#00D4FF]/45 lg:border-[#FFD700]/45 bg-[#00D4FF]/12 lg:bg-white lg:bg-[#FFD700]/10 text-3xl font-bold text-[#C9FBFF] lg:text-[#FFD700] shadow-[0_24px_60px_rgba(0,0,0,0.35)]">
              {getInitials(influencer.name)}
            </div>
            <div className="min-w-0">
              <div className="mb-3 flex flex-wrap gap-2">
                <PlatformBadge platform={influencer.platform} />
                <StatusBadge tone="gray">
                  {influencer.industry}
                </StatusBadge>
                <StatusBadge tone="green">
                  Match {influencer.matchScore}
                </StatusBadge>
              </div>
              <h1 className="text-4xl font-bold tracking-normal text-[#C9FBFF] lg:text-[#FFD700] sm:text-5xl">
                {influencer.name}
              </h1>
              <p className="mt-2 text-base font-semibold text-white/72 lg:text-[#B8B3A7]">
                {influencer.handle}
              </p>
              <p className="mt-4 max-w-3xl text-sm leading-7 text-white lg:text-white/88 lg:text-[#F5F2E9]/90 sm:text-base">
                {influencer.bio}
              </p>
            </div>
          </div>

          <div className="flex flex-col gap-3 sm:flex-row lg:flex-col">
            <ButtonLink href={campaignHref}>
              Book Campaign
            </ButtonLink>
            {influencer.industryId ? (
              <ButtonLink
                href={routes.industryDetail(influencer.industryId)}
                variant="secondary"
              >
                Back to Industry
              </ButtonLink>
            ) : null}
          </div>
        </div>
      </section>

      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
        <KpiCard label="Followers" value={formatCompactNumber(influencer.followers)} />
        <KpiCard label="Avg Views" value={formatCompactNumber(influencer.avgFoodViews)} />
        <KpiCard
          label="Addis Audience"
          value={formatPercent(influencer.addisAudiencePercent)}
        />
        <KpiCard
          label="ROI Multiplier"
          value={formatRoiMultiplier(influencer.roiMultiplier)}
          tone="green"
        />
        <KpiCard label="Match Score" value={String(influencer.matchScore)} />
      </section>

      <div className="grid gap-5 xl:grid-cols-[minmax(0,1.6fr)_minmax(320px,0.9fr)]">
        <GlassCard className="p-5 sm:p-6">
          <h2 className="text-2xl font-bold text-white lg:text-[#F5F2E9]">
            Audience & Performance
          </h2>
          <div className="mt-5 grid gap-4 md:grid-cols-2">
            <InfoCard label="Platform" value={influencer.platform} />
            <InfoCard label="Location Focus" value={influencer.locationFocus} />
            <InfoCard
              label="Audience in Addis"
              value={formatPercent(influencer.addisAudiencePercent)}
            />
            <InfoCard
              label="Estimated ROI"
              value={formatRoiMultiplier(influencer.roiMultiplier)}
              tone="green"
            />
            <InfoCard
              className="md:col-span-2"
              label="Suggested Campaign Fit"
              value={getSuggestedCampaignFit(influencer.industry)}
            />
          </div>
        </GlassCard>

        <div className="space-y-5">
          <GlassCard className="p-5">
            <h2 className="text-xl font-bold text-white lg:text-[#F5F2E9]">
              Why this influencer matches
            </h2>
            <div className="mt-5 space-y-3">
              {[
                `Strong platform presence on ${influencer.platform}`,
                `${formatPercent(influencer.addisAudiencePercent)} Addis Ababa audience concentration`,
                `Estimated ROI multiplier of ${formatRoiMultiplier(influencer.roiMultiplier)}`,
              ].map((item) => (
                <div
                  className="rounded-2xl border border-white/[0.08] bg-black/20 p-4 text-sm leading-6 text-white lg:text-[#F5F2E9]"
                  key={item}
                >
                  {item}
                </div>
              ))}
            </div>
          </GlassCard>

          <GlassCard className="border-[#00D4FF]/35 lg:border-[#FFD700]/25 bg-[linear-gradient(135deg,rgba(45,90,39,0.55),rgba(8,8,8,0.98)_64%)] p-5">
            <h2 className="text-xl font-bold text-[#C9FBFF] lg:text-[#FFD700]">
              Ready to start a partnership?
            </h2>
            <p className="mt-3 text-sm leading-6 text-white lg:text-white/88 lg:text-[#F5F2E9]/90">
              Create a campaign brief and invite this influencer to collaborate
              with your business.
            </p>
            <ButtonLink className="mt-5 w-full" href={campaignHref}>
              Book Campaign
            </ButtonLink>
          </GlassCard>
        </div>
      </div>

      <GlassCard className="p-5 sm:p-6">
        <h2 className="text-2xl font-bold text-white lg:text-[#F5F2E9]">
          Verified Social Accounts
        </h2>
        {socialAccounts.length ? (
          <div className="mt-5 grid gap-4 lg:grid-cols-2">
            {socialAccounts.map((account) => (
              <article
                className="rounded-2xl border border-white/[0.10] bg-black/20 p-5"
                key={account.id}
              >
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <p className="text-sm font-bold text-[#C9FBFF] lg:text-[#FFD700]">
                      {getSocialPlatformLabel(account.platform)}
                    </p>
                    <p className="mt-1 text-sm text-white/72 lg:text-[#B8B3A7]">{account.handle}</p>
                  </div>
                  <StatusBadge tone={getVerificationStatusTone(account.verificationStatus)}>
                    {getVerificationStatusLabel(account.verificationStatus)}
                  </StatusBadge>
                </div>
                <div className="mt-5 grid gap-3 sm:grid-cols-2">
                  <InfoCard
                    label="Followers"
                    value={formatCompactNumber(account.followersCount ?? 0)}
                  />
                  <InfoCard
                    label="Avg Views"
                    value={formatCompactNumber(account.avgViews ?? 0)}
                  />
                  <InfoCard
                    label="Engagement"
                    value={formatPercent(account.engagementRate ?? 0, 2)}
                  />
                  <InfoCard
                    label="Addis Audience"
                    value={formatPercent(account.audienceAddisPercent ?? 0)}
                  />
                </div>
                <p className="mt-4 text-xs text-white/72 lg:text-[#B8B3A7]">
                  Last synced {formatDate(account.lastSyncedAt, "Not synced yet")} - Verified{" "}
                  {formatDate(account.verifiedAt, "Not verified yet")}
                </p>
              </article>
            ))}
          </div>
        ) : (
          <p className="mt-5 rounded-2xl border border-white/[0.10] bg-black/20 p-4 text-sm text-white/72 lg:text-[#B8B3A7]">
            No verified social accounts yet.
          </p>
        )}
      </GlassCard>
    </div>
  );
}

function InfluencerError({ title }: { title: string }) {
  return (
    <ErrorState
      action={<ButtonLink href={routes.influencers()}>Back to Influencers</ButtonLink>}
      description="Please check your Odoo connection and try again."
      title={title}
    />
  );
}

function InfoCard({
  label,
  value,
  tone = "gold",
  className = "",
}: {
  label: string;
  value: string;
  tone?: "gold" | "green";
  className?: string;
}) {
  return (
    <article
      className={cn("rounded-2xl border border-white/[0.10] bg-black/20 p-4", className)}
    >
      <p className="text-xs font-semibold uppercase text-white/72 lg:text-[#B8B3A7]">{label}</p>
      <p
        className={`mt-3 text-lg font-bold leading-7 ${
          tone === "green" ? "text-[#45B36B]" : "text-white lg:text-[#F5F2E9]"
        }`}
      >
        {value}
      </p>
    </article>
  );
}

function PlatformBadge({ platform }: { platform: string }) {
  return (
    <span className={cn("rounded-full border px-3 py-1 text-xs font-bold", getPlatformBadgeClass(platform))}>
      {platform}
    </span>
  );
}

function buildCampaignHref(influencer: InfluencerDetail) {
  return routes.newCampaign({
    influencerId: influencer.id,
    industryId: influencer.industryId,
  });
}
