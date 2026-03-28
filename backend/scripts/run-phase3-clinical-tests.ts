/**
 * Runs clinical Phase 3 tests (requires migration_020 applied on TEST_DATABASE_URL).
 *
 *   cd backend && deno task test-backend-phase3
 */
import { dirname, fromFileUrl, join } from "https://deno.land/std@0.224.0/path/mod.ts";

const scriptDir = dirname(fromFileUrl(import.meta.url));
const backendRoot = join(scriptDir, "..");
const testFile = join(backendRoot, "..", "tests", "backend", "clinicalPhase3.test.ts");

const child = new Deno.Command(Deno.execPath(), {
  args: [
    "test",
    "--allow-net",
    "--allow-env",
    "--allow-read",
    "--allow-run",
    "--unstable-kv",
    testFile,
  ],
  cwd: backendRoot,
  env: {
    ...Deno.env.toObject(),
    RUN_PHASE3_CLINICAL_TESTS: "1",
  },
  stdout: "inherit",
  stderr: "inherit",
});

const { code, success } = await child.output();
Deno.exit(success ? 0 : code);
