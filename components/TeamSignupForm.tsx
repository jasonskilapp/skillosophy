"use client";

import { useActionState } from "react";
import { acceptTeamInvite } from "@/app/actions";

export default function TeamSignupForm({
  token,
  defaultName,
  defaultEmail,
}: {
  token: string;
  defaultName?: string | null;
  defaultEmail?: string | null;
}) {
  const [state, action, pending] = useActionState(acceptTeamInvite, {});
  return (
    <form action={action} className="space-y-4">
      <input type="hidden" name="token" value={token} />
      <div>
        <label className="mb-1 block text-sm font-medium" htmlFor="name">
          Full name
        </label>
        <input
          id="name"
          name="name"
          defaultValue={defaultName ?? ""}
          required
          className="w-full rounded-lg border border-border bg-surface px-3 py-2 text-sm outline-none focus:border-primary"
        />
      </div>
      <div>
        <label className="mb-1 block text-sm font-medium" htmlFor="email">
          Email
        </label>
        <input
          id="email"
          name="email"
          type="email"
          defaultValue={defaultEmail ?? ""}
          required
          className="w-full rounded-lg border border-border bg-surface px-3 py-2 text-sm outline-none focus:border-primary"
        />
      </div>
      <div>
        <label className="mb-1 block text-sm font-medium" htmlFor="password">
          Create a password
        </label>
        <input
          id="password"
          name="password"
          type="password"
          required
          minLength={8}
          className="w-full rounded-lg border border-border bg-surface px-3 py-2 text-sm outline-none focus:border-primary"
        />
        <p className="mt-1 text-xs text-muted">At least 8 characters.</p>
      </div>
      {state.error && <p className="text-sm text-competent">{state.error}</p>}
      <button
        type="submit"
        disabled={pending}
        className="w-full rounded-lg bg-primary py-2.5 text-sm font-semibold text-white transition hover:opacity-90 disabled:opacity-60"
      >
        {pending ? "Joining…" : "Set password & join"}
      </button>
    </form>
  );
}
