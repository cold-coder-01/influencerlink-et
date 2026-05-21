import { ButtonLink } from "@/components/ui/Button";
import { EmptyState } from "@/components/ui/EmptyState";
import { GlassCard } from "@/components/ui/GlassCard";
import { KpiCard } from "@/components/ui/KpiCard";
import { PageHeader } from "@/components/ui/PageHeader";
import { StatusBadge } from "@/components/ui/StatusBadge";
import {
  fetchContracts,
  getContractStatusLabel,
  getContractStatusTone,
} from "@/lib/contracts";
import { formatCurrencyETB, formatDateRange } from "@/lib/formatters";
import { isAdmin, isBusinessOwner } from "@/lib/permissions";
import { routes } from "@/lib/routes";
import { getCurrentSession } from "@/lib/session";

export const dynamic = "force-dynamic";

export default async function ContractsPage() {
  const session = await getCurrentSession();
  const domain =
    session && isAdmin(session)
      ? []
      : session && isBusinessOwner(session) && session.partnerId
        ? [
            "|",
            ["business_partner_id", "=", session.partnerId],
            ["campaign_id.partner_id", "=", session.partnerId],
          ]
        : null;
  const result = domain
    ? await fetchContracts(domain)
    : { success: true as const, data: [] };
  const contracts = result.success ? result.data : [];
  const drafts = contracts.filter(
    (contract) => contract.contractStatus === "draft",
  ).length;
  const awaitingSignature = contracts.filter(
    (contract) => !contract.businessSigned || !contract.influencerSigned,
  ).length;
  const active = contracts.filter((contract) =>
    ["accepted", "active"].includes(contract.contractStatus),
  ).length;

  return (
    <div className="space-y-5">
      <PageHeader
        actions={
          <ButtonLink href={routes.campaigns()} variant="secondary">
            View Campaigns
          </ButtonLink>
        }
        eyebrow="COMMERCIAL WORKFLOW"
        subtitle="Track campaign agreements, deliverables, signatures, and contract status."
        title="Contracts"
      />

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <KpiCard label="Total Contracts" value={String(contracts.length)} />
        <KpiCard label="Draft" value={String(drafts)} />
        <KpiCard label="Awaiting Signature" value={String(awaitingSignature)} />
        <KpiCard label="Active/Accepted" value={String(active)} />
      </section>

      {contracts.length === 0 ? (
        <EmptyState
          action={
            <ButtonLink href={routes.campaigns()} variant="secondary">
              View Campaigns
            </ButtonLink>
          }
          description="Create a contract from an active campaign to formalize the partnership."
          title="No contracts yet"
        />
      ) : (
        <section className="space-y-3">
          {contracts.map((contract) => (
            <GlassCard
              as="article"
              className="grid gap-4 p-5 xl:grid-cols-[1.2fr_1fr_0.9fr_0.8fr_auto] xl:items-center"
              hover
              key={contract.id}
            >
              <div>
                <p className="text-lg font-bold text-white lg:text-[#F5F2E9]">
                  {contract.name}
                </p>
                <p className="mt-1 text-sm text-white/72 lg:text-[#B8B3A7]">
                  {contract.campaignName || `Campaign ${contract.campaignId}`}
                </p>
              </div>
              <Metric label="Influencer" value={contract.influencerName || "TBD"} />
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
                  {contract.businessSigned ? "Business signed" : "Business pending"} /{" "}
                  {contract.influencerSigned
                    ? "Influencer signed"
                    : "Influencer pending"}
                </p>
                <p className="mt-1 text-xs text-white/72 lg:text-[#B8B3A7]">
                  {formatDateRange(contract.startDate, contract.endDate)}
                </p>
              </div>
              <ButtonLink
                href={routes.contractDetail(contract.id)}
                size="sm"
                variant="secondary"
              >
                View Details
              </ButtonLink>
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
