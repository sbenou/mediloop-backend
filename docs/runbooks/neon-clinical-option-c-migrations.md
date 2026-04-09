# Runbook: Neon — clinical & Option C migrations (018 → 023)

Target: **Postgres on Neon** (or any backend Postgres), **not** Supabase-hosted DB for this app path.

## Ordered sequence (apply once per environment, after earlier app migrations 012–017 as needed)

Run in this **exact** order:

| Step | File | Purpose |
|------|------|--------|
| 1 | `backend/migrations/migration_018_prescriptions_teleconsultations.sql` | Clinical tables + enums (`prescription_status`, `teleconsultation_status`, `connection_status`) |
| 2 | `backend/migrations/migration_019_option_c_phase1_schema.sql` | Option C Phase 1: tenants, invitations, audit, personal-health mapping, `user_tenants` extensions |
| 3 | `backend/migrations/migration_020_option_c_phase3_clinical_attribution.sql` | `professional_tenant_id`, `created_by_membership_id` on prescriptions, teleconsultations, doctor–patient connections |
| 4 | `backend/migrations/migration_021_teleconsultation_status_confirmed.sql` | Ensures enum label `confirmed` exists (legacy DBs) |
| 5 | `backend/migrations/migration_022_platform_stats_marketplace.sql` | `public.pharmacies.endorsed`, optional `public.orders` + `public.pharmacies` if missing (for `GET /api/clinical/platform-stats`) |
| 6 | `backend/migrations/migration_023_option_c_phase4_attribution_status.sql` | `clinical_attribution_status` enum + `attribution_status` on prescriptions, teleconsultations, doctor–patient connections (Phase 4; see [`architecture-option-c-phase4-design.md`](../architecture-option-c-phase4-design.md)) |

## Prerequisites

- **Auth schema**: this project uses `auth.users` (Neon-compatible with your auth setup).
- **Earlier migrations**: if the database was created from `scripts/db/schema.sql` or a full migration chain, ensure base tables referenced by 018–019 exist. Greenfield: apply numbered migrations from the repo in order up through **017** before **018**, unless your baseline already includes those objects.

## How to apply

### Option A — Neon SQL Editor

Paste and run each file’s contents in order (or combine with caution; prefer one file per transaction as written).

### Option B — `psql`

From repo root (quote the URL on Windows if it contains `&`):

```bash
psql "$TEST_DATABASE_URL" -v ON_ERROR_STOP=1 -f backend/migrations/migration_018_prescriptions_teleconsultations.sql
# … repeat for 019–022 as needed
```

### Option C — Deno helper (requires `psql` on `PATH`)

```bash
cd backend
TEST_DATABASE_URL='postgresql://…' deno task apply-clinical-option-c-migrations
```

### Optional — demo seed (stats + UI smoke test)

After **022**, you can load sample clinical rows, pharmacies, and orders (only when the guarded tables are empty — see script header):

```bash
cd backend
DATABASE_URL='postgresql://…' deno task seed-clinical-demo
```

Or paste `backend/seeds/seed_clinical_platform_demo.sql` in the Neon SQL Editor.

### Idempotency

- **020** and **021** use `IF NOT EXISTS` / conditional blocks where appropriate; safe to re-run in many cases.
- **018** / **019** assume standard `IF NOT EXISTS` / additive patterns — re-running on a fully migrated DB may error on duplicate types/tables. Prefer applying to a fresh branch or verify state first.

## Tests

After 020–023 on a disposable DB (018–023 via `deno task apply-clinical-option-c-migrations`):

```bash
cd backend
RUN_PHASE3_CLINICAL_TESTS=1 TEST_DATABASE_URL='…' deno task test-backend-phase3
```

## CI

GitHub Actions workflow `.github/workflows/backend-ci.yml` runs `test-backend` on every qualifying push/PR. If repository secret **`TEST_DATABASE_URL`** is set, it also applies **018–022** via `deno task apply-clinical-option-c-migrations` and runs `deno task test-backend-phase3`. Use a **CI-only Neon branch**; do not point CI at production.

### Where to add `TEST_DATABASE_URL` in GitHub

1. Open your repository on GitHub.  
2. Go to **Settings** (repo settings, not your user settings).  
3. In the left sidebar: **Secrets and variables** → **Actions**.  
4. Click **New repository secret**.  
5. Name: `TEST_DATABASE_URL` (exactly — the workflow reads this name).  
6. Value: your Neon connection string for a **non-production** database (recommended: a dedicated Neon branch used only for CI).  
7. Save. Forked PRs from outside contributors do not receive secrets; the Phase 3 job will be skipped for those runs unless you use another mechanism.

## Notifications (012 + 027)

For **scoped, compliant** inbox storage (`scope_type`, `scope_tenant_id`, delivery log, preferences):

| Step | File | Notes |
|------|------|--------|
| A | `backend/migrations/migration_012_notifications.sql` | Base `public.notifications` (`user_id` → `auth.users`). |
| B | `backend/migrations/migration_019_option_c_phase1_schema.sql` | **Recommended before 027** so `public.tenants` and `public.user_tenants` exist for FKs. |
| C | `backend/migrations/migration_027_notifications_option_c_scope.sql` | Extends inbox + creates `notification_deliveries`, `notification_preferences`. |
| D | `backend/migrations/migration_028_personal_health_tenant_link_patients.sql` | Tags existing **patients’** primary tenants as `personal_health` and inserts missing `personal_health_tenants` rows. |

**Professionals (doctors / pharmacists / owners)** already registered without a personal-health workspace: after **028** (or anytime), run:

```bash
cd backend
TEST_DATABASE_URL='postgresql://…' deno task backfill-professional-personal-health
```

Use the **same connection string** as migrations / `notificationsScoped` tests (the database that has **`auth.users`**). The backend **`loadEnvironment()`** (in `shared/config/envLoader.ts`) merges **repo-root `.env.test`** before `.env.development`, filling unset keys such as **`TEST_DATABASE_URL`** — same idea as `tests/utils/testDb.ts`. For a one-off override, set **`TEST_DATABASE_URL`** in the shell for that command.

New registrations provision PH automatically (see `personalHealthWorkspaceService.ts`).

Details and event catalog: [`docs/architecture-notifications.md`](../architecture-notifications.md).

## Related docs

- [`docs/architecture-option-c-decisions.md`](../architecture-option-c-decisions.md) — decisions and phase list
- [`docs/architecture-notifications.md`](../architecture-notifications.md) — notification schema, scopes, compliance notes
- [`docs/architecture-option-c-phase4-design.md`](../architecture-option-c-phase4-design.md) — legacy rows & patient read design (Phase 4)
- [`docs/architecture-option-c-phase4-implementation-checklist.md`](../architecture-option-c-phase4-implementation-checklist.md) — routes, serializers, backfill tasks after **023**

</think>


<｜tool▁calls▁begin｜><｜tool▁call▁begin｜>
StrReplace