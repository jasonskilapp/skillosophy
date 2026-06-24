# Skillosophy — Organizations (Multi-Tenant) Plan

Status: **planning / not yet built.** This document records the agreed design for
adding an organization layer to Skillosophy before any code is written.

## Why

Today Skillosophy is single-tenant: one implicit organization (the whole system),
one global admin who adds recruiters, recruiters who invite job seekers. We want
many isolated **organizations** (tenants), each with its own admins, recruiters,
and candidate data.

The dominant design concern is **tenant isolation** — Org A must never see Org
B's candidates (resumes are PII). Every decision below serves that.

## Decisions (locked)

| Decision | Choice |
|----------|--------|
| Multiple orgs per person? | **No** — one org per account (simplest). Upgrade path noted below. |
| How orgs are created | **Manually by the platform admin**, after a contract is signed offline. No public/self-serve org signup. |
| Org admin visibility | **Sees all candidates in their org.** Recruiters see their own. |
| Platform-level super-admin | **Yes** — Skillosophy-level admin sits above all orgs (support, oversight, billing later). |
| Seat limits | **Enforced.** Each org has a `seat_limit` from its contract; team invites are blocked at the cap. |

## Roles

| Role | Scope | Capabilities |
|------|-------|--------------|
| **Platform admin** (Skillosophy) | All orgs | Create organizations, set seat limits, oversight/support, (later) billing |
| **Org admin** | One org | Invite/remove team members (within seat cap), see all org candidates, manage org settings |
| **Recruiter** | One org | Invite candidates, review their own candidates |
| **Seeker** | External (no org) | Upload a resume when invited; sees only their own upload |

A seeker is **not** a member of any org. Their *candidate record* is owned by the
org of the recruiter who invited them.

## Data model

### New: `organizations`
- `id`
- `name`
- `slug` (unique)
- `seat_limit` (int, from contract)
- `status` (active / suspended)
- `created_by` (platform admin)
- `created_at`
- *(room for `plan`, `contract_start`, billing fields later)*

### Extended: `profiles`
Each account is exactly one type:

| `type` | `organization_id` | `org_role` |
|--------|-------------------|------------|
| `platform_admin` | — | — |
| `org_member` | set | `org_admin` or `recruiter` |
| `seeker` | — | — |

> "One org per person" is enforced naturally: Supabase emails are globally
> unique, so one account = one org. If multi-org is ever needed, replace the
> `organization_id`/`org_role` columns with a `memberships(user, org, role)`
> join table. Calling this out now so the migration path is known.

### New: `team_invites`
- `id`, `organization_id`, `token` (unique), `email`, `role` (org_admin/recruiter)
- `invited_by`, `status` (pending/accepted/expired), `expires_at`, `created_at`

### Existing: `invites` and `candidates`
- Both gain **`organization_id`** (NOT NULL after migration).
- Every read/write filters on it.

## Flows

### 1. Create an organization (platform admin, contract-gated)
1. Contract signed offline.
2. Platform admin creates the org: name, slug, seat limit, and the **first org
   admin's** name + email.
3. The system issues that admin a "set your password & join" link (the
   team-invite acceptance flow).
4. The org admin sets a password and lands in their org dashboard.

### 2. Team invite (org admin grows the team)
1. Org admin → "Invite teammate" (email + role).
2. **Seat check:** if `active members + pending invites ≥ seat_limit`, block with
   "all N seats used — contact Skillosophy to add more."
3. Otherwise create a `team_invite` + shareable link.
4. Recipient opens link → sets password → joins the org with the chosen role.

### 3. Candidate invite (unchanged, now org-stamped)
Recruiter invites a job seeker exactly as today; the resulting `invite` and
`candidate` rows carry the recruiter's `organization_id`.

## Visibility & security rules
- **Every** candidate/invite query filters by `organization_id` first — the
  primary guard against cross-tenant leakage.
- Inside an org: **org admin → all candidates**; **recruiter → own only**.
- Seekers see only their own upload page.
- **Seat accounting:** seats = count of `org_member` profiles in the org
  (admins + recruiters). Seekers don't count. Pending team invites count toward
  the cap so invites can't over-issue.
- **Hardening:** enable Postgres row-level security with policies keyed to the
  caller's `organization_id`, so a query *cannot* return another org's rows even
  if app code has a bug. Recommended given resume PII.

## Impact on existing code (for the build phase)
- [lib/auth.ts](../lib/auth.ts): session resolves *type + organization + org role*, not a flat role; redirects per type.
- [lib/data.ts](../lib/data.ts): every function takes the caller's org and filters by `organization_id`; add visibility tier (admin = all, recruiter = own).
- [app/actions.ts](../app/actions.ts): new org-creation (platform) + team-invite flows; candidate invites stamp the org; seat check on team invites.
- Screens: the current admin page splits into a **platform console** (manage orgs + seats) and an **org admin dashboard** (team + all org candidates). Recruiter views stay, now org-scoped.

## Migration (existing data is small)
1. Create one **default organization**.
2. Set the existing seeded admin to `platform_admin`.
3. Attach existing recruiter(s) to the default org as `org_member`/`recruiter`.
4. Backfill `organization_id` on existing `invites` and `candidates`.

## Open / deferred
- **Member removal:** removing/disabling a recruiter keeps their candidates with
  the org (the org owns the data); access is revoked; a seat frees up. (Proposed
  default — confirm at build time.)
- **Billing / plans / per-org branding:** schema leaves room; build later.

## Suggested build order
1. Schema (`organizations`, `team_invites`, extend `profiles`, add
   `organization_id` everywhere) + migrate existing data.
2. Auth/session rework + role-based routing.
3. Platform console: create org + first admin + set seat limit.
4. Team invites + acceptance flow + seat enforcement.
5. Org-scope every existing query + visibility tiers.
6. Row-level security hardening.
