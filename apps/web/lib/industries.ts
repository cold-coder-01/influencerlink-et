import "server-only";

import {
  authenticateServiceUser,
  executeKw,
  getOdooConfig,
} from "@/lib/odoo-rpc";
import {
  getIndustryDescription,
  type Industry,
  type IndustryDetail,
  type IndustryDetailStats,
  type IndustryInfluencer,
} from "@/lib/industry-utils";
import {
  calculateAverageMatchScore,
  calculateAverageRoi,
  calculateMatchScore,
} from "@/lib/match-utils";

type OdooFieldMap = Record<string, unknown>;

type FieldCandidate<TName extends string> = {
  aliases: TName[];
  fallback?: TName;
};

type DetailFieldNames = {
  handle?: string;
  platform?: string;
  followers?: string;
  avgViews?: string;
  addisAudience?: string;
  roiMultiplier?: string;
  matchScore?: string;
  industryRelation?: string;
};

type IndustryDetailResult =
  | {
      success: true;
      data: IndustryDetail;
    }
  | {
      success: false;
      status: 404 | 502;
      data: null;
      error: string;
    };

type RawDetailProfile = RawOdooProfile & {
  name?: string | false;
  handle?: string | false;
  platform?: string | false;
  follower_count?: number | false;
  followerCount?: number | false;
  followers?: number | false;
  avg_views?: number | false;
  avg_food_views?: number | false;
  avgFoodViews?: number | false;
  addis_audience_pct?: number | false;
  addis_audience_percent?: number | false;
  addisAudiencePercent?: number | false;
  match_score?: number | false;
  matchScore?: number | false;
  industry?: string | false;
};

type RawOdooIndustry = {
  id: number;
  name?: string | false;
  industry_weight?: number | false;
  industryWeight?: number | false;
  icon?: string | false;
};

type RawOdooProfile = {
  id: number;
  industry_ids?: number[] | [number, string][] | false;
  industry_id?: [number, string] | false;
  roi_multiplier?: number | false;
  roiMultiplier?: number | false;
};

export type IndustriesResult =
  | {
      success: true;
      data: Industry[];
    }
  | {
      success: false;
      data: [];
      error: string;
    };

function asNumber(value: number | false | undefined, fallback = 0) {
  return typeof value === "number" && Number.isFinite(value) ? value : fallback;
}

function asString(value: string | false | undefined, fallback = "") {
  return typeof value === "string" && value.length > 0 ? value : fallback;
}

function pickField<TName extends string>(
  availableFields: OdooFieldMap,
  candidate: FieldCandidate<TName>,
) {
  return (
    candidate.aliases.find((field) =>
      Object.prototype.hasOwnProperty.call(availableFields, field),
    ) ?? candidate.fallback
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

function normalizeIndustryIds(profile: RawOdooProfile) {
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

function normalizeIndustries(
  industries: RawOdooIndustry[],
  profiles: RawOdooProfile[],
): Industry[] {
  const profileStats = new Map<number, { count: number; roiTotal: number; roiCount: number }>();

  profiles.forEach((profile) => {
    const roiMultiplier = asNumber(profile.roi_multiplier ?? profile.roiMultiplier);

    normalizeIndustryIds(profile).forEach((industryId) => {
      const stats = profileStats.get(industryId) ?? {
        count: 0,
        roiTotal: 0,
        roiCount: 0,
      };

      stats.count += 1;

      if (roiMultiplier > 0) {
        stats.roiTotal += roiMultiplier;
        stats.roiCount += 1;
      }

      profileStats.set(industryId, stats);
    });
  });

  return industries.map((industry) => {
    const stats = profileStats.get(industry.id);
    const industryWeight = asNumber(
      industry.industry_weight ?? industry.industryWeight,
      1,
    );

    return {
      id: industry.id,
      name: industry.name || `Industry ${industry.id}`,
      industryWeight,
      icon: industry.icon || null,
      influencerCount: stats?.count ?? 0,
      avgRoiMultiplier:
        stats && stats.roiCount > 0 ? stats.roiTotal / stats.roiCount : undefined,
    };
  });
}

function buildStats(influencers: IndustryInfluencer[]): IndustryDetailStats {
  const influencerCount = influencers.length;
  const platforms = new Map<string, number>();

  influencers.forEach((influencer) => {
    platforms.set(
      influencer.platform,
      (platforms.get(influencer.platform) ?? 0) + 1,
    );
  });

  const topPlatform =
    [...platforms.entries()].sort((a, b) => b[1] - a[1])[0]?.[0] ?? "N/A";

  return {
    influencerCount,
    avgRoiMultiplier: calculateAverageRoi(
      influencers.map((influencer) => influencer.roiMultiplier),
    ),
    avgMatchScore: calculateAverageMatchScore(
      influencers.map((influencer) => influencer.matchScore),
    ),
    topPlatform,
  };
}

function normalizeDetailProfile(
  profile: RawDetailProfile,
  industry: Industry,
): IndustryInfluencer {
  const record = profile as Record<string, unknown>;
  const name = asString(profile.name, `Influencer ${profile.id}`);
  const followers = asNumber(
    valueFromAliases<number | false>(record, [
      "follower_count",
      "followers",
      "followerCount",
    ]),
  );
  const avgFoodViews = asNumber(
    valueFromAliases<number | false>(record, ["avg_food_views", "avgFoodViews", "avg_views"]),
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
    industry: asString(profile.industry, industry.name),
  };
}

async function fetchProfileFieldNames(uid: number, config = getOdooConfig()) {
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

  const names: DetailFieldNames = {
    handle: pickField(fields, { aliases: ["handle"] }),
    platform: pickField(fields, { aliases: ["platform"] }),
    followers: pickField(fields, {
      aliases: ["follower_count", "followers", "followerCount"],
    }),
    avgViews: pickField(fields, {
      aliases: ["avg_food_views", "avgFoodViews", "avg_views"],
    }),
    addisAudience: pickField(fields, {
      aliases: [
        "addis_audience_percent",
        "addisAudiencePercent",
        "addis_audience_pct",
      ],
    }),
    roiMultiplier: pickField(fields, {
      aliases: ["roi_multiplier", "roiMultiplier"],
    }),
    matchScore: pickField(fields, {
      aliases: ["match_score", "matchScore"],
    }),
    industryRelation: pickField(fields, {
      aliases: ["industry_ids", "industry_id", "industry"],
    }),
  };

  return names;
}

function buildProfileFields(fieldNames: DetailFieldNames) {
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
      ].filter((field): field is string => Boolean(field)),
    ),
  );
}

