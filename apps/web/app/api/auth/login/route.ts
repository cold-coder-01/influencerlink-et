import { NextResponse } from "next/server";
import {
  AUTH_SESSION_COOKIE,
  createAuthSessionCookie,
  getAuthSessionCookieOptions,
} from "@/lib/auth-session";
import { resolveOdooSessionIdentity } from "@/lib/odoo-auth";
import { authenticateOdoo } from "@/lib/odoo-rpc";

type LoginRequest = {
  email?: unknown;
  password?: unknown;
  role?: unknown;
};

export async function POST(request: Request) {
  let body: LoginRequest;

  try {
    body = (await request.json()) as LoginRequest;
  } catch {
    return NextResponse.json(
      { success: false, message: "Invalid JSON request body." },
      { status: 400 },
    );
  }

  const email = typeof body.email === "string" ? body.email.trim() : "";
  const password = typeof body.password === "string" ? body.password : "";

  if (!email || !password) {
    return NextResponse.json(
      { success: false, message: "Email and password are required." },
      { status: 400 },
    );
  }

  try {
    const uid = await authenticateOdoo(email, password);

    if (!uid) {
      return NextResponse.json(
        { success: false, message: "Invalid email or password." },
        { status: 401 },
      );
    }

    const identity = await resolveOdooSessionIdentity(uid);
    const redirectTo =
      identity.role === "admin"
        ? "/admin/verifications"
        : identity.role === "influencer"
          ? "/influencer/dashboard"
          : "/dashboard";
    const response = NextResponse.json({
      success: true,
      message: "Signed in successfully. Opening your dashboard...",
      redirectTo,
      uid,
    });
    response.cookies.set(
      AUTH_SESSION_COOKIE,
      createAuthSessionCookie({
        uid,
        email,
        role: identity.role,
        name: identity.name,
        partnerId: identity.partnerId,
        profileId: identity.profileId,
        handle: identity.handle,
        platform: identity.platform,
        bio: identity.bio,
      }),
      getAuthSessionCookieOptions(),
    );

    return response;
  } catch (error) {
    console.error("Login failed while connecting to Odoo.", error);

    return NextResponse.json(
      { success: false, message: "Could not connect to Odoo" },
      { status: 502 },
    );
  }
}
