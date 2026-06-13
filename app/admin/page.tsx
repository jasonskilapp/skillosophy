import { redirect } from "next/navigation";
import TopBar from "@/components/TopBar";
import RecruiterCreator from "@/components/RecruiterCreator";
import { getSession } from "@/lib/auth";
import { appMode } from "@/lib/config";
import { listRecruiters } from "@/lib/data";
import { formatDate, initials } from "@/lib/format";

export const dynamic = "force-dynamic";

export default async function AdminPage() {
  const session = await getSession();
  if (!session) redirect("/login");
  if (session.role !== "admin") redirect("/");

  const recruiters = await listRecruiters();

  return (
    <>
      <TopBar session={session} />
      <main className="mx-auto w-full max-w-4xl flex-1 px-4 py-8 sm:px-6">
        <div className="mb-6">
          <h1 className="text-2xl font-bold tracking-tight">Recruiters</h1>
          <p className="mt-1 text-sm text-muted">
            Add recruiter accounts. Recruiters invite job seekers and review
            their profiles.
          </p>
        </div>

        <div className="mb-6">
          <RecruiterCreator />
        </div>

        {appMode === "mock" && (
          <p className="mb-4 text-xs text-muted">
            Demo mode — this list is seed data and new recruiters aren&apos;t
            persisted until Supabase is configured.
          </p>
        )}

        <div className="overflow-hidden rounded-xl border border-border bg-surface">
          <div className="grid grid-cols-[1fr_auto] gap-2 border-b border-border px-4 py-2.5 text-xs font-semibold uppercase tracking-wide text-muted">
            <span>Recruiter</span>
            <span>Added</span>
          </div>
          {recruiters.length === 0 ? (
            <p className="px-4 py-6 text-sm text-muted">No recruiters yet.</p>
          ) : (
            recruiters.map((r) => (
              <div
                key={r.id}
                className="grid grid-cols-[1fr_auto] items-center gap-2 border-b border-border px-4 py-3 last:border-b-0"
              >
                <div className="flex items-center gap-3">
                  <span className="flex h-9 w-9 items-center justify-center rounded-full bg-primary-soft text-xs font-semibold text-primary">
                    {initials(r.name)}
                  </span>
                  <div>
                    <p className="text-sm font-medium">{r.name}</p>
                    <p className="text-xs text-muted">{r.email}</p>
                  </div>
                </div>
                <span className="text-xs text-muted">
                  {formatDate(r.createdAt)}
                </span>
              </div>
            ))
          )}
        </div>
      </main>
    </>
  );
}
