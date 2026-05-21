export function formatNumber(value: number) {
  return new Intl.NumberFormat("en-US", {
    maximumFractionDigits: 1,
  }).format(value);
}

export function formatCompactNumber(value: number) {
  return new Intl.NumberFormat("en-US", {
    maximumFractionDigits: 1,
    notation: "compact",
  }).format(value);
}

export function formatPercent(value: number, maximumFractionDigits = 0) {
  return `${value.toFixed(maximumFractionDigits)}%`;
}

export function formatCurrencyETB(value: number) {
  return new Intl.NumberFormat("en-US", {
    currency: "ETB",
    maximumFractionDigits: 0,
    style: "currency",
  }).format(value);
}

export function formatRoiMultiplier(value: number | null | undefined, fallback = "TBD") {
  return typeof value === "number" && Number.isFinite(value)
    ? `${value.toFixed(2)}x`
    : fallback;
}

export function formatDate(value: string | Date | null | undefined, fallback = "TBD") {
  if (!value) return fallback;

  const date = value instanceof Date ? value : new Date(value);

  if (Number.isNaN(date.getTime())) return fallback;

  return new Intl.DateTimeFormat("en-US", {
    day: "numeric",
    month: "short",
    year: "numeric",
  }).format(date);
}

export function formatDateRange(
  startDate: string | Date | null | undefined,
  endDate: string | Date | null | undefined,
  fallback = "TBD",
) {
  const start = formatDate(startDate, "");
  const end = formatDate(endDate, "");

  if (start && end) return `${start} - ${end}`;
  return start || end || fallback;
}

export function safeText(value: unknown, fallback = "TBD") {
  return typeof value === "string" && value.trim() ? value.trim() : fallback;
}

export function getInitials(name: string) {
  return name
    .split(" ")
    .map((part) => part[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
}
