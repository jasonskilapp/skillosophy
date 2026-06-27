"use client";

import { useActionState } from "react";
import { updateOrganization } from "@/app/actions";
import type { OrgSummary } from "@/lib/types";

export default function OrgEditor({ org }: { org: OrgSummary }) {
  const [state, action, pending] = useActionState(updateOrganization, {});

  return (
    <div className="rounded-xl border border-border bg-surface p-5">
      <h2 className="mb-4 font-semibold">Edit Organization</h2>

      <form action={action} className="grid gap-3 sm:grid-cols-2">
        <input type="hidden" name="id" value={org.id} />

        <Field label="Organization name" className="sm:col-span-2">
          <input
            name="name"
            required
            defaultValue={org.name}
            className="w-full rounded-lg border border-border px-3 py-2 text-sm outline-none focus:border-primary"
          />
        </Field>

        <Field label="Customer code">
          <input
            name="customerCode"
            defaultValue={org.customerCode}
            className="w-full rounded-lg border border-border px-3 py-2 text-sm uppercase outline-none focus:border-primary"
          />
        </Field>

        <Field label="Type">
          <select
            name="type"
            defaultValue={org.type}
            className="w-full rounded-lg border border-border bg-surface px-3 py-2 text-sm outline-none focus:border-primary"
          >
            <option value="campus">Campus (career advisors)</option>
            <option value="newcomer">Newcomer (caseworkers)</option>
          </select>
        </Field>

        <Field label="Seat limit">
          <input
            name="seatLimit"
            type="number"
            min={1}
            required
            defaultValue={org.seatLimit}
            className="w-full rounded-lg border border-border px-3 py-2 text-sm outline-none focus:border-primary"
          />
        </Field>

        <Field label="Status">
          <select
            name="status"
            defaultValue={org.status}
            className="w-full rounded-lg border border-border bg-surface px-3 py-2 text-sm outline-none focus:border-primary"
          >
            <option value="active">Active</option>
            <option value="suspended">Suspended</option>
          </select>
        </Field>

        <div className="flex items-center gap-3 sm:col-span-2">
          <button
            type="submit"
            disabled={pending}
            className="rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-white transition hover:opacity-90 disabled:opacity-60"
          >
            {pending ? "Saving…" : "Save changes"}
          </button>
          {state.ok && (
            <span className="text-sm text-primary">{state.message ?? "Saved."}</span>
          )}
          {state.error && (
            <span className="text-sm text-competent">{state.error}</span>
          )}
        </div>
      </form>
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
