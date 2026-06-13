"use client";

import { useActionState, useState } from "react";
import { createInvite } from "@/app/actions";

export default function InviteCreator() {
  const [open, setOpen] = useState(false);
  const [state, action, pending] = useActionState(createInvite, {});
  const [copied, setCopied] = useState(false);

  const link =
    state.token && typeof window !== "undefined"
      ? `${window.location.origin}/invite/${state.token}`
      : "";

  return (
    <div className="rounded-xl border border-border bg-surface">
      <button
        onClick={() => setOpen((o) => !o)}
        className="flex w-full items-center justify-between px-4 py-3 text-sm font-semibold"
      >
        Create invite link
        <span className="text-muted">{open ? "–" : "+"}</span>
      </button>

      {open && (
        <div className="border-t border-border p-4">
          <form action={action} className="grid gap-3 sm:grid-cols-2">
            <div className="sm:col-span-1">
              <label className="mb-1 block text-xs font-medium text-muted">
                Candidate name (optional)
              </label>
              <input
                name="candidateName"
                className="w-full rounded-lg border border-border px-3 py-2 text-sm outline-none focus:border-primary"
              />
            </div>
            <div className="sm:col-span-1">
              <label className="mb-1 block text-xs font-medium text-muted">
                Candidate email (optional)
              </label>
              <input
                name="candidateEmail"
                type="email"
                className="w-full rounded-lg border border-border px-3 py-2 text-sm outline-none focus:border-primary"
              />
            </div>
            <div className="sm:col-span-1">
              <label className="mb-1 block text-xs font-medium text-muted">
                Meeting date
              </label>
              <input
                name="meetingDate"
                type="datetime-local"
                required
                className="w-full rounded-lg border border-border px-3 py-2 text-sm outline-none focus:border-primary"
              />
            </div>
            <div className="flex items-end">
              <button
                type="submit"
                disabled={pending}
                className="rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-white transition hover:opacity-90 disabled:opacity-60"
              >
                {pending ? "Generating…" : "Generate link"}
              </button>
            </div>
          </form>

          {state.error && (
            <p className="mt-3 text-sm text-competent">{state.error}</p>
          )}

          {state.token && (
            <div className="mt-4 rounded-lg bg-foundational-soft p-3">
              {state.message && (
                <p className="mb-2 text-xs text-muted">{state.message}</p>
              )}
              <div className="flex items-center gap-2">
                <input
                  readOnly
                  value={link}
                  className="w-full rounded-md border border-border bg-surface px-2 py-1.5 text-xs"
                />
                <button
                  onClick={() => {
                    navigator.clipboard.writeText(link);
                    setCopied(true);
                    setTimeout(() => setCopied(false), 1500);
                  }}
                  className="shrink-0 rounded-md border border-border bg-surface px-3 py-1.5 text-xs font-medium hover:bg-surface/60"
                >
                  {copied ? "Copied" : "Copy"}
                </button>
              </div>
              <p className="mt-2 text-xs text-muted">
                Send this link to the job seeker. It opens a page where they
                create an account and upload their resume.
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
