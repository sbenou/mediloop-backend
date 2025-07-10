
import { load } from "https://deno.land/std@0.208.0/dotenv/mod.ts";

export async function loadEnvironment() {
  const environment = Deno.env.get('NODE_ENV') || 'development';
  
  let envFile: string;
  
  switch (environment) {
    case 'production':
      envFile = '.env.production';
      break;
    case 'development':
    default:
      envFile = '.env.development';
      break;
  }
  
  try {
    const env = await load({ envPath: envFile });
    
    // Set environment variables if they don't already exist
    for (const [key, value] of Object.entries(env)) {
      if (!Deno.env.get(key)) {
        Deno.env.set(key, value);
      }
    }
    
    console.log(`✅ Environment loaded from ${envFile} (${environment} mode)`);
  } catch (error) {
    console.warn(`⚠️ Could not load ${envFile}:`, error.message);
    console.log('Using system environment variables...');
  }
}
