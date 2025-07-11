
import { Router } from "https://deno.land/x/oak@v12.6.1/mod.ts";
import { migrationService } from '../services/migrationService.ts';

const migrationRouter = new Router();

// Tenant migration endpoint
migrationRouter.post("/api/migrate/tenants", async (ctx) => {
  console.log('🚀 Starting tenant migration via API endpoint...\n');
  
  try {
    const result = await migrationService.migrateExistingTenants();
    
    ctx.response.status = 200;
    ctx.response.body = {
      success: true,
      message: result.success ? 'Migration completed successfully!' : 'Migration completed with some errors.',
      details: {
        total: result.total,
        successful: result.successful,
        failed: result.failed,
        schemas: result.schemas || [] // Add schemas info for debugging
      }
    };
    
    if (result.success) {
      console.log('\n🎉 Migration completed successfully via API!');
      console.log(`All ${result.total} tenant schemas have been updated.`);
    } else {
      console.log('\n⚠️ Migration completed with some errors via API.');
      console.log(`${result.successful} of ${result.total} schemas migrated successfully.`);
      console.log(`${result.failed} schemas failed to migrate.`);
    }
  } catch (error) {
    console.error('\n❌ Migration failed via API:', error.message);
    console.error('Stack trace:', error.stack);
    
    ctx.response.status = 500;
    ctx.response.body = {
      success: false,
      message: 'Migration failed',
      error: error.message,
      stack: error.stack
    };
  }
});

// Health check for migrations
migrationRouter.get("/api/migrate/status", (ctx) => {
  ctx.response.body = {
    status: "Migration endpoints available",
    endpoints: [
      "POST /api/migrate/tenants - Migrate existing tenant schemas"
    ]
  };
});

export default migrationRouter;
