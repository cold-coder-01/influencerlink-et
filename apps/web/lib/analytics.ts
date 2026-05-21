import "server-only";

import {
  authenticateServiceUser,
  executeKw,
  getOdooConfig,
} from "@/lib/odoo-rpc";
import { calculateMatchScore } from "@/lib/match-utils";
import { normalizePlatform } from "@/lib/platform-utils";

type OdooFieldMap = Record<string, unknown>;

type RelationValue = [number, string] | false;

type RawIndustry = {
  id: number;
  name?: string | false;
  industry_weight?: number | false;
  industryWeight?: number | false;
};

type RawInfluencer = {
  id: number;
  name?: string | false;
  handle?: string | false;
  platform?: string | false;
  followers?: number | false;
  follower_count?: number | false;
  followerCount?: number | false;
  avg_food_views?: number | false;
  avgFoodViews?: number | false;
  avg_views?: number | false;
  addis_audience_percent?: number | false;
  addisAudiencePercent?: number | false;
  addis_audience_pct?: number | false;
  roi_multiplier?: number | false;
  roiMultiplier?: number | false;
  match_score?: number | false;
  matchScore?: number | false;
  industry_id?: RelationValue;
  industry_ids?: number[] | Array<[number, string]> | false;
  industry?: string | false;
};

type RawCampaign = {
  id: number;
  name?: string | false;
  platform?: string | false;
  status?: string | false;
  escrow_status?: string | false;
  roi_multiplier?: number | false;
  roiMultiplier?: number | false;
  industry_id?: RelationValue;
  influencer_id?: RelationValue;
};

type AnalyticsIndustry = {
  id: number;
  name: string;
  industryWeight: number;
};

type AnalyticsInfluencer = {
  id: number;
  name: string;
  handle: string;
  platform: string;
  roiMultiplier: number;
  matchScore: number;
  industryIds: number[];
};

type AnalyticsCampaign = {
  id: number;
  platform: string;
  status: string;
  roiMultiplier: number | null;
  industryId: number | null;
  influencerId: number | null;
};

export type AnalyticsData = {
  summary: {
    totalIndustries: number;
    totalInfluencers: number;
    totalCampaigns: number;
    avgRoiMultiplier: number;
    activeCampaigns: number;
    completedCampaigns: number;
    draftCampaigns: number;
    pendingCampaigns: number;
  };
  campaignStatus: Array<{ label: string; value: number }>;
  platformDistribution: Array<{ label: string; value: number }>;
  industryPerformance: Array<{
    industryId: number;
    industry: string;
    campaigns: number;
    influencers: number;
    avgRoiMultiplier: number;
  }>;
  topInfluencers: Array<{
    id: number;
    name: string;
    handle: string;
    platform: string;
    roiMultiplier: number;
    matchScore: number;
  }>;
};

export type AnalyticsResult =
  | { success: true; data: AnalyticsData }
  | { success: false; data: null; error: string };

const statusLabels = ["Draft", "Pending", "Active", "Completed", "Cancelled"];
const platformLabels = [
  "TikTok",
  "Instagram",
  "YouTube",
  "Telegram",
  "Multi-platform",
  "Other",
];

function hasField(fields: OdooFieldMap, field: string) {
  return Object.prototype.hasOwnProperty.call(fields, field);
}

function pickField(fields: OdooFieldMap, aliases: string[]) {
  return aliases.find((field) => hasField(fields, field));
}

function buildFields(fields: OdooFieldMap, aliases: string[][]) {
  return Array.from(
    new Set(
      aliases
        .map((fieldAliases) => pickField(fields, fieldAliases))
        .filter((field): field is string => Boolean(field)),
    ),
  );
}

function asString(value: unknown, fallback = "") {
  return typeof value === "string" && value.trim() ? value.trim() : fallback;
}

function asNumber(value: unknown, fallback = 0) {
  return typeof value === "number" && Number.isFinite(value) ? value : fallback;
}

function optionalNumber(value: unknown) {
  return typeof value === "number" && Number.isFinite(value) ? value : null;
}

function relationId(value: unknown) {
  return Array.isArray(value) && typeof value[0] === "number" ? value[0] : null;
}

function normalizeStatus(status: unknown) {
  const normalized = asString(status, "draft").toLowerCase();

  if (normalized === "funded") return "active";
  if (normalized === "released") return "completed";
  if (normalized === "refunded") return "cancelled";

  return ["draft", "pending", "active", "completed", "cancelled"].includes(normalized)
    ? normalized
    : "draft";
}

