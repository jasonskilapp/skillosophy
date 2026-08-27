"use client";

import { useActionState, useEffect, useState } from "react";
import { submitUsefulnessSurvey } from "@/app/actions";
import { usefulnessSurveyQuestions } from "@/lib/survey";
import type { OrgType } from "@/lib/types";

const RATINGS = [1, 2, 3, 4, 5];

export default function UsefulnessSurveyBanner({
  userId,
  milestone,
  orgType,
}: {
  userId: string;
  milestone: number;
  orgType: OrgType | null;
}) {
  const [state, action, pending] = useActionState(submitUsefulnessSurvey, {});
  const [dismissed, setDismissed] = useState(true); // default hidden until sessionStorage check runs
  const [open, setOpen] = useState(false);
  const storageKey = `skillosophy-survey-${userId}-${milestone}`;

  useEffect(() => {
    try {
      setDismissed(sessionStorage.getItem(storageKey) === "1");
    } catch {
      setDismissed(false);
    }
  }, [storageKey]);

  function dismiss() {
    try {
      sessionStorage.setItem(storageKey, "1");
    } catch {
      // ignore storage failures — banner just won't stay dismissed
    }
    setDismissed(true);
  }

  if (dismissed || state.ok) return null;

  const questions = usefulnessSurveyQuestions(orgType);
  const usefulnessQuestion = questions.find((q) => q.key === "usefulness");
  const otherQuestions = questions.filter((q) => q.key !== "usefulness");

  return (
    <div className="mb-6 rounded-xl border-2 border-primary/30 bg-primary-soft p-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-sm font-semibold text-primary">
            Quick check-in — you&apos;ve completed {milestone} appointments
          </p>
          <p className="mt-0.5 text-xs text-muted">
            A minute of feedback helps us improve Skillosophy.
          </p>
        </div>
        <div className="flex items-center gap-2">
          {!open && (
            <button
              onClick={() => setOpen(true)}
              className="rounded-lg bg-primary px-3 py-1.5 text-xs font-semibold text-white transition hover:opacity-90"
            >
              Give feedback
            </button>
          )}
          <button
            onClick={dismiss}
            className="text-xs font-medium text-muted hover:text-foreground"
          >
            Dismiss
          </button>
        </div>
      </div>

      {open && (
        <form action={action} className="mt-4 space-y-3 border-t border-primary/20 pt-4">
          <input type="hidden" name="milestone" value={milestone} />

          {usefulnessQuestion && (
            <div>
              <label className="mb-1 block text-xs font-medium">{usefulnessQuestion.label}</label>
              <div className="flex gap-1.5">
                {RATINGS.map((n) => (
                  <label
                    key={n}
                    className="flex h-8 w-8 items-center justify-center rounded-md border border-border bg-surface text-sm font-semibold has-[:checked]:border-primary has-[:checked]:bg-primary has-[:checked]:text-white"
                  >
                    <input type="radio" name="usefulness" value={n} required className="sr-only" />
                    {n}
                  </label>
                ))}
              </div>
            </div>
          )}

          {otherQuestions.map((q) => (
            <div key={q.key}>
              <label className="mb-1 block text-xs font-medium">{q.label}</label>
              {q.kind === "yesno" ? (
                <div className="flex gap-2">
                  {(["yes", "no"] as const).map((v) => (
                    <label
                      key={v}
                      className="flex items-center gap-1.5 rounded-lg border border-border bg-surface px-3 py-1 text-xs has-[:checked]:border-primary has-[:checked]:bg-primary-soft has-[:checked]:text-primary"
                    >
                      <input type="radio" name={q.key} value={v} className="sr-only" />
                      {v === "yes" ? "Yes" : "No"}
                    </label>
                  ))}
                </div>
              ) : (
                <div className="flex gap-1.5">
                  {RATINGS.map((n) => (
                    <label
                      key={n}
                      className="flex h-8 w-8 items-center justify-center rounded-md border border-border bg-surface text-sm font-semibold has-[:checked]:border-primary has-[:checked]:bg-primary has-[:checked]:text-white"
                    >
                      <input type="radio" name={q.key} value={n} className="sr-only" />
                      {n}
                    </label>
                  ))}
                </div>
              )}
            </div>
          ))}

          {state.error && <p className="text-xs text-competent">{state.error}</p>}
          <button
            type="submit"
            disabled={pending}
            className="rounded-lg bg-primary px-4 py-1.5 text-xs font-semibold text-white transition hover:opacity-90 disabled:opacity-60"
          >
            {pending ? "Submitting…" : "Submit"}
          </button>
        </form>
      )}
    </div>
  );
}
