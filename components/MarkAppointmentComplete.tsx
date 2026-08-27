"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { markAppointmentComplete } from "@/app/actions";
import { CheckIcon } from "./icons";
import { formatDateTime } from "@/lib/format";

const RATINGS = [1, 2, 3, 4, 5];

export default function MarkAppointmentComplete({
  candidateId,
  completedAt,
  usefulRating,
  timeSavedMin,
  appointmentNote,
}: {
  candidateId: string;
  completedAt: string | null;
  usefulRating: number | null;
  timeSavedMin: number | null;
  appointmentNote: string | null;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [editing, setEditing] = useState(false);
  const [rating, setRating] = useState<number | null>(usefulRating);
  const [minutes, setMinutes] = useState(timeSavedMin != null ? String(timeSavedMin) : "");
  const [note, setNote] = useState(appointmentNote ?? "");

  function submit(overrideEmpty = false) {
    setError(null);
    startTransition(async () => {
      const result = await markAppointmentComplete(candidateId, overrideEmpty
        ? { usefulRating: null, timeSavedMin: null, appointmentNote: null }
        : {
            usefulRating: rating,
            timeSavedMin: minutes ? Number(minutes) : null,
            appointmentNote: note.trim() || null,
          });
      if (result.error) setError(result.error);
      else {
        setEditing(false);
        router.refresh();
      }
    });
  }

  if (!completedAt && !editing) {
    return (
      <div className="flex items-center gap-3">
        <button
          onClick={() => setEditing(true)}
          className="inline-flex items-center gap-1.5 rounded-lg bg-primary px-3 py-1.5 text-xs font-semibold text-white transition hover:opacity-90"
        >
          <CheckIcon className="h-3.5 w-3.5" />
          Mark appointment complete
        </button>
      </div>
    );
  }

  if (!editing) {
    return (
      <div className="flex flex-wrap items-center gap-2">
        <span className="inline-flex items-center gap-1.5 rounded-full bg-primary-soft px-2.5 py-1 text-xs font-medium text-primary">
          <CheckIcon className="h-3.5 w-3.5" />
          Appointment completed {formatDateTime(completedAt)}
        </span>
        <button
          onClick={() => setEditing(true)}
          className="text-xs font-medium text-muted hover:text-foreground"
        >
          Edit feedback
        </button>
      </div>
    );
  }

  return (
    <div className="w-full rounded-lg border border-border bg-foundational-soft p-4">
      <p className="mb-3 text-xs font-semibold uppercase tracking-wide text-muted">
        Optional feedback
      </p>
      <div className="grid gap-3 sm:grid-cols-2">
        <div>
          <label className="mb-1 block text-xs font-medium text-muted">
            How useful was this appointment?
          </label>
          <div className="flex gap-1.5">
            {RATINGS.map((n) => (
              <button
                key={n}
                type="button"
                onClick={() => setRating(rating === n ? null : n)}
                className={`h-8 w-8 rounded-md border text-sm font-semibold transition ${
                  rating === n
                    ? "border-primary bg-primary text-white"
                    : "border-border bg-surface hover:border-primary"
                }`}
              >
                {n}
              </button>
            ))}
          </div>
        </div>
        <div>
          <label className="mb-1 block text-xs font-medium text-muted">
            Time saved (minutes, optional)
          </label>
          <input
            type="number"
            min={0}
            value={minutes}
            onChange={(e) => setMinutes(e.target.value)}
            className="w-full rounded-lg border border-border bg-surface px-3 py-2 text-sm outline-none focus:border-primary"
          />
        </div>
      </div>
      <div className="mt-3">
        <label className="mb-1 block text-xs font-medium text-muted">Note (optional)</label>
        <textarea
          rows={2}
          value={note}
          onChange={(e) => setNote(e.target.value)}
          className="w-full resize-none rounded-lg border border-border bg-surface px-3 py-2 text-sm outline-none focus:border-primary"
        />
      </div>
      <div className="mt-3 flex items-center gap-3">
        <button
          onClick={() => submit(false)}
          disabled={pending}
          className="rounded-lg bg-primary px-4 py-1.5 text-xs font-semibold text-white transition hover:opacity-90 disabled:opacity-60"
        >
          {pending ? "Saving…" : completedAt ? "Save feedback" : "Mark complete"}
        </button>
        {!completedAt && (
          <button
            onClick={() => submit(true)}
            disabled={pending}
            className="text-xs font-medium text-muted hover:text-foreground"
          >
            Skip feedback
          </button>
        )}
        {completedAt && (
          <button
            onClick={() => setEditing(false)}
            disabled={pending}
            className="text-xs font-medium text-muted hover:text-foreground"
          >
            Cancel
          </button>
        )}
        {error && <span className="text-xs text-competent">{error}</span>}
      </div>
    </div>
  );
}
