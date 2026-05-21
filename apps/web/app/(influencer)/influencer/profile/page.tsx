import { ButtonLink } from "@/components/ui/Button";
import { EmptyState } from "@/components/ui/EmptyState";
import { GlassCard } from "@/components/ui/GlassCard";
import { PageHeader } from "@/components/ui/PageHeader";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { formatCompactNumber } from "@/lib/formatters";
import { fetchInfluencerDetail } from "@/lib/influencers";
import { getCurrentSession } from "@/lib/session";
import {
  fetchSocialAccounts,
  getSocialPlatformLabel,
  getVerificationStatusLabel,
  getVerificationStatusTone,
} from "@/lib/social-accounts";

export const dynamic = "force-dynamic";

function InfoCard({ label, value }: { label: string; value: string }) {
  return (
    <article className="rounded-2xl border border-white/[0.18] bg-white/[0.10] lg:border-white/[0.10] lg:bg-black/20 p-4">
      <p className="text-xs font-semibold uppercase text-white/72 lg:text-[#B8B3A7]">{label}</p>
      <p className="mt-2 text-lg font-bold text-white lg:text-[#F5F2E9]">{value}</p>
    </article>
  );
}

export default async function InfluencerProfilePage({
  searchParams,
}: {
  searchParams?: Promise<{
    social_connected?: string;
    social_error?: string;
  }>;
}) {
  const session = await getCurrentSession();
  const params = await searchParams;
  const profileId = session?.influencerProfileId;
  const result = profileId ? await fetchInfluencerDetail(profileId) : null;
  const profile = result?.success ? result.data : null;
  const socialResult = profileId ? await fetchSocialAccounts(profileId) : null;
  const socialAccounts = socialResult?.success ? socialResult.data : [];

  return (
    <div className="space-y-5">
      <PageHeader
        eyebrow="CREATOR PORTAL"
        subtitle="Review the influencer profile businesses see when evaluating campaign fit."
        title="My Profile"
      />

      {!profile ? (
        <EmptyState
          description="We could not find a linked influencer profile for this session yet."
          title="Your influencer profile is being prepared."
        />
      ) : (
        <GlassCard className="p-5 sm:p-6">
          {params?.social_connected ? (
            <div className="mb-4 rounded-2xl border border-[#45B36B]/35 bg-[#45B36B]/10 px-4 py-3 text-sm font-semibold text-[#9BE7B1]">
              {params.social_connected}
            </div>
          ) : null}
          {params?.social_error ? (
            <div className="mb-4 rounded-2xl border border-[#E63746]/35 bg-[#E63746]/10 px-4 py-3 text-sm font-semibold text-[#FF8B95]">
              {params.social_error}
            </div>
          ) : null}
          <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <p className="text-sm font-semibold uppercase tracking-[0.16em] text-[#45B36B]">
                {profile.platform}
              </p>
              <h2 className="mt-2 text-3xl font-bold text-[#C9FBFF] lg:text-[#FFD700]">
                {profile.name}
              </h2>
              <p className="mt-2 text-white/72 lg:text-[#B8B3A7]">{profile.handle}</p>
            </div>
            <ButtonLink className="w-fit" href="/influencer/social-accounts" variant="secondary">
              Manage Social Accounts
            </ButtonLink>
          </div>

          <div className="mt-6 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            <InfoCard label="Followers" value={profile.followers.toLocaleString()} />
            <InfoCard label="Avg Views" value={profile.avgFoodViews.toLocaleString()} />
            <InfoCard
              label="Addis Audience"
              value={`${profile.addisAudiencePercent.toFixed(0)}%`}
            />
            <InfoCard label="Industry" value={profile.industry} />
            <InfoCard label="Location Focus" value={profile.locationFocus} />
            <InfoCard label="ROI Multiplier" value={`${profile.roiMultiplier.toFixed(1)}x`} />
            <InfoCard label="Match Score" value={`${profile.matchScore}%`} />
          </div>

          <article className="mt-5 rounded-2xl border border-white/[0.18] bg-white/[0.10] lg:border-white/[0.10] lg:bg-black/20 p-4">
            <p className="text-xs font-semibold uppercase text-white/72 lg:text-[#B8B3A7]">Short Bio</p>
            <p className="mt-3 text-sm leading-7 text-white lg:text-[#F5F2E9]">{profile.bio}</p>
          </article>

          <section className="mt-5 rounded-2xl border border-white/[0.18] bg-white/[0.10] lg:border-white/[0.10] lg:bg-black/20 p-4">
            <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="text-xs font-semibold uppercase text-white/72 lg:text-[#B8B3A7]">
                  Connected Social Accounts
                </p>
                <p className="mt-1 text-sm text-white lg:text-[#F5F2E9]">
                  Platforms submitted for marketplace trust and verification.
                </p>
              </div>
              <ButtonLink href="/influencer/social-accounts" size="sm">
                Manage Social Accounts
              </ButtonLink>
            </div>

            {socialAccounts.length ? (
              <div className="mt-4 grid gap-3 md:grid-cols-2">
                {socialAccounts.map((account) => (
                  <article
                    className="rounded-xl border border-white/[0.16] bg-white/[0.10] lg:border-white/[0.10] lg:bg-white/[0.04] p-4"
                    key={account.id}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="text-sm font-bold text-[#C9FBFF] lg:text-[#FFD700]">
                          {getSocialPlatformLabel(account.platform)}
                        </p>
                        <p className="mt-1 text-xs uppercase text-white/72 lg:text-[#B8B3A7]">
                          {account.handle}
                        </p>
                      </div>
                      <StatusBadge tone={getVerificationStatusTone(account.verificationStatus)}>
                        {getVerificationStatusLabel(account.verificationStatus)}
                      </StatusBadge>
                    </div>
                    <div className="mt-4 grid grid-cols-2 gap-3 text-sm">
                      <InfoCard
                        label="Followers"
                        value={formatCompactNumber(account.followersCount || 0)}
                      />
                      <InfoCard
                        label="Avg Views"
                        value={formatCompactNumber(account.avgViews || 0)}
                      />
                    </div>
                    {account.lastSyncedAt ? (
                      <p className="mt-3 text-xs text-white/72 lg:text-[#B8B3A7]">
                        Last synced {account.lastSyncedAt}
                      </p>
                    ) : null}
                  </article>
                ))}
              </div>
            ) : (
              <p className="mt-4 rounded-xl border border-white/[0.16] bg-white/[0.10] lg:border-white/[0.10] lg:bg-white/[0.04] p-4 text-sm text-white/72 lg:text-[#B8B3A7]">
                No social account has been added yet.
              </p>
            )}
          </section>
        </GlassCard>
      )}
    </div>
  );
}
