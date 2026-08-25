import Anthropic from "@anthropic-ai/sdk";
import { anthropicApiKey, anthropicModel } from "./config";
import {
  buildSystemPrompt,
  buildUserMessage,
  buildRevisionMessage,
  type ResumeContext,
} from "./prompt";
import type {
  CandidateReport,
  NewcomerPathway,
  PathwayBridgingProgram,
  PathwayProvinceLicensing,
  PathwayStep,
  PathwaySuperiorRole,
  Strength,
} from "./types";

const ESTIMATES_NOTE =
  "Compensation figures are model estimates based on Canadian market knowledge, not live Job Bank data.";

export interface AnalysisResult {
  report: CandidateReport;
  pathway: NewcomerPathway | null;
}

/**
 * Run the resume analysis through Claude and return a validated report and
 * optional newcomer pathway (when ctx.orgType === "newcomer").
 * Throws if the API key is missing or the model output can't be parsed.
 */
export async function analyzeResume(
  resumeText: string,
  ctx: ResumeContext,
): Promise<AnalysisResult> {
  if (!anthropicApiKey) {
    throw new Error("ANTHROPIC_API_KEY is not configured.");
  }

  const client = new Anthropic({ apiKey: anthropicApiKey });
  const response = await client.messages.create({
    model: anthropicModel,
    max_tokens: ctx.orgType === "newcomer" ? 16000 : 8000,
    system: buildSystemPrompt(ctx.orgType),
    messages: [{ role: "user", content: buildUserMessage(resumeText, ctx) }],
  });

  const raw = response.content
    .filter((b): b is Anthropic.TextBlock => b.type === "text")
    .map((b) => b.text)
    .join("");

  const parsed = parseJson(raw);
  return {
    report: normalizeReport(parsed, ctx),
    pathway: ctx.orgType === "newcomer" ? normalizePathway(parsed) : null,
  };
}

/**
 * Analyse a scanned or image-based PDF by sending it directly to Claude as a
 * document block. Used as a fallback when text extraction yields too little text.
 */
export async function analyzeResumeFromPdf(
  pdfBuffer: Buffer,
  ctx: ResumeContext,
): Promise<AnalysisResult> {
  if (!anthropicApiKey) {
    throw new Error("ANTHROPIC_API_KEY is not configured.");
  }

  const client = new Anthropic({ apiKey: anthropicApiKey });
  const base64 = pdfBuffer.toString("base64");

  const response = await client.messages.create({
    model: anthropicModel,
    max_tokens: ctx.orgType === "newcomer" ? 16000 : 8000,
    system: buildSystemPrompt(ctx.orgType),
    messages: [
      {
        role: "user",
        content: [
          {
            type: "document",
            source: { type: "base64", media_type: "application/pdf", data: base64 },
          } as Anthropic.DocumentBlockParam,
          { type: "text", text: buildUserMessage("", ctx) },
        ],
      },
    ],
  });

  const raw = response.content
    .filter((b): b is Anthropic.TextBlock => b.type === "text")
    .map((b) => b.text)
    .join("");

  const parsed = parseJson(raw);
  return {
    report: normalizeReport(parsed, ctx),
    pathway: ctx.orgType === "newcomer" ? normalizePathway(parsed) : null,
  };
}

/**
 * Re-analyse using an existing report JSON + caseworker notes (no resume file needed).
 * Used for the "Re-run with notes" feature.
 */
export async function analyzeFromExisting(
  existingReport: CandidateReport,
  ctx: ResumeContext,
): Promise<AnalysisResult> {
  if (!anthropicApiKey) {
    throw new Error("ANTHROPIC_API_KEY is not configured.");
  }

  const client = new Anthropic({ apiKey: anthropicApiKey });
  const response = await client.messages.create({
    model: anthropicModel,
    max_tokens: ctx.orgType === "newcomer" ? 16000 : 8000,
    system: buildSystemPrompt(ctx.orgType),
    messages: [{ role: "user", content: buildRevisionMessage(existingReport, ctx) }],
  });

  const raw = response.content
    .filter((b): b is Anthropic.TextBlock => b.type === "text")
    .map((b) => b.text)
    .join("");

  const parsed = parseJson(raw);
  return {
    report: normalizeReport(parsed, ctx),
    pathway: ctx.orgType === "newcomer" ? normalizePathway(parsed) : null,
  };
}

