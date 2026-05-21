import { NextResponse } from "next/server";
import {
  createSocialAccount,
  fetchSocialAccountsByDomain,
  sanitizeSocialAccountForClient,
  type SocialAccountInput,
  type SocialPlatform,
  type VerificationStatus,
} from "@/lib/social-accounts";
import {
  errorResponse,
  forbiddenResponse,
  odooErrorResponse,
  successResponse,
  unauthorizedResponse,
} from "@/lib/api-response";
import {
  canCreateSocialAccount,
  getSessionProfileId,
  isAdmin,
  isBusinessOwner,
  isInfluencer,
  requireSession,
} from "@/lib/permissions";

const platforms: SocialPlatform[] = [
  "tiktok",
  "instagram",
  "youtube",
  "telegram",
  "facebook",
  "linkedin",
  "x_twitter",
  "other",
];

const verificationStatuses: VerificationStatus[] = [
  "draft",
  "pending",
  "verified",
  "rejected",
  "needs_review",
];

function getString(value: unknown) {
  return typeof value === "string" ? value.trim() : "";
}

function getNumber(value: unknown) {
  if (typeof value === "number" && Number.isFinite(value)) return value;
  if (typeof value === "string" && value.trim() && Number.isFinite(Number(value))) {
    return Number(value);
  }
  return null;
}

function getPlatform(value: unknown): SocialPlatform {
  return platforms.includes(value as SocialPlatform) ? (value as SocialPlatform) : "other";
}

function getOptionalPlatform(value: unknown) {
  return platforms.includes(value as SocialPlatform) ? (value as SocialPlatform) : null;
}

function getOptionalStatus(value: unknown) {
  return verificationStatuses.includes(value as VerificationStatus)
    ? (value as VerificationStatus)
    : null;
}

export async function GET(request: Request) {
  const session = await requireSession().catch(() => null);

  if (!session) return unauthorizedResponse();

  const url = new URL(request.url);
  const requestedInfluencerId = getNumber(url.searchParams.get("influencerId"));
  const profileId = getSessionProfileId(session);

  if (isAdmin(session)) {
    const status = getOptionalStatus(url.searchParams.get("status"));
    const platform = getOptionalPlatform(url.searchParams.get("platform"));
    const q = getString(url.searchParams.get("q")).toLowerCase();
    const limit = getNumber(url.searchParams.get("limit"));
    const offset = getNumber(url.searchParams.get("offset")) ?? 0;
    const domain: Array<[string, string, unknown]> = [];
    if (status) domain.push(["verification_status", "=", status]);
    if (platform) domain.push(["platform", "=", platform]);
    const result = await fetchSocialAccountsByDomain(domain);
    if (!result.success) return odooErrorResponse();
    const filtered = q
      ? result.data.filter((account) =>
          [
            account.handle,
            account.influencerName,
            account.name,
            account.platform,
            account.profileUrl,
          ]
            .filter(Boolean)
            .some((value) => String(value).toLowerCase().includes(q)),
        )
      : result.data;
    const sliced =
      limit && limit > 0 ? filtered.slice(offset, offset + limit) : filtered.slice(offset);
    return successResponse(sliced.map(sanitizeSocialAccountForClient));
  }

  if (isInfluencer(session)) {
    if (!profileId) return successResponse([]);
    const result = await fetchSocialAccountsByDomain([["influencer_id", "=", profileId]]);
    if (!result.success) return odooErrorResponse();
    return successResponse(result.data.map(sanitizeSocialAccountForClient));
  }

  if (isBusinessOwner(session)) {
    if (!requestedInfluencerId) return successResponse([]);
    const result = await fetchSocialAccountsByDomain([
      ["influencer_id", "=", requestedInfluencerId],
      ["verification_status", "in", ["verified", "pending"]],
    ]);
    if (!result.success) return odooErrorResponse();
    return successResponse(result.data.map(sanitizeSocialAccountForClient));
  }

  return forbiddenResponse();
}

export async function POST(request: Request) {
  const session = await requireSession().catch(() => null);

  if (!session) return unauthorizedResponse();
  if (!canCreateSocialAccount(session)) return forbiddenResponse();

  let body: Record<string, unknown>;

  try {
    body = (await request.json()) as Record<string, unknown>;
  } catch {
    return errorResponse("Invalid JSON request body.", 400);
  }

  const sessionProfileId = getSessionProfileId(session);
  const bodyInfluencerId = getNumber(body.influencerId);
  const influencerId = isAdmin(session) ? bodyInfluencerId ?? sessionProfileId : sessionProfileId;
  const platform = getPlatform(body.platform);
  const handle = getString(body.handle);

  if (!influencerId) return forbiddenResponse();
  if (!handle) return errorResponse("Handle is required.", 400);
  if (isInfluencer(session) && influencerId !== sessionProfileId) return forbiddenResponse();

  const input: SocialAccountInput = {
    audienceAddisPercent: getNumber(body.audienceAddisPercent),
    audienceLocation: getString(body.audienceLocation) || null,
    avgComments: getNumber(body.avgComments),
    avgLikes: getNumber(body.avgLikes),
    avgViews: getNumber(body.avgViews),
    engagementRate: getNumber(body.engagementRate),
    followersCount: getNumber(body.followersCount),
    followingCount: getNumber(body.followingCount),
    handle,
    influencerId,
    mediaCount: getNumber(body.mediaCount),
    name: getString(body.name) || null,
    platform,
    platformAccountId: isAdmin(session) ? getString(body.platformAccountId) || null : null,
    profileUrl: getString(body.profileUrl) || null,
  };

  try {
    const result = await createSocialAccount(input);
    if (!result.success || !result.data) return odooErrorResponse();

    return NextResponse.json(
      { success: true, data: sanitizeSocialAccountForClient(result.data) },
      { status: 201 },
    );
  } catch (error) {
    console.error("Social account create API failed:", error);
    return odooErrorResponse();
  }
}
