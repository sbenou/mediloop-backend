import { loadEnvironment } from "./envLoader.ts";
import { appConfig } from "./appConfig.ts";
import { vaultService } from "../services/vaultService.ts";

class EnvironmentConfig {
  private secrets: Record<string, string> = {};
  private initialized = false;

  async initialize(): Promise<void> {
    if (this.initialized) return;

    // Load environment variables first
    await loadEnvironment();

    try {
      // Load secrets from Vault
      const authSecrets = await vaultService.getSecret("auth");
      const oauthSecrets = await vaultService.getSecret("oauth");
      const legacySecrets = await vaultService.getSecret("legacy");

      this.secrets = {
        ...authSecrets,
        ...oauthSecrets,
        ...legacySecrets,
      };

      console.log("✅ Secrets loaded from HashiCorp Vault");

      // Debug: Log the database URLs being used (without exposing passwords)
      console.log("🔍 Debug - Database URLs found in Vault:");
      if (this.secrets.DATABASE_URL_DEV) {
        console.log(
          "  - DATABASE_URL_DEV:",
          this.secrets.DATABASE_URL_DEV.replace(/:[^@]+@/, ":***@"),
        );
      }
      if (this.secrets.DATABASE_URL_PROD) {
        console.log(
          "  - DATABASE_URL_PROD:",
          this.secrets.DATABASE_URL_PROD.replace(/:[^@]+@/, ":***@"),
        );
      }
      if (this.secrets.DATABASE_URL) {
        console.log(
          "  - DATABASE_URL (generic):",
          this.secrets.DATABASE_URL.replace(/:[^@]+@/, ":***@"),
        );
      }

      this.initialized = true;
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : String(error);
      console.error(
        "❌ Failed to load secrets from Vault, falling back to environment variables:",
        errorMessage,
      );

      // Fallback to environment variables (same keys Vault would provide, so
      // `.env.development` can define DATABASE_URL_DEV / DATABASE_URL_PROD locally).
      this.secrets = {
        DATABASE_URL: Deno.env.get("DATABASE_URL") || "",
        DATABASE_URL_DEV: Deno.env.get("DATABASE_URL_DEV") || "",
        DATABASE_URL_PROD: Deno.env.get("DATABASE_URL_PROD") || "",
        JWT_SECRET: Deno.env.get("JWT_SECRET") || "",
        GOOGLE_CLIENT_SECRET: Deno.env.get("GOOGLE_CLIENT_SECRET") || "",
        FRANCECONNECT_CLIENT_SECRET:
          Deno.env.get("FRANCECONNECT_CLIENT_SECRET") || "",
        LUXTRUST_CLIENT_SECRET: Deno.env.get("LUXTRUST_CLIENT_SECRET") || "",
        SUPABASE_URL: Deno.env.get("SUPABASE_URL") || "",
        SUPABASE_SERVICE_KEY: Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || "",
        RESEND_API_KEY: Deno.env.get("RESEND_API_KEY") || "",
        RESEND_FROM_EMAIL: Deno.env.get("RESEND_FROM_EMAIL") || "",
        SMS_PROVIDER: Deno.env.get("SMS_PROVIDER") || "",
        SMS_API_KEY: Deno.env.get("SMS_API_KEY") || "",
        SMS_API_SECRET: Deno.env.get("SMS_API_SECRET") || "",
        SMS_SENDER_ID: Deno.env.get("SMS_SENDER_ID") || "",
      };

      this.initialized = true;
    }
  }

  private getSecret(key: string, fallback?: string): string {
    if (!this.initialized) {
      throw new Error(
        "EnvironmentConfig not initialized. Call initialize() first.",
      );
    }
    return this.secrets[key] || fallback || "";
  }

  private validateDatabaseUrl(url: string): string {
    if (!url) {
      throw new Error("Database URL is empty or undefined");
    }

    // Check if URL has sslmode parameter
    if (!url.includes("sslmode=")) {
      console.log(
        "⚠️  Database URL missing sslmode parameter, adding sslmode=require",
      );
      const separator = url.includes("?") ? "&" : "?";
      return `${url}${separator}sslmode=require`;
    }

    // Check for empty sslmode
    if (
      url.includes("sslmode=&") ||
      url.includes('sslmode=""') ||
      url.includes("sslmode=''") ||
      url.match(/sslmode=\s*$/)
    ) {
      console.log(
        "⚠️  Database URL has empty sslmode, fixing to sslmode=require",
      );
      return url.replace(/sslmode=([^&]*)/g, "sslmode=require");
    }

    return url;
  }

