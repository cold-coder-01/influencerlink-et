import {
  getCampaignStatusDescription,
  getCampaignStatusLabel,
  getCampaignTimeline,
  normalizeCampaignStatus,
} from "@/lib/campaign-lifecycle";
import { cn } from "@/lib/cn";

type CampaignStatusTimelineProps = {
  status: string;
};

const stepClasses = {
  complete: "border-[#45B36B]/40 bg-[#45B36B]/10 text-[#45B36B]",
  current: "border-[#FFD700]/60 bg-[#FFD700]/15 text-[#FFD700]",
  future: "border-white/[0.10] bg-white/[0.04] text-[#B8B3A7]",
  muted: "border-white/[0.08] bg-white/[0.03] text-[#8E8778]",
};

export function CampaignStatusTimeline({ status }: CampaignStatusTimelineProps) {
  const normalizedStatus = normalizeCampaignStatus(status);
  const timeline = getCampaignTimeline(status);

  return (
    <div>
      <div className="grid gap-3 md:grid-cols-4">
        {timeline.map((step) => (
          <div
            className={cn(
              "min-h-[112px] rounded-2xl border p-4 transition",
              stepClasses[step.state as keyof typeof stepClasses],
            )}
            key={step.status}
          >
            <p className="text-xs font-semibold uppercase">Step</p>
            <p className="mt-2 text-base font-bold">{step.label}</p>
            <p className="mt-2 text-xs leading-5 text-[#B8B3A7]">
              {step.description}
            </p>
          </div>
        ))}
      </div>

      {normalizedStatus === "cancelled" ? (
        <p className="mt-4 rounded-2xl border border-[#E63746]/30 bg-[#E63746]/10 p-4 text-sm leading-6 text-[#FFB2B9]">
          {getCampaignStatusLabel(status)}: {getCampaignStatusDescription(status)}
        </p>
      ) : null}
    </div>
  );
}
