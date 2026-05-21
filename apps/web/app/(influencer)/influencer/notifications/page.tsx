import { NotificationsPageContent } from "@/components/notifications/NotificationsPageContent";
import {
  buildNotificationDomainForSession,
  fetchNotifications,
} from "@/lib/notifications";
import { requireSession } from "@/lib/permissions";

export const dynamic = "force-dynamic";

export default async function InfluencerNotificationsPage() {
  const session = await requireSession();
  const domain = buildNotificationDomainForSession(session);

  if (!domain) {
    return <NotificationsPageContent notifications={[]} />;
  }

  const result = await fetchNotifications(domain, { limit: 50 });

  return (
    <NotificationsPageContent
      error={result.success ? undefined : "Could not load notifications from Odoo."}
      notifications={result.success ? result.data : []}
    />
  );
}
