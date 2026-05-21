import { BackLink } from "@/components/ui/BackLink";
import { CampaignStatusActions } from "@/components/campaigns/CampaignStatusActions";
import { CampaignStatusTimeline } from "@/components/campaigns/CampaignStatusTimeline";
import { ButtonLink } from "@/components/ui/Button";
import { EmptyState } from "@/components/ui/EmptyState";
import { ErrorState } from "@/components/ui/ErrorState";
import { GlassCard } from "@/components/ui/GlassCard";
import { KpiCard } from "@/components/ui/KpiCard";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { MessageReplyForm } from "@/components/messages/MessageReplyForm";
import {
  getCampaignPrimaryAction,
  getCampaignStatusDescription,
  getCampaignStatusLabel,
} from "@/lib/campaign-lifecycle";
import { fetchCampaign, type Campaign } from "@/lib/campaigns";
import { formatDate, formatRoiMultiplier } from "@/lib/formatters";
import {
  fetchContracts,
  type InfluencerContract,
} from "@/lib/contracts";
import {
  fetchMessages,
  getMessageTypeLabel,
  type CampaignMessage,
} from "@/lib/messages";
import {
  canViewCampaign,
  getSessionRole,
  isAdmin,
  isBusinessOwner,
  type UserRole,
} from "@/lib/permissions";
import { routes } from "@/lib/routes";
import { getCurrentSession } from "@/lib/session";

export const dynamic = "force-dynamic";

export default async function CampaignDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const campaignId = Number.parseInt(id, 10);

  if (!Number.isFinite(campaignId)) {
    return <CampaignError title="Campaign not found" />;
  }

  const [session, result] = await Promise.all([
    getCurrentSession(),
    fetchCampaign(campaignId),
  ]);

  if (!result.success) {
    return (
      <CampaignError
        title={
          result.status === 404
            ? "Campaign not found"
            : "Could not load campaign"
        }
      />
    );
  }

  if (!canViewCampaign(session, result.data)) {
    return <CampaignError title="Campaign not found" />;
  }

  const messagesResult = await fetchMessages(
    [["campaign_id", "=", campaignId]],
    "created_at asc, id asc",
  );
  const contractsResult = await fetchContracts([["campaign_id", "=", campaignId]]);
  const canReply =
    Boolean(session) &&
    (isAdmin(session) ||
      (isBusinessOwner(session) && result.data.partnerId === session?.partnerId));
  const canCreateContract =
    Boolean(session) &&
    (isAdmin(session) ||
      (isBusinessOwner(session) && result.data.partnerId === session?.partnerId)) &&
    ["active", "pending"].includes(result.data.status);

  return (
    <CampaignDetail
      campaign={result.data}
      canReply={canReply}
      canCreateContract={canCreateContract}
      contract={contractsResult.success ? contractsResult.data[0] : null}
      messages={messagesResult.success ? messagesResult.data : []}
      role={getSessionRole(session)}
    />
  );
}

