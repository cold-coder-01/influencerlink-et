import { ContractSignButton } from "@/components/contracts/ContractSignButton";
import { BackLink } from "@/components/ui/BackLink";
import { ButtonLink } from "@/components/ui/Button";
import { ErrorState } from "@/components/ui/ErrorState";
import { GlassCard } from "@/components/ui/GlassCard";
import { StatusBadge } from "@/components/ui/StatusBadge";
import {
  fetchContract,
  getContractStatusLabel,
  getContractStatusTone,
  getContractTypeLabel,
  type InfluencerContract,
} from "@/lib/contracts";
import { fetchPayments, type InfluencerPayment } from "@/lib/payments";
import { formatCurrencyETB, formatDate, formatDateRange } from "@/lib/formatters";
import {
  canCreatePayment,
  canSignContract,
  canViewContract,
  isBusinessOwner,
} from "@/lib/permissions";
import { routes } from "@/lib/routes";
import { getCurrentSession } from "@/lib/session";

export const dynamic = "force-dynamic";

export default async function ContractDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const contractId = Number.parseInt(id, 10);

  if (!Number.isFinite(contractId)) {
    return <ContractError title="Contract not found" />;
  }

  const [session, result, paymentResult] = await Promise.all([
    getCurrentSession(),
    fetchContract(contractId),
    fetchPayments([["contract_id", "=", contractId]], "created_at desc, id desc"),
  ]);

  if (!result.success) {
    return (
      <ContractError
        title={
          result.status === 404 ? "Contract not found" : "Could not load contract"
        }
      />
    );
  }

  if (!canViewContract(session, result.data)) {
    return <ContractError title="Contract not found" />;
  }

  return (
    <ContractDetail
      canCreatePayment={canCreatePayment(session, result.data)}
      canSign={canSignContract(session, result.data)}
      contract={result.data}
      existingPayment={paymentResult.success ? paymentResult.data[0] : null}
      signLabel={isBusinessOwner(session) ? "Sign as Business" : "Sign Contract"}
    />
  );
}

function ContractDetail({
  contract,
  canCreatePayment,
  canSign,
  existingPayment,
  signLabel,
}: {
  contract: InfluencerContract;
  canCreatePayment: boolean;
  canSign: boolean;
  existingPayment?: InfluencerPayment | null;
  signLabel: string;
}) {
  return (
    <div className="space-y-5">
      <BackLink href={routes.contracts()}>Back to Contracts</BackLink>

      <section className="overflow-hidden rounded-[24px] border border-white/[0.10] bg-[radial-gradient(circle_at_82%_18%,rgba(255,215,0,0.20),transparent_30%),linear-gradient(135deg,#11110e,#050505_68%)] p-6 shadow-[0_24px_80px_rgba(0,0,0,0.35)] sm:p-8">
        <StatusBadge
          label={getContractStatusLabel(contract.contractStatus)}
          tone={getContractStatusTone(contract.contractStatus)}
        />
        <h1 className="mt-5 text-4xl font-bold tracking-normal text-[#C9FBFF] lg:text-[#FFD700] sm:text-5xl">
          {contract.name}
        </h1>
        <p className="mt-4 max-w-2xl text-sm leading-7 text-[#D8D0BD] sm:text-base">
          {getContractTypeLabel(contract.contractType)} for{" "}
          {contract.campaignName || `Campaign ${contract.campaignId}`}.
        </p>
        <div className="mt-6 flex flex-wrap gap-3">
          {contract.campaignId ? (
            <ButtonLink
              href={routes.campaignDetail(contract.campaignId)}
              variant="secondary"
            >
              View Campaign
            </ButtonLink>
          ) : null}
          {canSign ? (
            <ContractSignButton contractId={contract.id} label={signLabel} />
          ) : null}
          {existingPayment ? (
            <ButtonLink
              href={routes.paymentDetail(existingPayment.id)}
              variant="secondary"
            >
              View Payment
            </ButtonLink>
          ) : canCreatePayment ? (
            <ButtonLink href={routes.newPayment(contract.id)} variant="secondary">
              Create Escrow Payment
            </ButtonLink>
          ) : null}
        </div>
      </section>

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <Info label="Business Owner" value={contract.businessName || "TBD"} />
        <Info label="Influencer" value={contract.influencerName || "TBD"} />
        <Info
          label="Value"
          value={
            contract.contractValue
              ? formatCurrencyETB(contract.contractValue)
              : "TBD"
          }
        />
        <Info
          label="Date Range"
          value={formatDateRange(contract.startDate, contract.endDate)}
        />
      </section>

      <GlassCard className="p-5 sm:p-6">
        <h2 className="text-2xl font-bold text-white lg:text-[#F5F2E9]">Deliverables</h2>
        <p className="mt-4 whitespace-pre-wrap text-sm leading-7 text-[#D8D0BD]">
          {contract.deliverables || "No deliverables recorded yet."}
        </p>
      </GlassCard>

      <GlassCard className="p-5 sm:p-6">
        <h2 className="text-2xl font-bold text-white lg:text-[#F5F2E9]">Terms</h2>
        <p className="mt-4 whitespace-pre-wrap text-sm leading-7 text-[#D8D0BD]">
          {contract.terms || "No terms recorded yet."}
        </p>
      </GlassCard>

      <GlassCard className="p-5 sm:p-6">
        <h2 className="text-2xl font-bold text-white lg:text-[#F5F2E9]">Signature Status</h2>
        <div className="mt-5 grid gap-4 md:grid-cols-2">
          <Info
            label="Business Signature"
            value={
              contract.businessSigned
                ? `Signed ${formatDate(contract.businessSignedAt, "")}`
                : "Pending"
            }
          />
          <Info
            label="Influencer Signature"
            value={
              contract.influencerSigned
                ? `Signed ${formatDate(contract.influencerSignedAt, "")}`
                : "Pending"
            }
          />
        </div>
      </GlassCard>
    </div>
  );
}

function ContractError({ title }: { title: string }) {
  return (
    <ErrorState
      action={<ButtonLink href={routes.contracts()}>Back to Contracts</ButtonLink>}
      description="Please check your Odoo connection and try again."
      title={title}
    />
  );
}

function Info({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-white/[0.08] bg-black/20 p-4">
      <p className="text-xs font-semibold uppercase text-white/72 lg:text-[#B8B3A7]">{label}</p>
      <p className="mt-2 break-words text-lg font-bold text-white lg:text-[#F5F2E9]">
        {value}
      </p>
    </div>
  );
}
