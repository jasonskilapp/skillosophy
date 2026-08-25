import { analyzeResume, analyzeResumeFromPdf, type AnalysisResult } from "./anthropic";
import { RESUME_BUCKET, isAnthropicConfigured } from "./config";
import { extractResumeText, hasUsableText } from "./extract";
import { createSupabaseAdminClient } from "./supabase/server";
import { MOCK_REPORTS } from "./mock";
import type { OrgType } from "./types";

/**
 * Run analysis for a candidate row (live mode): download the resume from
 * storage, extract text, call Claude, and persist the structured report.
 *
 * Designed to be fire-and-forget from the upload action — it updates the row's
 * status as it goes, so the seeker's page can poll for completion.
 */
export async function runAnalysis(candidateId: string): Promise<void> {
  const supabase = createSupabaseAdminClient();

  try {
    const { data: row, error } = await supabase
      .from("candidates")
      .select("id, name, file_path, file_name, organization_id")
      .eq("id", candidateId)
      .single();
    if (error || !row) throw new Error(error?.message ?? "Candidate not found.");

    // Fetch the org type so we can conditionally include the newcomer pathway.
    let orgType: OrgType | null = null;
    if (row.organization_id) {
      const { data: org } = await supabase
        .from("organizations")
        .select("type")
        .eq("id", row.organization_id)
        .maybeSingle();
      orgType = (org?.type as OrgType) ?? null;
    }

    await supabase
      .from("candidates")
      .update({ status: "processing", error: null })
      .eq("id", candidateId);

    const { report, pathway } = await produceReport(
      supabase,
      row.file_path as string,
      row.file_name as string,
      (row.name as string) ?? undefined,
      orgType,
    );

    await supabase
      .from("candidates")
      .update({
        status: "done",
        report,
        name: report.contact.name,
        headline: report.contact.headline ?? null,
        model_used: process.env.ANTHROPIC_MODEL ?? "claude-sonnet-4-6",
        analyzed_at: new Date().toISOString(),
      })
      .eq("id", candidateId);

    // Persist newcomer pathway when the AI produced one.
    if (pathway) {
      await supabase.from("candidate_pathway").upsert(
        {
          candidate_id: candidateId,
          regulatory_status: pathway.regulatoryStatus,
          eca: pathway.eca,
          licensing: pathway.licensing,
          language_proficiency: pathway.language,
          bridging: pathway.bridging,
          full_path: pathway.fullPath,
          superior_roles: pathway.superiorRoles,
          licensing_scenarios: pathway.licensingScenarios ?? null,
          ai_generated_at: pathway.aiGeneratedAt,
          updated_at: new Date().toISOString(),
        },
        { onConflict: "candidate_id" },
      );
    }

    // Privacy requirement: delete the uploaded resume file immediately after
    // analysis. Only the de-identified structured report is retained.
    if (row.file_path) {
      await supabase.storage
        .from(RESUME_BUCKET)
        .remove([row.file_path as string]);
      await supabase
        .from("candidates")
        .update({ file_path: null })
        .eq("id", candidateId);
    }
  } catch (err) {
    const message = err instanceof Error ? err.message : "Analysis failed.";
    await supabase
      .from("candidates")
      .update({ status: "failed", error: message })
      .eq("id", candidateId);
  }
}

async function produceReport(
  supabase: ReturnType<typeof createSupabaseAdminClient>,
  filePath: string,
  fileName: string,
  name?: string,
  orgType?: OrgType | null,
): Promise<AnalysisResult> {
  // If Anthropic isn't configured, fall back to a seeded sample.
  if (!isAnthropicConfigured) {
    return {
      report: { ...MOCK_REPORTS["jason-hall"], contact: { ...MOCK_REPORTS["jason-hall"].contact, name: name ?? "Sample Candidate" } },
      pathway: null,
    };
  }

  const { data: file, error } = await supabase.storage
    .from(RESUME_BUCKET)
    .download(filePath);
  if (error || !file) {
    throw new Error(error?.message ?? "Could not download resume file.");
  }

  const buffer = Buffer.from(await file.arrayBuffer());
  const text = await extractResumeText(buffer, fileName);
  const ctx = { name, orgType };

  if (!hasUsableText(text)) {
    // Scanned / image-based PDF — send the raw file to Claude's vision instead.
    const lower = fileName.toLowerCase();
    if (lower.endsWith(".pdf")) {
      return analyzeResumeFromPdf(buffer, ctx);
    }
    throw new Error(
      "Couldn't read enough text from this file. Please upload a text-based PDF or Word document.",
    );
  }

  return analyzeResume(text, ctx);
}
