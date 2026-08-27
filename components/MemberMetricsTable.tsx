import Link from "next/link";
import type { MemberMetrics } from "@/lib/types";

export default function MemberMetricsTable({
  metrics,
  linkToMember = false,
  memberLabel = "Advisor",
}: {
  metrics: MemberMetrics[];
  linkToMember?: boolean;
  memberLabel?: string;
}) {
  return (
    <div className="rounded-xl border border-border bg-surface p-5">
      <h2 className="mb-4 font-semibold">Metrics</h2>

      {metrics.length === 0 ? (
        <p className="text-sm text-muted">No activity yet.</p>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border text-left text-[11px] font-medium uppercase tracking-wide text-muted">
                <th className="pb-2 pr-4">{memberLabel}</th>
                <th className="pb-2 pr-4 text-right">Resumes uploaded</th>
                <th className="pb-2 pr-4 text-right">Appointments completed</th>
                <th className="pb-2 pr-4 text-right">Follow-ups sent</th>
                <th className="pb-2 pr-4 text-right">Follow-ups replied</th>
                <th className="pb-2 text-right">Avg usefulness</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {metrics.map((m) => (
                <tr key={m.memberId}>
                  <td className="py-2.5 pr-4 font-medium">
                    {linkToMember ? (
                      <Link
                        href={`/team/${m.memberId}`}
                        className="hover:text-primary hover:underline"
                      >
                        {m.memberName}
                      </Link>
                    ) : (
                      m.memberName
                    )}
                  </td>
                  <td className="py-2.5 pr-4 text-right tabular-nums">{m.resumesUploaded}</td>
                  <td className="py-2.5 pr-4 text-right tabular-nums">{m.appointmentsCompleted}</td>
                  <td className="py-2.5 pr-4 text-right tabular-nums">{m.followupsSent}</td>
                  <td className="py-2.5 pr-4 text-right tabular-nums">{m.followupsReplied}</td>
                  <td className="py-2.5 text-right tabular-nums">
                    {m.avgUsefulness != null ? m.avgUsefulness.toFixed(1) : "—"}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
