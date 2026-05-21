import {
  deleteSocialAccount,
  fetchSocialAccount,
  sanitizeSocialAccountForClient,
  updateSocialAccount,
  type SocialAccountInput,
  type SocialPlatform,
} from "@/lib/social-accounts";
import {
  errorResponse,
  forbiddenResponse,
  notFoundResponse,
  odooErrorResponse,
  successResponse,
  unauthorizedResponse,
} from "@/lib/api-response";
import {
  canUpdateSocialAccount,
  canViewSocialAccount,
  getSessionProfileId,
  isAdmin,
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

function getString(value: unknown) {
  return typeof value === "string" ? value.trim() : "";
}

function getNumber(value: unknown) {
  if (typeof value === "number" && Number.isFinite(value)) return value;
  if (typeof value === "string" && value.trim() && Number.isFinite(Number(value))) {
    return Number(value);
  }
  return undefined;
}

function getPlatform(value: unknown) {
  return platforms.includes(value as SocialPlatform) ? (value as SocialPlatform) : undefined;
}

async function loadAccount(id: number) {
  const result = await fetchSocialAccount(id);
  if (!result.success || !result.data) return null;
  return result.data;
}

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const accountId = Number.parseInt(id, 10);

  if (!Number.isFinite(accountId)) return notFoundResponse("Resource not found");

  const session = await requireSession().catch(() => null);
  if (!session) return unauthorizedResponse();

  const account = await loadAccount(accountId);
  if (!account) return notFoundResponse("Resource not found");
  if (!canViewSocialAccount(session, account)) return forbiddenResponse();

  return successResponse(sanitizeSocialAccountForClient(account));
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const accountId = Number.parseInt(id, 10);

  if (!Number.isFinite(accountId)) return notFoundResponse("Resource not found");

  const session = await requireSession().catch(() => null);
  if (!session) return unauthorizedResponse();

  const account = await loadAccount(accountId);
  if (!account) return notFoundResponse("Resource not found");
  if (!canUpdateSocialAccount(session, account)) return forbiddenResponse();

  let body: Record<string, unknown>;

  try {
    body = (await request.json()) as Record<string, unknown>;
  } catch {
    return errorResponse("Invalid JSON request body.", 400);
  }

  const profileId = getSessionProfileId(session);
  const input: Partial<SocialAccountInput> = {
    audienceAddisPercent: getNumber(body.audienceAddisPercent),
    audienceLocation: getString(body.audienceLocation) || undefined,
    avgComments: getNumber(body.avgComments),
    avgLikes: getNumber(body.avgLikes),
    avgViews: getNumber(body.avgViews),
    engagementRate: getNumber(body.engagementRate),
    followersCount: getNumber(body.followersCount),
    followingCount: getNumber(body.followingCount),
    handle: getString(body.handle) || undefined,
    mediaCount: getNumber(body.mediaCount),
    name: getString(body.name) || undefined,
    platform: getPlatform(body.platform),
    platformAccountId: isAdmin(session) ? getString(body.platformAccountId) || undefined : undefined,
    profileUrl: getString(body.profileUrl) || undefined,
  };

  if (isInfluencer(session)) {
    input.influencerId = profileId ?? undefined;
  } else if (isAdmin(session)) {
    input.influencerId = getNumber(body.influencerId);
  }

  try {
    const result = await updateSocialAccount(accountId, input);
    if (!result.success || !result.data) return odooErrorResponse();
    return successResponse(sanitizeSocialAccountForClient(result.data));
  } catch (error) {
    console.error("Social account update API failed:", error);
    return odooErrorResponse();
  }
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const accountId = Number.parseInt(id, 10);

  if (!Number.isFinite(accountId)) return notFoundResponse("Resource not found");

  const session = await requireSession().catch(() => null);
  if (!session) return unauthorizedResponse();

  const account = await loadAccount(accountId);
  if (!account) return notFoundResponse("Resource not found");

  const canDelete =
    isAdmin(session) ||
    (isInfluencer(session) &&
      canUpdateSocialAccount(session, account) &&
      ["draft", "pending", "rejected"].includes(account.verificationStatus));

  if (!canDelete) return forbiddenResponse();

  try {
    const result = await deleteSocialAccount(accountId);
    return successResponse(result.data);
  } catch (error) {
    console.error("Social account delete API failed:", error);
    return odooErrorResponse();
  }
}
