import { appMode } from "./config";
import {
  MOCK_CANDIDATES,
  MOCK_ORGS,
  MOCK_ORG_ID,
  MOCK_REPORTS,
  MOCK_TEAM,
} from "./mock";
import { createSupabaseAdminClient } from "./supabase/server";
import type { Session } from "./auth";
import type {
  CandidateReport,
  CandidateSummary,
  OrgNote,
  OrgSummary,
  OrgType,
  TeamMember,
  TeamMemberWithCount,
} from "./types";

/**
 * Data-access layer. Every candidate/invite read is scoped to one organization;
 * within an org, an org admin sees all candidates while a member sees only their
 * own. Mock mode echoes seed data; live mode queries Supabase via the service
 * role (app-level scoping is the tenant-isolation guard until RLS is enabled).
 */

// ---------------------------------------------------------------------------
// Candidate dashboard (org-scoped, visibility-tiered)
// ---------------------------------------------------------------------------

export async function listCandidatesForSession(
  session: Session,
): Promise<CandidateSummary[]> {
  if (appMode === "mock") {
    if (session.orgRole === "member") {
      return MOCK_CANDIDATES.filter((c) => c.ownerName === session.name);
    }
    return MOCK_CANDIDATES;
  }

  if (!session.organizationId) return [];
  const supabase = createSupabaseAdminClient();
  let query = supabase
    .from("candidates")
    .select(
      "id, name, uploaded_at, meeting_date, status, headline, organization_id, recruiter_name",
    )
    .eq("organization_id", session.organizationId)
    .order("uploaded_at", { ascending: false });

  // Members see only their own candidates; org admins see the whole org.
  if (session.orgRole === "member") {
    query = query.eq("recruiter_id", session.userId);
  }

  const { data, error } = await query;
  if (error) throw new Error(error.message);
  return (data ?? []).map(rowToSummary);
}

export async function getCandidate(
  session: Session,
  id: string,
): Promise<{ summary: CandidateSummary; report: CandidateReport | null } | null> {
  if (appMode === "mock") {
    const summary = MOCK_CANDIDATES.find((c) => c.id === id);
    if (!summary) return null;
    if (session.orgRole === "member" && summary.ownerName !== session.name) {
      return null;
    }
    return { summary, report: MOCK_REPORTS[id] ?? null };
  }

  if (!session.organizationId) return null;
  const supabase = createSupabaseAdminClient();
  const { data, error } = await supabase
    .from("candidates")
    .select(
      "id, name, uploaded_at, meeting_date, status, headline, organization_id, recruiter_name, recruiter_id, report",
    )
    .eq("id", id)
    .single();

  if (error || !data) return null;
  // Tenant + visibility guard.
  if (data.organization_id !== session.organizationId) return null;
  if (session.orgRole === "member" && data.recruiter_id !== session.userId) {
    return null;
  }
  return {
    summary: rowToSummary(data),
    report: (data.report as CandidateReport | null) ?? null,
  };
}

// ---------------------------------------------------------------------------
// Platform console: organizations
// ---------------------------------------------------------------------------

export async function listOrganizations(): Promise<OrgSummary[]> {
  if (appMode === "mock") return MOCK_ORGS;

  const supabase = createSupabaseAdminClient();
  const { data, error } = await supabase
    .from("organizations")
    .select("id, name, slug, customer_code, type, seat_limit, status, created_at")
    .order("created_at", { ascending: false });
  if (error) throw new Error(error.message);

  return Promise.all((data ?? []).map((o) => withCounts(o)));
}

export async function getOrganization(id: string): Promise<OrgSummary | null> {
  if (appMode === "mock") {
    return MOCK_ORGS.find((o) => o.id === id) ?? null;
  }
  const supabase = createSupabaseAdminClient();
  const { data, error } = await supabase
    .from("organizations")
    .select("id, name, slug, customer_code, type, seat_limit, status, created_at")
    .eq("id", id)
    .single();
  if (error || !data) return null;
  return withCounts(data);
}

export async function listOrgNotes(orgId: string): Promise<OrgNote[]> {
  if (appMode === "mock") return [];
  const supabase = createSupabaseAdminClient();
  const { data, error } = await supabase
    .from("org_notes")
    .select("id, organization_id, content, created_by_name, created_by_email, created_at")
    .eq("organization_id", orgId)
    .order("created_at", { ascending: false });
  if (error) throw new Error(error.message);
  return (data ?? []).map((n) => ({
    id: n.id,
    organizationId: n.organization_id,
    content: n.content,
    createdByName: n.created_by_name,
    createdByEmail: n.created_by_email,
    createdAt: n.created_at,
  }));
}

// ---------------------------------------------------------------------------
// Org team + seat usage
// ---------------------------------------------------------------------------

