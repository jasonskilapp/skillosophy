"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { archiveCandidate, deleteCandidate } from "@/app/actions";

interface Props {
  candidateId: string;
  isAdmin: boolean;
  isArchived: boolean;
}

export default function CandidateActions({ candidateId, isAdmin, isArchived }: Props) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function handleArchive() {
    setError(null);
    startTransition(async () => {
      const result = await archiveCandidate(candidateId, !isArchived);
      if (result.error) {
        setError(result.error);
      } else {
        router.push("/dashboard");
        router.refresh();
      }
    });
  }

  function handleDelete() {
    if (!confirmDelete) {
      setConfirmDelete(true);
      return;
    }
    setError(null);
    startTransition(async () => {
      const result = await deleteCandidate(candidateId);
      if (result.error) {
        setError(result.error);
        setConfirmDelete(false);
      } else {
        router.push("/dashboard");
        router.refresh();
      }
    });
  }

  return (
    <div className="flex items-center gap-2">
      {error && (
        <span className="text-xs text-red-500">{error}</span>
      )}

      {/* Archive / Restore */}
      <button
        onClick={handleArchive}
        disabled={pending}
        className="inline-flex items-center gap-1.5 rounded-lg border border-border bg-surface px-3 py-1.5 text-sm font-medium text-foreground transition hover:border-border-strong hover:bg-surface-raised disabled:opacity-50"
      >
        {isArchived ? "Restore" : "Archive"}
      </button>

      {/* Delete (admin only) */}
      {isAdmin && (
        confirmDelete ? (
          <div className="flex items-center gap-2">
            <span className="text-xs text-muted">Delete permanently?</span>
            <button
              onClick={handleDelete}
              disabled={pending}
              className="rounded-lg bg-red-600 px-3 py-1.5 text-sm font-medium text-white transition hover:bg-red-700 disabled:opacity-50"
            >
              {pending ? "Deleting…" : "Confirm delete"}
            </button>
            <button
              onClick={() => setConfirmDelete(false)}
              disabled={pending}
              className="text-sm text-muted hover:text-foreground"
            >
              Cancel
            </button>
          </div>
        ) : (
          <button
            onClick={() => setConfirmDelete(true)}
            disabled={pending}
            className="rounded-lg border border-red-200 bg-red-50 px-3 py-1.5 text-sm font-medium text-red-600 transition hover:border-red-300 hover:bg-red-100 disabled:opacity-50 dark:border-red-900 dark:bg-red-950/30 dark:text-red-400 dark:hover:border-red-800"
          >
            Delete
          </button>
        )
      )}
    </div>
  );
}
