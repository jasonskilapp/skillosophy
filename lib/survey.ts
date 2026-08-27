import type { OrgType } from "./types";

/**
 * Campus/Newcomer question sets for the measurement-plan surveys. Mirrors how
 * `orgLabels()` in lib/auth.ts centralizes Campus vs Newcomer wording.
 */

export interface SurveyQuestion {
  key: string;
  label: string;
  kind: "rating5" | "yesno" | "text";
}

/** Shown to an advisor at each 10th completed appointment. */
export function usefulnessSurveyQuestions(
  orgType: OrgType | null | undefined,
): SurveyQuestion[] {
  const base: SurveyQuestion[] = [
    { key: "usefulness", label: "Overall, how useful was Skillosophy for this appointment?", kind: "rating5" },
  ];

  if (orgType === "newcomer") {
    base.push(
      { key: "pathway_accuracy", label: "How accurate was the credential recognition pathway?", kind: "rating5" },
      { key: "bridge_role_relevance", label: "How relevant were the suggested bridge roles?", kind: "rating5" },
    );
  } else {
    base.push(
      { key: "industries_accuracy", label: "How accurate were the recommended industries?", kind: "rating5" },
      { key: "roles_accuracy", label: "How accurate were the recommended roles?", kind: "rating5" },
      { key: "interview_prep_helpfulness", label: "How helpful was the profile for interview prep?", kind: "rating5" },
    );
  }

  base.push({ key: "would_continue", label: "Would you continue using Skillosophy?", kind: "yesno" });
  return base;
}

/**
 * The candidate/client 4-week self-report. Per docs/measurement-plan.md this
 * question set has no Campus/Newcomer split — the orgType param is kept for
 * signature symmetry with usefulnessSurveyQuestions, not because a branch is
 * specified.
 */
export function selfReportQuestions(
  _orgType?: OrgType | null,
): SurveyQuestion[] {
  return [
    { key: "applied", label: "Have you applied to any roles since your appointment?", kind: "yesno" },
    { key: "interviews", label: "Have you had any interviews?", kind: "yesno" },
    { key: "aligned", label: "Did the roles you pursued align with what was discussed?", kind: "yesno" },
    { key: "next_steps_clarity", label: "How clear were your next steps after the appointment?", kind: "rating5" },
  ];
}
