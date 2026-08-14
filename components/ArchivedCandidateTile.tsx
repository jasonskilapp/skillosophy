"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import type { CandidateSummary } from "@/lib/types";
import { formatDateTime, initials } from "@/lib/format";
import { ClockIcon } from "./icons";
import { archiveCandidate, deleteCandidate } from "@/app/actions";

export default function ArchivedCandidateTile({
  candidate,
  isAdmin,
}: {
  candidate: CandidateSummary;
  isAdmin: boolean;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function handleRestore() {
    setError(null);
    startTransition(async () => {
      const result = await archiveCandidate(candidate.id, false);
      if (result.error) setError(result.error);
      else router.refresh();
    });
  }

  function handleDelete() {
    if (!confirmDelete) {
      setConfirmDelete(true);
      return;
    }
    setError(null);
    startTransition(async () => {
      const result = await deleteCandidate(candidate.id);
      if (result.error) {
        setError(result.error);
        setConfirmDelete(false);
      } else {
        router.refresh();
      }
    });
  }

  return (
    <div className="flex h-full flex-col rounded-xl border border-border bg-surface p-4 opacity-80">
      <div className="flex items-start justify-between gap-2">
        <div className="flex min-w-0 items-center gap-3">
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-surface-raised text-sm font-semibold text-muted">
            {initials(candidate.name)}
          </span>
          <div className="min-w-0">
            <Link
              href={`/dashboard/candidate/${candidate.id}`}
              className="truncate font-semibold leading-tight hover:underline"
            >
              {candidate.name}
            </Link>
            {candidate.headline && (
              <p className="truncate text-xs text-muted">{candidate.headline}</p>
            )}
          </div>
        </div>
        <span className="shrink-0 rounded-full bg-surface-raised px-2 py-0.5 text-[11px] font-medium text-muted">
          Archived
        </span>
      </div>

      <div className="mt-3 space-y-0.5 text-xs text-muted">
        <p className="flex items-center gap-1.5">
          <ClockIcon className="h-3.5 w-3.5" />
          Uploaded {formatDateTime(candidate.uploadedAt)}
        </p>
      </div>

      {error && <p className="mt-2 text-xs text-red-500">{error}</p>}

      <div className="mt-4 flex items-center gap-2">
        <button
          onClick={handleRestore}
          disabled={pending}
          className="rounded-md border border-border px-2.5 py-1 text-xs font-medium transition hover:border-border-strong disabled:opacity-50"
        >
          {pending && !confirmDelete ? "Restoring…" : "Restore"}
        </button>

        {isAdmin && (
          confirmDelete ? (
            <>
              <button
                onClick={handleDelete}
                disabled={pending}
                className="rounded-md bg-red-600 px-2.5 py-1 text-xs font-medium text-white transition hover:bg-red-700 disabled:opacity-50"
              >
                {pending ? "Deleting…" : "Confirm"}
              </button>
              <button
                onClick={() => setConfirmDelete(false)}
                disabled={pending}
                className="text-xs text-muted hover:text-foreground"
              >
                Cancel
              </button>
            </>
          ) : (
            <button
              onClick={() => setConfirmDelete(true)}
              disabled={pending}
              className="rounded-md border border-red-200 px-2.5 py-1 text-xs font-medium text-red-600 transition hover:border-red-300 hover:bg-red-50 disabled:opacity-50 dark:border-red-900 dark:text-red-400 dark:hover:bg-red-950/30"
            >
              Delete
            </button>
          )
        )}
      </div>
    </div>
  );
}
