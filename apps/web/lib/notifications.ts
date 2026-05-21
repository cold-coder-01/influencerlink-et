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
import {
  getSessionProfileId,
  isAdmin,
  isBusinessOwner,
  isInfluencer,
  type PermissionSession,
} from "@/lib/permissions";
import { routes } from "@/lib/routes";
import type { Campaign } from "@/lib/campaigns";
import type { CampaignMessage } from "@/lib/messages";
import type { InfluencerContract } from "@/lib/contracts";
import type { InfluencerPayment } from "@/lib/payments";
import type {
  InfluencerSocialAccount,
  VerificationStatus,
} from "@/lib/social-accounts";

export type NotificationType =
  | "campaign_invitation"
  | "message_received"
  | "campaign_status"
  | "contract_created"
  | "contract_signed"
  | "payment_created"
  | "payment_deposited"
  | "social_verified"
  | "social_rejected"
  | "social_needs_review"
  | "system";

export type NotificationPriority = "low" | "normal" | "high";
export type NotificationRecipientRole =
  | "business_owner"
  | "influencer"
  | "admin"
  | "system";

export type AppNotification = {
  id: number;
  title: string;
  body?: string | null;
  notificationType: NotificationType;
  recipientPartnerId?: number | null;
  recipientPartnerName?: string | null;
  recipientInfluencerId?: number | null;
  recipientInfluencerName?: string | null;
  recipientRole?: string | null;
  campaignId?: number | null;
  campaignName?: string | null;
  messageId?: number | null;
  contractId?: number | null;
  contractName?: string | null;
  paymentId?: number | null;
  paymentName?: string | null;
  socialAccountId?: number | null;
  socialAccountName?: string | null;
  actionUrl?: string | null;
  isRead: boolean;
  readAt?: string | null;
  createdAt?: string | null;
  priority: NotificationPriority;
};

export type NotificationCreateInput = {
  title: string;
  body?: string | null;
  notificationType: NotificationType;
  recipientPartnerId?: number | null;
  recipientInfluencerId?: number | null;
  recipientRole?: NotificationRecipientRole | null;
  campaignId?: number | null;
  messageId?: number | null;
  contractId?: number | null;
  paymentId?: number | null;
  socialAccountId?: number | null;
  actionUrl?: string | null;
  priority?: NotificationPriority | null;
};

type RawNotification = {
  id: number;
  name?: string | false;
  body?: string | false;
  notification_type?: string | false;
  recipient_partner_id?: Many2OneValue;
  recipient_influencer_id?: Many2OneValue;
  recipient_role?: string | false;
  campaign_id?: Many2OneValue;
  campaign_name?: string | false;
  message_id?: Many2OneValue;
  contract_id?: Many2OneValue;
  contract_name?: string | false;
  payment_id?: Many2OneValue;
  payment_name?: string | false;
  social_account_id?: Many2OneValue;
  action_url?: string | false;
  is_read?: boolean;
  read_at?: string | false;
  created_at?: string | false;
  priority?: string | false;
};

type OdooFieldMap = Record<string, unknown>;

const MODEL = "influencer.notification";

const notificationTypes: NotificationType[] = [
  "campaign_invitation",
  "message_received",
  "campaign_status",
  "contract_created",
  "contract_signed",
  "payment_created",
  "payment_deposited",
  "social_verified",
  "social_rejected",
  "social_needs_review",
  "system",
];

const priorities: NotificationPriority[] = ["low", "normal", "high"];

const readFields = [
  "name",
  "body",
  "notification_type",
  "recipient_partner_id",
  "recipient_influencer_id",
  "recipient_role",
  "campaign_id",
  "campaign_name",
  "message_id",
  "contract_id",
  "contract_name",
  "payment_id",
  "payment_name",
  "social_account_id",
  "action_url",
  "is_read",
  "read_at",
  "created_at",
  "priority",
];

