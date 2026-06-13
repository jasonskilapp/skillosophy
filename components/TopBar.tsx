import Link from "next/link";
import { signOut } from "@/app/actions";
import type { Session } from "@/lib/auth";

const ROLE_LABEL: Record<string, string> = {
  admin: "Admin",
  recruiter: "Recruiter",
  seeker: "Job seeker",
};

/** Top navigation bar shown on authenticated pages. */
export default function TopBar({ session }: { session: Session | null }) {
  return (
    <header className="sticky top-0 z-20 border-b border-border bg-surface/90 backdrop-blur">
      <div className="mx-auto flex h-14 max-w-6xl items-center justify-between px-4 sm:px-6">
        <Link href="/" className="flex items-center gap-2">
          <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-primary text-sm font-bold text-white">
            D
          </span>
          <span className="text-base font-semibold tracking-tight">Discova</span>
        </Link>

        {session && (
          <div className="flex items-center gap-3 text-sm">
            <span className="hidden text-muted sm:inline">
              {session.name}
              <span className="mx-1.5 text-border-strong">·</span>
              {ROLE_LABEL[session.role] ?? session.role}
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
