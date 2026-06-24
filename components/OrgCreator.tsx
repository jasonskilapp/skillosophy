"use client";

import { useActionState, useState } from "react";
import { createOrganization } from "@/app/actions";

export default function OrgCreator({ suggestedCode }: { suggestedCode: string }) {
  const [open, setOpen] = useState(false);
  const [state, action, pending] = useActionState(createOrganization, {});
  const [copied, setCopied] = useState(false);

  const link =
    state.token && typeof window !== "undefined"
      ? `${window.location.origin}/join/${state.token}`
      : "";

  return (
    <div className="rounded-xl border border-border bg-surface">
      <button
        onClick={() => setOpen((o) => !o)}
        className="flex w-full items-center justify-between px-4 py-3 text-sm font-semibold"
      >
        Create organization
        <span className="text-muted">{open ? "–" : "+"}</span>
      </button>

      {open && (
        <div className="border-t border-border p-4">
          <form action={action} className="grid gap-3 sm:grid-cols-2">
            <Field label="Organization name" className="sm:col-span-2">
              <input
                name="name"
                required
                placeholder="UofT Career Centre"
                className="w-full rounded-lg border border-border px-3 py-2 text-sm outline-none focus:border-primary"
              />
            </Field>
            <Field label="Customer code">
              <input
                name="customerCode"
                defaultValue={suggestedCode}
                className="w-full rounded-lg border border-border px-3 py-2 text-sm uppercase outline-none focus:border-primary"
              />
              <span className="mt-1 block text-[11px] text-muted">
                Auto-suggested — edit to match your records.
              </span>
            </Field>
            <Field label="Type">
              <select
                name="type"
                className="w-full rounded-lg border border-border bg-surface px-3 py-2 text-sm outline-none focus:border-primary"
              >
                <option value="campus">Campus (career advisors)</option>
                <option value="newcomer">Newcomer (caseworkers)</option>
              </select>
            </Field>
            <Field label="Seat limit (from contract)">
              <input
                name="seatLimit"
                type="number"
                min={1}
                defaultValue={5}
                required
                className="w-full rounded-lg border border-border px-3 py-2 text-sm outline-none focus:border-primary"
              />
            </Field>
            <Field label="First admin — name">
              <input
                name="adminName"
                required
                className="w-full rounded-lg border border-border px-3 py-2 text-sm outline-none focus:border-primary"
              />
            </Field>
            <Field label="First admin — email">
              <input
                name="adminEmail"
                type="email"
                required
                className="w-full rounded-lg border border-border px-3 py-2 text-sm outline-none focus:border-primary"
              />
            </Field>
            <div className="sm:col-span-2">
              <button
                type="submit"
                disabled={pending}
                className="rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-white transition hover:opacity-90 disabled:opacity-60"
              >
                {pending ? "Creating…" : "Create & generate admin link"}
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
                Send this link to the organization&apos;s first admin to set their
                password and join.
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function Field({
  label,
  className,
  children,
}: {
  label: string;
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <label className={`block ${className ?? ""}`}>
      <span className="mb-1 block text-xs font-medium text-muted">{label}</span>
      {children}
    </label>
  );
}
