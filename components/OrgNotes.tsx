"use client";

import { useActionState, useRef, useEffect } from "react";
import { addOrgNote } from "@/app/actions";
import type { OrgNote } from "@/lib/types";
import { formatDateTime } from "@/lib/format";

export default function OrgNotes({
  orgId,
  initialNotes,
}: {
  orgId: string;
  initialNotes: OrgNote[];
}) {
  const [state, action, pending] = useActionState(addOrgNote, {});
  const formRef = useRef<HTMLFormElement>(null);

  useEffect(() => {
    if (state.ok) {
      formRef.current?.reset();
    }
  }, [state.ok]);

  return (
    <div className="rounded-xl border border-border bg-surface p-5">
      <h2 className="mb-4 font-semibold">Notes</h2>

      <form ref={formRef} action={action} className="mb-5 flex flex-col gap-2">
        <input type="hidden" name="orgId" value={orgId} />
        <textarea
          name="content"
          required
          rows={3}
          placeholder="Add an internal note…"
          className="w-full rounded-lg border border-border px-3 py-2 text-sm outline-none focus:border-primary resize-none"
        />
        <div className="flex items-center gap-3">
          <button
            type="submit"
            disabled={pending}
            className="rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-white transition hover:opacity-90 disabled:opacity-60"
          >
            {pending ? "Adding…" : "Add note"}
          </button>
          {state.error && (
            <span className="text-sm text-competent">{state.error}</span>
          )}
        </div>
      </form>

      {state.ok && (
        <p className="mb-3 text-sm text-primary">
          Note added — refresh to see it in the list.
        </p>
      )}

      {initialNotes.length === 0 ? (
        <p className="text-sm text-muted">No notes yet.</p>
      ) : (
        <ul className="space-y-3">
          {initialNotes.map((note) => (
            <li
              key={note.id}
              className="rounded-lg border border-border bg-foundational-soft p-3"
            >
              <p className="text-sm whitespace-pre-wrap">{note.content}</p>
              <p className="mt-1.5 text-[11px] text-muted">
                {formatDateTime(note.createdAt)}
                {note.createdByName && ` · ${note.createdByName}`}
              </p>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
