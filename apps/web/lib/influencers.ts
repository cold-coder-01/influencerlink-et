import "server-only";

import {
  authenticateServiceUser,
  executeKw,
  getOdooConfig,
} from "@/lib/odoo-rpc";
import { calculateMatchScore } from "@/lib/match-utils";

type OdooFieldMap = Record<string, unknown>;

type InfluencerFieldNames = {
  name?: string;
  handle?: string;
  platform?: string;
  followers?: string;
  avgViews?: string;
  addisAudience?: string;
  roiMultiplier?: string;
  matchScore?: string;
  industryRelation?: string;
  locationFocus?: string;
  bio?: string;
};

type RawInfluencerProfile = {
  id: number;
  name?: string | false;
  handle?: string | false;
  platform?: string | false;
  follower_count?: number | false;
  followers?: number | false;
  followerCount?: number | false;
  avg_views?: number | false;
  avg_food_views?: number | false;
  avgFoodViews?: number | false;
  addis_audience_pct?: number | false;
  addis_audience_percent?: number | false;
  addisAudiencePercent?: number | false;
  roi_multiplier?: number | false;
  roiMultiplier?: number | false;
  match_score?: number | false;
  matchScore?: number | false;
  industry_ids?: number[] | [number, string][] | false;
  industry_id?: [number, string] | false;
  industry?: string | false;
  location_focus?: string | false;
  locationFocus?: string | false;
  bio?: string | false;
};

type OdooIndustry = {
  id: number;
  name?: string | false;
};

export type InfluencerDetail = {
  id: number;
  name: string;
  handle: string;
  platform: string;
  followers: number;
  avgFoodViews: number;
  addisAudiencePercent: number;
  roiMultiplier: number;
  matchScore: number;
  industry: string;
  industryId: number | null;
  locationFocus: string;
  bio: string;
};

export type InfluencerDetailResult =
  | {
      success: true;
      data: InfluencerDetail;
    }
  | {
      success: false;
      status: 404 | 502;
      data: null;
      error: string;
    };

function asNumber(value: number | false | undefined, fallback = 0) {
  return typeof value === "number" && Number.isFinite(value) ? value : fallback;
}

function asString(value: string | false | undefined, fallback = "") {
  return typeof value === "string" && value.length > 0 ? value : fallback;
}

