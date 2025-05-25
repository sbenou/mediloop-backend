
import { supabase } from '@/lib/supabase';
import { sendConnectionRequestNotification } from './doctorConnectionNotifications';
import { createNotification, createTenantNotification } from './notifications';

// Test accounts
const TEST_ACCOUNTS = {
  patient: {
    id: '7b8de1a4-fa25-46b4-8487-ed8fdae18eef',
    email: 'benou004@hotmail.com',
    name: 'sam testington',
    password: 'test123456'
  },
  doctor: {
    id: '697f1f0e-17a9-4ca6-a607-cf5df7b2be85', 
    email: 'ridam57@yahoo.fr',
    name: 'Tim Burton',
    password: 'test123456'
  },
  pharmacist: {
    email: 'saady.london@gmail.com',
    password: 'test123456'
  }
};

interface TestResult {
  test: string;
  success: boolean;
  data?: any;
  error?: string;
  duration: number;
}

export class ConnectionNotificationTester {
  private results: TestResult[] = [];
  private testTimeout = 30000; // 30 second timeout per test
  private originalSession: any = null;

  private async runTest(testName: string, testFn: () => Promise<any>): Promise<TestResult> {
    console.log(`🧪 Running test: ${testName}`);
    const startTime = Date.now();
    
    try {
      // Add timeout wrapper to prevent hanging tests
      const timeoutPromise = new Promise((_, reject) => {
        setTimeout(() => reject(new Error(`Test timeout after ${this.testTimeout}ms`)), this.testTimeout);
      });
      
      const data = await Promise.race([testFn(), timeoutPromise]);
      const duration = Date.now() - startTime;
      const result = { test: testName, success: true, data, duration };
      this.results.push(result);
      console.log(`✅ ${testName} - Success (${duration}ms)`, data);
      return result;
    } catch (error) {
      const duration = Date.now() - startTime;
      const errorMessage = error instanceof Error ? error.message : String(error);
      const result = { 
        test: testName, 
        success: false, 
        error: errorMessage, 
        duration 
      };
      this.results.push(result);
      console.error(`❌ ${testName} - Failed (${duration}ms):`, error);
      return result;
    }
  }

  private async authenticateAsDoctor() {
    console.log('🔐 Authenticating as doctor for tests...');
    
    try {
      // Sign in as doctor
      const { data, error } = await supabase.auth.signInWithPassword({
        email: TEST_ACCOUNTS.doctor.email,
        password: TEST_ACCOUNTS.doctor.password
      });

      if (error) {
        console.log('Doctor sign-in failed, attempting to sign up...');
        
        // Try to sign up the doctor if sign-in fails
        const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
          email: TEST_ACCOUNTS.doctor.email,
          password: TEST_ACCOUNTS.doctor.password,
          options: {
            data: {
              full_name: TEST_ACCOUNTS.doctor.name,
              role: 'doctor'
            }
          }
        });

        if (signUpError) {
          throw new Error(`Failed to authenticate doctor: ${signUpError.message}`);
        }

        console.log('Doctor signed up successfully');
        return signUpData;
      }

