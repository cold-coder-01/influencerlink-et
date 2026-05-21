import {
  buildNotificationDomainForSession,
  markNotificationDomainRead,
} from "@/lib/notifications";
import {
  odooErrorResponse,
  successResponse,
  unauthorizedResponse,
} from "@/lib/api-response";
import { requireSession } from "@/lib/permissions";

export async function PATCH() {
  const session = await requireSession().catch(() => null);

  if (!session) return unauthorizedResponse();

  const domain = buildNotificationDomainForSession(session, true);

  if (!domain) return successResponse({ count: 0 });

  const result = await markNotificationDomainRead(domain);

  if (!result.success) return odooErrorResponse();

  return successResponse(result.data);
}