  private getDatabaseUrl(): string {
    const environment = appConfig.app.environment;
    let databaseUrl = "";

    // `.env.test` is merged in development so scripts/tests see TEST_DATABASE_URL.
    // The live API (`main.ts`) must still use dev/prod URLs from Vault or DATABASE_URL*;
    // otherwise every `start-dev` hits the test Neon branch and logins fail (user rows differ).
    const testDatabaseUrl = Deno.env.get("TEST_DATABASE_URL");
    // Used by scripts/seedSubscriptionSystem.ts when seeding DATABASE_URL_DEV
    // while `.env.test` would otherwise re-merge TEST_DATABASE_URL.
    const ignoreTestDatabaseUrl =
      Deno.env.get("MEDILOOP_IGNORE_TEST_DATABASE_URL") === "1";
    const mainModule = Deno.mainModule.replace(/\\/g, "/");
    const isMainApiServer = /(^|\/)main\.ts(\?|$)/.test(mainModule);
    if (
      testDatabaseUrl &&
      !ignoreTestDatabaseUrl &&
      !isMainApiServer
    ) {
      console.log("🧪 Using TEST_DATABASE_URL (non-main entry)");
      console.log("   Database:", testDatabaseUrl.replace(/:[^@]+@/, ":***@"));
      return this.validateDatabaseUrl(testDatabaseUrl);
    }
    if (testDatabaseUrl && isMainApiServer) {
      console.log(
        "🔧 Ignoring TEST_DATABASE_URL for main API server; using Vault / DATABASE_URL*",
      );
    }

    // Try to get environment-specific database URL from Vault
    if (environment === "production") {
      const prodUrl = this.getSecret("DATABASE_URL_PROD");
      if (prodUrl) {
        console.log("🔗 Using production database URL from Vault");
        databaseUrl = prodUrl;
      }
    } else {
      const devUrl = this.getSecret("DATABASE_URL_DEV");
      if (devUrl) {
        console.log("🔗 Using development database URL from Vault");
        databaseUrl = devUrl;
      }
    }

    // Fallback to generic DATABASE_URL from Vault
    if (!databaseUrl) {
      const genericUrl = this.getSecret("DATABASE_URL");
      if (genericUrl) {
        console.log(
          `🔗 Using generic database URL from Vault for ${environment}`,
        );
        databaseUrl = genericUrl;
      }
    }

    // Final fallback to environment variable and default
    if (!databaseUrl) {
      databaseUrl =
        Deno.env.get("DATABASE_URL") ||
        "postgresql://neondb_owner:npg_DUFXR9MiPsf1@ep-small-base-a900n0vb-pooler.gwc.azure.neon.tech/neondb?sslmode=require&channel_binding=require";
      console.log(
        `🔗 Using fallback database URL from environment for ${environment}`,
      );
    }

    // Validate and fix the database URL
    try {
      return this.validateDatabaseUrl(databaseUrl);
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : String(error);
      console.error("❌ Database URL validation failed:", errorMessage);
      throw error;
    }
  }

