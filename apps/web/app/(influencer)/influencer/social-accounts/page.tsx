"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
import { Button } from "@/components/ui/Button";
import { EmptyState } from "@/components/ui/EmptyState";
import { ErrorState } from "@/components/ui/ErrorState";
import { FormField } from "@/components/ui/FormField";
import { GlassCard } from "@/components/ui/GlassCard";
import { KpiCard } from "@/components/ui/KpiCard";
import { PageHeader } from "@/components/ui/PageHeader";
import { SectionHeader } from "@/components/ui/SectionHeader";
import { SelectInput } from "@/components/ui/SelectInput";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { TextInput } from "@/components/ui/TextInput";
import { formatCompactNumber, formatDate, formatPercent } from "@/lib/formatters";

type SocialPlatform =
  | "tiktok"
  | "instagram"
  | "youtube"
  | "telegram"
  | "facebook"
  | "linkedin"
  | "x_twitter"
  | "other";

type VerificationStatus =
  | "draft"
  | "pending"
  | "verified"
  | "rejected"
  | "needs_review";

type Account = {
  id: number;
  name: string;
  platform: SocialPlatform;
  handle: string;
  profileUrl?: string | null;
  verificationStatus: VerificationStatus;
  followersCount?: number | null;
  mediaCount?: number | null;
  avgViews?: number | null;
  engagementRate?: number | null;
  audienceAddisPercent?: number | null;
  audienceLocation?: string | null;
  lastSyncedAt?: string | null;
  verifiedAt?: string | null;
  rejectionReason?: string | null;
};

type ApiListResponse = {
  success: boolean;
  data?: Account[];
  error?: string;
};

type ApiItemResponse = {
  success: boolean;
  data?: Account;
  error?: string;
};

const platformOptions: Array<{ value: SocialPlatform; label: string }> = [
  { value: "tiktok", label: "TikTok" },
  { value: "instagram", label: "Instagram" },
  { value: "youtube", label: "YouTube" },
  { value: "telegram", label: "Telegram" },
  { value: "facebook", label: "Facebook" },
  { value: "linkedin", label: "LinkedIn" },
  { value: "x_twitter", label: "X / Twitter" },
  { value: "other", label: "Other" },
];

const statusLabels: Record<VerificationStatus, string> = {
  draft: "Draft",
  needs_review: "Needs Review",
  pending: "Pending Review",
  rejected: "Rejected",
  verified: "Verified",
};

const statusTones: Record<VerificationStatus, "gold" | "green" | "blue" | "red" | "gray"> = {
  draft: "gray",
  needs_review: "blue",
  pending: "gold",
  rejected: "red",
  verified: "green",
};

const initialForm = {
  audienceAddisPercent: "",
  audienceLocation: "",
  avgViews: "",
  engagementRate: "",
  followersCount: "",
  handle: "",
  platform: "tiktok" as SocialPlatform,
  profileUrl: "",
};

function toNumber(value: string) {
  return value.trim() ? Number(value) : null;
}

function platformLabel(platform: SocialPlatform) {
  return platformOptions.find((option) => option.value === platform)?.label ?? "Other";
}

