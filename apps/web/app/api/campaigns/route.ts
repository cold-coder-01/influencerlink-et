import { NextResponse } from "next/server";
import {
  createCampaign,
  fetchCampaigns,
  type CampaignInput,
} from "@/lib/campaigns";
import {
  errorResponse,
  forbiddenResponse,
  odooErrorResponse,
  successResponse,
  unauthorizedResponse,
} from "@/lib/api-response";
import {
  canCreateCampaign,
  getCampaignOwnershipDomain,
  requireSession,
} from "@/lib/permissions";

type CampaignPostBody = Partial<CampaignInput>;

function getString(value: unknown) {
  return typeof value === "string" ? value.trim() : "";
}

function getNumber(value: unknown) {
  if (typeof value === "number" && Number.isInteger(value)) {
    return value;
  }

  if (typeof value === "string" && /^\d+$/.test(value)) {
    return Number(value);
  }

  return null;
}

function getFiniteNumber(value: unknown) {
  if (typeof value === "number" && Number.isFinite(value)) {
    return value;
  }

  if (typeof value === "string" && value.trim() && Number.isFinite(Number(value))) {
    return Number(value);
  }

  return null;
}

export async function GET() {
  const session = await requireSession().catch(() => null);

  if (!session) {
    return unauthorizedResponse();
  }

  const domain = getCampaignOwnershipDomain(session);

  if (!domain) {
    return successResponse([]);
  }

  const result = await fetchCampaigns(domain);

  if (!result.success) {
    console.error("Campaign list API failed:", result.error);
    return odooErrorResponse();
  }

  return successResponse(result.data);
}

export async function POST(request: Request) {
  let body: CampaignPostBody;

  try {
    body = (await request.json()) as CampaignPostBody;
  } catch {
    return errorResponse("Invalid JSON request body.", 400);
  }

  const session = await requireSession().catch(() => null);

  if (!session) {
    return unauthorizedResponse();
  }

  if (!canCreateCampaign(session)) {
    return forbiddenResponse();
  }

  const input: CampaignInput = {
    title: getString(body.title),
    businessName: getString(body.businessName),
    campaignGoal: getString(body.campaignGoal) || "Brand Awareness",
    platform: getString(body.platform) || "Multi-platform",
    industryId: getNumber(body.industryId),
    influencerId: getNumber(body.influencerId),
    budgetRange: getString(body.budgetRange),
    locationFocus: getString(body.locationFocus),
    startDate: getString(body.startDate),
    endDate: getString(body.endDate),
    description: getString(body.description),
    status: body.status === "pending" ? "pending" : "draft",
    roiMultiplier: getFiniteNumber(body.roiMultiplier),
  };

  const result = await createCampaign({
    input,
    userId: session.uid,
    partnerId: session.partnerId,
  });

  if (!result.success) {
    if (result.status === 502) {
      console.error("Campaign create API failed:", result.error);
      return odooErrorResponse();
    }

    return NextResponse.json(result, { status: result.status });
  }

  return NextResponse.json(result, { status: 201 });
}
