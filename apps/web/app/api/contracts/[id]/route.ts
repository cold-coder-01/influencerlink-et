import { NextResponse } from "next/server";
import {
  fetchContract,
  updateContract,
  type ContractStatus,
  type ContractType,
  type ContractUpdateInput,
} from "@/lib/contracts";
import {
  errorResponse,
  forbiddenResponse,
  odooErrorResponse,
  successResponse,
  unauthorizedResponse,
} from "@/lib/api-response";
import {
  canUpdateContract,
  canViewContract,
  isAdmin,
  requireSession,
} from "@/lib/permissions";

type ContractPatchBody = Partial<ContractUpdateInput>;

const statuses: ContractStatus[] = [
  "draft",
  "sent",
  "accepted",
  "rejected",
  "active",
  "completed",
  "cancelled",
];
const types: ContractType[] = [
  "campaign_agreement",
  "content_promotion",
  "brand_ambassador",
  "affiliate",
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

async function getAuthorizedContract(contractId: number) {
  const session = await requireSession().catch(() => null);

  if (!session) return { response: unauthorizedResponse() };

  const result = await fetchContract(contractId);

  if (!result.success) {
    return {
      response:
        result.status === 502
          ? odooErrorResponse()
          : errorResponse("Contract not found.", 404),
    };
  }

  if (!canViewContract(session, result.data)) {
    return { response: forbiddenResponse() };
  }

  return { contract: result.data, session };
}

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const contractId = Number.parseInt(id, 10);

  if (!Number.isFinite(contractId)) {
    return errorResponse("Contract not found.", 404);
  }

  const authorized = await getAuthorizedContract(contractId);

  if (authorized.response) return authorized.response;

  return successResponse(authorized.contract);
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const contractId = Number.parseInt(id, 10);

  if (!Number.isFinite(contractId)) {
    return errorResponse("Contract not found.", 404);
  }

  let body: ContractPatchBody;

  try {
    body = (await request.json()) as ContractPatchBody;
  } catch {
    return errorResponse("Invalid JSON request body.", 400);
  }

  const authorized = await getAuthorizedContract(contractId);

  if (authorized.response) return authorized.response;

  if (!canUpdateContract(authorized.session, authorized.contract)) {
    return forbiddenResponse();
  }

  const input: ContractUpdateInput = {
    contractValue: getNumber(body.contractValue),
    deliverables: getString(body.deliverables),
    endDate: getString(body.endDate),
    notes: getString(body.notes),
    startDate: getString(body.startDate),
    terms: getString(body.terms),
  };

  if (isAdmin(authorized.session) && statuses.includes(body.contractStatus as ContractStatus)) {
    input.contractStatus = body.contractStatus;
  }

  if (types.includes(body.contractType as ContractType)) {
    input.contractType = body.contractType;
  }

  const result = await updateContract(contractId, input);

  if (!result.success) {
    return NextResponse.json(result, { status: result.status });
  }

  return successResponse(result.data);
}
