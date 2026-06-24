"use client";

import { useActionState, useState } from "react";
import { createTeamInvite } from "@/app/actions";

export default function TeamInviteCreator({ memberLabel }: { memberLabel: string }) {
  const [state, action, pending] = useActionState(createTeamInvite, {});
  const [copied, setCopied] = useState(false);

  const link =
    state.token && typeof window !== "undefined"
      ? `${window.location.origin}/join/${state.token}`
      : "";

  return (
    <div className="rounded-xl border border-border bg-surface p-5">
      <h2 className="mb-3 text-sm font-semibold">Invite a teammate</h2>
      <form action={action} className="grid gap-3 sm:grid-cols-4">
        <input
          name="name"
          placeholder="Name (optional)"
          className="rounded-lg border border-border px-3 py-2 text-sm outline-none focus:border-primary"
        />
        <input
          name="email"
          type="email"
          placeholder="Email"
          required
          className="rounded-lg border border-border px-3 py-2 text-sm outline-none focus:border-primary"
        />
        <select
          name="orgRole"
          className="rounded-lg border border-border bg-surface px-3 py-2 text-sm outline-none focus:border-primary"
        >
          <option value="member">{memberLabel} (member)</option>
          <option value="org_admin">Org admin</option>
        </select>
        <button
          type="submit"
          disabled={pending}
          className="rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-white transition hover:opacity-90 disabled:opacity-60"
        >
          {pending ? "Generating…" : "Generate link"}
        </button>
      </form>

      {state.error && <p className="mt-3 text-sm text-competent">{state.error}</p>}

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
            Send this link to your teammate to set a password and join the
            organization.
          </p>
        </div>
      )}
    </div>
  );
}
