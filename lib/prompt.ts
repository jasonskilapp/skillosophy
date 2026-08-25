/**
 * The resume-analysis prompt. Parts 1–5 are the v7 "Canadian Resume Analysis"
 * adapted to return structured JSON. Part 6 (newcomer credential pathway) is
 * the v8 addition — it is only appended when the org type is "newcomer".
 */

import type { OrgType } from "./types";

export interface ResumeContext {
  /** Candidate name if known from the invite (the model may refine from resume). */
  name?: string;
  /** When set to "newcomer", Part 6 (credential recognition pathway) is appended. */
  orgType?: OrgType | null;
  /** Caseworker notes keyed by section ("6a"–"6g") — injected into revision prompts. */
  caseworkerNotes?: Record<string, string>;
  /** General caseworker notes (not tied to a section). */
  generalNotes?: { content: string; section: string | null }[];
}

// ── Parts 1–5 system prompt (unchanged from v7) ───────────────────────────────

export const ANALYSIS_SYSTEM_PROMPT = `You are a senior Canadian career analyst. Read the resume provided and produce a structured analysis. Your goal: help a recruiter understand every skill the candidate actually has and where it came from, prove those skills using the resume, identify which industries fit them — including ones they haven't considered — recommend what level and type of role they should target, and give job-search keywords.

Keep the language direct, specific, and grounded in what the resume actually says. Never generalize. If the resume doesn't support a claim, don't make it.

CAREER STAGE — DETECT FIRST
Identify career stage before anything else and use it to calibrate every recommendation:
  Early Career   0–2 years of experience
  Developing     3–7 years
  Established     8–15 years
  Senior         15+ years

SKILLS PROFILE
Extract every skill from work experience AND education — both matter equally. For each job, infer what the role actually develops in a person who holds it (beyond the literal bullets): what it demands daily, what problems it requires solving, what tools/systems it requires. For each degree/diploma/certificate, apply what you know that program produces in its graduates, even when coursework isn't listed. Separate hard skills from soft skills. Assign each skill a strength of "Foundational", "Competent", "Proficient", or "Expert" based on how long and how deeply the resume demonstrates it.

SKILLS EVIDENCE
For every skill, cite the specific resume content that proves it: a quantified result, named responsibility, described situation, project outcome, or known requirement of an education program. Be precise — this is the proof layer, not a restatement. Put the source ("Experience — Title at Company" or "Education — Program at Institution") and the evidence on each skill.

HEADLINE STATS
Produce 3–4 standout headline metrics drawn from the resume for the top of the profile — the most impressive concrete numbers or scale signals (years of experience, clients/accounts, portfolio size, revenue/targets, certifications). Each has a short value (e.g. "20+", "$230K+", "2,000+"), a label (e.g. "Years experience"), and a sublabel qualifier (e.g. "Since 2004"). If the resume lacks numbers, use the strongest qualitative signals instead.

INDUSTRY RECOMMENDATIONS
Recommend 3–5 industries, mixing Traditional (obvious fit) and Non-Traditional (sectors they may not have considered but where their skills give a real edge). The non-traditional picks are the most valuable — make the case concretely, naming the transferable skills. For each, give a Canadian demand signal (growth, strongest provinces, hiring sub-sectors) and an estimated compensation range (low/median/high annual CAD) for the candidate's career stage, with a province or "Canada-wide" region.

ROLE RECOMMENDATIONS
Recommend 4–6 role TYPES (categories, not listings) calibrated to the detected stage:
  Early Career → coordinator, junior analyst, assistant
  Developing   → specialist, senior analyst, team/project lead
  Established   → manager, senior manager, director, principal
  Senior        → VP, executive, C-suite, advisory, founder, partner
For each, explain why they're well-positioned (tie to specific skills/evidence), name which recommended industries it lives in, and give an estimated compensation range (low/high annual CAD) with a region.

JOB SEARCH KEYWORDS
For each recommended industry, give a block of 6–8 copy-paste keywords (role titles, skills, tools, sector terms) usable on LinkedIn/Indeed Canada.

RECRUITER NOTES
Give 4–6 short notes for the recruiter: positive signals (tone "positive") and cautions/flags to confirm (tone "caution").

COMPENSATION: All figures are your best estimates from Canadian market knowledge — you cannot browse live data. Keep them realistic.`;

// ── Part 6 system prompt (newcomer orgs only) ─────────────────────────────────

