import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import TopBar from "@/components/TopBar";
import CandidateProfile from "@/components/CandidateProfile";
import { ArrowLeftIcon, CalendarIcon, ClockIcon } from "@/components/icons";
import { getSession } from "@/lib/auth";
import { getCandidate } from "@/lib/data";
import { formatDate, formatDateTime } from "@/lib/format";

export const dynamic = "force-dynamic";

export default async function CandidateDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const session = await getSession();
  if (!session) redirect("/login");
  if (session.role !== "recruiter") redirect("/");

  const { id } = await params;
  const result = await getCandidate(id);
  if (!result) notFound();

  const { summary, report } = result;

  return (
    <>
      <TopBar session={session} />
      <main className="mx-auto w-full max-w-5xl flex-1 px-4 py-8 sm:px-6">
        <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
          <Link
            href="/recruiter/dashboard"
            className="inline-flex items-center gap-1.5 text-sm font-medium text-muted transition hover:text-foreground"
          >
            <ArrowLeftIcon className="h-4 w-4" />
            Back to candidates
          </Link>
          <div className="flex flex-wrap items-center gap-4 text-xs text-muted">
            <span className="inline-flex items-center gap-1.5">
              <ClockIcon className="h-3.5 w-3.5" />
              Uploaded {formatDateTime(summary.uploadedAt)}
            </span>
            {summary.meetingDate && (
              <span className="inline-flex items-center gap-1.5">
                <CalendarIcon className="h-3.5 w-3.5" />
                Meeting {formatDate(summary.meetingDate)}
              </span>
            )}
          </div>
        </div>

        {report ? (
          <CandidateProfile report={report} />
        ) : (
          <div className="rounded-xl border border-border bg-surface p-10 text-center">
            <p className="font-medium">Analysis not ready</p>
            <p className="mt-1 text-sm text-muted">
              This resume is still being analyzed, or analysis failed. Check
              back shortly.
            </p>
          </div>
        )}
      </main>
    </>
  );
}
