
#!/usr/bin/env -S deno run --allow-net --allow-env --allow-read

import { migrationService } from '../services/migrationService.ts';

async function runMigration() {
  console.log('🚀 Starting tenant migration for JWT tables...\n');
  
  try {
    const result = await migrationService.migrateExistingTenants();
    
    if (result.success) {
      console.log('\n🎉 Migration completed successfully!');
      console.log(`All ${result.total} tenant schemas have been updated.`);
    } else {
      console.log('\n⚠️  Migration completed with some errors.');
      console.log(`${result.successful} of ${result.total} schemas migrated successfully.`);
      console.log(`${result.failed} schemas failed to migrate.`);
    }
    
  } catch (error) {
    console.error('\n❌ Migration failed:', error.message);
    Deno.exit(1);
  }
}

// Run the migration
if (import.meta.main) {
  await runMigration();
}
