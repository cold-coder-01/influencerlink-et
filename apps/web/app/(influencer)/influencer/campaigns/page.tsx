import { CampaignStatusActions } from "@/components/campaigns/CampaignStatusActions";
import { ButtonLink } from "@/components/ui/Button";
import { EmptyState } from "@/components/ui/EmptyState";
import { GlassCard } from "@/components/ui/GlassCard";
import { PageHeader } from "@/components/ui/PageHeader";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { getCampaignStatusDescription } from "@/lib/campaign-lifecycle";
import { fetchCampaigns } from "@/lib/campaigns";
import { getCampaignOwnershipDomain } from "@/lib/permissions";
import { getCurrentSession } from "@/lib/session";

export const dynamic = "force-dynamic";

export default async function InfluencerCampaignsPage() {
  const session = await getCurrentSession();
  const profileId = session?.influencerProfileId;
  const domain = session ? getCampaignOwnershipDomain(session) : null;
  const result = domain
    ? await fetchCampaigns(domain)
    : { success: true as const, data: [] };
  const campaigns =
    result.success && profileId
      ? result.data.filter((campaign) => campaign.influencerId === profileId)
      : [];

  return (
    <div className="space-y-5">
      <PageHeader
        eyebrow="CREATOR PORTAL"
        subtitle="Review campaign invitations and partnerships assigned to your creator profile."
        title="Campaigns"
      />

      {campaigns.length === 0 ? (
        <EmptyState
          description="Once businesses invite you, opportunities will appear here."
          title="No campaign invitations yet"
        />
      ) : (
        <section className="space-y-3">
          {campaigns.map((campaign) => (
            <GlassCard
              as="article"
              className="grid gap-4 rounded-[24px] border border-white/[0.18] bg-white/[0.10] lg:border-white/[0.10] lg:bg-white/[0.06] p-5 backdrop-blur-xl lg:grid-cols-[1.2fr_0.8fr_0.9fr_0.7fr_auto] lg:items-center"
              hover
              key={campaign.id}
            >
              <div>
                <p className="break-words text-lg font-bold text-white lg:text-[#F5F2E9]">{campaign.name}</p>
                <p className="mt-1 text-sm text-white/72 lg:text-[#B8B3A7]">
                  {campaign.businessName || "Business"} -{" "}
                  {campaign.platform || "Platform"}
                </p>
              </div>
              <Metric label="Budget" value={campaign.budgetRange || "TBD"} />
              <div>
                <p className="text-xs font-semibold uppercase text-white/72 lg:text-[#B8B3A7]">
                  Status
                </p>
                <StatusBadge className="mt-1" status={campaign.status} />
                <p className="mt-2 text-xs leading-5 text-white/72 lg:text-[#B8B3A7]">
                  {getCampaignStatusDescription(campaign.status)}
                </p>
              </div>
              <Metric
                label="Dates"
                value={
                  [campaign.startDate, campaign.endDate]
                    .filter(Boolean)
                    .join(" - ") || "TBD"
                }
              />
              <div className="flex flex-col gap-2 sm:flex-row lg:flex-col">
                <CampaignStatusActions
                  campaignId={campaign.id}
                  compact
                  role="influencer"
                  status={campaign.status}
                />
                <ButtonLink
                  className="w-full"
                  href="/influencer/messages"
                  size="sm"
                  variant="secondary"
                >
                  View Conversation
                </ButtonLink>
              </div>
            </GlassCard>
          ))}
        </section>
      )}
    </div>
  );
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-xs font-semibold uppercase text-white/72 lg:text-[#B8B3A7]">{label}</p>
      <p className="mt-1 text-sm font-bold text-[#C9FBFF] lg:text-[#FFD700]">{value}</p>
    </div>
  );
}
