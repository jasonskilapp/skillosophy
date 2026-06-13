import { redirect } from "next/navigation";
import TopBar from "@/components/TopBar";
import ResumeUploader from "@/components/ResumeUploader";
import { getSession } from "@/lib/auth";
import { appMode } from "@/lib/config";
import { getSeekerCandidate } from "@/lib/data";
import { formatDate } from "@/lib/format";

export const dynamic = "force-dynamic";

export default async function SeekerUploadPage() {
  const session = await getSession();
  if (!session) redirect("/login");
  if (session.role !== "seeker") redirect("/");

  const existing =
    appMode === "live" ? await getSeekerCandidate(session.userId) : null;
  const alreadyDone = existing?.status === "done";

  return (
    <>
      <TopBar session={session} />
      <main className="mx-auto w-full max-w-xl flex-1 px-4 py-10 sm:px-6">
        <div className="mb-6">
          <h1 className="text-2xl font-bold tracking-tight">
            Upload your resume
          </h1>
          <p className="mt-1 text-sm text-muted">
            Your recruiter will review a structured profile built from your
            resume ahead of your meeting
            {existing?.meetingDate
              ? ` on ${formatDate(existing.meetingDate)}`
              : ""}
            .
          </p>
        </div>

        {alreadyDone ? (
          <div className="rounded-xl border border-border bg-surface p-6 text-center">
            <div className="mx-auto mb-3 flex h-11 w-11 items-center justify-center rounded-full bg-primary-soft text-primary">
              ✓
            </div>
            <p className="font-semibold">Your profile is ready</p>
            <p className="mx-auto mt-1 max-w-md text-sm text-muted">
              You&apos;ve uploaded a resume and it has been analyzed and shared
              with your recruiter. You can upload a new version below if needed.
            </p>
            <div className="mt-5 text-left">
              <ResumeUploader mock={appMode === "mock"} />
            </div>
          </div>
        ) : (
          <ResumeUploader mock={appMode === "mock"} />
        )}

        <p className="mt-6 text-center text-xs text-muted">
          Your resume is shared only with the recruiter who invited you.
        </p>
      </main>
    </>
  );
}
