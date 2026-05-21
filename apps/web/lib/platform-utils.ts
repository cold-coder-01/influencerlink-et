export const platformOptions = [
  "TikTok",
  "Instagram",
  "YouTube",
  "Telegram",
  "Multi-platform",
] as const;

export type PlatformOption = (typeof platformOptions)[number];

const platformLabelByKey: Record<string, string> = {
  tiktok: "TikTok",
  instagram: "Instagram",
  youtube: "YouTube",
  telegram: "Telegram",
  multi_platform: "Multi-platform",
  "multi-platform": "Multi-platform",
  "Multi-platform": "Multi-platform",
};

export function normalizePlatform(platform: unknown) {
  const value = typeof platform === "string" ? platform.trim() : "";
  const normalizedKey = value.toLowerCase().replace(/[\s-]+/g, "_");

  return platformLabelByKey[normalizedKey] ?? platformLabelByKey[value] ?? (value || "Other");
}

export function getPlatformLabel(platform: unknown) {
  return normalizePlatform(platform);
}

export function getPlatformBadgeClass(platform: unknown) {
  const normalized = normalizePlatform(platform).toLowerCase();

  if (normalized.includes("instagram")) {
    return "border-[#C83CA7]/40 bg-[#C83CA7]/15 text-[#F5F2E9]";
  }

  if (normalized.includes("youtube")) {
    return "border-[#E63746]/40 bg-[#E63746]/15 text-[#F5F2E9]";
  }

  if (normalized.includes("telegram")) {
    return "border-[#3AA2E3]/40 bg-[#3AA2E3]/15 text-[#F5F2E9]";
  }

  if (normalized.includes("multi")) {
    return "border-[#45B36B]/35 bg-[#45B36B]/10 text-[#45B36B]";
  }

  return "border-[#FFD700]/35 bg-black/35 text-[#FFD700]";
}

export function getPlatformColorClass(platform: unknown) {
  const normalized = normalizePlatform(platform).toLowerCase();

  if (normalized.includes("instagram")) return "text-[#C83CA7]";
  if (normalized.includes("youtube")) return "text-[#E63746]";
  if (normalized.includes("telegram")) return "text-[#3AA2E3]";
  if (normalized.includes("multi")) return "text-[#45B36B]";
  return "text-[#FFD700]";
}

export function getPlatformIconName(platform: unknown) {
  const normalized = normalizePlatform(platform).toLowerCase();

  if (normalized.includes("instagram")) return "instagram";
  if (normalized.includes("youtube")) return "youtube";
  if (normalized.includes("telegram")) return "send";
  if (normalized.includes("multi")) return "share-2";
  if (normalized.includes("tiktok")) return "music";
  return "circle-help";
}
