import { NextResponse } from "next/server";
import { fetchContract, signContract } from "@/lib/contracts";
import {
  errorResponse,
  forbiddenResponse,
  odooErrorResponse,
  unauthorizedResponse,
} from "@/lib/api-response";
import {
  canSignContract,
  getSessionProfileId,
  isAdmin,
  isBusinessOwner,
  isInfluencer,
  requireSession,
} from "@/lib/permissions";
import { createContractSignedNotification } from "@/lib/notifications";

export async function PATCH(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const contractId = Number.parseInt(id, 10);

  if (!Number.isFinite(contractId)) {
    return errorResponse("Contract not found.", 404);
  }

  const session = await requireSession().catch(() => null);

  if (!session) return unauthorizedResponse();

  const contractResult = await fetchContract(contractId);

  if (!contractResult.success) {
    return contractResult.status === 502
      ? odooErrorResponse()
      : errorResponse("Contract not found.", 404);
  }

  if (!canSignContract(session, contractResult.data)) {
    return forbiddenResponse();
  }

  const signer =
    isBusinessOwner(session) ||
    (isAdmin(session) && contractResult.data.businessPartnerId)
      ? "business"
      : isInfluencer(session) && getSessionProfileId(session)
        ? "influencer"
        : null;

  if (!signer) {
    return forbiddenResponse();
  }

  const result = await signContract(contractResult.data, signer);

  if (!result.success) {
    return NextResponse.json(result, { status: result.status });
  }

  await createContractSignedNotification(
    result.data,
    signer === "business" ? "business_owner" : "influencer",
  ).catch((error) => console.error("Contract signed notification failed:", error));

  return NextResponse.json(result);
}
