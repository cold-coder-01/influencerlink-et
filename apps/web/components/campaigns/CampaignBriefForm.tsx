"use client";

import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import { Button, ButtonLink } from "@/components/ui/Button";
import { FormField } from "@/components/ui/FormField";
import { GlassCard } from "@/components/ui/GlassCard";
import { SelectInput as BaseSelectInput } from "@/components/ui/SelectInput";
import { TextInput as BaseTextInput } from "@/components/ui/TextInput";
import {
  budgetRangeOptions,
  campaignGoalOptions,
  locationFocusOptions,
} from "@/lib/campaign-utils";
import { formatPercent, formatRoiMultiplier } from "@/lib/formatters";
import type { IndustryDetail } from "@/lib/industry-utils";
import type { InfluencerDetail } from "@/lib/influencers";
import { platformOptions } from "@/lib/platform-utils";
import { routes } from "@/lib/routes";

type CampaignBriefFormProps = {
  influencer: InfluencerDetail | null;
  industry: IndustryDetail["industry"] | null;
  influencerId: number | null;
  industryId: number | null;
  missingSelection: boolean;
};

type FormState = {
  title: string;
  businessName: string;
  goal: string;
  platform: string;
  industry: string;
  influencer: string;
  budgetRange: string;
  locationFocus: string;
  startDate: string;
  endDate: string;
  description: string;
};

