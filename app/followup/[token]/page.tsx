import FollowupResponseForm from "@/components/FollowupResponseForm";
import { getFollowupByToken } from "@/lib/data";

export const dynamic = "force-dynamic";

export default async function FollowupPage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = await params;
  const followup = await getFollowupByToken(token);

  return (
    <div className="flex flex-1 items-center justify-center px-4 py-12">
      <div className="w-full max-w-sm">
        <div className="mb-8 text-center">
          <span className="inline-flex h-11 w-11 items-center justify-center rounded-xl bg-primary text-lg font-bold text-white">
            S
          </span>
          <h1 className="mt-4 text-2xl font-bold tracking-tight">
            {followup?.type === "self_report" ? "4-week check-in" : "Your next steps"}
          </h1>
          {followup?.candidateName && (
            <p className="mt-1 text-sm text-muted">Hi {followup.candidateName.split(" ")[0]}.</p>
          )}
        </div>

        <div className="rounded-2xl border border-border bg-surface p-6 shadow-sm">
          {!followup ? (
            <p className="text-center text-sm text-competent">
              This link is invalid. Ask your advisor for a new one.
            </p>
          ) : followup.status === "responded" ? (
            <p className="text-center text-sm text-primary">
              You&apos;ve already responded — thanks!
            </p>
          ) : followup.type === "next_steps" ? (
            <div className="space-y-4">
              <p className="whitespace-pre-wrap text-sm text-foreground/85">
                {followup.content || "Thanks for meeting with us — reach out if you have questions."}
              </p>
              <FollowupResponseForm token={token} type="next_steps" orgType={followup.orgType} />
            </div>
          ) : (
            <>
              <p className="mb-4 text-sm text-muted">
                A few quick questions about how things have gone since your appointment.
              </p>
              <FollowupResponseForm token={token} type="self_report" orgType={followup.orgType} />
            </>
          )}
        </div>
      </div>
    </div>
  );
}
