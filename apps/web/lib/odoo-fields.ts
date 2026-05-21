export type Many2OneValue = [number, string] | false | null | undefined;

export function hasField(fieldNames: Record<string, unknown>, fieldName: string) {
  return Object.prototype.hasOwnProperty.call(fieldNames, fieldName);
}

export function pickExistingFields(
  fieldNames: Record<string, unknown>,
  requestedFields: string[],
) {
  return requestedFields.filter((field) => hasField(fieldNames, field));
}

export function pickExistingOrder(
  fieldNames: Record<string, unknown>,
  requestedOrder: string,
) {
  const orderParts = requestedOrder
    .split(",")
    .map((part) => part.trim())
    .filter(Boolean);
  const existingOrderParts = orderParts.filter((part) => {
    const fieldName = part.split(/\s+/)[0];

    return fieldName === "id" || hasField(fieldNames, fieldName);
  });

  return existingOrderParts.length ? existingOrderParts.join(", ") : "id desc";
}

export function mapMany2One(value: Many2OneValue) {
  return {
    id: getMany2OneId(value),
    name: getMany2OneName(value),
  };
}

export function getMany2OneId(value: Many2OneValue) {
  return Array.isArray(value) && typeof value[0] === "number" ? value[0] : null;
}

export function getMany2OneName(value: Many2OneValue) {
  return Array.isArray(value) && typeof value[1] === "string" ? value[1] : null;
}

export function safeFloat(value: unknown, fallback = 0) {
  if (typeof value === "number" && Number.isFinite(value)) return value;
  if (typeof value === "string" && value.trim() && Number.isFinite(Number(value))) {
    return Number(value);
  }
  return fallback;
}

export function safeInteger(value: unknown, fallback = 0) {
  if (typeof value === "number" && Number.isInteger(value)) return value;
  if (typeof value === "string" && /^\d+$/.test(value)) return Number(value);
  return fallback;
}

export function safeString(value: unknown, fallback = "") {
  return typeof value === "string" && value.trim() ? value.trim() : fallback;
}
