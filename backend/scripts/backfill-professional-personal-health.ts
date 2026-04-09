/**
 * Creates dedicated personal-health tenant + membership for existing professionals
 * (doctor, cabinet_owner, pharmacist, pharmacy_owner) who have no personal_health_tenants row.
 *
 * Uses the same DB resolution as the rest of the backend: `shared/config/env.ts` runs
 * `loadEnvironment()`, which merges repo-root `.env.test` (see `resolveEnvTestPath`) then
 * `.env.development` — so `TEST_DATABASE_URL` from `.env.test` is picked up like tests do.
 *
 * Override for one run: `TEST_DATABASE_URL=postgresql://… deno task backfill-professional-personal-health`
 */
import { backfillProfessionalsMissingPersonalHealth } from "../modules/auth/services/personalHealthWorkspaceService.ts";

const n = await backfillProfessionalsMissingPersonalHealth();
console.log(`Backfill complete: ${n} user(s) provisioned with personal-health workspace.`);
