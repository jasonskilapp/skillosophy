import { cookies } from "next/headers";
import { appMode } from "./config";
import { createSupabaseServerClient } from "./supabase/server";
import type { Role } from "./types";

export interface Session {
  userId: string;
  role: Role;
  name: string;
  email: string;
}

/** Cookie used in mock mode to remember which demo role is "logged in". */
export const DEMO_COOKIE = "discova_demo_role";

const DEMO_SESSIONS: Record<Role, Session> = {
  admin: {
    userId: "demo-admin",
    role: "admin",
    name: "Admin",
    email: "admin@discova-demo.ca",
  },
  recruiter: {
    userId: "rec-dana",
    role: "recruiter",
    name: "Dana Whitfield",
    email: "dana@discova-demo.ca",
  },
  seeker: {
    userId: "demo-seeker",
    role: "seeker",
    name: "Demo Job Seeker",
    email: "seeker@discova-demo.ca",
  },
};

/** Resolve the current session, or null if signed out. */
export async function getSession(): Promise<Session | null> {
  if (appMode === "mock") {
    const store = await cookies();
    const role = store.get(DEMO_COOKIE)?.value as Role | undefined;
    if (role && DEMO_SESSIONS[role]) return DEMO_SESSIONS[role];
    return null;
  }

  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const { data: profile } = await supabase
    .from("profiles")
    .select("role, full_name, email")
    .eq("id", user.id)
    .single();

  if (!profile) return null;

  return {
    userId: user.id,
    role: profile.role as Role,
    name: profile.full_name ?? user.email ?? "User",
    email: profile.email ?? user.email ?? "",
  };
}

/** Home path for a given role after login. */
export function homePathForRole(role: Role): string {
  switch (role) {
    case "admin":
      return "/admin";
    case "recruiter":
      return "/recruiter/dashboard";
    case "seeker":
      return "/seeker/upload";
  }
}
