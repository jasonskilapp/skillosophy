"use client";

import { useTransition, useState } from "react";
import { useRouter } from "next/navigation";
import { updateCandidateWorkflowStatus } from "@/app/actions";
import { WORKFLOW_STATUS_LABELS, type WorkflowStatus } from "@/lib/types";

const STATUSES = Object.entries(WORKFLOW_STATUS_LABELS) as [
  WorkflowStatus,
  string,
][];

export default function WorkflowStatusSelector({
  candidateId,
  currentStatus,
}: {
  candidateId: string;
  currentStatus: WorkflowStatus | null;
}) {
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  const handleChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const value = e.target.value || null;
    setError(null);
    startTransition(async () => {
      const result = await updateCandidateWorkflowStatus(candidateId, value);
      if (result.error) {
        setError(result.error);
      } else {
        router.refresh();
      }
    });
  };

  return (
    <div className="flex items-center gap-2">
      <span className="text-xs font-medium text-muted">Status</span>
      <select
        defaultValue={currentStatus ?? ""}
        onChange={handleChange}
        disabled={pending}
        className="rounded-lg border border-border bg-surface px-3 py-1.5 text-sm font-medium outline-none focus:border-primary disabled:opacity-50"
      >
        <option value="">— Not set —</option>
        {STATUSES.map(([value, label]) => (
          <option key={value} value={value}>
            {label}
          </option>
        ))}
      </select>
      {pending && <span className="text-xs text-muted">Saving…</span>}
      {error && <span className="text-xs text-competent">{error}</span>}
    </div>
  );
}
