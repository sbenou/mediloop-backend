
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
  private testTimeout = 15000; // Reduced to 15 seconds per test
  private originalSession: any = null;
  private isTestingStopped = false;

  private async runTest(testName: string, testFn: () => Promise<any>): Promise<TestResult> {
    if (this.isTestingStopped) {
      return { test: testName, success: false, error: 'Testing stopped', duration: 0 };
    }

    console.log(`🧪 Running test: ${testName}`);
    const startTime = Date.now();
    
    try {
      // Add timeout wrapper to prevent hanging tests
      const timeoutPromise = new Promise((_, reject) => {
        setTimeout(() => {
          console.log(`⏰ Test "${testName}" timed out after ${this.testTimeout}ms`);
          reject(new Error(`Test timeout after ${this.testTimeout}ms`));
        }, this.testTimeout);
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
      // First, ensure we're signed out
      await supabase.auth.signOut();
      console.log('Signed out existing session');
      
      // Wait a bit for the sign out to complete
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Sign in as doctor with timeout
      const signInPromise = supabase.auth.signInWithPassword({
        email: TEST_ACCOUNTS.doctor.email,
        password: TEST_ACCOUNTS.doctor.password
      });
      
      const timeoutPromise = new Promise((_, reject) => {
        setTimeout(() => reject(new Error('Authentication timeout')), 10000);
      });
      
      const { data, error } = await Promise.race([signInPromise, timeoutPromise]) as any;

      if (error) {
        console.log('Doctor sign-in failed:', error.message);
        throw new Error(`Failed to authenticate doctor: ${error.message}`);
      }

      console.log('Doctor authenticated successfully');
      
      // Wait for session to be established
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Verify session
      const { data: sessionData } = await supabase.auth.getSession();
      if (!sessionData?.session) {
        throw new Error('Session not established after authentication');
      }
      
      console.log('Session verified for user:', sessionData.session.user.id);
      return data;
    } catch (error) {
      console.error('Authentication error:', error);
      throw error;
    }
  }

  private async restoreOriginalSession() {
    try {
      console.log('🔄 Cleaning up test session...');
      await supabase.auth.signOut();
      console.log('Test session cleaned up');
    } catch (error) {
      console.warn('Error during cleanup:', error);
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
      
      // Get current session with timeout
      const sessionPromise = supabase.auth.getSession();
      const timeoutPromise = new Promise((_, reject) => {
        setTimeout(() => reject(new Error('Session fetch timeout')), 5000);
      });
      
      const { data: sessionData } = await Promise.race([sessionPromise, timeoutPromise]) as any;
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

      return {
        currentUser: finalProfile,
        doctorHasTenant: !!finalProfile?.tenant_id
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

      return {
        created: data,
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

      return {
        notification: result,
        authenticatedUserId: currentUserId
      };
    });
  }

  async runAllTests() {
    console.log('🚀 Starting Connection Notification Test Suite');
    console.log('Test Accounts:', TEST_ACCOUNTS);
    
    this.results = [];
    this.isTestingStopped = false;

    try {
      // Authenticate as doctor for tests with timeout
      console.log('Starting authentication process...');
      const authPromise = this.authenticateAsDoctor();
      const authTimeoutPromise = new Promise((_, reject) => {
        setTimeout(() => {
          this.isTestingStopped = true;
          reject(new Error('Authentication timeout - stopping tests'));
        }, 15000);
      });
      
      await Promise.race([authPromise, authTimeoutPromise]);
      
      if (this.isTestingStopped) {
        throw new Error('Testing stopped due to authentication timeout');
      }

      console.log('Authentication successful, running tests...');

      // Run tests in sequence with individual error handling
      await this.testDatabaseConnectivity();
      
      if (!this.isTestingStopped) await this.testUserProfiles();
      if (!this.isTestingStopped) await this.testNotificationTableAccess();
      if (!this.isTestingStopped) await this.testDirectNotificationCreation();
      if (!this.isTestingStopped) await this.testUtilityFunction();
      if (!this.isTestingStopped) await this.testFullConnectionFlow();
      
    } catch (error) {
      console.error('Test suite execution error:', error);
      this.isTestingStopped = true;
      // Add error result
      this.results.push({
        test: 'Test Suite Execution',
        success: false,
        error: error instanceof Error ? error.message : String(error),
        duration: 0
      });
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
