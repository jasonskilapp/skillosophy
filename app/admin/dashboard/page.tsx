import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import { getAdminAnalytics, listOrgMemberMetrics } from "@/lib/data";
import { WORKFLOW_STATUS_LABELS, REQUIREMENT_STATUS_LABELS } from "@/lib/types";

export const dynamic = "force-dynamic";

function StatCard({ label, value, sub }: { label: string; value: string | number; sub?: string }) {
  return (
    <div className="rounded-xl border border-border bg-surface p-5">
      <p className="text-xs text-muted">{label}</p>
      <p className="mt-1 text-2xl font-bold">{value}</p>
      {sub && <p className="mt-0.5 text-xs text-muted">{sub}</p>}
    </div>
  );
}

function BarRow({ label, count, total, color }: { label: string; count: number; total: number; color: string }) {
  const pct = total > 0 ? Math.round((count / total) * 100) : 0;
  return (
    <div className="flex items-center gap-3">
      <span className="w-44 shrink-0 truncate text-xs text-muted">{label}</span>
      <div className="flex-1 h-2 overflow-hidden rounded-full bg-track">
        <div className="h-full rounded-full transition-all" style={{ width: `${pct}%`, backgroundColor: color }} />
      </div>
      <span className="w-8 shrink-0 text-right text-xs font-medium">{count}</span>
    </div>
  );
}

const STATUS_COLORS: Record<string, string> = {
  not_started: "#9ca3af",
  in_progress: "#3b82f6",
  waiting_external: "#f59e0b",
  blocked: "#ef4444",
  complete: "#10b981",
  not_applicable: "#d1d5db",
  needs_review: "#8b5cf6",
};

const WORKFLOW_COLORS: Record<string, string> = {
  intake_in_progress: "#f59e0b",
  appointment_scheduled: "#3b82f6",
  profile_reviewed: "#8b5cf6",
  appointment_completed: "#10b981",
  no_status: "#9ca3af",
};

export default async function AdminDashboardPage() {
  const session = await getSession();
  if (!session?.organizationId) redirect("/login");

  const [analytics, memberMetrics] = await Promise.all([
    getAdminAnalytics(session.organizationId),
    listOrgMemberMetrics(session.organizationId),
  ]);

  const completeReqs = analytics.requirementsByStatus["complete"] ?? 0;
  const pathwayPct = analytics.totalRequirements > 0
    ? Math.round((completeReqs / analytics.totalRequirements) * 100)
    : 0;

  return (
    <main className="px-6 py-8">
      <h1 className="mb-6 text-xl font-bold">Dashboard</h1>

      {/* Top stat cards */}
      <div className="mb-8 grid grid-cols-2 gap-4 sm:grid-cols-4">
        <StatCard label="Total clients" value={analytics.totalClients} />
        <StatCard label="Portal active" value={analytics.portalClaimed} sub="accounts claimed" />
        <StatCard label="Invites pending" value={analytics.portalInvited} sub="awaiting claim" />
        <StatCard
          label="Pathway completion"
          value={`${pathwayPct}%`}
          sub={`${completeReqs} of ${analytics.totalRequirements} steps done`}
        />
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Workflow status */}
        <div className="rounded-xl border border-border bg-surface p-5">
          <h2 className="mb-4 text-sm font-semibold">Clients by workflow status</h2>
          <div className="space-y-3">
            {Object.entries(analytics.byWorkflowStatus).map(([status, count]) => (
              <BarRow
                key={status}
                label={WORKFLOW_STATUS_LABELS[status as keyof typeof WORKFLOW_STATUS_LABELS] ?? "No status"}
                count={count}
                total={analytics.totalClients}
                color={WORKFLOW_COLORS[status] ?? "#9ca3af"}
              />
            ))}
            {Object.keys(analytics.byWorkflowStatus).length === 0 && (
              <p className="text-sm text-muted">No clients yet.</p>
            )}
          </div>
        </div>

        {/* Requirement status */}
        <div className="rounded-xl border border-border bg-surface p-5">
          <h2 className="mb-4 text-sm font-semibold">Pathway requirements by status</h2>
          <div className="space-y-3">
            {Object.entries(analytics.requirementsByStatus).map(([status, count]) => (
              <BarRow
                key={status}
                label={REQUIREMENT_STATUS_LABELS[status as keyof typeof REQUIREMENT_STATUS_LABELS] ?? status}
                count={count}
                total={analytics.totalRequirements}
                color={STATUS_COLORS[status] ?? "#9ca3af"}
              />
            ))}
            {analytics.totalRequirements === 0 && (
              <p className="text-sm text-muted">No requirements tracked yet.</p>
            )}
          </div>
        </div>

        {/* Caseworker activity */}
        <div className="rounded-xl border border-border bg-surface p-5 lg:col-span-2">
          <h2 className="mb-4 text-sm font-semibold">Caseworker activity</h2>
          {memberMetrics.length === 0 ? (
            <p className="text-sm text-muted">No team members yet.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border text-left">
                    <th className="pb-2 font-medium text-muted">Name</th>
                    <th className="pb-2 font-medium text-muted text-right">Clients</th>
                    <th className="pb-2 font-medium text-muted text-right">Appointments</th>
                    <th className="pb-2 font-medium text-muted text-right">Follow-ups sent</th>
                    <th className="pb-2 font-medium text-muted text-right">Avg usefulness</th>
                  </tr>
                </thead>
                <tbody>
                  {memberMetrics.map((m) => (
                    <tr key={m.memberId} className="border-b border-border last:border-0">
                      <td className="py-2.5 font-medium">{m.memberName}</td>
                      <td className="py-2.5 text-right">{m.resumesUploaded}</td>
                      <td className="py-2.5 text-right">{m.appointmentsCompleted}</td>
                      <td className="py-2.5 text-right">{m.followupsSent}</td>
                      <td className="py-2.5 text-right">
                        {m.avgUsefulness != null ? `${m.avgUsefulness.toFixed(1)} / 5` : "—"}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </main>
  );
}
