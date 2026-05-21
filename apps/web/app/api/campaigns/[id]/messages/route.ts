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
import { canViewCampaign, requireSession } from "@/lib/permissions";
import {
  createCampaignInvitationNotification,
  createMessageReceivedNotification,
} from "@/lib/notifications";

type MessagePostBody = Partial<Omit<MessageCreateInput, "campaignId">>;

function getString(value: unknown) {
  return typeof value === "string" ? value.trim() : "";
}

async function getAuthorizedCampaign(campaignId: number) {
  const session = await requireSession().catch(() => null);

  if (!session) {
    return { response: unauthorizedResponse() };
  }

  const campaignResult = await fetchCampaign(campaignId);

  if (!campaignResult.success) {
    return {
      response:
        campaignResult.status === 502
          ? odooErrorResponse()
          : errorResponse("Campaign not found.", 404),
    };
  }

  if (!canViewCampaign(session, campaignResult.data)) {
    return { response: forbiddenResponse() };
  }

  return { campaign: campaignResult.data, session };
}

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const campaignId = Number.parseInt(id, 10);

  if (!Number.isFinite(campaignId)) {
    return errorResponse("Campaign not found.", 404);
  }

  const authorized = await getAuthorizedCampaign(campaignId);

  if (authorized.response) return authorized.response;

  const result = await fetchMessages(
    [["campaign_id", "=", campaignId]],
    "created_at asc, id asc",
  );

  if (!result.success) {
    console.error("Campaign messages API failed:", result.error);
    return odooErrorResponse();
  }

  return successResponse(result.data);
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const campaignId = Number.parseInt(id, 10);

  if (!Number.isFinite(campaignId)) {
    return errorResponse("Campaign not found.", 404);
  }

  let body: MessagePostBody;

  try {
    body = (await request.json()) as MessagePostBody;
  } catch {
    return errorResponse("Invalid JSON request body.", 400);
  }

  const messageBody = getString(body.body);

  if (!messageBody) {
    return errorResponse("Message body is required.", 400);
  }

  const authorized = await getAuthorizedCampaign(campaignId);

  if (authorized.response) return authorized.response;

  const result = await createCampaignMessage({
    campaign: authorized.campaign,
    input: {
      body: messageBody,
      campaignId,
      messageType: body.messageType,
      subject: getString(body.subject) || "Campaign reply",
    },
    session: authorized.session,
  });

  if (!result.success) {
    return NextResponse.json(result, { status: result.status });
  }

  if (result.data.messageType === "invitation") {
    await createCampaignInvitationNotification(authorized.campaign).catch((error) =>
      console.error("Campaign invitation notification failed:", error),
    );
  } else {
    await createMessageReceivedNotification(result.data, authorized.campaign).catch((error) =>
      console.error("Message notification failed:", error),
    );
  }

  return NextResponse.json(result, { status: 201 });
}
