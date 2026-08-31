"use client";

import { useState } from "react";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";
import { REQUIREMENT_STATUS_LABELS } from "@/lib/types";
import type { CandidateReport, NewcomerPathway, PathwayRequirement, RequirementStatus } from "@/lib/types";

const STATUS_COLORS: Record<RequirementStatus, string> = {
  not_started: "bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400",
  in_progress: "bg-blue-50 text-blue-700 dark:bg-blue-950/40 dark:text-blue-400",
  waiting_external: "bg-amber-50 text-amber-700 dark:bg-amber-950/40 dark:text-amber-400",
  blocked: "bg-red-50 text-red-700 dark:bg-red-950/40 dark:text-red-400",
  complete: "bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400",
  not_applicable: "bg-gray-50 text-gray-400 dark:bg-gray-900 dark:text-gray-500",
  needs_review: "bg-purple-50 text-purple-700 dark:bg-purple-950/40 dark:text-purple-400",
};

async function handleSignOut() {
  const supabase = createSupabaseBrowserClient();
  await supabase.auth.signOut();
  window.location.href = "/login";
}

function ProgressBar({ requirements }: { requirements: PathwayRequirement[] }) {
  const total = requirements.length;
  if (total === 0) return null;
  const done = requirements.filter((r) => r.status === "complete" || r.status === "not_applicable").length;
  const pct = Math.round((done / total) * 100);

  return (
    <div className="mb-6 rounded-xl border border-border bg-surface p-5">
      <div className="mb-2 flex items-center justify-between text-sm">
        <span className="font-medium">Overall progress</span>
        <span className="text-muted">{done} of {total} steps complete</span>
      </div>
      <div className="h-2.5 w-full overflow-hidden rounded-full bg-track">
        <div
          className="h-full rounded-full bg-primary transition-all"
          style={{ width: `${pct}%` }}
        />
      </div>
      <p className="mt-2 text-right text-xs text-muted">{pct}%</p>
    </div>
  );
}

function RequirementCard({ req }: { req: PathwayRequirement }) {
  const isComplete = req.status === "complete" || req.status === "not_applicable";
  return (
    <div className={`rounded-xl border p-4 ${isComplete ? "border-border opacity-60" : "border-border"}`}>
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          <p className={`text-sm font-medium ${isComplete ? "line-through" : ""}`}>{req.title}</p>
          {req.description && (
            <p className="mt-0.5 text-xs text-muted line-clamp-2">{req.description}</p>
          )}
          <div className="mt-2 flex flex-wrap gap-2 text-xs text-muted">
            {req.estimatedTimeline && <span>⏱ {req.estimatedTimeline}</span>}
            {req.estimatedCostCad && <span>💰 {req.estimatedCostCad}</span>}
            {req.sourceUrl && (
              <a href={req.sourceUrl} target="_blank" rel="noopener noreferrer" className="text-primary underline">
                Learn more ↗
              </a>
            )}
          </div>
          {req.caseworkerNote && (
            <div className="mt-2 rounded-lg bg-amber-50 px-3 py-1.5 text-xs text-amber-800 dark:bg-amber-950/30 dark:text-amber-300">
              <span className="font-medium">Caseworker note:</span> {req.caseworkerNote}
            </div>
          )}
        </div>
        <span className={`shrink-0 rounded-full px-2.5 py-1 text-[10px] font-semibold ${STATUS_COLORS[req.status]}`}>
          {REQUIREMENT_STATUS_LABELS[req.status]}
        </span>
      </div>
    </div>
  );
}

interface Props {
  candidateId: string;
  orgName: string;
  report: CandidateReport | null;
  pathway: NewcomerPathway | null;
  requirements: PathwayRequirement[];
  userName: string;
}

