export function clampScore(score: number) {
  if (!Number.isFinite(score)) return 0;
  return Math.min(100, Math.max(0, Math.round(score)));
}

export function calculateMatchScore({
  roiMultiplier,
  addisAudiencePercent,
  followers,
}: {
  roiMultiplier: number;
  addisAudiencePercent: number;
  followers: number;
  avgFoodViews?: number;
}) {
  return clampScore(
    roiMultiplier * 20 +
      addisAudiencePercent * 0.4 +
      Math.min(followers / 1000, 30),
  );
}

export function calculateAverageRoi(values: Array<number | null | undefined>) {
  const validValues = values.filter(
    (value): value is number => typeof value === "number" && Number.isFinite(value) && value > 0,
  );

  if (validValues.length === 0) return 0;

  return validValues.reduce((sum, value) => sum + value, 0) / validValues.length;
}

export function calculateAverageMatchScore(values: Array<number | null | undefined>) {
  const validValues = values.filter(
    (value): value is number => typeof value === "number" && Number.isFinite(value),
  );

  if (validValues.length === 0) return 0;

  return Math.round(
    validValues.reduce((sum, value) => sum + value, 0) / validValues.length,
  );
}

export function getSuggestedCampaignFit(industry: string) {
  const normalized = industry.toLowerCase();

  if (normalized.includes("beverage") || normalized.includes("coffee")) {
    return "Product Launch, Brand Awareness, Taste Discovery";
  }

  if (normalized.includes("real estate") || normalized.includes("property")) {
    return "Property Showcase, Lead Generation, Investment Awareness";
  }

  if (normalized.includes("textile") || normalized.includes("fashion")) {
    return "Brand Storytelling, Collection Launch, Lifestyle Campaign";
  }

  if (normalized.includes("agri")) {
    return "Awareness, B2B Trust Building, Sustainability Campaign";
  }

  return "Awareness, Conversion, Strategic Partnership";
}
