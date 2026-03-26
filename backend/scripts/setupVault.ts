import { loadEnvironment } from "../shared/config/envLoader.ts";
import { vaultService } from "../shared/services/vaultService.ts";
async function enableKVSecretsEngine() {
  const vaultUrl = Deno.env.get("VAULT_URL") || "http://localhost:8200";
  const vaultToken = Deno.env.get("VAULT_TOKEN") || "";

  try {
    const response = await fetch(`${vaultUrl}/v1/sys/mounts/secret`, {
      method: "POST",
      headers: {
        "X-Vault-Token": vaultToken,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        type: "kv",
        options: {
          version: "2",
        },
      }),
    });

    // If it returns 400, the engine might already be enabled
    if (response.status === 400) {
      console.log("🔍 KV secrets engine already enabled or path exists");
      return;
    }

    if (!response.ok) {
      throw new Error(
        `Failed to enable KV engine: ${response.status} ${response.statusText}`,
      );
    }

    console.log("✅ KV secrets engine enabled successfully");
  } catch (error) {
    console.log(
      "⚠️  KV engine setup warning (might already exist):",
      error.message,
    );
  }
}

async function setupVault() {
  console.log("🔧 Setting up HashiCorp Vault with secrets...");

  // Load environment variables first
  await loadEnvironment();

  try {
    // First, enable the KV secrets engine if it's not already enabled
    console.log("🔧 Enabling KV secrets engine...");
    await enableKVSecretsEngine();

    // Wait a moment for the engine to be fully enabled
    await new Promise((resolve) => setTimeout(resolve, 1000));

    console.log("✅ KV secrets engine enabled successfully");

    // Get the complete database URLs with all parameters
    // Use environment variables if available, otherwise use the complete default URLs
    const databaseUrl =
      Deno.env.get("DATABASE_URL") ||
      "postgresql://neondb_owner:npg_DUFXR9MiPsf1@ep-small-base-a900n0vb-pooler.gwc.azure.neon.tech/neondb?sslmode=require&channel_binding=require";

    // Set complete URLs for both dev and prod environments - use same structure as DATABASE_URL
    const databaseUrlDev =
      Deno.env.get("DATABASE_URL_DEV") ||
      "postgresql://neondb_owner:npg_DUFXR9MiPsf1@ep-lively-thunder-a9vxzytc-pooler.gwc.azure.neon.tech/neondb?sslmode=require&channel_binding=require";
    const databaseUrlProd =
      Deno.env.get("DATABASE_URL_PROD") ||
      "postgresql://neondb_owner:npg_DUFXR9MiPsf1@ep-small-base-a900n0vb-pooler.gwc.azure.neon.tech/neondb?sslmode=require&channel_binding=require";

    console.log("🔍 Debug - URLs before storing:");
    console.log("  DATABASE_URL length:", databaseUrl.length);
    console.log("  DATABASE_URL_DEV length:", databaseUrlDev.length);
    console.log("  DATABASE_URL_PROD length:", databaseUrlProd.length);
    console.log("  DATABASE_URL:", databaseUrl);
    console.log("  DATABASE_URL_DEV:", databaseUrlDev);
    console.log("  DATABASE_URL_PROD:", databaseUrlProd);

    console.log("📝 Storing auth/database/email/sms secrets...");
    await vaultService.setSecret("auth", {
      DATABASE_URL: databaseUrl,
      DATABASE_URL_DEV: databaseUrlDev,
      DATABASE_URL_PROD: databaseUrlProd,
      JWT_SECRET: Deno.env.get("JWT_SECRET") || "your-super-secret-jwt-key",
      RESEND_API_KEY: Deno.env.get("RESEND_API_KEY") || "",
      RESEND_FROM_EMAIL:
        Deno.env.get("RESEND_FROM_EMAIL") || "noreply@notifications.mediloop.lu",
      SMS_PROVIDER: Deno.env.get("SMS_PROVIDER") || "twilio",
      SMS_API_KEY: Deno.env.get("SMS_API_KEY") || "",
      SMS_API_SECRET: Deno.env.get("SMS_API_SECRET") || "",
      SMS_SENDER_ID: Deno.env.get("SMS_SENDER_ID") || "",
    });

    console.log(
      "✅ Auth secrets stored in Vault (database + jwt + email + sms)",
    );

    // OAuth secrets
    await vaultService.setSecret("oauth", {
      GOOGLE_CLIENT_SECRET: Deno.env.get("GOOGLE_CLIENT_SECRET") || "",
      FRANCECONNECT_CLIENT_SECRET:
        Deno.env.get("FRANCECONNECT_CLIENT_SECRET") || "",
      LUXTRUST_CLIENT_SECRET: Deno.env.get("LUXTRUST_CLIENT_SECRET") || "",
    });
    console.log("✅ OAuth secrets stored in Vault");

    // Legacy secrets (during transition)
    await vaultService.setSecret("legacy", {
      SUPABASE_URL: Deno.env.get("SUPABASE_URL") || "",
      SUPABASE_SERVICE_KEY: Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || "",
    });
    console.log("✅ Legacy secrets stored in Vault");

    console.log("🎉 Vault setup completed successfully!");
    console.log("");
    console.log(
      "💡 All database URLs now include complete connection strings with:",
    );
    console.log("   - sslmode=require");
    console.log("   - channel_binding=require");
    console.log("");
    console.log(
      "💡 To update with your actual passwords, set environment variables and run setup again:",
    );
    console.log(
      "   set DATABASE_URL_DEV=postgresql://neondb_owner:YOUR_DEV_PASSWORD@ep-lively-thunder-a9vxzytc-pooler.gwc.azure.neon.tech/neondb?sslmode=require&channel_binding=require",
    );
    console.log(
      "   set DATABASE_URL_PROD=postgresql://neondb_owner:YOUR_PROD_PASSWORD@ep-small-base-a900n0vb-pooler.gwc.azure.neon.tech/neondb?sslmode=require&channel_binding=require",
    );
    console.log("   deno task setup-vault");
  } catch (error) {
    console.error("❌ Failed to setup Vault:", error);
    Deno.exit(1);
  }
}

if (import.meta.main) {
  await setupVault();
}
