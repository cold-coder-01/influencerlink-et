import { ContractSignButton } from "@/components/contracts/ContractSignButton";
import { EmptyState } from "@/components/ui/EmptyState";
import { GlassCard } from "@/components/ui/GlassCard";
import { PageHeader } from "@/components/ui/PageHeader";
import { StatusBadge } from "@/components/ui/StatusBadge";
import {
  fetchContracts,
  getContractStatusLabel,
  getContractStatusTone,
} from "@/lib/contracts";
import { formatCurrencyETB, formatDateRange } from "@/lib/formatters";
import { canSignContract } from "@/lib/permissions";
import { getCurrentSession } from "@/lib/session";

export const dynamic = "force-dynamic";

export default async function InfluencerContractsPage() {
  const session = await getCurrentSession();
  const profileId = session?.influencerProfileId;
  const result = profileId
    ? await fetchContracts([["influencer_id", "=", profileId]])
    : { success: true as const, data: [] };
  const contracts = result.success ? result.data : [];

  return (
    <div className="space-y-5">
      <PageHeader
        eyebrow="CREATOR AGREEMENTS"
        subtitle="Review and sign agreements for your campaign partnerships."
        title="My Contracts"
      />

      {contracts.length === 0 ? (
        <EmptyState
          description="Contracts for assigned campaigns will appear here when a business owner creates one."
          title="No contracts yet"
        />
      ) : (
        <section className="space-y-3">
          {contracts.map((contract) => (
            <GlassCard
              as="article"
              className="grid gap-4 p-5 xl:grid-cols-[1.2fr_0.9fr_0.8fr_0.8fr_auto] xl:items-center"
              hover
              key={contract.id}
            >
              <div>
                <p className="break-words text-lg font-bold text-white lg:text-[#F5F2E9]">
                  {contract.campaignName || contract.name}
                </p>
                <p className="mt-1 text-sm text-white/72 lg:text-[#B8B3A7]">
                  {contract.businessName || "Business owner"}
                </p>
              </div>
              <Metric
                label="Value"
                value={
                  contract.contractValue
                    ? formatCurrencyETB(contract.contractValue)
                    : "TBD"
                }
              />
              <div>
                <StatusBadge
                  label={getContractStatusLabel(contract.contractStatus)}
                  tone={getContractStatusTone(contract.contractStatus)}
                />
                <p className="mt-2 text-xs text-white/72 lg:text-[#B8B3A7]">
                  {formatDateRange(contract.startDate, contract.endDate)}
                </p>
              </div>
              <Metric
                label="Signature"
                value={contract.influencerSigned ? "Signed" : "Pending"}
              />
              {canSignContract(session, contract) ? (
                <ContractSignButton
                  contractId={contract.id}
                  label="Sign Contract"
                />
              ) : (
                <StatusBadge
                  label={contract.influencerSigned ? "Signed" : "No action"}
                  tone={contract.influencerSigned ? "green" : "gray"}
                />
              )}
            </GlassCard>
          ))}
        </section>
      )}
    </div>
  );
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border border-white/[0.08] bg-black/15 p-3 xl:border-0 xl:bg-transparent xl:p-0">
      <p className="text-xs font-semibold uppercase text-white/72 lg:text-[#B8B3A7]">{label}</p>
      <p className="mt-1 text-sm font-bold text-[#C9FBFF] lg:text-[#FFD700]">{value}</p>
    </div>
  );
}
