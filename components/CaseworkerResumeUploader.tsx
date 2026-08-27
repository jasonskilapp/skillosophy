"use client";

import { useActionState, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { uploadResumeAsCaseworker } from "@/app/actions";
import { UploadIcon } from "./icons";

type Status = "idle" | "processing" | "done" | "failed";

export default function CaseworkerResumeUploader() {
  const router = useRouter();
  const [state, action, pending] = useActionState(uploadResumeAsCaseworker, {});
  const [fileName, setFileName] = useState("");
  const [status, setStatus] = useState<Status>("idle");
  const [error, setError] = useState<string | null>(null);
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    if (!state.candidateId) return;
    setStatus("processing");

    const poll = async () => {
      try {
        const res = await fetch(`/api/candidate-status?id=${state.candidateId}`);
        const data = await res.json();
        if (data.status === "done") {
          setStatus("done");
          if (pollRef.current) clearInterval(pollRef.current);
          router.push(`/dashboard/candidate/${state.candidateId}`);
        } else if (data.status === "failed") {
          setStatus("failed");
          setError(data.error ?? "Analysis failed.");
          if (pollRef.current) clearInterval(pollRef.current);
        }
      } catch {
        /* keep polling */
      }
    };

    poll();
    pollRef.current = setInterval(poll, 3000);
    return () => {
      if (pollRef.current) clearInterval(pollRef.current);
    };
  }, [state.candidateId, router]);

  if (status === "processing") {
    return (
      <div className="rounded-xl border border-border bg-surface p-10 text-center">
        <div className="mx-auto mb-4 h-8 w-8 animate-spin rounded-full border-2 border-track border-t-primary" />
        <p className="font-semibold">Analyzing resume…</p>
        <p className="mt-1 text-sm text-muted">
          This usually takes under a minute. You&apos;ll be taken to the profile when it&apos;s ready.
        </p>
      </div>
    );
  }

  return (
    <form action={action} className="space-y-4">
      <div>
        <label htmlFor="candidateName" className="mb-1 block text-sm font-medium">
          Candidate name <span className="text-muted">(optional)</span>
        </label>
        <input
          id="candidateName"
          name="candidateName"
          type="text"
          placeholder="e.g. Jane Smith"
          className="w-full rounded-lg border border-border bg-surface px-3 py-2 text-sm placeholder:text-muted focus:outline-none focus:ring-2 focus:ring-primary/40"
        />
      </div>

      <label
        htmlFor="resume"
        className="flex cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-dashed border-border-strong bg-surface px-6 py-10 text-center transition hover:border-primary"
      >
        <span className="mb-2 text-muted">
          <UploadIcon className="h-7 w-7" />
        </span>
        <span className="font-medium">
          {fileName || "Choose a resume (PDF or .docx)"}
        </span>
        <span className="mt-1 text-xs text-muted">Max 10 MB</span>
        <input
          id="resume"
          name="resume"
          type="file"
          accept=".pdf,.docx,application/pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
          className="sr-only"
          onChange={(e) => setFileName(e.target.files?.[0]?.name ?? "")}
        />
      </label>

      {(state.error || error) && (
        <p className="text-sm text-competent">{state.error ?? error}</p>
      )}

      <button
        type="submit"
        disabled={pending || !fileName}
        className="w-full rounded-lg bg-primary py-2.5 text-sm font-semibold text-white transition hover:opacity-90 disabled:opacity-50"
      >
        {pending ? "Uploading…" : "Upload & analyze"}
      </button>
    </form>
  );
}
