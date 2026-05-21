type NewCampaignParams = {
  industryId?: number | string | null;
  influencerId?: number | string | null;
};

function withParams(path: string, params: Record<string, number | string | null | undefined>) {
  const searchParams = new URLSearchParams();

  Object.entries(params).forEach(([key, value]) => {
    if (value !== null && value !== undefined && value !== "") {
      searchParams.set(key, String(value));
    }
  });

  const query = searchParams.toString();
  return query ? `${path}?${query}` : path;
}

export const routes = {
  admin: () => "/admin",
  adminVerifications: () => "/admin/verifications",
  adminVerificationDetail: (id: number | string) => `/admin/verifications/${id}`,
  dashboard: () => "/dashboard",
  notifications: () => "/notifications",
  industries: () => "/industries",
  industryDetail: (id: number | string) => `/industries/${id}`,
  influencers: () => "/influencers",
  influencerDetail: (id: number | string) => `/influencers/${id}`,
  campaigns: () => "/campaigns",
  campaignDetail: (id: number | string) => `/campaigns/${id}`,
  newCampaign: (params: NewCampaignParams = {}) =>
    withParams("/campaigns/new", params),
  contracts: () => "/contracts",
  contractDetail: (id: number | string) => `/contracts/${id}`,
  newContract: (campaignId: number | string) =>
    withParams("/contracts/new", { campaignId }),
  payments: () => "/payments",
  paymentDetail: (id: number | string) => `/payments/${id}`,
  newPayment: (contractId: number | string) =>
    withParams("/payments/new", { contractId }),
  analytics: () => "/analytics",
  settings: () => "/settings",
  login: () => "/login",
  signup: () => "/signup",
  signupBusiness: () => "/signup/business",
  signupInfluencer: () => "/signup/influencer",
  influencerDashboard: () => "/influencer/dashboard",
  influencerProfile: () => "/influencer/profile",
  influencerSocialAccounts: () => "/influencer/social-accounts",
  influencerCampaigns: () => "/influencer/campaigns",
  influencerMessages: () => "/influencer/messages",
  influencerContracts: () => "/influencer/contracts",
  influencerEarnings: () => "/influencer/earnings",
  influencerNotifications: () => "/influencer/notifications",
};
