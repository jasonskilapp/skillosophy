"use client";

import { useActionState } from "react";
import { submitFollowupResponse } from "@/app/actions";
import { selfReportQuestions } from "@/lib/survey";
import type { FollowupType, OrgType } from "@/lib/types";

const RATINGS = [1, 2, 3, 4, 5];

export default function FollowupResponseForm({
  token,
  type,
  orgType,
}: {
  token: string;
  type: FollowupType;
  orgType: OrgType | null;
}) {
  const [state, action, pending] = useActionState(submitFollowupResponse, {});
  const questions = type === "self_report" ? selfReportQuestions(orgType) : [];

  if (state.ok) {
    return (
      <p className="text-center text-sm text-primary">
        Thanks — your response has been recorded.
      </p>
    );
  }

  return (
    <form action={action} className="space-y-4">
      <input type="hidden" name="token" value={token} />

      {questions.map((q) => (
        <div key={q.key}>
          <label className="mb-1 block text-sm font-medium">{q.label}</label>
          {q.kind === "yesno" ? (
            <div className="flex gap-2">
              {(["yes", "no"] as const).map((v) => (
                <label
                  key={v}
                  className="flex items-center gap-1.5 rounded-lg border border-border px-3 py-1.5 text-sm has-[:checked]:border-primary has-[:checked]:bg-primary-soft has-[:checked]:text-primary"
                >
                  <input type="radio" name={q.key} value={v} required className="sr-only" />
                  {v === "yes" ? "Yes" : "No"}
                </label>
              ))}
            </div>
          ) : q.kind === "rating5" ? (
            <div className="flex gap-1.5">
              {RATINGS.map((n) => (
                <label
                  key={n}
                  className="flex h-9 w-9 items-center justify-center rounded-md border border-border text-sm font-semibold has-[:checked]:border-primary has-[:checked]:bg-primary has-[:checked]:text-white"
                >
                  <input type="radio" name={q.key} value={n} required className="sr-only" />
                  {n}
                </label>
              ))}
            </div>
          ) : (
            <textarea
              name={q.key}
              rows={2}
              className="w-full resize-none rounded-lg border border-border bg-surface px-3 py-2 text-sm outline-none focus:border-primary"
            />
          )}
        </div>
      ))}

      {state.error && <p className="text-sm text-competent">{state.error}</p>}
      <button
        type="submit"
        disabled={pending}
        className="w-full rounded-lg bg-primary py-2.5 text-sm font-semibold text-white transition hover:opacity-90 disabled:opacity-60"
      >
        {pending ? "Submitting…" : type === "self_report" ? "Submit" : "Got it, thanks"}
      </button>
    </form>
  );
}
