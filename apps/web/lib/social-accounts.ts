import "server-only";

import {
  authenticateServiceUser,
  executeKw,
  getOdooConfig,
  type OdooConfig,
} from "@/lib/odoo-rpc";
import {
  getMany2OneId,
  getMany2OneName,
  hasField,
  pickExistingFields,
  pickExistingOrder,
  safeFloat,
  safeInteger,
  safeString,
  type Many2OneValue,
} from "@/lib/odoo-fields";

type OdooFieldMap = Record<string, unknown>;
export type OdooDomain = Array<[string, string, unknown]>;

export type SocialPlatform =
  | "tiktok"
  | "instagram"
  | "youtube"
  | "telegram"
  | "facebook"
  | "linkedin"
  | "x_twitter"
  | "other";

export type VerificationStatus =
  | "draft"
  | "pending"
  | "verified"
  | "rejected"
  | "needs_review";

export type VerificationMethod = "manual" | "oauth" | "api_sync" | "document";

export type InfluencerSocialAccount = {
  id: number;
  name: string;
  influencerId: number;
  influencerName?: string | null;
  platform: SocialPlatform;
  handle: string;
  profileUrl?: string | null;
  platformAccountId?: string | null;
  verificationStatus: VerificationStatus;
  verificationMethod: VerificationMethod;
  followersCount?: number | null;
  followingCount?: number | null;
  mediaCount?: number | null;
  avgViews?: number | null;
  avgLikes?: number | null;
  avgComments?: number | null;
  engagementRate?: number | null;
  audienceLocation?: string | null;
  audienceAddisPercent?: number | null;
  lastSyncedAt?: string | null;
  verifiedAt?: string | null;
  rejectionReason?: string | null;
  notes?: string | null;
};

export type SocialAccountInput = {
  name?: string | null;
  influencerId: number;
  platform: SocialPlatform;
  handle: string;
  profileUrl?: string | null;
  platformAccountId?: string | null;
  followersCount?: number | null;
  followingCount?: number | null;
  mediaCount?: number | null;
  avgViews?: number | null;
  avgLikes?: number | null;
  avgComments?: number | null;
  engagementRate?: number | null;
  audienceLocation?: string | null;
  audienceAddisPercent?: number | null;
  rejectionReason?: string | null;
  notes?: string | null;
  verificationStatus?: VerificationStatus;
  verificationMethod?: VerificationMethod;
};

export type VerifiedSocialMetricsInput = {
  provider: "youtube";
  profileId: number;
  externalAccountId: string;
  username?: string | null;
  displayName: string;
  profileUrl?: string | null;
  followerCount?: number | null;
  followingCount?: number | null;
  mediaCount?: number | null;
  totalViewCount?: number | null;
  avgViews?: number | null;
  engagementRate?: number | null;
  rawMetrics?: Record<string, unknown>;
};

type RawSocialAccount = {
  id: number;
  name?: string | false;
  influencer_id?: Many2OneValue;
  influencer_name?: string | false;
  platform?: SocialPlatform | false;
  handle?: string | false;
  profile_url?: string | false;
  platform_account_id?: string | false;
  verification_status?: VerificationStatus | false;
  verification_method?: VerificationMethod | false;
  followers_count?: number | false;
  following_count?: number | false;
  media_count?: number | false;
  avg_views?: number | false;
  avg_likes?: number | false;
  avg_comments?: number | false;
  engagement_rate?: number | false;
  audience_location?: string | false;
  audience_addis_percent?: number | false;
  last_synced_at?: string | false;
  verified_at?: string | false;
  rejection_reason?: string | false;
  notes?: string | false;
};

const MODEL = "influencer.social.account";

const readFields = [
  "name",
  "influencer_id",
  "influencer_name",
  "platform",
  "handle",
  "profile_url",
  "platform_account_id",
  "verification_status",
  "verification_method",
  "followers_count",
  "following_count",
  "media_count",
  "avg_views",
  "avg_likes",
  "avg_comments",
  "engagement_rate",
  "audience_location",
  "audience_addis_percent",
  "last_synced_at",
  "verified_at",
  "rejection_reason",
  "notes",
];

const createFieldMap: Array<[keyof SocialAccountInput, string]> = [
  ["influencerId", "influencer_id"],
  ["platform", "platform"],
  ["handle", "handle"],
  ["profileUrl", "profile_url"],
  ["platformAccountId", "platform_account_id"],
  ["followersCount", "followers_count"],
  ["followingCount", "following_count"],
  ["mediaCount", "media_count"],
  ["avgViews", "avg_views"],
  ["avgLikes", "avg_likes"],
  ["avgComments", "avg_comments"],
  ["engagementRate", "engagement_rate"],
  ["audienceLocation", "audience_location"],
  ["audienceAddisPercent", "audience_addis_percent"],
  ["rejectionReason", "rejection_reason"],
  ["notes", "notes"],
  ["verificationStatus", "verification_status"],
  ["verificationMethod", "verification_method"],
];