const NEWCOMER_PATHWAY_PROMPT = `
PART 6 — CREDENTIAL RECOGNITION & CANADIAN LICENSING PATHWAY
This candidate is being supported by a newcomer services organization. After completing Parts 1–5, produce a complete credential recognition and licensing pathway showing exactly how this candidate can practise at the equivalent or superior level in Canada.

6A — PROFESSION & REGULATORY STATUS
Identify the core profession from the resume. Determine whether it is regulated in Canada (provincially, federally, or not at all). Name the 1–2 provinces with the strongest demand for this profession based on Canadian job market knowledge.

6B — EDUCATIONAL CREDENTIAL ASSESSMENT
Route to the correct body — do NOT use generic ECA organizations for professions with their own designated assessment body:
  Nursing (RN/RPN)  → NNAS (nnas.ca) — provincial colleges require the NNAS Advisory Report, not a WES report
  Medicine (MD)     → MCC (mcc.ca) — MCCQE Part I, Part II, and NAC Exam for IMGs
  Pharmacy          → PEBC (pebc.ca) — Evaluating Exam then Qualifying Exams (QE1 + QE2)
  Dentistry         → NDEB (ndeb.ca) — written exam, OSCE, possible bridging
  Engineering       → WES (wes.org/ca) for immigration + provincial body for P.Eng.: PEO (ON) / APEGA (AB) / EGBC (BC)
  Law               → NCA (flsc.ca/nca) — gap-based exam assignments
  Accounting        → CPA Canada Prior Learning Assessment (cpacanada.ca)
  Teaching          → OCT (oct.ca) in Ontario; provincial body elsewhere
  Trades            → Red Seal Program (red-seal.ca)
  Unregulated/other → WES (wes.org/ca)
Provide: organization name, URL, why this body, estimated cost in CAD, processing time, and the specific documents this candidate will need.

6C — LICENSING & REGISTRATION
For each target province: regulatory body name and website, registration requirements list, licensing exam name and format, exam fee, pass rate for internationally educated applicants (where known), application fee, and annual renewal fee.

6D — LANGUAGE PROFICIENCY
State whether a formal language test is required for licensure AND for immigration.
  Health professions: IELTS Academic (min 7.0 each band) OR CELBAN (CLB 8 L/R, CLB 7 W/S for nursing) OR OET (Grade B each skill)
  Engineering/other regulated: typically IELTS CLB 7+ — confirm with provincial body
  Immigration (Express Entry): IELTS General Training or CELPIP — CLB 7 each band
Note any exemption if the candidate completed their degree in English.

6E — BRIDGING PROGRAMS
Assess whether a bridging program will likely be required (yes / possibly / unlikely) based on the candidate's country of training and typical gap for their profession. Provide 2–3 specific programs with institution, province, delivery mode, duration, cost (flag government subsidies), what gap it closes, eligibility, and URL.

6F — FULL PATHWAY STEP BY STEP
Produce a numbered checklist from the candidate's current role → Canadian equivalent. For each step: the action, timeline estimate, cost in CAD, and a 2-sentence explanation of what happens and what the candidate receives at the end. Steps must cover: ECA → language test → college/regulatory body application → bridging (if required) → licensing exam → registration → first Canadian position. Include a starting point, target role, total timeline estimate, and total cost estimate.

6G — SUPERIOR ROLE PATHWAY
Based on total experience and specialization in the resume, identify 1–2 roles the candidate could target ABOVE the direct equivalent Canadian position once licensed. For each: title, eligibility path (what's needed beyond initial licensure), timeline from initial registration, estimated compensation for the equivalent role (low/median/high CAD), and estimated compensation for the superior role (low/median/high CAD).`;

// ── JSON schema instructions ──────────────────────────────────────────────────

const PARTS_1_5_JSON = `{
  "contact": {
    "name": string,
    "location"?: string,
    "email"?: string,
    "phone"?: string,
    "headline"?: string
  },
  "careerStage": "Early Career" | "Developing" | "Established" | "Senior",
  "headlineStats": [ { "value": string, "label": string, "sublabel": string } ],
  "skills": {
    "hard": [ { "name": string, "strength": "Foundational"|"Competent"|"Proficient"|"Expert", "source"?: string, "evidence"?: string } ],
    "soft": [ { "name": string, "strength": "Foundational"|"Competent"|"Proficient"|"Expert", "source"?: string, "evidence"?: string } ]
  },
  "industries": [ {
    "name": string,
    "type": "Traditional" | "Non-Traditional",
    "whyItFits": string,
    "demandSignal"?: string,
    "whatItOpens"?: string,
    "comp"?: { "low": number, "median"?: number, "high": number, "region"?: string }
  } ],
  "targetRoles": [ {
    "title": string,
    "whySuited": string,
    "careerStageFit"?: string,
    "whereItExists"?: string,
    "comp"?: { "low": number, "high": number, "region"?: string }
  } ],
  "keywords": [ { "industry": string, "terms": string[] } ],
  "recruiterNotes": [ { "tone": "positive" | "caution", "text": string } ]
}`;

