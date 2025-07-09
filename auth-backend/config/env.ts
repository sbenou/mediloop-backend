
import { appConfig } from './appConfig.ts'
import { vaultService } from '../services/vaultService.ts'

class EnvironmentConfig {
  private secrets: Record<string, string> = {};
  private initialized = false;

  async initialize(): Promise<void> {
    if (this.initialized) return;

    try {
      // Load secrets from Vault
      const authSecrets = await vaultService.getSecret('auth');
      const oauthSecrets = await vaultService.getSecret('oauth');
      const legacySecrets = await vaultService.getSecret('legacy');

      this.secrets = {
        ...authSecrets,
        ...oauthSecrets,
        ...legacySecrets
      };

      console.log('✅ Secrets loaded from HashiCorp Vault');
      this.initialized = true;
    } catch (error) {
      console.error('❌ Failed to load secrets from Vault, falling back to environment variables:', error);
      
      // Fallback to environment variables
      this.secrets = {
        DATABASE_URL: Deno.env.get('DATABASE_URL') || '',
        JWT_SECRET: Deno.env.get('JWT_SECRET') || '',
        GOOGLE_CLIENT_SECRET: Deno.env.get('GOOGLE_CLIENT_SECRET') || '',
        FRANCECONNECT_CLIENT_SECRET: Deno.env.get('FRANCECONNECT_CLIENT_SECRET') || '',
        LUXTRUST_CLIENT_SECRET: Deno.env.get('LUXTRUST_CLIENT_SECRET') || '',
        SUPABASE_URL: Deno.env.get('SUPABASE_URL') || '',
        SUPABASE_SERVICE_KEY: Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || ''
      };
      
      this.initialized = true;
    }
  }

  private getSecret(key: string, fallback?: string): string {
    if (!this.initialized) {
      throw new Error('EnvironmentConfig not initialized. Call initialize() first.');
    }
    return this.secrets[key] || fallback || '';
  }

  get config() {
    return {
      // Server configuration from app config
      PORT: appConfig.server.port,
      HOST: appConfig.server.host,
      
      // Database connection - SECRET from Vault
      DATABASE_URL: this.getSecret('DATABASE_URL', 'postgresql://neondb_owner:npg_DUFXR9MiPsf1@ep-small-base-a900n0vb-pooler.gwc.azure.neon.tech/neondb?sslmode=require&channel_binding=require'),
      
      // JWT configuration - SECRET from Vault
      JWT_SECRET: this.getSecret('JWT_SECRET', 'your-super-secret-jwt-key'),
      JWT_EXPIRES_IN: appConfig.jwt.expiresIn,
      JWT_ISSUER: appConfig.jwt.issuer,
      JWT_AUDIENCE: appConfig.jwt.audience,
      
      // OAuth providers - mix of public config and secrets from Vault
      GOOGLE_CLIENT_ID: appConfig.oauth.google.clientId,
      GOOGLE_CLIENT_SECRET: this.getSecret('GOOGLE_CLIENT_SECRET'),
      FRANCECONNECT_CLIENT_ID: appConfig.oauth.franceConnect.clientId,
      FRANCECONNECT_CLIENT_SECRET: this.getSecret('FRANCECONNECT_CLIENT_SECRET'),
      LUXTRUST_CLIENT_ID: appConfig.oauth.luxTrust.clientId,
      LUXTRUST_CLIENT_SECRET: this.getSecret('LUXTRUST_CLIENT_SECRET'),
      
      // Service URLs from app config
      FRONTEND_URL: appConfig.urls.frontend,
      SERVICE_URL: appConfig.urls.service,
      
      // Application settings
      ENVIRONMENT: appConfig.app.environment,
      LOG_LEVEL: appConfig.app.logLevel,
      
      // Legacy Supabase for transition (SECRETS from Vault - will be removed)
      SUPABASE_URL: this.getSecret('SUPABASE_URL'),
      SUPABASE_SERVICE_KEY: this.getSecret('SUPABASE_SERVICE_KEY')
    };
  }
}

const environmentConfig = new EnvironmentConfig();

// Export a promise-based config loader
export const loadConfig = async () => {
  await environmentConfig.initialize();
  return environmentConfig.config;
};

// For backward compatibility, export config that throws if not initialized
export let config: ReturnType<typeof environmentConfig.config>;

// Initialize config on module load
try {
  config = await loadConfig();
  console.log(`Configuration loaded. Server will run on port: ${config.PORT} in ${config.ENVIRONMENT} mode`);
} catch (error) {
  console.error('Failed to load configuration:', error);
  throw error;
}
