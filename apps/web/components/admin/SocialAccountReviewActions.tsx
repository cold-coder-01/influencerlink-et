"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/Button";
import { FormField } from "@/components/ui/FormField";
import { SelectInput } from "@/components/ui/SelectInput";

type ReviewStatus = "verified" | "rejected" | "needs_review" | "pending";

type SocialAccountReviewActionsProps = {
  accountId: number;
  initialNotes?: string | null;
  initialRejectionReason?: string | null;
  initialStatus: ReviewStatus;
  compact?: boolean;
};

const statusOptions: Array<{ value: ReviewStatus; label: string }> = [
  { value: "verified", label: "Verified" },
  { value: "needs_review", label: "Needs Review" },
  { value: "rejected", label: "Rejected" },
  { value: "pending", label: "Pending Review" },
];

export function SocialAccountReviewActions({
  accountId,
  initialNotes = "",
  initialRejectionReason = "",
  initialStatus,
  compact = false,
}: SocialAccountReviewActionsProps) {
  const router = useRouter();
  const [status, setStatus] = useState<ReviewStatus>(initialStatus);
  const [notes, setNotes] = useState(initialNotes ?? "");
  const [rejectionReason, setRejectionReason] = useState(initialRejectionReason ?? "");
  const [submittingStatus, setSubmittingStatus] = useState<ReviewStatus | "save" | null>(null);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  async function submitReview(nextStatus: ReviewStatus, submittingLabel: ReviewStatus | "save" = nextStatus) {
    setSubmittingStatus(submittingLabel);
    setError("");
    setMessage("");

    try {
      const response = await fetch(`/api/social-accounts/${accountId}/verify`, {
        body: JSON.stringify({
          notes,
          rejectionReason: nextStatus === "rejected" ? rejectionReason : "",
          status: nextStatus,
        }),
        headers: { "Content-Type": "application/json" },
        method: "PATCH",
      });
      const payload = (await response.json()) as { success?: boolean; error?: string };

      if (!response.ok || !payload.success) {
        throw new Error(payload.error || "Could not save review.");
      }

      setStatus(nextStatus);
      setMessage("Review saved.");
      router.refresh();
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : "Could not save review.");
    } finally {
      setSubmittingStatus(null);
    }
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    void submitReview(status, "save");
  }

  if (compact) {
    return (
      <div className="flex flex-wrap gap-2">
        <Button
          disabled={submittingStatus !== null}
          onClick={() => void submitReview("verified")}
          size="sm"
          type="button"
        >
          {submittingStatus === "verified" ? "Saving..." : "Verify"}
        </Button>
        <Button
          disabled={submittingStatus !== null}
          onClick={() => void submitReview("needs_review")}
          size="sm"
          type="button"
          variant="secondary"
        >
          {submittingStatus === "needs_review" ? "Saving..." : "Needs Review"}
        </Button>
        <Button
          disabled={submittingStatus !== null}
          onClick={() => void submitReview("rejected")}
          size="sm"
          type="button"
          variant="danger"
        >
          {submittingStatus === "rejected" ? "Saving..." : "Reject"}
        </Button>
        {error ? <p className="basis-full text-xs font-semibold text-[#FF8B95]">{error}</p> : null}
        {message ? <p className="basis-full text-xs font-semibold text-[#45B36B]">{message}</p> : null}
      </div>
    );
  }

  return (
    <form className="space-y-4" onSubmit={handleSubmit}>
      <FormField label="Status">
        <SelectInput
          onChange={(event) => setStatus(event.target.value as ReviewStatus)}
          value={status}
        >
          {statusOptions.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </SelectInput>
      </FormField>

      <FormField label="Notes">
        <textarea
          className="min-h-28 w-full rounded-xl border border-white/[0.10] bg-[#10100d] px-4 py-3 text-sm text-[#F5F2E9] outline-none transition placeholder:text-[#B8B3A7]/70 focus:border-[#FFD700]/60"
          onChange={(event) => setNotes(event.target.value)}
          placeholder="Internal reviewer notes"
          value={notes}
        />
      </FormField>

      {status === "rejected" ? (
        <FormField label="Rejection Reason">
          <textarea
            className="min-h-24 w-full rounded-xl border border-[#E63746]/30 bg-[#10100d] px-4 py-3 text-sm text-[#F5F2E9] outline-none transition placeholder:text-[#B8B3A7]/70 focus:border-[#FF8B95]/60"
            onChange={(event) => setRejectionReason(event.target.value)}
            placeholder="Reason shown for rejected submissions"
            value={rejectionReason}
          />
        </FormField>
      ) : null}

      <div className="flex flex-wrap gap-3">
        <Button
          disabled={submittingStatus !== null}
          onClick={() => {
            setStatus("verified");
            void submitReview("verified");
          }}
          type="button"
        >
          Verify Account
        </Button>
        <Button
          disabled={submittingStatus !== null}
          onClick={() => {
            setStatus("needs_review");
            void submitReview("needs_review");
          }}
          type="button"
          variant="secondary"
        >
          Mark Needs Review
        </Button>
        <Button
          disabled={submittingStatus !== null}
          onClick={() => {
            setStatus("rejected");
            void submitReview("rejected");
          }}
          type="button"
          variant="danger"
        >
          Reject Account
        </Button>
        <Button disabled={submittingStatus !== null} type="submit" variant="secondary">
          {submittingStatus === "save" ? "Saving..." : "Save Review"}
        </Button>
      </div>

      {error ? <p className="text-sm font-semibold text-[#FF8B95]">{error}</p> : null}
      {message ? <p className="text-sm font-semibold text-[#45B36B]">{message}</p> : null}
    </form>
  );
}
