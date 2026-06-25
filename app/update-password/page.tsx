"use client";

import { useActionState } from "react";
import { updatePassword } from "@/app/actions";

export default function UpdatePasswordPage() {
  const [state, action, pending] = useActionState(updatePassword, {});

  return (
    <div className="flex flex-1 items-center justify-center px-4 py-12">
      <div className="w-full max-w-sm">
        <div className="mb-8 text-center">
          <span className="inline-flex h-11 w-11 items-center justify-center rounded-xl bg-primary text-lg font-bold text-white">
            S
          </span>
          <h1 className="mt-4 text-2xl font-bold tracking-tight">Set new password</h1>
          <p className="mt-1 text-sm text-muted">
            Choose a strong password for your account.
          </p>
        </div>

        <div className="rounded-2xl border border-border bg-surface p-6 shadow-sm">
          <form action={action} className="space-y-4">
            <div>
              <label className="mb-1 block text-sm font-medium" htmlFor="password">
                New Password
              </label>
              <input
                id="password"
                name="password"
                type="password"
                autoComplete="new-password"
                required
                minLength={8}
                className="w-full rounded-lg border border-border bg-surface px-3 py-2 text-sm outline-none focus:border-primary"
              />
            </div>
            {state.error && (
              <p className="text-sm text-competent">{state.error}</p>
            )}
            <button
              type="submit"
              disabled={pending}
              className="w-full rounded-lg bg-primary py-2.5 text-sm font-semibold text-white transition hover:opacity-90 disabled:opacity-60"
            >
              {pending ? "Updating…" : "Update Password"}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
