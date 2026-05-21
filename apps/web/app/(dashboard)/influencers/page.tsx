import "server-only";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import {
  AUTH_SESSION_COOKIE,
  readAuthSessionCookie,
  type AuthSession,
} from "@/lib/auth-session";
import {
  authenticateServiceUser,
  executeKw,
  getOdooConfig,
} from "@/lib/odoo-rpc";
import { InfluencerMarketplace } from "./influencer-marketplace";

export const dynamic = "force-dynamic";

export type MarketplaceIndustry = {
  id: number;
  name: string;
};

export type MarketplaceInfluencer = {
  id: number;
  name: string;
  handle: string;
  platform: string;
  bio: string;
  avgViews: number;
  roiMultiplier: number;
  roiScore: number;
  imageUrl: string | null;
  industries: MarketplaceIndustry[];
};

export type CurrentInfluencerProfile = {
  id: number | null;
  name: string;
  email: string;
  handle: string;
  platform: string;
  bio: string;
  avgViews: number;
  roiMultiplier: number;
  roiScore: number;
  imageUrl: string | null;
  industries: MarketplaceIndustry[];
};

type OdooIndustry = {
  id: number;
  name: string;
};

type OdooFieldMap = Record<string, unknown>;

type MarketplaceProfileFields = {
  name?: string;
  handle?: string;
  platform?: string;
  avgViews?: string;
  roiMultiplier?: string;
  industryRelation?: string;
  image?: string;
  bio?: string;
};

type OdooProfile = {
  id: number;
  name?: string | false;
  handle?: string | false;
  platform?: string | false;
  avg_views?: number | false;
  roi_multiplier?: number | false;
  industry_ids?: number[] | [number, string][];
  image_1920?: string | false;
  image?: string | false;
  bio?: string | false;
};

type MarketplaceData =
  | {
      isOnline: true;
      industries: MarketplaceIndustry[];
      influencers: MarketplaceInfluencer[];
    }
  | {
      isOnline: false;
      error: string;
      industries: MarketplaceIndustry[];
      influencers: MarketplaceInfluencer[];
    };

function asNumber(value: number | false | undefined) {
  return typeof value === "number" && Number.isFinite(value) ? value : 0;
}

function hasField(fields: OdooFieldMap, field: string) {
  return Object.prototype.hasOwnProperty.call(fields, field);
}

function pickField(fields: OdooFieldMap, aliases: string[]) {
  return aliases.find((field) => hasField(fields, field));
}

function valueFromAliases<TValue>(
  record: Record<string, unknown>,
  aliases: string[],
): TValue | undefined {
  for (const alias of aliases) {
    if (record[alias] !== undefined && record[alias] !== false) {
      return record[alias] as TValue;
    }
  }

  return undefined;
}

function calculateRoiScore(profile: Pick<MarketplaceInfluencer, "avgViews" | "roiMultiplier">) {
  const roiScore = Math.min(profile.roiMultiplier * 35, 70);
  const reachScore = Math.min(profile.avgViews / 1000, 30);

  return Math.round(Math.min(100, roiScore + reachScore));
}

function normalizeImage(value: string | false | undefined) {
  if (!value) {
    return null;
  }

  if (value.startsWith("data:image")) {
    return value;
  }

  return `data:image/jpeg;base64,${value}`;
}

function normalizeIndustryIds(value: OdooProfile["industry_ids"]) {
  if (!Array.isArray(value)) {
    return [];
  }

  return value
    .map((industry) => {
      if (Array.isArray(industry)) {
        return industry[0];
      }

      return industry;
    })
    .filter((id): id is number => typeof id === "number");
}

function buildProfileFields(fieldNames: MarketplaceProfileFields) {
  return Array.from(
    new Set(
      [
        fieldNames.name,
        fieldNames.handle,
        fieldNames.platform,
        fieldNames.avgViews,
        fieldNames.roiMultiplier,
        fieldNames.industryRelation,
        fieldNames.image,
        fieldNames.bio,
      ].filter((field): field is string => Boolean(field)),
    ),
  );
}

function normalizeProfiles(
  profiles: OdooProfile[],
  industries: MarketplaceIndustry[],
) {
  const industryById = new Map(industries.map((industry) => [industry.id, industry]));

  return profiles.map((profile, index) => {
    const record = profile as Record<string, unknown>;
    const name = profile.name || `Influencer ${index + 1}`;
    const avgViews = asNumber(
      valueFromAliases<number | false>(record, ["avg_views", "avgViews"]),
    );
    const roiMultiplier = asNumber(
      valueFromAliases<number | false>(record, ["roi_multiplier", "roiMultiplier"]),
    );
    const profileIndustries = normalizeIndustryIds(profile.industry_ids)
      .map((industryId) => industryById.get(industryId))
      .filter((industry): industry is MarketplaceIndustry => Boolean(industry));
    const normalizedProfile = {
      id: profile.id,
      name,
      handle:
        profile.handle ||
        `@${String(name || `creator${profile.id}`)
          .toLowerCase()
          .replace(/[^a-z0-9]+/g, "")
          .slice(0, 18)}`,
      platform: profile.platform || "Creator",
      bio:
        profile.bio ||
        "Audience intelligence, category fit, and campaign history are ready for review.",
      avgViews,
      roiMultiplier,
      roiScore: 0,
      imageUrl: normalizeImage(
        valueFromAliases<string | false>(record, ["image_1920", "image"]),
      ),
      industries:
        profileIndustries.length > 0
          ? profileIndustries
          : [{ id: 0, name: "Emerging Sector" }],
    };

    return {
      ...normalizedProfile,
      roiScore: calculateRoiScore(normalizedProfile),
    };
  });
}

