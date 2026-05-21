import { NextResponse } from "next/server";
import { fetchCampaign, updateCampaignStatus } from "@/lib/campaigns";
import {
  canTransitionCampaign,
  normalizeCampaignStatus,
  type CampaignStatus,
} from "@/lib/campaign-lifecycle";
import {
  AUTHENTICATION_ERROR,
  NOT_FOUND_ERROR,
  ODOO_ERROR,
  PERMISSION_ERROR,
  canViewCampaign,
  getSessionRole,
  isAdmin,
  isBusinessOwner,
  isInfluencer,
  requireSession,
} from "@/lib/permissions";
import { createCampaignStatusNotification } from "@/lib/notifications";

type CampaignStatusPatchBody = {
  status?: unknown;
};

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const campaignId = Number.parseInt(id, 10);

  if (!Number.isFinite(campaignId)) {
    return NextResponse.json(
      { success: false, error: NOT_FOUND_ERROR },
      { status: 404 },
    );
  }

  let body: CampaignStatusPatchBody;

  try {
    body = (await request.json()) as CampaignStatusPatchBody;
  } catch {
    return NextResponse.json(
      { success: false, error: "Invalid JSON request body." },
      { status: 400 },
    );
  }

  if (typeof body.status !== "string") {
    return NextResponse.json(
      { success: false, error: "Campaign status is required." },
      { status: 400 },
    );
  }

  const nextStatus = normalizeCampaignStatus(body.status);

  if (nextStatus !== body.status.toLowerCase()) {
    return NextResponse.json(
      { success: false, error: "Invalid campaign status." },
      { status: 400 },
    );
  }

  const session = await requireSession().catch(() => null);

  if (!session) {
    return NextResponse.json(
      { success: false, error: AUTHENTICATION_ERROR },
      { status: 401 },
    );
  }

  const campaignResult = await fetchCampaign(campaignId);

  if (!campaignResult.success) {
    if (campaignResult.status === 502) {
      console.error("Campaign status API fetch failed:", campaignResult.error);
      return NextResponse.json(
        { success: false, error: ODOO_ERROR },
        { status: 502 },
      );
    }

    return NextResponse.json(
      { success: false, error: NOT_FOUND_ERROR },
      { status: 404 },
    );
  }

  if (!canViewCampaign(session, campaignResult.data)) {
    return NextResponse.json(
      { success: false, error: PERMISSION_ERROR },
      { status: 403 },
    );
  }

  const role = getSessionRole(session);

  if (!canTransitionCampaign(campaignResult.data.status, nextStatus, role)) {
    return NextResponse.json(
      { success: false, error: "Invalid campaign status transition." },
      { status: 400 },
    );
  }

  const updateResult = await updateCampaignStatus(
    campaignId,
    nextStatus as CampaignStatus,
  );

  if (!updateResult.success) {
    if (updateResult.status === 502) {
      return NextResponse.json(
        { success: false, error: ODOO_ERROR },
        { status: 502 },
      );
    }

    return NextResponse.json(
      { success: false, error: updateResult.error },
      { status: updateResult.status },
    );
  }

  const updatedCampaign = {
    ...campaignResult.data,
    status: updateResult.data.status,
  };

  if (isBusinessOwner(session)) {
    await createCampaignStatusNotification(updatedCampaign, "influencer").catch((error) =>
      console.error("Campaign status notification failed:", error),
    );
  } else if (isInfluencer(session)) {
    await createCampaignStatusNotification(updatedCampaign, "business_owner").catch((error) =>
      console.error("Campaign status notification failed:", error),
    );
  } else if (isAdmin(session)) {
    await Promise.all([
      createCampaignStatusNotification(updatedCampaign, "business_owner"),
      createCampaignStatusNotification(updatedCampaign, "influencer"),
    ]).catch((error) =>
      console.error("Campaign status notification failed:", error),
    );
  }

  return NextResponse.json(updateResult);
}