export async function listTeam(orgId: string): Promise<TeamMember[]> {
  if (appMode === "mock") return MOCK_TEAM;

  const supabase = createSupabaseAdminClient();
  const [{ data: members }, { data: invites }] = await Promise.all([
    supabase
      .from("profiles")
      .select("id, full_name, email, org_role, created_at")
      .eq("organization_id", orgId)
      .eq("account_type", "org_member")
      .order("created_at", { ascending: true }),
    supabase
      .from("team_invites")
      .select("id, name, email, org_role, created_at")
      .eq("organization_id", orgId)
      .eq("status", "pending")
      .order("created_at", { ascending: true }),
  ]);

  const active: TeamMember[] = (members ?? []).map((m) => ({
    id: m.id,
    name: m.full_name ?? m.email,
    email: m.email,
    orgRole: (m.org_role as TeamMember["orgRole"]) ?? "member",
    status: "active",
    createdAt: m.created_at,
  }));
  const pending: TeamMember[] = (invites ?? []).map((i) => ({
    id: i.id,
    name: i.name ?? i.email ?? "Invited",
    email: i.email ?? "",
    orgRole: (i.org_role as TeamMember["orgRole"]) ?? "member",
    status: "invited",
    createdAt: i.created_at,
  }));
  return [...active, ...pending];
}

export async function listTeamWithCandidateCounts(
  orgId: string,
): Promise<TeamMemberWithCount[]> {
  if (appMode === "mock") {
    return MOCK_TEAM.map((m) => ({ ...m, candidateCount: 0 }));
  }

  const supabase = createSupabaseAdminClient();
  const [{ data: members }, { data: invites }, { data: candidateRows }] =
    await Promise.all([
      supabase
        .from("profiles")
        .select("id, full_name, email, org_role, created_at")
        .eq("organization_id", orgId)
        .eq("account_type", "org_member")
        .order("created_at", { ascending: true }),
      supabase
        .from("team_invites")
        .select("id, name, email, org_role, created_at")
        .eq("organization_id", orgId)
        .eq("status", "pending")
        .order("created_at", { ascending: true }),
      supabase
        .from("candidates")
        .select("recruiter_id")
        .eq("organization_id", orgId),
    ]);

  const countMap = new Map<string, number>();
  for (const c of candidateRows ?? []) {
    if (c.recruiter_id) {
      countMap.set(c.recruiter_id, (countMap.get(c.recruiter_id) ?? 0) + 1);
    }
  }

  const active: TeamMemberWithCount[] = (members ?? []).map((m) => ({
    id: m.id,
    name: m.full_name ?? m.email,
    email: m.email,
    orgRole: (m.org_role as TeamMember["orgRole"]) ?? "member",
    status: "active",
    createdAt: m.created_at,
    candidateCount: countMap.get(m.id) ?? 0,
  }));

  const pending: TeamMemberWithCount[] = (invites ?? []).map((i) => ({
    id: i.id,
    name: i.name ?? i.email ?? "Invited",
    email: i.email ?? "",
    orgRole: (i.org_role as TeamMember["orgRole"]) ?? "member",
    status: "invited",
    createdAt: i.created_at,
    candidateCount: 0,
  }));

  return [...active, ...pending];
}

export interface SeatUsage {
  used: number;
  limit: number;
  full: boolean;
}

export async function getSeatUsage(
  orgId: string,
  seatLimit: number,
): Promise<SeatUsage> {
  if (appMode === "mock") {
    const org = MOCK_ORGS.find((o) => o.id === orgId);
    const used = org?.seatsUsed ?? MOCK_TEAM.length;
    return { used, limit: seatLimit, full: used >= seatLimit };
  }

  const supabase = createSupabaseAdminClient();
  const [{ count: members }, { count: pending }] = await Promise.all([
    supabase
      .from("profiles")
      .select("*", { count: "exact", head: true })
      .eq("organization_id", orgId)
      .eq("account_type", "org_member"),
    supabase
      .from("team_invites")
      .select("*", { count: "exact", head: true })
      .eq("organization_id", orgId)
      .eq("status", "pending"),
  ]);
  const used = (members ?? 0) + (pending ?? 0);
  return { used, limit: seatLimit, full: used >= seatLimit };
}

// ---------------------------------------------------------------------------
// Seeker: their own upload
// ---------------------------------------------------------------------------

export async function getSeekerCandidate(
  seekerId: string,
): Promise<CandidateSummary | null> {
  if (appMode === "mock") return null;

  const supabase = createSupabaseAdminClient();
  const { data } = await supabase
    .from("candidates")
    .select(
      "id, name, uploaded_at, meeting_date, status, headline, organization_id, recruiter_name",
    )
    .eq("seeker_id", seekerId)
    .order("uploaded_at", { ascending: false })
    .limit(1)
    .maybeSingle();
  return data ? rowToSummary(data) : null;
}

// ---------------------------------------------------------------------------
// Invites
// ---------------------------------------------------------------------------

export interface InviteInfo {
  token: string;
  recruiterName: string | null;
  candidateName: string | null;
  candidateEmail: string | null;
  meetingDate: string | null;
  orgType: OrgType | null;
  status: string;
  valid: boolean;
}

