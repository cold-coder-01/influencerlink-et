import "server-only";

import {
  authenticateServiceUser,
  executeKw,
  getOdooConfig,
  type OdooConfig,
} from "@/lib/odoo-rpc";
import {
  getMany2OneId,
  getMany2OneName,
  hasField,
  pickExistingFields,
  pickExistingOrder,
  safeString,
  type Many2OneValue,
} from "@/lib/odoo-fields";
import type { Campaign } from "@/lib/campaigns";
import {
  getSessionProfileId,
  getSessionRole,
  isAdmin,
  isBusinessOwner,
  isInfluencer,
  type PermissionSession,
} from "@/lib/permissions";

export type MessageDirection =
  | "business_to_influencer"
  | "influencer_to_business"
  | "system";

export type MessageType = "invitation" | "reply" | "update" | "system";

export type CampaignMessage = {
  id: number;
  subject: string;
  campaignId: number;
  campaignName?: string | null;
  senderPartnerId?: number | null;
  senderName?: string | null;
  receiverPartnerId?: number | null;
  receiverName?: string | null;
  influencerId?: number | null;
  influencerName?: string | null;
  messageType: MessageType;
  direction: MessageDirection;
  body: string;
  isRead: boolean;
  readAt?: string | null;
  createdAt?: string | null;
};

type OdooFieldMap = Record<string, unknown>;
type MessageDomain = unknown[];

type RawMessage = {
  id: number;
  name?: string | false;
  campaign_id?: Many2OneValue;
  campaign_name?: string | false;
  sender_partner_id?: Many2OneValue;
  receiver_partner_id?: Many2OneValue;
  influencer_id?: Many2OneValue;
  message_type?: string | false;
  direction?: string | false;
  body?: string | false;
  is_read?: boolean;
  read_at?: string | false;
  created_at?: string | false;
};

type RawInfluencerPartner = {
  partner_id?: Many2OneValue;
};

export type MessageCreateInput = {
  campaignId: number;
  subject: string;
  body: string;
  messageType?: MessageType | null;
  direction?: MessageDirection | null;
};

export type MessageCreateResult =
  | { success: true; data: CampaignMessage }
  | { success: false; status: 400 | 403 | 502; error: string };

const messageTypes = ["invitation", "reply", "update", "system"] as const;
const messageDirections = [
  "business_to_influencer",
  "influencer_to_business",
  "system",
] as const;

const readFields = [
  "name",
  "campaign_id",
  "campaign_name",
  "sender_partner_id",
  "receiver_partner_id",
  "influencer_id",
  "message_type",
  "direction",
  "body",
  "is_read",
  "read_at",
  "created_at",
];

function asMessageType(value: unknown): MessageType {
  return messageTypes.includes(value as MessageType)
    ? (value as MessageType)
    : "reply";
}

function asMessageDirection(value: unknown): MessageDirection {
  return messageDirections.includes(value as MessageDirection)
    ? (value as MessageDirection)
    : "system";
}

export function normalizeMessage(raw: RawMessage): CampaignMessage {
  return {
    id: raw.id,
    subject: safeString(raw.name, `Message ${raw.id}`),
    campaignId: getMany2OneId(raw.campaign_id) ?? 0,
    campaignName:
      getMany2OneName(raw.campaign_id) ?? safeString(raw.campaign_name, "") ?? null,
    senderPartnerId: getMany2OneId(raw.sender_partner_id),
    senderName: getMany2OneName(raw.sender_partner_id),
    receiverPartnerId: getMany2OneId(raw.receiver_partner_id),
    receiverName: getMany2OneName(raw.receiver_partner_id),
    influencerId: getMany2OneId(raw.influencer_id),
    influencerName: getMany2OneName(raw.influencer_id),
    messageType: asMessageType(raw.message_type),
    direction: asMessageDirection(raw.direction),
    body: safeString(raw.body, ""),
    isRead: Boolean(raw.is_read),
    readAt: safeString(raw.read_at, "") || null,
    createdAt: safeString(raw.created_at, "") || null,
  };
}

export function normalizeMessages(raw: RawMessage[]) {
  return raw.map(normalizeMessage);
}

export function getMessageDirectionForRole(
  role: string | null | undefined,
): MessageDirection {
  if (role === "business_owner") return "business_to_influencer";
  if (role === "influencer") return "influencer_to_business";
  return "system";
}

export function getMessageTypeLabel(type: MessageType) {
  const labels: Record<MessageType, string> = {
    invitation: "Invitation",
    reply: "Reply",
    system: "System",
    update: "Update",
  };

  return labels[type];
}

export function getMessageDirectionLabel(direction: MessageDirection) {
  const labels: Record<MessageDirection, string> = {
    business_to_influencer: "Business to Influencer",
    influencer_to_business: "Influencer to Business",
    system: "System",
  };

  return labels[direction];
}

