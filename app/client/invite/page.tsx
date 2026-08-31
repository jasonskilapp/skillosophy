import { redirect } from "next/navigation";
import { createSupabaseAdminClient } from "@/lib/supabase/server";
import type { CandidateReport } from "@/lib/types";
import ClaimInviteForm from "./ClaimInviteForm";

export default async function ClientInvitePage({
  searchParams,
}: {
  searchParams: Promise<{ token?: string }>;
}) {
  const { token } = await searchParams;
  if (!token) redirect("/");

  const admin = createSupabaseAdminClient();
  const { data: candidate } = await admin
    .from("candidates")
    .select("id, report, invite_claimed_at, invite_expires_at")
    .eq("invite_token", token)
    .maybeSingle();

  if (!candidate) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-background px-4">
        <div className="w-full max-w-sm rounded-xl border border-border bg-surface p-8 text-center">
          <h1 className="mb-2 text-lg font-semibold">Invalid link</h1>
          <p className="text-sm text-muted">This invite link is invalid or has already been used. Please contact your caseworker.</p>
        </div>
      </main>
    );
  }

  if (candidate.invite_claimed_at) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-background px-4">
        <div className="w-full max-w-sm rounded-xl border border-border bg-surface p-8 text-center">
          <h1 className="mb-2 text-lg font-semibold">Already activated</h1>
          <p className="text-sm text-muted">This invite has already been used. <a href="/login" className="text-primary underline">Sign in to your account.</a></p>
        </div>
      </main>
    );
  }

  if (candidate.invite_expires_at && new Date(candidate.invite_expires_at) < new Date()) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-background px-4">
        <div className="w-full max-w-sm rounded-xl border border-border bg-surface p-8 text-center">
          <h1 className="mb-2 text-lg font-semibold">Link expired</h1>
          <p className="text-sm text-muted">This invite link has expired. Please ask your caseworker to send a new one.</p>
        </div>
      </main>
    );
  }

  const report = candidate.report as CandidateReport | null;
  const email = report?.contact?.email ?? "";
  const name = report?.contact?.name ?? "";

  return (
    <main className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="w-full max-w-sm">
        <div className="mb-8 text-center">
          <h1 className="text-2xl font-bold">Create your account</h1>
          <p className="mt-2 text-sm text-muted">Your pathway is ready. Set a password to access it anytime.</p>
        </div>
        <ClaimInviteForm token={token} email={email} name={name} />
      </div>
    </main>
  );
}
