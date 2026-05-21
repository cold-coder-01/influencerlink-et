"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Button } from "@/components/ui/Button";

type ContractSignButtonProps = {
  contractId: number;
  label: string;
};

export function ContractSignButton({
  contractId,
  label,
}: ContractSignButtonProps) {
  const router = useRouter();
  const [message, setMessage] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function signContract() {
    setIsSubmitting(true);
    setMessage("Signing contract...");

    try {
      const response = await fetch(`/api/contracts/${contractId}/sign`, {
        method: "PATCH",
      });
      const payload = (await response.json()) as {
        success?: boolean;
        error?: string;
      };

      if (!response.ok || !payload.success) {
        setMessage(payload.error || "Could not sign contract.");
        return;
      }

      setMessage("Contract signed.");
      router.refresh();
    } catch (error) {
      setMessage(
        error instanceof Error ? error.message : "Could not sign contract.",
      );
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
      <Button
        disabled={isSubmitting}
        onClick={() => void signContract()}
        type="button"
      >
        {isSubmitting ? "Signing..." : label}
      </Button>
      {message ? (
        <p className="text-sm font-semibold text-[#B8B3A7]">{message}</p>
      ) : null}
    </div>
  );
}
