/**
 * Applies Option C clinical-related SQL migrations in order for Postgres (e.g. Neon).
 * Uses `psql` (install PostgreSQL client, or run the same files in Neon SQL Editor).
 *
 *   TEST_DATABASE_URL=... deno task apply-clinical-option-c-migrations
 */
import { dirname, fromFileUrl, join } from "https://deno.land/std@0.224.0/path/mod.ts";

const MIGRATIONS = [
  "migration_018_prescriptions_teleconsultations.sql",
  "migration_019_option_c_phase1_schema.sql",
  "migration_020_option_c_phase3_clinical_attribution.sql",
  "migration_021_teleconsultation_status_confirmed.sql",
  "migration_022_platform_stats_marketplace.sql",
  "migration_023_option_c_phase4_attribution_status.sql",
  "migration_024_bank_holidays.sql",
] as const;

const scriptDir = dirname(fromFileUrl(import.meta.url));
const migrationsDir = join(scriptDir, "..", "migrations");

const conn =
  Deno.env.get("TEST_DATABASE_URL") ?? Deno.env.get("DATABASE_URL") ?? "";

if (!conn) {
  console.error("Set TEST_DATABASE_URL or DATABASE_URL.");
  Deno.exit(1);
}

async function runPsql(filePath: string): Promise<void> {
  const status = await new Deno.Command("psql", {
    args: ["--dbname=" + conn, "-v", "ON_ERROR_STOP=1", "-f", filePath],
    stdout: "inherit",
    stderr: "inherit",
  }).output();

  if (!status.success) {
    console.error(`psql failed for ${filePath} (exit ${status.code})`);
    Deno.exit(status.code ?? 1);
  }
}

for (const name of MIGRATIONS) {
  const path = join(migrationsDir, name);
  console.log(`Applying ${name}...`);
  await runPsql(path);
}
console.log("Applied clinical Option C migrations 018 → 024.");