/** Extract a JSON object from the model output, tolerating stray fences/prose. */
function parseJson(raw: string): unknown {
  const trimmed = raw.trim();
  try {
    return JSON.parse(trimmed);
  } catch {
    // Fall back to the first {...} block.
    const start = trimmed.indexOf("{");
    const end = trimmed.lastIndexOf("}");
    if (start !== -1 && end > start) {
      return JSON.parse(trimmed.slice(start, end + 1));
    }
    throw new Error("Model did not return valid JSON.");
  }
}

const STRENGTHS: Strength[] = [
  "Foundational",
  "Competent",
  "Proficient",
  "Expert",
];

function coerceStrength(v: unknown): Strength {
  return STRENGTHS.includes(v as Strength) ? (v as Strength) : "Competent";
}

/** Validate / fill defaults so the UI never crashes on a malformed field. */
function normalizeReport(data: unknown, ctx: ResumeContext): CandidateReport {
  const d = (data ?? {}) as Record<string, unknown>;
  const contact = (d.contact ?? {}) as Record<string, unknown>;
  const skills = (d.skills ?? {}) as Record<string, unknown>;

  const mapSkill = (s: Record<string, unknown>) => ({
    name: String(s.name ?? "Skill"),
    strength: coerceStrength(s.strength),
    source: s.source ? String(s.source) : undefined,
    evidence: s.evidence ? String(s.evidence) : undefined,
  });

  const asArray = (v: unknown): Record<string, unknown>[] =>
    Array.isArray(v) ? (v as Record<string, unknown>[]) : [];

  return {
    contact: {
      name: String(contact.name ?? ctx.name ?? "Candidate"),
      location: contact.location ? String(contact.location) : undefined,
      email: contact.email ? String(contact.email) : undefined,
      phone: contact.phone ? String(contact.phone) : undefined,
      headline: contact.headline ? String(contact.headline) : undefined,
    },
    careerStage: ((): CandidateReport["careerStage"] => {
      const s = String(d.careerStage ?? "");
      return (["Early Career", "Developing", "Established", "Senior"].includes(s)
        ? s
        : "Developing") as CandidateReport["careerStage"];
    })(),
    headlineStats: asArray(d.headlineStats).map((h) => ({
      value: String(h.value ?? ""),
      label: String(h.label ?? ""),
      sublabel: String(h.sublabel ?? ""),
    })),
    skills: {
      hard: asArray(skills.hard).map(mapSkill),
      soft: asArray(skills.soft).map(mapSkill),
    },
    industries: asArray(d.industries).map((i) => ({
      name: String(i.name ?? ""),
      type: i.type === "Non-Traditional" ? "Non-Traditional" : "Traditional",
      whyItFits: String(i.whyItFits ?? ""),
      demandSignal: i.demandSignal ? String(i.demandSignal) : undefined,
      whatItOpens: i.whatItOpens ? String(i.whatItOpens) : undefined,
      comp: normalizeComp(i.comp),
    })),
    targetRoles: asArray(d.targetRoles).map((r) => ({
      title: String(r.title ?? ""),
      whySuited: String(r.whySuited ?? ""),
      careerStageFit: r.careerStageFit ? String(r.careerStageFit) : undefined,
      whereItExists: r.whereItExists ? String(r.whereItExists) : undefined,
      comp: normalizeComp(r.comp),
    })),
    keywords: asArray(d.keywords).map((k) => ({
      industry: String(k.industry ?? ""),
      terms: Array.isArray(k.terms) ? k.terms.map(String) : [],
    })),
    recruiterNotes: asArray(d.recruiterNotes).map((n) => ({
      tone: n.tone === "caution" ? "caution" : "positive",
      text: String(n.text ?? ""),
    })),
    estimatesNote: ESTIMATES_NOTE,
  };
}

function normalizeComp(v: unknown) {
  if (!v || typeof v !== "object") return undefined;
  const c = v as Record<string, unknown>;
  const low = Number(c.low);
  const high = Number(c.high);
  if (!Number.isFinite(low) || !Number.isFinite(high)) return undefined;
  const median = Number(c.median);
  return {
    low,
    high,
    median: Number.isFinite(median) ? median : undefined,
    region: c.region ? String(c.region) : undefined,
    note: c.note ? String(c.note) : undefined,
  };
}

function str(v: unknown, fallback = ""): string {
  return v != null ? String(v) : fallback;
}

