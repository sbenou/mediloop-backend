
import { appConfig } from './appConfig.ts'

// Environment configuration - combines app config with secrets
export const config = {
  // Server configuration from app config
  PORT: appConfig.server.port,
  HOST: appConfig.server.host,
  
  // Database connection - SECRET from env/vault
  DATABASE_URL: Deno.env.get('DATABASE_URL') || 'postgresql://neondb_owner:npg_DUFXR9MiPsf1@ep-small-base-a900n0vb-pooler.gwc.azure.neon.tech/neondb?sslmode=require&channel_binding=require',
  
  // JWT configuration - SECRET from env/vault
  JWT_SECRET: Deno.env.get('JWT_SECRET') || 'your-super-secret-jwt-key',
  JWT_EXPIRES_IN: appConfig.jwt.expiresIn,
  JWT_ISSUER: appConfig.jwt.issuer,
  JWT_AUDIENCE: appConfig.jwt.audience,
  
  // OAuth providers - mix of public config and secrets
  GOOGLE_CLIENT_ID: appConfig.oauth.google.clientId,
  GOOGLE_CLIENT_SECRET: Deno.env.get('GOOGLE_CLIENT_SECRET') || '',
  FRANCECONNECT_CLIENT_ID: appConfig.oauth.franceConnect.clientId,
  FRANCECONNECT_CLIENT_SECRET: Deno.env.get('FRANCECONNECT_CLIENT_SECRET') || '',
  LUXTRUST_CLIENT_ID: appConfig.oauth.luxTrust.clientId,
  LUXTRUST_CLIENT_SECRET: Deno.env.get('LUXTRUST_CLIENT_SECRET') || '',
  
  // Service URLs from app config
  FRONTEND_URL: appConfig.urls.frontend,
  SERVICE_URL: appConfig.urls.service,
  
  // Application settings
  ENVIRONMENT: appConfig.app.environment,
  LOG_LEVEL: appConfig.app.logLevel,
  
  // Legacy Supabase for transition (SECRETS - will be removed)
  SUPABASE_URL: Deno.env.get('SUPABASE_URL') || '',
  SUPABASE_SERVICE_KEY: Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || ''
}

console.log(`Configuration loaded. Server will run on port: ${config.PORT} in ${config.ENVIRONMENT} mode`);
