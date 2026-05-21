import { getCampaignStatusTone } from "@/lib/campaign-lifecycle";

export const campaignGoalOptions = [
  "Brand Awareness",
  "Product Launch",
  "Lead Generation",
  "Store Visit",
  "Sales Conversion",
  "Strategic Partnership",
] as const;

export const budgetRangeOptions = [
  "Under 10,000 ETB",
  "10,000 - 25,000 ETB",
  "25,000 - 50,000 ETB",
  "50,000 - 100,000 ETB",
  "100,000+ ETB",
] as const;

export const locationFocusOptions = [
  "Addis Ababa - Bole",
  "Kazanchis",
  "Piassa",
  "Megenagna",
  "CMC",
  "Mexico",
  "4 Kilo",
  "Ethiopia-wide",
] as const;

export const campaignStatusOptions = [
  "All",
  "Draft",
  "Invitation Sent",
  "Active",
  "Completed",
  "Cancelled",
] as const;

export const campaignGoalValues = {
  "Brand Awareness": "brand_awareness",
  "Product Launch": "product_launch",
  "Lead Generation": "lead_generation",
  "Store Visit": "store_visit",
  "Sales Conversion": "sales_conversion",
  "Strategic Partnership": "strategic_partnership",
} as const;

export const platformValues = {
  TikTok: "tiktok",
  Instagram: "instagram",
  YouTube: "youtube",
  Telegram: "telegram",
  "Multi-platform": "multi_platform",
} as const;

export const budgetRangeValues = {
  "Under 10,000 ETB": "under_10000",
  "10,000 - 25,000 ETB": "10000_25000",
  "25,000 - 50,000 ETB": "25000_50000",
  "50,000 - 100,000 ETB": "50000_100000",
  "100,000+ ETB": "100000_plus",
} as const;

export const locationFocusValues = {
  "Addis Ababa - Bole": "bole",
  Kazanchis: "kazanchis",
  Piassa: "piassa",
  Megenagna: "megenagna",
  CMC: "cmc",
  Mexico: "mexico",
  "4 Kilo": "four_kilo",
  "Ethiopia-wide": "ethiopia_wide",
} as const;

export { normalizeCampaignStatus } from "@/lib/campaign-lifecycle";

export function invertSelectionMap(map: Record<string, string>) {
  return Object.fromEntries(
    Object.entries(map).map(([label, value]) => [value, label]),
  ) as Record<string, string>;
}

export function labelForSelection(value: string, map: Record<string, string>) {
  const labelsByValue = invertSelectionMap(map);

  return labelsByValue[value] ?? value;
}

export function valueForSelection(value: string, map: Record<string, string>) {
  return map[value] ?? value;
}

export function getCampaignStatusStyle(status: string) {
  const tone = getCampaignStatusTone(status);

  if (tone === "gold") {
    return "border-[#FFD700]/35 bg-[#FFD700]/10 text-[#FFD700]";
  }

  if (tone === "green") {
    return "border-[#45B36B]/35 bg-[#45B36B]/10 text-[#45B36B]";
  }

  if (tone === "blue") {
    return "border-[#3AA2E3]/35 bg-[#3AA2E3]/10 text-[#8FD3FF]";
  }

  if (tone === "red") {
    return "border-[#E63746]/35 bg-[#E63746]/10 text-[#FF8B95]";
  }

  return "border-white/[0.14] bg-white/[0.06] text-[#B8B3A7]";
}
