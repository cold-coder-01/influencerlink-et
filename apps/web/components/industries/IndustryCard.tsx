import Image from "next/image";
import { ButtonLink } from "@/components/ui/Button";
import { GlassCard } from "@/components/ui/GlassCard";
import { StatusBadge } from "@/components/ui/StatusBadge";
import {
  formatIndustryWeight,
  getIndustryDescription,
  getIndustryImage,
  type Industry,
} from "@/lib/industry-utils";
import { routes } from "@/lib/routes";

function IndustryIcon({ icon }: { icon?: string | null }) {
  const label = icon?.slice(0, 1).toUpperCase() || "I";

  return (
    <div className="grid h-12 w-12 place-items-center rounded-full border border-[#FFD700]/45 bg-black/45 text-sm font-bold text-[#FFD700] shadow-[0_18px_40px_rgba(0,0,0,0.35)]">
      {label}
    </div>
  );
}

export function IndustryCard({ industry }: { industry: Industry }) {
  return (
    <GlassCard as="article" className="group overflow-hidden" hover>
      <div className="relative h-[190px] overflow-hidden">
        <Image
          src={getIndustryImage(industry.name)}
          alt={`${industry.name} industry`}
          fill
          sizes="(max-width: 768px) 100vw, 33vw"
          className="object-cover transition duration-500 group-hover:scale-105"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black via-black/45 to-transparent" />
        <div className="absolute bottom-4 left-4">
          <IndustryIcon icon={industry.icon} />
        </div>
        <StatusBadge className="absolute right-4 top-4 text-sm" tone="green">
          {formatIndustryWeight(industry.industryWeight)}
        </StatusBadge>
      </div>

      <div className="p-5">
        <div className="flex items-start justify-between gap-4">
          <div className="min-w-0">
            <h2 className="truncate text-xl font-bold text-[#F5F2E9]">
              {industry.name}
            </h2>
            <p className="mt-1 text-xs font-semibold uppercase tracking-[0.16em] text-[#B8B3A7]">
              Match Score
            </p>
          </div>
        </div>

        <p className="mt-4 min-h-[72px] text-sm leading-6 text-[#B8B3A7]">
          {getIndustryDescription(industry.name)}
        </p>

        <div className="mt-5 grid grid-cols-2 gap-3">
          <div className="rounded-2xl border border-white/[0.08] bg-black/20 p-3">
            <p className="text-xs text-[#B8B3A7]">Influencers</p>
            <p className="mt-1 text-2xl font-bold text-[#F5F2E9]">
              {industry.influencerCount ?? 0}
            </p>
          </div>
          <div className="rounded-2xl border border-white/[0.08] bg-black/20 p-3">
            <p className="text-xs text-[#B8B3A7]">Avg ROI</p>
            <p className="mt-1 text-2xl font-bold text-[#45B36B]">
              {industry.avgRoiMultiplier
                ? `${industry.avgRoiMultiplier.toFixed(2)}x`
                : "N/A"}
            </p>
          </div>
        </div>

        <ButtonLink
          className="mt-5 w-full"
          href={routes.industryDetail(industry.id)}
          variant="secondary"
        >
          View Details
        </ButtonLink>
      </div>
    </GlassCard>
  );
}