async function getFields(uid: number, model: string, config: OdooConfig) {
  return executeKw<OdooFieldMap>(
    uid,
    model,
    "fields_get",
    [],
    { attributes: ["string"] },
    config,
  );
}

function nowForOdoo() {
  return new Date().toISOString().replace("T", " ").slice(0, 19);
}

export function normalizeSocialAccount(raw: RawSocialAccount): InfluencerSocialAccount {
  const influencerId = getMany2OneId(raw.influencer_id) ?? 0;
  const influencerName =
    safeString(raw.influencer_name, "") ||
    getMany2OneName(raw.influencer_id) ||
    null;

  return {
    id: raw.id,
    name: safeString(raw.name, `Social account ${raw.id}`),
    influencerId,
    influencerName,
    platform: raw.platform || "other",
    handle: safeString(raw.handle, ""),
    profileUrl: safeString(raw.profile_url, "") || null,
    platformAccountId: safeString(raw.platform_account_id, "") || null,
    verificationStatus: raw.verification_status || "pending",
    verificationMethod: raw.verification_method || "manual",
    followersCount: safeInteger(raw.followers_count, 0),
    followingCount: safeInteger(raw.following_count, 0) || null,
    mediaCount: safeInteger(raw.media_count, 0) || null,
    avgViews: safeInteger(raw.avg_views, 0) || null,
    avgLikes: safeInteger(raw.avg_likes, 0) || null,
    avgComments: safeInteger(raw.avg_comments, 0) || null,
    engagementRate: safeFloat(raw.engagement_rate, 0) || null,
    audienceLocation: safeString(raw.audience_location, "") || null,
    audienceAddisPercent: safeFloat(raw.audience_addis_percent, 0) || null,
    lastSyncedAt: safeString(raw.last_synced_at, "") || null,
    verifiedAt: safeString(raw.verified_at, "") || null,
    rejectionReason: safeString(raw.rejection_reason, "") || null,
    notes: safeString(raw.notes, "") || null,
  };
}

export function normalizeSocialAccounts(raw: RawSocialAccount[]) {
  return raw.map(normalizeSocialAccount);
}

export function getSocialPlatformLabel(platform: SocialPlatform) {
  const labels: Record<SocialPlatform, string> = {
    facebook: "Facebook",
    instagram: "Instagram",
    linkedin: "LinkedIn",
    other: "Other",
    telegram: "Telegram",
    tiktok: "TikTok",
    x_twitter: "X / Twitter",
    youtube: "YouTube",
  };

  return labels[platform] ?? "Other";
}

export function getSocialPlatformBadgeTone(platform: SocialPlatform) {
  if (platform === "youtube" || platform === "instagram" || platform === "tiktok") {
    return "gold" as const;
  }
  if (platform === "telegram" || platform === "linkedin") return "blue" as const;
  if (platform === "facebook" || platform === "x_twitter") return "gray" as const;
  return "gray" as const;
}

export function getVerificationStatusLabel(status: VerificationStatus) {
  const labels: Record<VerificationStatus, string> = {
    draft: "Draft",
    needs_review: "Needs Review",
    pending: "Pending Review",
    rejected: "Rejected",
    verified: "Verified",
  };

  return labels[status] ?? "Pending Review";
}

export function getVerificationStatusTone(status: VerificationStatus) {
  const tones: Record<VerificationStatus, "gold" | "green" | "blue" | "red" | "gray"> = {
    draft: "gray",
    needs_review: "blue",
    pending: "gold",
    rejected: "red",
    verified: "green",
  };

  return tones[status] ?? "gray";
}

export function getVerificationStatusDescription(status: VerificationStatus) {
  const descriptions: Record<VerificationStatus, string> = {
    draft: "Saved before submission.",
    needs_review: "The platform team needs more information.",
    pending: "Awaiting manual review by the platform team.",
    rejected: "The submitted account could not be verified.",
    verified: "Reviewed and verified by the platform team.",
  };

  return descriptions[status] ?? descriptions.pending;
}

function accountName(input: SocialAccountInput) {
  return (
    safeString(input.name, "") ||
    `${getSocialPlatformLabel(input.platform)} ${safeString(input.handle, "account")}`
  );
}

function buildSocialAccountPayload(
  input: SocialAccountInput,
  existingFields: OdooFieldMap,
  includeVerificationFields: boolean,
) {
  const values: Record<string, unknown> = {};
  if (hasField(existingFields, "name")) values.name = accountName(input);

  createFieldMap.forEach(([inputKey, odooField]) => {
    if (!hasField(existingFields, odooField)) return;
    if (!includeVerificationFields && odooField.startsWith("verification_")) return;
    const value = input[inputKey];
    if (value !== undefined) values[odooField] = value ?? false;
  });

  if (hasField(existingFields, "verification_status") && !values.verification_status) {
    values.verification_status = "pending";
  }
  if (hasField(existingFields, "verification_method") && !values.verification_method) {
    values.verification_method = "manual";
  }

  return values;
}