function buildIndustryDomain(fieldNames: DetailFieldNames, industryId: number) {
  if (fieldNames.industryRelation === "industry_ids") {
    return [["industry_ids", "in", [industryId]]];
  }

  if (fieldNames.industryRelation === "industry_id") {
    return [["industry_id", "=", industryId]];
  }

  return [["id", "=", -1]];
}

export async function fetchIndustriesOverview(): Promise<IndustriesResult> {
  try {
    const config = getOdooConfig();
    const uid = await authenticateServiceUser(config);
    const [industries, profiles] = await Promise.all([
      executeKw<RawOdooIndustry[]>(
        uid,
        "influencer.industry",
        "search_read",
        [[["active", "=", true]]],
        {
          fields: ["name", "industry_weight", "icon"],
          order: "name asc",
        },
        config,
      ),
      executeKw<RawOdooProfile[]>(
        uid,
        "influencer.profile",
        "search_read",
        [[]],
        {
          fields: ["industry_ids", "roi_multiplier"],
          order: "roi_multiplier desc",
        },
        config,
      ),
    ]);

    return {
      success: true,
      data: normalizeIndustries(industries, profiles),
    };
  } catch (error) {
    return {
      success: false,
      data: [],
      error:
        error instanceof Error
          ? error.message
          : "Could not load industries from Odoo.",
    };
  }
}

export async function fetchIndustryDetail(
  industryId: number,
): Promise<IndustryDetailResult> {
  try {
    const config = getOdooConfig();
    const uid = await authenticateServiceUser(config);
    const industries = await executeKw<RawOdooIndustry[]>(
      uid,
      "influencer.industry",
      "search_read",
      [[["id", "=", industryId], ["active", "=", true]]],
      {
        fields: ["name", "industry_weight", "icon"],
        limit: 1,
      },
      config,
    );

    const industryRecord = industries[0];

    if (!industryRecord) {
      return {
        success: false,
        status: 404,
        data: null,
        error: "Industry not found.",
      };
    }

    const industry: Industry = {
      id: industryRecord.id,
      name: industryRecord.name || `Industry ${industryRecord.id}`,
      industryWeight: asNumber(
        industryRecord.industry_weight ?? industryRecord.industryWeight,
        1,
      ),
      icon: industryRecord.icon || null,
    };
    const fieldNames = await fetchProfileFieldNames(uid, config);
    const profileFields = buildProfileFields(fieldNames);
    const profiles =
      fieldNames.industryRelation && profileFields.length > 0
        ? await executeKw<RawDetailProfile[]>(
            uid,
            "influencer.profile",
            "search_read",
            [buildIndustryDomain(fieldNames, industryId)],
            {
              fields: profileFields,
              order: fieldNames.roiMultiplier
                ? `${fieldNames.roiMultiplier} desc`
                : "id desc",
            },
            config,
          )
        : [];
    const influencers = profiles
      .map((profile) => normalizeDetailProfile(profile, industry))
      .sort((a, b) => b.matchScore - a.matchScore);
    const stats = buildStats(influencers);

    return {
      success: true,
      data: {
        industry: {
          ...industry,
          description: getIndustryDescription(industry.name),
          influencerCount: stats.influencerCount,
          avgRoiMultiplier: stats.avgRoiMultiplier || undefined,
        },
        influencers,
        stats,
      },
    };
  } catch (error) {
    return {
      success: false,
      status: 502,
      data: null,
      error:
        error instanceof Error
          ? error.message
          : "Could not load industry details from Odoo.",
    };
  }
}
