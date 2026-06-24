# Skillosophy

Job seekers upload their resume ahead of a meeting; recruiters get an instant,
structured candidate profile (skills with proven strength, industry fit, target
roles, job-search keywords, and recruiter notes) generated from the resume by
Claude.

Built with **Next.js 16** (App Router) + **Supabase** (auth, Postgres, storage)
+ the **Anthropic API**.

## The flow

1. **Admin** adds recruiter accounts.
2. **Recruiter** creates an invite link (with the meeting date) and sends it to a
   candidate.
3. **Job seeker** opens the link, creates an account, and uploads a resume
   (PDF or .docx).
4. Claude analyzes the resume into a structured report (the adapted v7 "Canadian
   Resume Analysis" prompt → JSON).
5. **Recruiter** sees a dashboard of candidate tiles (name + upload date +
   meeting date), grouped by day, and clicks through to the full profile.

## Run it now (demo mode)

No keys required — the app serves seed data so every screen is viewable.

```bash
npm install
npm run dev
```

Open http://localhost:3000 and pick a role on the login screen. The recruiter
view includes the sample **Jason Hall** profile.

## Go live (real accounts + analysis)

1. **Create a Supabase project** at https://supabase.com.
2. **Run the schema:** open the SQL Editor and paste
   [`supabase/schema.sql`](supabase/schema.sql). This creates the tables, the
   `resumes` storage bucket, and RLS.
3. **Disable email confirmation** (optional, smoother for a prototype):
   Authentication → Providers → Email → turn off "Confirm email". Otherwise
   seekers must confirm before signing in.
4. **Configure env:** copy `.env.local.example` to `.env.local` and fill in:
   - `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`,
     `SUPABASE_SERVICE_ROLE_KEY` (Project Settings → API)
   - `ANTHROPIC_API_KEY` (https://console.anthropic.com)
5. **Seed the first admin:**
   ```bash
   node --env-file=.env.local scripts/seed-admin.mjs
   ```
   (set `ADMIN_EMAIL` / `ADMIN_PASSWORD` in `.env.local` first)
6. **Restart** `npm run dev`. The login screen now uses real email/password.
   Sign in as the admin → add a recruiter → sign in as that recruiter → create
   an invite → open the link in a private window to act as the job seeker.

> If `ANTHROPIC_API_KEY` is missing while Supabase **is** configured, uploads
> still complete end-to-end using a sample report, so you can test the flow
> before adding the AI key.

## Notes

- **Compensation figures are model estimates** from Claude's market knowledge
  (not live Job Bank data), and are labeled as such in the UI.
- The analysis model defaults to `claude-sonnet-4-6`; override with
  `ANTHROPIC_MODEL`.
- Resumes are private: stored in a non-public bucket and shared only with the
  inviting recruiter.

## Project map

| Path | What |
|------|------|
| `lib/prompt.ts` | The v7 analysis prompt, adapted to emit structured JSON |
| `lib/anthropic.ts` | Calls Claude and validates the report |
| `lib/extract.ts` | PDF/.docx → text |
| `lib/pipeline.ts` | Upload → extract → analyze → save |
| `lib/types.ts` | The `CandidateReport` contract (prompt ↔ UI) |
| `lib/data.ts` | Data access (mock + Supabase) |
| `components/CandidateProfile.tsx` | The recruiter-facing profile dashboard |
| `app/recruiter/` | Dashboard + candidate detail |
| `app/seeker/upload/` | Resume upload + analysis status |
| `app/admin/` | Recruiter management |
| `app/invite/[token]/` | Invite landing + signup |
