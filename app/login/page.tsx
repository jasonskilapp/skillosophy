import { redirect } from "next/navigation";
import LoginForm from "@/components/LoginForm";
import { demoLogin } from "@/app/actions";
import { getSession, homePathForRole } from "@/lib/auth";
import { appMode } from "@/lib/config";

export default async function LoginPage() {
  const session = await getSession();
  if (session) redirect(homePathForRole(session.role));

  return (
    <div className="flex flex-1 items-center justify-center px-4 py-12">
      <div className="w-full max-w-sm">
        <div className="mb-8 text-center">
          <span className="inline-flex h-11 w-11 items-center justify-center rounded-xl bg-primary text-lg font-bold text-white">
            D
          </span>
          <h1 className="mt-4 text-2xl font-bold tracking-tight">Discova</h1>
          <p className="mt-1 text-sm text-muted">
            Candidate intelligence for recruiters
          </p>
        </div>

        <div className="rounded-2xl border border-border bg-surface p-6 shadow-sm">
          {appMode === "live" ? (
            <LoginForm />
          ) : (
            <DemoLogin />
          )}
        </div>

        {appMode === "mock" && (
          <p className="mt-4 text-center text-xs text-muted">
            Demo mode — Supabase isn&apos;t configured, so this uses seed data.
            Add Supabase keys to enable real accounts.
          </p>
        )}
      </div>
    </div>
  );
}

function DemoLogin() {
  return (
    <div className="space-y-3">
      <p className="text-sm text-muted">
        Choose a role to explore the prototype:
      </p>
      <form action={demoLogin.bind(null, "recruiter")}>
        <button
          type="submit"
          className="w-full rounded-lg bg-primary py-2.5 text-sm font-semibold text-white transition hover:opacity-90"
        >
          Enter as Recruiter
        </button>
      </form>
      <form action={demoLogin.bind(null, "admin")}>
        <button
          type="submit"
          className="w-full rounded-lg border border-border py-2.5 text-sm font-semibold transition hover:bg-foundational-soft"
        >
          Enter as Admin
        </button>
      </form>
      <form action={demoLogin.bind(null, "seeker")}>
        <button
          type="submit"
          className="w-full rounded-lg border border-border py-2.5 text-sm font-semibold transition hover:bg-foundational-soft"
        >
          Enter as Job Seeker
        </button>
      </form>
    </div>
  );
}