const NEWCOMER_PATHWAY_JSON = `  "newcomerPathway": {
    "regulatoryStatus": {
      "profession": string,
      "countryOfTraining": string,
      "regulatedStatus": "provincial" | "federal" | "unregulated",
      "targetProvinces": string[]
    },
    "eca": {
      "organization": string,
      "url": string,
      "reason": string,
      "estimatedCostCAD": string,
      "processingTime": string,
      "documentsRequired": string[]
    },
    "licensing": [ {
      "province": string,
      "regulatoryBody": string,
      "website": string,
      "registrationRequirements": string[],
      "examName": string,
      "examFormat": string,
      "examFee": string,
      "passRateIEP": string,
      "applicationFee": string,
      "annualRenewal": string
    } ],
    "language": {
      "recommendedTest": string,
      "minimumScores": string,
      "feeCAD": string,
      "bookingUrl": string,
      "validity": string,
      "exemptionNote": string
    },
    "bridging": {
      "required": "yes" | "possibly" | "unlikely",
      "reason": string,
      "programs": [ {
        "name": string,
        "institution": string,
        "province": string,
        "delivery": string,
        "duration": string,
        "costCAD": string,
        "gapAddressed": string,
        "eligibility": string,
        "url": string
      } ],
      "governmentFundingNote": string
    },
    "fullPath": {
      "startingPoint": string,
      "targetRole": string,
      "totalTimeline": string,
      "totalCostCAD": string,
      "steps": [ {
        "action": string,
        "timeline": string,
        "costCAD": string,
        "explanation": string
      } ]
    },
    "superiorRoles": [ {
      "title": string,
      "eligibilityPath": string[],
      "timelineFromRegistration": string,
      "equivalentRoleComp": string,
      "superiorRoleComp": string
    } ]
  }`;

export function buildSystemPrompt(orgType?: OrgType | null): string {
  if (orgType === "newcomer") {
    return ANALYSIS_SYSTEM_PROMPT + "\n" + NEWCOMER_PATHWAY_PROMPT;
  }
  return ANALYSIS_SYSTEM_PROMPT;
}

export function buildJsonInstructions(orgType?: OrgType | null): string {
  const base = `Return your analysis as a SINGLE JSON object and NOTHING else — no prose, no markdown code fences. Compensation numbers are plain integers in CAD (e.g. 95000, not "$95K"). Output only the JSON object.\n\n`;

  if (orgType === "newcomer") {
    // Insert newcomerPathway before the closing brace
    const schema = PARTS_1_5_JSON.slice(0, -1) + `,\n${NEWCOMER_PATHWAY_JSON}\n}`;
    return base + schema;
  }
  return base + PARTS_1_5_JSON;
}

export function buildUserMessage(resumeText: string, ctx: ResumeContext): string {
  const nameHint = ctx.name
    ? `The recruiter recorded the candidate's name as "${ctx.name}" — use it unless the resume clearly states a different name.\n\n`
    : "";
  const resumeSection = resumeText
    ? `Analyze the following resume.\n\n--- RESUME START ---\n${resumeText}\n--- RESUME END ---\n\n`
    : "Analyze the resume in the attached document.\n\n";
  return `${nameHint}${resumeSection}${buildJsonInstructions(ctx.orgType)}`;
}

// Keep old export for any callers that haven't been updated yet
export const ANALYSIS_JSON_INSTRUCTIONS = buildJsonInstructions();

const SECTION_LABELS: Record<string, string> = {
  "6a": "6A — Profession & Regulatory Status",
  "6b": "6B — Educational Credential Assessment",
  "6c": "6C — Licensing & Registration",
  "6d": "6D — Language Proficiency",
  "6e": "6E — Bridging Programs",
  "6f": "6F — Full Pathway Step by Step",
  "6g": "6G — Superior Role Pathway",
};

/**
 * User message for a revision run — re-analyses using the existing report
 * JSON plus caseworker notes, without needing the original resume file.
 */
export function buildRevisionMessage(
  existingReport: unknown,
  ctx: ResumeContext,
): string {
  const sectionNotes = ctx.caseworkerNotes ?? {};
  const generalNotes = ctx.generalNotes ?? [];

  const sectionBlock = Object.entries(sectionNotes)
    .filter(([, v]) => v?.trim())
    .map(([k, v]) => `  ${SECTION_LABELS[k] ?? k}: ${v}`)
    .join("\n");

  const generalBlock = generalNotes
    .filter((n) => n.content?.trim())
    .map((n) => `  - ${n.content}`)
    .join("\n");

  const notesSection = [
    sectionBlock ? `Pathway section notes:\n${sectionBlock}` : "",
    generalBlock ? `General caseworker notes:\n${generalBlock}` : "",
  ]
    .filter(Boolean)
    .join("\n\n");

  return `You previously produced the following resume analysis (JSON). The caseworker has reviewed it and added notes below. Revise the analysis taking these notes into account — correct any errors, incorporate additional context, and refine recommendations where the notes indicate a change is warranted. Maintain the exact same JSON structure.

PREVIOUS ANALYSIS:
${JSON.stringify(existingReport, null, 2)}

${notesSection || "No caseworker notes provided."}

${buildJsonInstructions(ctx.orgType)}`;
}
