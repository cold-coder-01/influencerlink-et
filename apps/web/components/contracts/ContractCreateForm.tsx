"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Button } from "@/components/ui/Button";
import { FormField } from "@/components/ui/FormField";
import { TextInput } from "@/components/ui/TextInput";
import type { Campaign } from "@/lib/campaigns";
import { formatRoiMultiplier } from "@/lib/formatters";
import { routes } from "@/lib/routes";

type ContractCreateFormProps = {
  campaign: Campaign;
};

export function ContractCreateForm({ campaign }: ContractCreateFormProps) {
  const router = useRouter();
  const defaultDeliverables =
    campaign.description ||
    `Deliver campaign content for ${campaign.name} according to the approved brief.`;
  const defaultTerms =
    "Both parties agree to collaborate in good faith, follow the campaign brief, and confirm completion before payment workflow begins.";
  const [contractValue, setContractValue] = useState("");
  const [startDate, setStartDate] = useState(campaign.startDate || "");
  const [endDate, setEndDate] = useState(campaign.endDate || "");
  const [deliverables, setDeliverables] = useState(defaultDeliverables);
  const [terms, setTerms] = useState(defaultTerms);
  const [message, setMessage] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function submitContract() {
    if (startDate && endDate && endDate < startDate) {
      setMessage("End date cannot be before start date.");
      return;
    }

    setIsSubmitting(true);
    setMessage("Creating contract...");

    try {
      const response = await fetch("/api/contracts", {
        body: JSON.stringify({
          campaignId: campaign.id,
          contractValue: contractValue ? Number(contractValue) : null,
          deliverables,
          endDate,
          startDate,
          terms,
        }),
        headers: {
          "Content-Type": "application/json",
        },
        method: "POST",
      });
      const payload = (await response.json()) as {
        success?: boolean;
        data?: { id?: number };
        error?: string;
      };

      if (!response.ok || !payload.success || !payload.data?.id) {
        setMessage(payload.error || "Could not create contract.");
        return;
      }

      router.push(routes.contractDetail(payload.data.id));
    } catch (error) {
      setMessage(
        error instanceof Error ? error.message : "Could not create contract.",
      );
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="grid gap-5 xl:grid-cols-[minmax(0,2fr)_minmax(300px,1fr)]">
      <div className="space-y-5">
        <div className="grid gap-4 md:grid-cols-2">
          <FormField label="Contract Value">
            <TextInput
              min="0"
              onChange={(event) => setContractValue(event.target.value)}
              placeholder="50000"
              type="number"
              value={contractValue}
            />
          </FormField>
          <FormField label="Start Date">
            <TextInput
              onChange={(event) => setStartDate(event.target.value)}
              type="date"
              value={startDate}
            />
          </FormField>
          <FormField label="End Date">
            <TextInput
              onChange={(event) => setEndDate(event.target.value)}
              type="date"
              value={endDate}
            />
          </FormField>
        </div>

        <FormField label="Deliverables">
          <textarea
            className="min-h-[150px] w-full rounded-xl border border-white/[0.10] bg-black/25 px-4 py-3 text-sm leading-6 text-[#F5F2E9] outline-none transition placeholder:text-[#B8B3A7] focus:border-[#FFD700]/60"
            onChange={(event) => setDeliverables(event.target.value)}
            value={deliverables}
          />
        </FormField>

        <FormField label="Terms & Conditions">
          <textarea
            className="min-h-[170px] w-full rounded-xl border border-white/[0.10] bg-black/25 px-4 py-3 text-sm leading-6 text-[#F5F2E9] outline-none transition placeholder:text-[#B8B3A7] focus:border-[#FFD700]/60"
            onChange={(event) => setTerms(event.target.value)}
            value={terms}
          />
        </FormField>

        <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
          <Button
            disabled={isSubmitting}
            onClick={() => void submitContract()}
            type="button"
          >
            {isSubmitting ? "Creating..." : "Create Contract"}
          </Button>
          {message ? (
            <p className="text-sm font-semibold text-[#B8B3A7]">{message}</p>
          ) : null}
        </div>
      </div>

      <aside className="rounded-[24px] border border-white/[0.10] bg-white/[0.05] p-5">
        <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[#B8B3A7]">
          Campaign
        </p>
        <h2 className="mt-3 text-2xl font-bold text-[#FFD700]">
          {campaign.name}
        </h2>
        <div className="mt-5 space-y-3">
          <Preview label="Influencer" value={campaign.influencer || "TBD"} />
          <Preview label="Business" value={campaign.businessName || "Odoo partner"} />
          <Preview label="Status" value={campaign.status} />
          <Preview
            label="Estimated ROI"
            value={formatRoiMultiplier(campaign.roiMultiplier)}
          />
        </div>
      </aside>
    </div>
  );
}

function Preview({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between gap-4 border-b border-white/[0.08] pb-3 last:border-b-0 last:pb-0">
      <span className="text-sm text-[#B8B3A7]">{label}</span>
      <span className="text-right text-sm font-bold text-[#F5F2E9]">{value}</span>
    </div>
  );
}
