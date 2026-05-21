import "server-only";

import {
  authenticateServiceUser,
  executeKw,
  getOdooConfig,
  type OdooConfig,
} from "@/lib/odoo-rpc";
import type { Campaign } from "@/lib/campaigns";
import {
  getMany2OneId,
  getMany2OneName,
  hasField,
  pickExistingFields,
  pickExistingOrder,
  safeFloat,
  safeString,
  type Many2OneValue,
} from "@/lib/odoo-fields";

export type ContractStatus =
  | "draft"
  | "sent"
  | "accepted"
  | "rejected"
  | "active"
  | "completed"
  | "cancelled";

export type ContractType =
  | "campaign_agreement"
  | "content_promotion"
  | "brand_ambassador"
  | "affiliate"
  | "other";

export type InfluencerContract = {
  id: number;
  name: string;
  campaignId: number;
  campaignName?: string | null;
  campaignStatus?: string | null;
  businessPartnerId?: number | null;
  businessName?: string | null;
  influencerId?: number | null;
  influencerName?: string | null;
  contractStatus: ContractStatus;
  contractType: ContractType;
  contractValue?: number | null;
  currency?: string | null;
  startDate?: string | null;
  endDate?: string | null;
  deliverables?: string | null;
  terms?: string | null;
  businessSigned: boolean;
  influencerSigned: boolean;
  businessSignedAt?: string | null;
  influencerSignedAt?: string | null;
  createdAt?: string | null;
  notes?: string | null;
};

export type ContractCreateInput = {
  campaignId: number;
  contractValue?: number | null;
  contractType?: ContractType | null;
  startDate?: string | null;
  endDate?: string | null;
  deliverables?: string | null;
  terms?: string | null;
  notes?: string | null;
};

export type ContractUpdateInput = Partial<
  Pick<
    ContractCreateInput,
    "contractValue" | "contractType" | "startDate" | "endDate" | "deliverables" | "terms" | "notes"
  >
> & {
  contractStatus?: ContractStatus;
};

type RawContract = {
  id: number;
  name?: string | false;
  campaign_id?: Many2OneValue;
  campaign_name?: string | false;
  campaign_status?: string | false;
  business_partner_id?: Many2OneValue;
  influencer_id?: Many2OneValue;
  contract_status?: string | false;
  contract_type?: string | false;
  contract_value?: number | false;
  currency_id?: Many2OneValue;
  start_date?: string | false;
  end_date?: string | false;
  deliverables?: string | false;
  terms?: string | false;
  business_signed?: boolean;
  influencer_signed?: boolean;
  business_signed_at?: string | false;
  influencer_signed_at?: string | false;
  created_at?: string | false;
  notes?: string | false;
};

type OdooFieldMap = Record<string, unknown>;

const contractStatuses = [
  "draft",
  "sent",
  "accepted",
  "rejected",
  "active",
  "completed",
  "cancelled",
] as const;

const contractTypes = [
  "campaign_agreement",
  "content_promotion",
  "brand_ambassador",
  "affiliate",
  "other",
] as const;

const readFields = [
  "name",
  "campaign_id",
  "campaign_name",
  "campaign_status",
  "business_partner_id",
  "influencer_id",
  "contract_status",
  "contract_type",
  "contract_value",
  "currency_id",
  "start_date",
  "end_date",
  "deliverables",
  "terms",
  "business_signed",
  "influencer_signed",
  "business_signed_at",
  "influencer_signed_at",
  "created_at",
  "notes",
];

function asContractStatus(value: unknown): ContractStatus {
  return contractStatuses.includes(value as ContractStatus)
    ? (value as ContractStatus)
    : "draft";
}

function asContractType(value: unknown): ContractType {
  return contractTypes.includes(value as ContractType)
    ? (value as ContractType)
    : "campaign_agreement";
}

export function normalizeContract(raw: RawContract): InfluencerContract {
  return {
    id: raw.id,
    name: safeString(raw.name, `Contract ${raw.id}`),
    campaignId: getMany2OneId(raw.campaign_id) ?? 0,
    campaignName:
      getMany2OneName(raw.campaign_id) ||
      safeString(raw.campaign_name, "") ||
      null,
    campaignStatus: safeString(raw.campaign_status, "") || null,
    businessPartnerId: getMany2OneId(raw.business_partner_id),
    businessName: getMany2OneName(raw.business_partner_id),
    influencerId: getMany2OneId(raw.influencer_id),
    influencerName: getMany2OneName(raw.influencer_id),
    contractStatus: asContractStatus(raw.contract_status),
    contractType: asContractType(raw.contract_type),
    contractValue: safeFloat(raw.contract_value, 0) || null,
    currency: getMany2OneName(raw.currency_id),
    startDate: safeString(raw.start_date, "") || null,
    endDate: safeString(raw.end_date, "") || null,
    deliverables: safeString(raw.deliverables, "") || null,
    terms: safeString(raw.terms, "") || null,
    businessSigned: Boolean(raw.business_signed),
    influencerSigned: Boolean(raw.influencer_signed),
    businessSignedAt: safeString(raw.business_signed_at, "") || null,
    influencerSignedAt: safeString(raw.influencer_signed_at, "") || null,
    createdAt: safeString(raw.created_at, "") || null,
    notes: safeString(raw.notes, "") || null,
  };
}

