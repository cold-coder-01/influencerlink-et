import { NextResponse } from "next/server";
import { fetchCampaign } from "@/lib/campaigns";
import {
  AUTHENTICATION_ERROR,
  NOT_FOUND_ERROR,
  ODOO_ERROR,
  PERMISSION_ERROR,
  canViewCampaign,
  requireSession,
} from "@/lib/permissions";

export async function GET(
  _request: Request,
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

  const session = await requireSession().catch(() => null);

  if (!session) {
    return NextResponse.json(
      { success: false, error: AUTHENTICATION_ERROR },
      { status: 401 },
    );
  }

  const result = await fetchCampaign(campaignId);

  if (!result.success) {
    if (result.status === 502) {
      console.error("Campaign detail API failed:", result.error);
      return NextResponse.json(
        { success: false, error: ODOO_ERROR },
        { status: 502 },
      );
    }

    return NextResponse.json(
      { success: false, error: NOT_FOUND_ERROR },
      { status: result.status },
    );
  }

  if (!canViewCampaign(session, result.data)) {
    return NextResponse.json(
      { success: false, error: PERMISSION_ERROR },
      { status: 403 },
    );
  }

  return NextResponse.json(result);
}
