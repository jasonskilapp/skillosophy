import { redirect } from "next/navigation";
import { getOrgBySlug } from "@/lib/data";
import { getSession } from "@/lib/auth";
import RegisterForm from "./RegisterForm";

export default async function ClientRegisterPage({
  searchParams,
}: {
  searchParams: Promise<{ org?: string }>;
}) {
  const session = await getSession();
  if (session) redirect("/dashboard");

  const { org: orgSlug } = await searchParams;

  if (!orgSlug) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-background px-4">
        <div className="w-full max-w-sm rounded-xl border border-border bg-surface p-8 text-center">
          <h1 className="mb-2 text-lg font-semibold">Invalid registration link</h1>
          <p className="text-sm text-muted">This registration link is missing an organization code. Please use the link provided by your caseworker.</p>
        </div>
      </main>
    );
  }

  const org = await getOrgBySlug(orgSlug);

  if (!org) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-background px-4">
        <div className="w-full max-w-sm rounded-xl border border-border bg-surface p-8 text-center">
          <h1 className="mb-2 text-lg font-semibold">Organization not found</h1>
          <p className="text-sm text-muted">The organization in your link could not be found. Please contact your caseworker for a new link.</p>
        </div>
      </main>
    );
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="w-full max-w-sm">
        <div className="mb-8 text-center">
          <p className="text-xs font-medium uppercase tracking-wide text-muted">{org.name}</p>
          <h1 className="mt-1 text-2xl font-bold">Create your account</h1>
          <p className="mt-2 text-sm text-muted">Register to track your licensing pathway.</p>
        </div>
        <RegisterForm orgSlug={orgSlug} orgName={org.name} />
        <p className="mt-4 text-center text-sm text-muted">
          Already have an account?{" "}
          <a href="/login" className="text-primary underline">Sign in</a>
        </p>
      </div>
    </main>
  );
}
