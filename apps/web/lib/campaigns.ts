import "server-only";

import {
  authenticateServiceUser,
  executeKw,
  getOdooConfig,
  type OdooConfig,
} from "@/lib/odoo-rpc";
import {
  budgetRangeValues,
  campaignGoalValues,
  labelForSelection,
  locationFocusValues,
  platformValues,
  valueForSelection,
} from "@/lib/campaign-utils";
import {
  normalizeCampaignStatus,
  type CampaignStatus,
} from "@/lib/campaign-lifecycle";
import type { OdooDomain } from "@/lib/permissions";

type OdooFieldMap = Record<string, { selection?: Array<[string, string]> }>;

const MODULE_UPGRADE_MESSAGE =
  "Campaign brief fields are not available in Odoo yet. Upgrade the ethio_influencer_pro module and try again.";

const requiredBriefFields = [
  "business_name",
  "campaign_goal",
  "platform",
  "budget_range",
  "location_focus",
  "start_date",
  "end_date",
  "description",
  "status",
  "roi_multiplier",
] as const;

type RawCampaign = {
  id: number;
  name?: string | false;
  partner_id?: [number, string] | false;
  business_name?: string | false;
  businessName?: string | false;
  campaign_goal?: string | false;
  campaignGoal?: string | false;
  platform?: string | false;
  industry_id?: [number, string] | false;
  industry?: string | false;
  influencer_id?: [number, string] | false;
  influencer?: string | false;
  budget_range?: string | false;
  budgetRange?: string | false;
  location_focus?: string | false;
  locationFocus?: string | false;
  start_date?: string | false;
  startDate?: string | false;
  end_date?: string | false;
  endDate?: string | false;
  description?: string | false;
  status?: string | false;
  escrow_status?: string | false;
  roi_multiplier?: number | false;
  roiMultiplier?: number | false;
  escrow_balance?: number | false;
  promo_code?: string | false;
};

export type Campaign = {
  id: number;
  name: string;
  partnerId?: number | null;
  businessName?: string | null;
  campaignGoal?: string | null;
  platform?: string | null;
  industryId?: number | null;
  industry?: string | null;
  influencerId?: number | null;
  influencer?: string | null;
  budgetRange?: string | null;
  locationFocus?: string | null;
  startDate?: string | null;
  endDate?: string | null;
  description?: string | null;
  status: string;
  roiMultiplier?: number | null;
};

export type CampaignInput = {
  title: string;
  businessName: string;
  campaignGoal: string;
  platform: string;
  industryId?: number | null;
  influencerId?: number | null;
  budgetRange: string;
  locationFocus: string;
  startDate?: string;
  endDate?: string;
  description: string;
  status: "draft" | "pending";
  roiMultiplier?: number | null;
};

export type CampaignsResult =
  | { success: true; data: Campaign[] }
  | { success: false; data: []; error: string };

export type CampaignResult =
  | { success: true; data: Campaign }
  | { success: false; data: null; status: 404 | 502; error: string };

export type CampaignCreateResult =
  | { success: true; data: { id: number; message: string; warning?: string } }
  | { success: false; status: 400 | 502; error: string };

export type CampaignStatusUpdateResult =
  | { success: true; data: { id: number; status: CampaignStatus } }
  | { success: false; status: 400 | 502; error: string };

function asString(value: string | false | undefined, fallback = "") {
  return typeof value === "string" && value.length > 0 ? value : fallback;
}

function asNumber(value: number | false | undefined) {
  return typeof value === "number" && Number.isFinite(value) ? value : null;
}

function relationId(value: [number, string] | false | undefined) {
  return Array.isArray(value) && typeof value[0] === "number" ? value[0] : null;
}

function relationName(value: [number, string] | false | undefined) {
  return Array.isArray(value) && typeof value[1] === "string" ? value[1] : null;
}

function hasField(fields: OdooFieldMap, field: string) {
  return Object.prototype.hasOwnProperty.call(fields, field);
}

