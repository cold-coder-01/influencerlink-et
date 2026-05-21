import {
  fetchSocialAccount,
  sanitizeSocialAccountForClient,
  verifySocialAccount,
  type VerificationStatus,
} from "@/lib/social-accounts";
import {
  errorResponse,
  forbiddenResponse,
  notFoundResponse,
  odooErrorResponse,
  successResponse,
  unauthorizedResponse,
} from "@/lib/api-response";
import { canVerifySocialAccount, requireSession } from "@/lib/permissions";
import { createSocialVerificationNotification } from "@/lib/notifications";

type ReviewStatus = Extract<
  VerificationStatus,
  "verified" | "rejected" | "needs_review" | "pending"
>;

const allowedStatuses: ReviewStatus[] = [
  "verified",
  "rejected",
  "needs_review",
  "pending",
];

function getString(value: unknown) {
  return typeof value === "string" ? value.trim() : "";
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const accountId = Number.parseInt(id, 10);

  if (!Number.isFinite(accountId)) return notFoundResponse("Resource not found");

  const session = await requireSession().catch(() => null);
  if (!session) return unauthorizedResponse();

  const current = await fetchSocialAccount(accountId);
  if (!current.success || !current.data) return notFoundResponse("Resource not found");
  if (!canVerifySocialAccount(session)) return forbiddenResponse();

  let body: Record<string, unknown>;

  try {
    body = (await request.json()) as Record<string, unknown>;
  } catch {
    return errorResponse("Invalid JSON request body.", 400);
  }

  const status = body.status;

  if (!allowedStatuses.includes(status as ReviewStatus)) {
    return errorResponse("Unsupported verification status.", 400);
  }

  try {
    const result = await verifySocialAccount(accountId, status as ReviewStatus, {
      notes: getString(body.notes) || null,
      rejectionReason: getString(body.rejectionReason) || null,
    });

    if (!result.success || !result.data) return odooErrorResponse();

    if (["verified", "rejected", "needs_review"].includes(status as string)) {
      await createSocialVerificationNotification(
        result.data,
        status as "verified" | "rejected" | "needs_review",
      ).catch((error) =>
        console.error("Social verification notification failed:", error),
      );
    }

    return successResponse(sanitizeSocialAccountForClient(result.data));
  } catch (error) {
    console.error("Social account verify API failed:", error);
    return odooErrorResponse();
  }
}