export async function getInviteByToken(token: string): Promise<InviteInfo | null> {
  if (appMode === "mock") {
    return {
      token,
      recruiterName: "Dana Whitfield",
      candidateName: null,
      candidateEmail: null,
      meetingDate: null,
      orgType: "campus",
      status: "pending",
      valid: true,
    };
  }

  const supabase = createSupabaseAdminClient();
  const { data } = await supabase
    .from("invites")
    .select(
      "token, recruiter_name, candidate_name, candidate_email, meeting_date, status, expires_at, organizations(type)",
    )
    .eq("token", token)
    .maybeSingle();
  if (!data) return null;

  const expired = data.expires_at
    ? new Date(data.expires_at).getTime() < Date.now()
    : false;
  const org = data.organizations as { type: OrgType } | { type: OrgType }[] | null;
  const orgRecord = Array.isArray(org) ? (org[0] ?? null) : org;
  return {
    token: data.token,
    recruiterName: data.recruiter_name,
    candidateName: data.candidate_name,
    candidateEmail: data.candidate_email,
    meetingDate: data.meeting_date,
    orgType: orgRecord?.type ?? null,
    status: data.status,
    valid: !expired,
  };
}

export interface TeamInviteInfo {
  token: string;
  organizationId: string;
  organizationName: string | null;
  name: string | null;
  email: string | null;
  orgRole: "org_admin" | "member";
  status: string;
  valid: boolean;
}

export async function getTeamInviteByToken(
  token: string,
): Promise<TeamInviteInfo | null> {
  if (appMode === "mock") {
    return {
      token,
      organizationId: MOCK_ORG_ID,
      organizationName: "UofT Career Centre",
      name: null,
      email: null,
      orgRole: "member",
      status: "pending",
      valid: true,
    };
  }

  const supabase = createSupabaseAdminClient();
  const { data } = await supabase
    .from("team_invites")
    .select(
      "token, organization_id, name, email, org_role, status, expires_at, organizations(name)",
    )
    .eq("token", token)
    .maybeSingle();
  if (!data) return null;

  const expired = data.expires_at
    ? new Date(data.expires_at).getTime() < Date.now()
    : false;
  const org = data.organizations as { name: string } | { name: string }[] | null;
  const orgRecord = Array.isArray(org) ? (org[0] ?? null) : org;
  return {
    token: data.token,
    organizationId: data.organization_id,
    organizationName: orgRecord?.name ?? null,
    name: data.name,
    email: data.email,
    orgRole: (data.org_role as "org_admin" | "member") ?? "member",
    status: data.status,
    valid: !expired && data.status === "pending",
  };
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

type CandidateRow = {
  id: string;
  name: string;
  uploaded_at: string;
  meeting_date: string | null;
  status: string;
  headline: string | null;
  organization_id: string | null;
  recruiter_name: string | null;
};

function rowToSummary(row: CandidateRow): CandidateSummary {
  return {
    id: row.id,
    name: row.name,
    uploadedAt: row.uploaded_at,
    meetingDate: row.meeting_date,
    status: row.status as CandidateSummary["status"],
    headline: row.headline,
    organizationId: row.organization_id,
    ownerName: row.recruiter_name,
  };
}

type OrgRow = {
  id: string;
  name: string;
  slug: string;
  customer_code: string;
  type: string;
  seat_limit: number;
  status: string;
  created_at: string;
};

/** Format a sequential customer code, e.g. 1 -> "SK-0001". */
export function formatCustomerCode(n: number): string {
  return `SK-${String(n).padStart(4, "0")}`;
}

/** The next suggested customer code (editable by the platform admin). */
export async function suggestCustomerCode(): Promise<string> {
  if (appMode === "mock") {
    return formatCustomerCode(MOCK_ORGS.length + 1);
  }
  const supabase = createSupabaseAdminClient();
  const { data } = await supabase
    .from("organizations")
    .select("customer_code")
    .like("customer_code", "SK-%");
  let max = 0;
  for (const row of data ?? []) {
    const n = parseInt(String(row.customer_code).replace(/\D/g, ""), 10);
    if (Number.isFinite(n) && n > max) max = n;
  }
  return formatCustomerCode(max + 1);
}

async function withCounts(o: OrgRow): Promise<OrgSummary> {
  const supabase = createSupabaseAdminClient();
  const [{ count: members }, { count: pending }, { count: candidates }] =
    await Promise.all([
      supabase
        .from("profiles")
        .select("*", { count: "exact", head: true })
        .eq("organization_id", o.id)
        .eq("account_type", "org_member"),
      supabase
        .from("team_invites")
        .select("*", { count: "exact", head: true })
        .eq("organization_id", o.id)
        .eq("status", "pending"),
      supabase
        .from("candidates")
        .select("*", { count: "exact", head: true })
        .eq("organization_id", o.id),
    ]);
  return {
    id: o.id,
    name: o.name,
    slug: o.slug,
    customerCode: o.customer_code,
    type: o.type as OrgType,
    seatLimit: o.seat_limit,
    status: o.status as OrgSummary["status"],
    createdAt: o.created_at,
    memberCount: members ?? 0,
    seatsUsed: (members ?? 0) + (pending ?? 0),
    candidateCount: candidates ?? 0,
  };
}