export function buildMessageCreatePayload(
  input: {
    campaignId: number;
    subject: string;
    senderPartnerId: number;
    receiverPartnerId?: number | null;
    influencerId?: number | null;
    messageType: MessageType;
    direction: MessageDirection;
    body: string;
  },
  existingFields: OdooFieldMap,
) {
  const payload: Record<string, unknown> = {};

  if (hasField(existingFields, "name")) payload.name = input.subject;
  if (hasField(existingFields, "campaign_id")) payload.campaign_id = input.campaignId;
  if (hasField(existingFields, "sender_partner_id")) {
    payload.sender_partner_id = input.senderPartnerId;
  }
  if (hasField(existingFields, "receiver_partner_id")) {
    payload.receiver_partner_id = input.receiverPartnerId || false;
  }
  if (hasField(existingFields, "influencer_id")) {
    payload.influencer_id = input.influencerId || false;
  }
  if (hasField(existingFields, "message_type")) {
    payload.message_type = input.messageType;
  }
  if (hasField(existingFields, "direction")) payload.direction = input.direction;
  if (hasField(existingFields, "body")) payload.body = input.body;

  return payload;
}

async function getMessageFields(uid: number, config: OdooConfig) {
  return executeKw<OdooFieldMap>(
    uid,
    "influencer.message",
    "fields_get",
    [],
    { attributes: ["selection"] },
    config,
  );
}

async function getInfluencerPartnerId(
  uid: number,
  config: OdooConfig,
  influencerId?: number | null,
) {
  if (!influencerId) return null;

  const profiles = await executeKw<RawInfluencerPartner[]>(
    uid,
    "influencer.profile",
    "search_read",
    [[["id", "=", influencerId]]],
    { fields: ["partner_id"], limit: 1 },
    config,
  );

  return getMany2OneId(profiles[0]?.partner_id);
}

export async function fetchMessages(domain: MessageDomain = [], order = "created_at desc, id desc") {
  try {
    const config = getOdooConfig();
    const uid = await authenticateServiceUser(config);
    const fields = await getMessageFields(uid, config);
    const messages = await executeKw<RawMessage[]>(
      uid,
      "influencer.message",
      "search_read",
      [domain],
      {
        fields: pickExistingFields(fields, readFields),
        order: pickExistingOrder(fields, order),
      },
      config,
    );

    return { success: true as const, data: normalizeMessages(messages) };
  } catch (error) {
    return {
      success: false as const,
      data: [],
      error:
        error instanceof Error
          ? error.message
          : "Could not load messages from Odoo.",
    };
  }
}

export async function createCampaignMessage({
  campaign,
  input,
  session,
}: {
  campaign: Campaign;
  input: MessageCreateInput;
  session: PermissionSession;
}): Promise<MessageCreateResult> {
  const role = getSessionRole(session);
  const subject = input.subject.trim() || "Campaign message";
  const body = input.body.trim();

  if (!input.campaignId || !Number.isInteger(input.campaignId)) {
    return { success: false, status: 400, error: "campaignId is required." };
  }

  if (!body) {
    return { success: false, status: 400, error: "Message body is required." };
  }

  if (
    isBusinessOwner(session) &&
    (!session.partnerId || campaign.partnerId !== session.partnerId)
  ) {
    return { success: false, status: 403, error: "You cannot message this campaign." };
  }

  if (
    isInfluencer(session) &&
    (!getSessionProfileId(session) ||
      campaign.influencerId !== getSessionProfileId(session))
  ) {
    return { success: false, status: 403, error: "You cannot message this campaign." };
  }

  if (!isAdmin(session) && !isBusinessOwner(session) && !isInfluencer(session)) {
    return { success: false, status: 403, error: "You cannot message this campaign." };
  }

  try {
    const config = getOdooConfig();
    const uid = await authenticateServiceUser(config);
    const fields = await getMessageFields(uid, config);
    const influencerPartnerId = await getInfluencerPartnerId(
      uid,
      config,
      campaign.influencerId,
    );
    const direction =
      isAdmin(session) && input.direction
        ? input.direction
        : getMessageDirectionForRole(role);
    const senderPartnerId =
      isInfluencer(session) && influencerPartnerId
        ? influencerPartnerId
        : session.partnerId;

    if (!senderPartnerId) {
      return {
        success: false,
        status: 400,
        error:
          "Message creation requires your account or influencer profile to be linked to an Odoo partner.",
      };
    }

    const messageType =
      input.messageType === "invitation" || campaign.status === "pending"
        ? input.messageType || "invitation"
        : input.messageType || "reply";
    const receiverPartnerId =
      direction === "business_to_influencer"
        ? influencerPartnerId
        : direction === "influencer_to_business"
          ? campaign.partnerId
          : null;
    const values = buildMessageCreatePayload(
      {
        body,
        campaignId: campaign.id,
        direction,
        influencerId: campaign.influencerId,
        messageType,
        receiverPartnerId,
        senderPartnerId,
        subject,
      },
      fields,
    );
    const messageId = await executeKw<number>(
      uid,
      "influencer.message",
      "create",
      [values],
      {},
      config,
    );
    const messages = await executeKw<RawMessage[]>(
      uid,
      "influencer.message",
      "search_read",
      [[["id", "=", messageId]]],
      { fields: pickExistingFields(fields, readFields), limit: 1 },
      config,
    );

    return { success: true, data: normalizeMessage(messages[0]) };
  } catch (error) {
    return {
      success: false,
      status: 502,
      error:
        error instanceof Error
          ? error.message
          : "Could not create message in Odoo.",
    };
  }
}