async function fetchMarketplaceData(): Promise<MarketplaceData> {
  try {
    const config = getOdooConfig();
    const uid = await authenticateServiceUser(config);
    const [industryFields, profileFields] = await Promise.all([
      executeKw<OdooFieldMap>(
        uid,
        "influencer.industry",
        "fields_get",
        [],
        { attributes: ["string"] },
        config,
      ),
      executeKw<OdooFieldMap>(
        uid,
        "influencer.profile",
        "fields_get",
        [],
        { attributes: ["string"] },
        config,
      ),
    ]);
    const profileFieldNames: MarketplaceProfileFields = {
      name: pickField(profileFields, ["name"]),
      handle: pickField(profileFields, ["handle"]),
      platform: pickField(profileFields, ["platform"]),
      avgViews: pickField(profileFields, ["avg_views", "avgViews"]),
      roiMultiplier: pickField(profileFields, ["roi_multiplier", "roiMultiplier"]),
      industryRelation: pickField(profileFields, ["industry_ids", "industry_id"]),
      image: pickField(profileFields, ["image_1920", "image"]),
      bio: pickField(profileFields, ["bio"]),
    };
    const profileReadFields = buildProfileFields(profileFieldNames);

    const [industries, profiles] = await Promise.all([
      executeKw<OdooIndustry[]>(
        uid,
        "influencer.industry",
        "search_read",
        [hasField(industryFields, "active") ? [["active", "=", true]] : []],
        { fields: ["name"], order: "name asc" },
        config,
      ),
      executeKw<OdooProfile[]>(
        uid,
        "influencer.profile",
        "search_read",
        [[]],
        {
          fields: profileReadFields,
          order: profileFieldNames.roiMultiplier
            ? `${profileFieldNames.roiMultiplier} desc`
            : "id desc",
        },
        config,
      ),
    ]);

    const normalizedIndustries = industries.map((industry) => ({
      id: industry.id,
      name: industry.name,
    }));

    return {
      isOnline: true,
      industries: normalizedIndustries,
      influencers: normalizeProfiles(profiles, normalizedIndustries),
    };
  } catch (error) {
    return {
      isOnline: false,
      error:
        error instanceof Error
          ? error.message
          : "The Odoo marketplace data could not be loaded.",
      industries: [],
      influencers: [],
    };
  }
}

function buildSessionInfluencerProfile(
  session: AuthSession,
): CurrentInfluencerProfile {
  const name = session.name || session.email.split("@")[0] || "Creator";

  return {
    id: session.profileId ?? null,
    name,
    email: session.email,
    handle:
      session.handle ||
      `@${name.toLowerCase().replace(/[^a-z0-9]+/g, "").slice(0, 18)}`,
    platform: session.platform || "Creator",
    bio:
      session.bio ||
      "Your influencer profile has been created. Complete your creator details to help brands understand your audience.",
    avgViews: 0,
    roiMultiplier: 0,
    roiScore: 0,
    imageUrl: null,
    industries: [{ id: 0, name: "Creator Profile" }],
  };
}

function getCurrentInfluencerProfile(
  session: AuthSession,
  influencers: MarketplaceInfluencer[],
): CurrentInfluencerProfile {
  const matchedInfluencer =
    (session.profileId
      ? influencers.find((influencer) => influencer.id === session.profileId)
      : undefined) ??
    influencers.find(
      (influencer) =>
        session.name &&
        influencer.name.toLowerCase() === session.name.toLowerCase(),
    );

  if (!matchedInfluencer) {
    return buildSessionInfluencerProfile(session);
  }

  return {
    ...matchedInfluencer,
    email: session.email,
  };
}

export default async function InfluencersPage() {
  const session = readAuthSessionCookie(
    (await cookies()).get(AUTH_SESSION_COOKIE)?.value,
  );

  if (!session) {
    redirect("/login");
  }

  const data = await fetchMarketplaceData();
  const currentInfluencer =
    session.role === "influencer"
      ? getCurrentInfluencerProfile(session, data.influencers)
      : null;

  return (
    <InfluencerMarketplace
      currentInfluencer={currentInfluencer}
      industries={data.industries}
      influencers={data.influencers}
      isOnline={data.isOnline}
      error={data.isOnline ? null : data.error}
    />
  );
}
