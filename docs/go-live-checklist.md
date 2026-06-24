# Skillosophy — Pre-Pilot Go-Live Checklist

Testing runs on US infrastructure with **synthetic / test data only**. Before any
real student or newcomer data is collected, complete every item below. Each is a
config/provisioning step, not a code change — the app is built residency-ready.

## Data residency (hard requirement)
- [ ] **Supabase project is in a Canadian region** (Canada Central). If the
      current project isn't, create a fresh project in Canada and re-point
      `.env.local`, run `supabase/schema.sql`, and re-seed the platform admin.
- [ ] **Claude runs in Canada via AWS Bedrock `ca-central-1`** — switch
      `lib/anthropic.ts` from the direct Anthropic API to the `AnthropicBedrock`
      client; set the model ID with the `anthropic.` prefix. Confirm the chosen
      model is available in `ca-central-1` before launch.
- [ ] Confirm Anthropic/Bedrock **data is not used for model training** and a
      data-processing agreement is in place.

## Privacy
- [ ] **Resume files are deleted immediately after analysis** (already
      implemented in `lib/pipeline.ts`) — verify on a real upload that the file
      is gone from the `resumes` bucket and only the report JSON remains.
- [ ] Consent text shown at upload (per pilot privacy section); withdraw path
      documented with the partner institution.
- [ ] Only de-identified derived data is retained for analytics.

## Security
- [ ] **Row-level security** policies enabled on `organizations`, `profiles`,
      `team_invites`, `invites`, `candidates`, keyed to the caller's org — so a
      query cannot return another org's rows even on an app bug.
- [ ] Rotate any keys that were shared during development.
- [ ] Email confirmation flow decided (on/off) with the partner.

## Accessibility (Campus pilot)
- [ ] WCAG 2.1 AA pass on the advisor dashboard (keyboard nav, contrast,
      resizable text, screen-reader labels).

## Tenancy
- [ ] Seed the **platform admin** in the production (Canadian) project.
- [ ] Create the pilot organization(s) with the correct **type** (campus /
      newcomer) and **seat limit** from the signed contract.
