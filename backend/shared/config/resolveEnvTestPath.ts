/**
 * Find repo-root `.env.test` whether the process cwd is repo root or `backend/`.
 * `dotenv` with `envPath: ".env.test"` only checks Deno.cwd(), which breaks `cd backend && deno task`.
 */
import { join } from "https://deno.land/std@0.224.0/path/mod.ts";

const MAX_PARENT_HOPS = 8;

export async function resolveEnvTestPath(): Promise<string | null> {
  let dir = Deno.cwd();
  for (let i = 0; i < MAX_PARENT_HOPS; i++) {
    const candidate = join(dir, ".env.test");
    try {
      if ((await Deno.stat(candidate)).isFile) return candidate;
    } catch {
      // not found or not readable
    }
    const parent = join(dir, "..");
    if (parent === dir) break;
    dir = parent;
  }
  return null;
}
