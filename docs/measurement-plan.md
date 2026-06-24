# Skillosophy — Measurement & Reporting Plan (planning only, not built)

Captures the platform-admin org drill-down, follow-up tracking, and the
every-10-appointments usefulness survey. Aligns with the pilot success metrics
in both proposals (Campus & Newcomer). **Tenant isolation holds throughout: the
platform admin sees counts/metrics only — never candidate names, resumes, or
reports.**

## Decisions (locked)
- **Appointment completion** = an explicit advisor action ("mark appointment
  complete"), optionally with a 10-second per-session rating. This is the count
  that drives metrics and the survey trigger (an upload alone does not count).
- **Follow-ups: link-based now, email later.** Generate a follow-up link;
  "sent" when issued, "replied" when the person submits. Same data model when we
  automate via email at pilot time — only delivery changes.
- **Track both follow-ups:** the post-appointment next-steps summary AND the
  4-week self-report.
- **Usefulness survey: per advisor, dismissible**, shown at each member's
  10th / 20th / 30th… completed appointment.

## Data model additions
- **candidates** (extend): `appointment_status` (scheduled → completed / no_show /
  cancelled), `appointment_completed_at`, optional per-session feedback
  (`useful_rating` 1–5, `time_saved_min`, `note`).
- **followups** (new): `id`, `candidate_id`, `organization_id`, `member_id`,
  `type` ('next_steps' | 'self_report'), `status` (pending → sent → responded),
  `token` (for the public response link), `sent_at`, `responded_at`,
  `response` (jsonb), `created_at`.
- **survey_responses** (new): `id`, `organization_id`, `member_id`,
  `milestone` (10, 20, …), `usefulness_score`, `answers` (jsonb), `created_at`.
- Survey trigger is derived: member's completed-appointment count crosses a
  multiple of 10 and no `survey_responses` row exists for that milestone → show a
  dismissible in-app banner until submitted.

## Flows
1. **Complete appointment** — on the candidate detail page, advisor clicks
   "Mark appointment complete" (+ optional quick rating). Sets status +
   `completed_at`; increments the member's completed count.
2. **Issue follow-ups** — after completion, advisor generates the next-steps
   summary link and the 4-week self-report link (status → sent). Advisor delivers
   the links (manually now; by email later).
3. **Candidate responds** — opens `/followup/[token]` (public, no login, like
   invite links): views the next-steps summary, completes the 4-week self-report
   → status → responded, answers stored.
4. **Usefulness survey** — member sees a dismissible banner at each 10-appointment
   milestone; submitting stores a `survey_responses` row.

## Platform-admin drill-down (`/platform/org/[id]`)
Per-member table + org rollups, **metrics only**:
| Advisor | Resumes uploaded | Appointments completed | Follow-ups sent | Follow-ups replied | Avg usefulness |

All derived by aggregation (count by `member_id`); no candidate content exposed.

## Within-org visibility
- **Org admin** sees the same per-member metrics for *their* org (on the team/
  reports page).
- **Member** sees their own metrics + their pending survey.

## Survey / self-report question sets
Use the pilot check-in questions verbatim so reporting is turnkey:
- **Usefulness survey** (advisor): usefulness 1–5, recommended-industries
  accuracy, recommended-roles accuracy, interview-prep helpfulness (Campus) /
  pathway accuracy + bridge-role relevance (Newcomer), would-continue.
- **4-week self-report** (student/client): applied? interviews? aligned with what
  was discussed? next-steps clarity 1–5.
- Org `type` selects the Campus vs Newcomer wording.

## Open micro-decisions (proposed defaults)
- **Next-steps summary content**: depends on the not-yet-built Campus *advisor
  curation* feature. Default for now: the advisor writes a short summary/notes
  field when issuing the follow-up; later it's prefilled from the curated
  dashboard.
- **Survey questions**: adopt the pilot lists above as the default set.

## Dependencies / sequencing
- Independent of the Bedrock/residency move.
- The next-steps-summary *content* is nicer once the advisor-curation feature
  exists, but the follow-up tracking itself doesn't block on it.
- Email automation is a pre-pilot item; the link-based version works on US infra now.
