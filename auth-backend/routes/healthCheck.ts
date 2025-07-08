
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

    // Test basic database functionality
    console.log('🏗️ Testing database schema...');
    
    // Check if profiles table exists in public schema
    console.log('👥 Checking if profiles table exists...');
    const profilesTableCheck = await postgresService.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'profiles'
      ) as table_exists
    `);
    const profilesTableExists = profilesTableCheck.rows[0]?.table_exists || false;
    console.log('✅ Profiles table exists:', profilesTableExists);

    // Check if roles table exists in public schema
    console.log('🏛️ Checking if roles table exists...');
    const rolesTableCheck = await postgresService.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'roles'
      ) as table_exists
    `);
    const rolesTableExists = rolesTableCheck.rows[0]?.table_exists || false;
    console.log('✅ Roles table exists:', rolesTableExists);

    // Check if tenants table exists
    console.log('🏠 Checking if tenants table exists...');
    const tenantsTableCheck = await postgresService.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'tenants'
      ) as table_exists
    `);
    const tenantsTableExists = tenantsTableCheck.rows[0]?.table_exists || false;
    console.log('✅ Tenants table exists:', tenantsTableExists);

    // Count records if tables exist
    let profilesCount = 0;
    let rolesCount = 0;
    let tenantsCount = 0;

    if (profilesTableExists) {
      try {
        const profileCountResult = await postgresService.query('SELECT COUNT(*) as count FROM public.profiles');
        profilesCount = parseInt(profileCountResult.rows[0]?.count || '0');
        console.log('✅ Profiles count:', profilesCount);
      } catch (error) {
        console.log('⚠️ Could not count profiles:', error.message);
      }
    }

    if (rolesTableExists) {
      try {
        const roleCountResult = await postgresService.query('SELECT COUNT(*) as count FROM public.roles');
        rolesCount = parseInt(roleCountResult.rows[0]?.count || '0');
        console.log('✅ Roles count:', rolesCount);
      } catch (error) {
        console.log('⚠️ Could not count roles:', error.message);
      }
    }

    if (tenantsTableExists) {
      try {
        const tenantCountResult = await postgresService.query('SELECT COUNT(*) as count FROM public.tenants');
        tenantsCount = parseInt(tenantCountResult.rows[0]?.count || '0');
        console.log('✅ Tenants count:', tenantsCount);
      } catch (error) {
        console.log('⚠️ Could not count tenants:', error.message);
      }
    }

    // Test UUID generation
    const testUserId = crypto.randomUUID();
    console.log('🔑 Generated test UUID:', testUserId);

    // Count total tables in public schema
    console.log('📊 Counting total public tables...');
    const publicTablesQuery = await postgresService.query(`
      SELECT COUNT(*) as count 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      AND table_type = 'BASE TABLE'
    `);
    const publicTablesCount = parseInt(publicTablesQuery.rows[0]?.count || '0');
    console.log('✅ Public tables count:', publicTablesCount);

    const responseData = {
      success: true,
      message: 'Database connectivity test passed',
      tests: {
        connection: connectionTest.rows.length > 0,
        profilesTableExists: profilesTableExists,
        rolesTableExists: rolesTableExists,
        tenantsTableExists: tenantsTableExists,
        testUuid: testUserId
      },
      database: {
        publicTablesCount: publicTablesCount,
        profilesCount: profilesCount,
        rolesCount: rolesCount,
        tenantsCount: tenantsCount
      },
      warnings: {
        missingTables: [] as string[],
        recommendations: [] as string[]
      },
      timestamp: new Date().toISOString(),
      server: 'Deno backend with Neon PostgreSQL',
      corsHeaders: Object.fromEntries(ctx.response.headers.entries())
    };

    // Add warnings for missing critical tables
    if (!profilesTableExists) {
      responseData.warnings.missingTables.push('profiles');
      responseData.warnings.recommendations.push('Run Supabase migrations to create profiles table');
    }
    if (!rolesTableExists) {
      responseData.warnings.missingTables.push('roles');
      responseData.warnings.recommendations.push('Run Supabase migrations to create roles table');
    }
    if (!tenantsTableExists) {
      responseData.warnings.missingTables.push('tenants');
      responseData.warnings.recommendations.push('Run Supabase migrations to create tenants table');
    }

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
      recommendations: [
        'Check if your Neon database connection string is correct',
        'Verify that your database has the required tables',
        'Run Supabase migrations to create the necessary schema',
        'Check if you need to sync your Neon database with Supabase schema'
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