      console.log('Doctor authenticated successfully');
      return data;
    } catch (error) {
      console.error('Authentication error:', error);
      throw error;
    }
  }

  private async restoreOriginalSession() {
    if (this.originalSession) {
      console.log('🔄 Restoring original session...');
      await supabase.auth.setSession(this.originalSession);
    } else {
      console.log('🚪 Signing out test user...');
      await supabase.auth.signOut();
    }
  }

  async testDatabaseConnectivity() {
    return this.runTest('Database Connectivity', async () => {
      console.log('Testing database connection...');
      const { data, error } = await supabase.from('profiles').select('count').limit(1);
      
      if (error) {
        console.error('Database connectivity error:', error);
        throw error;
      }
      
      console.log('Database connection successful, data:', data);
      return { message: 'Database connection successful', count: data?.length || 0 };
    });
  }

  async testUserProfiles() {
    return this.runTest('User Profiles Check', async () => {
      console.log('Checking user profiles...');
      
      // Get current session
      const { data: sessionData } = await supabase.auth.getSession();
      const currentUserId = sessionData?.session?.user?.id;

      if (!currentUserId) {
        throw new Error('No authenticated user found for profile creation');
      }

      console.log('Current authenticated user:', currentUserId);

      // Check if profile exists for current user
      const { data: existingProfile, error: profileError } = await supabase
        .from('profiles')
        .select('id, full_name, email, role, tenant_id')
        .eq('id', currentUserId)
        .maybeSingle();

      if (profileError) {
        console.error('Error checking profile:', profileError);
        throw profileError;
      }

      let finalProfile = existingProfile;

      // Create profile if it doesn't exist
      if (!existingProfile) {
        console.log('Creating profile for authenticated user...');
        const { data: newProfile, error: createError } = await supabase
          .from('profiles')
          .insert({
            id: currentUserId,
            full_name: TEST_ACCOUNTS.doctor.name,
            email: TEST_ACCOUNTS.doctor.email,
            role: 'doctor'
          })
          .select()
          .single();

        if (createError) {
          console.error('Profile creation error:', createError);
          throw createError;
        }

        finalProfile = newProfile;
        console.log('Profile created successfully:', finalProfile);
      } else {
        console.log('Profile already exists:', finalProfile);
      }

      // Also check patient profile (for testing purposes)
      const { data: patientProfile } = await supabase
        .from('profiles')
        .select('id, full_name, email, role, tenant_id')
        .eq('id', TEST_ACCOUNTS.patient.id)
        .maybeSingle();

      return {
        currentUser: finalProfile,
        patient: patientProfile,
        doctorHasTenant: !!finalProfile?.tenant_id,
        patientHasTenant: !!patientProfile?.tenant_id,
        sameTenant: finalProfile?.tenant_id === patientProfile?.tenant_id
      };
    });
  }

  async testNotificationTableAccess() {
    return this.runTest('Notification Table Access', async () => {
      console.log('Testing notification table access...');
      
      // Get current session
      const { data: sessionData } = await supabase.auth.getSession();
      const currentUserId = sessionData?.session?.user?.id;

      if (!currentUserId) {
        throw new Error('No authenticated user for notification test');
      }

      // Test read access
      const { data: readTest, error: readError } = await supabase
        .from('notifications')
        .select('id, user_id, type, title')
        .limit(5);

      if (readError) {
        console.error('Read access error:', readError);
        throw new Error(`Read access failed: ${readError.message}`);
      }

      // Test write access with authenticated user
      const testNotification = {
        user_id: currentUserId,
        type: 'test',
        title: 'Test Notification',
        message: 'This is a test notification for access testing',
        tenant_id: null
      };

      console.log('Attempting to insert test notification:', testNotification);
      const { data: writeTest, error: writeError } = await supabase
        .from('notifications')
        .insert(testNotification)
        .select()
        .single();

      if (writeError) {
        console.error('Write access error:', writeError);
        throw new Error(`Write access failed: ${writeError.message}`);
      }

      // Clean up test notification
      await supabase.from('notifications').delete().eq('id', writeTest.id);

      return {
        readAccess: true,
        writeAccess: true,
        testNotificationId: writeTest.id,
        existingNotifications: readTest?.length || 0,
        authenticatedUserId: currentUserId
      };
    });
  }

  async testTenantContext() {
    return this.runTest('Tenant Context Check', async () => {
      console.log('Testing tenant context...');
      
      // Get current session and check for tenant claims
      const { data: session } = await supabase.auth.getSession();
      const claims = session?.session?.user?.app_metadata || {};

      return {
        hasSession: !!session?.session,
        userId: session?.session?.user?.id,
        claims,
        hasTenantClaim: !!claims.tenant_id || !!claims.tenant,
        setClaimFunctionExists: true
      };
    });
  }

  async testDirectNotificationCreation() {
    return this.runTest('Direct Notification Creation', async () => {
      console.log('Testing direct notification creation...');
      
      // Get current session
      const { data: sessionData } = await supabase.auth.getSession();
      const currentUserId = sessionData?.session?.user?.id;

      if (!currentUserId) {
        throw new Error('No authenticated user for notification creation');
      }

      const notificationData = {
        user_id: currentUserId,
        type: 'connection_request',
        title: 'Test Connection Request',
        message: `${TEST_ACCOUNTS.patient.name} has requested to connect with you (TEST)`,
        read: false,
        tenant_id: null
      };

      console.log('Inserting notification:', notificationData);
      const { data, error } = await supabase
        .from('notifications')
        .insert(notificationData)
        .select()
        .single();

      if (error) {
        console.error('Direct notification creation error:', error);
        throw new Error(`Direct notification creation failed: ${error.message}`);
      }

      // Verify it was created
      const { data: verification, error: verifyError } = await supabase
        .from('notifications')
        .select('*')
        .eq('id', data.id)
        .single();

      if (verifyError) {
        console.error('Verification error:', verifyError);
        throw new Error(`Verification failed: ${verifyError.message}`);
      }

      return {
        created: data,
        verified: verification,
        notificationId: data.id,
        authenticatedUserId: currentUserId
      };
    });
  }

  async testUtilityFunction() {
    return this.runTest('Utility Function Test', async () => {
      console.log('Testing utility function...');
      
      // Get current session
      const { data: sessionData } = await supabase.auth.getSession();
      const currentUserId = sessionData?.session?.user?.id;

      if (!currentUserId) {
        throw new Error('No authenticated user for utility function test');
      }

      const result = await createNotification({
        userId: currentUserId,
        type: 'connection_request',
        title: 'Test via Utility',
        message: `${TEST_ACCOUNTS.patient.name} test via utility function`,
        tenantId: null
      });

      if (!result) {
        console.error('Utility function returned null');
        throw new Error('Utility function returned null - check console for errors');
      }

      console.log('Utility function result:', result);
      return result;
    });
  }

  async testTenantAwareNotification() {
    return this.runTest('Tenant-Aware Notification', async () => {
      console.log('Testing tenant-aware notification...');
      
      // Get current session
      const { data: sessionData } = await supabase.auth.getSession();
      const currentUserId = sessionData?.session?.user?.id;

      if (!currentUserId) {
        throw new Error('No authenticated user for tenant-aware test');
      }

      const result = await createTenantNotification(
        currentUserId,
        'connection_request',
        'Test Tenant-Aware',
        `${TEST_ACCOUNTS.patient.name} test tenant-aware notification`
      );

      if (!result) {
        console.error('Tenant-aware function returned null');
        throw new Error('Tenant-aware function returned null - check console for errors');
      }

      console.log('Tenant-aware notification result:', result);
      return result;
    });
  }

  async testConnectionRequestCreation() {
    return this.runTest('Connection Request Creation', async () => {
      console.log('Testing connection request creation...');
      
      // Get current session
      const { data: sessionData } = await supabase.auth.getSession();
      const currentUserId = sessionData?.session?.user?.id;

      if (!currentUserId) {
        throw new Error('No authenticated user for connection test');
      }

      // First, clean up any existing connection
      await supabase
        .from('doctor_patient_connections')
        .delete()
        .eq('doctor_id', currentUserId)
        .eq('patient_id', TEST_ACCOUNTS.patient.id);

      // Create a new connection request using authenticated user as doctor
      const connectionData = {
        doctor_id: currentUserId,
        patient_id: TEST_ACCOUNTS.patient.id,
        status: 'pending'
      };
      
      console.log('Creating connection:', connectionData);
      const { data, error } = await supabase
        .from('doctor_patient_connections')
        .insert(connectionData)
        .select()
        .single();

      if (error) {
        console.error('Connection creation error:', error);
        throw new Error(`Connection creation failed: ${error.message}`);
      }

      return {
        connection: data,
        canCreateConnections: true,
        authenticatedUserId: currentUserId
      };
    });
  }

  async testFullConnectionFlow() {
    return this.runTest('Full Connection Notification Flow', async () => {
      console.log('Testing full connection flow...');
      
      // Get current session
      const { data: sessionData } = await supabase.auth.getSession();
      const currentUserId = sessionData?.session?.user?.id;

      if (!currentUserId) {
        throw new Error('No authenticated user for connection flow test');
      }

      const result = await sendConnectionRequestNotification(
        currentUserId,
        TEST_ACCOUNTS.patient.name
      );

      if (!result) {
        console.error('Connection notification function returned null');
        throw new Error('Connection notification function returned null');
      }

      // Verify the notification exists
      const { data: verification, error: verifyError } = await supabase
        .from('notifications')
        .select('*')
        .eq('id', result.id)
        .single();

      if (verifyError) {
        console.error('Verification error:', verifyError);
        throw new Error(`Verification failed: ${verifyError.message}`);
      }

      return {
        notification: result,
        verification,
        authenticatedUserId: currentUserId
      };
    });
  }

  async runAllTests() {
    console.log('🚀 Starting Connection Notification Test Suite');
    console.log('Test Accounts:', TEST_ACCOUNTS);
    
    this.results = [];

    try {
      // Store original session
      const { data: originalSessionData } = await supabase.auth.getSession();
      this.originalSession = originalSessionData?.session;

      // Authenticate as doctor for tests
      await this.authenticateAsDoctor();

      // Run tests in sequence with individual error handling
      await this.testDatabaseConnectivity();
      await this.testUserProfiles();
      await this.testNotificationTableAccess();
      await this.testTenantContext();
      await this.testDirectNotificationCreation();
      await this.testUtilityFunction();
      await this.testTenantAwareNotification();
      await this.testConnectionRequestCreation();
      await this.testFullConnectionFlow();
    } catch (error) {
      console.error('Test suite execution error:', error);
      // Don't throw here, let individual tests handle their own errors
    } finally {
      // Always restore original session
      await this.restoreOriginalSession();
    }

    // Generate summary
    const summary = this.generateSummary();
    console.log('📊 Test Suite Complete:', summary);
    
    return {
      results: this.results,
      summary
    };
  }

  private generateSummary() {
    const total = this.results.length;
    const passed = this.results.filter(r => r.success).length;
    const failed = this.results.filter(r => !r.success).length;
    const totalTime = this.results.reduce((sum, r) => sum + r.duration, 0);

    return {
      total,
      passed,
      failed,
      successRate: `${Math.round((passed / total) * 100)}%`,
      totalTime: `${totalTime}ms`,
      failedTests: this.results.filter(r => !r.success).map(r => ({
        test: r.test,
        error: r.error
      }))
    };
  }

  // Clean up any test notifications
  async cleanup() {
    console.log('🧹 Cleaning up test notifications...');
    
    try {
      // Clean up as the authenticated user
      const { data: sessionData } = await supabase.auth.getSession();
      const currentUserId = sessionData?.session?.user?.id;

      if (currentUserId) {
        const { error } = await supabase
          .from('notifications')
          .delete()
          .ilike('title', '%test%')
          .eq('user_id', currentUserId);

        if (error) {
          console.warn('Cleanup warning:', error.message);
        } else {
          console.log('✅ Cleanup completed');
        }
      }
    } catch (error) {
      console.warn('Cleanup failed:', error);
    }
  }
}

