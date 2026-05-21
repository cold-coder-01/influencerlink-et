import {
  fetchSocialAccount,
  fetchSocialAccountsByDomain,
  sanitizeSocialAccountForClient,
  syncSocialAccountMetrics,
} from "@/lib/social-accounts";
import {
  errorResponse,
  notFoundResponse,
  odooErrorResponse,
  successResponse,
  unauthorizedResponse,
} from "@/lib/api-response";
import { getSyncCapability } from "@/lib/social-sync";
import {
  getSessionProfileId,
  getSessionRole,
  isAdmin,
  isInfluencer,
  requireSession,
  type PermissionSession,
} from "@/lib/permissions";
import {
  fetchYouTubePublicChannelMetrics,
  getYouTubeChannelIdentifier,
} from "@/lib/youtube";

const notAccessibleError = "Social account not found or not accessible";

async function fetchAccessibleAccount(accountId: number, session: PermissionSession) {
  if (isAdmin(session)) {
    return fetchSocialAccount(accountId);
  }

  if (!isInfluencer(session)) {
    return { success: false as const, data: null };
  }

  const profileId = getSessionProfileId(session);
  if (!profileId) {
    return { success: false as const, data: null };
  }

  const result = await fetchSocialAccountsByDomain([
    ["id", "=", accountId],
    ["influencer_id", "=", profileId],
  ]);

  if (!result.success) return { ...result, data: null };

  return result.data[0]
    ? { success: true as const, data: result.data[0] }
    : { success: false as const, data: null };
}

export async function POST(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const accountId = Number.parseInt(id, 10);

  if (!Number.isFinite(accountId)) return notFoundResponse(notAccessibleError);

  const session = await requireSession().catch(() => null);
  if (!session) return unauthorizedResponse();

  const profileId = getSessionProfileId(session);
  const role = getSessionRole(session);
  const current = await fetchAccessibleAccount(accountId, session);

  console.info("YouTube social account sync lookup", {
    accountFound: Boolean(current.data),
    accountInfluencerId: current.data?.influencerId ?? null,
    accountPlatform: current.data?.platform ?? null,
    requestedId: accountId,
    sessionProfileId: profileId,
    sessionRole: role,
  });

  if (!current.success || !current.data) return notFoundResponse(notAccessibleError);

  const account = current.data;
  if (account.platform !== "youtube" || !getSyncCapability(account.platform)) {
    return errorResponse("This sync action is only available for YouTube accounts", 400);
  }

  const identifier = getYouTubeChannelIdentifier(account);
  if (!identifier) {
    return errorResponse(
      "Add a YouTube channel ID, @handle, or channel URL before syncing.",
      400,
    );
  }

  try {
    const metrics = await fetchYouTubePublicChannelMetrics(identifier);
    const result = await syncSocialAccountMetrics(accountId, {
      avgViews: metrics.avgViews ?? undefined,
      followersCount: metrics.subscriberCount ?? undefined,
      handle: metrics.handle || account.handle,
      mediaCount: metrics.videoCount ?? undefined,
      name: metrics.title,
      platformAccountId: metrics.channelId,
      profileUrl: metrics.profileUrl,
      verificationMethod: "api_sync",
      verificationStatus: "needs_review",
    });

    if (!result.success || !result.data) return odooErrorResponse();

    return successResponse(sanitizeSocialAccountForClient(result.data));
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Could not sync YouTube metrics.";
    const status = message.includes("YOUTUBE_API_KEY") ? 500 : 502;

    return errorResponse(message, status);
  }
}
