import { Router } from "https://deno.land/x/oak@v12.6.1/mod.ts";
import { postgresService } from "../services/postgresService.ts";

const router = new Router();

// Health check endpoint to test database connectivity and multi-tenant schema
router.get("/api/health", async (ctx) => {
  console.log('\n🏥 === HEALTH CHECK ROUTE ENTERED ===');
  console.log('🏥 Request method:', ctx.request.method);
  console.log('🏥 Request URL:', ctx.request.url.pathname);
  console.log('🏥 Request headers:', Object.fromEntries(ctx.request.headers.entries()));
  console.log('🏥 Current response headers:', Object.fromEntries(ctx.response.headers.entries()));
  
  try {
    console.log('🔌 Testing database connection...');
    const connectionTest = await postgresService.query('SELECT 1 as test');
    console.log('✅ Database connection test:', connectionTest.rows);

    console.log('🏗️ Testing database schema structure...');
    
    // First, check what schemas exist
    console.log('📋 Checking available schemas...');
    const schemasQuery = await postgresService.query(`
      SELECT schema_name 
      FROM information_schema.schemata 
      WHERE schema_name NOT IN ('information_schema', 'pg_catalog', 'pg_toast')
      ORDER BY schema_name
    `);
    const availableSchemas = schemasQuery.rows.map(row => row.schema_name);
    console.log('✅ Available schemas:', availableSchemas);

    // Check for tenant schemas specifically
    const tenantSchemas = availableSchemas.filter(schema => schema.startsWith('tenant_'));
    console.log('🏠 Tenant schemas found:', tenantSchemas);

    // Check public schema tables
    console.log('🔍 Checking public schema tables...');
    const publicTablesQuery = await postgresService.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      AND table_type = 'BASE TABLE'
      ORDER BY table_name
    `);
    const publicTables = publicTablesQuery.rows.map(row => row.table_name);
    console.log('✅ Public schema tables:', publicTables);

    // Check if core tables exist in public schema
    const publicRolesExists = publicTables.includes('roles');
    const publicTenantsExists = publicTables.includes('tenants');
    const publicProfilesExists = publicTables.includes('profiles');

    console.log('📊 Public schema table status:');
    console.log('  - roles:', publicRolesExists);
    console.log('  - tenants:', publicTenantsExists);
    console.log('  - profiles:', publicProfilesExists);

    // Check tenant schema tables (if any tenant schemas exist)
    let tenantSchemaInfo = {};
    if (tenantSchemas.length > 0) {
      console.log('🏘️ Analyzing tenant schemas...');
      
      for (const schema of tenantSchemas.slice(0, 3)) { // Check first 3 tenant schemas
        try {
          console.log(`🔍 Checking schema: ${schema}`);
          
          const tenantTablesQuery = await postgresService.query(`
            SELECT table_name 
            FROM information_schema.tables 
            WHERE table_schema = $1 
            AND table_type = 'BASE TABLE'
            ORDER BY table_name
          `, [schema]);
          
          const tenantTables = tenantTablesQuery.rows.map(row => row.table_name);
          console.log(`✅ Tables in ${schema}:`, tenantTables);
          
          // Count records in key tables
          const tableCounts = {};
          for (const table of ['profiles', 'orders', 'products']) {
            if (tenantTables.includes(table)) {
              try {
                const countQuery = await postgresService.query(`SELECT COUNT(*) as count FROM "${schema}".${table}`);
                tableCounts[table] = parseInt(countQuery.rows[0]?.count || '0');
              } catch (error) {
                console.log(`⚠️ Could not count ${table} in ${schema}:`, error.message);
                tableCounts[table] = 'error';
              }
            }
          }
          
          tenantSchemaInfo[schema] = {
            tables: tenantTables,
            tableCount: tenantTables.length,
            recordCounts: tableCounts
          };
          
        } catch (error) {
          console.log(`❌ Error checking schema ${schema}:`, error.message);
          tenantSchemaInfo[schema] = { error: error.message };
        }
      }
    }

    // Count records in public tables
    let publicRecordCounts = {
      roles: 0,
      tenants: 0,
      profiles: 0
    };

    if (publicRolesExists) {
      try {
        const roleCountResult = await postgresService.query('SELECT COUNT(*) as count FROM public.roles');
        publicRecordCounts.roles = parseInt(roleCountResult.rows[0]?.count || '0');
        console.log('✅ Public roles count:', publicRecordCounts.roles);
      } catch (error) {
        console.log('⚠️ Could not count public roles:', error.message);
      }
    }

    if (publicTenantsExists) {
      try {
        const tenantCountResult = await postgresService.query('SELECT COUNT(*) as count FROM public.tenants');
        publicRecordCounts.tenants = parseInt(tenantCountResult.rows[0]?.count || '0');
        console.log('✅ Public tenants count:', publicRecordCounts.tenants);
      } catch (error) {
        console.log('⚠️ Could not count public tenants:', error.message);
      }
    }

    if (publicProfilesExists) {
      try {
        const profileCountResult = await postgresService.query('SELECT COUNT(*) as count FROM public.profiles');
        publicRecordCounts.profiles = parseInt(profileCountResult.rows[0]?.count || '0');
        console.log('✅ Public profiles count:', publicRecordCounts.profiles);
      } catch (error) {
        console.log('⚠️ Could not count public profiles:', error.message);
      }
    }

    // Test UUID generation
    const testUserId = crypto.randomUUID();
    console.log('🔑 Generated test UUID:', testUserId);

    // Count total public tables
    const publicTablesCount = publicTables.length;
    console.log('✅ Public tables count:', publicTablesCount);

    const responseData = {
      success: true,
      message: 'Multi-tenant database connectivity test passed',
      architecture: 'Multi-tenant with schema separation',
      tests: {
        connection: connectionTest.rows.length > 0,
        schemasFound: availableSchemas.length,
        tenantSchemasFound: tenantSchemas.length,
        testUuid: testUserId
      },
      database: {
        availableSchemas: availableSchemas,
        tenantSchemas: tenantSchemas,
        publicTables: publicTables,
        publicTablesCount: publicTablesCount,
        publicSchema: {
          rolesExists: publicRolesExists,
          tenantsExists: publicTenantsExists,
          profilesExists: publicProfilesExists,
          recordCounts: publicRecordCounts
        },
        tenantSchemas: tenantSchemaInfo
      },
      recommendations: [] as string[],
      timestamp: new Date().toISOString(),
      server: 'Deno backend with Neon PostgreSQL (Multi-tenant)',
      corsHeaders: Object.fromEntries(ctx.response.headers.entries())
    };

    // Add recommendations based on findings
    if (tenantSchemas.length === 0) {
      responseData.recommendations.push('No tenant schemas found - consider creating tenant schemas for multi-tenant architecture');
    }
    
    if (!publicRolesExists && !publicTenantsExists) {
      responseData.recommendations.push('Core management tables (roles, tenants) missing from public schema');
    }
    
    if (publicProfilesExists && tenantSchemas.length > 0) {
      responseData.recommendations.push('Profiles found in both public and tenant schemas - verify intended architecture');
    }
    
    if (tenantSchemas.length > 0 && Object.keys(tenantSchemaInfo).length > 0) {
      responseData.recommendations.push('Multi-tenant architecture detected - ensure tenant isolation is properly configured');
    }

    console.log('🏥 Setting successful response...');
    console.log('📤 Response data structure:', {
      success: responseData.success,
      schemasFound: responseData.tests.schemasFound,
      tenantSchemas: responseData.database.tenantSchemas.length,
      publicTables: responseData.database.publicTablesCount
    });
    
    ctx.response.status = 200;
    ctx.response.body = responseData;
    
    console.log('🏥 Health check response set successfully');
    console.log('📤 Final response status:', ctx.response.status);
    
  } catch (error) {
    console.error('❌ Health check failed:', error);
    console.error('❌ Error stack:', error.stack);
    console.error('❌ Error name:', error.name);
    console.error('❌ Error message:', error.message);
    
    const errorResponse = { 
      success: false,
      error: error.message,
      errorName: error.name,
      errorStack: error.stack,
      architecture: 'Multi-tenant (error during analysis)',
      recommendations: [
        'Check if your Neon database connection string is correct',
        'Verify database schema permissions',
        'Ensure tenant schemas are properly created',
        'Check if you need to run migrations to set up the database structure'
      ],
      timestamp: new Date().toISOString(),
      server: 'Deno backend with Neon PostgreSQL',
      corsHeaders: Object.fromEntries(ctx.response.headers.entries())
    };
    
    console.log('🏥 Setting error response...');
    console.log('📤 Error response data:', errorResponse);
    
    ctx.response.status = 500;
    ctx.response.body = errorResponse;
    
    console.log('📤 Error response status:', ctx.response.status);
  }
  
  console.log('🏥 === HEALTH CHECK ROUTE COMPLETED ===\n');
});

// Test user creation endpoint (safe test mode)
router.post("/api/test-user-creation", async (ctx) => {
  console.log('👤 === Testing User Creation Process ===');
  
  try {
    const body = await ctx.request.body().value;
    const { email, fullName, role = 'patient', testMode = true } = body;

    if (!email || !fullName) {
      throw new Error('Email and fullName are required');
    }

    console.log('Testing user creation for:', { email, fullName, role, testMode });

    if (testMode) {
      // Test mode - just validate the process without creating
      
      // Check if email already exists in tenant schema
      const existingUser = await postgresService.query(
        'SELECT id, email FROM tenant_test_clinic.profiles WHERE email = $1',
        [email]
      );

      // Check if role is valid (we're using simple text roles in tenant schema)
      const validRoles = ['patient', 'doctor', 'pharmacist', 'admin', 'superadmin'];
      const roleExists = validRoles.includes(role);

      ctx.response.status = 200;
      ctx.response.body = {
        success: true,
        testMode: true,
        validations: {
          emailAvailable: existingUser.rows.length === 0,
          roleExists: roleExists,
          availableRoles: validRoles,
          targetSchema: 'tenant_test_clinic'
        },
        wouldCreate: {
          email,
          fullName,
          role,
          userId: crypto.randomUUID(),
          schema: 'tenant_test_clinic'
        },
        timestamp: new Date().toISOString()
      };
    } else {
      // Actually create the user in tenant schema
      const newUserId = crypto.randomUUID();
      
      try {
        await postgresService.query(`
          INSERT INTO tenant_test_clinic.profiles (id, email, full_name, role, created_at, updated_at)
          VALUES ($1, $2, $3, $4, NOW(), NOW())
        `, [newUserId, email, fullName, role]);

        ctx.response.status = 200;
        ctx.response.body = {
          success: true,
          message: 'User created successfully in tenant schema',
          userId: newUserId,
          schema: 'tenant_test_clinic',
          timestamp: new Date().toISOString()
        };
      } catch (createError) {
        throw new Error(`Failed to create user: ${createError.message}`);
      }
    }

  } catch (error) {
    console.error('User creation test failed:', error);
    ctx.response.status = 500;
    ctx.response.body = { 
      success: false,
      error: error.message,
      timestamp: new Date().toISOString()
    };
  }
});

// Test email service connectivity
router.post("/api/test-email", async (ctx) => {
  console.log('📧 === Testing Email Service ===');
  
  try {
    const body = await ctx.request.body().value;
    const { email, testType = 'simple' } = body;

    if (!email) {
      throw new Error('Email is required');
    }

    const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");
    if (!RESEND_API_KEY) {
      throw new Error('RESEND_API_KEY not configured');
    }

    const emailContent = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="UTF-8">
      <title>Database Connectivity Test</title>
    </head>
    <body style="font-family: Arial, sans-serif; padding: 20px;">
      <h1>Database Connectivity Test</h1>
      <p>This is a test email to verify that your email service is working correctly.</p>
      <p>Test Type: ${testType}</p>
      <p>Backend: Deno with Neon PostgreSQL</p>
      <p>Schema: Multi-tenant with tenant_test_clinic</p>
      <p>Timestamp: ${new Date().toISOString()}</p>
    </body>
    </html>`;

    const res = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${RESEND_API_KEY}`,
      },
      body: JSON.stringify({
        from: 'Test <onboarding@resend.dev>',
        to: [email],
        subject: 'Database Connectivity Test Email',
        html: emailContent,
      }),
    });

    const responseText = await res.text();
    console.log('Email service response:', { status: res.status, body: responseText });

    if (!res.ok) {
      throw new Error(`Email service error: ${responseText}`);
    }

    const data = JSON.parse(responseText);

    ctx.response.status = 200;
    ctx.response.body = {
      success: true,
      message: 'Test email sent successfully',
      emailId: data.id,
      timestamp: new Date().toISOString()
    };

  } catch (error) {
    console.error('Email test failed:', error);
    ctx.response.status = 500;
    ctx.response.body = { 
      success: false,
      error: error.message,
      timestamp: new Date().toISOString()
    };
  }
});

export default router;
