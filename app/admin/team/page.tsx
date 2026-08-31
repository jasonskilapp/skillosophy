import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import { listTeamWithCandidateCounts, getSeatUsage } from "@/lib/data";
import { orgLabels } from "@/lib/auth";
import TeamInviteCreator from "@/components/TeamInviteCreator";
import type { TeamMemberWithCount } from "@/lib/types";
import { suspendMemberAction } from "@/app/actions";
import { formatDate } from "@/lib/format";

export const dynamic = "force-dynamic";

const SEAT_LIMIT = 20;

function RoleBadge({ role }: { role: TeamMemberWithCount["orgRole"] }) {
  return (
    <span
      className={`rounded-full px-2 py-0.5 text-xs font-medium ${
        role === "org_admin" ? "bg-primary/10 text-primary" : "bg-muted/10 text-muted"
      }`}
    >
      {role === "org_admin" ? "Admin" : "Member"}
    </span>
  );
}

function StatusBadge({ status, accountStatus }: Pick<TeamMemberWithCount, "status" | "accountStatus">) {
  if (status === "invited") return <span className="text-xs text-muted">Pending invite</span>;
  if (accountStatus === "suspended") return <span className="rounded-full bg-red-100 px-2 py-0.5 text-xs font-medium text-red-700">Suspended</span>;
  return <span className="rounded-full bg-green-100 px-2 py-0.5 text-xs font-medium text-green-700">Active</span>;
}

export default async function AdminTeamPage() {
  const session = await getSession();
  if (!session?.organizationId) redirect("/login");

  const [members, seatUsage] = await Promise.all([
    listTeamWithCandidateCounts(session.organizationId),
    getSeatUsage(session.organizationId, SEAT_LIMIT),
  ]);

  const labels = orgLabels(session.orgType ?? null);
  const memberLabel = labels.member;

  return (
    <main className="px-6 py-8">
      <div className="mb-6 flex items-start justify-between">
        <div>
          <h1 className="text-xl font-bold">Team</h1>
          <p className="mt-0.5 text-sm text-muted">
            {seatUsage.used} of {seatUsage.limit} seats used
          </p>
        </div>
      </div>

      {!seatUsage.full && (
        <div className="mb-6">
          <TeamInviteCreator memberLabel={memberLabel} />
        </div>
      )}
      {seatUsage.full && (
        <div className="mb-6 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
          Seat limit reached. Contact support to add more seats.
        </div>
      )}

      <div className="overflow-hidden rounded-xl border border-border bg-surface">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border bg-background/50 text-left">
              <th className="px-4 py-3 font-medium text-muted">Name</th>
              <th className="px-4 py-3 font-medium text-muted">Role</th>
              <th className="px-4 py-3 font-medium text-muted">Status</th>
              <th className="px-4 py-3 font-medium text-muted text-right">Clients</th>
              <th className="px-4 py-3 font-medium text-muted">Joined</th>
              <th className="px-4 py-3" />
            </tr>
          </thead>
          <tbody>
            {members.map((m) => (
              <tr key={m.id} className="border-b border-border last:border-0 hover:bg-muted/5">
                <td className="px-4 py-3">
                  <p className="font-medium">{m.name}</p>
                  <p className="text-xs text-muted">{m.email}</p>
                </td>
                <td className="px-4 py-3">
                  <RoleBadge role={m.orgRole} />
                </td>
                <td className="px-4 py-3">
                  <StatusBadge status={m.status} accountStatus={m.accountStatus} />
                </td>
                <td className="px-4 py-3 text-right tabular-nums">{m.candidateCount}</td>
                <td className="px-4 py-3 text-muted">{formatDate(m.createdAt)}</td>
                <td className="px-4 py-3 text-right">
                  {m.status === "active" && m.accountStatus === "active" && m.id !== session.userId && (
                    <form action={suspendMemberAction}>
                      <input type="hidden" name="memberId" value={m.id} />
                      <button
                        type="submit"
                        className="text-xs text-muted transition hover:text-red-600"
                      >
                        Suspend
                      </button>
                    </form>
                  )}
                </td>
              </tr>
            ))}
            {members.length === 0 && (
              <tr>
                <td colSpan={6} className="px-4 py-8 text-center text-sm text-muted">
                  No team members yet.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </main>
  );
}
