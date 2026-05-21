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

type SignupRole = "business_owner" | "influencer";

type SignupRequest = {
  role?: unknown;
  name?: unknown;
  email?: unknown;
  companyName?: unknown;
  businessName?: unknown;
  businessType?: unknown;
  phone?: unknown;
  location?: unknown;
  preferredPlatforms?: unknown;
  industryId?: unknown;
  platform?: unknown;
  handle?: unknown;
  profileImage?: unknown;
  bio?: unknown;
  followers?: unknown;
  followerCount?: unknown;
  avgViews?: unknown;
  avgFoodViews?: unknown;
  addisAudiencePercent?: unknown;
  locationFocus?: unknown;
  password?: unknown;
  confirmPassword?: unknown;
};

type OdooIndustry = {
  id: number;
  name: string;
};

type OdooModelData = {
  res_id: number;
};

type OdooField = {
  required?: boolean;
  type?: string;
};

type OdooFields = Record<string, OdooField>;

function getString(value: unknown) {
  return typeof value === "string" ? value.trim() : "";
}

function getNumber(value: unknown) {
  if (typeof value === "number" && Number.isInteger(value)) {
    return value;
  }

  if (typeof value === "string" && /^\d+$/.test(value)) {
    return Number(value);
  }

  return 0;
}

function getFiniteNumber(value: unknown) {
  if (typeof value === "number" && Number.isFinite(value)) {
    return value;
  }

  if (typeof value === "string" && value.trim() && Number.isFinite(Number(value))) {
    return Number(value);
  }

  return 0;
}

function getStringList(value: unknown) {
  return Array.isArray(value)
    ? value.map(getString).filter(Boolean)
    : [];
}

function getRole(value: unknown): SignupRole {
  return value === "influencer" ? "influencer" : "business_owner";
}