export default function InfluencerSocialAccountsPage() {
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [form, setForm] = useState(initialForm);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [syncingId, setSyncingId] = useState<number | null>(null);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const stats = useMemo(
    () => ({
      needsReview: accounts.filter((account) => account.verificationStatus === "needs_review")
        .length,
      pending: accounts.filter((account) => account.verificationStatus === "pending").length,
      total: accounts.length,
      verified: accounts.filter((account) => account.verificationStatus === "verified").length,
    }),
    [accounts],
  );

  useEffect(() => {
    async function loadAccounts() {
      setLoading(true);
      setError("");
      setSuccess("");

      try {
        const response = await fetch("/api/social-accounts", { cache: "no-store" });
        const payload = (await response.json()) as ApiListResponse;

        if (!response.ok || !payload.success) {
          throw new Error(payload.error || "Could not load social accounts.");
        }

        setAccounts(payload.data ?? []);
      } catch (loadError) {
        setError(loadError instanceof Error ? loadError.message : "Could not load social accounts.");
      } finally {
        setLoading(false);
      }
    }

    void loadAccounts();
  }, []);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSubmitting(true);
    setError("");
    setSuccess("");

    try {
      const response = await fetch("/api/social-accounts", {
        body: JSON.stringify({
          audienceAddisPercent: toNumber(form.audienceAddisPercent),
          audienceLocation: form.audienceLocation,
          avgViews: toNumber(form.avgViews),
          engagementRate: toNumber(form.engagementRate),
          followersCount: toNumber(form.followersCount),
          handle: form.handle,
          platform: form.platform,
          profileUrl: form.profileUrl,
        }),
        headers: { "Content-Type": "application/json" },
        method: "POST",
      });
      const payload = (await response.json()) as ApiItemResponse;

      if (!response.ok || !payload.success || !payload.data) {
        throw new Error(payload.error || "Could not submit account.");
      }

      setAccounts((current) => [payload.data as Account, ...current]);
      setForm(initialForm);
      setSuccess("Social account submitted for review.");
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : "Could not submit account.");
    } finally {
      setSubmitting(false);
    }
  }

  async function handleSyncYouTube(accountId: number) {
    setSyncingId(accountId);
    setError("");
    setSuccess("");

    try {
      const response = await fetch(`/api/social-accounts/${accountId}/sync/youtube`, {
        method: "POST",
      });
      const payload = (await response.json()) as ApiItemResponse;

      if (!response.ok || !payload.success || !payload.data) {
        throw new Error(payload.error || "Could not sync YouTube account.");
      }

      setAccounts((current) =>
        current.map((account) => (account.id === accountId ? (payload.data as Account) : account)),
      );
      setSuccess("YouTube account synced and marked for review.");
    } catch (syncError) {
      setError(syncError instanceof Error ? syncError.message : "Could not sync YouTube account.");
    } finally {
      setSyncingId(null);
    }
  }

  async function handleSyncTelegram(accountId: number) {
    setSyncingId(accountId);
    setError("");
    setSuccess("");

    try {
      const response = await fetch(`/api/social-accounts/${accountId}/sync/telegram`, {
        method: "POST",
      });
      const payload = (await response.json()) as ApiItemResponse;

      if (!response.ok || !payload.success || !payload.data) {
        throw new Error(payload.error || "Could not sync Telegram account.");
      }

      setAccounts((current) =>
        current.map((account) => (account.id === accountId ? (payload.data as Account) : account)),
      );
      setSuccess("Telegram account synced and marked for review.");
    } catch (syncError) {
      setError(syncError instanceof Error ? syncError.message : "Could not sync Telegram account.");
    } finally {
      setSyncingId(null);
    }
  }

  return (
    <div className="space-y-5">
      <PageHeader
        eyebrow="CREATOR PORTAL"
        subtitle="Add and verify the platforms where your audience follows your content."
        title="Social Accounts"
      />

      {error ? (
        <ErrorState
          description={error}
          title="Social accounts need a quick retry"
        />
      ) : null}
      {success ? (
        <p className="rounded-2xl border border-[#32D583]/25 bg-[#32D583]/10 p-4 text-sm font-semibold text-[#A7F3D0]">
          {success}
        </p>
      ) : null}

      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <KpiCard label="Total Accounts" value={String(stats.total)} />
        <KpiCard label="Verified" tone="green" value={String(stats.verified)} />
        <KpiCard label="Pending Review" value={String(stats.pending)} />
        <KpiCard label="Needs Review" tone="neutral" value={String(stats.needsReview)} />
      </section>

      <GlassCard className="p-5 sm:p-6">
        <SectionHeader
          subtitle="Your account will be marked as Pending Review until verified by the platform team."
          title="Add Social Account"
        />
        <form className="mt-5 grid gap-4 md:grid-cols-2" onSubmit={handleSubmit}>
          <FormField label="Platform">
            <SelectInput
              onChange={(event) =>
                setForm((current) => ({
                  ...current,
                  platform: event.target.value as SocialPlatform,
                }))
              }
              value={form.platform}
            >
              {platformOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </SelectInput>
          </FormField>
          <FormField label="Handle">
            <TextInput
              onChange={(event) => setForm((current) => ({ ...current, handle: event.target.value }))}
              placeholder="@creator"
              required
              value={form.handle}
            />
          </FormField>
          <FormField label="Profile URL">
            <TextInput
              onChange={(event) =>
                setForm((current) => ({ ...current, profileUrl: event.target.value }))
              }
              placeholder="https://..."
              type="url"
              value={form.profileUrl}
            />
          </FormField>
          <FormField label="Followers">
            <TextInput
              min="0"
              onChange={(event) =>
                setForm((current) => ({ ...current, followersCount: event.target.value }))
              }
              type="number"
              value={form.followersCount}
            />
          </FormField>
          <FormField label="Average Views">
            <TextInput
              min="0"
              onChange={(event) =>
                setForm((current) => ({ ...current, avgViews: event.target.value }))
              }
              type="number"
              value={form.avgViews}
            />
          </FormField>
          <FormField label="Engagement Rate">
            <TextInput
              min="0"
              onChange={(event) =>
                setForm((current) => ({ ...current, engagementRate: event.target.value }))
              }
              step="0.01"
              type="number"
              value={form.engagementRate}
            />
          </FormField>
          <FormField label="Addis Audience %">
            <TextInput
              max="100"
              min="0"
              onChange={(event) =>
                setForm((current) => ({ ...current, audienceAddisPercent: event.target.value }))
              }
              step="0.01"
              type="number"
              value={form.audienceAddisPercent}
            />
          </FormField>
          <FormField label="Audience Location">
            <TextInput
              onChange={(event) =>
                setForm((current) => ({ ...current, audienceLocation: event.target.value }))
              }
              placeholder="Addis Ababa, Ethiopia"
              value={form.audienceLocation}
            />
          </FormField>
          <div className="md:col-span-2">
            <Button disabled={submitting} type="submit">
              {submitting ? "Submitting..." : "Submit for Verification"}
            </Button>
          </div>
        </form>
      </GlassCard>

      <GlassCard className="p-5 sm:p-6">
        <SectionHeader
          subtitle="Track review status and the public metrics businesses can see."
          title="Account List"
        />
        {loading ? (
          <p className="mt-5 rounded-2xl border border-white/[0.18] bg-white/[0.10] lg:border-white/[0.10] lg:bg-black/20 p-4 text-sm text-white/72 lg:text-[#B8B3A7]">
            Loading social accounts...
          </p>
        ) : accounts.length ? (
          <div className="mt-5 grid gap-4 lg:grid-cols-2">
            {accounts.map((account) => (
              <article
                className="rounded-2xl border border-white/[0.18] bg-white/[0.10] lg:border-white/[0.10] lg:bg-black/20 p-5"
                key={account.id}
              >
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <StatusBadge tone="gold">{platformLabel(account.platform)}</StatusBadge>
                    <h2 className="mt-3 text-xl font-bold text-white lg:text-[#F5F2E9]">{account.handle}</h2>
                    {account.profileUrl ? (
                      <a
                        className="mt-1 block break-all text-sm text-[#C9FBFF] lg:text-[#FFD700] hover:text-white lg:hover:text-[#E6C200]"
                        href={account.profileUrl}
                        rel="noreferrer"
                        target="_blank"
                      >
                        {account.profileUrl}
                      </a>
                    ) : null}
                  </div>
                  <StatusBadge tone={statusTones[account.verificationStatus]}>
                    {statusLabels[account.verificationStatus]}
                  </StatusBadge>
                </div>
                <div className="mt-5 grid gap-3 sm:grid-cols-2">
                  <Metric label="Followers" value={formatCompactNumber(account.followersCount ?? 0)} />
                  <Metric label="Media" value={formatCompactNumber(account.mediaCount ?? 0)} />
                  <Metric label="Avg Views" value={formatCompactNumber(account.avgViews ?? 0)} />
                  <Metric
                    label="Engagement"
                    value={formatPercent(account.engagementRate ?? 0, 2)}
                  />
                  <Metric
                    label="Addis Audience"
                    value={formatPercent(account.audienceAddisPercent ?? 0, 0)}
                  />
                </div>
                <p className="mt-4 text-xs text-white/72 lg:text-[#B8B3A7]">
                  Last synced {formatDate(account.lastSyncedAt, "Not synced yet")} - Verified{" "}
                  {formatDate(account.verifiedAt, "Not verified yet")}
                </p>
                {account.platform === "youtube" ? (
                  <div className="mt-4">
                    <Button
                      disabled={syncingId === account.id}
                      onClick={() => void handleSyncYouTube(account.id)}
                      size="sm"
                      type="button"
                      variant="secondary"
                    >
                      {syncingId === account.id ? "Syncing..." : "Sync YouTube"}
                    </Button>
                  </div>
                ) : null}
                {account.platform === "telegram" ? (
                  <div className="mt-4">
                    <Button
                      disabled={syncingId === account.id}
                      onClick={() => void handleSyncTelegram(account.id)}
                      size="sm"
                      type="button"
                      variant="secondary"
                    >
                      {syncingId === account.id ? "Syncing..." : "Sync Telegram"}
                    </Button>
                  </div>
                ) : null}
                {account.verificationStatus === "rejected" && account.rejectionReason ? (
                  <p className="mt-3 rounded-xl border border-[#E63746]/25 bg-[#E63746]/10 p-3 text-sm text-[#FF8B95]">
                    {account.rejectionReason}
                  </p>
                ) : null}
              </article>
            ))}
          </div>
        ) : (
          <div className="mt-5">
            <EmptyState
              description="Add your first account to strengthen your profile and build trust with business owners."
              title="No social accounts yet"
            />
          </div>
        )}
      </GlassCard>
    </div>
  );
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border border-white/[0.16] bg-white/[0.10] lg:border-white/[0.08] lg:bg-white/[0.04] p-3">
      <p className="text-xs font-semibold uppercase text-white/72 lg:text-[#B8B3A7]">{label}</p>
      <p className="mt-2 text-base font-bold text-white lg:text-[#F5F2E9]">{value}</p>
    </div>
  );
}
