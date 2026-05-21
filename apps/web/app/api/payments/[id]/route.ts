import { NextResponse } from "next/server";
import {
  fetchPayment,
  updatePayment,
  type PaymentMethod,
  type PaymentUpdateInput,
} from "@/lib/payments";
import {
  errorResponse,
  forbiddenResponse,
  odooErrorResponse,
  successResponse,
  unauthorizedResponse,
} from "@/lib/api-response";
import {
  canUpdatePayment,
  canViewPayment,
  requireSession,
} from "@/lib/permissions";

type PaymentPatchBody = Partial<PaymentUpdateInput>;

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

async function getAuthorizedPayment(paymentId: number) {
  const session = await requireSession().catch(() => null);

  if (!session) return { response: unauthorizedResponse() };

  const result = await fetchPayment(paymentId);

  if (!result.success) {
    return {
      response:
        result.status === 502
          ? odooErrorResponse()
          : errorResponse("Payment not found.", 404),
    };
  }

  if (!canViewPayment(session, result.data)) {
    return { response: forbiddenResponse() };
  }

  return { payment: result.data, session };
}

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const paymentId = Number.parseInt(id, 10);

  if (!Number.isFinite(paymentId)) {
    return errorResponse("Payment not found.", 404);
  }

  const authorized = await getAuthorizedPayment(paymentId);

  if (authorized.response) return authorized.response;

  return successResponse(authorized.payment);
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const paymentId = Number.parseInt(id, 10);

  if (!Number.isFinite(paymentId)) {
    return errorResponse("Payment not found.", 404);
  }

  let body: PaymentPatchBody;

  try {
    body = (await request.json()) as PaymentPatchBody;
  } catch {
    return errorResponse("Invalid JSON request body.", 400);
  }

  const authorized = await getAuthorizedPayment(paymentId);

  if (authorized.response) return authorized.response;
  if (!canUpdatePayment(authorized.session, authorized.payment)) {
    return forbiddenResponse();
  }

  const amount = getNumber(body.amount);
  const platformFee = getNumber(body.platformFee);

  if (amount !== null && amount <= 0) {
    return errorResponse("amount must be positive.", 400);
  }
  if (platformFee !== null && platformFee < 0) {
    return errorResponse("platformFee cannot be negative.", 400);
  }
  if (amount !== null && platformFee !== null && platformFee > amount) {
    return errorResponse("platformFee cannot exceed amount.", 400);
  }

  const input: PaymentUpdateInput = {
    dueDate: getString(body.dueDate),
    notes: getString(body.notes),
    transactionReference: getString(body.transactionReference),
  };

  if (amount !== null) input.amount = amount;
  if (platformFee !== null) input.platformFee = platformFee;

  if (paymentMethods.includes(body.paymentMethod as PaymentMethod)) {
    input.paymentMethod = body.paymentMethod;
  }

  const result = await updatePayment(paymentId, input);

  if (!result.success) {
    return NextResponse.json(result, { status: result.status });
  }

  return successResponse(result.data);
}
