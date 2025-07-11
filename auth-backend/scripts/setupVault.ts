
import { loadEnvironment } from '../config/envLoader.ts';
import { vaultService } from '../services/vaultService.ts';

async function setupVault() {
  console.log('🔧 Setting up HashiCorp Vault with secrets...');

  // Load environment variables first
  await loadEnvironment();

  try {
    // Get the complete database URLs with all parameters
    // Use environment variables if available, otherwise use the complete default URLs
    const databaseUrl = Deno.env.get('DATABASE_URL') || 'postgresql://neondb_owner:npg_DUFXR9MiPsf1@ep-small-base-a900n0vb-pooler.gwc.azure.neon.tech/neondb?sslmode=require&channel_binding=require';
    
    // Set complete URLs for both dev and prod environments - use same structure as DATABASE_URL
    const databaseUrlDev = Deno.env.get('DATABASE_URL_DEV') || 'postgresql://neondb_owner:npg_DUFXR9MiPsf1@ep-lively-thunder-a9vxzytc-pooler.gwc.azure.neon.tech/neondb?sslmode=require&channel_binding=require';
    const databaseUrlProd = Deno.env.get('DATABASE_URL_PROD') || 'postgresql://neondb_owner:npg_DUFXR9MiPsf1@ep-small-base-a900n0vb-pooler.gwc.azure.neon.tech/neondb?sslmode=require&channel_binding=require';

    console.log('🔍 Debug - URLs before storing:');
    console.log('  DATABASE_URL length:', databaseUrl.length);
    console.log('  DATABASE_URL_DEV length:', databaseUrlDev.length);
    console.log('  DATABASE_URL_PROD length:', databaseUrlProd.length);
    console.log('  DATABASE_URL:', databaseUrl);
    console.log('  DATABASE_URL_DEV:', databaseUrlDev);
    console.log('  DATABASE_URL_PROD:', databaseUrlProd);
    
    // Store each URL individually to avoid any potential issues with batch storage
    console.log('📝 Storing DATABASE_URL...');
    await vaultService.setSecret('auth', {
      DATABASE_URL: databaseUrl,
      JWT_SECRET: Deno.env.get('JWT_SECRET') || 'your-super-secret-jwt-key'
    });
    
    console.log('📝 Storing DATABASE_URL_DEV...');
    await vaultService.setSecret('auth', {
      DATABASE_URL: databaseUrl,
      DATABASE_URL_DEV: databaseUrlDev,
      JWT_SECRET: Deno.env.get('JWT_SECRET') || 'your-super-secret-jwt-key'
    });
    
    console.log('📝 Storing DATABASE_URL_PROD...');
    await vaultService.setSecret('auth', {
      DATABASE_URL: databaseUrl,
      DATABASE_URL_DEV: databaseUrlDev,
      DATABASE_URL_PROD: databaseUrlProd,
      JWT_SECRET: Deno.env.get('JWT_SECRET') || 'your-super-secret-jwt-key'
    });
    
    console.log('✅ Auth secrets stored in Vault (all database URLs with complete connection strings)');

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
    console.log('💡 All database URLs now include complete connection strings with:');
    console.log('   - sslmode=require');
    console.log('   - channel_binding=require');
    console.log('');
    console.log('💡 To update with your actual passwords, set environment variables and run setup again:');
    console.log('   set DATABASE_URL_DEV=postgresql://neondb_owner:YOUR_DEV_PASSWORD@ep-lively-thunder-a9vxzytc-pooler.gwc.azure.neon.tech/neondb?sslmode=require&channel_binding=require');
    console.log('   set DATABASE_URL_PROD=postgresql://neondb_owner:YOUR_PROD_PASSWORD@ep-small-base-a900n0vb-pooler.gwc.azure.neon.tech/neondb?sslmode=require&channel_binding=require');
    console.log('   deno task setup-vault');
  } catch (error) {
    console.error('❌ Failed to setup Vault:', error);
    Deno.exit(1);
  }
}

if (import.meta.main) {
  await setupVault();
}
