import "server-only";

import type { AuthSession } from "@/lib/auth-session";
import { normalizeSessionRole } from "@/lib/auth-session";
import { getCurrentSession } from "@/lib/session";
import type { Campaign } from "@/lib/campaigns";
import type { InfluencerContract } from "@/lib/contracts";
import type { InfluencerDetail } from "@/lib/influencers";
import type { InfluencerPayment } from "@/lib/payments";
import type { InfluencerSocialAccount } from "@/lib/social-accounts";
import type { AppNotification } from "@/lib/notifications";

export type UserRole = "business_owner" | "influencer" | "admin";

export type PermissionSession = AuthSession & {
  normalizedRole?: UserRole;
  influencerProfileId?: number | null;
};

export type OdooDomain = Array<[string, string, unknown]>;

export const AUTHENTICATION_ERROR = "Authentication required";
export const PERMISSION_ERROR =
  "You do not have permission to access this resource";
export const NOT_FOUND_ERROR = "Resource not found";
export const ODOO_ERROR = "Could not connect to Odoo";

export function normalizeRole(role?: string | null): UserRole {
  return normalizeSessionRole(role ?? undefined);
}

export function getSessionRole(session: PermissionSession | null | undefined) {
  return normalizeRole(session?.normalizedRole ?? session?.role);
}

export function getSessionProfileId(
  session: PermissionSession | null | undefined,
) {
  return session?.profileId ?? session?.influencerProfileId ?? null;
}

export function isBusinessOwner(session: PermissionSession | null | undefined) {
  return getSessionRole(session) === "business_owner";
}

export function isInfluencer(session: PermissionSession | null | undefined) {
  return getSessionRole(session) === "influencer";
}

export function isAdmin(session: PermissionSession | null | undefined) {
  return getSessionRole(session) === "admin";
}

export async function requireSession() {
  const session = await getCurrentSession();

  if (!session) {
    throw new Error(AUTHENTICATION_ERROR);
  }

  return session;
}

export function requireRole(
  session: PermissionSession | null | undefined,
  allowedRoles: UserRole[],
) {
  if (!session) {
    throw new Error(AUTHENTICATION_ERROR);
  }

  if (!allowedRoles.includes(getSessionRole(session))) {
    throw new Error(PERMISSION_ERROR);
  }

  return session;
}

export function canAccessBusinessDashboard(
  session: PermissionSession | null | undefined,
) {
  return isBusinessOwner(session) || isAdmin(session);
}

export function canAccessInfluencerDashboard(
  session: PermissionSession | null | undefined,
) {
  return isInfluencer(session) || isAdmin(session);
}

export function canCreateCampaign(session: PermissionSession | null | undefined) {
  return isBusinessOwner(session) || isAdmin(session);
}

export function canViewCampaign(
  session: PermissionSession | null | undefined,
  campaign: Pick<Campaign, "partnerId" | "influencerId">,
) {
  if (!session) return false;
  if (isAdmin(session)) return true;
  if (isBusinessOwner(session)) {
    return Boolean(session.partnerId && campaign.partnerId === session.partnerId);
  }
  if (isInfluencer(session)) {
    const profileId = getSessionProfileId(session);
    return Boolean(profileId && campaign.influencerId === profileId);
  }

  return false;
}

export function canEditCampaign(
  session: PermissionSession | null | undefined,
  campaign: Pick<Campaign, "partnerId">,
) {
  if (!session) return false;
  if (isAdmin(session)) return true;

  return Boolean(
    isBusinessOwner(session) &&
      session.partnerId &&
      campaign.partnerId === session.partnerId,
  );
}

export function canViewInfluencerProfile(
  session: PermissionSession | null | undefined,
  profile: Pick<InfluencerDetail, "id">,
) {
  if (!session) return false;
  if (isAdmin(session) || isBusinessOwner(session)) return true;
  if (isInfluencer(session)) {
    const profileId = getSessionProfileId(session);
    return Boolean(profileId && profile.id === profileId);
  }

  return false;
}

export function canViewSocialAccount(
  session: PermissionSession | null | undefined,
  account: Pick<InfluencerSocialAccount, "influencerId" | "verificationStatus">,
) {
  if (!session) return false;
  if (isAdmin(session)) return true;
  if (isBusinessOwner(session)) {
    return ["verified", "pending"].includes(account.verificationStatus);
  }
  if (isInfluencer(session)) {
    const profileId = getSessionProfileId(session);
    return Boolean(profileId && account.influencerId === profileId);
  }

  return false;
}

export function canCreateSocialAccount(
  session: PermissionSession | null | undefined,
) {
  return Boolean(session && (isInfluencer(session) || isAdmin(session)));
}

export function canUpdateSocialAccount(
  session: PermissionSession | null | undefined,
  account: Pick<InfluencerSocialAccount, "influencerId" | "verificationStatus">,
) {
  if (!session) return false;
  if (isAdmin(session)) return true;
  if (isInfluencer(session)) {
    const profileId = getSessionProfileId(session);
    return Boolean(
      profileId &&
        account.influencerId === profileId &&
        ["draft", "pending", "rejected"].includes(account.verificationStatus),
    );
  }

  return false;
}

export function canVerifySocialAccount(
  session: PermissionSession | null | undefined,
) {
  return Boolean(session && isAdmin(session));
}