async function getFields(uid: number, config: OdooConfig) {
  return executeKw<OdooFieldMap>(
    uid,
    MODEL,
    "fields_get",
    [],
    { attributes: ["selection"] },
    config,
  );
}

function asNotificationType(value: unknown): NotificationType {
  return notificationTypes.includes(value as NotificationType)
    ? (value as NotificationType)
    : "system";
}

function asPriority(value: unknown): NotificationPriority {
  return priorities.includes(value as NotificationPriority)
    ? (value as NotificationPriority)
    : "normal";
}

function nowForOdoo() {
  return new Date().toISOString().replace("T", " ").slice(0, 19);
}

export function normalizeNotification(raw: RawNotification): AppNotification {
  return {
    id: raw.id,
    title: safeString(raw.name, `Notification ${raw.id}`),
    body: safeString(raw.body, "") || null,
    notificationType: asNotificationType(raw.notification_type),
    recipientPartnerId: getMany2OneId(raw.recipient_partner_id),
    recipientPartnerName: getMany2OneName(raw.recipient_partner_id),
    recipientInfluencerId: getMany2OneId(raw.recipient_influencer_id),
    recipientInfluencerName: getMany2OneName(raw.recipient_influencer_id),
    recipientRole: safeString(raw.recipient_role, "") || null,
    campaignId: getMany2OneId(raw.campaign_id),
    campaignName:
      getMany2OneName(raw.campaign_id) ||
      safeString(raw.campaign_name, "") ||
      null,
    messageId: getMany2OneId(raw.message_id),
    contractId: getMany2OneId(raw.contract_id),
    contractName:
      getMany2OneName(raw.contract_id) ||
      safeString(raw.contract_name, "") ||
      null,
    paymentId: getMany2OneId(raw.payment_id),
    paymentName:
      getMany2OneName(raw.payment_id) ||
      safeString(raw.payment_name, "") ||
      null,
    socialAccountId: getMany2OneId(raw.social_account_id),
    socialAccountName: getMany2OneName(raw.social_account_id),
    actionUrl: safeString(raw.action_url, "") || null,
    isRead: Boolean(raw.is_read),
    readAt: safeString(raw.read_at, "") || null,
    createdAt: safeString(raw.created_at, "") || null,
    priority: asPriority(raw.priority),
  };
}

export function normalizeNotifications(raw: RawNotification[]) {
  return raw.map(normalizeNotification);
}

export function getNotificationTypeLabel(type: NotificationType) {
  const labels: Record<NotificationType, string> = {
    campaign_invitation: "Campaign Invitation",
    campaign_status: "Campaign Status",
    contract_created: "Contract Created",
    contract_signed: "Contract Signed",
    message_received: "Message Received",
    payment_created: "Payment Created",
    payment_deposited: "Payment Deposited",
    social_needs_review: "Needs Review",
    social_rejected: "Social Rejected",
    social_verified: "Social Verified",
    system: "System",
  };

  return labels[type];
}

export function getNotificationTypeTone(type: NotificationType) {
  if (type === "social_verified" || type === "contract_signed") return "green" as const;
  if (type === "social_rejected") return "red" as const;
  if (type === "message_received" || type === "payment_deposited") return "blue" as const;
  if (type === "system") return "gray" as const;
  return "gold" as const;
}

export function getNotificationPriorityLabel(priority: NotificationPriority) {
  const labels: Record<NotificationPriority, string> = {
    high: "High",
    low: "Low",
    normal: "Normal",
  };

  return labels[priority];
}

export function getNotificationIconName(type: NotificationType) {
  const icons: Record<NotificationType, string> = {
    campaign_invitation: "mail-plus",
    campaign_status: "activity",
    contract_created: "file-plus",
    contract_signed: "file-check",
    message_received: "message-circle",
    payment_created: "wallet",
    payment_deposited: "circle-dollar-sign",
    social_needs_review: "badge-help",
    social_rejected: "badge-x",
    social_verified: "badge-check",
    system: "bell",
  };

  return icons[type];
}

