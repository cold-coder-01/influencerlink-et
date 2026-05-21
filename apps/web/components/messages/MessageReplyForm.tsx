"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Button } from "@/components/ui/Button";
import { FormField } from "@/components/ui/FormField";

type MessageReplyFormProps = {
  campaignId: number;
  subject?: string;
  placeholder?: string;
};

export function MessageReplyForm({
  campaignId,
  subject = "Campaign reply",
  placeholder = "Write a reply...",
}: MessageReplyFormProps) {
  const router = useRouter();
  const [body, setBody] = useState("");
  const [message, setMessage] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function submitMessage() {
    if (!body.trim()) {
      setMessage("Write a message before sending.");
      return;
    }

    setIsSubmitting(true);
    setMessage("Sending message...");

    try {
      const response = await fetch(`/api/campaigns/${campaignId}/messages`, {
        body: JSON.stringify({
          body,
          messageType: "reply",
          subject,
        }),
        headers: {
          "Content-Type": "application/json",
        },
        method: "POST",
      });
      const payload = (await response.json()) as {
        success?: boolean;
        error?: string;
      };

      if (!response.ok || !payload.success) {
        setMessage(payload.error || "Could not send message.");
        return;
      }

      setBody("");
      setMessage("Message sent.");
      router.refresh();
    } catch (error) {
      setMessage(
        error instanceof Error ? error.message : "Could not send message.",
      );
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="space-y-3">
      <FormField label="Reply">
        <textarea
          className="min-h-[120px] w-full rounded-xl border border-white/[0.10] bg-black/25 px-4 py-3 text-sm leading-6 text-[#F5F2E9] outline-none transition placeholder:text-[#B8B3A7] focus:border-[#FFD700]/60"
          onChange={(event) => setBody(event.target.value)}
          placeholder={placeholder}
          value={body}
        />
      </FormField>
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <Button
          disabled={isSubmitting}
          onClick={() => void submitMessage()}
          type="button"
        >
          {isSubmitting ? "Sending..." : "Send Message"}
        </Button>
        {message ? (
          <p className="text-sm font-semibold text-[#B8B3A7]">{message}</p>
        ) : null}
      </div>
    </div>
  );
}
