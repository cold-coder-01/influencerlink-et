import { NextResponse } from "next/server";
import { fetchInfluencerDetail } from "@/lib/influencers";
import {
  AUTHENTICATION_ERROR,
  NOT_FOUND_ERROR,
  ODOO_ERROR,
  requireSession,
} from "@/lib/permissions";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const influencerId = Number.parseInt(id, 10);

  if (!Number.isFinite(influencerId)) {
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

  const result = await fetchInfluencerDetail(influencerId);

  if (!result.success) {
    if (result.status === 502) {
      console.error("Influencer detail API failed:", result.error);
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

  return NextResponse.json(result);
}
