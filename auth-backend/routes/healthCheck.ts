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

    // Test profiles table structure
    console.log('🏗️ Testing profiles table structure...');
    const profilesStructure = await postgresService.query(`
      SELECT column_name, data_type, is_nullable 
      FROM information_schema.columns 
      WHERE table_name = 'profiles' AND table_schema = 'public'
      ORDER BY ordinal_position
    `);
    console.log('✅ Profiles table structure:', profilesStructure.rows);

    // Test roles table
    console.log('👥 Testing roles table...');
    const rolesTest = await postgresService.query('SELECT id, name FROM roles LIMIT 5');
    console.log('✅ Roles table test:', rolesTest.rows);

    // Test a simple profile query (should return empty if no profiles exist)
    console.log('👤 Testing profile count...');
    const profileCount = await postgresService.query('SELECT COUNT(*) as count FROM profiles');
    console.log('✅ Profile count:', profileCount.rows);

    // Test user creation simulation (without actually creating)
    const testUserId = crypto.randomUUID();
    console.log('🔑 Generated test UUID:', testUserId);

    const responseData = {
      success: true,
      message: 'Database connectivity test passed',
      tests: {
        connection: connectionTest.rows.length > 0,
        profilesTable: profilesStructure.rows.length > 0,
        rolesTable: rolesTest.rows.length > 0,
        profileCount: profileCount.rows[0]?.count || 0,
        testUuid: testUserId
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
      
      // Check if email already exists
      const existingUser = await postgresService.query(
        'SELECT id, email FROM profiles WHERE email = $1',
        [email]
      );

      // Check if role exists
      const roleCheck = await postgresService.query(
        'SELECT id, name FROM roles WHERE name = $1',
        [role]
      );

      ctx.response.status = 200;
      ctx.response.body = {
        success: true,
        testMode: true,
        validations: {
          emailAvailable: existingUser.rows.length === 0,
          roleExists: roleCheck.rows.length > 0,
          availableRoles: roleCheck.rows
        },
        wouldCreate: {
          email,
          fullName,
          role,
          userId: crypto.randomUUID()
        },
        timestamp: new Date().toISOString()
      };
    } else {
      // Actually create the user (we'll implement this after testing)
      ctx.response.status = 200;
      ctx.response.body = {
        success: true,
        message: 'Actual user creation not implemented yet - use testMode: true first',
        timestamp: new Date().toISOString()
      };
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
