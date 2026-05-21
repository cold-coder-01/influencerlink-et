import "server-only";

import type { InfluencerSocialAccount } from "@/lib/social-accounts";

const TELEGRAM_API_URL = "https://api.telegram.org";

type TelegramApiResponse<T> = {
  ok: boolean;
  result?: T;
  description?: string;
};

type TelegramChat = {
  id: number;
  title?: string;
  username?: string;
};

export type TelegramAccountMetrics = {
  chatId: string;
  handle: string;
  memberCount: number;
  title?: string | null;
};

function getTelegramBotToken() {
  const token = process.env.TELEGRAM_BOT_TOKEN;

  if (!token || token === "change_me") {
    throw new Error("Telegram sync is not configured. Add TELEGRAM_BOT_TOKEN to .env.local.");
  }

  return token;
}

export function normalizeTelegramHandle(input: string) {
  const trimmed = input.trim();
  if (!trimmed) return "";

  let candidate = trimmed;

  try {
    const url = new URL(trimmed.startsWith("http") ? trimmed : `https://${trimmed}`);
    const host = url.hostname.toLowerCase().replace(/^www\./, "");

    if (host === "t.me" || host === "telegram.me") {
      candidate = url.pathname.split("/").filter(Boolean)[0] ?? "";
    }
  } catch {
    candidate = trimmed;
  }

  candidate = candidate
    .replace(/^https?:\/\/(www\.)?(t\.me|telegram\.me)\//i, "")
    .replace(/^@/, "")
    .split(/[/?#]/)[0]
    ?.trim() ?? "";

  return candidate ? `@${candidate}` : "";
}

async function callTelegram<T>(
  method: "getChat" | "getChatMemberCount",
  params: Record<string, string>,
) {
  const token = getTelegramBotToken();
  const url = new URL(`/bot${token}/${method}`, TELEGRAM_API_URL);

  Object.entries(params).forEach(([key, value]) => url.searchParams.set(key, value));

  const response = await fetch(url, {
    headers: { Accept: "application/json" },
    cache: "no-store",
  });
  const payload = (await response.json()) as TelegramApiResponse<T>;

  if (!response.ok || !payload.ok || typeof payload.result === "undefined") {
    throw new Error(
      payload.description ||
        "Could not sync Telegram account. Check the handle, bot access, or Telegram API response.",
    );
  }

  return payload.result;
}

export async function fetchTelegramChatInfo(handleOrUrl: string) {
  const handle = normalizeTelegramHandle(handleOrUrl);
  if (!handle) {
    throw new Error(
      "Could not sync Telegram account. Check the handle, bot access, or Telegram API response.",
    );
  }

  return callTelegram<TelegramChat>("getChat", { chat_id: handle });
}

export async function fetchTelegramMemberCount(handleOrUrl: string) {
  const handle = normalizeTelegramHandle(handleOrUrl);
  if (!handle) {
    throw new Error(
      "Could not sync Telegram account. Check the handle, bot access, or Telegram API response.",
    );
  }

  return callTelegram<number>("getChatMemberCount", { chat_id: handle });
}

export async function syncTelegramAccount(
  account: Pick<InfluencerSocialAccount, "handle" | "profileUrl">,
): Promise<TelegramAccountMetrics> {
  const identifier =
    normalizeTelegramHandle(account.handle) ||
    normalizeTelegramHandle(account.profileUrl ?? "") ||
    "";
  const handle = normalizeTelegramHandle(identifier);
  const chat = await fetchTelegramChatInfo(handle);
  const memberCount = await fetchTelegramMemberCount(handle);

  return {
    chatId: String(chat.id),
    handle: chat.username ? normalizeTelegramHandle(chat.username) : handle,
    memberCount,
    title: chat.title ?? null,
  };
}
