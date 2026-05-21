import "server-only";

import type { PermissionSession } from "@/lib/permissions";
import { getSessionProfileId, isAdmin, isInfluencer } from "@/lib/permissions";
import type { InfluencerSocialAccount, SocialPlatform } from "@/lib/social-accounts";

export type SocialSyncPlatform = Extract<SocialPlatform, "youtube" | "telegram">;

const supportedPlatforms: SocialSyncPlatform[] = ["youtube", "telegram"];

export function getSyncCapability(platform: SocialPlatform) {
  return supportedPlatforms.includes(platform as SocialSyncPlatform);
}

export function getPlatformSyncLabel(platform: SocialPlatform) {
  if (platform === "youtube") return "Sync YouTube";
  if (platform === "telegram") return "Sync Telegram";
  return "Sync Account";
}

export function canSyncSocialAccount(
  session: PermissionSession | null | undefined,
  account: Pick<InfluencerSocialAccount, "influencerId">,
) {
  if (!session) return false;
  if (isAdmin(session)) return true;
  if (!isInfluencer(session)) return false;

  const profileId = getSessionProfileId(session);

  return Boolean(profileId && profileId === account.influencerId);
}