function pickField(availableFields: OdooFieldMap, aliases: string[]) {
  return aliases.find((field) =>
    Object.prototype.hasOwnProperty.call(availableFields, field),
  );
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

function normalizeIndustryIds(profile: RawInfluencerProfile) {
  const ids = new Set<number>();

  if (Array.isArray(profile.industry_ids)) {
    profile.industry_ids.forEach((industry) => {
      if (Array.isArray(industry) && typeof industry[0] === "number") {
        ids.add(industry[0]);
        return;
      }

      if (typeof industry === "number") {
        ids.add(industry);
      }
    });
  }

  if (Array.isArray(profile.industry_id) && typeof profile.industry_id[0] === "number") {
    ids.add(profile.industry_id[0]);
  }

  return Array.from(ids);
}

function normalizeManyToOneName(value: RawInfluencerProfile["industry_id"]) {
  if (Array.isArray(value) && typeof value[1] === "string") {
    return value[1];
  }

  return "";
}

async function fetchInfluencerFieldNames(uid: number, config = getOdooConfig()) {
  const fields = await executeKw<OdooFieldMap>(
    uid,
    "influencer.profile",
    "fields_get",
    [],
    {
      attributes: ["string"],
    },
    config,
  );

  const fieldNames: InfluencerFieldNames = {
    name: pickField(fields, ["name"]),
    handle: pickField(fields, ["handle"]),
    platform: pickField(fields, ["platform"]),
    followers: pickField(fields, ["follower_count", "followers", "followerCount"]),
    avgViews: pickField(fields, ["avg_food_views", "avgFoodViews", "avg_views"]),
    addisAudience: pickField(fields, [
      "addis_audience_percent",
      "addisAudiencePercent",
      "addis_audience_pct",
    ]),
    roiMultiplier: pickField(fields, ["roi_multiplier", "roiMultiplier"]),
    matchScore: pickField(fields, ["match_score", "matchScore"]),
    industryRelation: pickField(fields, ["industry_id", "industry_ids", "industry"]),
    locationFocus: pickField(fields, ["location_focus", "locationFocus"]),
    bio: pickField(fields, ["bio"]),
  };

  return fieldNames;
}

function buildProfileFields(fieldNames: InfluencerFieldNames) {
  return Array.from(
    new Set(
      [
        "name",
        fieldNames.handle,
        fieldNames.platform,
        fieldNames.followers,
        fieldNames.avgViews,
        fieldNames.addisAudience,
        fieldNames.roiMultiplier,
        fieldNames.matchScore,
        fieldNames.industryRelation,
        fieldNames.locationFocus,
        fieldNames.bio,
      ].filter((field): field is string => Boolean(field)),
    ),
  );
}

async function fetchIndustryNames(
  ids: number[],
  uid: number,
  config = getOdooConfig(),
) {
  if (ids.length === 0) {
    return new Map<number, string>();
  }

  const industries = await executeKw<OdooIndustry[]>(
    uid,
    "influencer.industry",
    "search_read",
    [[["id", "in", ids]]],
    {
      fields: ["name"],
    },
    config,
  );

  return new Map(
    industries.map((industry) => [
      industry.id,
      asString(industry.name, `Industry ${industry.id}`),
    ]),
  );
}

function normalizeInfluencer(
  profile: RawInfluencerProfile,
  industryNames: Map<number, string>,
): InfluencerDetail {
  const record = profile as Record<string, unknown>;
  const name = asString(profile.name, `Influencer ${profile.id}`);
  const industryIds = normalizeIndustryIds(profile);
  const industryId = industryIds[0] ?? null;
  const industryName =
    (industryId ? industryNames.get(industryId) : undefined) ||
    normalizeManyToOneName(profile.industry_id) ||
    asString(profile.industry, "Emerging Sector");
  const followers = asNumber(
    valueFromAliases<number | false>(record, [
      "follower_count",
      "followers",
      "followerCount",
    ]),
  );
  const avgFoodViews = asNumber(
    valueFromAliases<number | false>(record, [
      "avg_food_views",
      "avgFoodViews",
      "avg_views",
    ]),
  );
  const addisAudiencePercent = asNumber(
    valueFromAliases<number | false>(record, [
      "addis_audience_percent",
      "addisAudiencePercent",
      "addis_audience_pct",
    ]),
  );
  const roiMultiplier = asNumber(
    valueFromAliases<number | false>(record, ["roi_multiplier", "roiMultiplier"]),
  );
  const existingMatchScore = asNumber(
    valueFromAliases<number | false>(record, ["match_score", "matchScore"]),
    -1,
  );

  return {
    id: profile.id,
    name,
    handle:
      asString(profile.handle) ||
      `@${name.toLowerCase().replace(/[^a-z0-9]+/g, "").slice(0, 18)}`,
    platform: asString(profile.platform, "Creator"),
    followers,
    avgFoodViews,
    addisAudiencePercent,
    roiMultiplier,
    matchScore:
      existingMatchScore >= 0
        ? existingMatchScore
        : calculateMatchScore({
            roiMultiplier,
            addisAudiencePercent,
            followers,
            avgFoodViews,
          }),
    industry: industryName,
    industryId,
    locationFocus: asString(profile.location_focus ?? profile.locationFocus, "Ethiopia"),
    bio:
      asString(profile.bio) ||
      "Audience intelligence, category fit, and campaign history are ready for review.",
  };
}

export async function fetchInfluencerDetail(
  influencerId: number,
): Promise<InfluencerDetailResult> {
  try {
    const config = getOdooConfig();
    const uid = await authenticateServiceUser(config);
    const fieldNames = await fetchInfluencerFieldNames(uid, config);
    const profiles = await executeKw<RawInfluencerProfile[]>(
      uid,
      "influencer.profile",
      "search_read",
      [[["id", "=", influencerId]]],
      {
        fields: buildProfileFields(fieldNames),
        limit: 1,
      },
      config,
    );
    const profile = profiles[0];

    if (!profile) {
      return {
        success: false,
        status: 404,
        data: null,
        error: "Influencer not found.",
      };
    }

    const industryNames = await fetchIndustryNames(
      normalizeIndustryIds(profile),
      uid,
      config,
    );

    return {
      success: true,
      data: normalizeInfluencer(profile, industryNames),
    };
  } catch (error) {
    return {
      success: false,
      status: 502,
      data: null,
      error:
        error instanceof Error
          ? error.message
          : "Could not load influencer profile from Odoo.",
    };
  }
}
