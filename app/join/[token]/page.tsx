import TeamSignupForm from "@/components/TeamSignupForm";
import { getTeamInviteByToken } from "@/lib/data";

export const dynamic = "force-dynamic";

export default async function JoinPage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = await params;
  const invite = await getTeamInviteByToken(token);

  return (
    <div className="flex flex-1 items-center justify-center px-4 py-12">
      <div className="w-full max-w-sm">
        <div className="mb-8 text-center">
          <span className="inline-flex h-11 w-11 items-center justify-center rounded-xl bg-primary text-lg font-bold text-white">
            S
          </span>
          <h1 className="mt-4 text-2xl font-bold tracking-tight">
            Join your team
          </h1>
          <p className="mt-1 text-sm text-muted">
            {invite?.organizationName
              ? `You've been invited to ${invite.organizationName} on Skillosophy`
              : "You've been invited to a team on Skillosophy"}
            {invite?.orgRole === "org_admin" ? " as an admin." : "."}
          </p>
        </div>

        <div className="rounded-2xl border border-border bg-surface p-6 shadow-sm">
          {!invite || !invite.valid ? (
            <p className="text-center text-sm text-competent">
              This invite link is invalid or has expired. Ask your administrator
              for a new one.
            </p>
          ) : (
            <TeamSignupForm
              token={token}
              defaultName={invite.name}
              defaultEmail={invite.email}
            />
          )}
        </div>
      </div>
    </div>
  );
}