function pickField(fields: OdooFieldMap, aliases: string[]) {
  return aliases.find((field) => hasField(fields, field));
}

function selectionHasValue(fields: OdooFieldMap, field: string, value: string) {
  return Boolean(fields[field]?.selection?.some(([key]) => key === value));
}

function normalizeCampaign(campaign: RawCampaign): Campaign {
  return {
    id: campaign.id,
    name: asString(campaign.name, `Campaign ${campaign.id}`),
    partnerId: relationId(campaign.partner_id),
    businessName: asString(campaign.business_name ?? campaign.businessName) || null,
    campaignGoal:
      labelForSelection(
        asString(campaign.campaign_goal ?? campaign.campaignGoal),
        campaignGoalValues,
      ) || null,
    platform: labelForSelection(asString(campaign.platform), platformValues) || null,
    industryId: relationId(campaign.industry_id),
    industry: relationName(campaign.industry_id) ?? asString(campaign.industry) ?? null,
    influencerId: relationId(campaign.influencer_id),
    influencer:
      relationName(campaign.influencer_id) ?? asString(campaign.influencer) ?? null,
    budgetRange:
      labelForSelection(
        asString(campaign.budget_range ?? campaign.budgetRange),
        budgetRangeValues,
      ) || null,
    locationFocus:
      labelForSelection(
        asString(campaign.location_focus ?? campaign.locationFocus),
        locationFocusValues,
      ) || null,
    startDate: asString(campaign.start_date ?? campaign.startDate) || null,
    endDate: asString(campaign.end_date ?? campaign.endDate) || null,
    description: asString(campaign.description) || null,
    status: normalizeCampaignStatus(
      asString(campaign.status ?? campaign.escrow_status, "draft"),
    ),
    roiMultiplier: asNumber(campaign.roi_multiplier ?? campaign.roiMultiplier),
  };
}

function hasRequiredBriefFields(fields: OdooFieldMap) {
  return requiredBriefFields.every((field) => hasField(fields, field));
}

async function getCampaignFields(uid: number, config: OdooConfig) {
  return executeKw<OdooFieldMap>(
    uid,
    "influencer.campaign",
    "fields_get",
    [],
    { attributes: ["selection"] },
    config,
  );
}

function buildReadFields(fields: OdooFieldMap) {
  const optionalFields = [
    "business_name",
    "businessName",
    "campaign_goal",
    "campaignGoal",
    "platform",
    "budget_range",
    "budgetRange",
    "location_focus",
    "locationFocus",
    "start_date",
    "startDate",
    "end_date",
    "endDate",
    "description",
    "status",
    "escrow_status",
    "roi_multiplier",
    "roiMultiplier",
    "escrow_balance",
    "promo_code",
  ].filter((field) => hasField(fields, field));

  return Array.from(
    new Set([
      "name",
      hasField(fields, "partner_id") ? "partner_id" : null,
      hasField(fields, "industry_id") ? "industry_id" : null,
      hasField(fields, "influencer_id") ? "influencer_id" : null,
      ...optionalFields,
    ].filter((field): field is string => Boolean(field))),
  );
}

function createPromoCode(industryId: number, influencerId: number | null) {
  return `ILET-${industryId}-${influencerId || "OPEN"}-${Date.now()
    .toString(36)
    .toUpperCase()}`;
}

async function getPartnerIdForUser(
  uid: number,
  userId: number,
  config: OdooConfig,
) {
  const users = await executeKw<Array<{ partner_id?: [number, string] | false }>>(
    uid,
    "res.users",
    "search_read",
    [[["id", "=", userId]]],
    { fields: ["partner_id"], limit: 1 },
    config,
  );

  return relationId(users[0]?.partner_id);
}