export function getNotificationActionUrl(notification: AppNotification) {
  if (notification.actionUrl) return notification.actionUrl;
  if (notification.campaignId) return routes.campaignDetail(notification.campaignId);
  if (notification.contractId) return routes.contractDetail(notification.contractId);
  if (notification.paymentId) return routes.paymentDetail(notification.paymentId);
  if (notification.socialAccountId) return routes.influencerSocialAccounts();
  return null;
}

export function buildNotificationCreatePayload(
  input: NotificationCreateInput,
  existingFields: OdooFieldMap,
) {
  const payload: Record<string, unknown> = {};

  if (hasField(existingFields, "name")) payload.name = input.title;
  if (hasField(existingFields, "body")) payload.body = input.body || "";
  if (hasField(existingFields, "notification_type")) {
    payload.notification_type = input.notificationType;
  }
  if (hasField(existingFields, "recipient_partner_id")) {
    payload.recipient_partner_id = input.recipientPartnerId || false;
  }
  if (hasField(existingFields, "recipient_influencer_id")) {
    payload.recipient_influencer_id = input.recipientInfluencerId || false;
  }
  if (hasField(existingFields, "recipient_role")) {
    payload.recipient_role = input.recipientRole || false;
  }
  if (hasField(existingFields, "campaign_id")) {
    payload.campaign_id = input.campaignId || false;
  }
  if (hasField(existingFields, "message_id")) {
    payload.message_id = input.messageId || false;
  }
  if (hasField(existingFields, "contract_id")) {
    payload.contract_id = input.contractId || false;
  }
  if (hasField(existingFields, "payment_id")) {
    payload.payment_id = input.paymentId || false;
  }
  if (hasField(existingFields, "social_account_id")) {
    payload.social_account_id = input.socialAccountId || false;
  }
  if (hasField(existingFields, "action_url")) {
    payload.action_url = input.actionUrl || "";
  }
  if (hasField(existingFields, "priority")) {
    payload.priority = input.priority || "normal";
  }

  return payload;
}

export function buildNotificationDomainForSession(
  session: PermissionSession,
  unreadOnly = false,
) {
  const domain: unknown[] = [];

  if (isAdmin(session)) {
    domain.push("|", ["recipient_role", "=", "admin"], ["recipient_role", "=", "system"]);
  } else if (isBusinessOwner(session)) {
    if (!session.partnerId) return null;
    domain.push(["recipient_partner_id", "=", session.partnerId]);
  } else if (isInfluencer(session)) {
    const profileId = getSessionProfileId(session);
    if (!profileId) return null;
    domain.push(["recipient_influencer_id", "=", profileId]);
  } else {
    return null;
  }

  if (unreadOnly) domain.push(["is_read", "=", false]);

  return domain;
}

export function countUnreadNotifications(notifications: AppNotification[]) {
  return notifications.filter((notification) => !notification.isRead).length;
}

export async function fetchNotifications(
  domain: unknown[] = [],
  options: { limit?: number | null } = {},
) {
  try {
    const config = getOdooConfig();
    const uid = await authenticateServiceUser(config);
    const fields = await getFields(uid, config);
    const notifications = await executeKw<RawNotification[]>(
      uid,
      MODEL,
      "search_read",
      [domain],
      {
        fields: pickExistingFields(fields, readFields),
        limit: options.limit || undefined,
        order: pickExistingOrder(fields, "is_read asc, created_at desc, id desc"),
      },
      config,
    );

    return { success: true as const, data: normalizeNotifications(notifications) };
  } catch (error) {
    return {
      success: false as const,
      data: [],
      error:
        error instanceof Error
          ? error.message
          : "Could not load notifications from Odoo.",
    };
  }
}

export async function fetchNotification(id: number) {
  const result = await fetchNotifications([["id", "=", id]], { limit: 1 });

  if (!result.success) return { ...result, data: null };

  return result.data[0]
    ? { success: true as const, data: result.data[0] }
    : { success: false as const, status: 404 as const, data: null, error: "Resource not found" };
}

