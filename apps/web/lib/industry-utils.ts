export type Industry = {
  id: number;
  name: string;
  industryWeight: number;
  icon?: string | null;
  influencerCount?: number;
  avgRoiMultiplier?: number;
};

export type IndustryInfluencer = {
  id: number;
  name: string;
  handle: string;
  platform: string;
  followers: number;
  avgFoodViews: number;
  addisAudiencePercent: number;
  roiMultiplier: number;
  matchScore: number;
  industry: string;
};

export type IndustryDetailStats = {
  influencerCount: number;
  avgRoiMultiplier: number;
  avgMatchScore: number;
  topPlatform: string;
};

export type IndustryDetail = {
  industry: Industry & {
    description: string;
  };
  influencers: IndustryInfluencer[];
  stats: IndustryDetailStats;
};

export function getIndustryImage(name: string): string {
  const normalized = name.toLowerCase();

  if (normalized.includes("agri")) {
    return "/images/dashboard/industry-agritech.jpg";
  }

  if (normalized.includes("real") || normalized.includes("estate")) {
    return "/images/dashboard/industry-real-estate.jpg";
  }

  if (normalized.includes("textile")) {
    return "/images/dashboard/industry-textile.jpg";
  }

  if (normalized.includes("craft")) {
    return "/images/dashboard/industry-craft.jpg";
  }

  if (normalized.includes("beverage") || normalized.includes("coffee")) {
    return "/images/dashboard/industry-beverage.jpg";
  }

  return "/images/dashboard/hero-addis-night.jpg";
}

export function getIndustryDescription(name: string): string {
  const normalized = name.toLowerCase();

  if (normalized.includes("agri")) {
    return "Connect agricultural innovators with creators who can translate growth, sustainability, and technology into market trust.";
  }

  if (normalized.includes("real") || normalized.includes("estate")) {
    return "Promote properties, developments, and investment opportunities through trusted digital voices.";
  }

  if (normalized.includes("textile")) {
    return "Showcase Ethiopian fashion, fabrics, and manufacturing stories with culturally aligned influencers.";
  }

  if (normalized.includes("craft")) {
    return "Bring handmade products, artisans, and heritage brands to wider digital audiences.";
  }

  if (normalized.includes("beverage") || normalized.includes("coffee")) {
    return "Grow beverage brands with creators who can drive visibility, taste discovery, and customer demand.";
  }

  return "Discover creators who can help this sector build awareness, trust, and measurable business growth.";
}

export function formatIndustryWeight(value: number): string {
  return `${value.toFixed(2)}x`;
}
