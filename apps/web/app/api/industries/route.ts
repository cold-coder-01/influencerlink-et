import { NextResponse } from "next/server";
import { fetchIndustriesOverview } from "@/lib/industries";
import {
  AUTHENTICATION_ERROR,
  ODOO_ERROR,
  requireSession,
} from "@/lib/permissions";

export async function GET() {
  const session = await requireSession().catch(() => null);

  if (!session) {
    return NextResponse.json(
      { success: false, error: AUTHENTICATION_ERROR },
      { status: 401 },
    );
  }

  const result = await fetchIndustriesOverview();

  if (!result.success) {
    console.error("Industries API failed:", result.error);
    return NextResponse.json(
      { success: false, error: ODOO_ERROR },
      { status: 502 },
    );
  }

  return NextResponse.json(result);
}
