import { ButtonLink } from "@/components/ui/Button";
import { EmptyState } from "@/components/ui/EmptyState";
import { GlassCard } from "@/components/ui/GlassCard";
import { KpiCard } from "@/components/ui/KpiCard";
import { PageHeader } from "@/components/ui/PageHeader";
import { StatusBadge } from "@/components/ui/StatusBadge";
import {
  fetchPayments,
  getPaymentMethodLabel,
  getPaymentStatusLabel,
  getPaymentStatusTone,
} from "@/lib/payments";
import { formatCurrencyETB } from "@/lib/formatters";
import { isAdmin, isBusinessOwner } from "@/lib/permissions";
import { routes } from "@/lib/routes";
import { getCurrentSession } from "@/lib/session";

export const dynamic = "force-dynamic";

export default async function PaymentsPage() {
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
    ? await fetchPayments(domain)
    : { success: true as const, data: [] };
  const payments = result.success ? result.data : [];
  const deposited = payments.filter((payment) =>
    ["deposited", "released"].includes(payment.paymentStatus),
  );
  const pending = payments.filter((payment) =>
    ["draft", "requested"].includes(payment.paymentStatus),
  );
  const released = payments.filter(
    (payment) => payment.paymentStatus === "released",
  );
  const totalValue = payments.reduce((sum, payment) => sum + (payment.amount || 0), 0);

  return (
    <div className="space-y-5">
      <PageHeader
        actions={
          <ButtonLink href={routes.contracts()} variant="secondary">
            View Contracts
          </ButtonLink>
        }
        eyebrow="FINANCE DESK"
        subtitle="Track contract payments, escrow deposits, platform fees, and influencer payouts."
        title="Payments & Escrow"
      />

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-5">
        <KpiCard label="Total Payments" value={String(payments.length)} />
        <KpiCard label="Escrow Deposited" value={String(deposited.length)} />
        <KpiCard label="Pending Deposits" value={String(pending.length)} />
        <KpiCard label="Released Payouts" value={String(released.length)} />
        <KpiCard label="Total Value" value={formatCurrencyETB(totalValue)} />
      </section>

      {payments.length === 0 ? (
        <EmptyState
          action={
            <ButtonLink href={routes.contracts()} variant="secondary">
              View Contracts
            </ButtonLink>
          }
          description="Create a payment from an accepted contract to start escrow tracking."
          title="No payments yet"
        />
      ) : (
        <section className="space-y-3">
          {payments.map((payment) => (
            <GlassCard
              as="article"
              className="grid gap-4 p-5 xl:grid-cols-[1.1fr_1fr_1fr_0.9fr_0.9fr_auto] xl:items-center"
              hover
              key={payment.id}
            >
              <div>
                <p className="break-words text-lg font-bold text-white lg:text-[#F5F2E9]">
                  {payment.name}
                </p>
                <p className="mt-1 text-sm text-white/72 lg:text-[#B8B3A7]">
                  {payment.contractName || "No contract"}
                </p>
              </div>
              <Metric label="Campaign" value={payment.campaignName || "TBD"} />
              <Metric label="Influencer" value={payment.influencerName || "TBD"} />
              <div className="space-y-1">
                <Metric
                  label="Amount"
                  value={formatCurrencyETB(payment.amount || 0)}
                />
                <p className="text-xs text-white/72 lg:text-[#B8B3A7]">
                  Fee {formatCurrencyETB(payment.platformFee || 0)} / Net{" "}
                  {formatCurrencyETB(payment.netAmount || 0)}
                </p>
              </div>
              <div>
                <StatusBadge
                  label={getPaymentStatusLabel(payment.paymentStatus)}
                  tone={getPaymentStatusTone(payment.paymentStatus)}
                />
                <p className="mt-2 text-xs text-white/72 lg:text-[#B8B3A7]">
                  {getPaymentMethodLabel(payment.paymentMethod)}
                </p>
                <p className="mt-1 text-xs text-white/72 lg:text-[#B8B3A7]">
                  {payment.transactionReference || "No transaction ref"}
                </p>
              </div>
              <ButtonLink
                className="w-full xl:w-auto"
                href={routes.paymentDetail(payment.id)}
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
    <div className="rounded-xl border border-white/[0.08] bg-black/15 p-3 xl:border-0 xl:bg-transparent xl:p-0">
      <p className="text-xs font-semibold uppercase text-white/72 lg:text-[#B8B3A7]">{label}</p>
      <p className="mt-1 text-sm font-bold text-[#C9FBFF] lg:text-[#FFD700]">{value}</p>
    </div>
  );
}
