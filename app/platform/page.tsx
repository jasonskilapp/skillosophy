import { redirect } from "next/navigation";
import Link from "next/link";
import TopBar from "@/components/TopBar";
import OrgCreator from "@/components/OrgCreator";
import { getSession } from "@/lib/auth";
import { appMode } from "@/lib/config";
import { listOrganizations, suggestCustomerCode } from "@/lib/data";
import { formatDate } from "@/lib/format";

export const dynamic = "force-dynamic";

export default async function PlatformConsole() {
  const session = await getSession();
  if (!session) redirect("/login");
  if (session.accountType !== "platform_admin") redirect("/");

  const orgs = await listOrganizations();
  const suggestedCode = await suggestCustomerCode();

  return (
    <>
      <TopBar session={session} />
      <main className="mx-auto w-full max-w-5xl flex-1 px-4 py-8 sm:px-6">
        <div className="mb-6">
          <h1 className="text-2xl font-bold tracking-tight">Organizations</h1>
          <p className="mt-1 text-sm text-muted">
            Provision a new organization after its contract is signed, then send
            its first admin a join link.
          </p>
        </div>

        <div className="mb-8">
          <OrgCreator suggestedCode={suggestedCode} />
        </div>

        {appMode === "mock" && (
          <p className="mb-4 text-xs text-muted">
            Demo mode — this list is seed data; new organizations aren&apos;t
            persisted until Supabase is configured.
          </p>
        )}

        {orgs.length === 0 ? (
          <div className="rounded-xl border border-dashed border-border-strong bg-surface p-10 text-center">
            <p className="font-medium">No organizations yet</p>
            <p className="mt-1 text-sm text-muted">
              Create one above to get started.
            </p>
          </div>
        ) : (
          <div className="grid gap-3 sm:grid-cols-2">
            {orgs.map((o) => (
              <div
                key={o.id}
                className="rounded-xl border border-border bg-surface p-5"
              >
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <h2 className="font-semibold">{o.name}</h2>
                    <p className="text-xs text-muted">
                      <span className="font-mono font-medium text-foreground/70">
                        {o.customerCode}
                      </span>
                      <span className="mx-1.5 text-border-strong">·</span>
                      Created {formatDate(o.createdAt)}
                    </p>
                  </div>
                  <span
                    className={`rounded-full px-2.5 py-0.5 text-[11px] font-medium ${
                      o.type === "campus"
                        ? "bg-primary-soft text-primary"
                        : "bg-accent-blue-soft text-accent-blue"
                    }`}
                  >
                    {o.type === "campus" ? "Campus" : "Newcomer"}
                  </span>
                </div>
                <div className="mt-4 grid grid-cols-3 gap-2 text-center">
                  <Stat value={`${o.seatsUsed}/${o.seatLimit}`} label="Seats" />
                  <Stat value={String(o.memberCount)} label="Members" />
                  <Stat value={String(o.candidateCount)} label="Candidates" />
                </div>
                <div className="mt-3 flex justify-end">
                  <Link
                    href={`/platform/${o.id}`}
                    className="rounded-lg border border-border px-3 py-1.5 text-xs font-medium hover:bg-foundational-soft transition"
                  >
                    Manage →
                  </Link>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>
    </>
  );
}

function Stat({ value, label }: { value: string; label: string }) {
  return (
    <div className="rounded-lg bg-foundational-soft py-2">
      <p className="text-sm font-bold tracking-tight">{value}</p>
      <p className="text-[11px] text-muted">{label}</p>
    </div>
  );
}
