import { redirect } from "next/navigation";
import TopBar from "@/components/TopBar";
import CandidateTile from "@/components/CandidateTile";
import InviteCreator from "@/components/InviteCreator";
import { getSession, orgLabels } from "@/lib/auth";
import { listCandidatesForSession } from "@/lib/data";
import { dayKey, dayLabel } from "@/lib/format";
import type { CandidateSummary } from "@/lib/types";

export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  const session = await getSession();
  if (!session) redirect("/login");
  if (session.accountType !== "org_member") redirect("/");

  const labels = orgLabels(session.orgType);
  const candidates = await listCandidatesForSession(session);
  const groups = groupByDay(candidates);
  const scope = session.orgRole === "org_admin" ? "your organization" : "you";

  return (
    <>
      <TopBar session={session} />
      <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-8 sm:px-6">
        <div className="mb-6 flex flex-wrap items-end justify-between gap-3">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">
              {labels.candidates}
            </h1>
            <p className="mt-1 text-sm text-muted">
              Resumes uploaded for {scope}, newest first.
            </p>
          </div>
          <p className="text-sm text-muted">{candidates.length} total</p>
        </div>

        <div className="mb-8">
          <InviteCreator candidateLabel={labels.candidate} />
        </div>

        {groups.length === 0 ? (
          <EmptyState candidateLabel={labels.candidate.toLowerCase()} />
        ) : (
          <div className="space-y-8">
            {groups.map((group) => (
              <section key={group.key}>
                <h2 className="mb-3 text-sm font-semibold text-muted">
                  {group.label}
                  <span className="ml-2 font-normal text-border-strong">
                    {group.items.length}
                  </span>
                </h2>
                <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                  {group.items.map((c) => (
                    <CandidateTile key={c.id} candidate={c} />
                  ))}
                </div>
              </section>
            ))}
          </div>
        )}
      </main>
    </>
  );
}

function groupByDay(candidates: CandidateSummary[]) {
  const map = new Map<string, CandidateSummary[]>();
  for (const c of candidates) {
    const key = dayKey(c.uploadedAt);
    if (!map.has(key)) map.set(key, []);
    map.get(key)!.push(c);
  }
  return Array.from(map.entries())
    .sort((a, b) => (a[0] < b[0] ? 1 : -1))
    .map(([key, items]) => ({
      key,
      label: dayLabel(items[0].uploadedAt),
      items,
    }));
}

function EmptyState({ candidateLabel }: { candidateLabel: string }) {
  return (
    <div className="rounded-xl border border-dashed border-border-strong bg-surface p-10 text-center">
      <p className="font-medium">No resumes yet</p>
      <p className="mt-1 text-sm text-muted">
        Create an invite link above and send it to a {candidateLabel}. Their
        profile appears here once they upload a resume.
      </p>
    </div>
  );
}
