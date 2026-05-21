"use client";

import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import { Button } from "@/components/ui/Button";
import {
  getAllowedCampaignTransitions,
  getCampaignPrimaryAction,
  normalizeCampaignStatus,
  type CampaignLifecycleRole,
  type CampaignStatus,
} from "@/lib/campaign-lifecycle";

type CampaignStatusActionsProps = {
  campaignId: number;
  role: CampaignLifecycleRole;
  status: string;
  compact?: boolean;
  onStatusChange?: (status: CampaignStatus) => void;
};

const actionLabels: Partial<Record<CampaignLifecycleRole, Partial<Record<CampaignStatus, string>>>> = {
  admin: {
    active: "Mark Active",
    cancelled: "Cancel Campaign",
    completed: "Mark Completed",
    draft: "Move to Draft",
    pending: "Send Invitation",
  },
  business_owner: {
    active: "Mark Active",
    cancelled: "Cancel Campaign",
    completed: "Mark Completed",
    pending: "Send Invitation",
  },
  influencer: {
    active: "Accept Campaign",
    cancelled: "Decline",
    completed: "Mark Completed",
  },
};

export function CampaignStatusActions({
  campaignId,
  compact = false,
  onStatusChange,
  role,
  status,
}: CampaignStatusActionsProps) {
  const router = useRouter();
  const [currentStatus, setCurrentStatus] = useState(normalizeCampaignStatus(status));
  const [pendingStatus, setPendingStatus] = useState<CampaignStatus | null>(null);
  const [error, setError] = useState("");
  const primaryAction = getCampaignPrimaryAction(currentStatus, role);
  const actions = useMemo(() => {
    const transitions = getAllowedCampaignTransitions(currentStatus, role);

    return transitions
      .map((nextStatus) => ({
        label:
          primaryAction?.status === nextStatus
            ? primaryAction.label
          : actionLabels[role]?.[nextStatus] ?? `Mark ${nextStatus}`,
        status: nextStatus,
      }))
      .sort((a, b) => {
        if (primaryAction?.status === a.status) return -1;
        if (primaryAction?.status === b.status) return 1;
        return a.label.localeCompare(b.label);
      });
  }, [currentStatus, primaryAction, role]);

  async function updateStatus(nextStatus: CampaignStatus) {
    setPendingStatus(nextStatus);
    setError("");

    try {
      const response = await fetch(`/api/campaigns/${campaignId}/status`, {
        body: JSON.stringify({ status: nextStatus }),
        headers: {
          "Content-Type": "application/json",
        },
        method: "PATCH",
      });
      const contentType = response.headers.get("content-type") ?? "";
      const payload = contentType.includes("application/json")
        ? ((await response.json()) as {
        success?: boolean;
        data?: { status?: CampaignStatus };
        error?: string;
          })
        : {
            success: false,
            error: `Campaign status endpoint returned HTTP ${response.status}.`,
          };

      if (!response.ok || !payload.success || !payload.data?.status) {
        setError(payload.error || "Could not update campaign status.");
        return;
      }

      setCurrentStatus(payload.data.status);
      onStatusChange?.(payload.data.status);
      router.refresh();
    } catch (requestError) {
      setError(
        requestError instanceof Error
          ? requestError.message
          : "Could not update campaign status.",
      );
    } finally {
      setPendingStatus(null);
    }
  }

  if (actions.length === 0) {
    return null;
  }

  return (
    <div className={compact ? "space-y-2" : "space-y-3"}>
      <div className="flex flex-wrap gap-2">
        {actions.map((action) => (
          <Button
            disabled={Boolean(pendingStatus)}
            key={action.status}
            onClick={() => void updateStatus(action.status)}
            size={compact ? "sm" : "md"}
            type="button"
            variant={action.status === "cancelled" ? "danger" : "primary"}
          >
            {pendingStatus === action.status ? "Updating..." : action.label}
          </Button>
        ))}
      </div>
      {error ? (
        <p className="text-sm font-semibold text-[#FF8B95]">{error}</p>
      ) : null}
    </div>
  );
}
