import "server-only";

import {
  authenticateServiceUser,
  executeKw,
  getOdooConfig,
  type OdooConfig,
} from "@/lib/odoo-rpc";
import type { InfluencerContract } from "@/lib/contracts";
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

export type PaymentStatus =
  | "draft"
  | "requested"
  | "deposited"
  | "released"
  | "failed"
  | "refunded"
  | "cancelled";

export type PaymentType = "escrow" | "direct" | "milestone" | "bonus";

export type PaymentMethod =
  | "manual_bank"
  | "telebirr"
  | "cbe"
  | "chapa"
  | "cash"
  | "other";

export type InfluencerPayment = {
  id: number;
  name: string;
  campaignId?: number | null;
  campaignName?: string | null;
  campaignStatus?: string | null;
  contractId?: number | null;
  contractName?: string | null;
  contractStatus?: string | null;
  businessPartnerId?: number | null;
  businessName?: string | null;
  influencerId?: number | null;
  influencerName?: string | null;
  paymentStatus: PaymentStatus;
  paymentType: PaymentType;
  amount?: number | null;
  platformFee?: number | null;
  netAmount?: number | null;
  currency?: string | null;
  paymentMethod?: PaymentMethod | null;
  transactionReference?: string | null;
  depositedAt?: string | null;
  releasedAt?: string | null;
  dueDate?: string | null;
  notes?: string | null;
  createdAt?: string | null;
};

export type PaymentCreateInput = {
  contractId: number;
  amount: number;
  platformFee?: number | null;
  paymentMethod?: PaymentMethod | null;
  dueDate?: string | null;
  notes?: string | null;
};

export type PaymentUpdateInput = Partial<
  Pick<
    PaymentCreateInput,
    "amount" | "platformFee" | "paymentMethod" | "dueDate" | "notes"
  >
> & {
  transactionReference?: string | null;
};

type RawPayment = {
  id: number;
  name?: string | false;
  campaign_id?: Many2OneValue;
  campaign_name?: string | false;
  campaign_status?: string | false;
  contract_id?: Many2OneValue;
  contract_name?: string | false;
  contract_status?: string | false;
  business_partner_id?: Many2OneValue;
  influencer_id?: Many2OneValue;
  payment_status?: string | false;
  payment_type?: string | false;
  amount?: number | false;
  platform_fee?: number | false;
  net_amount?: number | false;
  currency_id?: Many2OneValue;
  payment_method?: string | false;
  transaction_reference?: string | false;
  deposited_at?: string | false;
  released_at?: string | false;
  due_date?: string | false;
  notes?: string | false;
  created_at?: string | false;
};

type OdooFieldMap = Record<string, unknown>;

const paymentStatuses = [
  "draft",
  "requested",
  "deposited",
  "released",
  "failed",
  "refunded",
  "cancelled",
] as const;

const paymentTypes = ["escrow", "direct", "milestone", "bonus"] as const;
const paymentMethods = [
  "manual_bank",
  "telebirr",
  "cbe",
  "chapa",
  "cash",
  "other",
] as const;

const readFields = [
  "name",
  "campaign_id",
  "campaign_name",
  "campaign_status",
  "contract_id",
  "contract_name",
  "contract_status",
  "business_partner_id",
  "influencer_id",
  "payment_status",
  "payment_type",
  "amount",
  "platform_fee",
  "net_amount",
  "currency_id",
  "payment_method",
  "transaction_reference",
  "deposited_at",
  "released_at",
  "due_date",
  "notes",
  "created_at",
];

function asPaymentStatus(value: unknown): PaymentStatus {
  return paymentStatuses.includes(value as PaymentStatus)
    ? (value as PaymentStatus)
    : "draft";
}

function asPaymentType(value: unknown): PaymentType {
  return paymentTypes.includes(value as PaymentType)
    ? (value as PaymentType)
    : "escrow";
}

function asPaymentMethod(value: unknown): PaymentMethod {
  return paymentMethods.includes(value as PaymentMethod)
    ? (value as PaymentMethod)
    : "manual_bank";
}

export function normalizePayment(raw: RawPayment): InfluencerPayment {
  return {
    id: raw.id,
    name: safeString(raw.name, `Payment ${raw.id}`),
    campaignId: getMany2OneId(raw.campaign_id),
    campaignName:
      getMany2OneName(raw.campaign_id) ||
      safeString(raw.campaign_name, "") ||
      null,
    campaignStatus: safeString(raw.campaign_status, "") || null,
    contractId: getMany2OneId(raw.contract_id),
    contractName:
      getMany2OneName(raw.contract_id) ||
      safeString(raw.contract_name, "") ||
      null,
    contractStatus: safeString(raw.contract_status, "") || null,
    businessPartnerId: getMany2OneId(raw.business_partner_id),
    businessName: getMany2OneName(raw.business_partner_id),
    influencerId: getMany2OneId(raw.influencer_id),
    influencerName: getMany2OneName(raw.influencer_id),
    paymentStatus: asPaymentStatus(raw.payment_status),
    paymentType: asPaymentType(raw.payment_type),
    amount: safeFloat(raw.amount, 0) || null,
    platformFee: safeFloat(raw.platform_fee, 0) || null,
    netAmount: safeFloat(raw.net_amount, 0) || null,
    currency: getMany2OneName(raw.currency_id),
    paymentMethod: asPaymentMethod(raw.payment_method),
    transactionReference: safeString(raw.transaction_reference, "") || null,
    depositedAt: safeString(raw.deposited_at, "") || null,
    releasedAt: safeString(raw.released_at, "") || null,
    dueDate: safeString(raw.due_date, "") || null,
    notes: safeString(raw.notes, "") || null,
    createdAt: safeString(raw.created_at, "") || null,
  };
}

