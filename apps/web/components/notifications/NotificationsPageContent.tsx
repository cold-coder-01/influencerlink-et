import { ButtonLink } from "@/components/ui/Button";
import { EmptyState } from "@/components/ui/EmptyState";
import { ErrorState } from "@/components/ui/ErrorState";
import { GlassCard } from "@/components/ui/GlassCard";
import { KpiCard } from "@/components/ui/KpiCard";
import { PageHeader } from "@/components/ui/PageHeader";
import { SectionHeader } from "@/components/ui/SectionHeader";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { formatDate } from "@/lib/formatters";
import {
  getNotificationActionUrl,
  getNotificationPriorityLabel,
  getNotificationTypeLabel,
  getNotificationTypeTone,
  type AppNotification,
} from "@/lib/notifications";
import {
  MarkAllNotificationsReadButton,
  MarkNotificationReadButton,
} from "@/components/notifications/NotificationActions";

type NotificationsPageContentProps = {
  notifications: AppNotification[];
  error?: string;
};

export function NotificationsPageContent({
  notifications,
  error,
}: NotificationsPageContentProps) {
  if (error) {
    return (
      <ErrorState
        description={error}
        title="Notifications unavailable"
      />
    );
  }

  const unread = notifications.filter((notification) => !notification.isRead);
  const highPriority = notifications.filter(
    (notification) => notification.priority === "high",
  );

  return (
    <div className="space-y-5">
      <PageHeader
        actions={notifications.length ? <MarkAllNotificationsReadButton /> : null}
        eyebrow="IN-APP"
        subtitle="Stay updated on campaign activity, messages, contracts, payments, and account events."
        title="Notifications"
      />

      <section className="grid gap-4 sm:grid-cols-3">
        <KpiCard label="Total Notifications" value={String(notifications.length)} />
        <KpiCard label="Unread" value={String(unread.length)} />
        <KpiCard label="High Priority" tone="danger" value={String(highPriority.length)} />
      </section>

      <GlassCard className="p-5 sm:p-6">
        <SectionHeader
          subtitle="Notifications are stored in Odoo and scoped to your signed-in account."
          title="Recent Activity"
        />

        {notifications.length ? (
          <div className="mt-5 space-y-3">
            {notifications.map((notification) => {
              const actionUrl = getNotificationActionUrl(notification);

              return (
                <article
                  className={`rounded-2xl border p-4 ${
                    notification.isRead
                      ? "border-white/[0.16] bg-white/[0.10] lg:border-white/[0.08] lg:bg-black/20"
                      : "border-[#00D4FF]/35 bg-[#00D4FF]/12 lg:border-[#FFD700]/30 lg:bg-[#FFD700]/10"
                  }`}
                  key={notification.id}
                >
                  <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                    <div className="min-w-0">
                      <div className="flex flex-wrap gap-2">
                        <StatusBadge tone={getNotificationTypeTone(notification.notificationType)}>
                          {getNotificationTypeLabel(notification.notificationType)}
                        </StatusBadge>
                        <StatusBadge tone={notification.priority === "high" ? "red" : "gray"}>
                          {getNotificationPriorityLabel(notification.priority)}
                        </StatusBadge>
                        {!notification.isRead ? (
                          <StatusBadge tone="gold">Unread</StatusBadge>
                        ) : null}
                      </div>
                      <h2 className="mt-3 text-lg font-bold text-white lg:text-[#F5F2E9]">
                        {notification.title}
                      </h2>
                      {notification.body ? (
                        <p className="mt-2 text-sm leading-6 text-white/72 lg:text-[#B8B3A7]">
                          {notification.body}
                        </p>
                      ) : null}
                      <p className="mt-3 text-xs text-white/72 lg:text-[#B8B3A7]">
                        {formatDate(notification.createdAt, "Recently")}
                      </p>
                    </div>

                    <div className="flex shrink-0 flex-wrap gap-2">
                      {actionUrl ? (
                        <ButtonLink href={actionUrl} size="sm">
                          Open
                        </ButtonLink>
                      ) : null}
                      <MarkNotificationReadButton
                        isRead={notification.isRead}
                        notificationId={notification.id}
                      />
                    </div>
                  </div>
                </article>
              );
            })}
          </div>
        ) : (
          <div className="mt-5">
            <EmptyState
              description="Important campaign, message, contract, payment, and account review events will appear here."
              title="No notifications yet"
            />
          </div>
        )}
      </GlassCard>
    </div>
  );
}
