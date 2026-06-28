/**
 * The shared data contract for Skillosophy.
 *
 * `CandidateReport` is the structured JSON the Anthropic pipeline produces from
 * a resume (an adaptation of the v7 "Canadian Resume Analysis" prompt). The
 * recruiter-facing dashboard renders directly from this shape, so the prompt's
 * JSON schema and these types must stay in sync.
 */

/**
 * Account types in the multi-tenant model.
 *  - platform_admin: Skillosophy staff, sits above all organizations
 *  - org_member: belongs to one organization, with an org-level role
 *  - seeker: an external candidate (student / client), not an org member
 */
export type AccountType = "platform_admin" | "org_member" | "seeker";

/** A member's role within their organization. */
export type OrgRole = "org_admin" | "member";

/** Organization flavour — switches intake questions, labels, and output format. */
export type OrgType = "campus" | "newcomer";

/** Legacy alias kept only where a flat role is still convenient. */
export type Role = "admin" | "recruiter" | "seeker";

export interface Organization {
  id: string;
  name: string;
  slug: string;
  /** Immutable human-readable customer handle, e.g. "SK-0001". */
  customerCode: string;
  type: OrgType;
  /** Seats from the signed contract; team invites are blocked at this cap. */
  seatLimit: number;
  status: "active" | "suspended";
  createdAt: string;
}

/** Organization plus usage counts, for the platform console. */
export interface OrgSummary extends Organization {
  memberCount: number;
  /** Active members + outstanding (pending) team invites — counts against seatLimit. */
  seatsUsed: number;
  candidateCount: number;
}

/** A person on an organization's team (admin or member). */
export interface TeamMember {
  id: string;
  name: string;
  email: string;
  orgRole: OrgRole;
  status: "active" | "invited";
  createdAt: string;
}

/** TeamMember plus the number of candidates they own — for the platform admin view only. */
export interface TeamMemberWithCount extends TeamMember {
  candidateCount: number;
  /** "active" | "suspended" | "inactive" for joined members; always "active" for pending invites. */
  accountStatus: "active" | "suspended" | "inactive";
}

export type CareerStage =
  | "Early Career"
  | "Developing"
  | "Established"
  | "Senior";

export type Strength = "Foundational" | "Competent" | "Proficient" | "Expert";

export type ReportStatus = "pending" | "processing" | "done" | "failed";

/** A headline metric for the stat cards at the top of the profile. */
export interface HeadlineStat {
  /** Big number / value, e.g. "20+", "$230K", "2,000+". */
  value: string;
  /** Short label above the value, e.g. "Years experience". */
  label: string;
  /** Smaller qualifier under the value, e.g. "Since 2004". */
  sublabel: string;
}

/** A skill with its proven strength and the resume evidence behind it. */
export interface Skill {
  name: string;
  strength: Strength;
  /** Where the skill came from — "Experience — Title at Company" or "Education — Program". */
  source?: string;
  /** The specific resume content that proves the skill (Part 2 evidence). */
  evidence?: string;
}

/** Estimated Canadian compensation. All figures are annual CAD estimates. */
export interface Comp {
  low: number;
  median?: number;
  high: number;
  /** Province code or "Canada-wide". */
  region?: string;
  /** Optional caveat, e.g. "varies by sector". */
  note?: string;
}

export interface Industry {
  name: string;
  type: "Traditional" | "Non-Traditional";
  /** 3-4 sentences connecting the candidate's skills to this industry. */
  whyItFits: string;
  /** Canadian demand signal — growth, strongest provinces, hiring sub-sectors. */
  demandSignal?: string;
  /** What entering this sector unlocks for the candidate. */
  whatItOpens?: string;
  comp?: Comp;
}

export interface TargetRole {
  /** Role type / category, e.g. "Operations Leadership Roles". */
  title: string;
  /** Why the candidate is well-positioned for it. */
  whySuited: string;
  /** entry / mid / senior / executive. */
  careerStageFit?: string;
  /** Industries from the recommendations where this role is in demand. */
  whereItExists?: string;
  comp?: Comp;
}

export interface KeywordGroup {
  /** Industry heading, e.g. "PROPTECH / PROPERTY MANAGEMENT SOFTWARE". */
  industry: string;
  terms: string[];
}

export interface RecruiterNote {
  tone: "positive" | "caution";
  text: string;
}

export interface CandidateContact {
  name: string;
  location?: string;
  email?: string;
  phone?: string;
  /** The target-role tagline shown as a badge by the name. */
  headline?: string;
}

/** The full structured analysis that powers a candidate's dashboard profile. */
export interface CandidateReport {
  contact: CandidateContact;
  careerStage: CareerStage;
  headlineStats: HeadlineStat[];
  skills: {
    hard: Skill[];
    soft: Skill[];
  };
  industries: Industry[];
  targetRoles: TargetRole[];
  keywords: KeywordGroup[];
  recruiterNotes: RecruiterNote[];
  /** True when figures are model estimates (always true in this prototype). */
  estimatesNote?: string;
}

/** A timestamped note on an organization, written by a platform admin. */
export interface OrgNote {
  id: string;
  organizationId: string;
  content: string;
  createdByName: string | null;
  createdByEmail: string | null;
  createdAt: string;
}

/** A row in a member's candidate list (tile). Always scoped to one organization. */
export interface CandidateSummary {
  id: string;
  name: string;
  /** ISO timestamp the resume was uploaded. */
  uploadedAt: string;
  /** ISO date of the meeting/appointment this upload is for, if set on the invite. */
  meetingDate?: string | null;
  status: ReportStatus;
  /** Target-role headline, shown on the tile once analysis is done. */
  headline?: string | null;
  /** The organization that owns this candidate record. */
  organizationId?: string | null;
  /** Name of the member (advisor/caseworker/recruiter) who owns this candidate. */
  ownerName?: string | null;
  /** Recruiter workflow status, independent of the AI pipeline status. */
  workflowStatus?: WorkflowStatus | null;
}

export type WorkflowStatus =
  | "intake_in_progress"
  | "appointment_scheduled"
  | "profile_reviewed"
  | "appointment_completed";

export const WORKFLOW_STATUS_LABELS: Record<WorkflowStatus, string> = {
  intake_in_progress: "Intake in progress",
  appointment_scheduled: "Appointment scheduled",
  profile_reviewed: "Profile reviewed",
  appointment_completed: "Appointment completed",
};

export type NoteTag =
  | "internal_note"
  | "recommendation"
  | "missing_skills"
  | "missing_certifications"
  | "missing_employment";

export const NOTE_TAG_LABELS: Record<NoteTag, string> = {
  internal_note: "Internal note",
  recommendation: "Recommendation for next review",
  missing_skills: "Missing skills",
  missing_certifications: "Missing certifications",
  missing_employment: "Missing employment",
};

export interface CandidateNote {
  id: string;
  candidateId: string;
  content: string;
  tags: NoteTag[];
  createdByName: string | null;
  createdAt: string;
}
