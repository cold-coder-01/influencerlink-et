import { randomBytes } from "crypto";
import { NextResponse } from "next/server";

function getTelegramBotUsername() {
  const username = process.env.NEXT_PUBLIC_TELEGRAM_BOT_USERNAME;

  if (!username) {
    throw new Error("NEXT_PUBLIC_TELEGRAM_BOT_USERNAME is not configured.");
  }

  return username.replace(/^@/, "");
}

export async function GET() {
  try {
    const code = `il_${randomBytes(6).toString("hex")}`;
    const botUsername = getTelegramBotUsername();

    return NextResponse.json({
      success: true,
      code,
      botLink: `https://t.me/${botUsername}?start=${code}`,
    });
  } catch (error) {
    return NextResponse.json(
      {
        success: false,
        message:
          error instanceof Error
            ? error.message
            : "Telegram login is not configured.",
      },
      { status: 500 },
    );
  }
}

