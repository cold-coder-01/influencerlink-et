export const campaignStatuses = [
  "draft",
  "pending",
  "active",
  "completed",
  "cancelled",
] as const;

export type CampaignStatus = (typeof campaignStatuses)[number];
export type CampaignLifecycleRole = "business_owner" | "influencer" | "admin";
export type CampaignStatusTone = "gold" | "green" | "blue" | "red" | "gray";

type CampaignTransitionAction = {
  label: string;
  status: CampaignStatus;
};

const statusLabels: Record<CampaignStatus, string> = {
  active: "Active",
  cancelled: "Cancelled",
  completed: "Completed",
  draft: "Draft",
  pending: "Invitation Sent",
};

const statusDescriptions: Record<CampaignStatus, string> = {
  active: "The influencer has accepted the campaign and work is in progress.",
  cancelled: "The campaign was stopped before completion.",
  completed:
    "The campaign work is finished and ready for reporting or payment follow-up.",
  draft:
    "The campaign brief is being prepared and has not yet been sent to the influencer.",
  pending:
    "The campaign invitation has been sent and is waiting for the influencer's response.",
};

const statusTones: Record<CampaignStatus, CampaignStatusTone> = {
  active: "green",
  cancelled: "red",
  completed: "blue",
  draft: "gray",
  pending: "gold",
};

const businessOwnerTransitions: Record<CampaignStatus, CampaignStatus[]> = {
  active: ["completed", "cancelled"],
  cancelled: [],
  completed: [],
  draft: ["pending", "cancelled"],
  pending: ["active", "cancelled"],
};

const influencerTransitions: Record<CampaignStatus, CampaignStatus[]> = {
  active: ["completed"],
  cancelled: [],
  completed: [],
  draft: [],
  pending: ["active", "cancelled"],
};

const primaryActions: Record<
  CampaignLifecycleRole,
  Partial<Record<CampaignStatus, CampaignTransitionAction>>
> = {
  admin: {
    active: { label: "Mark Completed", status: "completed" },
    draft: { label: "Send Invitation", status: "pending" },
    pending: { label: "Mark Active", status: "active" },
  },
  business_owner: {
    active: { label: "Mark Completed", status: "completed" },
    draft: { label: "Send Invitation", status: "pending" },
    pending: { label: "Mark Active", status: "active" },
  },
  influencer: {
    active: { label: "Mark Completed", status: "completed" },
    pending: { label: "Accept Campaign", status: "active" },
  },
};

const timelineStatuses: CampaignStatus[] = [
  "draft",
  "pending",
  "active",
  "completed",
];

export function normalizeCampaignStatus(status?: string | null): CampaignStatus {
  const normalized = (status || "draft").toLowerCase();

  if (normalized === "funded") return "active";
  if (normalized === "released") return "completed";
  if (normalized === "refunded") return "cancelled";

  return campaignStatuses.includes(normalized as CampaignStatus)
    ? (normalized as CampaignStatus)
    : "draft";
}

export function getCampaignStatusLabel(status?: string | null) {
  return statusLabels[normalizeCampaignStatus(status)];
}

export function getCampaignStatusDescription(status?: string | null) {
  return statusDescriptions[normalizeCampaignStatus(status)];
}

export function getCampaignStatusTone(status?: string | null) {
  return statusTones[normalizeCampaignStatus(status)];
}

export function getAllowedCampaignTransitions(
  status: string | null | undefined,
  role: CampaignLifecycleRole,
) {
  const currentStatus = normalizeCampaignStatus(status);

  if (role === "admin") {
    return campaignStatuses.filter((nextStatus) => nextStatus !== currentStatus);
  }

  if (role === "business_owner") {
    return businessOwnerTransitions[currentStatus];
  }

  return influencerTransitions[currentStatus];
}

export function canTransitionCampaign(
  status: string | null | undefined,
  nextStatus: string | null | undefined,
  role: CampaignLifecycleRole,
) {
  if (!nextStatus) return false;

  const normalizedNextStatus = normalizeCampaignStatus(nextStatus);

  return getAllowedCampaignTransitions(status, role).includes(
    normalizedNextStatus,
  );
}

export function getCampaignPrimaryAction(
  status: string | null | undefined,
  role: CampaignLifecycleRole,
) {
  return primaryActions[role][normalizeCampaignStatus(status)] ?? null;
}

export function getCampaignTimeline(status: string | null | undefined) {
  const currentStatus = normalizeCampaignStatus(status);
  const currentIndex = timelineStatuses.indexOf(currentStatus);

  return timelineStatuses.map((step, index) => ({
    description: statusDescriptions[step],
    label: statusLabels[step],
    status: step,
    state:
      currentStatus === "cancelled"
        ? "muted"
        : index < currentIndex
          ? "complete"
          : step === currentStatus
            ? "current"
            : "future",
  }));
}
