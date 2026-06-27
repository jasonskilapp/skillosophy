import type { TeamMemberWithCount } from "@/lib/types";
import { formatDate } from "@/lib/format";
import MemberActions from "./MemberActions";
import RoleSelector from "./RoleSelector";

export default function OrgTeamMembers({
  orgId,
  members,
}: {
  orgId: string;
  members: TeamMemberWithCount[];
}) {
  const activeCount = members.filter(
    (m) => m.status === "active" && m.accountStatus === "active",
  ).length;

  return (
    <div className="rounded-xl border border-border bg-surface p-5">
      <div className="mb-4 flex items-start justify-between gap-2">
        <h2 className="font-semibold">Team Members</h2>
        <span className="rounded-full bg-foundational-soft px-2.5 py-0.5 text-[11px] font-medium text-muted">
          {activeCount} active
        </span>
      </div>

      {members.length === 0 ? (
        <p className="text-sm text-muted">No team members yet.</p>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border text-left text-[11px] font-medium uppercase tracking-wide text-muted">
                <th className="pb-2 pr-4">Name</th>
                <th className="pb-2 pr-4">Email</th>
                <th className="pb-2 pr-4">Role</th>
                <th className="pb-2 pr-4">Status</th>
                <th className="pb-2 pr-4 text-right">Candidates</th>
                <th className="pb-2 pr-4 text-right">Joined</th>
                <th className="pb-2 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {members.map((m) => (
                <tr key={m.id}>
                  <td className="py-2.5 pr-4 font-medium">{m.name}</td>
                  <td className="py-2.5 pr-4 font-mono text-xs text-muted">
                    {m.email}
                  </td>
                  <td className="py-2.5 pr-4">
                    {m.status === "active" && m.accountStatus !== "inactive" ? (
                      <RoleSelector
                        orgId={orgId}
                        memberId={m.id}
                        currentRole={m.orgRole}
                      />
                    ) : (
                      <span className="text-[11px] text-muted">
                        {m.orgRole === "org_admin" ? "Admin" : "Standard user"}
                      </span>
                    )}
                  </td>
                  <td className="py-2.5 pr-4">
                    <AccountStatusBadge
                      accountStatus={m.accountStatus}
                      isInvite={m.status === "invited"}
                    />
                  </td>
                  <td className="py-2.5 pr-4 text-right tabular-nums">
                    {m.status === "active" ? m.candidateCount : "—"}
                  </td>
                  <td className="py-2.5 pr-4 text-right text-xs text-muted">
                    {m.status === "active"
                      ? formatDate(m.createdAt)
                      : "Invited " + formatDate(m.createdAt)}
                  </td>
                  <td className="py-2.5 text-right">
                    <MemberActions
                      orgId={orgId}
                      memberId={m.id}
                      accountStatus={m.accountStatus}
                      isInvite={m.status === "invited"}
                    />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <p className="mt-4 text-[11px] text-muted">
        Candidate files and profiles are only accessible to org members. Platform
        admins see counts only.
      </p>
    </div>
  );
}

function AccountStatusBadge({
  accountStatus,
  isInvite,
}: {
  accountStatus: "active" | "suspended" | "inactive";
  isInvite: boolean;
}) {
  if (isInvite) {
    return (
      <span className="rounded-full bg-accent-blue-soft px-2 py-0.5 text-[11px] font-medium text-accent-blue">
        Pending
      </span>
    );
  }
  if (accountStatus === "suspended") {
    return (
      <span className="rounded-full bg-amber-100 px-2 py-0.5 text-[11px] font-medium text-amber-700">
        Suspended
      </span>
    );
  }
  if (accountStatus === "inactive") {
    return (
      <span className="rounded-full bg-competent-soft px-2 py-0.5 text-[11px] font-medium text-competent">
        Inactive
      </span>
    );
  }
  return (
    <span className="rounded-full bg-primary-soft px-2 py-0.5 text-[11px] font-medium text-primary">
      Active
    </span>
  );
}
