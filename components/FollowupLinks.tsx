"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { generateFollowupLink } from "@/app/actions";
import type { Followup } from "@/lib/types";
import { formatDateTime } from "@/lib/format";

function latestOfType(followups: Followup[], type: Followup["type"]): Followup | null {
  return followups.find((f) => f.type === type) ?? null; // already ordered newest-first
}

function FollowupSlot({
  candidateId,
  type,
  title,
  description,
  existing,
  withContent,
}: {
  candidateId: string;
  type: Followup["type"];
  title: string;
  description: string;
  existing: Followup | null;
  withContent?: boolean;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [content, setContent] = useState("");
  const [copied, setCopied] = useState(false);
  const [newToken, setNewToken] = useState<string | null>(null);

  const token = newToken ?? existing?.token ?? null;
  const link = token && typeof window !== "undefined" ? `${window.location.origin}/followup/${token}` : "";
  const status = newToken ? "sent" : existing?.status;

  function generate() {
    setError(null);
    startTransition(async () => {
      const result = await generateFollowupLink(candidateId, type, withContent ? content : undefined);
      if (result.error) setError(result.error);
      else {
        setNewToken(result.token ?? null);
        router.refresh();
      }
    });
  }

  return (
    <div className="rounded-lg border border-border bg-surface p-4">
      <p className="text-sm font-semibold">{title}</p>
      <p className="mt-0.5 text-xs text-muted">{description}</p>

      {!token && withContent && (
        <textarea
          value={content}
          onChange={(e) => setContent(e.target.value)}
          rows={2}
          placeholder="Short next-steps summary for the candidate…"
          className="mt-3 w-full resize-none rounded-lg border border-border px-3 py-2 text-sm outline-none focus:border-primary"
        />
      )}

      {!token ? (
        <button
          onClick={generate}
          disabled={pending}
          className="mt-3 rounded-lg border border-border bg-foundational-soft px-3 py-1.5 text-xs font-semibold transition hover:border-primary hover:text-primary disabled:opacity-60"
        >
          {pending ? "Generating…" : "Generate link"}
        </button>
      ) : (
        <div className="mt-3">
          <div className="flex items-center gap-2">
            <input
              readOnly
              value={link}
              className="w-full rounded-md border border-border bg-foundational-soft px-2 py-1.5 text-xs"
            />
            <button
              onClick={() => {
                navigator.clipboard.writeText(link);
                setCopied(true);
                setTimeout(() => setCopied(false), 1500);
              }}
              className="shrink-0 rounded-md border border-border bg-surface px-3 py-1.5 text-xs font-medium hover:bg-foundational-soft"
            >
              {copied ? "Copied" : "Copy"}
            </button>
          </div>
          <p className="mt-2 text-xs text-muted">
            {status === "responded" ? (
              <span className="font-medium text-primary">
                Responded {existing?.respondedAt ? formatDateTime(existing.respondedAt) : ""}
              </span>
            ) : (
              <>Sent{existing?.sentAt ? ` ${formatDateTime(existing.sentAt)}` : ""} — awaiting response.</>
            )}
          </p>
        </div>
      )}

      {error && <p className="mt-2 text-xs text-competent">{error}</p>}
    </div>
  );
}

export default function FollowupLinks({
  candidateId,
  initialFollowups,
  appointmentCompleted,
  candidateLabel = "candidate",
}: {
  candidateId: string;
  initialFollowups: Followup[];
  appointmentCompleted: boolean;
  candidateLabel?: string;
}) {
  if (!appointmentCompleted) {
    return (
      <div className="rounded-xl border border-dashed border-border-strong bg-surface p-5 text-sm text-muted">
        Mark the appointment complete to generate follow-up links.
      </div>
    );
  }

  return (
    <div className="rounded-xl border border-border bg-surface p-5">
      <h2 className="mb-1 font-semibold">Follow-up links</h2>
      <p className="mb-4 text-xs text-muted">
        Share these with the {candidateLabel.toLowerCase()} after the appointment.
      </p>
      <div className="grid gap-3 sm:grid-cols-2">
        <FollowupSlot
          candidateId={candidateId}
          type="next_steps"
          title="Next-steps summary"
          description="A short written summary of what was discussed."
          existing={latestOfType(initialFollowups, "next_steps")}
          withContent
        />
        <FollowupSlot
          candidateId={candidateId}
          type="self_report"
          title="4-week self-report"
          description="A brief check-in on progress, sent for later follow-up."
          existing={latestOfType(initialFollowups, "self_report")}
        />
      </div>
    </div>
  );
}
