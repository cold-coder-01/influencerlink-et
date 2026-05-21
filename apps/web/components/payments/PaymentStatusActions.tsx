"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Button } from "@/components/ui/Button";

type PaymentStatusActionsProps = {
  paymentId: number;
  canCancel?: boolean;
  canDeposit?: boolean;
  canRelease?: boolean;
};

export function PaymentStatusActions({
  paymentId,
  canCancel,
  canDeposit,
  canRelease,
}: PaymentStatusActionsProps) {
  const router = useRouter();
  const [message, setMessage] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function updateStatus(status: "deposited" | "cancelled" | "released") {
    const transactionReference =
      status === "deposited"
        ? window.prompt("Transaction reference")?.trim() || undefined
        : undefined;

    setIsSubmitting(true);
    setMessage("Updating payment...");

    try {
      const response = await fetch(`/api/payments/${paymentId}/status`, {
        body: JSON.stringify({ status, transactionReference }),
        headers: { "Content-Type": "application/json" },
        method: "PATCH",
      });
      const payload = (await response.json()) as {
        success?: boolean;
        error?: string;
      };

      if (!response.ok || !payload.success) {
        setMessage(payload.error || "Could not update payment.");
        return;
      }

      setMessage("Payment updated.");
      router.refresh();
    } catch (error) {
      setMessage(
        error instanceof Error ? error.message : "Could not update payment.",
      );
    } finally {
      setIsSubmitting(false);
    }
  }

  if (!canCancel && !canDeposit && !canRelease) return null;

  return (
    <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
      {canDeposit ? (
        <Button
          disabled={isSubmitting}
          onClick={() => void updateStatus("deposited")}
          type="button"
        >
          Mark as Deposited
        </Button>
      ) : null}
      {canCancel ? (
        <Button
          disabled={isSubmitting}
          onClick={() => void updateStatus("cancelled")}
          type="button"
          variant="danger"
        >
          Cancel Payment
        </Button>
      ) : null}
      {canRelease ? (
        <Button
          disabled={isSubmitting}
          onClick={() => void updateStatus("released")}
          type="button"
          variant="secondary"
        >
          Release Payment
        </Button>
      ) : null}
      {message ? (
        <p className="text-sm font-semibold text-[#B8B3A7]">{message}</p>
      ) : null}
    </div>
  );
}