export default function ClientDashboard({ orgName, report, pathway, requirements, userName }: Props) {
  const [tab, setTab] = useState<"checklist" | "pathway">("checklist");

  const name = report?.contact?.name ?? userName;
  const profession = pathway?.regulatoryStatus?.profession ?? report?.targetRoles?.[0]?.title ?? "";
  const totalTimeline = pathway?.fullPath?.totalTimeline ?? null;
  const totalCost = pathway?.fullPath?.totalCostCAD ?? null;

  const nextStep = requirements.find(
    (r) => r.status !== "complete" && r.status !== "not_applicable" && r.status !== "not_started"
  ) ?? requirements.find((r) => r.status === "not_started");

  return (
    <div className="min-h-screen bg-background">
      {/* Top bar */}
      <header className="border-b border-border bg-surface px-4 py-3 sm:px-6">
        <div className="mx-auto flex max-w-3xl items-center justify-between">
          <div>
            <p className="text-xs text-muted">{orgName}</p>
            <p className="text-sm font-semibold">My Pathway</p>
          </div>
          <button
            onClick={handleSignOut}
            className="text-xs text-muted transition hover:text-foreground"
          >
            Sign out
          </button>
        </div>
      </header>

      <main className="mx-auto max-w-3xl px-4 py-8 sm:px-6">
        {/* Hero */}
        <div className="mb-6">
          <h1 className="text-xl font-bold">Welcome, {name.split(" ")[0]}</h1>
          {profession && <p className="mt-1 text-sm text-muted">{profession} licensing pathway</p>}
        </div>

        {/* Summary cards */}
        {(totalTimeline || totalCost) && (
          <div className="mb-6 grid grid-cols-2 gap-3 sm:grid-cols-3">
            {totalTimeline && (
              <div className="rounded-xl border border-border bg-surface p-4">
                <p className="text-xs text-muted">Estimated timeline</p>
                <p className="mt-1 text-base font-semibold">{totalTimeline}</p>
              </div>
            )}
            {totalCost && (
              <div className="rounded-xl border border-border bg-surface p-4">
                <p className="text-xs text-muted">Estimated cost</p>
                <p className="mt-1 text-base font-semibold">{totalCost}</p>
              </div>
            )}
            {requirements.length > 0 && (
              <div className="rounded-xl border border-border bg-surface p-4">
                <p className="text-xs text-muted">Steps remaining</p>
                <p className="mt-1 text-base font-semibold">
                  {requirements.filter((r) => r.status !== "complete" && r.status !== "not_applicable").length}
                </p>
              </div>
            )}
          </div>
        )}

        {/* Next step highlight */}
        {nextStep && (
          <div className="mb-6 rounded-xl border border-primary bg-primary-soft px-5 py-4">
            <p className="mb-1 text-xs font-semibold uppercase tracking-wide text-primary">Next step</p>
            <p className="text-sm font-medium">{nextStep.title}</p>
            {nextStep.description && <p className="mt-0.5 text-xs text-muted">{nextStep.description}</p>}
          </div>
        )}

        {/* Progress */}
        {requirements.length > 0 && <ProgressBar requirements={requirements} />}

        {/* Tabs */}
        <div className="mb-4 flex gap-1 border-b border-border">
          {(["checklist", "pathway"] as const).map((t) => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={`px-4 pb-3 text-sm font-medium capitalize transition ${
                tab === t ? "border-b-2 border-primary text-primary" : "text-muted hover:text-foreground"
              }`}
            >
              {t === "checklist" ? "My checklist" : "Pathway details"}
            </button>
          ))}
        </div>

        {/* Checklist tab */}
        {tab === "checklist" && (
          <div className="space-y-3">
            {requirements.length === 0 ? (
              <p className="py-10 text-center text-sm text-muted">Your caseworker hasn&apos;t added checklist items yet.</p>
            ) : (
              requirements.map((r) => <RequirementCard key={r.id} req={r} />)
            )}
          </div>
        )}

        {/* Pathway details tab */}
        {tab === "pathway" && pathway?.fullPath && (
          <div className="space-y-3">
            <p className="mb-4 text-xs text-muted">
              Starting point: <strong>{pathway.fullPath.startingPoint}</strong>
              {" · "}Target: <strong>{pathway.fullPath.targetRole}</strong>
            </p>
            {pathway.fullPath.steps.map((step, i) => (
              <div key={i} className="rounded-xl border border-border bg-surface p-4">
                <div className="mb-1 flex items-center gap-2">
                  <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-primary text-[10px] font-bold text-white">
                    {i + 1}
                  </span>
                  <p className="text-sm font-medium">{step.action}</p>
                </div>
                <p className="ml-7 text-xs text-muted">{step.explanation}</p>
                <div className="ml-7 mt-2 flex gap-3 text-xs text-muted">
                  {step.timeline && <span>⏱ {step.timeline}</span>}
                  {step.costCAD && <span>💰 {step.costCAD}</span>}
                </div>
              </div>
            ))}
          </div>
        )}

        {tab === "pathway" && !pathway?.fullPath && (
          <p className="py-10 text-center text-sm text-muted">Pathway details are not yet available.</p>
        )}
      </main>
    </div>
  );
}
