import Link from "next/link";
import { ButtonLink } from "@/components/ui/Button";
import { EmptyState } from "@/components/ui/EmptyState";
import { GlassCard } from "@/components/ui/GlassCard";
import { KpiCard } from "@/components/ui/KpiCard";
import { PageHeader } from "@/components/ui/PageHeader";
import { fetchInfluencerDetail } from "@/lib/influencers";
import { getCurrentSession } from "@/lib/session";

export const dynamic = "force-dynamic";

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
  const profileResult = profileId ? await fetchInfluencerDetail(profileId) : null;
  const profile = profileResult?.success ? profileResult.data : null;
  const completionItems = [
    Boolean(profile?.handle),
    Boolean(profile?.platform),
    Boolean(profile?.bio),
    Boolean(profile?.industry),
    Boolean(profile && profile.avgFoodViews > 0),
  ];
  const completion = Math.round(
    (completionItems.filter(Boolean).length / completionItems.length) * 100,
  );

  return (
    <div className="space-y-5">
      <PageHeader
        eyebrow="CREATOR PORTAL"
        subtitle="Manage your profile, review campaign opportunities, and track your performance."
        title="Creator Dashboard"
      />

      {!profile ? (
        <EmptyProfileCard />
      ) : (
        <>
          <section className="grid gap-4 lg:grid-cols-4">
            <KpiCard
              helper={
                <div className="mt-2 h-2 overflow-hidden rounded-full bg-white/[0.08]">
                  <div className="h-full rounded-full bg-[#45B36B]" style={{ width: `${completion}%` }} />
                </div>
              }
              label="Profile Completion"
              value={`${completion}%`}
            />
            <KpiCard label="Main Platform" value={profile.platform} />
            <KpiCard
              label="Avg Views"
              tone="green"
              value={profile.avgFoodViews.toLocaleString()}
            />
            <KpiCard
              label="ROI Multiplier"
              tone="green"
              value={`${profile.roiMultiplier.toFixed(1)}x`}
            />
          </section>

          <section className="grid gap-5 xl:grid-cols-2">
            <GlassCard as="article" className="p-5">
              <h2 className="text-xl font-bold text-white lg:text-[#F5F2E9]">Connected Platforms</h2>
              <p className="mt-3 text-sm leading-6 text-white/72 lg:text-[#B8B3A7]">
                Social account verification is coming soon. Your current profile is
                prepared for {profile.platform}.
              </p>
            </GlassCard>
            <GlassCard as="article" className="p-5">
              <h2 className="text-xl font-bold text-white lg:text-[#F5F2E9]">Campaign Invitations</h2>
              <p className="mt-3 text-sm leading-6 text-white/72 lg:text-[#B8B3A7]">
                Review campaign opportunities sent by businesses.
              </p>
              <Link className="mt-5 inline-flex text-sm font-bold text-[#C9FBFF] lg:text-[#FFD700]" href="/influencer/campaigns">
                View invitations
              </Link>
            </GlassCard>
            <GlassCard as="article" className="p-5">
              <h2 className="text-xl font-bold text-white lg:text-[#F5F2E9]">Performance Summary</h2>
              <p className="mt-3 text-sm leading-6 text-white/72 lg:text-[#B8B3A7]">
                {profile.matchScore}% match score with {profile.addisAudiencePercent.toFixed(0)}%
                Addis audience concentration.
              </p>
            </GlassCard>
            <GlassCard as="article" className="p-5">
              <h2 className="text-xl font-bold text-white lg:text-[#F5F2E9]">
                Suggested Profile Improvements
              </h2>
              <p className="mt-3 text-sm leading-6 text-white/72 lg:text-[#B8B3A7]">
                Keep your bio, views, location focus, and niche updated so businesses can
                evaluate fit quickly.
              </p>
            </GlassCard>
          </section>
        </>
      )}
    </div>
  );
}
