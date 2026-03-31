/**
 * Applies `seeds/seed_clinical_platform_demo.sql` via `psql`.
 *
 *   DATABASE_URL=postgresql://... deno task seed-clinical-demo
 *   TEST_DATABASE_URL=... deno task seed-clinical-demo
 */
import { dirname, fromFileUrl, join } from "https://deno.land/std@0.224.0/path/mod.ts";

const scriptDir = dirname(fromFileUrl(import.meta.url));
const seedFile = join(scriptDir, "..", "seeds", "seed_clinical_platform_demo.sql");

const conn =
  Deno.env.get("TEST_DATABASE_URL") ?? Deno.env.get("DATABASE_URL") ?? "";

if (!conn) {
  console.error("Set TEST_DATABASE_URL or DATABASE_URL.");
  Deno.exit(1);
}

const status = await new Deno.Command("psql", {
  args: ["--dbname=" + conn, "-v", "ON_ERROR_STOP=1", "-f", seedFile],
  stdout: "inherit",
  stderr: "inherit",
}).output();

if (!status.success) {
  console.error(`psql failed (exit ${status.code})`);
  Deno.exit(status.code ?? 1);
}
console.log("Seed applied:", seedFile);
