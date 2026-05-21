import { NextResponse } from "next/server";
import {
  buildNotificationDomainForSession,
  createNotification,
  fetchNotifications,
  type NotificationCreateInput,
  type NotificationPriority,
  type NotificationRecipientRole,
  type NotificationType,
} from "@/lib/notifications";
import {
  errorResponse,
  forbiddenResponse,
  odooErrorResponse,
  successResponse,
  unauthorizedResponse,
} from "@/lib/api-response";
import { canCreateSystemNotification, requireSession } from "@/lib/permissions";

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
const roles: NotificationRecipientRole[] = [
  "business_owner",
  "influencer",
  "admin",
  "system",
];

function getString(value: unknown) {
  return typeof value === "string" ? value.trim() : "";
}

function getNumber(value: unknown) {
  if (typeof value === "number" && Number.isInteger(value)) return value;
  if (typeof value === "string" && /^\d+$/.test(value)) return Number(value);
  return null;
}

function getLimit(value: string | null) {
  const limit = getNumber(value);
  if (!limit) return 20;
  return Math.min(Math.max(limit, 1), 100);
}

export async function GET(request: Request) {
  const session = await requireSession().catch(() => null);

  if (!session) return unauthorizedResponse();

  const url = new URL(request.url);
  const unreadOnly = url.searchParams.get("unreadOnly") === "true";
  const limit = getLimit(url.searchParams.get("limit"));
  const domain = buildNotificationDomainForSession(session, unreadOnly);

  if (!domain) return successResponse([]);

  const result = await fetchNotifications(domain, { limit });

  if (!result.success) {
    console.error("Notifications API failed:", result.error);
    return odooErrorResponse();
  }

  return successResponse(result.data);
}

export async function POST(request: Request) {
  const session = await requireSession().catch(() => null);

  if (!session) return unauthorizedResponse();
  if (!canCreateSystemNotification(session)) return forbiddenResponse();

  let body: Record<string, unknown>;

  try {
    body = (await request.json()) as Record<string, unknown>;
  } catch {
    return errorResponse("Invalid JSON request body.", 400);
  }

  const notificationType = notificationTypes.includes(body.notificationType as NotificationType)
    ? (body.notificationType as NotificationType)
    : "system";
  const priority = priorities.includes(body.priority as NotificationPriority)
    ? (body.priority as NotificationPriority)
    : "normal";
  const recipientRole = roles.includes(body.recipientRole as NotificationRecipientRole)
    ? (body.recipientRole as NotificationRecipientRole)
    : "system";
  const input: NotificationCreateInput = {
    actionUrl: getString(body.actionUrl) || null,
    body: getString(body.body) || null,
    campaignId: getNumber(body.campaignId),
    contractId: getNumber(body.contractId),
    messageId: getNumber(body.messageId),
    notificationType,
    paymentId: getNumber(body.paymentId),
    priority,
    recipientInfluencerId: getNumber(body.recipientInfluencerId),
    recipientPartnerId: getNumber(body.recipientPartnerId),
    recipientRole,
    socialAccountId: getNumber(body.socialAccountId),
    title: getString(body.title),
  };

  if (!input.title) return errorResponse("Title is required.", 400);

  const result = await createNotification(input);

  if (!result.success || !result.data) {
    return odooErrorResponse();
  }

  return NextResponse.json({ success: true, data: result.data }, { status: 201 });
}