export function buildSocialAccountCreatePayload(
  input: SocialAccountInput,
  existingFields: OdooFieldMap,
) {
  return buildSocialAccountPayload(input, existingFields, false);
}

export function buildSocialAccountUpdatePayload(
  input: Partial<SocialAccountInput>,
  existingFields: OdooFieldMap,
) {
  const values: Record<string, unknown> = {};
  const fullInput = input as SocialAccountInput;

  if (input.name !== undefined && hasField(existingFields, "name")) {
    values.name = input.name;
  }

  createFieldMap.forEach(([inputKey, odooField]) => {
    if (!hasField(existingFields, odooField)) return;
    if (odooField.startsWith("verification_")) return;
    const value = fullInput[inputKey];
    if (value !== undefined) values[odooField] = value ?? false;
  });

  return values;
}

export function sanitizeSocialAccountForClient(account: InfluencerSocialAccount) {
  return {
    avgComments: account.avgComments,
    avgLikes: account.avgLikes,
    avgViews: account.avgViews,
    audienceAddisPercent: account.audienceAddisPercent,
    audienceLocation: account.audienceLocation,
    engagementRate: account.engagementRate,
    followersCount: account.followersCount,
    followingCount: account.followingCount,
    handle: account.handle,
    id: account.id,
    influencerId: account.influencerId,
    influencerName: account.influencerName,
    lastSyncedAt: account.lastSyncedAt,
    mediaCount: account.mediaCount,
    name: account.name,
    platform: account.platform,
    platformAccountId: null,
    profileUrl: account.profileUrl,
    rejectionReason:
      account.verificationStatus === "rejected" ? account.rejectionReason ?? null : null,
    verificationMethod: account.verificationMethod,
    verificationStatus: account.verificationStatus,
    verifiedAt: account.verifiedAt,
    notes: null,
  };
}

export async function fetchSocialAccountsByDomain(domain: OdooDomain) {
  try {
    const config = getOdooConfig();
    const uid = await authenticateServiceUser(config);
    const fields = await getFields(uid, MODEL, config);
    const accounts = await executeKw<RawSocialAccount[]>(
      uid,
      MODEL,
      "search_read",
      [domain],
      {
        fields: pickExistingFields(fields, readFields),
        order: pickExistingOrder(fields, "verification_status asc, platform asc, id desc"),
      },
      config,
    );

    return { success: true as const, data: normalizeSocialAccounts(accounts) };
  } catch (error) {
    return {
      success: false as const,
      data: [],
      error:
        error instanceof Error
          ? error.message
          : "Could not load social accounts from Odoo.",
    };
  }
}

export function fetchSocialAccounts(profileId: number) {
  return fetchSocialAccountsByDomain([["influencer_id", "=", profileId]]);
}

export async function fetchSocialAccount(id: number) {
  const result = await fetchSocialAccountsByDomain([["id", "=", id]]);

  if (!result.success) return { ...result, data: null };

  return result.data[0]
    ? { success: true as const, data: result.data[0] }
    : { success: false as const, status: 404, data: null, error: "Resource not found" };
}

export async function createSocialAccount(input: SocialAccountInput) {
  const config = getOdooConfig();
  const uid = await authenticateServiceUser(config);
  const fields = await getFields(uid, MODEL, config);
  const values = buildSocialAccountCreatePayload(input, fields);
  const id = await executeKw<number>(uid, MODEL, "create", [values], {}, config);

  return fetchSocialAccount(id);
}

export async function updateSocialAccount(
  id: number,
  input: Partial<SocialAccountInput>,
) {
  const config = getOdooConfig();
  const uid = await authenticateServiceUser(config);
  const fields = await getFields(uid, MODEL, config);
  const values = buildSocialAccountUpdatePayload(input, fields);

  if (Object.keys(values).length) {
    await executeKw<boolean>(uid, MODEL, "write", [[id], values], {}, config);
  }

  return fetchSocialAccount(id);
}

