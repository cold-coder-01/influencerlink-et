import "server-only";

import {
  authenticateServiceUser,
  executeKw,
  getOdooConfig,
  type OdooConfig,
} from "@/lib/odoo-rpc";
import type { SessionRole } from "@/lib/auth-session";

type Many2OneValue = [number, string] | false;

type OdooModelData = {
  res_id: number;
};

type OdooUser = {
  partner_id?: Many2OneValue;
  name?: string | false;
  groups_id?: number[] | false;
};

type OdooInfluencerProfile = {
  id: number;
  handle?: string | false;
  platform?: string | false;
  bio?: string | false;
};

type OdooFieldMap = Record<string, unknown>;

export type ResolvedOdooSessionIdentity = {
  role: Extract<SessionRole, "business_owner" | "influencer" | "admin">;
  name?: string;
  partnerId?: number;
  profileId?: number;
  handle?: string;
  platform?: string;
  bio?: string;
};

function asString(value: string | false | undefined) {
  return typeof value === "string" ? value : undefined;
}

function relationId(value: Many2OneValue | undefined) {
  return Array.isArray(value) && typeof value[0] === "number" ? value[0] : undefined;
}

async function getExternalIdResId(
  serviceUid: number,
  module: string,
  name: string,
  config: OdooConfig,
) {
  const records = await executeKw<OdooModelData[]>(
    serviceUid,
    "ir.model.data",
    "search_read",
    [[["module", "=", module], ["name", "=", name]]],
    { fields: ["res_id"], limit: 1 },
    config,
  );

  return records[0]?.res_id;
}

async function fetchUser(
  serviceUid: number,
  userId: number,
  config: OdooConfig,
) {
  const users = await executeKw<OdooUser[]>(
    serviceUid,
    "res.users",
    "search_read",
    [[["id", "=", userId]]],
    { fields: ["partner_id", "name", "groups_id"], limit: 1 },
    config,
  );

  return users[0] ?? null;
}

async function fetchInfluencerProfile(
  serviceUid: number,
  partnerId: number | undefined,
  config: OdooConfig,
) {
  if (!partnerId) return null;

  const profileFields = await executeKw<OdooFieldMap>(
    serviceUid,
    "influencer.profile",
    "fields_get",
    [],
    { attributes: ["string"] },
    config,
  );
  const optionalFields = ["handle", "platform", "bio"].filter((field) =>
    Object.prototype.hasOwnProperty.call(profileFields, field),
  );
  const profiles = await executeKw<OdooInfluencerProfile[]>(
    serviceUid,
    "influencer.profile",
    "search_read",
    [[["partner_id", "=", partnerId]]],
    { fields: optionalFields, limit: 1 },
    config,
  );

  return profiles[0] ?? null;
}

function hasGroup(user: OdooUser | null, groupId: number | undefined) {
  return Boolean(
    groupId &&
      Array.isArray(user?.groups_id) &&
      user.groups_id.includes(groupId),
  );
}

export async function resolveOdooSessionIdentity(userId: number) {
  const config = getOdooConfig();
  const serviceUid = await authenticateServiceUser(config);
  const user = await fetchUser(serviceUid, userId, config);
  const partnerId = relationId(user?.partner_id);
  const systemGroupId = await getExternalIdResId(
    serviceUid,
    "base",
    "group_system",
    config,
  );
  const isSystemAdmin = hasGroup(user, systemGroupId);
  const profile = await fetchInfluencerProfile(serviceUid, partnerId, config);
  const role: ResolvedOdooSessionIdentity["role"] = isSystemAdmin
    ? "admin"
    : profile?.id
      ? "influencer"
      : "business_owner";

  return {
    role,
    name: asString(user?.name),
    partnerId,
    profileId: profile?.id,
    handle: asString(profile?.handle),
    platform: asString(profile?.platform),
    bio: asString(profile?.bio),
  };
}
