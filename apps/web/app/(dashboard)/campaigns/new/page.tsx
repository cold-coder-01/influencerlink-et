import { CampaignBriefForm } from "@/components/campaigns/CampaignBriefForm";
import { BackLink } from "@/components/ui/BackLink";
import { PageHeader } from "@/components/ui/PageHeader";
import { fetchIndustryDetail } from "@/lib/industries";
import { fetchInfluencerDetail } from "@/lib/influencers";
import { routes } from "@/lib/routes";

export const dynamic = "force-dynamic";

type NewCampaignPageProps = {
  searchParams: Promise<{
    influencerId?: string;
    industryId?: string;
  }>;
};

function parseId(value?: string) {
  if (!value) {
    return null;
  }

  const parsed = Number.parseInt(value, 10);

  return Number.isFinite(parsed) ? parsed : null;
}

export default async function NewCampaignPage({
  searchParams,
}: NewCampaignPageProps) {
  const params = await searchParams;
  const influencerId = parseId(params.influencerId);
  const industryId = parseId(params.industryId);
  const [influencerResult, industryResult] = await Promise.all([
    influencerId ? fetchInfluencerDetail(influencerId) : Promise.resolve(null),
    industryId ? fetchIndustryDetail(industryId) : Promise.resolve(null),
  ]);
  const influencer =
    influencerResult && influencerResult.success ? influencerResult.data : null;
  const industry =
    industryResult && industryResult.success
      ? industryResult.data.industry
      : null;

  return (
    <div className="space-y-5">
      <BackLink href={routes.campaigns()}>Back to Campaigns</BackLink>

      <PageHeader
        eyebrow="CAMPAIGN OPERATIONS"
        subtitle="Define your goals, select your platform, and invite the right influencer to promote your business."
        title="Create Campaign Brief"
      />

      <CampaignBriefForm
        industry={industry}
        industryId={industryId}
        influencer={influencer}
        influencerId={influencerId}
        missingSelection={!influencerId && !industryId}
      />
    </div>
  );
}