export function canViewNotification(
  session: PermissionSession | null | undefined,
  notification: Pick<
    AppNotification,
    "recipientInfluencerId" | "recipientPartnerId" | "recipientRole"
  >,
) {
  if (!session) return false;
  if (isAdmin(session)) return true;
  if (isBusinessOwner(session)) {
    return Boolean(
      session.partnerId && notification.recipientPartnerId === session.partnerId,
    );
  }
  if (isInfluencer(session)) {
    const profileId = getSessionProfileId(session);
    return Boolean(
      profileId && notification.recipientInfluencerId === profileId,
    );
  }

  return false;
}

export function canMarkNotificationRead(
  session: PermissionSession | null | undefined,
  notification: Pick<
    AppNotification,
    "recipientInfluencerId" | "recipientPartnerId" | "recipientRole"
  >,
) {
  return canViewNotification(session, notification);
}

export function canCreateSystemNotification(
  session: PermissionSession | null | undefined,
) {
  return Boolean(session && isAdmin(session));
}

export function canEditInfluencerProfile(
  session: PermissionSession | null | undefined,
  profile: Pick<InfluencerDetail, "id">,
) {
  if (!session) return false;
  if (isAdmin(session)) return true;
  if (isInfluencer(session)) {
    const profileId = getSessionProfileId(session);
    return Boolean(profileId && profile.id === profileId);
  }

  return false;
}

export function canViewAnalytics(session: PermissionSession | null | undefined) {
  return isBusinessOwner(session) || isAdmin(session);
}

export function canViewContract(
  session: PermissionSession | null | undefined,
  contract: Pick<InfluencerContract, "businessPartnerId" | "influencerId">,
) {
  if (!session) return false;
  if (isAdmin(session)) return true;
  if (isBusinessOwner(session)) {
    return Boolean(
      session.partnerId && contract.businessPartnerId === session.partnerId,
    );
  }
  if (isInfluencer(session)) {
    const profileId = getSessionProfileId(session);
    return Boolean(profileId && contract.influencerId === profileId);
  }

  return false;
}

export function canCreateContract(
  session: PermissionSession | null | undefined,
  campaign: Pick<Campaign, "partnerId">,
) {
  if (!session) return false;
  if (isAdmin(session)) return true;

  return Boolean(
    isBusinessOwner(session) &&
      session.partnerId &&
      campaign.partnerId === session.partnerId,
  );
}

export function canUpdateContract(
  session: PermissionSession | null | undefined,
  contract: Pick<InfluencerContract, "businessPartnerId" | "contractStatus">,
) {
  if (!session) return false;
  if (isAdmin(session)) return true;

  return Boolean(
    isBusinessOwner(session) &&
      session.partnerId &&
      contract.businessPartnerId === session.partnerId &&
      ["draft", "sent"].includes(contract.contractStatus),
  );
}

export function canSignContract(
  session: PermissionSession | null | undefined,
  contract: Pick<
    InfluencerContract,
    "businessPartnerId" | "influencerId" | "businessSigned" | "influencerSigned"
  >,
) {
  if (!session) return false;
  if (isAdmin(session)) return true;
  if (isBusinessOwner(session)) {
    return Boolean(
      session.partnerId &&
        contract.businessPartnerId === session.partnerId &&
        !contract.businessSigned,
    );
  }
  if (isInfluencer(session)) {
    const profileId = getSessionProfileId(session);
    return Boolean(
      profileId &&
        contract.influencerId === profileId &&
        !contract.influencerSigned,
    );
  }

  return false;
}

export function canViewPayment(
  session: PermissionSession | null | undefined,
  payment: Pick<InfluencerPayment, "businessPartnerId" | "influencerId">,
) {
  if (!session) return false;
  if (isAdmin(session)) return true;
  if (isBusinessOwner(session)) {
    return Boolean(
      session.partnerId && payment.businessPartnerId === session.partnerId,
    );
  }
  if (isInfluencer(session)) {
    const profileId = getSessionProfileId(session);
    return Boolean(profileId && payment.influencerId === profileId);
  }

  return false;
}

export function canCreatePayment(
  session: PermissionSession | null | undefined,
  contract: Pick<InfluencerContract, "businessPartnerId" | "contractStatus">,
) {
  if (!session) return false;
  if (isAdmin(session)) return true;

  return Boolean(
    isBusinessOwner(session) &&
      session.partnerId &&
      contract.businessPartnerId === session.partnerId &&
      ["accepted", "active"].includes(contract.contractStatus),
  );
}

export function canUpdatePayment(
  session: PermissionSession | null | undefined,
  payment: Pick<InfluencerPayment, "businessPartnerId" | "paymentStatus">,
) {
  if (!session) return false;
  if (isAdmin(session)) return true;

  return Boolean(
    isBusinessOwner(session) &&
      session.partnerId &&
      payment.businessPartnerId === session.partnerId &&
      ["draft", "requested"].includes(payment.paymentStatus),
  );
}

export function canReleasePayment(
  session: PermissionSession | null | undefined,
  payment: Pick<InfluencerPayment, "paymentStatus">,
) {
  return Boolean(session && isAdmin(session) && payment.paymentStatus === "deposited");
}

export function getCampaignOwnershipDomain(
  session: PermissionSession,
): OdooDomain | null {
  if (isAdmin(session)) return [];

  if (isBusinessOwner(session)) {
    return session.partnerId ? [["partner_id", "=", session.partnerId]] : null;
  }

  if (isInfluencer(session)) {
    const profileId = getSessionProfileId(session);
    return profileId ? [["influencer_id", "=", profileId]] : null;
  }

  return null;
}
