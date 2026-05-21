"use client";

import { useMemo, useState } from "react";
import { campaignStatusOptions } from "@/lib/campaign-utils";
import { Button, ButtonLink } from "@/components/ui/Button";
import { EmptyState } from "@/components/ui/EmptyState";
import { ErrorState } from "@/components/ui/ErrorState";
import { GlassCard } from "@/components/ui/GlassCard";
import { KpiCard } from "@/components/ui/KpiCard";
import { PageHeader } from "@/components/ui/PageHeader";
import { SearchFilterBar } from "@/components/ui/SearchFilterBar";
import { SelectInput } from "@/components/ui/SelectInput";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { TextInput } from "@/components/ui/TextInput";
import {
  getCampaignStatusDescription,
  getCampaignStatusLabel,
  normalizeCampaignStatus,
} from "@/lib/campaign-lifecycle";
import type { Campaign } from "@/lib/campaigns";
import { formatRoiMultiplier } from "@/lib/formatters";
import { routes } from "@/lib/routes";

type CampaignsClientProps = {
  campaigns: Campaign[];
  error?: string | null;
};

function countByStatus(campaigns: Campaign[], status: string) {
  return campaigns.filter(
    (campaign) => normalizeCampaignStatus(campaign.status) === status,
  ).length;
}

export function CampaignsClient({ campaigns, error }: CampaignsClientProps) {
  const [query, setQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");
  const [platformFilter, setPlatformFilter] = useState("All");
  const platformOptions = useMemo(
    () =>
      Array.from(
        new Set(campaigns.map((campaign) => campaign.platform).filter(Boolean)),
      ) as string[],
    [campaigns],
  );
  const filteredCampaigns = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();

    return campaigns.filter((campaign) => {
      const haystack = [
        campaign.name,
        campaign.businessName,
        campaign.influencer,
        campaign.industry,
        campaign.platform,
        campaign.budgetRange,
        campaign.campaignGoal,
        campaign.locationFocus,
        getCampaignStatusLabel(campaign.status),
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();
      const matchesSearch =
        !normalizedQuery || haystack.includes(normalizedQuery);
      const matchesStatus =
        statusFilter === "All" ||
        getCampaignStatusLabel(campaign.status) === statusFilter;
      const matchesPlatform =
        platformFilter === "All" || campaign.platform === platformFilter;

      return matchesSearch && matchesStatus && matchesPlatform;
    });
  }, [campaigns, platformFilter, query, statusFilter]);

  if (error) {
    return (
      <div className="space-y-5">
        <CampaignHeader />
        <ErrorState
          action={
            <Button
            onClick={() => window.location.reload()}
            type="button"
          >
            Refresh
            </Button>
          }
          description={error}
          title="Could not load campaigns"
        />
      </div>
    );
  }

  return (
    <div className="space-y-5">
      <CampaignHeader />

      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <KpiCard label="Total Campaigns" value={String(campaigns.length)} />
        <KpiCard label="Drafts" value={String(countByStatus(campaigns, "draft"))} />
        <KpiCard
          label="Active/Pending"
          value={String(
            countByStatus(campaigns, "active") +
              countByStatus(campaigns, "pending"),
          )}
          tone="green"
        />
        <KpiCard
          label="Completed"
          value={String(countByStatus(campaigns, "completed"))}
        />
      </section>

      <SearchFilterBar>
        <div className="grid gap-3 lg:grid-cols-[minmax(0,1fr)_220px_220px]">
          <TextInput
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search campaigns..."
            type="search"
            value={query}
          />
          <SelectInput
            onChange={(event) => setStatusFilter(event.target.value)}
            value={statusFilter}
          >
            {campaignStatusOptions.map((status) => (
              <option key={status} value={status}>
                {status}
              </option>
            ))}
          </SelectInput>
          <SelectInput
            onChange={(event) => setPlatformFilter(event.target.value)}
            value={platformFilter}
          >
            <option value="All">All Platforms</option>
            {platformOptions.map((platform) => (
              <option key={platform} value={platform}>
                {platform}
              </option>
            ))}
          </SelectInput>
        </div>
      </SearchFilterBar>

      {filteredCampaigns.length > 0 ? (
        <section className="grid gap-4">
          {filteredCampaigns.map((campaign) => (
            <CampaignCard campaign={campaign} key={campaign.id} />
          ))}
        </section>
      ) : (
        <EmptyState
          action={<ButtonLink href={routes.newCampaign()}>Create Campaign</ButtonLink>}
          description="Create your first campaign brief and invite a suitable influencer to promote your business."
          title="No campaigns yet"
        />
      )}
    </div>
  );
}

function CampaignHeader() {
  return (
    <PageHeader
      actions={<ButtonLink href={routes.newCampaign()}>Create Campaign</ButtonLink>}
      eyebrow="CAMPAIGN OPERATIONS"
      subtitle="Manage campaign briefs, influencer invitations, and partnership progress."
      title="Campaigns"
    />
  );
}

function CampaignCard({ campaign }: { campaign: Campaign }) {
  return (
    <GlassCard as="article" className="p-5" hover>
      <div className="flex flex-col gap-5 xl:flex-row xl:items-center xl:justify-between">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-3">
            <h2 className="text-2xl font-bold text-[#F5F2E9]">{campaign.name}</h2>
            <StatusBadge status={campaign.status} />
          </div>
          <p className="mt-2 text-sm text-[#B8B3A7]">
            {campaign.businessName || "Business owner"} -{" "}
            {campaign.influencer || "Influencer TBD"} -{" "}
            {campaign.industry || "Industry TBD"}
          </p>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-[#B8B3A7]">
            {getCampaignStatusDescription(campaign.status)}
          </p>
        </div>

        <div className="grid gap-3 sm:grid-cols-2 xl:min-w-[640px] xl:grid-cols-4">
          <Metric label="Goal" value={campaign.campaignGoal || "TBD"} />
          <Metric label="Platform" value={campaign.platform || "TBD"} />
          <Metric label="Budget" value={campaign.budgetRange || "TBD"} />
          <Metric
            label="ROI"
            value={
              campaign.roiMultiplier
                ? formatRoiMultiplier(campaign.roiMultiplier)
                : "TBD"
            }
          />
          <Metric label="Location" value={campaign.locationFocus || "TBD"} />
          <Metric label="Start" value={campaign.startDate || "TBD"} />
          <Metric label="End" value={campaign.endDate || "TBD"} />
        </div>

        <ButtonLink
          className="w-full shrink-0 xl:w-auto"
          href={routes.campaignDetail(campaign.id)}
          variant="secondary"
        >
          View Details
        </ButtonLink>
      </div>
    </GlassCard>
  );
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-white/[0.08] bg-black/20 p-3">
      <p className="text-xs text-[#B8B3A7]">{label}</p>
      <p className="mt-1 break-words text-sm font-bold text-[#F5F2E9]">
        {value}
      </p>
    </div>
  );
}
