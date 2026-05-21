"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Button } from "@/components/ui/Button";
import { FormField } from "@/components/ui/FormField";
import { SelectInput } from "@/components/ui/SelectInput";
import { TextInput } from "@/components/ui/TextInput";
import type { InfluencerContract } from "@/lib/contracts";
import { formatCurrencyETB } from "@/lib/formatters";
import { routes } from "@/lib/routes";

type PaymentCreateFormProps = {
  contract: InfluencerContract;
};

const paymentMethods = [
  "manual_bank",
  "telebirr",
  "cbe",
  "chapa",
  "cash",
  "other",
] as const;

const paymentMethodLabels: Record<(typeof paymentMethods)[number], string> = {
  cash: "Cash",
  cbe: "CBE",
  chapa: "Chapa",
  manual_bank: "Manual Bank Transfer",
  other: "Other",
  telebirr: "Telebirr",
};

export function PaymentCreateForm({ contract }: PaymentCreateFormProps) {
  const router = useRouter();
  const [amount, setAmount] = useState(
    contract.contractValue ? String(contract.contractValue) : "",
  );
  const [platformFee, setPlatformFee] = useState("");
  const [paymentMethod, setPaymentMethod] = useState("manual_bank");
  const [dueDate, setDueDate] = useState(contract.endDate || "");
  const [notes, setNotes] = useState(`Initial escrow deposit for ${contract.name}.`);
  const [message, setMessage] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const amountValue = Number(amount) || 0;
  const feeValue = Number(platformFee) || 0;
  const netAmount = Math.max(0, amountValue - feeValue);

  async function submitPayment() {
    if (!amountValue || amountValue <= 0) {
      setMessage("Amount is required and must be positive.");
      return;
    }
    if (feeValue < 0) {
      setMessage("Platform fee cannot be negative.");
      return;
    }
    if (feeValue > amountValue) {
      setMessage("Platform fee cannot exceed amount.");
      return;
    }

    setIsSubmitting(true);
    setMessage("Creating payment...");

    try {
      const response = await fetch("/api/payments", {
        body: JSON.stringify({
          amount: amountValue,
          contractId: contract.id,
          dueDate,
          notes,
          paymentMethod,
          platformFee: feeValue,
        }),
        headers: { "Content-Type": "application/json" },
        method: "POST",
      });
      const payload = (await response.json()) as {
        success?: boolean;
        data?: { id?: number };
        error?: string;
      };

      if (!response.ok || !payload.success || !payload.data?.id) {
        setMessage(payload.error || "Could not create payment.");
        return;
      }

      router.push(routes.paymentDetail(payload.data.id));
    } catch (error) {
      setMessage(
        error instanceof Error ? error.message : "Could not create payment.",
      );
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="grid gap-5 xl:grid-cols-[minmax(0,2fr)_minmax(300px,1fr)]">
      <div className="space-y-5">
        <div className="grid gap-4 md:grid-cols-2">
          <FormField label="Amount">
            <TextInput
              min="1"
              onChange={(event) => setAmount(event.target.value)}
              placeholder="50000"
              type="number"
              value={amount}
            />
          </FormField>
          <FormField label="Platform Fee">
            <TextInput
              min="0"
              onChange={(event) => setPlatformFee(event.target.value)}
              placeholder="5000"
              type="number"
              value={platformFee}
            />
          </FormField>
          <FormField label="Payment Method">
            <SelectInput
              onChange={(event) => setPaymentMethod(event.target.value)}
              value={paymentMethod}
            >
              {paymentMethods.map((method) => (
                <option key={method} value={method}>
                  {paymentMethodLabels[method]}
                </option>
              ))}
            </SelectInput>
          </FormField>
          <FormField label="Due Date">
            <TextInput
              onChange={(event) => setDueDate(event.target.value)}
              type="date"
              value={dueDate}
            />
          </FormField>
        </div>

        <FormField label="Notes">
          <textarea
            className="min-h-[150px] w-full rounded-xl border border-white/[0.10] bg-black/25 px-4 py-3 text-sm leading-6 text-[#F5F2E9] outline-none transition placeholder:text-[#B8B3A7] focus:border-[#FFD700]/60"
            onChange={(event) => setNotes(event.target.value)}
            value={notes}
          />
        </FormField>

        <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
          <Button
            disabled={isSubmitting}
            onClick={() => void submitPayment()}
            type="button"
          >
            {isSubmitting ? "Creating..." : "Create Escrow Payment"}
          </Button>
          {message ? (
            <p className="text-sm font-semibold text-[#B8B3A7]">{message}</p>
          ) : null}
        </div>
      </div>

      <aside className="rounded-[24px] border border-white/[0.10] bg-white/[0.05] p-5">
        <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[#B8B3A7]">
          Contract
        </p>
        <h2 className="mt-3 text-2xl font-bold text-[#FFD700]">
          {contract.name}
        </h2>
        <div className="mt-5 space-y-3">
          <Preview label="Campaign" value={contract.campaignName || "TBD"} />
          <Preview label="Influencer" value={contract.influencerName || "TBD"} />
          <Preview label="Contract Status" value={contract.contractStatus} />
          <Preview label="Net Amount" value={formatCurrencyETB(netAmount)} />
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