export function normalizeContracts(raw: RawContract[]) {
  return raw.map(normalizeContract);
}

export function getContractStatusLabel(status: ContractStatus | string) {
  const labels: Record<ContractStatus, string> = {
    accepted: "Accepted",
    active: "Active",
    cancelled: "Cancelled",
    completed: "Completed",
    draft: "Draft",
    rejected: "Rejected",
    sent: "Sent",
  };

  return labels[asContractStatus(status)];
}

export function getContractStatusTone(status: ContractStatus | string) {
  const tones: Record<ContractStatus, "gold" | "green" | "blue" | "red" | "gray"> = {
    accepted: "green",
    active: "green",
    cancelled: "red",
    completed: "blue",
    draft: "gray",
    rejected: "red",
    sent: "gold",
  };

  return tones[asContractStatus(status)];
}

export function getContractTypeLabel(type: ContractType | string) {
  const labels: Record<ContractType, string> = {
    affiliate: "Affiliate",
    brand_ambassador: "Brand Ambassador",
    campaign_agreement: "Campaign Agreement",
    content_promotion: "Content Promotion",
    other: "Other",
  };

  return labels[asContractType(type)];
}

export function buildDefaultContractFromCampaign(campaign: Campaign) {
  return {
    campaignId: campaign.id,
    deliverables:
      campaign.description ||
      `Deliver campaign content for ${campaign.name} according to the approved brief.`,
    endDate: campaign.endDate,
    startDate: campaign.startDate,
    terms:
      "Both parties agree to collaborate in good faith, follow the campaign brief, and confirm completion before payment workflow begins.",
  };
}

export function buildContractCreatePayload(
  input: ContractCreateInput & {
    businessPartnerId?: number | null;
    influencerId?: number | null;
    name?: string | null;
  },
  existingFields: OdooFieldMap,
) {
  const payload: Record<string, unknown> = {};

  if (hasField(existingFields, "name")) payload.name = input.name || "Contract";
  if (hasField(existingFields, "campaign_id")) payload.campaign_id = input.campaignId;
  if (hasField(existingFields, "business_partner_id")) {
    payload.business_partner_id = input.businessPartnerId || false;
  }
  if (hasField(existingFields, "influencer_id")) {
    payload.influencer_id = input.influencerId || false;
  }
  if (hasField(existingFields, "contract_status")) payload.contract_status = "draft";
  if (hasField(existingFields, "contract_type")) {
    payload.contract_type = input.contractType || "campaign_agreement";
  }
  if (hasField(existingFields, "contract_value")) {
    payload.contract_value = input.contractValue || 0;
  }
  if (hasField(existingFields, "start_date")) payload.start_date = input.startDate || false;
  if (hasField(existingFields, "end_date")) payload.end_date = input.endDate || false;
  if (hasField(existingFields, "deliverables")) {
    payload.deliverables = input.deliverables || "";
  }
  if (hasField(existingFields, "terms")) payload.terms = input.terms || "";
  if (hasField(existingFields, "notes")) payload.notes = input.notes || "";

  return payload;
}

async function getContractFields(uid: number, config: OdooConfig) {
  return executeKw<OdooFieldMap>(
    uid,
    "influencer.contract",
    "fields_get",
    [],
    { attributes: ["selection"] },
    config,
  );
}

export async function fetchContracts(
  domain: unknown[] = [],
  order = "created_at desc, id desc",
) {
  try {
    const config = getOdooConfig();
    const uid = await authenticateServiceUser(config);
    const fields = await getContractFields(uid, config);
    const contracts = await executeKw<RawContract[]>(
      uid,
      "influencer.contract",
      "search_read",
      [domain],
      {
        fields: pickExistingFields(fields, readFields),
        order: pickExistingOrder(fields, order),
      },
      config,
    );

    return { success: true as const, data: normalizeContracts(contracts) };
  } catch (error) {
    return {
      success: false as const,
      data: [],
      error:
        error instanceof Error
          ? error.message
          : "Could not load contracts from Odoo.",
    };
  }
}

