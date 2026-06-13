"use client";

import { useActionState, useEffect, useRef, useState } from "react";
import { submitResume } from "@/app/actions";
import { UploadIcon } from "./icons";

type Status = "idle" | "processing" | "done" | "failed";

export default function ResumeUploader({ mock }: { mock: boolean }) {
  const [state, action, pending] = useActionState(submitResume, {});
  const [fileName, setFileName] = useState("");
  const [status, setStatus] = useState<Status>("idle");
  const [error, setError] = useState<string | null>(null);
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Once the upload action returns a candidateId, poll for analysis status.
  useEffect(() => {
    if (mock) return;
    if (!state.candidateId) return;
    setStatus("processing");

    const poll = async () => {
      try {
        const res = await fetch(`/api/candidate-status?id=${state.candidateId}`);
        const data = await res.json();
        if (data.status === "done") {
          setStatus("done");
          if (pollRef.current) clearInterval(pollRef.current);
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
  }, [state.candidateId, mock]);

  // Mock mode: the action returns a friendly message and we show it directly.
  const showMockDone = mock && state.ok;

  if (status === "done" || showMockDone) {
    return (
      <div className="rounded-xl border border-border bg-surface p-6 text-center">
        <div className="mx-auto mb-3 flex h-11 w-11 items-center justify-center rounded-full bg-primary-soft text-primary">
          ✓
        </div>
        <p className="font-semibold">
          {mock ? "Upload received (demo)" : "All set — your profile is ready"}
        </p>
        <p className="mx-auto mt-1 max-w-md text-sm text-muted">
          {mock
            ? state.message
            : "Your resume has been analyzed and shared with the recruiter for your meeting. You can close this page."}
        </p>
      </div>
    );
  }

  if (status === "processing") {
    return (
      <div className="rounded-xl border border-border bg-surface p-8 text-center">
        <div className="mx-auto mb-4 h-8 w-8 animate-spin rounded-full border-2 border-track border-t-primary" />
        <p className="font-semibold">Analyzing your resume…</p>
        <p className="mt-1 text-sm text-muted">
          This usually takes under a minute. Hang tight.
        </p>
      </div>
    );
  }

  return (
    <form action={action} className="space-y-4">
      <label
        htmlFor="resume"
        className="flex cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-dashed border-border-strong bg-surface px-6 py-10 text-center transition hover:border-primary"
      >
        <span className="mb-2 text-muted">
          <UploadIcon className="h-7 w-7" />
        </span>
        <span className="font-medium">
          {fileName || "Choose your resume (PDF or .docx)"}
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
