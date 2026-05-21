import { NextResponse } from "next/server";
import { fetchCampaign } from "@/lib/campaigns";
import {
  createCampaignMessage,
  fetchMessages,
  type MessageCreateInput,
} from "@/lib/messages";
import {
  errorResponse,
  forbiddenResponse,
  odooErrorResponse,
  successResponse,
  unauthorizedResponse,
} from "@/lib/api-response";
import {
  canViewCampaign,
  getSessionProfileId,
  isAdmin,
  isBusinessOwner,
  isInfluencer,
  requireSession,
} from "@/lib/permissions";
import {
  createCampaignInvitationNotification,
  createMessageReceivedNotification,
} from "@/lib/notifications";

type MessagePostBody = Partial<MessageCreateInput>;

function getString(value: unknown) {
  return typeof value === "string" ? value.trim() : "";
}

function getNumber(value: unknown) {
  if (typeof value === "number" && Number.isInteger(value)) return value;
  if (typeof value === "string" && /^\d+$/.test(value)) return Number(value);
  return null;
}

function getMessageDomain(session: Awaited<ReturnType<typeof requireSession>>) {
  if (isAdmin(session)) return [];

  if (isBusinessOwner(session)) {
    return session.partnerId
      ? [["campaign_id.partner_id", "=", session.partnerId] as const]
      : null;
  }

  if (isInfluencer(session)) {
    const profileId = getSessionProfileId(session);

    return profileId
      ? [
          "|",
          ["influencer_id", "=", profileId] as const,
          ["campaign_id.influencer_id", "=", profileId] as const,
        ]
      : null;
  }

  return null;
}

export async function GET() {
  const session = await requireSession().catch(() => null);

  if (!session) {
    return unauthorizedResponse();
  }

  const domain = getMessageDomain(session);

  if (!domain) {
    return successResponse([]);
  }

  const result = await fetchMessages(domain);

  if (!result.success) {
    console.error("Message list API failed:", result.error);
    return odooErrorResponse();
  }

  return successResponse(result.data);
}

export async function POST(request: Request) {
  let body: MessagePostBody;

  try {
    body = (await request.json()) as MessagePostBody;
  } catch {
    return errorResponse("Invalid JSON request body.", 400);
  }

  const session = await requireSession().catch(() => null);

  if (!session) {
    return unauthorizedResponse();
  }

  const campaignId = getNumber(body.campaignId);
  const messageBody = getString(body.body);

  if (!campaignId || !messageBody) {
    return errorResponse("campaignId and body are required.", 400);
  }

  const campaignResult = await fetchCampaign(campaignId);

  if (!campaignResult.success) {
    return campaignResult.status === 502
      ? odooErrorResponse()
      : errorResponse("Campaign not found.", 404);
  }

  if (!canViewCampaign(session, campaignResult.data)) {
    return forbiddenResponse();
  }

  const result = await createCampaignMessage({
    campaign: campaignResult.data,
    input: {
      body: messageBody,
      campaignId,
      messageType: body.messageType,
      subject: getString(body.subject) || "Campaign message",
    },
    session,
  });

  if (!result.success) {
    return NextResponse.json(result, { status: result.status });
  }

  if (result.data.messageType === "invitation") {
    await createCampaignInvitationNotification(campaignResult.data).catch((error) =>
      console.error("Campaign invitation notification failed:", error),
    );
  } else {
    await createMessageReceivedNotification(result.data, campaignResult.data).catch((error) =>
      console.error("Message notification failed:", error),
    );
  }

  return NextResponse.json(result, { status: 201 });
}
