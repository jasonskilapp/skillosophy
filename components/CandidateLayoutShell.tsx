"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import CandidateProfile, { RecruiterNotes } from "@/components/CandidateProfile";
import WorkflowStatusSelector from "@/components/WorkflowStatusSelector";
import MarkAppointmentComplete from "@/components/MarkAppointmentComplete";
import FollowupLinks from "@/components/FollowupLinks";
import CandidateNotes from "@/components/CandidateNotes";
import NewcomerPathwayPanel from "@/components/NewcomerPathway";
import CandidateActions from "@/components/CandidateActions";
import ReportFooterActions from "@/components/ReportFooterActions";
import { ArrowLeftIcon, CalendarIcon, ClockIcon } from "@/components/icons";
import { formatDate, formatDateTime } from "@/lib/format";
import type {
  CandidateNote,
  CandidateReport,
  CandidateSummary,
  Followup,
  NewcomerPathway,
  PathwayRequirement,
} from "@/lib/types";

type Layout = "single" | "sidebyside";

const STORAGE_KEY = "skillosophy_layout";

// ── Layout toggle icons ───────────────────────────────────────────────────────

function SingleColumnIcon({ active }: { active: boolean }) {
  return (
    <svg width="18" height="18" viewBox="0 0 18 18" fill="none" aria-hidden>
      <rect x="3" y="2" width="12" height="14" rx="2"
        fill={active ? "currentColor" : "none"}
        stroke="currentColor" strokeWidth="1.5" />
    </svg>
  );
}

function SideBySideIcon({ active }: { active: boolean }) {
  return (
    <svg width="18" height="18" viewBox="0 0 18 18" fill="none" aria-hidden>
      <rect x="1" y="2" width="7" height="14" rx="2"
        fill={active ? "currentColor" : "none"}
        stroke="currentColor" strokeWidth="1.5" />
      <rect x="10" y="2" width="7" height="14" rx="2"
        fill={active ? "currentColor" : "none"}
        stroke="currentColor" strokeWidth="1.5" />
    </svg>
  );
}

// ── Props ─────────────────────────────────────────────────────────────────────

interface Props {
  candidateId: string;
  isNewcomerOrg: boolean;
  isAdmin: boolean;
  isArchived: boolean;
  backLabel: string;
  meetingLabel: string;
  summary: CandidateSummary;
  report: CandidateReport | null;
  pathway: NewcomerPathway | null;
  pendingReport: CandidateReport | null;
  pendingPathway: NewcomerPathway | null;
  appointmentCompletedAt: string | null;
  usefulRating: number | null;
  timeSavedMin: number | null;
  appointmentNote: string | null;
  notesBySection: Record<string, CandidateNote[]>;
  generalNotes: CandidateNote[];
  followups: Followup[];
  requirements: PathwayRequirement[];
}

// ── Shell ─────────────────────────────────────────────────────────────────────

