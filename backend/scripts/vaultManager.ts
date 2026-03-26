
import { vaultService } from '../services/vaultService.ts';

const USAGE = `
Vault Manager - Manage secrets in HashiCorp Vault

Usage: deno run --allow-net --allow-env scripts/vaultManager.ts <command> [args]

Commands:
  setup                           - Initialize Vault with secrets from .env
  get <path>                      - Get secrets from path
  set <path> <key=value> ...      - Set secrets at path (merges with existing)
  delete <path>                   - Delete secrets at path
  list                           - List all secret paths
  health                         - Check Vault health

Examples:
  deno run --allow-net --allow-env scripts/vaultManager.ts setup
  deno run --allow-net --allow-env scripts/vaultManager.ts get auth
  deno run --allow-net --allow-env scripts/vaultManager.ts set oauth GOOGLE_CLIENT_SECRET=abc123
  deno run --allow-net --allow-env scripts/vaultManager.ts delete legacy
`;

async function main() {
  const args = Deno.args;
  
  if (args.length === 0) {
    console.log(USAGE);
    return;
  }

  const command = args[0];

  try {
    switch (command) {
      case 'setup':
        await setupCommand();
        break;
      case 'get':
        if (args.length < 2) {
          console.error('Usage: get <path>');
          return;
        }
        await getCommand(args[1]);
        break;
      case 'set':
        if (args.length < 3) {
          console.error('Usage: set <path> <key=value> ...');
          return;
        }
        await setCommand(args[1], args.slice(2));
        break;
      case 'delete':
        if (args.length < 2) {
          console.error('Usage: delete <path>');
          return;
        }
        await deleteCommand(args[1]);
        break;
      case 'health':
        await healthCommand();
        break;
      default:
        console.error(`Unknown command: ${command}`);
        console.log(USAGE);
    }
  } catch (error) {
    console.error('Command failed:', error.message);
    Deno.exit(1);
  }
}

async function setupCommand() {
  console.log('🔧 Setting up Vault with secrets from environment...');
  
  const secrets = {
    auth: {
      DATABASE_URL: Deno.env.get('DATABASE_URL') || '',
      DATABASE_URL_DEV: Deno.env.get('DATABASE_URL_DEV') || '',
      DATABASE_URL_PROD: Deno.env.get('DATABASE_URL_PROD') || '',
      JWT_SECRET: Deno.env.get('JWT_SECRET') || 'your-super-secret-jwt-key',
      RESEND_API_KEY: Deno.env.get('RESEND_API_KEY') || '',
      RESEND_FROM_EMAIL: Deno.env.get('RESEND_FROM_EMAIL') || 'noreply@notifications.mediloop.lu',
      SMS_PROVIDER: Deno.env.get('SMS_PROVIDER') || 'twilio',
      SMS_API_KEY: Deno.env.get('SMS_API_KEY') || '',
      SMS_API_SECRET: Deno.env.get('SMS_API_SECRET') || '',
      SMS_SENDER_ID: Deno.env.get('SMS_SENDER_ID') || '',
    },
    oauth: {
      GOOGLE_CLIENT_SECRET: Deno.env.get('GOOGLE_CLIENT_SECRET') || '',
      FRANCECONNECT_CLIENT_SECRET: Deno.env.get('FRANCECONNECT_CLIENT_SECRET') || '',
      LUXTRUST_CLIENT_SECRET: Deno.env.get('LUXTRUST_CLIENT_SECRET') || ''
    },
    legacy: {
      SUPABASE_URL: Deno.env.get('SUPABASE_URL') || '',
      SUPABASE_SERVICE_KEY: Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || ''
    }
  };

  for (const [path, data] of Object.entries(secrets)) {
    await vaultService.setSecret(path, data);
    console.log(`✅ Secrets stored at: ${path}`);
  }
  
  console.log('🎉 Vault setup completed!');
}

async function getCommand(path: string) {
  console.log(`📖 Getting secrets from: ${path}`);
  const secrets = await vaultService.getSecret(path);
  console.log(JSON.stringify(secrets, null, 2));
}

async function setCommand(path: string, keyValuePairs: string[]) {
  console.log(`📝 Setting secrets at: ${path}`);
  
  // Parse new secrets from key=value pairs
  const newSecrets: Record<string, string> = {};
  for (const pair of keyValuePairs) {
    const [key, value] = pair.split('=');
    if (!key || !value) {
      throw new Error(`Invalid key=value pair: ${pair}`);
    }
    newSecrets[key] = value;
  }
  
  // Get existing secrets first
  let existingSecrets: Record<string, string> = {};
  try {
    existingSecrets = await vaultService.getSecret(path) || {};
  } catch (error) {
    console.log(`Path '${path}' doesn't exist yet, creating new secrets.`);
  }
  
  // Merge existing secrets with new ones (new ones override existing)
  const mergedSecrets = { ...existingSecrets, ...newSecrets };
  
  await vaultService.setSecret(path, mergedSecrets);
  console.log(`✅ Secrets updated at: ${path}`);
  console.log(`Updated keys: ${Object.keys(newSecrets).join(', ')}`);
  console.log(`Total keys at path: ${Object.keys(mergedSecrets).join(', ')}`);
}

async function deleteCommand(path: string) {
  console.log(`🗑️ Deleting secrets at: ${path}`);
  await vaultService.deleteSecret(path);
  console.log(`✅ Secrets deleted from: ${path}`);
}

async function healthCommand() {
  const vaultUrl = Deno.env.get('VAULT_URL') || 'http://localhost:8200';
  
  try {
    const response = await fetch(`${vaultUrl}/v1/sys/health`);
    const health = await response.json();
    
    console.log('🏥 Vault Health Status:');
    console.log(`  Initialized: ${health.initialized}`);
    console.log(`  Sealed: ${health.sealed}`);
    console.log(`  Standby: ${health.standby}`);
    console.log(`  Version: ${health.version}`);
    
    if (health.sealed) {
      console.log('⚠️  Vault is sealed and needs to be unsealed');
    } else {
      console.log('✅ Vault is healthy and ready');
    }
  } catch (error) {
    console.error('❌ Failed to check Vault health:', error.message);
    throw error;
  }
}

if (import.meta.main) {
  await main();
}
