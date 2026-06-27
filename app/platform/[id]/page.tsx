import { notFound, redirect } from "next/navigation";
import Link from "next/link";
import TopBar from "@/components/TopBar";
import OrgEditor from "@/components/OrgEditor";
import OrgNotes from "@/components/OrgNotes";
import OrgTeamMembers from "@/components/OrgTeamMembers";
import { getSession } from "@/lib/auth";
import { getOrganization, listOrgNotes, listTeamWithCandidateCounts } from "@/lib/data";
import { formatDate } from "@/lib/format";

export const dynamic = "force-dynamic";

export default async function OrgDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const session = await getSession();
  if (!session) redirect("/login");
  if (session.accountType !== "platform_admin") redirect("/");

  const { id } = await params;
  const [org, notes, members] = await Promise.all([
    getOrganization(id),
    listOrgNotes(id),
    listTeamWithCandidateCounts(id),
  ]);

  if (!org) notFound();

  return (
    <>
      <TopBar session={session} />
      <main className="mx-auto w-full max-w-3xl flex-1 px-4 py-8 sm:px-6">
        <div className="mb-6">
          <Link
            href="/platform"
            className="mb-3 inline-flex items-center gap-1 text-xs text-muted hover:text-foreground"
          >
            ← Organizations
          </Link>
          <div className="flex items-start justify-between gap-3">
            <div>
              <h1 className="text-2xl font-bold tracking-tight">{org.name}</h1>
              <p className="mt-1 text-sm text-muted">
                <span className="font-mono font-medium text-foreground/70">
                  {org.customerCode}
                </span>
                <span className="mx-1.5 text-border-strong">·</span>
                Created {formatDate(org.createdAt)}
              </p>
            </div>
            <span
              className={`mt-1 rounded-full px-2.5 py-0.5 text-[11px] font-medium ${
                org.status === "active"
                  ? "bg-primary-soft text-primary"
                  : "bg-competent-soft text-competent"
              }`}
            >
              {org.status === "active" ? "Active" : "Suspended"}
            </span>
          </div>

          <div className="mt-4 grid grid-cols-3 gap-2 text-center">
            <Stat value={`${org.seatsUsed}/${org.seatLimit}`} label="Seats" />
            <Stat value={String(org.memberCount)} label="Members" />
            <Stat value={String(org.candidateCount)} label="Candidates" />
          </div>
        </div>

        <div className="flex flex-col gap-6">
          <OrgTeamMembers orgId={org.id} members={members} />
          <OrgEditor org={org} />
          <OrgNotes orgId={org.id} initialNotes={notes} />
        </div>
      </main>
    </>
  );
}

function Stat({ value, label }: { value: string; label: string }) {
  return (
    <div className="rounded-lg border border-border bg-surface py-2 text-center">
      <p className="text-sm font-bold tracking-tight">{value}</p>
      <p className="text-[11px] text-muted">{label}</p>
    </div>
  );
}