export async function fetchCampaigns(
  domain: OdooDomain = [],
): Promise<CampaignsResult> {
  try {
    const config = getOdooConfig();
    const uid = await authenticateServiceUser(config);
    const fields = await getCampaignFields(uid, config);
    const campaigns = await executeKw<RawCampaign[]>(
      uid,
      "influencer.campaign",
      "search_read",
      [domain],
      {
        fields: buildReadFields(fields),
        order: "create_date desc",
      },
      config,
    );

    return { success: true, data: campaigns.map(normalizeCampaign) };
  } catch (error) {
    return {
      success: false,
      data: [],
      error:
        error instanceof Error
          ? error.message
          : "Could not load campaigns from Odoo.",
    };
  }
}

export async function fetchCampaign(campaignId: number): Promise<CampaignResult> {
  try {
    const config = getOdooConfig();
    const uid = await authenticateServiceUser(config);
    const fields = await getCampaignFields(uid, config);
    const campaigns = await executeKw<RawCampaign[]>(
      uid,
      "influencer.campaign",
      "search_read",
      [[["id", "=", campaignId]]],
      {
        fields: buildReadFields(fields),
        limit: 1,
      },
      config,
    );

    if (!campaigns[0]) {
      return {
        success: false,
        data: null,
        status: 404,
        error: "Campaign not found.",
      };
    }

    return { success: true, data: normalizeCampaign(campaigns[0]) };
  } catch (error) {
    return {
      success: false,
      data: null,
      status: 502,
      error:
        error instanceof Error
          ? error.message
          : "Could not load campaign from Odoo.",
    };
  }
}

export async function fetchCampaignForDomain(
  campaignId: number,
  domain: OdooDomain = [],
): Promise<CampaignResult> {
  try {
    const config = getOdooConfig();
    const uid = await authenticateServiceUser(config);
    const fields = await getCampaignFields(uid, config);
    const campaigns = await executeKw<RawCampaign[]>(
      uid,
      "influencer.campaign",
      "search_read",
      [[["id", "=", campaignId], ...domain]],
      {
        fields: buildReadFields(fields),
        limit: 1,
      },
      config,
    );

    if (!campaigns[0]) {
      return {
        success: false,
        data: null,
        status: 404,
        error: "Campaign not found.",
      };
    }

    return { success: true, data: normalizeCampaign(campaigns[0]) };
  } catch (error) {
    console.error("Could not load campaign from Odoo.", error);

    return {
      success: false,
      data: null,
      status: 502,
      error: "Could not load campaign from Odoo.",
    };
  }
}

