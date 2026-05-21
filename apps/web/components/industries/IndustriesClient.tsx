"use client";

import { useMemo, useState } from "react";
import { Button } from "@/components/ui/Button";
import { EmptyState } from "@/components/ui/EmptyState";
import { ErrorState } from "@/components/ui/ErrorState";
import { KpiCard } from "@/components/ui/KpiCard";
import { PageHeader as PageHeaderBase } from "@/components/ui/PageHeader";
import { SearchFilterBar } from "@/components/ui/SearchFilterBar";
import { TextInput } from "@/components/ui/TextInput";
import type { Industry } from "@/lib/industry-utils";
import { formatIndustryWeight } from "@/lib/industry-utils";
import { IndustryCard } from "./IndustryCard";

type SortMode = "highest" | "influencers" | "az";

type IndustriesClientProps = {
  industries: Industry[];
  error?: string | null;
};

function formatAverageWeight(industries: Industry[]) {
  if (industries.length === 0) {
    return "0.00x";
  }

  const total = industries.reduce(
    (sum, industry) => sum + industry.industryWeight,
    0,
  );

  return `${(total / industries.length).toFixed(2)}x`;
}

function getBestPerformingSector(industries: Industry[]) {
  const best = [...industries].sort(
    (a, b) => b.industryWeight - a.industryWeight,
  )[0];

  return best?.name ?? "N/A";
}

export function IndustriesClient({ industries, error }: IndustriesClientProps) {
  const [query, setQuery] = useState("");
  const [sortMode, setSortMode] = useState<SortMode>("highest");

  const filteredIndustries = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();
    const visible = normalizedQuery
      ? industries.filter((industry) =>
          industry.name.toLowerCase().includes(normalizedQuery),
        )
      : industries;

    return [...visible].sort((a, b) => {
      if (sortMode === "az") {
        return a.name.localeCompare(b.name);
      }

      if (sortMode === "influencers") {
        return (b.influencerCount ?? 0) - (a.influencerCount ?? 0);
      }

      return b.industryWeight - a.industryWeight;
    });
  }, [industries, query, sortMode]);

  const totalInfluencers = industries.reduce(
    (sum, industry) => sum + (industry.influencerCount ?? 0),
    0,
  );

  if (error) {
    return (
      <div className="space-y-5">
        <PageHeader />
        <ErrorState
          action={
            <Button
            onClick={() => window.location.reload()}
            type="button"
          >
            Refresh Data
            </Button>
          }
          description={error}
          title="Could not load industries from Odoo."
        />
      </div>
    );
  }

  return (
    <div className="space-y-5">
      <PageHeader />

      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <KpiCard label="Total Industries" value={String(industries.length)} />
        <KpiCard label="Total Influencers" value={String(totalInfluencers)} />
        <KpiCard
          helper={`Weighted sector match average: ${formatIndustryWeight(Number.parseFloat(formatAverageWeight(industries)) || 0)}`}
          label="Average Industry Weight"
          tone="green"
          value={formatAverageWeight(industries)}
        />
        <KpiCard
          label="Best Performing Sector"
          value={getBestPerformingSector(industries)}
        />
      </section>

      <SearchFilterBar>
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          <label className="relative block flex-1">
            <span className="sr-only">Search industries</span>
            <TextInput
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Search industries..."
              type="search"
              value={query}
            />
          </label>

          <div className="grid grid-cols-3 gap-2 rounded-2xl border border-white/[0.10] bg-black/20 p-1">
            {[
              ["highest", "Highest Match"],
              ["influencers", "Most Influencers"],
              ["az", "A-Z"],
            ].map(([mode, label]) => (
              <button
                className={`rounded-xl px-3 py-2 text-xs font-bold transition ${
                  sortMode === mode
                    ? "bg-[#FFD700] text-black"
                    : "text-[#B8B3A7] hover:bg-white/[0.06] hover:text-[#F5F2E9]"
                }`}
                key={mode}
                onClick={() => setSortMode(mode as SortMode)}
                type="button"
              >
                {label}
              </button>
            ))}
          </div>
        </div>
      </SearchFilterBar>

      {filteredIndustries.length > 0 ? (
        <section className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
          {filteredIndustries.map((industry) => (
            <IndustryCard industry={industry} key={industry.id} />
          ))}
        </section>
      ) : (
        <EmptyState
          action={
            <Button
              onClick={() => window.location.reload()}
              type="button"
              variant="secondary"
            >
              Refresh Data
            </Button>
          }
          description="Add industries in Odoo to start matching businesses with suitable influencers."
          title="No industries found"
        />
      )}
    </div>
  );
}

function PageHeader() {
  return (
    <PageHeaderBase
      actions={
        <Button disabled type="button" variant="secondary">
          Add Industry
        </Button>
      }
      eyebrow="INDUSTRY INTELLIGENCE"
      subtitle="Explore Ethiopian business sectors and discover where influencer partnerships can create the highest ROI."
      title="Industries"
    />
  );
}
