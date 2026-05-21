import { EmptyState } from "@/components/ui/EmptyState";
import { GlassCard } from "@/components/ui/GlassCard";
import { KpiCard } from "@/components/ui/KpiCard";
import { PageHeader } from "@/components/ui/PageHeader";
import { StatusBadge } from "@/components/ui/StatusBadge";
import {
  fetchPayments,
  getPaymentStatusLabel,
  getPaymentStatusTone,
} from "@/lib/payments";
import { formatCurrencyETB, formatDate } from "@/lib/formatters";
import { getSessionProfileId, isAdmin, isInfluencer } from "@/lib/permissions";
import { getCurrentSession } from "@/lib/session";

export const dynamic = "force-dynamic";

export default async function InfluencerEarningsPage() {
  const session = await getCurrentSession();
  const profileId = getSessionProfileId(session);
  const domain =
    session && isAdmin(session)
      ? []
      : session && isInfluencer(session) && profileId
        ? [["influencer_id", "=", profileId]]
        : null;
  const result = domain
    ? await fetchPayments(domain)
    : { success: true as const, data: [] };
  const payments = result.success ? result.data : [];
  const total = payments.reduce((sum, payment) => sum + (payment.netAmount || 0), 0);
  const escrow = payments
    .filter((payment) => payment.paymentStatus === "deposited")
    .reduce((sum, payment) => sum + (payment.netAmount || 0), 0);
  const released = payments
    .filter((payment) => payment.paymentStatus === "released")
    .reduce((sum, payment) => sum + (payment.netAmount || 0), 0);
  const pending = payments
    .filter((payment) => ["draft", "requested"].includes(payment.paymentStatus))
    .reduce((sum, payment) => sum + (payment.netAmount || 0), 0);

  return (
    <div className="space-y-5">
      <PageHeader
        eyebrow="CREATOR FINANCE"
        subtitle="Track campaign payments, escrow deposits, and released payouts."
        title="My Earnings"
      />

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <KpiCard label="Total Earnings" value={formatCurrencyETB(total)} />
        <KpiCard label="In Escrow" value={formatCurrencyETB(escrow)} />
        <KpiCard label="Released" value={formatCurrencyETB(released)} />
        <KpiCard label="Pending" value={formatCurrencyETB(pending)} />
      </section>

      {payments.length === 0 ? (
        <EmptyState
          description="Payments will appear here once a business creates escrow for your signed contract."
          title="No earnings yet"
        />
      ) : (
        <section className="space-y-3">
          {payments.map((payment) => (
            <GlassCard
              as="article"
              className="grid gap-4 p-5 xl:grid-cols-[1.2fr_1fr_0.8fr_0.8fr_0.8fr] xl:items-center"
              hover
              key={payment.id}
            >
              <div>
                <p className="break-words text-lg font-bold text-white lg:text-[#F5F2E9]">
                  {payment.campaignName || "Campaign"}
                </p>
                <p className="mt-1 text-sm text-white/72 lg:text-[#B8B3A7]">
                  {payment.contractName || payment.name}
                </p>
              </div>
              <Metric label="Business" value={payment.businessName || "TBD"} />
              <Metric
                label="Amount"
                value={formatCurrencyETB(payment.amount || 0)}
              />
              <Metric
                label="Net"
                value={formatCurrencyETB(payment.netAmount || 0)}
              />
              <div>
                <StatusBadge
                  label={getPaymentStatusLabel(payment.paymentStatus)}
                  tone={getPaymentStatusTone(payment.paymentStatus)}
                />
                <p className="mt-2 text-xs text-white/72 lg:text-[#B8B3A7]">
                  Released {formatDate(payment.releasedAt, "Pending")}
                </p>
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
    <div className="rounded-xl border border-white/[0.08] bg-black/15 p-3 xl:border-0 xl:bg-transparent xl:p-0">
      <p className="text-xs font-semibold uppercase text-white/72 lg:text-[#B8B3A7]">{label}</p>
      <p className="mt-1 text-sm font-bold text-[#C9FBFF] lg:text-[#FFD700]">{value}</p>
    </div>
  );
}