export async function syncSocialAccountMetrics(
  id: number,
  input: {
    avgViews?: number | null;
    followersCount?: number | null;
    handle?: string | null;
    mediaCount?: number | null;
    name?: string | null;
    platformAccountId?: string | null;
    profileUrl?: string | null;
    verificationMethod?: Extract<VerificationMethod, "api_sync" | "oauth">;
    verificationStatus?: Extract<VerificationStatus, "needs_review" | "verified" | "pending">;
  },
) {
  const config = getOdooConfig();
  const uid = await authenticateServiceUser(config);
  const fields = await getFields(uid, MODEL, config);
  const values: Record<string, unknown> = {};

  const setIfPresent = (field: string, value: unknown) => {
    if (value !== undefined && hasField(fields, field)) values[field] = value ?? false;
  };

  setIfPresent("avg_views", input.avgViews);
  setIfPresent("followers_count", input.followersCount);
  setIfPresent("handle", input.handle);
  setIfPresent("media_count", input.mediaCount);
  setIfPresent("name", input.name);
  setIfPresent("platform_account_id", input.platformAccountId);
  setIfPresent("profile_url", input.profileUrl);
  setIfPresent("verification_method", input.verificationMethod ?? "api_sync");
  setIfPresent("verification_status", input.verificationStatus ?? "needs_review");
  setIfPresent("last_synced_at", nowForOdoo());

  if (Object.keys(values).length) {
    await executeKw<boolean>(uid, MODEL, "write", [[id], values], {}, config);
  }

  return fetchSocialAccount(id);
}

export async function verifySocialAccount(
  id: number,
  status: Extract<VerificationStatus, "verified" | "rejected" | "needs_review" | "pending">,
  input: { notes?: string | null; rejectionReason?: string | null },
) {
  const config = getOdooConfig();
  const uid = await authenticateServiceUser(config);
  const fields = await getFields(uid, MODEL, config);
  const values: Record<string, unknown> = {};

  if (hasField(fields, "verification_status")) values.verification_status = status;
  if (hasField(fields, "verification_method")) values.verification_method = "manual";
  if (hasField(fields, "verified_at")) {
    values.verified_at = status === "verified" ? nowForOdoo() : false;
  }
  if (hasField(fields, "rejection_reason")) {
    values.rejection_reason = input.rejectionReason ?? false;
  }
  if (hasField(fields, "notes")) values.notes = input.notes ?? false;

  await executeKw<boolean>(uid, MODEL, "write", [[id], values], {}, config);

  return fetchSocialAccount(id);
}

export async function deleteSocialAccount(id: number) {
  const config = getOdooConfig();
  const uid = await authenticateServiceUser(config);

  await executeKw<boolean>(uid, MODEL, "unlink", [[id]], {}, config);

  return { success: true as const, data: { id } };
}

export async function saveVerifiedSocialMetrics(input: VerifiedSocialMetricsInput) {
  const config = getOdooConfig();
  const uid = await authenticateServiceUser(config);
  const socialFields = await getFields(uid, MODEL, config);
  const profileFields = await getFields(uid, "influencer.profile", config);
  const existing = await executeKw<Array<{ id: number }>>(
    uid,
    MODEL,
    "search_read",
    [[
      ["platform", "=", "youtube"],
      ["platform_account_id", "=", input.externalAccountId],
      ["influencer_id", "=", input.profileId],
    ]],
    { fields: ["id"], limit: 1 },
    config,
  );
  const values: Record<string, unknown> = {
    name: input.displayName,
    influencer_id: input.profileId,
    platform: "youtube",
    handle: input.username || input.displayName,
    profile_url: input.profileUrl || "",
    platform_account_id: input.externalAccountId,
    followers_count: input.followerCount || 0,
    following_count: input.followingCount || 0,
    media_count: input.mediaCount || 0,
    avg_views: input.avgViews || 0,
    engagement_rate: input.engagementRate || 0,
    verification_status: "needs_review",
    verification_method: "oauth",
    verified_at: false,
    last_synced_at: nowForOdoo(),
  };
  const safeValues = Object.fromEntries(
    Object.entries(values).filter(([field]) => hasField(socialFields, field)),
  );
  const accountId =
    existing[0]?.id ??
    (await executeKw<number>(uid, MODEL, "create", [safeValues], {}, config));

  if (existing[0]?.id) {
    await executeKw<boolean>(uid, MODEL, "write", [[existing[0].id], safeValues], {}, config);
  }

  const profileValues: Record<string, unknown> = {};
  if (hasField(profileFields, "handle")) profileValues.handle = input.username || input.displayName;
  if (hasField(profileFields, "platform")) profileValues.platform = "YouTube";
  if (hasField(profileFields, "follower_count")) {
    profileValues.follower_count = input.followerCount || 0;
  }
  if (hasField(profileFields, "total_view_count")) {
    profileValues.total_view_count = input.totalViewCount || 0;
  }
  if (hasField(profileFields, "avg_views")) profileValues.avg_views = input.avgViews || 0;
  if (hasField(profileFields, "verified_metrics_at")) {
    profileValues.verified_metrics_at = nowForOdoo();
  }

  if (Object.keys(profileValues).length > 0) {
    await executeKw<boolean>(
      uid,
      "influencer.profile",
      "write",
      [[input.profileId], profileValues],
      {},
      config,
    );
  }

  return { id: accountId };
}
