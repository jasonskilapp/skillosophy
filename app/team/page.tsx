import { redirect } from "next/navigation";
import TopBar from "@/components/TopBar";
import TeamInviteCreator from "@/components/TeamInviteCreator";
import RoleSelector from "@/components/RoleSelector";
import { getSession, orgLabels } from "@/lib/auth";
import { appMode } from "@/lib/config";
import { getOrganization, getSeatUsage, listTeam } from "@/lib/data";
import { formatDate, initials } from "@/lib/format";

export const dynamic = "force-dynamic";

export default async function TeamPage() {
  const session = await getSession();
  if (!session) redirect("/login");
  if (session.accountType !== "org_member" || session.orgRole !== "org_admin") {
    redirect("/");
  }
  if (!session.organizationId) redirect("/");

  const labels = orgLabels(session.orgType);
  const org = await getOrganization(session.organizationId);
  const team = await listTeam(session.organizationId);
  const seatLimit = org?.seatLimit ?? 0;
  const usage = await getSeatUsage(session.organizationId, seatLimit);

  return (
    <>
      <TopBar session={session} />
      <main className="mx-auto w-full max-w-4xl flex-1 px-4 py-8 sm:px-6">
        <div className="mb-6 flex flex-wrap items-end justify-between gap-3">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Team</h1>
            <p className="mt-1 text-sm text-muted">
              {session.organizationName} · {labels.members} and admins.
            </p>
          </div>
          <div className="text-right">
            <p className="text-sm font-semibold">
              {usage.used} / {usage.limit} seats
            </p>
            <p className="text-xs text-muted">members + pending invites</p>
          </div>
        </div>

        <div className="mb-6">
          <TeamInviteCreator memberLabel={labels.member} />
        </div>

        {appMode === "mock" && (
          <p className="mb-4 text-xs text-muted">
            Demo mode — this list is seed data; invites aren&apos;t persisted
            until Supabase is configured.
          </p>
        )}

        <div className="overflow-hidden rounded-xl border border-border bg-surface">
          <div className="grid grid-cols-[1fr_auto_auto] gap-2 border-b border-border px-4 py-2.5 text-xs font-semibold uppercase tracking-wide text-muted">
            <span>Member</span>
            <span>Role</span>
            <span>Status</span>
          </div>
          {team.map((m) => (
            <div
              key={m.id}
              className="grid grid-cols-[1fr_auto_auto] items-center gap-2 border-b border-border px-4 py-3 last:border-b-0"
            >
              <div className="flex items-center gap-3">
                <span className="flex h-9 w-9 items-center justify-center rounded-full bg-primary-soft text-xs font-semibold text-primary">
                  {initials(m.name)}
                </span>
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium">{m.name}</p>
                  <p className="truncate text-xs text-muted">{m.email}</p>
                </div>
              </div>
              {m.status === "active" ? (
                <RoleSelector
                  orgId={session.organizationId!}
                  memberId={m.id}
                  currentRole={m.orgRole}
                  memberLabel={labels.member}
                />
              ) : (
                <span className="text-xs text-muted">
                  {m.orgRole === "org_admin" ? "Admin" : labels.member}
                </span>
              )}
              <span
                className={`rounded-full px-2 py-0.5 text-[11px] font-medium ${
                  m.status === "active"
                    ? "bg-primary-soft text-primary"
                    : "bg-proficient-soft text-proficient"
                }`}
              >
                {m.status === "active"
                  ? `Joined ${formatDate(m.createdAt)}`
                  : "Invited"}
              </span>
            </div>
          ))}
        </div>
      </main>
    </>
  );
}
