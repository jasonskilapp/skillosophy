"use client";

import { useState, useTransition } from "react";
import { matchJobDescriptionAction, tailorProfileAction } from "@/app/actions";
import type { JobMatchResult, JobTailorResult } from "@/lib/types";

type PanelStep =
  | { name: "input" }
  | { name: "matching" }
  | { name: "results"; match: JobMatchResult; jd: string }
  | { name: "tailoring"; match: JobMatchResult; jd: string }
  | { name: "tips"; match: JobMatchResult; jd: string; tailor: JobTailorResult };

function SkillPill({
  label,
  variant,
}: {
  label: string;
  variant: "match" | "missing" | "bonus";
}) {
  const cls =
    variant === "match"
      ? "bg-emerald-50 text-emerald-800 border-emerald-200"
      : variant === "missing"
        ? "bg-rose-50 text-rose-800 border-rose-200"
        : "bg-blue-50 text-blue-800 border-blue-200";
  return (
    <span className={`inline-block rounded-full border px-2.5 py-0.5 text-xs ${cls}`}>
      {label}
    </span>
  );
}

function TipList({ tips, title }: { tips: string[]; title: string }) {
  return (
    <div>
      <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted">{title}</p>
      <ul className="space-y-2">
        {tips.map((tip, i) => (
          <li key={i} className="flex gap-2.5 text-sm">
            <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-primary text-xs font-bold text-white">
              {i + 1}
            </span>
            <span>{tip}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

export default function JobDescriptionPanel({
  candidateId,
  printHref,
}: {
  candidateId: string;
  printHref: string;
}) {
  const [open, setOpen] = useState(false);
  const [step, setStep] = useState<PanelStep>({ name: "input" });
  const [jdText, setJdText] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [matching, startMatch] = useTransition();
  const [tailoring, startTailor] = useTransition();

  function handleOpen() {
    setOpen(true);
    setStep({ name: "input" });
    setError(null);
  }

  function handleClose() {
    setOpen(false);
    // Keep results so re-opening is instant
  }

  function handleMatch() {
    if (!jdText.trim()) return;
    setError(null);
    startMatch(async () => {
      const res = await matchJobDescriptionAction(candidateId, jdText.trim());
      if (res.error) {
        setError(res.error);
        setStep({ name: "input" });
      } else if (res.result) {
        setStep({ name: "results", match: res.result, jd: jdText.trim() });
      }
    });
    setStep({ name: "matching" });
  }

  function handleTailor(match: JobMatchResult, jd: string) {
    setError(null);
    startTailor(async () => {
      const res = await tailorProfileAction(candidateId, jd);
      if (res.error) {
        setError(res.error);
      } else if (res.result) {
        setStep({ name: "tips", match, jd, tailor: res.result });
      }
    });
    setStep({ name: "tailoring", match, jd });
  }

  return (
    <>
      {/* Trigger button */}
      <button
        onClick={handleOpen}
        className="inline-flex items-center gap-2 rounded-lg border border-border bg-surface px-4 py-2.5 text-sm font-medium transition hover:border-primary hover:text-primary"
      >
        <BriefcaseIcon />
        Job description → skills
      </button>

      {/* Overlay */}
      {open && (
        <div
          className="fixed inset-0 z-40 bg-black/40 backdrop-blur-sm"
          onClick={handleClose}
        />
      )}

      {/* Drawer */}
      <aside
        className={`fixed inset-y-0 right-0 z-50 flex w-full max-w-xl flex-col bg-background shadow-2xl transition-transform duration-300 ${
          open ? "translate-x-0" : "translate-x-full"
        }`}
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-border px-5 py-4">
          <h2 className="text-base font-semibold">Job description → skills</h2>
          <button
            onClick={handleClose}
            className="rounded-lg p-1.5 text-muted transition hover:bg-border hover:text-foreground"
          >
            <CloseIcon />
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto px-5 py-5">

          {/* Step: input */}
          {(step.name === "input" || step.name === "matching") && (
            <div className="space-y-4">
              <p className="text-sm text-muted">
                Paste a job posting below. The AI will identify which of the candidate&apos;s skills match, what&apos;s missing, and what bonus skills they bring.
              </p>
              <textarea
                value={jdText}
                onChange={(e) => setJdText(e.target.value)}
                placeholder="Paste the full job description here…"
                rows={14}
                className="w-full rounded-xl border border-border bg-surface px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary resize-none"
              />
              {error && <p className="text-sm text-rose-500">{error}</p>}
              <button
                onClick={handleMatch}
                disabled={matching || !jdText.trim()}
                className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-primary py-2.5 text-sm font-semibold text-white transition hover:opacity-90 disabled:opacity-50"
              >
                {matching ? (
                  <>
                    <SpinIcon />
                    Analysing skills match…
                  </>
                ) : (
                  "Analyse skills match"
                )}
              </button>
            </div>
          )}

          {/* Step: results */}
          {step.name === "results" && (
            <div className="space-y-6">
              {/* Matched */}
              {step.match.matchedSkills.length > 0 && (
                <div>
                  <div className="mb-3 flex items-center gap-2">
                    <span className="h-2.5 w-2.5 rounded-full bg-emerald-500" />
                    <p className="text-sm font-semibold">Skills they have that the job needs</p>
                    <span className="ml-auto rounded-full bg-emerald-100 px-2 py-0.5 text-xs font-medium text-emerald-700">
                      {step.match.matchedSkills.length}
                    </span>
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    {step.match.matchedSkills.map((s, i) => (
                      <SkillPill key={i} label={s} variant="match" />
                    ))}
                  </div>
                </div>
              )}

              {/* Missing */}
              {step.match.missingSkills.length > 0 && (
                <div>
                  <div className="mb-3 flex items-center gap-2">
                    <span className="h-2.5 w-2.5 rounded-full bg-rose-500" />
                    <p className="text-sm font-semibold">Skills the job needs that they&apos;re missing</p>
                    <span className="ml-auto rounded-full bg-rose-100 px-2 py-0.5 text-xs font-medium text-rose-700">
                      {step.match.missingSkills.length}
                    </span>
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    {step.match.missingSkills.map((s, i) => (
                      <SkillPill key={i} label={s} variant="missing" />
                    ))}
                  </div>
                </div>
              )}

              {/* Bonus */}
              {step.match.bonusSkills.length > 0 && (
                <div>
                  <div className="mb-3 flex items-center gap-2">
                    <span className="h-2.5 w-2.5 rounded-full bg-blue-500" />
                    <p className="text-sm font-semibold">Bonus skills that add value</p>
                    <span className="ml-auto rounded-full bg-blue-100 px-2 py-0.5 text-xs font-medium text-blue-700">
                      {step.match.bonusSkills.length}
                    </span>
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    {step.match.bonusSkills.map((s, i) => (
                      <SkillPill key={i} label={s} variant="bonus" />
                    ))}
                  </div>
                </div>
              )}

              <button
                onClick={() => setStep({ name: "input" })}
                className="text-xs font-medium text-muted hover:text-foreground"
              >
                ← Try a different job description
              </button>
            </div>
          )}

          {/* Step: tailoring */}
          {step.name === "tailoring" && (
            <div className="flex flex-col items-center justify-center gap-4 py-16 text-center">
              <SpinIcon className="h-8 w-8 text-primary" />
              <p className="text-sm font-medium">Generating resume & cover letter tips…</p>
              <p className="text-xs text-muted">This takes a few seconds.</p>
            </div>
          )}

          {/* Step: tips */}
          {step.name === "tips" && (
            <div className="space-y-8">
              <TipList title="Resume tips" tips={step.tailor.resumeTips} />
              <TipList title="Cover letter tips" tips={step.tailor.coverLetterTips} />
              <button
                onClick={() => setStep({ name: "results", match: step.match, jd: step.jd })}
                className="text-xs font-medium text-muted hover:text-foreground"
              >
                ← Back to skills match
              </button>
            </div>
          )}
        </div>

        {/* Footer actions */}
        {(step.name === "results" || step.name === "tips") && (
          <div className="border-t border-border px-5 py-4 flex flex-wrap gap-3">
            <a
              href={printHref}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 rounded-lg border border-border bg-surface px-4 py-2 text-sm font-medium transition hover:border-primary hover:text-primary"
            >
              <PrintIcon />
              Produce final report
            </a>
            {step.name === "results" && (
              <button
                onClick={() => handleTailor(step.match, step.jd)}
                disabled={tailoring}
                className="inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-white transition hover:opacity-90 disabled:opacity-50"
              >
                {tailoring ? <SpinIcon className="h-4 w-4" /> : <PencilIcon />}
                {tailoring ? "Generating tips…" : "Tailor profile tips"}
              </button>
            )}
            {error && <p className="self-center text-xs text-rose-500">{error}</p>}
          </div>
        )}
      </aside>
    </>
  );
}

// ── Icons ─────────────────────────────────────────────────────────────────────

function BriefcaseIcon() {
  return (
    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M20.25 14.15v4.25c0 1.094-.787 2.036-1.872 2.18-2.087.277-4.216.42-6.378.42s-4.291-.143-6.378-.42c-1.085-.144-1.872-1.086-1.872-2.18v-4.25m16.5 0a2.18 2.18 0 0 0 .75-1.661V8.706c0-1.081-.768-2.015-1.837-2.175a48.114 48.114 0 0 0-3.413-.387m4.5 8.006c-.194.165-.42.295-.673.38A23.978 23.978 0 0 1 12 15.75c-2.648 0-5.195-.429-7.577-1.22a2.016 2.016 0 0 1-.673-.38m0 0A2.18 2.18 0 0 1 3 12.489V8.706c0-1.081.768-2.015 1.837-2.175a48.111 48.111 0 0 1 3.413-.387m7.5 0V5.25A2.25 2.25 0 0 0 13.5 3h-3a2.25 2.25 0 0 0-2.25 2.25v.894m7.5 0a48.667 48.667 0 0 0-7.5 0M12 12.75h.008v.008H12v-.008Z" />
    </svg>
  );
}

function CloseIcon() {
  return (
    <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" />
    </svg>
  );
}

function SpinIcon({ className = "h-4 w-4" }: { className?: string }) {
  return (
    <svg className={`${className} animate-spin`} fill="none" viewBox="0 0 24 24">
      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 0 1 8-8V0C5.373 0 0 5.373 0 12h4z" />
    </svg>
  );
}

function PrintIcon() {
  return (
    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M6.72 13.829c-.24.03-.48.062-.72.096m.72-.096a42.415 42.415 0 0 1 10.56 0m-10.56 0L6.75 19.5m10.56-5.671-.014.082A42.415 42.415 0 0 1 6.75 19.5m10.56-5.671.014.082A42.415 42.415 0 0 0 17.25 19.5M6.75 19.5H5.25a1.5 1.5 0 0 1-1.5-1.5V7.5a1.5 1.5 0 0 1 1.5-1.5h13.5a1.5 1.5 0 0 1 1.5 1.5v10.5a1.5 1.5 0 0 1-1.5 1.5H17.25m-10.5 0V15a.75.75 0 0 1 .75-.75h9a.75.75 0 0 1 .75.75v4.5" />
    </svg>
  );
}

function PencilIcon() {
  return (
    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
      <path strokeLinecap="round" strokeLinejoin="round" d="m16.862 4.487 1.687-1.688a1.875 1.875 0 1 1 2.652 2.652L10.582 16.07a4.5 4.5 0 0 1-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 0 1 1.13-1.897l8.932-8.931Zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0 1 15.75 21H5.25A2.25 2.25 0 0 1 3 18.75V8.25A2.25 2.25 0 0 1 5.25 6H10" />
    </svg>
  );
}
