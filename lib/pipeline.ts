import { analyzeResume } from "./anthropic";
import { RESUME_BUCKET, isAnthropicConfigured } from "./config";
import { extractResumeText, hasUsableText } from "./extract";
import { createSupabaseAdminClient } from "./supabase/server";
import { MOCK_REPORTS } from "./mock";
import type { CandidateReport } from "./types";

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
      .select("id, name, file_path, file_name")
      .eq("id", candidateId)
      .single();
    if (error || !row) throw new Error(error?.message ?? "Candidate not found.");

    await supabase
      .from("candidates")
      .update({ status: "processing", error: null })
      .eq("id", candidateId);

    const report = await produceReport(
      supabase,
      row.file_path as string,
      row.file_name as string,
      (row.name as string) ?? undefined,
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
): Promise<CandidateReport> {
  // If Anthropic isn't configured, fall back to a seeded sample so the live
  // flow still completes end-to-end before a key is added.
  if (!isAnthropicConfigured) {
    return { ...MOCK_REPORTS["jason-hall"], contact: { ...MOCK_REPORTS["jason-hall"].contact, name: name ?? "Sample Candidate" } };
  }

  const { data: file, error } = await supabase.storage
    .from(RESUME_BUCKET)
    .download(filePath);
  if (error || !file) {
    throw new Error(error?.message ?? "Could not download resume file.");
  }

  const buffer = Buffer.from(await file.arrayBuffer());
  const text = await extractResumeText(buffer, fileName);
  if (!hasUsableText(text)) {
    throw new Error(
      "Couldn't read enough text from this file. If it's a scanned PDF, please upload a text-based PDF or Word document.",
    );
  }

  return analyzeResume(text, { name });
}
