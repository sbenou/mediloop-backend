
import { loadEnvironment } from '../config/envLoader.ts';
import { vaultService } from '../services/vaultService.ts';

async function setupVault() {
  console.log('🔧 Setting up HashiCorp Vault with secrets...');

  // Load environment variables first
  await loadEnvironment();

  try {
    // Get the complete database URLs with all parameters
    const databaseUrl = Deno.env.get('DATABASE_URL') || 'postgresql://neondb_owner:npg_DUFXR9MiPsf1@ep-small-base-a900n0vb-pooler.gwc.azure.neon.tech/neondb?sslmode=require&channel_binding=require';
    const databaseUrlDev = Deno.env.get('DATABASE_URL_DEV') || databaseUrl;
    const databaseUrlProd = Deno.env.get('DATABASE_URL_PROD') || '';

    console.log('🔍 Debug - URLs before storing:');
    console.log('  DATABASE_URL length:', databaseUrl.length);
    console.log('  DATABASE_URL_DEV length:', databaseUrlDev.length);
    
    // Auth secrets - including both dev and prod database URLs
    await vaultService.setSecret('auth', {
      DATABASE_URL: databaseUrl,
      DATABASE_URL_DEV: databaseUrlDev,
      DATABASE_URL_PROD: databaseUrlProd,
      JWT_SECRET: Deno.env.get('JWT_SECRET') || 'your-super-secret-jwt-key'
    });
    console.log('✅ Auth secrets stored in Vault (including dev/prod database URLs)');

    // OAuth secrets
    await vaultService.setSecret('oauth', {
      GOOGLE_CLIENT_SECRET: Deno.env.get('GOOGLE_CLIENT_SECRET') || '',
      FRANCECONNECT_CLIENT_SECRET: Deno.env.get('FRANCECONNECT_CLIENT_SECRET') || '',
      LUXTRUST_CLIENT_SECRET: Deno.env.get('LUXTRUST_CLIENT_SECRET') || ''
    });
    console.log('✅ OAuth secrets stored in Vault');

    // Legacy secrets (during transition)
    await vaultService.setSecret('legacy', {
      SUPABASE_URL: Deno.env.get('SUPABASE_URL') || '',
      SUPABASE_SERVICE_KEY: Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || ''
    });
    console.log('✅ Legacy secrets stored in Vault');

    console.log('🎉 Vault setup completed successfully!');
    console.log('');
    console.log('💡 To add environment-specific database URLs:');
    console.log('   deno task vault set auth DATABASE_URL_DEV="your-dev-url"');
    console.log('   deno task vault set auth DATABASE_URL_PROD="your-prod-url"');
  } catch (error) {
    console.error('❌ Failed to setup Vault:', error);
    Deno.exit(1);
  }
}

if (import.meta.main) {
  await setupVault();
}
