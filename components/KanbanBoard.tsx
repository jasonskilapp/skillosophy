"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { updateCandidateWorkflowStatus } from "@/app/actions";
import type { CandidateSummary, WorkflowStatus } from "@/lib/types";
import { WORKFLOW_STATUS_LABELS } from "@/lib/types";

const COLUMNS: { status: WorkflowStatus; color: string }[] = [
  { status: "intake", color: "bg-slate-100 dark:bg-slate-800" },
  { status: "appointment_made", color: "bg-blue-50 dark:bg-blue-950" },
  { status: "in_progress", color: "bg-amber-50 dark:bg-amber-950" },
  { status: "upcoming_interviews", color: "bg-purple-50 dark:bg-purple-950" },
  { status: "in_placement", color: "bg-green-50 dark:bg-green-950" },
  { status: "placement_ending_soon", color: "bg-red-50 dark:bg-red-950" },
];

const COLUMN_ACCENT: Record<WorkflowStatus, string> = {
  intake: "border-slate-300",
  appointment_made: "border-blue-300",
  in_progress: "border-amber-300",
  upcoming_interviews: "border-purple-300",
  in_placement: "border-green-300",
  placement_ending_soon: "border-red-400",
};

const BADGE_COLORS: Record<WorkflowStatus, string> = {
  intake: "bg-slate-200 text-slate-700",
  appointment_made: "bg-blue-100 text-blue-700",
  in_progress: "bg-amber-100 text-amber-700",
  upcoming_interviews: "bg-purple-100 text-purple-700",
  in_placement: "bg-green-100 text-green-700",
  placement_ending_soon: "bg-red-100 text-red-700",
};

function formatShortDate(iso?: string | null) {
  if (!iso) return null;
  return new Date(iso).toLocaleDateString("en-CA", { month: "short", day: "numeric" });
}

function CandidateCard({
  candidate,
  onMove,
}: {
  candidate: CandidateSummary;
  onMove: (id: string, status: WorkflowStatus) => void;
}) {
  const [showMenu, setShowMenu] = useState(false);

  return (
    <div
      draggable
      onDragStart={(e) => e.dataTransfer.setData("candidateId", candidate.id)}
      className="group relative cursor-grab rounded-lg border border-border bg-background p-3 shadow-sm transition hover:shadow-md active:cursor-grabbing"
    >
      <Link
        href={`/dashboard/candidate/${candidate.id}`}
        className="block"
        onClick={(e) => { if (showMenu) e.preventDefault(); }}
      >
        <p className="truncate text-sm font-semibold">{candidate.name}</p>
        {candidate.headline && (
          <p className="mt-0.5 truncate text-xs text-muted">{candidate.headline}</p>
        )}
        {candidate.interviewDate && (
          <p className="mt-1.5 text-xs text-purple-600">
            Interview: {formatShortDate(candidate.interviewDate)}
          </p>
        )}
        {candidate.placementEndDate && (
          <p className="mt-1.5 text-xs text-red-600">
            Ends: {formatShortDate(candidate.placementEndDate)}
          </p>
        )}
        {candidate.ownerName && (
          <p className="mt-1.5 text-xs text-muted">{candidate.ownerName}</p>
        )}
      </Link>

      {/* Move to column menu */}
      <div className="absolute right-2 top-2">
        <button
          onClick={() => setShowMenu(!showMenu)}
          className="rounded p-0.5 text-muted opacity-0 transition hover:bg-muted/10 hover:text-foreground group-hover:opacity-100"
          title="Move to column"
        >
          <svg width="14" height="14" viewBox="0 0 16 16" fill="currentColor">
            <circle cx="8" cy="3" r="1.5" />
            <circle cx="8" cy="8" r="1.5" />
            <circle cx="8" cy="13" r="1.5" />
          </svg>
        </button>
        {showMenu && (
          <div className="absolute right-0 top-6 z-20 w-48 rounded-lg border border-border bg-background shadow-lg">
            {COLUMNS.map((col) => (
              <button
                key={col.status}
                onClick={() => { onMove(candidate.id, col.status); setShowMenu(false); }}
                className={`w-full px-3 py-2 text-left text-xs transition hover:bg-muted/10 ${
                  candidate.workflowStatus === col.status ? "font-semibold text-primary" : ""
                }`}
              >
                {WORKFLOW_STATUS_LABELS[col.status]}
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function Column({
  status,
  color,
  candidates,
  onMove,
  onDrop,
}: {
  status: WorkflowStatus;
  color: string;
  candidates: CandidateSummary[];
  onMove: (id: string, status: WorkflowStatus) => void;
  onDrop: (candidateId: string, status: WorkflowStatus) => void;
}) {
  const [dragOver, setDragOver] = useState(false);

  return (
    <div
      className={`flex min-h-[500px] w-64 shrink-0 flex-col rounded-xl border-t-4 ${COLUMN_ACCENT[status]} ${color} p-3`}
      onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
      onDragLeave={() => setDragOver(false)}
      onDrop={(e) => {
        e.preventDefault();
        setDragOver(false);
        const id = e.dataTransfer.getData("candidateId");
        if (id) onDrop(id, status);
      }}
      style={{ outline: dragOver ? "2px dashed #1f9d76" : undefined, outlineOffset: "-2px" }}
    >
      <div className="mb-3 flex items-center justify-between">
        <h2 className="text-xs font-semibold uppercase tracking-wide text-muted">
          {WORKFLOW_STATUS_LABELS[status]}
        </h2>
        <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${BADGE_COLORS[status]}`}>
          {candidates.length}
        </span>
      </div>
      <div className="flex flex-col gap-2">
        {candidates.map((c) => (
          <CandidateCard key={c.id} candidate={c} onMove={onMove} />
        ))}
        {candidates.length === 0 && (
          <div className="rounded-lg border border-dashed border-border p-4 text-center text-xs text-muted">
            Drop here
          </div>
        )}
      </div>
    </div>
  );
}

export default function KanbanBoard({ initialCandidates }: { initialCandidates: CandidateSummary[] }) {
  const [candidates, setCandidates] = useState(initialCandidates);
  const [, startTransition] = useTransition();

  function moveCandidate(candidateId: string, newStatus: WorkflowStatus) {
    setCandidates((prev) =>
      prev.map((c) => c.id === candidateId ? { ...c, workflowStatus: newStatus } : c)
    );
    startTransition(async () => {
      await updateCandidateWorkflowStatus(candidateId, newStatus);
    });
  }

  const byStatus = (status: WorkflowStatus) =>
    candidates.filter((c) => (c.workflowStatus ?? "intake") === status);

  return (
    <div className="flex gap-4 overflow-x-auto pb-6">
      {COLUMNS.map((col) => (
        <Column
          key={col.status}
          status={col.status}
          color={col.color}
          candidates={byStatus(col.status)}
          onMove={moveCandidate}
          onDrop={moveCandidate}
        />
      ))}
    </div>
  );
}
