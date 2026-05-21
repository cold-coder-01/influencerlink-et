import { SocialAccountReviewActions } from "@/components/admin/SocialAccountReviewActions";
import { ButtonLink } from "@/components/ui/Button";
import { EmptyState } from "@/components/ui/EmptyState";
import { ErrorState } from "@/components/ui/ErrorState";
import { GlassCard } from "@/components/ui/GlassCard";
import { KpiCard } from "@/components/ui/KpiCard";
import { PageHeader } from "@/components/ui/PageHeader";
import { SearchFilterBar } from "@/components/ui/SearchFilterBar";
import { SectionHeader } from "@/components/ui/SectionHeader";
import { StatusBadge } from "@/components/ui/StatusBadge";
import {
  formatCompactNumber,
  formatDate,
  formatPercent,
} from "@/lib/formatters";
import { routes } from "@/lib/routes";
import {
  fetchSocialAccountsByDomain,
  getSocialPlatformLabel,
  getVerificationStatusLabel,
  getVerificationStatusTone,
  type InfluencerSocialAccount,
  type SocialPlatform,
  type VerificationStatus,
} from "@/lib/social-accounts";

export const dynamic = "force-dynamic";

const platformOptions: Array<{ value: SocialPlatform | "all"; label: string }> = [
  { value: "all", label: "All" },
  { value: "tiktok", label: "TikTok" },
  { value: "instagram", label: "Instagram" },
  { value: "youtube", label: "YouTube" },
  { value: "telegram", label: "Telegram" },
  { value: "facebook", label: "Facebook" },
  { value: "linkedin", label: "LinkedIn" },
  { value: "x_twitter", label: "X / Twitter" },
  { value: "other", label: "Other" },
];

const statusOptions: Array<{ value: VerificationStatus | "all"; label: string }> = [
  { value: "all", label: "All" },
  { value: "pending", label: "Pending Review" },
  { value: "verified", label: "Verified" },
  { value: "rejected", label: "Rejected" },
  { value: "needs_review", label: "Needs Review" },
  { value: "draft", label: "Draft" },
];

type SearchParams = Record<string, string | string[] | undefined>;

function getParam(searchParams: SearchParams, key: string) {
  const value = searchParams[key];
  return Array.isArray(value) ? value[0] ?? "" : value ?? "";
}

function isPlatform(value: string): value is SocialPlatform {
  return platformOptions.some((option) => option.value === value && value !== "all");
}

function isStatus(value: string): value is VerificationStatus {
  return statusOptions.some((option) => option.value === value && value !== "all");
}

function filterAccounts(
  accounts: InfluencerSocialAccount[],
  q: string,
  status: string,
  platform: string,
) {
  const normalizedQuery = q.trim().toLowerCase();

  return accounts.filter((account) => {
    const statusMatches = !isStatus(status) || account.verificationStatus === status;
    const platformMatches = !isPlatform(platform) || account.platform === platform;
    const queryMatches =
      !normalizedQuery ||
      [
        account.handle,
        account.influencerName,
        account.name,
        account.platform,
        account.profileUrl,
      ]
        .filter(Boolean)
        .some((value) => String(value).toLowerCase().includes(normalizedQuery));

    return statusMatches && platformMatches && queryMatches;
  });
}

