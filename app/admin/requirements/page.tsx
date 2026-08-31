import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import { createSupabaseAdminClient } from "@/lib/supabase/server";
import { REQUIREMENT_STATUS_LABELS } from "@/lib/types";
import type { RequirementStatus } from "@/lib/types";
import { formatDate } from "@/lib/format";

export const dynamic = "force-dynamic";

interface RequirementRow {
  id: string;
  title: string;
  category: string | null;
  status: RequirementStatus;
  estimatedTimeline: string | null;
  estimatedCostCad: string | null;
  updatedAt: string;
  candidateName: string;
  candidateId: string;
}

const STATUS_COLORS: Record<RequirementStatus, string> = {
  not_started: "bg-muted/15 text-muted",
  in_progress: "bg-blue-100 text-blue-700",
  waiting_external: "bg-amber-100 text-amber-700",
  blocked: "bg-red-100 text-red-700",
  complete: "bg-green-100 text-green-700",
  not_applicable: "bg-muted/10 text-muted",
  needs_review: "bg-purple-100 text-purple-700",
};

async function getOrgRequirements(orgId: string): Promise<RequirementRow[]> {
  const supabase = createSupabaseAdminClient();
  const { data } = await supabase
    .from("pathway_requirements")
    .select(
      `id, title, category, status, estimated_timeline, estimated_cost_cad, updated_at,
       candidates!inner(id, organization_id, report->contact->>name)`
    )
    .eq("candidates.organization_id", orgId)
    .order("updated_at", { ascending: false })
    .limit(200);

  return (data ?? []).map((r: any) => ({
    id: r.id,
    title: r.title,
    category: r.category ?? null,
    status: r.status as RequirementStatus,
    estimatedTimeline: r.estimated_timeline ?? null,
    estimatedCostCad: r.estimated_cost_cad ?? null,
    updatedAt: r.updated_at,
    candidateName: r.candidates?.name ?? "Unknown client",
    candidateId: r.candidates?.id ?? "",
  }));
}

export default async function AdminRequirementsPage() {
  const session = await getSession();
  if (!session?.organizationId) redirect("/login");

  const requirements = await getOrgRequirements(session.organizationId);

  const byStatus = requirements.reduce<Record<string, number>>((acc, r) => {
    acc[r.status] = (acc[r.status] ?? 0) + 1;
    return acc;
  }, {});

  const categories = Array.from(new Set(requirements.map((r) => r.category).filter(Boolean))) as string[];

  return (
    <main className="px-6 py-8">
      <h1 className="mb-1 text-xl font-bold">Requirements</h1>
      <p className="mb-6 text-sm text-muted">All pathway steps across your clients</p>

      {/* Status summary */}
      <div className="mb-6 flex flex-wrap gap-2">
        {Object.entries(byStatus).map(([status, count]) => (
          <span
            key={status}
            className={`rounded-full px-3 py-1 text-xs font-medium ${STATUS_COLORS[status as RequirementStatus] ?? ""}`}
          >
            {REQUIREMENT_STATUS_LABELS[status as RequirementStatus] ?? status} ({count})
          </span>
        ))}
      </div>

      {requirements.length === 0 ? (
        <div className="rounded-xl border border-border bg-surface px-6 py-12 text-center">
          <p className="text-sm text-muted">No pathway requirements tracked yet.</p>
        </div>
      ) : (
        <div className="overflow-hidden rounded-xl border border-border bg-surface">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border bg-background/50 text-left">
                  <th className="px-4 py-3 font-medium text-muted">Requirement</th>
                  <th className="px-4 py-3 font-medium text-muted">Client</th>
                  <th className="px-4 py-3 font-medium text-muted">Status</th>
                  <th className="px-4 py-3 font-medium text-muted">Category</th>
                  <th className="px-4 py-3 font-medium text-muted">Timeline</th>
                  <th className="px-4 py-3 font-medium text-muted">Cost</th>
                  <th className="px-4 py-3 font-medium text-muted">Updated</th>
                </tr>
              </thead>
              <tbody>
                {requirements.map((r) => (
                  <tr key={r.id} className="border-b border-border last:border-0 hover:bg-muted/5">
                    <td className="max-w-xs px-4 py-3">
                      <p className="truncate font-medium">{r.title}</p>
                    </td>
                    <td className="px-4 py-3 text-muted">{r.candidateName}</td>
                    <td className="px-4 py-3">
                      <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${STATUS_COLORS[r.status]}`}>
                        {REQUIREMENT_STATUS_LABELS[r.status]}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-muted">{r.category ?? "—"}</td>
                    <td className="px-4 py-3 text-muted">{r.estimatedTimeline ?? "—"}</td>
                    <td className="px-4 py-3 text-muted">{r.estimatedCostCad ?? "—"}</td>
                    <td className="px-4 py-3 text-muted">{formatDate(r.updatedAt)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </main>
  );
}
