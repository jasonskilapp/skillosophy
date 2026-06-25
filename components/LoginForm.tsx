"use client";

import { useActionState } from "react";
import Link from "next/link";
import { signIn } from "@/app/actions";

export default function LoginForm() {
  const [state, action, pending] = useActionState(signIn, {});
  return (
    <form action={action} className="space-y-4">
      <div>
        <label className="mb-1 block text-sm font-medium" htmlFor="email">
          Email
        </label>
        <input
          id="email"
          name="email"
          type="email"
          autoComplete="email"
          required
          className="w-full rounded-lg border border-border bg-surface px-3 py-2 text-sm outline-none focus:border-primary"
        />
      </div>
      <div>
        <label className="mb-1 block text-sm font-medium" htmlFor="password">
          Password
        </label>
        <input
          id="password"
          name="password"
          type="password"
          autoComplete="current-password"
          required
          className="w-full rounded-lg border border-border bg-surface px-3 py-2 text-sm outline-none focus:border-primary"
        />
      </div>
      <div className="text-right -mt-2">
        <Link href="/reset-password" className="text-xs text-muted hover:text-primary transition-colors">
          Forgot password?
        </Link>
      </div>
      {state.error && <p className="text-sm text-competent">{state.error}</p>}
      <button
        type="submit"
        disabled={pending}
        className="w-full rounded-lg bg-primary py-2.5 text-sm font-semibold text-white transition hover:opacity-90 disabled:opacity-60"
      >
        {pending ? "Signing in…" : "Sign in"}
      </button>
    </form>
  );
}