export function normalizePayments(raw: RawPayment[]) {
  return raw.map(normalizePayment);
}

export function getPaymentStatusLabel(status: PaymentStatus | string) {
  const labels: Record<PaymentStatus, string> = {
    cancelled: "Cancelled",
    deposited: "Deposited to Escrow",
    draft: "Draft",
    failed: "Failed",
    refunded: "Refunded",
    released: "Released",
    requested: "Payment Requested",
  };

  return labels[asPaymentStatus(status)];
}

export function getPaymentStatusTone(status: PaymentStatus | string) {
  const tones: Record<PaymentStatus, "gold" | "green" | "blue" | "red" | "gray"> = {
    cancelled: "red",
    deposited: "gold",
    draft: "gray",
    failed: "red",
    refunded: "blue",
    released: "green",
    requested: "blue",
  };

  return tones[asPaymentStatus(status)];
}

export function getPaymentTypeLabel(type: PaymentType | string) {
  const labels: Record<PaymentType, string> = {
    bonus: "Bonus",
    direct: "Direct Payment",
    escrow: "Escrow",
    milestone: "Milestone Payment",
  };

  return labels[asPaymentType(type)];
}

export function getPaymentMethodLabel(method: PaymentMethod | string | null | undefined) {
  const labels: Record<PaymentMethod, string> = {
    cash: "Cash",
    cbe: "CBE",
    chapa: "Chapa",
    manual_bank: "Manual Bank Transfer",
    other: "Other",
    telebirr: "Telebirr",
  };

  return labels[asPaymentMethod(method)];
}

export function calculateNetAmount(amount: number, platformFee?: number | null) {
  return Math.max(0, amount - (platformFee || 0));
}

export function buildDefaultPaymentFromContract(contract: InfluencerContract) {
  return {
    amount: contract.contractValue || 0,
    contractId: contract.id,
    dueDate: contract.endDate || null,
    notes: `Escrow tracking for ${contract.name}.`,
    platformFee: 0,
  };
}

export function buildPaymentCreatePayload(
  input: PaymentCreateInput & {
    campaignId?: number | null;
    businessPartnerId?: number | null;
    influencerId?: number | null;
    name?: string | null;
  },
  existingFields: OdooFieldMap,
) {
  const payload: Record<string, unknown> = {};

  if (hasField(existingFields, "name")) payload.name = input.name || "Payment";
  if (hasField(existingFields, "contract_id")) payload.contract_id = input.contractId;
  if (hasField(existingFields, "campaign_id")) payload.campaign_id = input.campaignId || false;
  if (hasField(existingFields, "business_partner_id")) {
    payload.business_partner_id = input.businessPartnerId || false;
  }
  if (hasField(existingFields, "influencer_id")) {
    payload.influencer_id = input.influencerId || false;
  }
  if (hasField(existingFields, "payment_status")) payload.payment_status = "requested";
  if (hasField(existingFields, "payment_type")) payload.payment_type = "escrow";
  if (hasField(existingFields, "amount")) payload.amount = input.amount;
  if (hasField(existingFields, "platform_fee")) payload.platform_fee = input.platformFee || 0;
  if (hasField(existingFields, "payment_method")) {
    payload.payment_method = input.paymentMethod || "manual_bank";
  }
  if (hasField(existingFields, "due_date")) payload.due_date = input.dueDate || false;
  if (hasField(existingFields, "notes")) payload.notes = input.notes || "";

  return payload;
}

export function getPaymentTimeline(payment: InfluencerPayment) {
  return [
    { label: "Requested", value: payment.createdAt, complete: true },
    {
      label: "Deposited to escrow",
      value: payment.depositedAt,
      complete: ["deposited", "released", "refunded"].includes(payment.paymentStatus),
    },
    {
      label: "Released",
      value: payment.releasedAt,
      complete: payment.paymentStatus === "released",
    },
  ];
}

async function getPaymentFields(uid: number, config: OdooConfig) {
  return executeKw<OdooFieldMap>(
    uid,
    "influencer.payment",
    "fields_get",
    [],
    { attributes: ["selection"] },
    config,
  );
}