export async function createNotification(input: NotificationCreateInput) {
  try {
    if (!input.title.trim()) {
      return { success: false as const, status: 400 as const, error: "Title is required." };
    }

    const config = getOdooConfig();
    const uid = await authenticateServiceUser(config);
    const fields = await getFields(uid, config);
    const values = buildNotificationCreatePayload(input, fields);
    const id = await executeKw<number>(uid, MODEL, "create", [values], {}, config);

    return fetchNotification(id);
  } catch (error) {
    return {
      success: false as const,
      status: 502 as const,
      data: null,
      error:
        error instanceof Error
          ? error.message
          : "Could not create notification in Odoo.",
    };
  }
}

export async function markNotificationRead(id: number) {
  try {
    const config = getOdooConfig();
    const uid = await authenticateServiceUser(config);
    const fields = await getFields(uid, config);
    const values: Record<string, unknown> = {};

    if (hasField(fields, "is_read")) values.is_read = true;
    if (hasField(fields, "read_at")) values.read_at = nowForOdoo();

    await executeKw<boolean>(uid, MODEL, "write", [[id], values], {}, config);

    return fetchNotification(id);
  } catch (error) {
    return {
      success: false as const,
      status: 502 as const,
      data: null,
      error:
        error instanceof Error
          ? error.message
          : "Could not mark notification read in Odoo.",
    };
  }
}

export async function markNotificationDomainRead(domain: unknown[]) {
  try {
    const config = getOdooConfig();
    const uid = await authenticateServiceUser(config);
    const ids = await executeKw<number[]>(uid, MODEL, "search", [domain], {}, config);

    if (!ids.length) return { success: true as const, data: { count: 0 } };

    const fields = await getFields(uid, config);
    const values: Record<string, unknown> = {};

    if (hasField(fields, "is_read")) values.is_read = true;
    if (hasField(fields, "read_at")) values.read_at = nowForOdoo();

    await executeKw<boolean>(uid, MODEL, "write", [ids, values], {}, config);

    return { success: true as const, data: { count: ids.length } };
  } catch (error) {
    return {
      success: false as const,
      status: 502 as const,
      error:
        error instanceof Error
          ? error.message
          : "Could not mark notifications read in Odoo.",
    };
  }
}

export async function createCampaignInvitationNotification(campaign: Campaign) {
  if (!campaign.influencerId) return null;

  return createNotification({
    actionUrl: routes.influencerCampaigns(),
    body: `You have received a campaign invitation for ${campaign.name}.`,
    campaignId: campaign.id,
    notificationType: "campaign_invitation",
    priority: "high",
    recipientInfluencerId: campaign.influencerId,
    recipientRole: "influencer",
    title: "New Campaign Invitation",
  });
}

export async function createMessageReceivedNotification(
  message: CampaignMessage,
  campaign: Campaign,
) {
  if (message.direction === "business_to_influencer" && campaign.influencerId) {
    return createNotification({
      actionUrl: routes.influencerCampaigns(),
      body: `New message on ${campaign.name}.`,
      campaignId: campaign.id,
      messageId: message.id,
      notificationType: "message_received",
      recipientInfluencerId: campaign.influencerId,
      recipientRole: "influencer",
      title: "New Message Received",
    });
  }

  if (message.direction === "influencer_to_business" && campaign.partnerId) {
    return createNotification({
      actionUrl: routes.campaignDetail(campaign.id),
      body: `New message on ${campaign.name}.`,
      campaignId: campaign.id,
      messageId: message.id,
      notificationType: "message_received",
      recipientPartnerId: campaign.partnerId,
      recipientRole: "business_owner",
      title: "New Message Received",
    });
  }

  return null;
}

