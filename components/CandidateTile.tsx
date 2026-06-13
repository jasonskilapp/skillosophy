import Link from "next/link";
import type { CandidateSummary } from "@/lib/types";
import { formatDate, formatDateTime, initials } from "@/lib/format";
import { CalendarIcon, ClockIcon } from "./icons";

const STATUS_STYLE: Record<
  CandidateSummary["status"],
  { label: string; bg: string; text: string }
> = {
  done: { label: "Ready", bg: "var(--color-primary-soft)", text: "var(--color-primary)" },
  processing: {
    label: "Analyzing…",
    bg: "var(--color-proficient-soft)",
    text: "var(--color-proficient)",
  },
  pending: {
    label: "Pending",
    bg: "var(--color-foundational-soft)",
    text: "var(--color-foundational)",
  },
  failed: {
    label: "Failed",
    bg: "var(--color-competent-soft)",
    text: "var(--color-competent)",
  },
};

export default function CandidateTile({
  candidate,
}: {
  candidate: CandidateSummary;
}) {
  const status = STATUS_STYLE[candidate.status];
  const clickable = candidate.status === "done";

  const inner = (
    <div
      className={`flex h-full flex-col rounded-xl border border-border bg-surface p-4 transition ${
        clickable ? "hover:border-border-strong hover:shadow-sm" : "opacity-90"
      }`}
    >
      <div className="flex items-start justify-between gap-2">
        <div className="flex min-w-0 items-center gap-3">
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary-soft text-sm font-semibold text-primary">
            {initials(candidate.name)}
          </span>
          <div className="min-w-0">
            <p className="truncate font-semibold leading-tight">
              {candidate.name}
            </p>
            {candidate.headline && (
              <p className="truncate text-xs text-muted">{candidate.headline}</p>
            )}
          </div>
        </div>
        <span
          className="shrink-0 rounded-full px-2 py-0.5 text-[11px] font-medium"
          style={{ backgroundColor: status.bg, color: status.text }}
        >
          {status.label}
        </span>
      </div>

      <div className="mt-4 space-y-1.5 text-xs text-muted">
        <p className="flex items-center gap-1.5">
          <ClockIcon className="h-3.5 w-3.5" />
          Uploaded {formatDateTime(candidate.uploadedAt)}
        </p>
        {candidate.meetingDate && (
          <p className="flex items-center gap-1.5">
            <CalendarIcon className="h-3.5 w-3.5" />
            Meeting {formatDate(candidate.meetingDate)}
          </p>
        )}
      </div>
    </div>
  );

  if (!clickable) return inner;
  return (
    <Link href={`/recruiter/candidate/${candidate.id}`} className="block h-full">
      {inner}
    </Link>
  );
}
