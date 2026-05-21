import { ContractCreateForm } from "@/components/contracts/ContractCreateForm";
import { BackLink } from "@/components/ui/BackLink";
import { ButtonLink } from "@/components/ui/Button";
import { ErrorState } from "@/components/ui/ErrorState";
import { GlassCard } from "@/components/ui/GlassCard";
import { PageHeader } from "@/components/ui/PageHeader";
import { fetchCampaign } from "@/lib/campaigns";
import { canCreateContract } from "@/lib/permissions";
import { routes } from "@/lib/routes";
import { getCurrentSession } from "@/lib/session";

export const dynamic = "force-dynamic";

export default async function NewContractPage({
  searchParams,
}: {
  searchParams: Promise<{ campaignId?: string }>;
}) {
  const { campaignId: campaignIdParam } = await searchParams;
  const campaignId = Number.parseInt(campaignIdParam || "", 10);

  if (!Number.isFinite(campaignId)) {
    return (
      <ErrorState
        action={<ButtonLink href={routes.campaigns()}>View Campaigns</ButtonLink>}
        description="Choose a campaign before creating a contract."
        title="Campaign required"
      />
    );
  }

  const [session, result] = await Promise.all([
    getCurrentSession(),
    fetchCampaign(campaignId),
  ]);

  if (!result.success || !canCreateContract(session, result.data)) {
    return (
      <ErrorState
        action={<ButtonLink href={routes.campaigns()}>View Campaigns</ButtonLink>}
        description="You can only create contracts for campaigns you own."
        title="Campaign not available"
      />
    );
  }

  return (
    <div className="space-y-5">
      <BackLink href={routes.campaignDetail(result.data.id)}>
        Back to Campaign
      </BackLink>
      <PageHeader
        eyebrow="NEW AGREEMENT"
        subtitle="Create a lightweight campaign agreement for deliverables, terms, value, and signatures."
        title="Create Contract"
      />
      <GlassCard className="p-5 sm:p-6">
        <ContractCreateForm campaign={result.data} />
      </GlassCard>
    </div>
  );
}
