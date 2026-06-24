import SignupForm from "@/components/SignupForm";
import { getInviteByToken } from "@/lib/data";
import { formatDate } from "@/lib/format";

export const dynamic = "force-dynamic";

export default async function InvitePage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = await params;
  const invite = await getInviteByToken(token);

  return (
    <div className="flex flex-1 items-center justify-center px-4 py-12">
      <div className="w-full max-w-sm">
        <div className="mb-8 text-center">
          <span className="inline-flex h-11 w-11 items-center justify-center rounded-xl bg-primary text-lg font-bold text-white">
            S
          </span>
          <h1 className="mt-4 text-2xl font-bold tracking-tight">
            You&apos;re invited
          </h1>
          <p className="mt-1 text-sm text-muted">
            {invite?.recruiterName
              ? `${invite.recruiterName} invited you to upload your resume`
              : "Upload your resume ahead of your meeting"}
            {invite?.meetingDate ? ` for your meeting on ${formatDate(invite.meetingDate)}` : ""}
            .
          </p>
        </div>

        <div className="rounded-2xl border border-border bg-surface p-6 shadow-sm">
          {!invite || !invite.valid ? (
            <p className="text-center text-sm text-competent">
              This invite link is invalid or has expired. Ask your recruiter for
              a new one.
            </p>
          ) : (
            <>
              <p className="mb-4 text-sm text-muted">
                Create an account to upload your resume. It takes a minute.
              </p>
              <SignupForm
                token={token}
                defaultName={invite.candidateName}
                defaultEmail={invite.candidateEmail}
              />
            </>
          )}
        </div>
      </div>
    </div>
  );
}
