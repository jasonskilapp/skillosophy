import { cookies } from "next/headers";
import { appMode } from "./config";
import { createSupabaseServerClient } from "./supabase/server";
import type { AccountType, OrgRole, OrgType } from "./types";

/**
 * The resolved session for the current request. In the multi-tenant model an
 * account is one of three types; org members additionally carry their org id,
 * org role, and the org's type (which drives Campus vs Newcomer labels/flows).
 */
export interface Session {
  userId: string;
  accountType: AccountType;
  name: string;
  email: string;
  organizationId?: string | null;
  organizationName?: string | null;
  orgRole?: OrgRole | null;
  orgType?: OrgType | null;
}

/** Cookie used in mock mode to remember which demo identity is "logged in". */
export const DEMO_COOKIE = "skillosophy_demo_role";

/** Demo identity keys available in mock mode. */
export type DemoRole = "platform" | "org_admin" | "member" | "seeker";

const DEMO_SESSIONS: Record<DemoRole, Session> = {
  platform: {
    userId: "demo-platform",
    accountType: "platform_admin",
    name: "Platform Admin",
    email: "admin@skillosophy-demo.ca",
  },
  org_admin: {
    userId: "demo-org-admin",
    accountType: "org_member",
    name: "Dana Whitfield",
    email: "dana@skillosophy-demo.ca",
    organizationId: "org-uoft-career",
    organizationName: "UofT Career Centre",
    orgRole: "org_admin",
    orgType: "campus",
  },
  member: {
    userId: "demo-member",
    accountType: "org_member",
    name: "Omar Reyes",
    email: "omar@skillosophy-demo.ca",
    organizationId: "org-uoft-career",
    organizationName: "UofT Career Centre",
    orgRole: "member",
    orgType: "campus",
  },
  seeker: {
    userId: "demo-seeker",
    accountType: "seeker",
    name: "Demo Student",
    email: "student@skillosophy-demo.ca",
  },
};

export function demoSession(role: DemoRole): Session {
  return DEMO_SESSIONS[role];
}

/** Resolve the current session, or null if signed out. */
export async function getSession(): Promise<Session | null> {
  if (appMode === "mock") {
    const store = await cookies();
    const role = store.get(DEMO_COOKIE)?.value as DemoRole | undefined;
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
    .select(
      "account_type, org_role, organization_id, full_name, email, organizations(name, type)",
    )
    .eq("id", user.id)
    .single();

  if (!profile) return null;

  const org = (profile.organizations ?? null) as
    | { name: string; type: OrgType }
    | { name: string; type: OrgType }[]
    | null;
  const orgRecord = Array.isArray(org) ? (org[0] ?? null) : org;

  return {
    userId: user.id,
    accountType: profile.account_type as AccountType,
    name: profile.full_name ?? user.email ?? "User",
    email: profile.email ?? user.email ?? "",
    organizationId: profile.organization_id ?? null,
    organizationName: orgRecord?.name ?? null,
    orgRole: (profile.org_role as OrgRole | null) ?? null,
    orgType: orgRecord?.type ?? null,
  };
}

/** Home path after login, by account type / org role. */
export function homePathForSession(session: Session): string {
  switch (session.accountType) {
    case "platform_admin":
      return "/platform";
    case "org_member":
      return "/dashboard";
    case "seeker":
      return "/seeker/upload";
  }
}

/** Display labels that vary by organization type (Campus vs Newcomer). */
export function orgLabels(type: OrgType | null | undefined) {
  if (type === "newcomer") {
    return {
      member: "Caseworker",
      members: "Caseworkers",
      candidate: "Client",
      candidates: "Clients",
      meeting: "appointment",
    };
  }
  // default: campus
  return {
    member: "Advisor",
    members: "Advisors",
    candidate: "Student",
    candidates: "Students",
    meeting: "appointment",
  };
}
