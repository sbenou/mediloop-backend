
// Environment configuration
export const config = {
  // Database connection - now using Neon PostgreSQL
  DATABASE_URL: Deno.env.get('DATABASE_URL') || 'postgresql://neondb_owner:npg_DUFXR9MiPsf1@ep-small-base-a900n0vb-pooler.gwc.azure.neon.tech/neondb?sslmode=require&channel_binding=require',
  
  // JWT configuration
  JWT_SECRET: Deno.env.get('JWT_SECRET') || 'your-super-secret-jwt-key',
  JWT_EXPIRES_IN: '24h',
  
  // OAuth providers
  GOOGLE_CLIENT_ID: Deno.env.get('GOOGLE_CLIENT_ID') || '',
  GOOGLE_CLIENT_SECRET: Deno.env.get('GOOGLE_CLIENT_SECRET') || '',
  FRANCECONNECT_CLIENT_ID: Deno.env.get('FRANCECONNECT_CLIENT_ID') || '',
  FRANCECONNECT_CLIENT_SECRET: Deno.env.get('FRANCECONNECT_CLIENT_SECRET') || '',
  LUXTRUST_CLIENT_ID: Deno.env.get('LUXTRUST_CLIENT_ID') || '',
  LUXTRUST_CLIENT_SECRET: Deno.env.get('LUXTRUST_CLIENT_SECRET') || '',
  
  // Service URLs
  FRONTEND_URL: Deno.env.get('FRONTEND_URL') || 'http://localhost:5173',
  SERVICE_URL: Deno.env.get('SERVICE_URL') || 'http://localhost:8000',
  
  // Legacy Supabase for transition (will be removed)
  SUPABASE_URL: Deno.env.get('SUPABASE_URL') || '',
  SUPABASE_SERVICE_KEY: Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || ''
}
