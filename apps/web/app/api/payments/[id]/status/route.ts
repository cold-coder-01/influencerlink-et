import { NextResponse } from "next/server";
import {
  fetchPayment,
  updatePaymentStatus,
  type PaymentStatus,
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
  isAdmin,
  requireSession,
} from "@/lib/permissions";
import { createPaymentDepositedNotification } from "@/lib/notifications";

type PaymentStatusPatchBody = {
  status?: string;
  transactionReference?: string;
};

const statuses: PaymentStatus[] = [
  "draft",
  "requested",
  "deposited",
  "released",
  "failed",
  "refunded",
  "cancelled",
];

const allowedTransitions: Partial<Record<PaymentStatus, PaymentStatus[]>> = {
  deposited: ["released", "refunded", "failed"],
  draft: ["requested", "failed"],
  requested: ["deposited", "cancelled", "failed"],
};

function getString(value: unknown) {
  return typeof value === "string" ? value.trim() : "";
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

  let body: PaymentStatusPatchBody;

  try {
    body = (await request.json()) as PaymentStatusPatchBody;
  } catch {
    return errorResponse("Invalid JSON request body.", 400);
  }

  const requestedStatus = body.status as PaymentStatus;

  if (!statuses.includes(requestedStatus)) {
    return errorResponse("Invalid payment status.", 400);
  }

  const session = await requireSession().catch(() => null);

  if (!session) return unauthorizedResponse();

  const paymentResult = await fetchPayment(paymentId);

  if (!paymentResult.success) {
    return paymentResult.status === 502
      ? odooErrorResponse()
      : errorResponse("Payment not found.", 404);
  }

  if (!canViewPayment(session, paymentResult.data)) {
    return forbiddenResponse();
  }

  const currentStatus = paymentResult.data.paymentStatus;
  const isValidTransition =
    allowedTransitions[currentStatus]?.includes(requestedStatus) ?? false;

  if (!isValidTransition && !isAdmin(session)) {
    return errorResponse("Invalid payment status transition.", 400);
  }

  if (isAdmin(session)) {
    const adminAllowed =
      currentStatus === requestedStatus ||
      (allowedTransitions[currentStatus]?.includes(requestedStatus) ?? false) ||
      requestedStatus === "failed";

    if (!adminAllowed) {
      return errorResponse("Invalid payment status transition.", 400);
    }
  } else if (requestedStatus === "deposited" || requestedStatus === "cancelled") {
    if (!canUpdatePayment(session, paymentResult.data)) {
      return forbiddenResponse();
    }
  } else {
    return forbiddenResponse();
  }

  const result = await updatePaymentStatus(paymentId, {
    status: requestedStatus,
    transactionReference: getString(body.transactionReference) || undefined,
  });

  if (!result.success) {
    return NextResponse.json(result, { status: result.status });
  }

  if (requestedStatus === "deposited") {
    await createPaymentDepositedNotification(result.data).catch((error) =>
      console.error("Payment deposited notification failed:", error),
    );
  }

  return successResponse(result.data);
}
