"use client";

import { useActionState, useRef, useEffect, useState } from "react";
import { addCandidateNote } from "@/app/actions";
import {
  NOTE_TAG_LABELS,
  type CandidateNote,
  type NoteTag,
} from "@/lib/types";
import { formatDateTime } from "@/lib/format";

const ALL_TAGS = Object.entries(NOTE_TAG_LABELS) as [NoteTag, string][];

export default function CandidateNotes({
  candidateId,
  initialNotes,
}: {
  candidateId: string;
  initialNotes: CandidateNote[];
}) {
  const [state, action, pending] = useActionState(addCandidateNote, {});
  const formRef = useRef<HTMLFormElement>(null);
  const [selectedTags, setSelectedTags] = useState<NoteTag[]>([]);

  useEffect(() => {
    if (state.ok) {
      formRef.current?.reset();
      setSelectedTags([]);
    }
  }, [state.ok]);

  const handleTagChange = (tag: NoteTag, checked: boolean) => {
    if (tag === "internal_note") {
      // Internal note is exclusive — clear everything else when selected.
      setSelectedTags(checked ? ["internal_note"] : []);
    } else {
      // Any other tag deselects internal note.
      setSelectedTags((prev) => {
        const without = prev.filter((t) => t !== "internal_note" && t !== tag);
        return checked ? [...without, tag] : without;
      });
    }
  };

  return (
    <div className="mt-8 rounded-xl border border-border bg-surface p-5">
      <h2 className="mb-4 font-semibold">Notes</h2>

      {/* Add note form */}
      <form ref={formRef} action={action} className="mb-6 space-y-3">
        <input type="hidden" name="candidateId" value={candidateId} />
        {/* Controlled hidden inputs drive what gets submitted */}
        {selectedTags.map((t) => (
          <input key={t} type="hidden" name="tags" value={t} />
        ))}

        <textarea
          name="content"
          required
          rows={3}
          placeholder="Add a note…"
          className="w-full resize-none rounded-lg border border-border px-3 py-2 text-sm outline-none focus:border-primary"
        />

        <div>
          <p className="mb-2 text-xs font-medium text-muted">
            Tags{" "}
            <span className="font-normal">
              (select all that apply — Internal note is exclusive)
            </span>
          </p>
          <div className="flex flex-wrap gap-2">
            {ALL_TAGS.map(([value, label]) => {
              const isChecked = selectedTags.includes(value);
              const isDisabled =
                !isChecked &&
                value !== "internal_note" &&
                selectedTags.includes("internal_note");
              return (
                <button
                  key={value}
                  type="button"
                  disabled={isDisabled}
                  onClick={() => handleTagChange(value, !isChecked)}
                  className={`rounded-full border px-3 py-1 text-xs font-medium transition ${
                    isChecked
                      ? "border-primary bg-primary-soft text-primary"
                      : isDisabled
                        ? "cursor-not-allowed border-border opacity-40"
                        : "border-border hover:border-primary hover:text-primary"
                  }`}
                >
                  {label}
                </button>
              );
            })}
          </div>
        </div>

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
          {state.ok && (
            <span className="text-sm text-primary">
              Note added — refresh to see it below.
            </span>
          )}
        </div>
      </form>

      {/* Existing notes */}
      {initialNotes.length === 0 ? (
        <p className="text-sm text-muted">No notes yet.</p>
      ) : (
        <ul className="space-y-3">
          {initialNotes.map((note) => (
            <li
              key={note.id}
              className="rounded-lg border border-border bg-foundational-soft p-4"
            >
              <p className="whitespace-pre-wrap text-sm">{note.content}</p>

              {note.tags.length > 0 && (
                <div className="mt-2 flex flex-wrap gap-1.5">
                  {note.tags.map((tag) => (
                    <span
                      key={tag}
                      className="rounded-full bg-primary-soft px-2 py-0.5 text-[11px] font-medium text-primary"
                    >
                      {NOTE_TAG_LABELS[tag] ?? tag}
                    </span>
                  ))}
                </div>
              )}

              <p className="mt-2 text-[11px] text-muted">
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
