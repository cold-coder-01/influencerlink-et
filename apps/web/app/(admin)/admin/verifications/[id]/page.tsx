import { SocialAccountReviewActions } from "@/components/admin/SocialAccountReviewActions";
import { BackLink } from "@/components/ui/BackLink";
import { ButtonLink } from "@/components/ui/Button";
import { ErrorState } from "@/components/ui/ErrorState";
import { GlassCard } from "@/components/ui/GlassCard";
import { PageHeader } from "@/components/ui/PageHeader";
import { SectionHeader } from "@/components/ui/SectionHeader";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { cn } from "@/lib/cn";
import {
  formatCompactNumber,
  formatDate,
  formatPercent,
} from "@/lib/formatters";
import { routes } from "@/lib/routes";
import {
  fetchSocialAccount,
  getSocialPlatformLabel,
  getVerificationStatusLabel,
  getVerificationStatusTone,
} from "@/lib/social-accounts";

export const dynamic = "force-dynamic";

export default async function AdminVerificationDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const accountId = Number.parseInt(id, 10);

  if (!Number.isFinite(accountId)) {
    return <VerificationError title="Social account not found" />;
  }

  const result = await fetchSocialAccount(accountId);

  if (!result.success || !result.data) {
    return <VerificationError title="Social account not found" />;
  }

  const account = result.data;

  return (
    <div className="space-y-5">
      <BackLink href={routes.adminVerifications()}>Back to Verification Queue</BackLink>

      <PageHeader
        eyebrow="ADMIN REVIEW"
        subtitle="Inspect the submitted account, record manual review notes, and set the marketplace verification status."
        title={account.handle || account.name}
        actions={
          account.influencerId ? (
            <ButtonLink
              href={routes.influencerDetail(account.influencerId)}
              variant="secondary"
            >
              View Influencer Profile
            </ButtonLink>
          ) : null
        }
      />

      <div className="grid gap-5 xl:grid-cols-[minmax(0,1.4fr)_minmax(340px,0.8fr)]">
        <GlassCard className="p-5 sm:p-6">
          <SectionHeader
            subtitle="Token fields are intentionally absent from this page and the frontend API responses."
            title="Account Summary"
          />
          <div className="mt-5 grid gap-4 md:grid-cols-2">
            <InfoCard label="Influencer" value={account.influencerName || "Unknown influencer"} />
            <InfoCard label="Influencer ID" value={String(account.influencerId || "Unknown")} />
            <InfoCard label="Platform" value={getSocialPlatformLabel(account.platform)} />
            <InfoCard label="Handle" value={account.handle || "TBD"} />
            <InfoCard
              className="md:col-span-2"
              label="Profile URL"
              value={account.profileUrl || "Not provided"}
            />
            <InfoCard
              className="md:col-span-2"
              label="Platform Account ID"
              value={account.platformAccountId || "Not synced"}
            />
            <InfoCard label="Verification Method" value={account.verificationMethod} />
            <div className="rounded-2xl border border-white/[0.10] bg-black/20 p-4">
              <p className="text-xs font-semibold uppercase text-[#B8B3A7]">Status</p>
              <div className="mt-3">
                <StatusBadge tone={getVerificationStatusTone(account.verificationStatus)}>
                  {getVerificationStatusLabel(account.verificationStatus)}
                </StatusBadge>
              </div>
            </div>
            <InfoCard
              label="Followers"
              value={formatCompactNumber(account.followersCount ?? 0)}
            />
            <InfoCard
              label="Average Views"
              value={formatCompactNumber(account.avgViews ?? 0)}
            />
            <InfoCard
              label="Media Count"
              value={formatCompactNumber(account.mediaCount ?? 0)}
            />
            <InfoCard
              label="Engagement Rate"
              value={formatPercent(account.engagementRate ?? 0, 2)}
            />
            <InfoCard
              label="Addis Audience"
              value={formatPercent(account.audienceAddisPercent ?? 0)}
            />
            <InfoCard
              label="Audience Location"
              value={account.audienceLocation || "Not provided"}
            />
            <InfoCard
              label="Last Synced"
              value={formatDate(account.lastSyncedAt, "Not synced")}
            />
            <InfoCard
              label="Verified At"
              value={formatDate(account.verifiedAt, "Not verified")}
            />
            <InfoCard
              className="md:col-span-2"
              label="Rejection Reason"
              tone="danger"
              value={account.rejectionReason || "No rejection reason recorded"}
            />
          </div>
        </GlassCard>

        <GlassCard className="h-fit p-5 sm:p-6">
          <SectionHeader
            subtitle="API sync can prefill public metrics, but final verification still requires admin review."
            title="Review Panel"
          />
          <div className="mt-5">
            <SocialAccountReviewActions
              accountId={account.id}
              initialNotes={account.notes}
              initialRejectionReason={account.rejectionReason}
              initialStatus={
                account.verificationStatus === "draft"
                  ? "pending"
                  : account.verificationStatus
              }
            />
          </div>
        </GlassCard>
      </div>
    </div>
  );
}

function VerificationError({ title }: { title: string }) {
  return (
    <ErrorState
      action={<ButtonLink href={routes.adminVerifications()}>Back to Queue</ButtonLink>}
      description="Please check the account id or retry after confirming the Odoo connection."
      title={title}
    />
  );
}

function InfoCard({
  label,
  value,
  tone = "default",
  className,
}: {
  label: string;
  value: string;
  tone?: "default" | "danger";
  className?: string;
}) {
  return (
    <article className={cn("rounded-2xl border border-white/[0.10] bg-black/20 p-4", className)}>
      <p className="text-xs font-semibold uppercase text-[#B8B3A7]">{label}</p>
      <p
        className={cn(
          "mt-3 break-words text-base font-bold leading-7 text-[#F5F2E9]",
          tone === "danger" && "text-[#FF8B95]",
        )}
      >
        {value}
      </p>
    </article>
  );
}
