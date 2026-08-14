"use client";

import { Suspense, useState } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";

function ResetPasswordForm() {
  const searchParams = useSearchParams();
  const linkExpired = searchParams.get("error") === "expired";
  const reason = searchParams.get("reason");
  const [email, setEmail] = useState("");
  const [state, setState] = useState<"idle" | "loading" | "done" | "error">("idle");
  const [error, setError] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setState("loading");
    setError("");

    const supabase = createSupabaseBrowserClient();
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: "https://www.skillosophyapp.com/auth/callback?next=/update-password",
    });

    if (error) {
      setError(error.message);
      setState("error");
    } else {
      setState("done");
    }
  }

  return (
    <div className="flex flex-1 items-center justify-center px-4 py-12">
      <div className="w-full max-w-sm">
        <div className="mb-8 text-center">
          <span className="inline-flex h-11 w-11 items-center justify-center rounded-xl bg-primary text-lg font-bold text-white">
            S
          </span>
          <h1 className="mt-4 text-2xl font-bold tracking-tight">
            Reset your password
          </h1>
          <p className="mt-1 text-sm text-muted">
            Enter your email and we&apos;ll send you a reset link.
          </p>
        </div>

        {linkExpired && (
          <div className="mb-4 rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800 dark:border-amber-900 dark:bg-amber-950/30 dark:text-amber-300">
            That reset link has expired or already been used. Request a new one below.
            {reason && (
              <span className="ml-1 opacity-60">({reason})</span>
            )}
          </div>
        )}

        <div className="rounded-2xl border border-border bg-surface p-6 shadow-sm">
          {state === "done" ? (
            <p className="py-2 text-center text-sm text-muted">
              Check your email — a reset link is on its way.
            </p>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
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
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full rounded-lg border border-border bg-surface px-3 py-2 text-sm outline-none focus:border-primary"
                />
              </div>
              {error && <p className="text-sm text-competent">{error}</p>}
              <button
                type="submit"
                disabled={state === "loading"}
                className="w-full rounded-lg bg-primary py-2.5 text-sm font-semibold text-white transition hover:opacity-90 disabled:opacity-60"
              >
                {state === "loading" ? "Sending…" : "Send Reset Link"}
              </button>
            </form>
          )}
        </div>

        <p className="mt-4 text-center text-xs text-muted">
          <Link href="/login" className="transition-colors hover:text-foreground">
            ← Back to sign in
          </Link>
        </p>
      </div>
    </div>
  );
}

export default function ResetPasswordPage() {
  return (
    <Suspense>
      <ResetPasswordForm />
    </Suspense>
  );
}
