/**
 * The shared data contract for Discova.
 *
 * `CandidateReport` is the structured JSON the Anthropic pipeline produces from
 * a resume (an adaptation of the v7 "Canadian Resume Analysis" prompt). The
 * recruiter-facing dashboard renders directly from this shape, so the prompt's
 * JSON schema and these types must stay in sync.
 */

export type Role = "admin" | "recruiter" | "seeker";

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

/** A row in the recruiter's candidate list (tile). */
export interface CandidateSummary {
  id: string;
  name: string;
  /** ISO timestamp the resume was uploaded. */
  uploadedAt: string;
  /** ISO date of the meeting this upload is for, if set on the invite. */
  meetingDate?: string | null;
  status: ReportStatus;
  /** Target-role headline, shown on the tile once analysis is done. */
  headline?: string | null;
  recruiterName?: string | null;
}

/** A recruiter account as seen by the admin. */
export interface RecruiterAccount {
  id: string;
  name: string;
  email: string;
  createdAt: string;
  candidateCount?: number;
}
