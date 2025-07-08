
import { Router } from "https://deno.land/x/oak@v12.6.1/mod.ts";
import { postgresService } from "../services/postgresService.ts";

const router = new Router();

// Health check endpoint to test database connectivity
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

    // Test public schema tables first
    console.log('🏗️ Testing public schema tables...');
    
    // Test roles table in public schema
    console.log('👥 Testing public roles table...');
    const publicRolesTest = await postgresService.query('SELECT id, name FROM public.roles LIMIT 5');
    console.log('✅ Public roles table test:', publicRolesTest.rows);

    // Test if tenant schema exists
    console.log('🏠 Testing tenant schema existence...');
    const tenantSchemaTest = await postgresService.query(`
      SELECT schema_name 
      FROM information_schema.schemata 
      WHERE schema_name = 'tenant_test_clinic'
    `);
    console.log('✅ Tenant schema test:', tenantSchemaTest.rows);

    let tenantProfilesCount = 0;
    let tenantTablesCount = 0;

    if (tenantSchemaTest.rows.length > 0) {
      // Test tenant profiles table
      console.log('👤 Testing tenant profiles table...');
      try {
        const tenantProfileCount = await postgresService.query('SELECT COUNT(*) as count FROM tenant_test_clinic.profiles');
        tenantProfilesCount = tenantProfileCount.rows[0]?.count || 0;
        console.log('✅ Tenant profile count:', tenantProfilesCount);
      } catch (error) {
        console.log('⚠️ Tenant profiles table not accessible:', error.message);
      }

      // Count tenant tables
      console.log('📊 Counting tenant tables...');
      try {
        const tenantTablesQuery = await postgresService.query(`
          SELECT COUNT(*) as count 
          FROM information_schema.tables 
          WHERE table_schema = 'tenant_test_clinic'
        `);
        tenantTablesCount = tenantTablesQuery.rows[0]?.count || 0;
        console.log('✅ Tenant tables count:', tenantTablesCount);
      } catch (error) {
        console.log('⚠️ Could not count tenant tables:', error.message);
      }
    }

    // Test public schema tables count
    console.log('📊 Counting public tables...');
    const publicTablesQuery = await postgresService.query(`
      SELECT COUNT(*) as count 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      AND table_type = 'BASE TABLE'
    `);
    const publicTablesCount = publicTablesQuery.rows[0]?.count || 0;
    console.log('✅ Public tables count:', publicTablesCount);

    // Test UUID generation
    const testUserId = crypto.randomUUID();
    console.log('🔑 Generated test UUID:', testUserId);

    const responseData = {
      success: true,
      message: 'Database connectivity test passed',
      tests: {
        connection: connectionTest.rows.length > 0,
        publicRolesTable: publicRolesTest.rows.length >= 0, // Can be 0 if empty
        tenantSchemaExists: tenantSchemaTest.rows.length > 0,
        tenantProfilesCount: tenantProfilesCount,
        publicTablesCount: publicTablesCount,
        tenantTablesCount: tenantTablesCount,
        testUuid: testUserId
      },
      schemas: {
        public: {
          tablesCount: publicTablesCount,
          rolesCount: publicRolesTest.rows.length
        },
        tenant: {
          schemaExists: tenantSchemaTest.rows.length > 0,
          tablesCount: tenantTablesCount,
          profilesCount: tenantProfilesCount
        }
      },
      timestamp: new Date().toISOString(),
      server: 'Deno backend',
      corsHeaders: Object.fromEntries(ctx.response.headers.entries())
    };

    console.log('🏥 Setting successful response...');
    console.log('📤 Response data:', responseData);
    
    ctx.response.status = 200;
    ctx.response.body = responseData;
    
    console.log('🏥 Health check response set successfully');
    console.log('📤 Final response status:', ctx.response.status);
    console.log('📤 Final response headers:', Object.fromEntries(ctx.response.headers.entries()));
    
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
      timestamp: new Date().toISOString(),
      server: 'Deno backend',
      corsHeaders: Object.fromEntries(ctx.response.headers.entries())
    };
    
    console.log('🏥 Setting error response...');
    console.log('📤 Error response data:', errorResponse);
    
    ctx.response.status = 500;
    ctx.response.body = errorResponse;
    
    console.log('📤 Error response status:', ctx.response.status);
    console.log('📤 Error response headers:', Object.fromEntries(ctx.response.headers.entries()));
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
