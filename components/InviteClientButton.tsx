"use client";

import { useState, useTransition } from "react";
import { sendClientInvite } from "@/app/actions";

interface Props {
  candidateId: string;
  inviteSentAt: string | null;
  inviteClaimedAt: string | null;
}

export default function InviteClientButton({
  candidateId,
  inviteSentAt,
  inviteClaimedAt,
}: Props) {
  const [isPending, startTransition] = useTransition();
  const [sent, setSent] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (inviteClaimedAt) {
    return (
      <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-3 py-1 text-xs font-medium text-emerald-700 dark:bg-emerald-950/30 dark:text-emerald-400">
        <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
        Portal active
      </span>
    );
  }

  function handleSend() {
    setError(null);
    startTransition(async () => {
      const result = await sendClientInvite(candidateId);
      if (result.error) {
        setError(result.error);
      } else {
        setSent(true);
      }
    });
  }

  return (
    <div className="flex flex-col gap-1">
      <button
        onClick={handleSend}
        disabled={isPending}
        className="inline-flex items-center gap-1.5 rounded-lg border border-border bg-surface px-3 py-1.5 text-xs font-medium text-foreground transition hover:bg-muted/10 disabled:opacity-60"
      >
        {isPending
          ? "Sending…"
          : sent
          ? "Invite sent ✓"
          : inviteSentAt
          ? "Resend invite"
          : "Invite client to portal"}
      </button>
      {error && <p className="text-xs text-red-600 dark:text-red-400">{error}</p>}
    </div>
  );
}
