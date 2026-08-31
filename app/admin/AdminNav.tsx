"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";

const NAV = [
  { href: "/dashboard", label: "Dashboard" },
  { href: "/team", label: "Team" },
  { href: "/requirements", label: "Requirements" },
  { href: "/settings", label: "Settings" },
];

async function signOut() {
  const supabase = createSupabaseBrowserClient();
  await supabase.auth.signOut();
  window.location.href = "/login";
}

export default function AdminNav({ orgName, userName }: { orgName: string; userName: string }) {
  const pathname = usePathname();

  return (
    <aside className="flex w-52 shrink-0 flex-col border-r border-border bg-surface">
      <div className="border-b border-border px-4 py-5">
        <p className="text-[10px] font-semibold uppercase tracking-widest text-muted">Admin Portal</p>
        <p className="mt-0.5 truncate text-sm font-semibold">{orgName}</p>
      </div>

      <nav className="flex-1 px-2 py-4 space-y-0.5">
        {NAV.map((item) => {
          const active = pathname === item.href || pathname.startsWith(item.href + "/");
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center rounded-lg px-3 py-2 text-sm font-medium transition ${
                active
                  ? "bg-primary text-white"
                  : "text-muted hover:bg-muted/10 hover:text-foreground"
              }`}
            >
              {item.label}
            </Link>
          );
        })}
      </nav>

      <div className="border-t border-border px-4 py-4">
        <p className="truncate text-xs font-medium">{userName}</p>
        <button
          onClick={signOut}
          className="mt-1 text-xs text-muted transition hover:text-foreground"
        >
          Sign out
        </button>
      </div>
    </aside>
  );
}
