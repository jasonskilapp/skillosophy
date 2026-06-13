import { appMode } from "./config";
import { MOCK_CANDIDATES, MOCK_RECRUITERS, MOCK_REPORTS } from "./mock";
import { createSupabaseAdminClient } from "./supabase/server";
import type {
  CandidateReport,
  CandidateSummary,
  RecruiterAccount,
} from "./types";

/**
 * Data-access layer. Each function works in both modes:
 *  - mock: returns/echoes seed data (writes are simulated, not persisted)
 *  - live: reads/writes the Supabase `candidates`, `invites`, `profiles` tables
 *
 * The schema is intentionally flat: a row in `candidates` is a resume upload
 * plus its analysis (status + report jsonb), which maps directly to the UI.
 */

// ---------------------------------------------------------------------------
// Recruiter dashboard
// ---------------------------------------------------------------------------

export async function listCandidatesForRecruiter(
  recruiterId: string,
): Promise<CandidateSummary[]> {
  if (appMode === "mock") {
    return MOCK_CANDIDATES;
  }

  const supabase = createSupabaseAdminClient();
  const { data, error } = await supabase
    .from("candidates")
    .select(
      "id, name, uploaded_at, meeting_date, status, headline, recruiter_name",
    )
    .eq("recruiter_id", recruiterId)
    .order("uploaded_at", { ascending: false });

  if (error) throw new Error(error.message);
  return (data ?? []).map(rowToSummary);
}

export async function getCandidate(
  id: string,
): Promise<{ summary: CandidateSummary; report: CandidateReport | null } | null> {
  if (appMode === "mock") {
    const summary = MOCK_CANDIDATES.find((c) => c.id === id);
    if (!summary) return null;
    return { summary, report: MOCK_REPORTS[id] ?? null };
  }

  const supabase = createSupabaseAdminClient();
  const { data, error } = await supabase
    .from("candidates")
    .select(
      "id, name, uploaded_at, meeting_date, status, headline, recruiter_name, report",
    )
    .eq("id", id)
    .single();

  if (error || !data) return null;
  return {
    summary: rowToSummary(data),
    report: (data.report as CandidateReport | null) ?? null,
  };
}

// ---------------------------------------------------------------------------
// Admin: recruiter accounts
// ---------------------------------------------------------------------------

export async function listRecruiters(): Promise<RecruiterAccount[]> {
  if (appMode === "mock") {
    return MOCK_RECRUITERS;
  }

  const supabase = createSupabaseAdminClient();
  const { data, error } = await supabase
    .from("profiles")
    .select("id, full_name, email, created_at")
    .eq("role", "recruiter")
    .order("created_at", { ascending: false });

  if (error) throw new Error(error.message);
  return (data ?? []).map((r) => ({
    id: r.id,
    name: r.full_name ?? r.email,
    email: r.email,
    createdAt: r.created_at,
  }));
}

// ---------------------------------------------------------------------------
// Seeker: their own upload + analysis status
// ---------------------------------------------------------------------------

export async function getSeekerCandidate(
  seekerId: string,
): Promise<CandidateSummary | null> {
  if (appMode === "mock") {
    // In mock mode the demo seeker has no real upload yet.
    return null;
  }

  const supabase = createSupabaseAdminClient();
  const { data } = await supabase
    .from("candidates")
    .select("id, name, uploaded_at, meeting_date, status, headline, recruiter_name")
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
  status: string;
  valid: boolean;
}

export async function getInviteByToken(token: string): Promise<InviteInfo | null> {
  if (appMode === "mock") {
    // Any token is accepted in demo mode.
    return {
      token,
      recruiterName: "Dana Whitfield",
      candidateName: null,
      candidateEmail: null,
      meetingDate: null,
      status: "pending",
      valid: true,
    };
  }

  const supabase = createSupabaseAdminClient();
  const { data } = await supabase
    .from("invites")
    .select(
      "token, recruiter_name, candidate_name, candidate_email, meeting_date, status, expires_at",
    )
    .eq("token", token)
    .maybeSingle();

  if (!data) return null;
  const expired = data.expires_at
    ? new Date(data.expires_at).getTime() < Date.now()
    : false;
  return {
    token: data.token,
    recruiterName: data.recruiter_name,
    candidateName: data.candidate_name,
    candidateEmail: data.candidate_email,
    meetingDate: data.meeting_date,
    status: data.status,
    valid: !expired,
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
    recruiterName: row.recruiter_name,
  };
}
