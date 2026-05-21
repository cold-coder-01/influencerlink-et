import {
  fetchNotification,
  markNotificationRead,
} from "@/lib/notifications";
import {
  forbiddenResponse,
  notFoundResponse,
  odooErrorResponse,
  successResponse,
  unauthorizedResponse,
} from "@/lib/api-response";
import { canMarkNotificationRead, requireSession } from "@/lib/permissions";

export async function PATCH(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const notificationId = Number.parseInt(id, 10);

  if (!Number.isFinite(notificationId)) return notFoundResponse("Resource not found");

  const session = await requireSession().catch(() => null);
  if (!session) return unauthorizedResponse();

  const notification = await fetchNotification(notificationId);
  if (!notification.success || !notification.data) {
    return notFoundResponse("Resource not found");
  }
  if (!canMarkNotificationRead(session, notification.data)) return forbiddenResponse();

  const result = await markNotificationRead(notificationId);
  if (!result.success || !result.data) return odooErrorResponse();

  return successResponse(result.data);
}
