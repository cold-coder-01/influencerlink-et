import { fetchAnalytics } from "@/lib/analytics";
import {
  forbiddenResponse,
  odooErrorResponse,
  successResponse,
  unauthorizedResponse,
} from "@/lib/api-response";
import {
  canViewAnalytics,
  requireSession,
} from "@/lib/permissions";

export async function GET() {
  const session = await requireSession().catch(() => null);

  if (!session) {
    return unauthorizedResponse();
  }

  if (!canViewAnalytics(session)) {
    return forbiddenResponse();
  }

  const result = await fetchAnalytics();

  if (!result.success) {
    console.error("Analytics API failed:", result.error);
    return odooErrorResponse();
  }

  return successResponse(result.data);
}
