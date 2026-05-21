import { MessageReplyForm } from "@/components/messages/MessageReplyForm";
import { EmptyState } from "@/components/ui/EmptyState";
import { GlassCard } from "@/components/ui/GlassCard";
import { PageHeader } from "@/components/ui/PageHeader";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { formatDate } from "@/lib/formatters";
import {
  fetchMessages,
  getMessageTypeLabel,
  type CampaignMessage,
} from "@/lib/messages";
import { getCurrentSession } from "@/lib/session";

export const dynamic = "force-dynamic";

export default async function InfluencerMessagesPage() {
  const session = await getCurrentSession();
  const profileId = session?.influencerProfileId;
  const result = profileId
    ? await fetchMessages(
        [
          "|",
          ["influencer_id", "=", profileId],
          ["campaign_id.influencer_id", "=", profileId],
        ],
        "created_at desc, id desc",
      )
    : { success: true as const, data: [] };
  const messages = result.success ? result.data : [];
  const conversations = groupByCampaign(messages);

  return (
    <div className="space-y-5">
      <PageHeader
        eyebrow="CREATOR INBOX"
        subtitle="Review campaign invitations and reply to business owners."
        title="Messages"
      />

      {conversations.length === 0 ? (
        <EmptyState
          description="Campaign invitations and replies from businesses will appear here."
          title="No messages yet"
        />
      ) : (
        <section className="space-y-4">
          {conversations.map((conversation) => (
            <GlassCard className="p-5 sm:p-6" key={conversation.campaignId}>
              <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                <div>
                  <h2 className="text-xl font-bold text-white lg:text-[#F5F2E9]">
                    {conversation.campaignName ||
                      `Campaign ${conversation.campaignId}`}
                  </h2>
                  <p className="mt-1 text-sm text-white/72 lg:text-[#B8B3A7]">
                    Latest: {formatDate(conversation.latest.createdAt, "Just now")}
                  </p>
                </div>
                <StatusBadge
                  label={`${conversation.messages.length} messages`}
                  tone="gold"
                />
              </div>

              <div className="mt-5 space-y-3">
                {conversation.messages
                  .slice()
                  .reverse()
                  .map((message) => (
                    <article
                      className="rounded-2xl border border-white/[0.16] bg-white/[0.10] lg:border-white/[0.08] lg:bg-black/20 p-4"
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
                        <StatusBadge
                          label={getMessageTypeLabel(message.messageType)}
                          tone={
                            message.messageType === "invitation" ? "gold" : "gray"
                          }
                        />
                      </div>
                      <p className="mt-3 whitespace-pre-wrap break-words text-sm leading-6 text-[#D8D0BD]">
                        {message.body}
                      </p>
                    </article>
                  ))}
              </div>

              <div className="mt-5 border-t border-white/[0.08] pt-5">
                <MessageReplyForm
                  campaignId={conversation.campaignId}
                  placeholder="Reply to the business owner..."
                  subject="Influencer reply"
                />
              </div>
            </GlassCard>
          ))}
        </section>
      )}
    </div>
  );
}

function groupByCampaign(messages: CampaignMessage[]) {
  const grouped = new Map<
    number,
    {
      campaignId: number;
      campaignName?: string | null;
      latest: CampaignMessage;
      messages: CampaignMessage[];
    }
  >();

  messages.forEach((message) => {
    if (!message.campaignId) return;

    const existing = grouped.get(message.campaignId);

    if (existing) {
      existing.messages.push(message);
      return;
    }

    grouped.set(message.campaignId, {
      campaignId: message.campaignId,
      campaignName: message.campaignName,
      latest: message,
      messages: [message],
    });
  });

  return Array.from(grouped.values());
}