export default function CandidateLayoutShell({
  candidateId,
  isNewcomerOrg,
  isAdmin,
  isArchived,
  backLabel,
  meetingLabel,
  summary,
  report,
  pathway,
  pendingReport,
  pendingPathway,
  appointmentCompletedAt,
  usefulRating,
  timeSavedMin,
  appointmentNote,
  notesBySection,
  generalNotes,
  followups,
  requirements,
}: Props) {
  const [layout, setLayout] = useState<Layout>("single");

  // Read saved preference from sessionStorage once mounted
  useEffect(() => {
    try {
      const saved = sessionStorage.getItem(STORAGE_KEY);
      if (saved === "sidebyside") setLayout("sidebyside");
    } catch {}
  }, []);

  function switchLayout(next: Layout) {
    setLayout(next);
    try { sessionStorage.setItem(STORAGE_KEY, next); } catch {}
  }

  const isSideBySide = layout === "sidebyside";

  // ── Shared blocks ──────────────────────────────────────────────────────────

  const navRow = (
    <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
      <Link
        href="/dashboard"
        className="inline-flex items-center gap-1.5 text-sm font-medium text-muted transition hover:text-foreground"
      >
        <ArrowLeftIcon className="h-4 w-4" />
        {backLabel}
      </Link>

      <div className="flex flex-wrap items-center gap-3">
        {/* Dates */}
        <div className="flex flex-wrap items-center gap-4 text-xs text-muted">
          <span className="inline-flex items-center gap-1.5">
            <ClockIcon className="h-3.5 w-3.5" />
            Uploaded {formatDateTime(summary.uploadedAt)}
          </span>
          {summary.meetingDate && (
            <span className="inline-flex items-center gap-1.5">
              <CalendarIcon className="h-3.5 w-3.5" />
              {meetingLabel} {formatDate(summary.meetingDate)}
            </span>
          )}
        </div>

        {/* Layout toggle */}
        <div
          className="flex items-center rounded-lg border border-border bg-surface p-0.5"
          title="Switch layout"
        >
          <button
            onClick={() => switchLayout("single")}
            aria-label="Single column"
            className={`flex items-center justify-center rounded-md p-1.5 transition ${
              !isSideBySide
                ? "bg-primary text-white"
                : "text-muted hover:text-foreground"
            }`}
          >
            <SingleColumnIcon active={!isSideBySide} />
          </button>
          <button
            onClick={() => switchLayout("sidebyside")}
            aria-label="Side by side"
            className={`flex items-center justify-center rounded-md p-1.5 transition ${
              isSideBySide
                ? "bg-primary text-white"
                : "text-muted hover:text-foreground"
            }`}
          >
            <SideBySideIcon active={isSideBySide} />
          </button>
        </div>

        {/* Actions */}
        <CandidateActions
          candidateId={candidateId}
          isAdmin={isAdmin}
          isArchived={isArchived}
        />
      </div>
    </div>
  );

  const archivedBanner = summary.archivedAt ? (
    <div className="mb-4 rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800 dark:border-amber-900 dark:bg-amber-950/30 dark:text-amber-300">
      This profile is archived. Restore it to make it visible on the dashboard.
    </div>
  ) : null;

  const statusBar = (
    <div className="mb-3 flex items-center rounded-lg border border-border bg-surface px-4 py-3">
      <WorkflowStatusSelector
        candidateId={candidateId}
        currentStatus={summary.workflowStatus ?? null}
      />
    </div>
  );

  const appointmentBlock = (
    <div className="mb-6">
      <MarkAppointmentComplete
        candidateId={candidateId}
        completedAt={appointmentCompletedAt}
        usefulRating={usefulRating}
        timeSavedMin={timeSavedMin}
        appointmentNote={appointmentNote}
      />
    </div>
  );

  const profileBlock = report ? (
    <CandidateProfile
      report={report}
      candidateId={candidateId}
      notesBySection={notesBySection}
      isNewcomerOrg={isNewcomerOrg}
    />
  ) : (
    <div className="rounded-xl border border-border bg-surface p-10 text-center">
      <p className="font-medium">Analysis not ready</p>
      <p className="mt-1 text-sm text-muted">
        This resume is still being analyzed, or analysis failed. Check back shortly.
      </p>
    </div>
  );

  const recruiterBlock = report && (
    <RecruiterNotes
      report={report}
      candidateId={candidateId}
      notes={notesBySection["recruiter"] ?? []}
    />
  );

  const notesBlock = (
    <CandidateNotes candidateId={candidateId} initialNotes={generalNotes} />
  );

  const footerBlock = (
    <ReportFooterActions
      candidateId={candidateId}
      pendingReport={pendingReport}
      pendingPathway={pendingPathway}
      hasReport={!!report}
    />
  );

  const followupBlock = (
    <div className="mt-8">
      <FollowupLinks
        candidateId={candidateId}
        initialFollowups={followups}
        appointmentCompleted={!!appointmentCompletedAt}
        candidateLabel="candidate"
      />
    </div>
  );

  const pathwayBlock = isNewcomerOrg && (
    <NewcomerPathwayPanel candidateId={candidateId} pathway={pathway} requirements={requirements} />
  );

  // ── Single column layout ───────────────────────────────────────────────────

  if (!isSideBySide) {
    return (
      <main className="mx-auto w-full max-w-5xl flex-1 px-4 py-8 sm:px-6">
        {navRow}
        {archivedBanner}
        {statusBar}
        {appointmentBlock}
        {profileBlock}
        {pathwayBlock}
        {recruiterBlock}
        {notesBlock}
        {footerBlock}
        {followupBlock}
      </main>
    );
  }

  // ── Side by side layout ────────────────────────────────────────────────────

  return (
    <main className="w-full flex-1 px-6 py-8">
      {navRow}
      {archivedBanner}
      {statusBar}
      {appointmentBlock}

      <div className="flex items-start gap-6">
        {/* Left column — profile content */}
        <div className="min-w-0 flex-1 space-y-7">
          {profileBlock}
          {recruiterBlock}
          {notesBlock}
          {footerBlock}
          {followupBlock}
        </div>

        {/* Right column — pathway, sticky */}
        {isNewcomerOrg && (
          <div
            className="flex-1 min-w-0 sticky top-6 max-h-[calc(100vh-5rem)] overflow-y-auto rounded-xl"
            style={{ scrollbarWidth: "thin" }}
          >
            <NewcomerPathwayPanel candidateId={candidateId} pathway={pathway} requirements={requirements} />
          </div>
        )}
      </div>
    </main>
  );
}