export function CampaignBriefForm({
  influencer,
  industry,
  influencerId,
  industryId,
  missingSelection,
}: CampaignBriefFormProps) {
  const router = useRouter();
  const effectiveInfluencerId = influencer?.id ?? influencerId;
  const effectiveIndustryId = industry?.id ?? influencer?.industryId ?? industryId;
  const [form, setForm] = useState<FormState>({
    title: "",
    businessName: "",
    goal: "Brand Awareness",
    platform: influencer?.platform || "Multi-platform",
    industry: industry?.name || influencer?.industry || "",
    influencer: influencer?.name || "",
    budgetRange: "25,000 - 50,000 ETB",
    locationFocus: influencer?.locationFocus || "Addis Ababa - Bole",
    startDate: "",
    endDate: "",
    description: "",
  });
  const [message, setMessage] = useState(
    "Campaign drafts are saved directly to Odoo when the required fields are complete.",
  );
  const [isSubmitting, setIsSubmitting] = useState(false);

  const dateError = useMemo(() => {
    if (!form.startDate || !form.endDate) {
      return "";
    }

    return form.startDate > form.endDate
      ? "Start date should not be after end date."
      : "";
  }, [form.endDate, form.startDate]);

  const missingRequired = !form.title || !form.businessName || !form.description;
  const estimatedRoi = influencer?.roiMultiplier
    ? influencer.roiMultiplier
    : industry?.avgRoiMultiplier
      ? industry.avgRoiMultiplier
      : null;
  const estimatedRoiLabel = formatRoiMultiplier(estimatedRoi);

  function updateField(field: keyof FormState, value: string) {
    setForm((current) => ({ ...current, [field]: value }));
  }

  async function submitCampaign(status: "draft" | "pending") {
    const reason =
      dateError ||
      (missingRequired ? "Complete the required fields first." : "") ||
      (!effectiveIndustryId
        ? "Select an industry before creating a campaign in Odoo."
        : "");

    if (reason) {
      setMessage(reason);
      return;
    }

    setIsSubmitting(true);
    setMessage(status === "pending" ? "Sending invitation..." : "Saving draft...");

    try {
      const response = await fetch("/api/campaigns", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          title: form.title,
          businessName: form.businessName,
          campaignGoal: form.goal,
          platform: form.platform,
          industryId: effectiveIndustryId,
          influencerId: effectiveInfluencerId,
          budgetRange: form.budgetRange,
          locationFocus: form.locationFocus,
          startDate: form.startDate,
          endDate: form.endDate,
          description: form.description,
          status,
          roiMultiplier: estimatedRoi,
        }),
      });
      const payload = (await response.json()) as {
        success?: boolean;
        data?: { id?: number; message?: string; warning?: string };
        error?: string;
      };

      if (!response.ok || !payload.success) {
        setMessage(payload.error || "Could not create campaign in Odoo.");
        return;
      }

      const campaignId = payload.data?.id;
      let invitationWarning = "";

      if (status === "pending" && campaignId) {
        const invitationBody =
          form.description ||
          `Hello${form.influencer ? ` ${form.influencer}` : ""}, we would like to invite you to collaborate on ${form.title}.`;
        const messageResponse = await fetch("/api/messages", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            body: invitationBody,
            campaignId,
            messageType: "invitation",
            subject: `Campaign invitation: ${form.title}`,
          }),
        });
        const messagePayload = (await messageResponse.json()) as {
          success?: boolean;
          error?: string;
        };

        if (!messageResponse.ok || !messagePayload.success) {
          invitationWarning =
            "Campaign was created, but invitation message could not be sent.";
        }
      }

      setMessage(
        invitationWarning ||
          payload.data?.warning ||
          payload.data?.message ||
          (status === "pending"
            ? "Campaign invitation created successfully."
            : "Campaign draft created successfully."),
      );

      if (payload.data?.warning && !campaignId) {
        return;
      }

      if (campaignId) {
        router.push(routes.campaignDetail(campaignId));
      } else {
        router.push(routes.campaigns());
      }
    } catch (error) {
      setMessage(
        error instanceof Error
          ? error.message
          : "Could not create campaign in Odoo.",
      );
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="grid gap-5 xl:grid-cols-[minmax(0,2fr)_minmax(320px,1fr)]">
      <div className="space-y-5">
        {missingSelection ? (
          <Notice text="No influencer selected yet. You can choose one later." />
        ) : null}
        <SelectedMatchSummary influencer={influencer} industry={industry} />

        <GlassCard className="p-5 sm:p-6">
          <div className="grid gap-4 md:grid-cols-2">
            <TextInput
              label="Campaign Title"
              onChange={(value) => updateField("title", value)}
              required
              value={form.title}
            />
            <TextInput
              label="Business Name"
              onChange={(value) => updateField("businessName", value)}
              required
              value={form.businessName}
            />
            <SelectInput
              label="Campaign Goal"
              onChange={(value) => updateField("goal", value)}
              options={[...campaignGoalOptions]}
              value={form.goal}
            />
            <SelectInput
              label="Desired Platform"
              onChange={(value) => updateField("platform", value)}
              options={[...platformOptions]}
              value={form.platform}
            />
            <TextInput
              label="Industry"
              onChange={(value) => updateField("industry", value)}
              value={form.industry}
            />
            <TextInput
              label="Selected Influencer"
              onChange={(value) => updateField("influencer", value)}
              value={form.influencer}
            />
            <SelectInput
              label="Budget Range"
              onChange={(value) => updateField("budgetRange", value)}
              options={[...budgetRangeOptions]}
              value={form.budgetRange}
            />
            <SelectInput
              label="Location Focus"
              onChange={(value) => updateField("locationFocus", value)}
              options={[...locationFocusOptions]}
              value={form.locationFocus}
            />
            <TextInput
              label="Start Date"
              onChange={(value) => updateField("startDate", value)}
              type="date"
              value={form.startDate}
            />
            <TextInput
              label="End Date"
              onChange={(value) => updateField("endDate", value)}
              type="date"
              value={form.endDate}
            />
            <div className="md:col-span-2">
              <FormField label="Campaign Description *">
                <textarea
                  className="min-h-[150px] w-full rounded-xl border border-white/[0.10] bg-black/25 px-4 py-3 text-sm leading-6 text-[#F5F2E9] outline-none transition placeholder:text-[#B8B3A7] focus:border-[#FFD700]/60"
                  onChange={(event) =>
                    updateField("description", event.target.value)
                  }
                  placeholder="Describe the offer, audience, key message, and success criteria."
                  value={form.description}
                />
              </FormField>
            </div>
          </div>

          {dateError ? (
            <p className="mt-4 text-sm font-semibold text-[#E63746]">{dateError}</p>
          ) : null}

          <div className="mt-6 flex flex-col gap-3 sm:flex-row">
            <div className="flex-1">
              <Button
                className="w-full"
                disabled={isSubmitting}
                onClick={() => void submitCampaign("draft")}
                type="button"
              >
                {isSubmitting ? "Saving..." : "Save Draft"}
              </Button>
              <p className="mt-2 text-xs leading-5 text-[#B8B3A7]">
                Save this brief without notifying the influencer.
              </p>
            </div>
            <div className="flex-1">
              <Button
                className="w-full"
                disabled={isSubmitting}
                onClick={() => void submitCampaign("pending")}
                type="button"
                variant="secondary"
              >
                {isSubmitting ? "Saving..." : "Send Invitation"}
              </Button>
              <p className="mt-2 text-xs leading-5 text-[#B8B3A7]">
                Create the campaign and mark it as waiting for influencer response.
              </p>
            </div>
          </div>

          <p className="mt-4 rounded-2xl border border-[#FFD700]/25 bg-[#FFD700]/10 p-4 text-sm leading-6 text-[#F5F2E9]">
            {message}
          </p>
        </GlassCard>
      </div>

      <aside className="space-y-5">
        <GlassCard className="p-5">
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[#B8B3A7]">
            Live Preview
          </p>
          <h2 className="mt-3 text-2xl font-bold text-[#FFD700]">
            {form.title || "Untitled Campaign"}
          </h2>
          <div className="mt-5 space-y-3">
            <PreviewRow label="Goal" value={form.goal} />
            <PreviewRow label="Platform" value={form.platform} />
            <PreviewRow label="Budget" value={form.budgetRange} />
            <PreviewRow label="Influencer" value={form.influencer || "TBD"} />
            <PreviewRow label="Industry" value={form.industry || "TBD"} />
            <PreviewRow label="Estimated ROI" value={estimatedRoiLabel} tone="green" />
            <PreviewRow label="Status" value="Draft" />
          </div>
        </GlassCard>

        <section className="rounded-[24px] border border-[#FFD700]/25 bg-[linear-gradient(135deg,rgba(45,90,39,0.52),rgba(8,8,8,0.98)_66%)] p-5 shadow-[0_24px_80px_rgba(0,0,0,0.30)]">
          <h2 className="text-xl font-bold text-[#FFD700]">
            Choose a different match
          </h2>
          <div className="mt-5 flex flex-col gap-3">
            <LinkButton href={routes.influencers()} label="Change Influencer" />
            <LinkButton href={routes.industries()} label="Change Industry" />
          </div>
        </section>
      </aside>
    </div>
  );
}

