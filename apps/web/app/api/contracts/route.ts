import { NextResponse } from "next/server";
import { fetchCampaign } from "@/lib/campaigns";
import {
  createContractFromCampaign,
  fetchContract,
  fetchContracts,
  type ContractCreateInput,
} from "@/lib/contracts";
import {
  errorResponse,
  forbiddenResponse,
  odooErrorResponse,
  successResponse,
  unauthorizedResponse,
} from "@/lib/api-response";
import {
  canCreateContract,
  getSessionProfileId,
  isAdmin,
  isBusinessOwner,
  isInfluencer,
  requireSession,
} from "@/lib/permissions";
import { createContractCreatedNotification } from "@/lib/notifications";

type ContractPostBody = Partial<ContractCreateInput>;

function getString(value: unknown) {
  return typeof value === "string" ? value.trim() : "";
}

function getNumber(value: unknown) {
  if (typeof value === "number" && Number.isFinite(value)) return value;
  if (typeof value === "string" && value.trim() && Number.isFinite(Number(value))) {
    return Number(value);
  }
  return null;
}

function getInteger(value: unknown) {
  const number = getNumber(value);
  return number !== null && Number.isInteger(number) ? number : null;
}

function getContractDomain(session: Awaited<ReturnType<typeof requireSession>>) {
  if (isAdmin(session)) return [];

  if (isBusinessOwner(session)) {
    return session.partnerId
      ? [
          "|",
          ["business_partner_id", "=", session.partnerId],
          ["campaign_id.partner_id", "=", session.partnerId],
        ]
      : null;
  }

  if (isInfluencer(session)) {
    const profileId = getSessionProfileId(session);
    return profileId ? [["influencer_id", "=", profileId]] : null;
  }

  return null;
}

export async function GET() {
  const session = await requireSession().catch(() => null);

  if (!session) return unauthorizedResponse();

  const domain = getContractDomain(session);

  if (!domain) return successResponse([]);

  const result = await fetchContracts(domain);

  if (!result.success) {
    console.error("Contract list API failed:", result.error);
    return odooErrorResponse();
  }

  return successResponse(result.data);
}

export async function POST(request: Request) {
  let body: ContractPostBody;

  try {
    body = (await request.json()) as ContractPostBody;
  } catch {
    return errorResponse("Invalid JSON request body.", 400);
  }

  const session = await requireSession().catch(() => null);

  if (!session) return unauthorizedResponse();

  if (isInfluencer(session)) return forbiddenResponse();

  const campaignId = getInteger(body.campaignId);

  if (!campaignId) {
    return errorResponse("campaignId is required.", 400);
  }

  const campaignResult = await fetchCampaign(campaignId);

  if (!campaignResult.success) {
    return campaignResult.status === 502
      ? odooErrorResponse()
      : errorResponse("Campaign not found.", 404);
  }

  if (!canCreateContract(session, campaignResult.data)) {
    return forbiddenResponse();
  }

  const result = await createContractFromCampaign({
    campaign: campaignResult.data,
    input: {
      campaignId,
      contractValue: getNumber(body.contractValue),
      deliverables: getString(body.deliverables),
      endDate: getString(body.endDate),
      notes: getString(body.notes),
      startDate: getString(body.startDate),
      terms: getString(body.terms),
    },
  });

  if (!result.success) {
    return NextResponse.json(result, { status: result.status });
  }

  const contractResult = await fetchContract(result.data.id);
  if (contractResult.success) {
    await createContractCreatedNotification(contractResult.data).catch((error) =>
      console.error("Contract notification failed:", error),
    );
  }

  return NextResponse.json(result, { status: 201 });
}