export async function createCampaignStatusNotification(
  campaign: Campaign,
  targetRole: "business_owner" | "influencer",
) {
  if (targetRole === "business_owner" && !campaign.partnerId) return null;
  if (targetRole === "influencer" && !campaign.influencerId) return null;

  return createNotification({
    actionUrl:
      targetRole === "influencer"
        ? routes.influencerCampaigns()
        : routes.campaignDetail(campaign.id),
    body: `${campaign.name} is now ${campaign.status}.`,
    campaignId: campaign.id,
    notificationType: "campaign_status",
    recipientInfluencerId: targetRole === "influencer" ? campaign.influencerId : null,
    recipientPartnerId: targetRole === "business_owner" ? campaign.partnerId : null,
    recipientRole: targetRole,
    title: "Campaign Status Updated",
  });
}

export async function createContractCreatedNotification(contract: InfluencerContract) {
  if (!contract.influencerId) return null;

  return createNotification({
    actionUrl: routes.influencerContracts(),
    body: `A contract was created for ${contract.campaignName || contract.name}.`,
    campaignId: contract.campaignId,
    contractId: contract.id,
    notificationType: "contract_created",
    priority: "high",
    recipientInfluencerId: contract.influencerId,
    recipientRole: "influencer",
    title: "Contract Created",
  });
}

export async function createContractSignedNotification(
  contract: InfluencerContract,
  signerRole: "business_owner" | "influencer",
) {
  const targetRole = signerRole === "business_owner" ? "influencer" : "business_owner";
  if (targetRole === "business_owner" && !contract.businessPartnerId) return null;
  if (targetRole === "influencer" && !contract.influencerId) return null;

  return createNotification({
    actionUrl:
      targetRole === "influencer"
        ? routes.influencerContracts()
        : routes.contractDetail(contract.id),
    body: `${contract.name} was signed by ${signerRole === "business_owner" ? "the business" : "the influencer"}.`,
    campaignId: contract.campaignId,
    contractId: contract.id,
    notificationType: "contract_signed",
    recipientInfluencerId: targetRole === "influencer" ? contract.influencerId : null,
    recipientPartnerId: targetRole === "business_owner" ? contract.businessPartnerId : null,
    recipientRole: targetRole,
    title: "Contract Signed",
  });
}

export async function createPaymentCreatedNotification(payment: InfluencerPayment) {
  if (!payment.influencerId) return null;

  return createNotification({
    actionUrl: routes.influencerEarnings(),
    body: `A payment was requested for ${payment.contractName || payment.name}.`,
    campaignId: payment.campaignId,
    contractId: payment.contractId,
    notificationType: "payment_created",
    paymentId: payment.id,
    priority: "high",
    recipientInfluencerId: payment.influencerId,
    recipientRole: "influencer",
    title: "Payment Requested",
  });
}

export async function createPaymentDepositedNotification(payment: InfluencerPayment) {
  if (!payment.influencerId) return null;

  return createNotification({
    actionUrl: routes.influencerEarnings(),
    body: `${payment.name} was marked deposited to escrow.`,
    campaignId: payment.campaignId,
    contractId: payment.contractId,
    notificationType: "payment_deposited",
    paymentId: payment.id,
    priority: "high",
    recipientInfluencerId: payment.influencerId,
    recipientRole: "influencer",
    title: "Payment Deposited",
  });
}

export async function createSocialVerificationNotification(
  socialAccount: InfluencerSocialAccount,
  status: Extract<VerificationStatus, "verified" | "rejected" | "needs_review">,
) {
  const typeByStatus = {
    needs_review: "social_needs_review",
    rejected: "social_rejected",
    verified: "social_verified",
  } as const;
  const titleByStatus = {
    needs_review: "Social Account Needs Review",
    rejected: "Social Account Rejected",
    verified: "Social Account Verified",
  };

  return createNotification({
    actionUrl: routes.influencerSocialAccounts(),
    body: `${socialAccount.handle} was marked ${status.replace("_", " ")}.`,
    notificationType: typeByStatus[status],
    priority: status === "verified" ? "normal" : "high",
    recipientInfluencerId: socialAccount.influencerId,
    recipientRole: "influencer",
    socialAccountId: socialAccount.id,
    title: titleByStatus[status],
  });
}
