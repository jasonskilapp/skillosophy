"use client";

import { useState, useTransition } from "react";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";
import { claimClientInvite } from "@/app/actions";

export default function ClaimInviteForm({
  token,
  email,
  name,
}: {
  token: string;
  email: string;
  name: string;
}) {
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    if (password.length < 8) {
      setError("Password must be at least 8 characters.");
      return;
    }
    if (password !== confirm) {
      setError("Passwords do not match.");
      return;
    }

    startTransition(async () => {
      const result = await claimClientInvite(token, password);
      if (result.error) {
        setError(result.error);
        return;
      }

      // Sign in with the newly created credentials
      const supabase = createSupabaseBrowserClient();
      const { error: signInError } = await supabase.auth.signInWithPassword({ email, password });
      if (signInError) {
        setError("Account created — please sign in.");
        window.location.href = "/login";
        return;
      }

      window.location.href = "/dashboard";
    });
  }

  return (
    <form onSubmit={handleSubmit} className="rounded-xl border border-border bg-surface p-8 space-y-5">
      <div>
        <label className="mb-1.5 block text-sm font-medium">Name</label>
        <input
          type="text"
          value={name}
          readOnly
          className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-muted"
        />
      </div>

      <div>
        <label className="mb-1.5 block text-sm font-medium">Email</label>
        <input
          type="email"
          value={email}
          readOnly
          className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-muted"
        />
      </div>

      <div>
        <label className="mb-1.5 block text-sm font-medium">Password</label>
        <input
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
          minLength={8}
          placeholder="At least 8 characters"
          className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
        />
      </div>

      <div>
        <label className="mb-1.5 block text-sm font-medium">Confirm password</label>
        <input
          type="password"
          value={confirm}
          onChange={(e) => setConfirm(e.target.value)}
          required
          placeholder="Repeat your password"
          className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
        />
      </div>

      {error && (
        <p className="rounded-lg border border-red-200 bg-red-50 px-4 py-2 text-sm text-red-700 dark:border-red-900 dark:bg-red-950/30 dark:text-red-400">
          {error}
        </p>
      )}

      <button
        type="submit"
        disabled={isPending}
        className="w-full rounded-lg bg-primary px-4 py-2.5 text-sm font-semibold text-white transition hover:opacity-90 disabled:opacity-60"
      >
        {isPending ? "Creating account…" : "Create account & view pathway"}
      </button>
    </form>
  );
}