function normalizeIndustryIds(profile: RawInfluencer) {
  const ids = new Set<number>();

  if (Array.isArray(profile.industry_ids)) {
    profile.industry_ids.forEach((industry) => {
      if (Array.isArray(industry) && typeof industry[0] === "number") {
        ids.add(industry[0]);
      } else if (typeof industry === "number") {
        ids.add(industry);
      }
    });
  }

  const industryId = relationId(profile.industry_id);

  if (industryId) {
    ids.add(industryId);
  }

  return Array.from(ids);
}

function average(values: number[]) {
  const validValues = values.filter((value) => Number.isFinite(value) && value > 0);

  if (validValues.length === 0) {
    return 0;
  }

  return Number(
    (validValues.reduce((total, value) => total + value, 0) / validValues.length).toFixed(1),
  );
}

function normalizeIndustries(industries: RawIndustry[]): AnalyticsIndustry[] {
  return industries.map((industry) => ({
    id: industry.id,
    name: asString(industry.name, `Industry ${industry.id}`),
    industryWeight: asNumber(industry.industry_weight ?? industry.industryWeight, 1),
  }));
}

function normalizeInfluencers(profiles: RawInfluencer[]): AnalyticsInfluencer[] {
  return profiles.map((profile) => {
    const record = profile as Record<string, unknown>;
    const name = asString(profile.name, `Influencer ${profile.id}`);
    const roiMultiplier = asNumber(record.roi_multiplier ?? record.roiMultiplier);
    const existingMatchScore = asNumber(record.match_score ?? record.matchScore, -1);
    const followers = asNumber(
      record.followers ?? record.follower_count ?? record.followerCount,
    );
    const avgFoodViews = asNumber(
      record.avg_food_views ?? record.avgFoodViews ?? record.avg_views,
    );
    const addisAudiencePercent = asNumber(
      record.addis_audience_percent ??
        record.addisAudiencePercent ??
        record.addis_audience_pct,
    );

    return {
      id: profile.id,
      name,
      handle:
        asString(profile.handle) ||
        `@${name.toLowerCase().replace(/[^a-z0-9]+/g, "").slice(0, 18)}`,
      platform: normalizePlatform(profile.platform),
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
      industryIds: normalizeIndustryIds(profile),
    };
  });
}

function normalizeCampaigns(campaigns: RawCampaign[]): AnalyticsCampaign[] {
  return campaigns.map((campaign) => ({
    id: campaign.id,
    platform: normalizePlatform(campaign.platform),
    status: normalizeStatus(campaign.status ?? campaign.escrow_status),
    roiMultiplier: optionalNumber(campaign.roi_multiplier ?? campaign.roiMultiplier),
    industryId: relationId(campaign.industry_id),
    influencerId: relationId(campaign.influencer_id),
  }));
}

function countByLabel<TItem>(
  labels: string[],
  items: TItem[],
  getLabel: (item: TItem) => string,
) {
  const counts = new Map(labels.map((label) => [label, 0]));

  items.forEach((item) => {
    const label = labels.includes(getLabel(item)) ? getLabel(item) : "Other";
    counts.set(label, (counts.get(label) ?? 0) + 1);
  });

  return labels.map((label) => ({ label, value: counts.get(label) ?? 0 }));
}

