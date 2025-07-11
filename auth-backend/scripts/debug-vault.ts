
import { vaultService } from '../services/vaultService.ts';

async function debugVault() {
  console.log('🔍 Debug: Checking Vault secrets...');
  
  try {
    // Check auth secrets
    console.log('\n📋 Auth secrets:');
    const authSecrets = await vaultService.getSecret('auth');
    if (authSecrets) {
      for (const [key, value] of Object.entries(authSecrets)) {
        if (key.includes('DATABASE_URL')) {
          // Show more of the URL for debugging, but still mask password
          const valueStr = typeof value === 'string' ? value : String(value);
          console.log(`  ${key} (length: ${valueStr.length}): ${valueStr.replace(/:[^@]+@/, ':***@')}`);
        } else {
          console.log(`  ${key}: ${typeof value === 'string' && value.length > 20 ? value.substring(0, 20) + '...' : value}`);
        }
      }
    } else {
      console.log('  No auth secrets found');
    }
    
    // Check oauth secrets
    console.log('\n📋 OAuth secrets:');
    const oauthSecrets = await vaultService.getSecret('oauth');
    if (oauthSecrets) {
      for (const [key, value] of Object.entries(oauthSecrets)) {
        console.log(`  ${key}: ${typeof value === 'string' && value.length > 20 ? value.substring(0, 20) + '...' : value}`);
      }
    } else {
      console.log('  No oauth secrets found');
    }
    
  } catch (error) {
    console.error('❌ Failed to read from Vault:', error.message);
    console.log('\n💡 Possible solutions:');
    console.log('1. Make sure Vault is running: docker-compose -f docker-compose.vault.yml up -d');
    console.log('2. Run setup: deno task setup-vault');
    console.log('3. Check environment variables: VAULT_URL and VAULT_TOKEN');
  }
}

if (import.meta.main) {
  await debugVault();
}