function isValidEmail(email: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
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

async function ensureEmailIsAvailable(
  uid: number,
  email: string,
  config = getOdooConfig(),
) {
  const existingUsers = await executeKw<{ id: number }[]>(
    uid,
    "res.users",
    "search_read",
    [[["login", "=", email]]],
    { fields: ["id"], limit: 1 },
    config,
  );

  if (existingUsers.length > 0) {
    return "An Odoo user with this email already exists.";
  }

  const existingPartners = await executeKw<{ id: number }[]>(
    uid,
    "res.partner",
    "search_read",
    [[["email", "=", email]]],
    { fields: ["id"], limit: 1 },
    config,
  );

  if (existingPartners.length > 0) {
    return "An account with this email already exists.";
  }

  return null;
}

async function fetchIndustry(
  uid: number,
  industryId: number,
  config = getOdooConfig(),
) {
  const industries = await executeKw<OdooIndustry[]>(
    uid,
    "influencer.industry",
    "search_read",
    [[["id", "=", industryId], ["active", "=", true]]],
    { fields: ["name"], limit: 1 },
    config,
  );

  return industries[0] ?? null;
}

async function createPortalUser({
  uid,
  name,
  email,
  password,
  partnerId,
}: {
  uid: number;
  name: string;
  email: string;
  password: string;
  partnerId: number;
}) {
  const config = getOdooConfig();
  const portalGroupId = await getPortalGroupId(uid, config);
  const userValues: Record<string, unknown> = {
    name,
    login: email,
    email,
    password,
    partner_id: partnerId,
  };

  if (portalGroupId) {
    userValues.groups_id = [[6, 0, [portalGroupId]]];
  }

  return executeKw<number>(
    uid,
    "res.users",
    "create",
    [userValues],
    { context: { no_reset_password: true } },
    config,
  );
}

async function createInfluencerProfile({
  uid,
  name,
  handle,
  platform,
  bio,
  profileImage,
  industryId,
  partnerId,
  userId,
  followers,
  avgFoodViews,
  addisAudiencePercent,
  locationFocus,
}: {
  uid: number;
  name: string;
  handle: string;
  platform: string;
  bio: string;
  profileImage: string;
  industryId: number;
  partnerId: number;
  userId: number;
  followers: number;
  avgFoodViews: number;
  addisAudiencePercent: number;
  locationFocus: string;
}) {
  const config = getOdooConfig();
  const fields = await executeKw<OdooFields>(
    uid,
    "influencer.profile",
    "fields_get",
    [],
    { attributes: ["type", "required"] },
    config,
  );
  const values: Record<string, unknown> = {};

  if ("name" in fields) values.name = name;
  if ("handle" in fields) values.handle = handle;
  if ("platform" in fields) values.platform = platform;
  if ("bio" in fields) values.bio = bio || false;
  if ("image_1920" in fields && profileImage) values.image_1920 = profileImage;
  if ("image" in fields && profileImage) values.image = profileImage;
  if ("followers" in fields) values.followers = followers;
  if ("follower_count" in fields) values.follower_count = followers;
  if ("followerCount" in fields) values.followerCount = followers;
  if ("avg_views" in fields) values.avg_views = avgFoodViews;
  if ("avg_food_views" in fields) values.avg_food_views = avgFoodViews;
  if ("avgFoodViews" in fields) values.avgFoodViews = avgFoodViews;
  if ("addis_audience_percent" in fields) {
    values.addis_audience_percent = addisAudiencePercent;
  }
  if ("addisAudiencePercent" in fields) {
    values.addisAudiencePercent = addisAudiencePercent;
  }
  if ("addis_audience_pct" in fields) values.addis_audience_pct = addisAudiencePercent;
  if ("location_focus" in fields) values.location_focus = locationFocus || false;
  if ("locationFocus" in fields) values.locationFocus = locationFocus || false;
  if ("roi_multiplier" in fields) values.roi_multiplier = 0;
  if ("partner_id" in fields) values.partner_id = partnerId;
  if ("user_id" in fields) values.user_id = userId;
  if ("industry_ids" in fields) values.industry_ids = [[6, 0, [industryId]]];
  if ("industry_id" in fields) values.industry_id = industryId;

  return executeKw<number>(
    uid,
    "influencer.profile",
    "create",
    [values],
    {},
    config,
  );
}

export async function POST(request: Request) {
  let body: SignupRequest;

  try {
    body = (await request.json()) as SignupRequest;
  } catch {
    return NextResponse.json(
      { success: false, message: "Invalid JSON request body." },
      { status: 400 },
    );
  }

  const role = getRole(body.role);
  const name = getString(body.name);
  const email = getString(body.email).toLowerCase();
  const companyName = getString(body.companyName) || getString(body.businessName);
  const businessType = getString(body.businessType);
  const phone = getString(body.phone);
  const location = getString(body.location);
  const preferredPlatforms = getStringList(body.preferredPlatforms);
  const industryId = getNumber(body.industryId);
  const platform = getString(body.platform);
  const handle = getString(body.handle);
  const profileImage = getString(body.profileImage);
  const bio = getString(body.bio);
  const followers = getFiniteNumber(body.followers ?? body.followerCount);
  const avgFoodViews = getFiniteNumber(body.avgFoodViews ?? body.avgViews);
  const addisAudiencePercent = getFiniteNumber(body.addisAudiencePercent);
  const locationFocus = getString(body.locationFocus);
  const password = typeof body.password === "string" ? body.password : "";
  const confirmPassword =
    typeof body.confirmPassword === "string" ? body.confirmPassword : "";

  if (!name || !email || !industryId || !password) {
    return NextResponse.json(
      {
        success: false,
        message: "Name, email, industry, and password are required.",
      },
      { status: 400 },
    );
  }

  if (role === "business_owner" && !companyName) {
    return NextResponse.json(
      { success: false, message: "Company name is required." },
      { status: 400 },
    );
  }

  if (role === "influencer" && (!platform || !handle)) {
    return NextResponse.json(
      { success: false, message: "Platform and creator handle are required." },
      { status: 400 },
    );
  }

  if (role === "influencer" && (followers < 0 || avgFoodViews < 0)) {
    return NextResponse.json(
      { success: false, message: "Followers and average views must be positive numbers." },
      { status: 400 },
    );
  }

  if (
    role === "influencer" &&
    (addisAudiencePercent < 0 || addisAudiencePercent > 100)
  ) {
    return NextResponse.json(
      { success: false, message: "Addis audience percentage must be between 0 and 100." },
      { status: 400 },
    );
  }

  if (!isValidEmail(email)) {
    return NextResponse.json(
      { success: false, message: "Enter a valid email address." },
      { status: 400 },
    );
  }

  if (password.length < 8) {
    return NextResponse.json(
      { success: false, message: "Password must be at least 8 characters." },
      { status: 400 },
    );
  }

  if (password !== confirmPassword) {
    return NextResponse.json(
      { success: false, message: "Passwords do not match." },
      { status: 400 },
    );
  }

  try {
    const config = getOdooConfig();
    const uid = await authenticateServiceUser(config);
    const availabilityError = await ensureEmailIsAvailable(uid, email, config);

    if (availabilityError) {
      return NextResponse.json(
        { success: false, message: availabilityError },
        { status: 409 },
      );
    }

    const industry = await fetchIndustry(uid, industryId, config);

    if (!industry) {
      return NextResponse.json(
        { success: false, message: "Select a valid active industry." },
        { status: 400 },
      );
    }

    const partnerFields = await executeKw<OdooFields>(
      uid,
      "res.partner",
      "fields_get",
      [],
      { attributes: ["type"] },
      config,
    );
    const hasIndustryField = "x_influencer_industry_id" in partnerFields;
    const commentLines =
      role === "business_owner"
        ? [
            "InfluencerLink ET Business Owner signup",
            `Contact person: ${name}`,
            businessType ? `Business type: ${businessType}` : "",
            location ? `Location: ${location}` : "",
            preferredPlatforms.length > 0
              ? `Preferred platforms: ${preferredPlatforms.join(", ")}`
              : "",
          ].filter(Boolean)
        : [
            "InfluencerLink ET Influencer signup",
            `Platform: ${platform}`,
            `Handle: ${handle}`,
            followers ? `Followers: ${followers}` : "",
            avgFoodViews ? `Average views: ${avgFoodViews}` : "",
            addisAudiencePercent ? `Addis audience: ${addisAudiencePercent}%` : "",
            locationFocus ? `Location focus: ${locationFocus}` : "",
            bio ? `Bio: ${bio}` : "",
          ].filter(Boolean);

    if (!hasIndustryField) {
      commentLines.push(`Selected industry: ${industry.name} (#${industry.id})`);
    }

    const partnerValues: Record<string, unknown> = {
      name: role === "business_owner" ? companyName : name,
      email,
      phone: phone || false,
      company_type: role === "business_owner" ? "company" : "person",
      is_company: role === "business_owner",
      comment: commentLines.join("\n"),
    };

    if ("city" in partnerFields && location) partnerValues.city = location;
    if ("street" in partnerFields && location) partnerValues.street = location;
    if ("function" in partnerFields && role === "business_owner") {
      partnerValues.function = name;
    }

    if (hasIndustryField) {
      partnerValues.x_influencer_industry_id = industry.id;
    }

    const partnerId = await executeKw<number>(
      uid,
      "res.partner",
      "create",
      [partnerValues],
      {},
      config,
    );
    const userId = await createPortalUser({
      uid,
      name,
      email,
      password,
      partnerId,
    });
    let profileId: number | null = null;

    if (role === "influencer") {
      profileId = await createInfluencerProfile({
        uid,
        name,
        handle,
        platform,
        bio,
        profileImage,
        industryId: industry.id,
        partnerId,
        userId,
        followers,
        avgFoodViews,
        addisAudiencePercent,
        locationFocus,
      });
    }

    const response = NextResponse.json(
      {
        success: true,
        message:
          role === "business_owner"
            ? "Business Owner account created. Opening your dashboard..."
            : "Influencer account created. Opening your dashboard...",
        redirectTo: role === "influencer" ? "/influencer/dashboard" : "/dashboard",
        partner: {
          id: partnerId,
          name: role === "business_owner" ? companyName : name,
          email,
          industry,
        },
        profile: profileId ? { id: profileId } : null,
        user: {
          id: userId,
          login: email,
        },
      },
      { status: 201 },
    );
    response.cookies.set(
      AUTH_SESSION_COOKIE,
      createAuthSessionCookie({
        uid: userId,
        email,
        name,
        role,
        partnerId,
        profileId: profileId ?? undefined,
        handle: role === "influencer" ? handle : undefined,
        platform: role === "influencer" ? platform : undefined,
        bio: role === "influencer" ? bio : undefined,
      }),
      getAuthSessionCookieOptions(),
    );

    return response;
  } catch (error) {
    console.error("Signup failed while connecting to Odoo.", error);

    return NextResponse.json(
      { success: false, message: "Could not connect to Odoo" },
      { status: 502 },
    );
  }
}
