"use client";

import { Suspense, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";
import type { EmailOtpType } from "@supabase/supabase-js";

function ConfirmResetForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token_hash = searchParams.get("token_hash") ?? "";
  const type = (searchParams.get("type") ?? "recovery") as EmailOtpType;
  const next = searchParams.get("next") ?? "/update-password";

  const [state, setState] = useState<"idle" | "loading" | "error">("idle");
  const [error, setError] = useState("");

  async function handleConfirm() {
    if (!token_hash) {
      setError("Reset link is missing a token. Please request a new one.");
      setState("error");
      return;
    }
    setState("loading");
    setError("");
    const supabase = createSupabaseBrowserClient();
    const { error } = await supabase.auth.verifyOtp({ token_hash, type });
    if (error) {
      setError(error.message);
      setState("error");
    } else {
      router.push(next);
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
            Click below to confirm and set a new password.
          </p>
        </div>

        <div className="rounded-2xl border border-border bg-surface p-6 shadow-sm">
          {state === "error" ? (
            <div className="space-y-4">
              <p className="text-sm text-competent">{error}</p>
              <a
                href="/reset-password"
                className="block w-full rounded-lg border border-border py-2.5 text-center text-sm font-semibold transition hover:border-border-strong"
              >
                Request a new link
              </a>
            </div>
          ) : (
            <button
              onClick={handleConfirm}
              disabled={state === "loading"}
              className="w-full rounded-lg bg-primary py-2.5 text-sm font-semibold text-white transition hover:opacity-90 disabled:opacity-60"
            >
              {state === "loading" ? "Confirming…" : "Confirm password reset"}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

export default function ConfirmResetPage() {
  return (
    <Suspense>
      <ConfirmResetForm />
    </Suspense>
  );
}