function CampaignDetail({
  campaign,
  canCreateContract,
  canReply,
  contract,
  messages,
  role,
}: {
  campaign: Campaign;
  canCreateContract: boolean;
  canReply: boolean;
  contract: InfluencerContract | null;
  messages: CampaignMessage[];
  role: UserRole;
}) {
  const primaryAction = getCampaignPrimaryAction(campaign.status, role);

  return (
    <div className="space-y-5">
      <BackLink href={routes.campaigns()}>Back to Campaigns</BackLink>

      <section className="overflow-hidden rounded-[24px] border border-white/[0.10] bg-[radial-gradient(circle_at_82%_18%,rgba(255,215,0,0.20),transparent_30%),linear-gradient(135deg,#11110e,#050505_68%)] p-6 shadow-[0_24px_80px_rgba(0,0,0,0.35)] sm:p-8">
        <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
          <div className="max-w-3xl">
            <StatusBadge status={campaign.status} />
            <h1 className="mt-5 text-4xl font-bold tracking-normal text-[#C9FBFF] lg:text-[#FFD700] sm:text-5xl">
              {campaign.name}
            </h1>
            <p className="mt-4 max-w-2xl text-sm leading-7 text-[#D8D0BD] sm:text-base">
              {campaign.description ||
                "Campaign brief details are ready for review in Odoo."}
            </p>
          </div>

          {campaign.influencerId || contract || canCreateContract ? (
            <div className="flex flex-wrap gap-3">
              {campaign.influencerId ? (
                <ButtonLink href={routes.influencerDetail(campaign.influencerId)}>
                  View Influencer
                </ButtonLink>
              ) : null}
              {contract ? (
                <ButtonLink
                  href={routes.contractDetail(contract.id)}
                  variant="secondary"
                >
                  View Contract
                </ButtonLink>
              ) : canCreateContract ? (
                <ButtonLink
                  href={routes.newContract(campaign.id)}
                  variant="secondary"
                >
                  Create Contract
                </ButtonLink>
              ) : null}
            </div>
          ) : null}
        </div>
      </section>

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <KpiCard label="Influencer" value={campaign.influencer || "TBD"} />
        <KpiCard label="Industry" value={campaign.industry || "TBD"} />
        <KpiCard label="Budget" value={campaign.budgetRange || "TBD"} />
        <KpiCard label="Platform" value={campaign.platform || "TBD"} />
      </section>

      <GlassCard className="p-5 sm:p-6">
        <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
          <div className="max-w-2xl">
            <StatusBadge status={campaign.status} />
            <h2 className="mt-3 text-2xl font-bold text-white lg:text-[#F5F2E9]">
              {getCampaignStatusLabel(campaign.status)}
            </h2>
            <p className="mt-2 text-sm leading-6 text-white/72 lg:text-[#B8B3A7]">
              {getCampaignStatusDescription(campaign.status)}
            </p>
            {primaryAction ? (
              <p className="mt-3 text-sm font-semibold text-[#C9FBFF] lg:text-[#FFD700]">
                Next action: {primaryAction.label}
              </p>
            ) : null}
          </div>

          <CampaignStatusActions
            campaignId={campaign.id}
            role={role}
            status={campaign.status}
          />
        </div>
      </GlassCard>

      <GlassCard className="p-5 sm:p-6">
        <h2 className="text-2xl font-bold text-white lg:text-[#F5F2E9]">Campaign Timeline</h2>
        <div className="mt-5">
          <CampaignStatusTimeline status={campaign.status} />
        </div>
      </GlassCard>

      <GlassCard className="p-5 sm:p-6">
        <h2 className="text-2xl font-bold text-white lg:text-[#F5F2E9]">Campaign Brief</h2>
        <div className="mt-5 grid gap-4 md:grid-cols-2">
          <Info label="Business" value={campaign.businessName || "Odoo partner"} />
          <Info label="Goal" value={campaign.campaignGoal || "TBD"} />
          <Info label="Location Focus" value={campaign.locationFocus || "TBD"} />
          <Info
            label="Estimated ROI"
            value={
              campaign.roiMultiplier
                ? formatRoiMultiplier(campaign.roiMultiplier)
                : "TBD"
            }
          />
          <Info label="Start Date" value={campaign.startDate || "TBD"} />
          <Info label="End Date" value={campaign.endDate || "TBD"} />
        </div>
      </GlassCard>

      <GlassCard className="p-5 sm:p-6">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-2xl font-bold text-white lg:text-[#F5F2E9]">
              Campaign Conversation
            </h2>
            <p className="mt-2 text-sm text-white/72 lg:text-[#B8B3A7]">
              Invitation and replies tied to this campaign.
            </p>
          </div>
          <StatusBadge label={`${messages.length} messages`} tone="gold" />
        </div>

        <div className="mt-5 space-y-3">
          {messages.length === 0 ? (
            <EmptyState
              description="Send an invitation or reply to start the campaign conversation."
              title="No messages yet"
            />
          ) : (
            messages.map((message) => (
              <article
                className="rounded-2xl border border-white/[0.08] bg-black/20 p-4"
                key={message.id}
              >
                <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                  <div>
                    <p className="font-bold text-white lg:text-[#F5F2E9]">
                      {message.senderName || "Odoo partner"}
                    </p>
                    <p className="mt-1 text-xs text-white/72 lg:text-[#B8B3A7]">
                      {formatDate(message.createdAt, "Just now")}
                    </p>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <StatusBadge
                      label={getMessageTypeLabel(message.messageType)}
                      tone={message.messageType === "invitation" ? "gold" : "gray"}
                    />
                    <StatusBadge
                      label={message.isRead ? "Read" : "Unread"}
                      tone={message.isRead ? "green" : "gray"}
                    />
                  </div>
                </div>
                <p className="mt-3 whitespace-pre-wrap text-sm leading-6 text-[#D8D0BD]">
                  {message.body}
                </p>
              </article>
            ))
          )}
        </div>

        {canReply ? (
          <div className="mt-5 border-t border-white/[0.08] pt-5">
            <MessageReplyForm campaignId={campaign.id} />
          </div>
        ) : null}
      </GlassCard>
    </div>
  );
}

function CampaignError({ title }: { title: string }) {
  return (
    <ErrorState
      action={<ButtonLink href={routes.campaigns()}>Back to Campaigns</ButtonLink>}
      description="Please check your Odoo connection and try again."
      title={title}
    />
  );
}

function Info({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-white/[0.08] bg-black/20 p-4">
      <p className="text-xs font-semibold uppercase text-white/72 lg:text-[#B8B3A7]">{label}</p>
      <p className="mt-2 text-lg font-bold text-white lg:text-[#F5F2E9]">{value}</p>
    </div>
  );
}
