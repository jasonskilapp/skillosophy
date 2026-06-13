"use client";

import { useActionState } from "react";
import { createRecruiter } from "@/app/actions";

export default function RecruiterCreator() {
  const [state, action, pending] = useActionState(createRecruiter, {});
  return (
    <div className="rounded-xl border border-border bg-surface p-5">
      <h2 className="mb-3 text-sm font-semibold">Add a recruiter</h2>
      <form action={action} className="grid gap-3 sm:grid-cols-3">
        <input
          name="name"
          placeholder="Full name"
          required
          className="rounded-lg border border-border px-3 py-2 text-sm outline-none focus:border-primary"
        />
        <input
          name="email"
          type="email"
          placeholder="Email"
          required
          className="rounded-lg border border-border px-3 py-2 text-sm outline-none focus:border-primary"
        />
        <input
          name="password"
          type="password"
          placeholder="Temp password (8+ chars)"
          required
          minLength={8}
          className="rounded-lg border border-border px-3 py-2 text-sm outline-none focus:border-primary"
        />
        <div className="sm:col-span-3">
          <button
            type="submit"
            disabled={pending}
            className="rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-white transition hover:opacity-90 disabled:opacity-60"
          >
            {pending ? "Creating…" : "Create recruiter"}
          </button>
        </div>
      </form>
      {state.error && <p className="mt-3 text-sm text-competent">{state.error}</p>}
      {state.ok && state.message && (
        <p className="mt-3 text-sm text-primary">{state.message}</p>
      )}
    </div>
  );
}