function normalizePathway(data: unknown): NewcomerPathway | null {
  const d = (data ?? {}) as Record<string, unknown>;
  const p = d.newcomerPathway as Record<string, unknown> | undefined;
  if (!p || typeof p !== "object") return null;

  const asArray = (v: unknown): Record<string, unknown>[] =>
    Array.isArray(v) ? (v as Record<string, unknown>[]) : [];

  const rs = p.regulatoryStatus as Record<string, unknown> | undefined;
  const eca = p.eca as Record<string, unknown> | undefined;
  const lang = p.language as Record<string, unknown> | undefined;
  const bridgeRaw = p.bridging as Record<string, unknown> | undefined;
  const fpRaw = p.fullPath as Record<string, unknown> | undefined;

  const regulated = rs?.regulatedStatus;
  const regulatedStatus =
    regulated === "federal" || regulated === "unregulated"
      ? (regulated as "federal" | "unregulated")
      : "provincial";

  const bridgeRequired = bridgeRaw?.required;
  const bridgingRequired =
    bridgeRequired === "yes" || bridgeRequired === "unlikely"
      ? (bridgeRequired as "yes" | "unlikely")
      : "possibly";

  return {
    id: "",
    candidateId: "",
    regulatoryStatus: rs
      ? {
          profession: str(rs.profession),
          countryOfTraining: str(rs.countryOfTraining),
          regulatedStatus,
          targetProvinces: Array.isArray(rs.targetProvinces)
            ? rs.targetProvinces.map(String)
            : [],
        }
      : null,
    eca: eca
      ? {
          organization: str(eca.organization),
          url: str(eca.url),
          reason: str(eca.reason),
          estimatedCostCAD: str(eca.estimatedCostCAD),
          processingTime: str(eca.processingTime),
          documentsRequired: Array.isArray(eca.documentsRequired)
            ? eca.documentsRequired.map(String)
            : [],
        }
      : null,
    licensing: asArray(p.licensing).map(
      (l): PathwayProvinceLicensing => ({
        province: str(l.province),
        regulatoryBody: str(l.regulatoryBody),
        website: str(l.website),
        registrationRequirements: Array.isArray(l.registrationRequirements)
          ? l.registrationRequirements.map(String)
          : [],
        examName: str(l.examName),
        examFormat: str(l.examFormat),
        examFee: str(l.examFee),
        passRateIEP: str(l.passRateIEP),
        applicationFee: str(l.applicationFee),
        annualRenewal: str(l.annualRenewal),
      }),
    ),
    language: lang
      ? {
          recommendedTest: str(lang.recommendedTest),
          minimumScores: str(lang.minimumScores),
          feeCAD: str(lang.feeCAD),
          bookingUrl: str(lang.bookingUrl),
          validity: str(lang.validity),
          exemptionNote: str(lang.exemptionNote),
        }
      : null,
    bridging: bridgeRaw
      ? {
          required: bridgingRequired,
          reason: str(bridgeRaw.reason),
          programs: asArray(bridgeRaw.programs).map(
            (prog): PathwayBridgingProgram => ({
              name: str(prog.name),
              institution: str(prog.institution),
              province: str(prog.province),
              delivery: str(prog.delivery),
              duration: str(prog.duration),
              costCAD: str(prog.costCAD),
              gapAddressed: str(prog.gapAddressed),
              eligibility: str(prog.eligibility),
              url: str(prog.url),
            }),
          ),
          governmentFundingNote: str(bridgeRaw.governmentFundingNote),
        }
      : null,
    fullPath: fpRaw
      ? {
          startingPoint: str(fpRaw.startingPoint),
          targetRole: str(fpRaw.targetRole),
          totalTimeline: str(fpRaw.totalTimeline),
          totalCostCAD: str(fpRaw.totalCostCAD),
          steps: asArray(fpRaw.steps).map(
            (s): PathwayStep => ({
              action: str(s.action),
              timeline: str(s.timeline),
              costCAD: str(s.costCAD),
              explanation: str(s.explanation),
            }),
          ),
        }
      : null,
    superiorRoles: asArray(p.superiorRoles).map(
      (sr): PathwaySuperiorRole => ({
        title: str(sr.title),
        eligibilityPath: Array.isArray(sr.eligibilityPath)
          ? sr.eligibilityPath.map(String)
          : [],
        timelineFromRegistration: str(sr.timelineFromRegistration),
        equivalentRoleComp: str(sr.equivalentRoleComp),
        superiorRoleComp: str(sr.superiorRoleComp),
      }),
    ),
    aiGeneratedAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    updatedByName: null,
    sectionNotes: {},
  };
}
