import { PaymentStatusActions } from "@/components/payments/PaymentStatusActions";
import { BackLink } from "@/components/ui/BackLink";
import { ButtonLink } from "@/components/ui/Button";
import { ErrorState } from "@/components/ui/ErrorState";
import { GlassCard } from "@/components/ui/GlassCard";
import { StatusBadge } from "@/components/ui/StatusBadge";
import {
  fetchPayment,
  getPaymentMethodLabel,
  getPaymentStatusLabel,
  getPaymentStatusTone,
  getPaymentTypeLabel,
} from "@/lib/payments";
import { formatCurrencyETB, formatDate } from "@/lib/formatters";
import {
  canReleasePayment,
  canUpdatePayment,
  canViewPayment,
} from "@/lib/permissions";
import { routes } from "@/lib/routes";
import { getCurrentSession } from "@/lib/session";

export const dynamic = "force-dynamic";

export default async function PaymentDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const paymentId = Number.parseInt(id, 10);

  if (!Number.isFinite(paymentId)) {
    return <PaymentError title="Payment not found" />;
  }

  const [session, result] = await Promise.all([
    getCurrentSession(),
    fetchPayment(paymentId),
  ]);

  if (!result.success) {
    return (
      <PaymentError
        title={result.status === 404 ? "Payment not found" : "Could not load payment"}
      />
    );
  }

  if (!canViewPayment(session, result.data)) {
    return <PaymentError title="Payment not found" />;
  }

  const canDeposit =
    canUpdatePayment(session, result.data) &&
    result.data.paymentStatus === "requested";
  const canCancel = canDeposit;
  const canRelease =
    canReleasePayment(session, result.data) &&
    result.data.paymentStatus === "deposited";

  return (
    <div className="space-y-5">
      <BackLink href={routes.payments()}>Back to Payments</BackLink>

      <section className="overflow-hidden rounded-[24px] border border-white/[0.10] bg-[radial-gradient(circle_at_82%_18%,rgba(255,215,0,0.20),transparent_30%),linear-gradient(135deg,#11110e,#050505_68%)] p-6 shadow-[0_24px_80px_rgba(0,0,0,0.35)] sm:p-8">
        <StatusBadge
          label={getPaymentStatusLabel(result.data.paymentStatus)}
          tone={getPaymentStatusTone(result.data.paymentStatus)}
        />
        <h1 className="mt-5 text-4xl font-bold tracking-normal text-[#C9FBFF] lg:text-[#FFD700] sm:text-5xl">
          {result.data.name}
        </h1>
        <p className="mt-4 max-w-2xl text-sm leading-7 text-[#D8D0BD] sm:text-base">
          {getPaymentTypeLabel(result.data.paymentType)} for{" "}
          {result.data.contractName || "contract payment tracking"}.
        </p>
        <div className="mt-6 flex flex-wrap gap-3">
          {result.data.contractId ? (
            <ButtonLink
              href={routes.contractDetail(result.data.contractId)}
              variant="secondary"
            >
              View Contract
            </ButtonLink>
          ) : null}
          {result.data.campaignId ? (
            <ButtonLink
              href={routes.campaignDetail(result.data.campaignId)}
              variant="secondary"
            >
              View Campaign
            </ButtonLink>
          ) : null}
          <PaymentStatusActions
            canCancel={canCancel}
            canDeposit={canDeposit}
            canRelease={canRelease}
            paymentId={result.data.id}
          />
        </div>
      </section>

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <Info label="Influencer" value={result.data.influencerName || "TBD"} />
        <Info label="Business" value={result.data.businessName || "TBD"} />
        <Info
          label="Amount"
          value={formatCurrencyETB(result.data.amount || 0)}
        />
        <Info
          label="Net Amount"
          value={formatCurrencyETB(result.data.netAmount || 0)}
        />
      </section>

      <GlassCard className="p-5 sm:p-6">
        <h2 className="text-2xl font-bold text-white lg:text-[#F5F2E9]">Payment Details</h2>
        <div className="mt-5 grid gap-4 md:grid-cols-2">
          <Info
            label="Platform Fee"
            value={formatCurrencyETB(result.data.platformFee || 0)}
          />
          <Info
            label="Payment Method"
            value={getPaymentMethodLabel(result.data.paymentMethod)}
          />
          <Info
            label="Transaction Reference"
            value={result.data.transactionReference || "TBD"}
          />
          <Info label="Due Date" value={formatDate(result.data.dueDate)} />
          <Info
            label="Deposited At"
            value={formatDate(result.data.depositedAt)}
          />
          <Info label="Released At" value={formatDate(result.data.releasedAt)} />
        </div>
      </GlassCard>

      <GlassCard className="p-5 sm:p-6">
        <h2 className="text-2xl font-bold text-white lg:text-[#F5F2E9]">Notes</h2>
        <p className="mt-4 whitespace-pre-wrap text-sm leading-7 text-[#D8D0BD]">
          {result.data.notes || "No notes recorded yet."}
        </p>
      </GlassCard>
    </div>
  );
}

function PaymentError({ title }: { title: string }) {
  return (
    <ErrorState
      action={<ButtonLink href={routes.payments()}>Back to Payments</ButtonLink>}
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
