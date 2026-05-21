import { NextResponse } from "next/server";
import { fetchContract } from "@/lib/contracts";
import {
  createPaymentFromContract,
  fetchPayment,
  fetchPayments,
  type PaymentCreateInput,
  type PaymentMethod,
} from "@/lib/payments";
import {
  errorResponse,
  forbiddenResponse,
  odooErrorResponse,
  successResponse,
  unauthorizedResponse,
} from "@/lib/api-response";
import {
  canCreatePayment,
  getSessionProfileId,
  isAdmin,
  isBusinessOwner,
  isInfluencer,
  requireSession,
} from "@/lib/permissions";
import { createPaymentCreatedNotification } from "@/lib/notifications";

type PaymentPostBody = Partial<PaymentCreateInput>;

const paymentMethods: PaymentMethod[] = [
  "manual_bank",
  "telebirr",
  "cbe",
  "chapa",
  "cash",
  "other",
];

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

function getPaymentDomain(session: Awaited<ReturnType<typeof requireSession>>) {
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

  const domain = getPaymentDomain(session);

  if (!domain) return successResponse([]);

  const result = await fetchPayments(domain);

  if (!result.success) {
    console.error("Payment list API failed:", result.error);
    return odooErrorResponse();
  }

  return successResponse(result.data);
}

export async function POST(request: Request) {
  let body: PaymentPostBody;

  try {
    body = (await request.json()) as PaymentPostBody;
  } catch {
    return errorResponse("Invalid JSON request body.", 400);
  }

  const session = await requireSession().catch(() => null);

  if (!session) return unauthorizedResponse();
  if (isInfluencer(session)) return forbiddenResponse();

  const contractId = getInteger(body.contractId);
  const amount = getNumber(body.amount);
  const platformFee = getNumber(body.platformFee) ?? 0;
  const paymentMethod = paymentMethods.includes(body.paymentMethod as PaymentMethod)
    ? (body.paymentMethod as PaymentMethod)
    : "manual_bank";

  if (!contractId) return errorResponse("contractId is required.", 400);
  if (!amount || amount <= 0) return errorResponse("amount must be positive.", 400);
  if (platformFee < 0) {
    return errorResponse("platformFee cannot be negative.", 400);
  }
  if (platformFee > amount) {
    return errorResponse("platformFee cannot exceed amount.", 400);
  }

  const contractResult = await fetchContract(contractId);

  if (!contractResult.success) {
    return contractResult.status === 502
      ? odooErrorResponse()
      : errorResponse("Contract not found.", 404);
  }

  if (!canCreatePayment(session, contractResult.data)) {
    return forbiddenResponse();
  }

  const result = await createPaymentFromContract({
    contract: contractResult.data,
    input: {
      amount,
      contractId,
      dueDate: getString(body.dueDate) || null,
      notes: getString(body.notes),
      paymentMethod,
      platformFee,
    },
  });

  if (!result.success) {
    return NextResponse.json(result, { status: result.status });
  }

  const paymentResult = await fetchPayment(result.data.id);
  if (paymentResult.success) {
    await createPaymentCreatedNotification(paymentResult.data).catch((error) =>
      console.error("Payment notification failed:", error),
    );
  }

  return NextResponse.json(result, { status: 201 });
}
