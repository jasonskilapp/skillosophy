import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import TopBar from "@/components/TopBar";
import CandidateTile from "@/components/CandidateTile";
import { getSession, orgLabels } from "@/lib/auth";
import { listCandidatesForMember } from "@/lib/data";
import { createSupabaseAdminClient } from "@/lib/supabase/server";
import { formatDateTime } from "@/lib/format";

export const dynamic = "force-dynamic";

const STATUS_LABEL: Record<string, string> = {
  done: "Ready",
  processing: "Analyzing",
  pending: "Pending",
  failed: "Failed",
};

export default async function MemberCandidatesPage({
  params,
}: {
  params: Promise<{ memberId: string }>;
}) {
  const session = await getSession();
  if (!session) redirect("/login");
  if (session.accountType !== "org_member" || session.orgRole !== "org_admin") {
    redirect("/");
  }
  if (!session.organizationId) redirect("/");

  const { memberId } = await params;

  // Fetch the member's profile to show their name.
  const supabase = createSupabaseAdminClient();
  const { data: member } = await supabase
    .from("profiles")
    .select("id, full_name, email")
    .eq("id", memberId)
    .eq("organization_id", session.organizationId)
    .maybeSingle();

  if (!member) notFound();

  const labels = orgLabels(session.orgType);
  const candidates = await listCandidatesForMember(
    session.organizationId,
    memberId,
  );

  const statusGroups = [
    { key: "done", label: "Ready" },
    { key: "processing", label: "Analyzing" },
    { key: "pending", label: "Pending" },
    { key: "failed", label: "Failed" },
  ];

  return (
    <>
      <TopBar session={session} />
      <main className="mx-auto w-full max-w-5xl flex-1 px-4 py-8 sm:px-6">
        <div className="mb-6">
          <Link
            href="/team"
            className="mb-3 inline-flex items-center gap-1 text-xs text-muted hover:text-foreground"
          >
            ← Team
          </Link>
          <div className="flex flex-wrap items-end justify-between gap-3">
            <div>
              <h1 className="text-2xl font-bold tracking-tight">
                {member.full_name ?? member.email}
              </h1>
              <p className="mt-1 text-sm text-muted">{member.email}</p>
            </div>
            <p className="text-sm text-muted">
              {candidates.length}{" "}
              {candidates.length === 1
                ? labels.candidate.toLowerCase()
                : labels.candidates.toLowerCase()}
            </p>
          </div>
        </div>

        {candidates.length === 0 ? (
          <div className="rounded-xl border border-dashed border-border-strong bg-surface p-10 text-center">
            <p className="font-medium">No {labels.candidates.toLowerCase()} yet</p>
            <p className="mt-1 text-sm text-muted">
              {member.full_name ?? "This member"} hasn&apos;t had any{" "}
              {labels.candidates.toLowerCase()} uploaded yet.
            </p>
          </div>
        ) : (
          <div className="overflow-hidden rounded-xl border border-border bg-surface">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border text-left text-xs font-semibold uppercase tracking-wide text-muted">
                  <th className="px-4 py-3">Name</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3">Uploaded</th>
                  <th className="px-4 py-3">Meeting</th>
                  <th className="px-4 py-3"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {candidates.map((c) => (
                  <tr key={c.id} className="hover:bg-foundational-soft/50">
                    <td className="px-4 py-3 font-medium">{c.name}</td>
                    <td className="px-4 py-3">
                      <StatusBadge status={c.status} />
                    </td>
                    <td className="px-4 py-3 text-xs text-muted">
                      {formatDateTime(c.uploadedAt)}
                    </td>
                    <td className="px-4 py-3 text-xs text-muted">
                      {c.meetingDate
                        ? new Date(c.meetingDate).toLocaleDateString("en-CA", {
                            month: "short",
                            day: "numeric",
                            year: "numeric",
                          })
                        : "—"}
                    </td>
                    <td className="px-4 py-3 text-right">
                      {c.status === "done" && (
                        <Link
                          href={`/dashboard/candidate/${c.id}`}
                          className="rounded-md border border-border px-2.5 py-1 text-xs font-medium hover:bg-primary-soft hover:text-primary hover:border-primary/30 transition"
                        >
                          View profile →
                        </Link>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </main>
    </>
  );
}

function StatusBadge({ status }: { status: string }) {
  const styles: Record<string, string> = {
    done: "bg-primary-soft text-primary",
    processing: "bg-proficient-soft text-proficient",
    pending: "bg-foundational-soft text-muted",
    failed: "bg-competent-soft text-competent",
  };
  return (
    <span
      className={`rounded-full px-2 py-0.5 text-[11px] font-medium ${styles[status] ?? styles.pending}`}
    >
      {STATUS_LABEL[status] ?? status}
    </span>
  );
}