export async function runConnectionNotificationTests() {
  const tester = new ConnectionNotificationTester();
  
  try {
    const results = await tester.runAllTests();
    await tester.cleanup();
    return results;
  } catch (error) {
    console.error('Test suite failed:', error);
    await tester.cleanup();
    throw error;
  }
}

export async function debugFirebaseIntegration() {
  console.log('🔥 Firebase Integration Debug');
  
  try {
    // Check if Firebase is initialized
    const isFirebaseSupported = typeof window !== 'undefined' && 
                               'Notification' in window && 
                               window === window.top;
    
    console.log('Firebase context:', {
      isFirebaseSupported,
      notificationPermission: typeof window !== 'undefined' ? Notification.permission : 'unknown',
      windowContext: typeof window !== 'undefined' ? 'browser' : 'server',
      isTopLevel: typeof window !== 'undefined' ? window === window.top : false
    });

    // Test notification creation in Firebase context
    if (isFirebaseSupported && Notification.permission === 'granted') {
      console.log('Testing browser notification...');
      
      try {
        const notification = new Notification('Test Notification', {
          body: 'Testing Firebase notification system',
          icon: '/favicon.ico'
        });
        
        setTimeout(() => notification.close(), 3000);
        console.log('✅ Browser notification test successful');
      } catch (error) {
        console.error('❌ Browser notification test failed:', error);
      }
    }

    return {
      isFirebaseSupported,
      notificationPermission: typeof window !== 'undefined' ? Notification.permission : 'unknown',
      browserNotificationTest: isFirebaseSupported
    };
  } catch (error) {
    console.error('Firebase debug failed:', error);
    return { error: error instanceof Error ? error.message : String(error) };
  }
}