export async function fetchPayments(
  domain: unknown[] = [],
  order = "created_at desc, id desc",
) {
  try {
    const config = getOdooConfig();
    const uid = await authenticateServiceUser(config);
    const fields = await getPaymentFields(uid, config);
    const payments = await executeKw<RawPayment[]>(
      uid,
      "influencer.payment",
      "search_read",
      [domain],
      { fields: pickExistingFields(fields, readFields), order: pickExistingOrder(fields, order) },
      config,
    );

    return { success: true as const, data: normalizePayments(payments) };
  } catch (error) {
    return {
      success: false as const,
      data: [],
      error:
        error instanceof Error
          ? error.message
          : "Could not load payments from Odoo.",
    };
  }
}

export async function fetchPayment(paymentId: number) {
  try {
    const config = getOdooConfig();
    const uid = await authenticateServiceUser(config);
    const fields = await getPaymentFields(uid, config);
    const payments = await executeKw<RawPayment[]>(
      uid,
      "influencer.payment",
      "search_read",
      [[["id", "=", paymentId]]],
      { fields: pickExistingFields(fields, readFields), limit: 1 },
      config,
    );

    if (!payments[0]) {
      return {
        success: false as const,
        data: null,
        status: 404 as const,
        error: "Payment not found.",
      };
    }

    return { success: true as const, data: normalizePayment(payments[0]) };
  } catch (error) {
    return {
      success: false as const,
      data: null,
      status: 502 as const,
      error:
        error instanceof Error
          ? error.message
          : "Could not load payment from Odoo.",
    };
  }
}

export async function createPaymentFromContract({
  contract,
  input,
}: {
  contract: InfluencerContract;
  input: PaymentCreateInput;
}) {
  try {
    const config = getOdooConfig();
    const uid = await authenticateServiceUser(config);
    const fields = await getPaymentFields(uid, config);
    const values = buildPaymentCreatePayload(
      {
        ...input,
        businessPartnerId: contract.businessPartnerId,
        campaignId: contract.campaignId,
        influencerId: contract.influencerId,
        name: `PAY / ${contract.name}`,
      },
      fields,
    );
    const paymentId = await executeKw<number>(
      uid,
      "influencer.payment",
      "create",
      [values],
      {},
      config,
    );

    return { success: true as const, data: { id: paymentId } };
  } catch (error) {
    return {
      success: false as const,
      status: 502 as const,
      error:
        error instanceof Error
          ? error.message
          : "Could not create payment in Odoo.",
    };
  }
}

export async function updatePayment(paymentId: number, input: PaymentUpdateInput) {
  try {
    const config = getOdooConfig();
    const uid = await authenticateServiceUser(config);
    const fields = await getPaymentFields(uid, config);
    const values: Record<string, unknown> = {};

    if (hasField(fields, "amount") && input.amount !== undefined) {
      values.amount = input.amount || 0;
    }
    if (hasField(fields, "platform_fee") && input.platformFee !== undefined) {
      values.platform_fee = input.platformFee || 0;
    }
    if (hasField(fields, "payment_method") && input.paymentMethod) {
      values.payment_method = input.paymentMethod;
    }
    if (hasField(fields, "due_date") && input.dueDate !== undefined) {
      values.due_date = input.dueDate || false;
    }
    if (hasField(fields, "notes") && input.notes !== undefined) {
      values.notes = input.notes || "";
    }
    if (
      hasField(fields, "transaction_reference") &&
      input.transactionReference !== undefined
    ) {
      values.transaction_reference = input.transactionReference || "";
    }

    await executeKw<boolean>(
      uid,
      "influencer.payment",
      "write",
      [[paymentId], values],
      {},
      config,
    );

    return fetchPayment(paymentId);
  } catch (error) {
    return {
      success: false as const,
      status: 502 as const,
      error:
        error instanceof Error
          ? error.message
          : "Could not update payment in Odoo.",
    };
  }
}

export async function updatePaymentStatus(
  paymentId: number,
  input: {
    status: PaymentStatus;
    transactionReference?: string | null;
  },
) {
  try {
    const config = getOdooConfig();
    const uid = await authenticateServiceUser(config);
    const fields = await getPaymentFields(uid, config);
    const now = new Date().toISOString().replace("T", " ").slice(0, 19);
    const values: Record<string, unknown> = {};

    if (hasField(fields, "payment_status")) {
      values.payment_status = input.status;
    }

    if (
      hasField(fields, "transaction_reference") &&
      input.transactionReference !== undefined
    ) {
      values.transaction_reference = input.transactionReference || "";
    }
    if (input.status === "deposited" && hasField(fields, "deposited_at")) {
      values.deposited_at = now;
    }
    if (input.status === "released" && hasField(fields, "released_at")) {
      values.released_at = now;
    }

    await executeKw<boolean>(
      uid,
      "influencer.payment",
      "write",
      [[paymentId], values],
      {},
      config,
    );

    return fetchPayment(paymentId);
  } catch (error) {
    return {
      success: false as const,
      status: 502 as const,
      error:
        error instanceof Error
          ? error.message
          : "Could not update payment status in Odoo.",
    };
  }
}
