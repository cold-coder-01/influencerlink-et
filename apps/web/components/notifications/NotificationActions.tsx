"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/Button";

export function MarkNotificationReadButton({
  notificationId,
  isRead,
}: {
  notificationId: number;
  isRead: boolean;
}) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  async function markRead() {
    setLoading(true);
    try {
      const response = await fetch(`/api/notifications/${notificationId}/read`, {
        method: "PATCH",
      });

      if (response.ok) router.refresh();
    } finally {
      setLoading(false);
    }
  }

  return (
    <Button
      disabled={isRead || loading}
      onClick={() => void markRead()}
      size="sm"
      type="button"
      variant="secondary"
    >
      {isRead ? "Read" : loading ? "Saving..." : "Mark Read"}
    </Button>
  );
}

export function MarkAllNotificationsReadButton() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  async function markAllRead() {
    setLoading(true);
    try {
      const response = await fetch("/api/notifications/read-all", {
        method: "PATCH",
      });

      if (response.ok) router.refresh();
    } finally {
      setLoading(false);
    }
  }

  return (
    <Button
      disabled={loading}
      onClick={() => void markAllRead()}
      type="button"
      variant="secondary"
    >
      {loading ? "Saving..." : "Mark All Read"}
    </Button>
  );
}