export async function fetchContract(contractId: number) {
  try {
    const config = getOdooConfig();
    const uid = await authenticateServiceUser(config);
    const fields = await getContractFields(uid, config);
    const contracts = await executeKw<RawContract[]>(
      uid,
      "influencer.contract",
      "search_read",
      [[["id", "=", contractId]]],
      { fields: pickExistingFields(fields, readFields), limit: 1 },
      config,
    );

    if (!contracts[0]) {
      return {
        success: false as const,
        data: null,
        status: 404 as const,
        error: "Contract not found.",
      };
    }

    return { success: true as const, data: normalizeContract(contracts[0]) };
  } catch (error) {
    return {
      success: false as const,
      data: null,
      status: 502 as const,
      error:
        error instanceof Error
          ? error.message
          : "Could not load contract from Odoo.",
    };
  }
}

export async function createContractFromCampaign({
  campaign,
  input,
}: {
  campaign: Campaign;
  input: ContractCreateInput;
}) {
  try {
    const config = getOdooConfig();
    const uid = await authenticateServiceUser(config);
    const fields = await getContractFields(uid, config);
    const values = buildContractCreatePayload(
      {
        ...buildDefaultContractFromCampaign(campaign),
        ...input,
        businessPartnerId: campaign.partnerId,
        influencerId: campaign.influencerId,
        name: `CONTRACT / ${campaign.name}`,
      },
      fields,
    );
    const contractId = await executeKw<number>(
      uid,
      "influencer.contract",
      "create",
      [values],
      {},
      config,
    );

    return { success: true as const, data: { id: contractId } };
  } catch (error) {
    return {
      success: false as const,
      status: 502 as const,
      error:
        error instanceof Error
          ? error.message
          : "Could not create contract in Odoo.",
    };
  }
}

export async function updateContract(
  contractId: number,
  input: ContractUpdateInput,
) {
  try {
    const config = getOdooConfig();
    const uid = await authenticateServiceUser(config);
    const fields = await getContractFields(uid, config);
    const values: Record<string, unknown> = {};

    if (hasField(fields, "contract_status") && input.contractStatus) {
      values.contract_status = input.contractStatus;
    }
    if (hasField(fields, "contract_type") && input.contractType) {
      values.contract_type = input.contractType;
    }
    if (hasField(fields, "contract_value") && input.contractValue !== undefined) {
      values.contract_value = input.contractValue || 0;
    }
    if (hasField(fields, "start_date") && input.startDate !== undefined) {
      values.start_date = input.startDate || false;
    }
    if (hasField(fields, "end_date") && input.endDate !== undefined) {
      values.end_date = input.endDate || false;
    }
    if (hasField(fields, "deliverables") && input.deliverables !== undefined) {
      values.deliverables = input.deliverables || "";
    }
    if (hasField(fields, "terms") && input.terms !== undefined) {
      values.terms = input.terms || "";
    }
    if (hasField(fields, "notes") && input.notes !== undefined) {
      values.notes = input.notes || "";
    }

    await executeKw<boolean>(
      uid,
      "influencer.contract",
      "write",
      [[contractId], values],
      {},
      config,
    );

    return fetchContract(contractId);
  } catch (error) {
    return {
      success: false as const,
      status: 502 as const,
      error:
        error instanceof Error
          ? error.message
          : "Could not update contract in Odoo.",
    };
  }
}

export async function signContract(
  contract: InfluencerContract,
  signer: "business" | "influencer",
) {
  try {
    const config = getOdooConfig();
    const uid = await authenticateServiceUser(config);
    const fields = await getContractFields(uid, config);
    const now = new Date().toISOString().replace("T", " ").slice(0, 19);
    const willBeBusinessSigned = signer === "business" || contract.businessSigned;
    const willBeInfluencerSigned =
      signer === "influencer" || contract.influencerSigned;
    const values: Record<string, unknown> = {};

    if (signer === "business") {
      if (hasField(fields, "business_signed")) values.business_signed = true;
      if (hasField(fields, "business_signed_at")) values.business_signed_at = now;
    } else {
      if (hasField(fields, "influencer_signed")) values.influencer_signed = true;
      if (hasField(fields, "influencer_signed_at")) {
        values.influencer_signed_at = now;
      }
    }

    if (hasField(fields, "contract_status") && willBeBusinessSigned && willBeInfluencerSigned) {
      values.contract_status = "accepted";
    } else if (hasField(fields, "contract_status") && contract.contractStatus === "draft") {
      values.contract_status = "sent";
    }

    await executeKw<boolean>(
      uid,
      "influencer.contract",
      "write",
      [[contract.id], values],
      {},
      config,
    );

    return fetchContract(contract.id);
  } catch (error) {
    return {
      success: false as const,
      status: 502 as const,
      error:
        error instanceof Error
          ? error.message
          : "Could not sign contract in Odoo.",
    };
  }
}
