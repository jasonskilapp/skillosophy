import { redirect } from "next/navigation";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { getClientCandidate } from "@/lib/data";
import ClientDashboard from "./ClientDashboard";

export const dynamic = "force-dynamic";

export default async function ClientDashboardPage() {
  const supabase = await createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const data = await getClientCandidate(user.id);
  if (!data) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-background px-4">
        <div className="w-full max-w-sm rounded-xl border border-border bg-surface p-8 text-center">
          <h1 className="mb-2 text-lg font-semibold">No pathway found</h1>
          <p className="text-sm text-muted">Your caseworker hasn&apos;t linked a pathway to your account yet. Please contact them for assistance.</p>
        </div>
      </main>
    );
  }

  return (
    <ClientDashboard
      candidateId={data.candidateId}
      orgName={data.orgName}
      report={data.report}
      pathway={data.pathway}
      requirements={data.requirements}
      userName={user.user_metadata?.full_name ?? user.email ?? ""}
    />
  );
}
