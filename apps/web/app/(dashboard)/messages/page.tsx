import { ButtonLink } from "@/components/ui/Button";
import { EmptyState } from "@/components/ui/EmptyState";
import { GlassCard } from "@/components/ui/GlassCard";
import { KpiCard } from "@/components/ui/KpiCard";
import { PageHeader } from "@/components/ui/PageHeader";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { formatDate } from "@/lib/formatters";
import {
  fetchMessages,
  getMessageTypeLabel,
  type CampaignMessage,
} from "@/lib/messages";
import { isAdmin, isBusinessOwner } from "@/lib/permissions";
import { routes } from "@/lib/routes";
import { getCurrentSession } from "@/lib/session";

export const dynamic = "force-dynamic";

export default async function MessagesPage() {
  const session = await getCurrentSession();
  const domain =
    session && isAdmin(session)
      ? []
      : session && isBusinessOwner(session) && session.partnerId
        ? [["campaign_id.partner_id", "=", session.partnerId] as [string, string, number]]
        : null;
  const result = domain
    ? await fetchMessages(domain)
    : { success: true as const, data: [] };
  const messages = result.success ? result.data : [];
  const latestByCampaign = getLatestByCampaign(messages);
  const unread = messages.filter((message) => !message.isRead).length;
  const invitations = messages.filter(
    (message) => message.messageType === "invitation",
  ).length;

  return (
    <div className="space-y-5">
      <PageHeader
        eyebrow="COLLABORATION INBOX"
        subtitle="Manage campaign conversations and influencer invitations."
        title="Messages"
      />

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <KpiCard label="Total Messages" value={String(messages.length)} />
        <KpiCard label="Unread" value={String(unread)} />
        <KpiCard label="Invitations" value={String(invitations)} />
        <KpiCard
          label="Active Conversations"
          value={String(latestByCampaign.length)}
        />
      </section>

      {latestByCampaign.length === 0 ? (
        <EmptyState
          description="Send a campaign invitation to start a conversation."
          title="No messages yet"
        />
      ) : (
        <section className="space-y-3">
          {latestByCampaign.map((message) => (
            <GlassCard
              as="article"
              className="grid gap-4 p-5 lg:grid-cols-[1.1fr_1.5fr_0.8fr_auto] lg:items-center"
              hover
              key={message.campaignId}
            >
              <div>
                <p className="break-words text-lg font-bold text-white lg:text-[#F5F2E9]">
                  {message.campaignName || `Campaign ${message.campaignId}`}
                </p>
                <p className="mt-1 text-sm text-white/72 lg:text-[#B8B3A7]">
                  {message.influencerName || "Influencer TBD"}
                </p>
              </div>
              <div>
                <div className="flex flex-wrap gap-2">
                  <StatusBadge
                    label={getMessageTypeLabel(message.messageType)}
                    tone={message.messageType === "invitation" ? "gold" : "gray"}
                  />
                  <StatusBadge
                    label={message.isRead ? "Read" : "Unread"}
                    tone={message.isRead ? "green" : "gold"}
                  />
                </div>
                <p className="mt-3 line-clamp-2 text-sm leading-6 text-[#D8D0BD]">
                  {message.body}
                </p>
              </div>
              <p className="text-sm font-semibold text-white/72 lg:text-[#B8B3A7]">
                {formatDate(message.createdAt, "Just now")}
              </p>
              <ButtonLink
                className="w-full lg:w-auto"
                href={routes.campaignDetail(message.campaignId)}
                size="sm"
                variant="secondary"
              >
                View Campaign
              </ButtonLink>
            </GlassCard>
          ))}
        </section>
      )}
    </div>
  );
}

function getLatestByCampaign(messages: CampaignMessage[]) {
  const latest = new Map<number, CampaignMessage>();

  messages.forEach((message) => {
    if (!message.campaignId || latest.has(message.campaignId)) return;
    latest.set(message.campaignId, message);
  });

  return Array.from(latest.values());
}
