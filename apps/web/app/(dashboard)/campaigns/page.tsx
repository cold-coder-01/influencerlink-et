import { CampaignsClient } from "@/components/campaigns/CampaignsClient";
import { fetchCampaigns } from "@/lib/campaigns";
import { getCampaignOwnershipDomain } from "@/lib/permissions";
import { getCurrentSession } from "@/lib/session";

export const dynamic = "force-dynamic";

export default async function CampaignsPage() {
  const session = await getCurrentSession();
  const domain = session ? getCampaignOwnershipDomain(session) : null;
  const result = domain
    ? await fetchCampaigns(domain)
    : { success: true as const, data: [] };

  return (
    <CampaignsClient
      campaigns={result.data}
      error={result.success ? null : result.error}
    />
  );
}
