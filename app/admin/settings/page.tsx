import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import { getSeatUsage, getOrganization } from "@/lib/data";
import OrgSettingsForm from "./OrgSettingsForm";

export const dynamic = "force-dynamic";

const SEAT_LIMIT = 20;

export default async function AdminSettingsPage() {
  const session = await getSession();
  if (!session?.organizationId) redirect("/login");

  const [org, seatUsage] = await Promise.all([
    getOrganization(session.organizationId),
    getSeatUsage(session.organizationId, SEAT_LIMIT),
  ]);

  if (!org) redirect("/login");

  const rootDomain = process.env.NEXT_PUBLIC_ROOT_DOMAIN ?? "skillosophyapp.com";
  const registerLink = org.slug
    ? `https://client.${rootDomain}/register?org=${org.slug}`
    : null;

  return (
    <main className="px-6 py-8">
      <h1 className="mb-6 text-xl font-bold">Settings</h1>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Org info */}
        <div className="rounded-xl border border-border bg-surface p-5">
          <h2 className="mb-4 text-sm font-semibold">Organization</h2>
          <dl className="space-y-3 text-sm">
            <div className="flex justify-between gap-4">
              <dt className="text-muted">Name</dt>
              <dd className="font-medium">{org.name}</dd>
            </div>
            <div className="flex justify-between gap-4">
              <dt className="text-muted">Slug</dt>
              <dd className="font-mono text-xs">{org.slug ?? "—"}</dd>
            </div>
            <div className="flex justify-between gap-4">
              <dt className="text-muted">Type</dt>
              <dd>{org.type}</dd>
            </div>
            <div className="flex justify-between gap-4">
              <dt className="text-muted">Status</dt>
              <dd>
                <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${org.status === "active" ? "bg-green-100 text-green-700" : "bg-muted/10 text-muted"}`}>
                  {org.status}
                </span>
              </dd>
            </div>
          </dl>
        </div>

        {/* Seat usage */}
        <div className="rounded-xl border border-border bg-surface p-5">
          <h2 className="mb-4 text-sm font-semibold">Seats</h2>
          <div className="mb-3 flex items-end gap-2">
            <span className="text-3xl font-bold">{seatUsage.used}</span>
            <span className="mb-1 text-sm text-muted">/ {seatUsage.limit} seats used</span>
          </div>
          <div className="h-2 w-full overflow-hidden rounded-full bg-track">
            <div
              className={`h-full rounded-full transition-all ${seatUsage.full ? "bg-red-500" : "bg-primary"}`}
              style={{ width: `${Math.min(100, Math.round((seatUsage.used / seatUsage.limit) * 100))}%` }}
            />
          </div>
          {seatUsage.full && (
            <p className="mt-2 text-xs text-red-600">Seat limit reached. Contact support to expand.</p>
          )}
        </div>

        {/* Client self-registration link */}
        {registerLink && (
          <div className="rounded-xl border border-border bg-surface p-5 lg:col-span-2">
            <h2 className="mb-1 text-sm font-semibold">Client self-registration link</h2>
            <p className="mb-3 text-xs text-muted">
              Share this link so clients can create their own portal account. Anyone with this link
              can register under your organization.
            </p>
            <OrgSettingsForm registerLink={registerLink} />
          </div>
        )}
      </div>
    </main>
  );
}