function buildAnalyticsData(
  industries: AnalyticsIndustry[],
  influencers: AnalyticsInfluencer[],
  campaigns: AnalyticsCampaign[],
): AnalyticsData {
  const statusCounts = new Map<string, number>();

  campaigns.forEach((campaign) => {
    statusCounts.set(campaign.status, (statusCounts.get(campaign.status) ?? 0) + 1);
  });

  const campaignRoiValues = campaigns
    .map((campaign) => campaign.roiMultiplier)
    .filter((value): value is number => typeof value === "number" && value > 0);
  const influencerRoiValues = influencers.map((influencer) => influencer.roiMultiplier);

  const industryPerformance = industries
    .map((industry) => {
      const industryCampaigns = campaigns.filter(
        (campaign) => campaign.industryId === industry.id,
      );
      const industryInfluencers = influencers.filter((influencer) =>
        influencer.industryIds.includes(industry.id),
      );
      const roiValues = [
        ...industryCampaigns
          .map((campaign) => campaign.roiMultiplier)
          .filter((value): value is number => typeof value === "number"),
        ...industryInfluencers.map((influencer) => influencer.roiMultiplier),
      ];

      return {
        industryId: industry.id,
        industry: industry.name,
        campaigns: industryCampaigns.length,
        influencers: industryInfluencers.length,
        avgRoiMultiplier: average(roiValues),
      };
    })
    .sort(
      (a, b) =>
        b.avgRoiMultiplier - a.avgRoiMultiplier ||
        b.campaigns - a.campaigns ||
        b.influencers - a.influencers,
    );

  return {
    summary: {
      totalIndustries: industries.length,
      totalInfluencers: influencers.length,
      totalCampaigns: campaigns.length,
      avgRoiMultiplier: average(
        campaignRoiValues.length > 0 ? campaignRoiValues : influencerRoiValues,
      ),
      activeCampaigns: statusCounts.get("active") ?? 0,
      completedCampaigns: statusCounts.get("completed") ?? 0,
      draftCampaigns: statusCounts.get("draft") ?? 0,
      pendingCampaigns: statusCounts.get("pending") ?? 0,
    },
    campaignStatus: countByLabel(statusLabels, campaigns, (campaign) => {
      const status = campaign.status.charAt(0).toUpperCase() + campaign.status.slice(1);
      return statusLabels.includes(status) ? status : "Draft";
    }),
    platformDistribution: countByLabel(platformLabels, [...campaigns, ...influencers], (item) =>
      platformLabels.includes(item.platform) ? item.platform : "Other",
    ),
    industryPerformance,
    topInfluencers: influencers
      .sort(
        (a, b) =>
          b.roiMultiplier - a.roiMultiplier || b.matchScore - a.matchScore,
      )
      .slice(0, 5)
      .map((influencer) => ({
        id: influencer.id,
        name: influencer.name,
        handle: influencer.handle,
        platform: influencer.platform,
        roiMultiplier: influencer.roiMultiplier,
        matchScore: Math.round(influencer.matchScore),
      })),
  };
}

export async function fetchAnalytics(): Promise<AnalyticsResult> {
  try {
    const config = getOdooConfig();
    const uid = await authenticateServiceUser(config);
    const [industryFields, influencerFields, campaignFields] = await Promise.all([
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
      executeKw<OdooFieldMap>(
        uid,
        "influencer.campaign",
        "fields_get",
        [],
        { attributes: ["string"] },
        config,
      ),
    ]);

    const industryFieldsToRead = buildFields(industryFields, [
      ["name"],
      ["industry_weight", "industryWeight"],
    ]);
    const influencerFieldsToRead = buildFields(influencerFields, [
      ["name"],
      ["handle"],
      ["platform"],
      ["followers", "follower_count", "followerCount"],
      ["avg_food_views", "avgFoodViews", "avg_views"],
      ["addis_audience_percent", "addisAudiencePercent", "addis_audience_pct"],
      ["roi_multiplier", "roiMultiplier"],
      ["match_score", "matchScore"],
      ["industry_ids", "industry_id", "industry"],
    ]);
    const campaignFieldsToRead = buildFields(campaignFields, [
      ["name"],
      ["platform"],
      ["status", "escrow_status"],
      ["roi_multiplier", "roiMultiplier"],
      ["industry_id"],
      ["influencer_id"],
    ]);

    const [rawIndustries, rawInfluencers, rawCampaigns] = await Promise.all([
      executeKw<RawIndustry[]>(
        uid,
        "influencer.industry",
        "search_read",
        [hasField(industryFields, "active") ? [["active", "=", true]] : []],
        {
          fields: industryFieldsToRead,
          order: "name asc",
        },
        config,
      ),
      executeKw<RawInfluencer[]>(
        uid,
        "influencer.profile",
        "search_read",
        [[]],
        {
          fields: influencerFieldsToRead,
          order: pickField(influencerFields, ["roi_multiplier", "roiMultiplier"])
            ? `${pickField(influencerFields, ["roi_multiplier", "roiMultiplier"])} desc`
            : "id desc",
        },
        config,
      ),
      executeKw<RawCampaign[]>(
        uid,
        "influencer.campaign",
        "search_read",
        [[]],
        {
          fields: campaignFieldsToRead,
          order: hasField(campaignFields, "create_date") ? "create_date desc" : "id desc",
        },
        config,
      ),
    ]);

    return {
      success: true,
      data: buildAnalyticsData(
        normalizeIndustries(rawIndustries),
        normalizeInfluencers(rawInfluencers),
        normalizeCampaigns(rawCampaigns),
      ),
    };
  } catch (error) {
    return {
      success: false,
      data: null,
      error:
        error instanceof Error
          ? error.message
          : "Could not load analytics from Odoo.",
    };
  }
}
