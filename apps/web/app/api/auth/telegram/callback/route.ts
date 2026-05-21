import { randomBytes } from "crypto";
import { NextResponse } from "next/server";
import {
  AUTH_SESSION_COOKIE,
  createAuthSessionCookie,
  getAuthSessionCookieOptions,
} from "@/lib/auth-session";
import {
  authenticateServiceUser,
  executeKw,
  getOdooConfig,
} from "@/lib/odoo-rpc";

type AuthRole = "business" | "influencer";

type TelegramVerifyRequest = {
  code?: unknown;
  role?: unknown;
};

type TelegramUpdate = {
  message?: {
    date?: number;
    text?: string;
    from?: {
      id?: number;
      first_name?: string;
      last_name?: string;
      username?: string;
    };
  };
};

type TelegramUpdatesResponse = {
  ok: boolean;
  result?: TelegramUpdate[];
  description?: string;
};

type OdooUser = {
  id: number;
  name: string;
  login: string;
  partner_id?: [number, string] | false;
};

type OdooModelData = {
  res_id: number;
};

function getString(value: unknown) {
  return typeof value === "string" ? value.trim() : "";
}

function getRole(value: unknown): AuthRole {
  return value === "influencer" ? "influencer" : "business";
}

function getTelegramBotToken() {
  const token = process.env.TELEGRAM_BOT_TOKEN;

  if (!token) {
    throw new Error("TELEGRAM_BOT_TOKEN is not configured.");
  }

  return token;
}

async function fetchTelegramUpdates() {
  const response = await fetch(
    `https://api.telegram.org/bot${getTelegramBotToken()}/getUpdates?limit=100`,
    { cache: "no-store" },
  );
  const payload = (await response.json()) as TelegramUpdatesResponse;

  if (!response.ok || !payload.ok) {
    throw new Error(payload.description || "Unable to read Telegram updates.");
  }

  return payload.result ?? [];
}

async function findTelegramUserByCode(code: string) {
  const updates = await fetchTelegramUpdates();
  const now = Math.floor(Date.now() / 1000);
  const matchedUpdate = updates
    .slice()
    .reverse()
    .find((update) => {
      const message = update.message;

      if (!message?.from || !message.date || now - message.date > 60 * 15) {
        return false;
      }

      return message.text === `/start ${code}` || message.text === code;
    });

  return matchedUpdate?.message?.from ?? null;
}

async function getPortalGroupId(uid: number, config = getOdooConfig()) {
  const portalGroups = await executeKw<OdooModelData[]>(
    uid,
    "ir.model.data",
    "search_read",
    [[["module", "=", "base"], ["name", "=", "group_portal"]]],
    { fields: ["res_id"], limit: 1 },
    config,
  );

  return portalGroups[0]?.res_id;
}

async function findOrCreateTelegramUser(user: NonNullable<Awaited<ReturnType<typeof findTelegramUserByCode>>>) {
  const telegramId = String(user.id);
  const username = getString(user.username);
  const name =
    [getString(user.first_name), getString(user.last_name)].filter(Boolean).join(" ") ||
    username ||
    `Telegram ${telegramId}`;
  const email = `telegram_${telegramId}@telegram.local`;
  const config = getOdooConfig();
  const uid = await authenticateServiceUser(config);
  const existingUsers = await executeKw<OdooUser[]>(
    uid,
    "res.users",
    "search_read",
    [[["login", "=", email]]],
    { fields: ["id", "name", "login", "partner_id"], limit: 1 },
    config,
  );
  const existingUser = existingUsers[0];

  if (existingUser) {
    return {
      id: existingUser.id,
      email,
      name: existingUser.name || name,
      partnerId: Array.isArray(existingUser.partner_id)
        ? existingUser.partner_id[0]
        : undefined,
      handle: username ? `@${username}` : undefined,
    };
  }

  const partnerId = await executeKw<number>(
    uid,
    "res.partner",
    "create",
    [
      {
        name,
        email,
        company_type: "person",
        is_company: false,
        comment: [
          "InfluencerLink ET Telegram bot-code signup",
          `Telegram ID: ${telegramId}`,
          username ? `Username: @${username}` : "",
        ]
          .filter(Boolean)
          .join("\n"),
      },
    ],
    {},
    config,
  );
  const portalGroupId = await getPortalGroupId(uid, config);
  const userValues: Record<string, unknown> = {
    name,
    login: email,
    email,
    password: randomBytes(24).toString("base64url"),
    partner_id: partnerId,
  };

  if (portalGroupId) {
    userValues.groups_id = [[6, 0, [portalGroupId]]];
  }

  const userId = await executeKw<number>(
    uid,
    "res.users",
    "create",
    [userValues],
    { context: { no_reset_password: true } },
    config,
  );

  return {
    id: userId,
    email,
    name,
    partnerId,
    handle: username ? `@${username}` : undefined,
  };
}

export async function POST(request: Request) {
  let body: TelegramVerifyRequest;

  try {
    body = (await request.json()) as TelegramVerifyRequest;
  } catch {
    return NextResponse.json(
      { success: false, message: "Invalid JSON request body." },
      { status: 400 },
    );
  }

  const code = getString(body.code);

  if (!/^il_[a-f0-9]{12}$/.test(code)) {
    return NextResponse.json(
      { success: false, message: "Invalid Telegram login code." },
      { status: 400 },
    );
  }

  try {
    const telegramUser = await findTelegramUserByCode(code);

    if (!telegramUser?.id) {
      return NextResponse.json(
        {
          success: false,
          message:
            "Telegram has not delivered that code to the bot yet. Press Start in Telegram, wait a moment, then click Verify Telegram again.",
        },
        { status: 404 },
      );
    }

    const role = getRole(body.role);
    const user = await findOrCreateTelegramUser(telegramUser);
    const response = NextResponse.json({
      success: true,
      message: "Signed in with Telegram.",
      redirectTo: role === "influencer" ? "/influencers" : "/",
    });

    response.cookies.set(
      AUTH_SESSION_COOKIE,
      createAuthSessionCookie({
        uid: user.id,
        email: user.email,
        name: user.name,
        role,
        partnerId: user.partnerId,
        handle: role === "influencer" ? user.handle : undefined,
        platform: role === "influencer" ? "Telegram" : undefined,
      }),
      getAuthSessionCookieOptions(),
    );

    return response;
  } catch (error) {
    return NextResponse.json(
      {
        success: false,
        message:
          error instanceof Error
            ? error.message
            : "Unable to sign in with Telegram.",
      },
      { status: 502 },
    );
  }
}
