import { NextResponse } from "next/server";
import { getCurrentSession } from "@/lib/session";
import { AUTHENTICATION_ERROR, ODOO_ERROR } from "@/lib/permissions";
import {
  authenticateServiceUser,
  executeKw,
  getOdooConfig,
} from "@/lib/odoo-rpc";

const MAX_IMAGE_BYTES = 2 * 1024 * 1024;
const ALLOWED_IMAGE_TYPES = new Set(["image/jpeg", "image/png", "image/webp"]);

type OdooPartnerImage = {
  id: number;
  name?: string | false;
  email?: string | false;
  image_128?: string | false;
};

function imageDataUrl(value: string | false | undefined) {
  return typeof value === "string" && value.length > 0
    ? `data:image/png;base64,${value}`
    : null;
}

async function readOwnPartnerImage(partnerId: number) {
  const config = getOdooConfig();
  const uid = await authenticateServiceUser(config);
  const partners = await executeKw<OdooPartnerImage[]>(
    uid,
    "res.partner",
    "search_read",
    [[["id", "=", partnerId]]],
    { fields: ["name", "email", "image_128"], limit: 1 },
    config,
  );

  return { config, uid, partner: partners[0] ?? null };
}

export async function GET() {
  const session = await getCurrentSession();

  if (!session) {
    return NextResponse.json(
      { success: false, error: AUTHENTICATION_ERROR },
      { status: 401 },
    );
  }

  if (!session.partnerId) {
    return NextResponse.json(
      { success: false, error: "No partner profile is linked to this session." },
      { status: 400 },
    );
  }

  try {
    const { partner } = await readOwnPartnerImage(session.partnerId);

    if (!partner) {
      return NextResponse.json(
        { success: false, error: "Profile partner was not found." },
        { status: 404 },
      );
    }

    return NextResponse.json({
      success: true,
      data: {
        displayName: partner.name || session.displayName,
        email: partner.email || session.email,
        image: imageDataUrl(partner.image_128),
      },
    });
  } catch {
    return NextResponse.json(
      { success: false, error: ODOO_ERROR },
      { status: 502 },
    );
  }
}

export async function PATCH(request: Request) {
  const session = await getCurrentSession();

  if (!session) {
    return NextResponse.json(
      { success: false, error: AUTHENTICATION_ERROR },
      { status: 401 },
    );
  }

  if (!session.partnerId) {
    return NextResponse.json(
      { success: false, error: "No partner profile is linked to this session." },
      { status: 400 },
    );
  }

  const formData = await request.formData();
  const file = formData.get("image");

  if (!(file instanceof File)) {
    return NextResponse.json(
      { success: false, error: "A profile image file is required." },
      { status: 400 },
    );
  }

  if (!ALLOWED_IMAGE_TYPES.has(file.type)) {
    return NextResponse.json(
      { success: false, error: "Use a JPEG, PNG, or WebP image." },
      { status: 400 },
    );
  }

  if (file.size > MAX_IMAGE_BYTES) {
    return NextResponse.json(
      { success: false, error: "Profile image must be 2 MB or smaller." },
      { status: 400 },
    );
  }

  try {
    const { config, uid, partner } = await readOwnPartnerImage(session.partnerId);

    if (!partner) {
      return NextResponse.json(
        { success: false, error: "Profile partner was not found." },
        { status: 404 },
      );
    }

    const bytes = Buffer.from(await file.arrayBuffer());
    await executeKw<boolean>(
      uid,
      "res.partner",
      "write",
      [[session.partnerId], { image_1920: bytes.toString("base64") }],
      {},
      config,
    );

    const updated = await executeKw<OdooPartnerImage[]>(
      uid,
      "res.partner",
      "search_read",
      [[["id", "=", session.partnerId]]],
      { fields: ["name", "email", "image_128"], limit: 1 },
      config,
    );

    return NextResponse.json({
      success: true,
      data: {
        displayName: updated[0]?.name || session.displayName,
        email: updated[0]?.email || session.email,
        image: imageDataUrl(updated[0]?.image_128),
      },
    });
  } catch {
    return NextResponse.json(
      { success: false, error: ODOO_ERROR },
      { status: 502 },
    );
  }
}
