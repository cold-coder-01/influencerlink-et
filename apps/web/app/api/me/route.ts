import { NextResponse } from "next/server";
import { getCurrentSession } from "@/lib/session";
import { AUTHENTICATION_ERROR } from "@/lib/permissions";

export async function GET() {
  const session = await getCurrentSession();

  if (!session) {
    return NextResponse.json(
      { success: false, error: AUTHENTICATION_ERROR },
      { status: 401 },
    );
  }

  return NextResponse.json({
    success: true,
    data: {
      role: session.normalizedRole,
      displayName: session.displayName,
      email: session.email,
      partnerId: session.partnerId ?? null,
      profileId: session.influencerProfileId,
      influencerProfileId: session.influencerProfileId,
      uid: session.uid,
    },
  });
}