function SelectedMatchSummary({
  influencer,
  industry,
}: {
  influencer: InfluencerDetail | null;
  industry: IndustryDetail["industry"] | null;
}) {
  return (
    <GlassCard className="p-5 sm:p-6">
      <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[#B8B3A7]">
            Selected Match
          </p>
          <h2 className="mt-3 text-2xl font-bold text-[#F5F2E9]">
            {influencer?.name || industry?.name || "Build an open brief"}
          </h2>
          <p className="mt-2 text-sm text-[#B8B3A7]">
            {influencer
              ? `${influencer.handle} on ${influencer.platform}`
              : industry
                ? "Industry selected. Choose a creator when ready."
                : "No influencer or industry has been selected yet."}
          </p>
        </div>

        {influencer ? (
          <ButtonLink href={routes.influencerDetail(influencer.id)} variant="secondary">
            View Influencer
          </ButtonLink>
        ) : null}
      </div>

      <div className="mt-5 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <SummaryMetric label="Industry" value={industry?.name || influencer?.industry || "TBD"} />
        <SummaryMetric label="Match Score" value={influencer ? String(influencer.matchScore) : "TBD"} />
        <SummaryMetric label="ROI Multiplier" value={influencer ? formatRoiMultiplier(influencer.roiMultiplier) : formatRoiMultiplier(industry?.avgRoiMultiplier)} />
        <SummaryMetric label="Addis Audience" value={influencer ? formatPercent(influencer.addisAudiencePercent) : "TBD"} />
      </div>
    </GlassCard>
  );
}

function Notice({ text }: { text: string }) {
  return (
    <p className="rounded-2xl border border-[#FFD700]/25 bg-[#FFD700]/10 p-4 text-sm leading-6 text-[#F5F2E9]">
      {text}
    </p>
  );
}

function TextInput({
  label,
  value,
  onChange,
  type = "text",
  required = false,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  type?: string;
  required?: boolean;
}) {
  return (
    <FormField label={`${label}${required ? " *" : ""}`}>
      <BaseTextInput
        onChange={(event) => onChange(event.target.value)}
        type={type}
        value={value}
      />
    </FormField>
  );
}

function SelectInput({
  label,
  value,
  options,
  onChange,
}: {
  label: string;
  value: string;
  options: string[];
  onChange: (value: string) => void;
}) {
  return (
    <FormField label={label}>
      <BaseSelectInput
        onChange={(event) => onChange(event.target.value)}
        value={value}
      >
        {options.map((option) => (
          <option key={option} value={option}>
            {option}
          </option>
        ))}
      </BaseSelectInput>
    </FormField>
  );
}

function SummaryMetric({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-white/[0.08] bg-black/20 p-3">
      <p className="text-xs text-[#B8B3A7]">{label}</p>
      <p className="mt-1 break-words text-lg font-bold text-[#F5F2E9]">
        {value}
      </p>
    </div>
  );
}

function PreviewRow({
  label,
  value,
  tone = "default",
}: {
  label: string;
  value: string;
  tone?: "default" | "green";
}) {
  return (
    <div className="flex items-center justify-between gap-4 border-b border-white/[0.08] pb-3 last:border-b-0 last:pb-0">
      <span className="text-sm text-[#B8B3A7]">{label}</span>
      <span
        className={`text-right text-sm font-bold ${
          tone === "green" ? "text-[#45B36B]" : "text-[#F5F2E9]"
        }`}
      >
        {value}
      </span>
    </div>
  );
}

function LinkButton({ href, label }: { href: string; label: string }) {
  return (
    <ButtonLink href={href} variant="secondary">
      {label}
    </ButtonLink>
  );
}
