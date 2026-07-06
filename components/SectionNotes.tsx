"use client";

import { useActionState, useRef, useEffect } from "react";
import { addCandidateNote } from "@/app/actions";
import { formatDateTime } from "@/lib/format";
import type { CandidateNote } from "@/lib/types";

export default function SectionNotes({
  candidateId,
  section,
  initialNotes,
}: {
  candidateId: string;
  section: string;
  initialNotes: CandidateNote[];
}) {
  const [state, action, pending] = useActionState(addCandidateNote, {});
  const formRef = useRef<HTMLFormElement>(null);

  useEffect(() => {
    if (state.ok) formRef.current?.reset();
  }, [state.ok]);

  return (
    <div className="mt-5 border-t border-border pt-4">
      <p className="mb-3 text-xs font-semibold uppercase tracking-wide text-muted">
        Section notes
      </p>

      {initialNotes.length > 0 && (
        <ul className="mb-3 space-y-2">
          {initialNotes.map((note) => (
            <li key={note.id} className="rounded-lg border border-border bg-foundational-soft p-3">
              <p className="whitespace-pre-wrap text-sm">{note.content}</p>
              <p className="mt-1 text-[11px] text-muted">
                {formatDateTime(note.createdAt)}
                {note.createdByName && ` · ${note.createdByName}`}
              </p>
            </li>
          ))}
        </ul>
      )}

      <form ref={formRef} action={action} className="flex gap-2">
        <input type="hidden" name="candidateId" value={candidateId} />
        <input type="hidden" name="section" value={section} />
        <textarea
          name="content"
          required
          rows={2}
          placeholder="Add a note for this section…"
          className="flex-1 resize-none rounded-lg border border-border px-3 py-2 text-sm outline-none focus:border-primary"
        />
        <button
          type="submit"
          disabled={pending}
          className="self-end rounded-lg bg-primary px-3 py-2 text-sm font-semibold text-white transition hover:opacity-90 disabled:opacity-60 whitespace-nowrap"
        >
          {pending ? "…" : "Add"}
        </button>
      </form>
      {state.error && <p className="mt-1 text-xs text-competent">{state.error}</p>}
    </div>
  );
}