export default async function AdminVerificationsPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) {
  const params = await searchParams;
  const q = getParam(params, "q");
  const status = getParam(params, "status");
  const platform = getParam(params, "platform");
  const result = await fetchSocialAccountsByDomain([]);

  if (!result.success) {
    return (
      <ErrorState
        description="Could not load social account submissions from Odoo."
        title="Verification queue unavailable"
      />
    );
  }

  const accounts = result.data;
  const filteredAccounts = filterAccounts(accounts, q, status, platform);
  const stats = {
    needsReview: accounts.filter((account) => account.verificationStatus === "needs_review").length,
    pending: accounts.filter((account) => account.verificationStatus === "pending").length,
    rejected: accounts.filter((account) => account.verificationStatus === "rejected").length,
    total: accounts.length,
    verified: accounts.filter((account) => account.verificationStatus === "verified").length,
  };

  return (
    <div className="space-y-5">
      <PageHeader
        eyebrow="ADMIN"
        subtitle="Review influencer social accounts, verify platform ownership, and maintain trusted marketplace data."
        title="Verification Queue"
      />

      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
        <KpiCard label="Total Accounts" value={String(stats.total)} />
        <KpiCard label="Pending Review" value={String(stats.pending)} />
        <KpiCard label="Verified" tone="green" value={String(stats.verified)} />
        <KpiCard label="Rejected" tone="danger" value={String(stats.rejected)} />
        <KpiCard label="Needs Review" tone="neutral" value={String(stats.needsReview)} />
      </section>

      <SearchFilterBar>
        <form className="grid gap-3 md:grid-cols-[minmax(0,1fr)_220px_220px_auto]" action={routes.adminVerifications()}>
          <input
            className="min-h-11 rounded-xl border border-white/[0.10] bg-[#10100d] px-4 py-3 text-sm text-[#F5F2E9] outline-none transition placeholder:text-[#B8B3A7]/70 focus:border-[#FFD700]/60"
            defaultValue={q}
            name="q"
            placeholder="Search influencer, handle, or platform"
            type="search"
          />
          <select
            className="min-h-11 rounded-xl border border-white/[0.10] bg-[#10100d] px-4 py-3 text-sm text-[#F5F2E9] outline-none transition focus:border-[#FFD700]/60"
            defaultValue={isStatus(status) ? status : "all"}
            name="status"
          >
            {statusOptions.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
          <select
            className="min-h-11 rounded-xl border border-white/[0.10] bg-[#10100d] px-4 py-3 text-sm text-[#F5F2E9] outline-none transition focus:border-[#FFD700]/60"
            defaultValue={isPlatform(platform) ? platform : "all"}
            name="platform"
          >
            {platformOptions.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
          <button className="min-h-11 rounded-xl bg-[#FFD700] px-5 py-3 text-sm font-bold text-[#121212] transition hover:bg-[#E6C200]" type="submit">
            Apply
          </button>
        </form>
      </SearchFilterBar>

      <GlassCard className="p-5 sm:p-6">
        <SectionHeader
          subtitle="Manual review is the MVP workflow. No live platform scraping or OAuth sync is run from this queue."
          title="Submitted Accounts"
        />
        {filteredAccounts.length ? (
          <div className="mt-5 overflow-x-auto overscroll-x-contain pb-2">
            <table className="w-full min-w-[1060px] border-separate border-spacing-y-3 text-left">
              <thead className="text-xs uppercase text-[#B8B3A7]">
                <tr>
                  <th className="px-3 py-2">Influencer</th>
                  <th className="px-3 py-2">Platform</th>
                  <th className="px-3 py-2">Handle</th>
                  <th className="px-3 py-2">Status</th>
                  <th className="px-3 py-2">Metrics</th>
                  <th className="px-3 py-2">Dates</th>
                  <th className="px-3 py-2">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredAccounts.map((account) => (
                  <tr className="rounded-2xl bg-black/20 align-top" key={account.id}>
                    <td className="rounded-l-2xl border-y border-l border-white/[0.08] px-3 py-4">
                      <p className="font-semibold text-[#F5F2E9]">
                        {account.influencerName || "Unknown influencer"}
                      </p>
                      <p className="mt-1 text-xs text-[#B8B3A7]">ID {account.influencerId}</p>
                    </td>
                    <td className="border-y border-white/[0.08] px-3 py-4">
                      <StatusBadge tone="gold">{getSocialPlatformLabel(account.platform)}</StatusBadge>
                    </td>
                    <td className="border-y border-white/[0.08] px-3 py-4">
                      <p className="font-semibold text-[#F5F2E9]">{account.handle}</p>
                      {account.profileUrl ? (
                        <a
                          className="mt-1 block max-w-[220px] break-all text-xs text-[#FFD700] hover:text-[#E6C200]"
                          href={account.profileUrl}
                          rel="noreferrer"
                          target="_blank"
                        >
                          {account.profileUrl}
                        </a>
                      ) : null}
                    </td>
                    <td className="border-y border-white/[0.08] px-3 py-4">
                      <StatusBadge tone={getVerificationStatusTone(account.verificationStatus)}>
                        {getVerificationStatusLabel(account.verificationStatus)}
                      </StatusBadge>
                    </td>
                    <td className="border-y border-white/[0.08] px-3 py-4 text-sm text-[#B8B3A7]">
                      <p>Followers {formatCompactNumber(account.followersCount ?? 0)}</p>
                      <p>Avg Views {formatCompactNumber(account.avgViews ?? 0)}</p>
                      <p>Engagement {formatPercent(account.engagementRate ?? 0, 2)}</p>
                      <p>Addis {formatPercent(account.audienceAddisPercent ?? 0)}</p>
                    </td>
                    <td className="border-y border-white/[0.08] px-3 py-4 text-sm text-[#B8B3A7]">
                      <p>Synced {formatDate(account.lastSyncedAt, "Not synced")}</p>
                      <p>Verified {formatDate(account.verifiedAt, "Not verified")}</p>
                    </td>
                    <td className="rounded-r-2xl border-y border-r border-white/[0.08] px-3 py-4">
                      <div className="space-y-3">
                        <ButtonLink
                          href={routes.adminVerificationDetail(account.id)}
                          size="sm"
                          variant="secondary"
                        >
                          Review
                        </ButtonLink>
                        <SocialAccountReviewActions
                          accountId={account.id}
                          compact
                          initialRejectionReason={account.rejectionReason}
                          initialStatus={
                            account.verificationStatus === "draft"
                              ? "pending"
                              : account.verificationStatus
                          }
                        />
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="mt-5">
            <EmptyState
              description="No social account submissions match the current filters."
              title="No accounts found"
            />
          </div>
        )}
      </GlassCard>
    </div>
  );
}