  get config() {
    return {
      // Server configuration from app config
      PORT: appConfig.server.port,
      HOST: appConfig.server.host,

      // Database connection - environment-specific SECRET from Vault
      DATABASE_URL: this.getDatabaseUrl(),

      // JWT configuration - SECRET from Vault
      JWT_SECRET: this.getSecret("JWT_SECRET", "your-super-secret-jwt-key"),
      JWT_EXPIRES_IN: appConfig.jwt.expiresIn,
      JWT_ISSUER: appConfig.jwt.issuer,
      JWT_AUDIENCE: appConfig.jwt.audience,

      // OAuth providers - mix of public config and secrets from Vault
      GOOGLE_CLIENT_ID: appConfig.oauth.google.clientId,
      GOOGLE_CLIENT_SECRET: this.getSecret("GOOGLE_CLIENT_SECRET"),
      FRANCECONNECT_CLIENT_ID: appConfig.oauth.franceConnect.clientId,
      FRANCECONNECT_CLIENT_SECRET: this.getSecret(
        "FRANCECONNECT_CLIENT_SECRET",
      ),
      LUXTRUST_CLIENT_ID: appConfig.oauth.luxTrust.clientId,
      LUXTRUST_CLIENT_SECRET: this.getSecret("LUXTRUST_CLIENT_SECRET"),

      // Email service - SECRETS from Vault
      RESEND_API_KEY: this.getSecret("RESEND_API_KEY"),
      RESEND_FROM_EMAIL: this.getSecret(
        "RESEND_FROM_EMAIL",
        "noreply@notifications.mediloop.lu",
      ),

      // SMS service - SECRETS from Vault
      SMS_PROVIDER: this.getSecret("SMS_PROVIDER", "twilio"),
      SMS_API_KEY: this.getSecret("SMS_API_KEY"),
      SMS_API_SECRET: this.getSecret("SMS_API_SECRET"),
      SMS_SENDER_ID: this.getSecret("SMS_SENDER_ID"),

      // Service URLs — read Deno.env after loadEnvironment() (appConfig.urls is
      // evaluated at import time, before dotenv runs).
      FRONTEND_URL: Deno.env.get("FRONTEND_URL") || "http://localhost:5173",
      // HTTPS tunnel / public URL for links inside emails (password reset, verify, invites).
      // Falls back to FRONTEND_URL when unset. OAuth redirects still use FRONTEND_URL unless you register the tunnel with the IdP.
      PUBLIC_FRONTEND_URL:
        Deno.env.get("PUBLIC_FRONTEND_URL") ||
        Deno.env.get("FRONTEND_URL") ||
        "http://localhost:5173",
      SERVICE_URL: Deno.env.get("SERVICE_URL") || appConfig.urls.service,

      // Application settings
      ENVIRONMENT: appConfig.app.environment,
      LOG_LEVEL: appConfig.app.logLevel,

      // Legacy Supabase for transition (SECRETS from Vault - will be removed)
      SUPABASE_URL: this.getSecret("SUPABASE_URL"),
      SUPABASE_SERVICE_KEY: this.getSecret("SUPABASE_SERVICE_KEY"),
    };
  }
}

const environmentConfig = new EnvironmentConfig();

// Export a promise-based config loader
export const loadConfig = async () => {
  await environmentConfig.initialize();
  return environmentConfig.config;
};

// Define the config type properly
type ConfigType = {
  PORT: number;
  HOST: string;
  DATABASE_URL: string;
  JWT_SECRET: string;
  JWT_EXPIRES_IN: string;
  JWT_ISSUER: string;
  JWT_AUDIENCE: string;
  GOOGLE_CLIENT_ID: string;
  GOOGLE_CLIENT_SECRET: string;
  FRANCECONNECT_CLIENT_ID: string;
  FRANCECONNECT_CLIENT_SECRET: string;
  LUXTRUST_CLIENT_ID: string;
  LUXTRUST_CLIENT_SECRET: string;
  RESEND_API_KEY: string;
  RESEND_FROM_EMAIL: string;
  SMS_PROVIDER: string;
  SMS_API_KEY: string;
  SMS_API_SECRET: string;
  SMS_SENDER_ID: string;
  FRONTEND_URL: string;
  PUBLIC_FRONTEND_URL: string;
  SERVICE_URL: string;
  ENVIRONMENT: string;
  LOG_LEVEL: string;
  SUPABASE_URL: string;
  SUPABASE_SERVICE_KEY: string;
};

// For backward compatibility, export config that throws if not initialized
export let config: ConfigType;

// Initialize config on module load
try {
  config = await loadConfig();
  console.log(
    `Configuration loaded. Server will run on port: ${config.PORT} in ${config.ENVIRONMENT} mode`,
  );
} catch (error) {
  const errorMessage = error instanceof Error ? error.message : String(error);
  console.error("Failed to load configuration:", errorMessage);
  throw error;
}
