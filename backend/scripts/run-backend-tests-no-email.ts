/**
 * Runs backend tests with SKIP_AUTH_RESEND_ROUTES=1 so POST /api/auth/resend-verification
 * cases are skipped (saves Resend quota). Direct Resend API tests in emailSend.test.ts
 * remain opt-in via RUN_RESEND_TESTS=1.
 *
 * Usage (from repo root): cd backend && deno task test-backend-no-email
 */
import { dirname, fromFileUrl, join } from "https://deno.land/std@0.224.0/path/mod.ts";

const scriptDir = dirname(fromFileUrl(import.meta.url));
const backendRoot = join(scriptDir, "..");
const testsDir = join(backendRoot, "..", "tests", "backend");

const child = new Deno.Command(Deno.execPath(), {
  args: [
    "test",
    "--allow-net",
    "--allow-env",
    "--allow-read",
    "--allow-run",
    "--unstable-kv",
    testsDir,
  ],
  cwd: backendRoot,
  env: {
    ...Deno.env.toObject(),
    SKIP_AUTH_RESEND_ROUTES: "1",
  },
  stdout: "inherit",
  stderr: "inherit",
});

const { code, success } = await child.output();
Deno.exit(success ? 0 : code);
