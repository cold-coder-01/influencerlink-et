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
  isAdmin,
  isInfluencer,
  requireSession,
  type PermissionSession,
} from "@/lib/permissions";
import { syncTelegramAccount } from "@/lib/telegram";

const notAccessibleError = "Social account not found or not accessible";
const telegramSyncError =
  "Could not sync Telegram account. Check the handle, bot access, or Telegram API response.";

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

  const current = await fetchAccessibleAccount(accountId, session);
  if (!current.success || !current.data) return notFoundResponse(notAccessibleError);

  const account = current.data;
  if (account.platform !== "telegram" || !getSyncCapability(account.platform)) {
    return errorResponse("This sync action is only available for Telegram accounts", 400);
  }

  try {
    const metrics = await syncTelegramAccount(account);
    const result = await syncSocialAccountMetrics(accountId, {
      followersCount: metrics.memberCount,
      handle: metrics.handle || account.handle,
      name: metrics.title || account.name,
      platformAccountId: metrics.chatId,
      verificationMethod: "api_sync",
      verificationStatus: "needs_review",
    });

    if (!result.success || !result.data) return odooErrorResponse();

    return successResponse(sanitizeSocialAccountForClient(result.data));
  } catch (error) {
    const message =
      error instanceof Error &&
      error.message === "Telegram sync is not configured. Add TELEGRAM_BOT_TOKEN to .env.local."
        ? error.message
        : telegramSyncError;
    const status = message.includes("TELEGRAM_BOT_TOKEN") ? 500 : 502;

    return errorResponse(message, status);
  }
}
