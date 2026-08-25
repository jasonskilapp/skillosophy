"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import {
  rerunAnalysis,
  acceptPendingReport,
  discardPendingReport,
} from "@/app/actions";
import JobDescriptionPanel from "./JobDescriptionPanel";
import type { CandidateReport, NewcomerPathway } from "@/lib/types";

function CareerBadge({ stage }: { stage: string }) {
  return (
    <span className="rounded-full border border-border bg-surface px-2.5 py-0.5 text-xs font-medium">
      {stage}
    </span>
  );
}

function PendingPanel({
  candidateId,
  pendingReport,
}: {
  candidateId: string;
  pendingReport: CandidateReport;
}) {
  const router = useRouter();
  const [accepting, startAccept] = useTransition();
  const [discarding, startDiscard] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [expanded, setExpanded] = useState(false);

  function handleAccept() {
    startAccept(async () => {
      const res = await acceptPendingReport(candidateId);
      if (res.error) setError(res.error);
      else router.refresh();
    });
  }

  function handleDiscard() {
    startDiscard(async () => {
      const res = await discardPendingReport(candidateId);
      if (res.error) setError(res.error);
      else router.refresh();
    });
  }

  const topIndustries = pendingReport.industries?.slice(0, 3) ?? [];
  const headline = pendingReport.contact?.headline;

  return (
    <div className="mt-8 rounded-2xl border-2 border-primary/30 bg-primary-soft p-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="text-sm font-semibold text-primary">Revised analysis ready</p>
          <p className="mt-0.5 text-xs text-muted">
            Re-run completed with caseworker notes. Review the changes below before accepting.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={handleDiscard}
            disabled={discarding || accepting}
            className="rounded-lg border border-border bg-surface px-3 py-1.5 text-xs font-medium text-muted transition hover:text-foreground disabled:opacity-50"
          >
            {discarding ? "Discarding…" : "Discard"}
          </button>
          <button
            onClick={handleAccept}
            disabled={accepting || discarding}
            className="rounded-lg bg-primary px-4 py-1.5 text-xs font-semibold text-white transition hover:opacity-90 disabled:opacity-50"
          >
            {accepting ? "Accepting…" : "Accept new analysis"}
          </button>
        </div>
      </div>

      {error && <p className="mt-3 text-xs text-rose-500">{error}</p>}

      {/* Key summary of what changed */}
      <div className="mt-5 grid gap-4 sm:grid-cols-2">
        <div className="rounded-xl border border-border bg-surface p-4">
          <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted">Career stage</p>
          <CareerBadge stage={pendingReport.careerStage} />
          {headline && <p className="mt-2 text-sm text-foreground/80 italic">&ldquo;{headline}&rdquo;</p>}
        </div>
        <div className="rounded-xl border border-border bg-surface p-4">
          <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted">Top industries</p>
          <ul className="space-y-1">
            {topIndustries.map((ind, i) => (
              <li key={i} className="flex items-center gap-2 text-sm">
                <span
                  className={`shrink-0 rounded-full px-2 py-0.5 text-xs font-medium ${
                    ind.type === "Non-Traditional"
                      ? "bg-accent-blue-soft text-accent-blue"
                      : "bg-primary-soft text-primary"
                  }`}
                >
                  {ind.type === "Non-Traditional" ? "Non-trad" : "Traditional"}
                </span>
                {ind.name}
              </li>
            ))}
          </ul>
        </div>
      </div>

      <button
        onClick={() => setExpanded((v) => !v)}
        className="mt-4 text-xs font-medium text-primary hover:underline"
      >
        {expanded ? "Hide full revised analysis ↑" : "View full revised analysis ↓"}
      </button>

      {expanded && (
        <div className="mt-4 rounded-xl border border-border bg-surface p-5 space-y-4 text-sm">
          {/* Skills summary */}
          {pendingReport.skills?.hard?.length > 0 && (
            <div>
              <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted">Hard skills</p>
              <div className="flex flex-wrap gap-1.5">
                {pendingReport.skills.hard.map((s, i) => (
                  <span key={i} className="rounded-full bg-foundational-soft px-2.5 py-0.5 text-xs">{s.name}</span>
                ))}
              </div>
            </div>
          )}
          {/* Target roles */}
          {pendingReport.targetRoles?.length > 0 && (
            <div>
              <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted">Target roles</p>
              <ul className="space-y-1">
                {pendingReport.targetRoles.map((r, i) => (
                  <li key={i} className="text-sm font-medium">{r.title}</li>
                ))}
              </ul>
            </div>
          )}
          {/* Recruiter notes */}
          {pendingReport.recruiterNotes?.length > 0 && (
            <div>
              <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted">Recruiter notes</p>
              <ul className="space-y-1.5">
                {pendingReport.recruiterNotes.map((n, i) => (
                  <li key={i} className={`text-xs ${n.tone === "caution" ? "text-amber-700" : "text-foreground/80"}`}>
                    {n.tone === "caution" ? "⚠ " : "✓ "}{n.text}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default function ReportFooterActions({
  candidateId,
  pendingReport,
  pendingPathway,
  hasReport,
}: {
  candidateId: string;
  pendingReport: CandidateReport | null;
  pendingPathway: NewcomerPathway | null;
  hasReport: boolean;
}) {
  const router = useRouter();
  const [rerunning, startRerun] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);

  void pendingPathway; // passed through; pathway is shown via the main panel

  function handleRerun() {
    setError(null);
    setDone(false);
    startRerun(async () => {
      const res = await rerunAnalysis(candidateId);
      if (res.error) setError(res.error);
      else {
        setDone(true);
        router.refresh();
      }
    });
  }

  return (
    <div className="mt-10 border-t border-border pt-6">
      <div className="flex flex-wrap items-center gap-3">
        <a
          href={`/dashboard/candidate/${candidateId}/print`}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-2 rounded-lg border border-border bg-surface px-4 py-2.5 text-sm font-medium transition hover:border-primary hover:text-primary"
        >
          <PrintIcon />
          Produce final report
        </a>

        {hasReport && (
          <>
            <button
              onClick={handleRerun}
              disabled={rerunning}
              className="inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2.5 text-sm font-semibold text-white transition hover:opacity-90 disabled:opacity-60"
            >
              <RefreshIcon spinning={rerunning} />
              {rerunning ? "Re-running analysis…" : "Re-run with caseworker notes"}
            </button>

            <JobDescriptionPanel
              candidateId={candidateId}
              printHref={`/dashboard/candidate/${candidateId}/print`}
            />
          </>
        )}

        {done && !rerunning && (
          <span className="text-sm text-emerald-600 font-medium">Analysis revised — review below ↓</span>
        )}
        {error && <span className="text-sm text-rose-500">{error}</span>}
      </div>

      {pendingReport && (
        <PendingPanel candidateId={candidateId} pendingReport={pendingReport} />
      )}
    </div>
  );
}

function PrintIcon() {
  return (
    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M6.72 13.829c-.24.03-.48.062-.72.096m.72-.096a42.415 42.415 0 0 1 10.56 0m-10.56 0L6.75 19.5m10.56-5.671-.014.082A42.415 42.415 0 0 1 6.75 19.5m10.56-5.671.014.082A42.415 42.415 0 0 0 17.25 19.5M6.75 19.5H5.25a1.5 1.5 0 0 1-1.5-1.5V7.5a1.5 1.5 0 0 1 1.5-1.5h13.5a1.5 1.5 0 0 1 1.5 1.5v10.5a1.5 1.5 0 0 1-1.5 1.5H17.25m-10.5 0V15a.75.75 0 0 1 .75-.75h9a.75.75 0 0 1 .75.75v4.5" />
    </svg>
  );
}

function RefreshIcon({ spinning }: { spinning: boolean }) {
  return (
    <svg
      className={`h-4 w-4 ${spinning ? "animate-spin" : ""}`}
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
      strokeWidth={1.8}
    >
      <path strokeLinecap="round" strokeLinejoin="round" d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0 3.181 3.183a8.25 8.25 0 0 0 13.803-3.7M4.031 9.865a8.25 8.25 0 0 1 13.803-3.7l3.181 3.182m0-4.991v4.99" />
    </svg>
  );
}
