import { PaymentCreateForm } from "@/components/payments/PaymentCreateForm";
import { BackLink } from "@/components/ui/BackLink";
import { ButtonLink } from "@/components/ui/Button";
import { ErrorState } from "@/components/ui/ErrorState";
import { GlassCard } from "@/components/ui/GlassCard";
import { PageHeader } from "@/components/ui/PageHeader";
import { fetchContract } from "@/lib/contracts";
import { canCreatePayment } from "@/lib/permissions";
import { routes } from "@/lib/routes";
import { getCurrentSession } from "@/lib/session";

export const dynamic = "force-dynamic";

export default async function NewPaymentPage({
  searchParams,
}: {
  searchParams: Promise<{ contractId?: string }>;
}) {
  const { contractId: contractIdParam } = await searchParams;
  const contractId = Number.parseInt(contractIdParam || "", 10);

  if (!Number.isFinite(contractId)) {
    return (
      <ErrorState
        action={<ButtonLink href={routes.contracts()}>View Contracts</ButtonLink>}
        description="Choose an accepted contract before creating an escrow payment."
        title="Contract required"
      />
    );
  }

  const [session, result] = await Promise.all([
    getCurrentSession(),
    fetchContract(contractId),
  ]);

  if (!result.success || !canCreatePayment(session, result.data)) {
    return (
      <ErrorState
        action={<ButtonLink href={routes.contracts()}>View Contracts</ButtonLink>}
        description="Payments can only be created for your accepted or active contracts."
        title="Contract not available"
      />
    );
  }

  return (
    <div className="space-y-5">
      <BackLink href={routes.contractDetail(result.data.id)}>
        Back to Contract
      </BackLink>
      <PageHeader
        eyebrow="ESCROW SETUP"
        subtitle="Create an Odoo-backed payment record for the accepted contract. Gateway collection remains manual in this MVP."
        title="Create Escrow Payment"
      />
      <GlassCard className="p-5 sm:p-6">
        <PaymentCreateForm contract={result.data} />
      </GlassCard>
    </div>
  );
}