export async function createCampaign({
  input,
  userId,
  partnerId,
}: {
  input: CampaignInput;
  userId: number;
  partnerId?: number;
}): Promise<CampaignCreateResult> {
  if (!input.title.trim()) {
    return { success: false, status: 400, error: "Campaign title is required." };
  }

  if (!input.businessName.trim()) {
    return { success: false, status: 400, error: "Business name is required." };
  }

  if (!input.description.trim()) {
    return {
      success: false,
      status: 400,
      error: "Campaign description is required.",
    };
  }

  if (!input.industryId) {
    return { success: false, status: 400, error: "industryId is required." };
  }

  try {
    const config = getOdooConfig();
    const uid = await authenticateServiceUser(config);
    const fields = await getCampaignFields(uid, config);
    const resolvedPartnerId =
      partnerId ?? (await getPartnerIdForUser(uid, userId, config));

    if (!resolvedPartnerId) {
      return {
        success: false,
        status: 400,
        error:
          "Campaign creation requires a signed-in business account linked to an Odoo partner.",
      };
    }

    const values: Record<string, unknown> = {
      name: input.title.trim(),
    };

    if (hasField(fields, "partner_id")) values.partner_id = resolvedPartnerId;
    if (hasField(fields, "industry_id")) values.industry_id = input.industryId;
    if (hasField(fields, "influencer_id")) {
      values.influencer_id = input.influencerId || false;
    }

    if (!hasRequiredBriefFields(fields)) {
      return {
        success: false,
        status: 502,
        error: MODULE_UPGRADE_MESSAGE,
      };
    }

    const directMappings: Array<[keyof CampaignInput, string[]]> = [
      ["businessName", ["business_name", "businessName"]],
      ["startDate", ["start_date", "startDate"]],
      ["endDate", ["end_date", "endDate"]],
      ["description", ["description"]],
      ["roiMultiplier", ["roi_multiplier", "roiMultiplier"]],
    ];

    directMappings.forEach(([inputKey, aliases]) => {
      const field = pickField(fields, aliases);
      const value = input[inputKey];

      if (field && value !== undefined && value !== null && value !== "") {
        values[field] = value;
      }
    });

    const selectionMappings: Array<[string, string, Record<string, string>]> = [
      ["campaign_goal", input.campaignGoal, campaignGoalValues],
      ["platform", input.platform, platformValues],
      ["budget_range", input.budgetRange, budgetRangeValues],
      ["location_focus", input.locationFocus, locationFocusValues],
    ];

    for (const [field, label, map] of selectionMappings) {
      const value = valueForSelection(label, map);

      if (hasField(fields, field) && selectionHasValue(fields, field, value)) {
        values[field] = value;
      }
    }

    const statusField = pickField(fields, ["status"]);
    const statusSelection = statusField ? fields[statusField]?.selection ?? [] : [];
    const requestedStatus =
      input.status === "pending" && statusSelection.some(([key]) => key === "pending")
        ? "pending"
        : "draft";
    const statusWarning =
      input.status === "pending" && requestedStatus !== "pending"
        ? "Odoo does not expose pending campaign status yet, so the campaign was saved as a draft. Upgrade the ethio_influencer_pro module and try again."
        : undefined;

    if (statusField) {
      values[statusField] = statusSelection.some(([key]) => key === requestedStatus)
        ? requestedStatus
        : statusSelection[0]?.[0];
    } else if (hasField(fields, "escrow_status")) {
      values.escrow_status = "pending";
    }

    if (hasField(fields, "escrow_balance")) values.escrow_balance = 0;
    if (hasField(fields, "promo_code")) {
      values.promo_code = createPromoCode(input.industryId, input.influencerId ?? null);
    }

    const campaignId = await executeKw<number>(
      uid,
      "influencer.campaign",
      "create",
      [values],
      {},
      config,
    );

    return {
      success: true,
      data: {
        id: campaignId,
        message:
          requestedStatus === "pending"
            ? "Campaign invitation created successfully"
            : "Campaign draft created successfully",
        warning: statusWarning,
      },
    };
  } catch (error) {
    const message =
      error instanceof Error
        ? error.message
        : "Could not create campaign in Odoo.";

    return {
      success: false,
      status: 502,
      error: /Invalid field|unknown field|does not exist/i.test(message)
        ? MODULE_UPGRADE_MESSAGE
        : message,
    };
  }
}

export async function updateCampaignStatus(
  campaignId: number,
  status: CampaignStatus,
): Promise<CampaignStatusUpdateResult> {
  try {
    const config = getOdooConfig();
    const uid = await authenticateServiceUser(config);
    const fields = await getCampaignFields(uid, config);

    if (!hasField(fields, "status")) {
      return {
        success: false,
        status: 502,
        error: "Campaign status field is not available in Odoo.",
      };
    }

    if (!selectionHasValue(fields, "status", status)) {
      return {
        success: false,
        status: 400,
        error: "Invalid campaign status.",
      };
    }

    await executeKw<boolean>(
      uid,
      "influencer.campaign",
      "write",
      [[campaignId], { status }],
      {},
      config,
    );

    return { success: true, data: { id: campaignId, status } };
  } catch (error) {
    console.error("Could not update campaign status in Odoo.", error);

    return {
      success: false,
      status: 502,
      error: "Could not update campaign status in Odoo.",
    };
  }
}
