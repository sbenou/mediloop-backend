import { load } from "https://deno.land/std@0.208.0/dotenv/mod.ts";

export async function loadEnvironment() {
  const environment = Deno.env.get("NODE_ENV") || "development";

  let envFile: string;

  switch (environment) {
    case "production":
      envFile = ".env.production";
      break;
    case "development":
    default:
      envFile = ".env.development";
      break;
  }

  try {
    const env = await load({ envPath: envFile });

    // Development: `.env.development` wins over pre-set process env (e.g. stale
    // FRONTEND_URL in Windows user variables after changing Vite port).
    // Production: only set keys that are not already defined.
    const devLike = environment === "development" || environment === "test";
    for (const [key, value] of Object.entries(env)) {
      if (devLike || !Deno.env.get(key)) {
        Deno.env.set(key, value);
      }
    }

    console.log(`✅ Environment loaded from ${envFile} (${environment} mode)`);
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    console.warn(`⚠️ Could not load ${envFile}:`, errorMessage);
    console.log("Using system environment variables...");
  }
}
