import Link from "next/link";
import { signOut } from "@/app/actions";
import type { Session } from "@/lib/auth";

function roleLabel(session: Session): string {
  if (session.accountType === "platform_admin") return "Platform admin";
  if (session.accountType === "seeker") return "Job seeker";
  return session.orgRole === "org_admin" ? "Org admin" : "Team member";
}

/** Top navigation bar shown on authenticated pages. */
export default function TopBar({ session }: { session: Session | null }) {
  const isOrgMember = session?.accountType === "org_member";
  const isOrgAdmin = isOrgMember && session?.orgRole === "org_admin";

  return (
    <header className="sticky top-0 z-20 border-b border-border bg-surface/90 backdrop-blur">
      <div className="mx-auto flex h-14 max-w-6xl items-center justify-between px-4 sm:px-6">
        <div className="flex items-center gap-6">
          <Link href="/" className="flex items-center gap-2">
            <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-primary text-sm font-bold text-white">
              S
            </span>
            <span className="text-base font-semibold tracking-tight">
              Skillosophy
            </span>
          </Link>

          {isOrgMember && (
            <nav className="hidden items-center gap-1 text-sm sm:flex">
              <Link
                href="/dashboard"
                className="rounded-md px-2.5 py-1.5 font-medium text-foreground/80 transition hover:bg-foundational-soft"
              >
                Candidates
              </Link>
              {isOrgAdmin && (
                <Link
                  href="/team"
                  className="rounded-md px-2.5 py-1.5 font-medium text-foreground/80 transition hover:bg-foundational-soft"
                >
                  Team
                </Link>
              )}
            </nav>
          )}
        </div>

        {session && (
          <div className="flex items-center gap-3 text-sm">
            <span className="hidden text-muted sm:inline">
              {session.organizationName && (
                <>
                  {session.organizationName}
                  <span className="mx-1.5 text-border-strong">·</span>
                </>
              )}
              {roleLabel(session)}
            </span>
            <form action={signOut}>
              <button
                type="submit"
                className="rounded-lg border border-border px-3 py-1.5 font-medium text-foreground/80 transition hover:bg-foundational-soft"
              >
                Sign out
              </button>
            </form>
          </div>
        )}
      </div>
    </header>
  );
}
