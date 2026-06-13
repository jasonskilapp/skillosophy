import Anthropic from "@anthropic-ai/sdk";
import { anthropicApiKey, anthropicModel } from "./config";
import {
  ANALYSIS_SYSTEM_PROMPT,
  buildUserMessage,
  type ResumeContext,
} from "./prompt";
import type { CandidateReport, Strength } from "./types";

const ESTIMATES_NOTE =
  "Compensation figures are model estimates based on Canadian market knowledge, not live Job Bank data.";

/**
 * Run the resume analysis through Claude and return a validated CandidateReport.
 * Throws if the API key is missing or the model output can't be parsed.
 */
export async function analyzeResume(
  resumeText: string,
  ctx: ResumeContext,
): Promise<CandidateReport> {
  if (!anthropicApiKey) {
    throw new Error("ANTHROPIC_API_KEY is not configured.");
  }

  const client = new Anthropic({ apiKey: anthropicApiKey });
  const response = await client.messages.create({
    model: anthropicModel,
    max_tokens: 8000,
    system: ANALYSIS_SYSTEM_PROMPT,
    messages: [{ role: "user", content: buildUserMessage(resumeText, ctx) }],
  });

  const raw = response.content
    .filter((b): b is Anthropic.TextBlock => b.type === "text")
    .map((b) => b.text)
    .join("");

  const parsed = parseJson(raw);
  return normalizeReport(parsed, ctx);
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
