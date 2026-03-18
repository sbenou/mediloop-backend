
import { Router } from "https://deno.land/x/oak@v12.6.1/mod.ts"
import { postgresService } from "../services/postgresService.ts"
import { configService } from "../services/configService.ts"

const healthCheckRouter = new Router()

// Helper function to convert BigInt to number for JSON serialization
function convertBigIntToNumber(obj: any): any {
  if (typeof obj === 'bigint') {
    return Number(obj);
  }
  if (obj && typeof obj === 'object') {
    const converted: any = Array.isArray(obj) ? [] : {};
    for (const key in obj) {
      converted[key] = convertBigIntToNumber(obj[key]);
    }
    return converted;
  }
  return obj;
}

healthCheckRouter.get('/health', async (ctx) => {
  const healthStatus = {
    status: 'healthy',
    timestamp: new Date().toISOString(),
    checks: {},
    errors: []
  }

  try {
    console.log('=== HEALTH CHECK START ===');
    
    // Get current schema info
    const currentSchema = configService.getCurrentSchema();
    console.log('Current schema:', currentSchema);
    
    healthStatus.checks.database_connection = { status: 'checking...' };
    
    // Test basic database connection
    console.log('Testing basic database connection...');
    const basicTest = await postgresService.query('SELECT 1 as test');
    healthStatus.checks.database_connection = { 
      status: 'healthy', 
      result: convertBigIntToNumber(basicTest.rows[0])
    };
    console.log('✓ Basic database connection OK');

    // Test public schema access
    console.log('Testing public schema access...');
    healthStatus.checks.public_schema = { status: 'checking...' };
    
    try {
      const publicTest = await postgresService.query('SELECT COUNT(*) as count FROM public.tenants');
      const tenantCount = Number(publicTest.rows[0].count); // Convert BigInt to number
      healthStatus.checks.public_schema = { 
        status: 'healthy', 
        tenant_count: tenantCount
      };
      console.log('✓ Public schema access OK, tenants:', tenantCount);
    } catch (error) {
      healthStatus.checks.public_schema = { 
        status: 'error', 
        message: error.message 
      };
      healthStatus.errors.push(`Public schema error: ${error.message}`);
      console.error('✗ Public schema error:', error.message);
    }

    // Test current schema access if not public
    if (currentSchema !== 'public') {
      console.log(`Testing tenant schema access: ${currentSchema}`);
      healthStatus.checks.tenant_schema = { status: 'checking...' };
      
      try {
        // First check if schema exists
        const schemaCheck = await postgresService.query(
          'SELECT schema_name FROM information_schema.schemata WHERE schema_name = $1',
          [currentSchema]
        );
        
        if (schemaCheck.rows.length === 0) {
          healthStatus.checks.tenant_schema = { 
            status: 'error', 
            message: `Schema ${currentSchema} does not exist` 
          };
          healthStatus.errors.push(`Tenant schema ${currentSchema} does not exist`);
          console.error(`✗ Schema ${currentSchema} does not exist`);
        } else {
          // Check if profiles table exists in tenant schema
          const tableCheck = await postgresService.query(
            `SELECT table_name FROM information_schema.tables WHERE table_schema = $1 AND table_name = 'profiles'`,
            [currentSchema]
          );
          
          if (tableCheck.rows.length === 0) {
            healthStatus.checks.tenant_schema = { 
              status: 'error', 
              message: `Profiles table does not exist in schema ${currentSchema}` 
            };
            healthStatus.errors.push(`Profiles table missing in ${currentSchema}`);
            console.error(`✗ Profiles table missing in schema ${currentSchema}`);
          } else {
            // Test profiles table access
            const profilesTest = await postgresService.query(
              `SELECT COUNT(*) as profile_count FROM "${currentSchema}".profiles`
            );
            const profileCount = Number(profilesTest.rows[0].profile_count); // Convert BigInt to number
            healthStatus.checks.tenant_schema = { 
              status: 'healthy', 
              schema: currentSchema,
              profile_count: profileCount
            };
            console.log(`✓ Tenant schema ${currentSchema} OK, profiles:`, profileCount);
          }
        }
      } catch (error) {
        healthStatus.checks.tenant_schema = { 
          status: 'error', 
          message: error.message 
        };
        healthStatus.errors.push(`Tenant schema error: ${error.message}`);
        console.error('✗ Tenant schema error:', error.message);
      }
    }

    // List all available tenant schemas
    console.log('Listing all tenant schemas...');
    try {
      const schemaList = await postgresService.query(
        "SELECT schema_name FROM information_schema.schemata WHERE schema_name LIKE 'tenant_%' ORDER BY schema_name"
      );
      healthStatus.checks.available_tenant_schemas = {
        status: 'healthy',
        count: schemaList.rows.length,
        schemas: schemaList.rows.map(row => row.schema_name)
      };
      console.log('Available tenant schemas:', schemaList.rows.map(row => row.schema_name));
    } catch (error) {
      healthStatus.checks.available_tenant_schemas = { 
        status: 'error', 
        message: error.message 
      };
      console.error('Error listing tenant schemas:', error.message);
    }

    // Overall health status
    if (healthStatus.errors.length > 0) {
      healthStatus.status = 'degraded';
    }

    console.log('=== HEALTH CHECK COMPLETE ===');
    console.log('Overall status:', healthStatus.status);
    
    // Convert any remaining BigInt values before sending response
    const responseBody = convertBigIntToNumber(healthStatus);
    ctx.response.body = responseBody;
    ctx.response.status = healthStatus.status === 'healthy' ? 200 : 503;

  } catch (error) {
    console.error('=== HEALTH CHECK FAILED ===');
    console.error('Critical error:', error.message);
    
    healthStatus.status = 'unhealthy';
    healthStatus.errors.push(`Critical error: ${error.message}`);
    
    const responseBody = convertBigIntToNumber(healthStatus);
    ctx.response.body = responseBody;
    ctx.response.status = 503;
  }
})

export default healthCheckRouter
