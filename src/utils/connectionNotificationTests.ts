
import { supabase } from '@/lib/supabase';
import { sendConnectionRequestNotification } from './doctorConnectionNotifications';
import { createNotification, createTenantNotification } from './notifications';

// Test accounts - updated with more reliable test data
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
  private testTimeout = 30000; // Increased to 30 seconds
  private originalSession: any = null;
  private isTestingStopped = false;

  private async runTest(testName: string, testFn: () => Promise<any>): Promise<TestResult> {
    if (this.isTestingStopped) {
      return { test: testName, success: false, error: 'Testing stopped', duration: 0 };
    }

    console.log(`🧪 Running test: ${testName}`);
    const startTime = Date.now();
    
    try {
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
    console.log('🔐 Starting doctor authentication process...');
    
    try {
      // First, ensure we're signed out completely
      await supabase.auth.signOut();
      console.log('✅ Signed out existing session');
      
      // Wait for sign out to complete
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // Try to get current session to verify sign out
      const { data: currentSession } = await supabase.auth.getSession();
      if (currentSession?.session) {
        console.log('⚠️ Still have active session after signOut, forcing refresh');
        await supabase.auth.refreshSession();
        await new Promise(resolve => setTimeout(resolve, 1000));
      }
      
      console.log('🔑 Attempting to sign in as doctor with credentials:', {
        email: TEST_ACCOUNTS.doctor.email,
        hasPassword: !!TEST_ACCOUNTS.doctor.password
      });
      
      // Try signing in with the doctor account
      const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
        email: TEST_ACCOUNTS.doctor.email,
        password: TEST_ACCOUNTS.doctor.password
      });

      if (signInError) {
        console.log('❌ Doctor sign-in failed:', signInError.message);
        
        // If authentication fails, try to create the account
        if (signInError.message.includes('Invalid login credentials')) {
          console.log('🔧 Attempting to create doctor account...');
          
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
            console.error('❌ Failed to create doctor account:', signUpError.message);
            throw new Error(`Failed to create doctor account: ${signUpError.message}`);
          }
          
          console.log('✅ Doctor account created, now signing in...');
          
          // Wait a moment for account creation to complete
          await new Promise(resolve => setTimeout(resolve, 2000));
          
          // Try signing in again
          const { data: retrySignIn, error: retryError } = await supabase.auth.signInWithPassword({
            email: TEST_ACCOUNTS.doctor.email,
            password: TEST_ACCOUNTS.doctor.password
          });
          
          if (retryError) {
            console.error('❌ Retry sign-in failed:', retryError.message);
            throw new Error(`Retry sign-in failed: ${retryError.message}`);
          }
          
          console.log('✅ Doctor authenticated after account creation');
          return retrySignIn;
        } else {
          throw new Error(`Authentication failed: ${signInError.message}`);
        }
      }

      console.log('✅ Doctor authenticated successfully');
      
      // Wait for session to be established
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // Verify session
      const { data: sessionData } = await supabase.auth.getSession();
      if (!sessionData?.session) {
        throw new Error('Session not established after authentication');
      }
      
      console.log('✅ Session verified for user:', sessionData.session.user.id);
      
      // Ensure profile exists
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', sessionData.session.user.id)
        .single();
      
      if (profileError && profileError.code === 'PGRST116') {
        console.log('📝 Creating doctor profile...');
        const { error: createError } = await supabase
          .from('profiles')
          .insert({
            id: sessionData.session.user.id,
            full_name: TEST_ACCOUNTS.doctor.name,
            email: TEST_ACCOUNTS.doctor.email,
            role: 'doctor'
          });
        
        if (createError) {
          console.warn('⚠️ Profile creation failed, but continuing:', createError.message);
        } else {
          console.log('✅ Doctor profile created');
        }
      }
      
      return signInData;
    } catch (error) {
      console.error('❌ Authentication error:', error);
      throw error;
    }
  }

  private async restoreOriginalSession() {
    try {
      console.log('🔄 Cleaning up test session...');
      await supabase.auth.signOut();
      console.log('✅ Test session cleaned up');
    } catch (error) {
      console.warn('⚠️ Error during cleanup:', error);
    }
  }

  async testDatabaseConnectivity() {
    return this.runTest('Database Connectivity', async () => {
      console.log('🔍 Testing database connection...');
      const { data, error } = await supabase.from('profiles').select('count').limit(1);
      
      if (error) {
        console.error('❌ Database connectivity error:', error);
        throw error;
      }
      
      console.log('✅ Database connection successful');
      return { message: 'Database connection successful', count: data?.length || 0 };
    });
  }

  async testConnectionNotificationFlow() {
    return this.runTest('Connection Notification Flow', async () => {
      console.log('🔔 Testing connection notification flow...');
      
      // Get current session
      const { data: sessionData } = await supabase.auth.getSession();
      const currentUserId = sessionData?.session?.user?.id;

      if (!currentUserId) {
        throw new Error('No authenticated user for notification flow test');
      }

      // Test creating a notification directly
      const notificationData = {
        user_id: currentUserId,
        type: 'connection_request',
        title: 'Test Connection Request',
        message: `${TEST_ACCOUNTS.patient.name} has requested to connect with you (TEST)`,
        read: false,
        tenant_id: null
      };

      console.log('📝 Creating test notification:', notificationData);
      const { data, error } = await supabase
        .from('notifications')
        .insert(notificationData)
        .select()
        .single();

      if (error) {
        console.error('❌ Notification creation error:', error);
        throw new Error(`Notification creation failed: ${error.message}`);
      }

      console.log('✅ Notification created successfully:', data);
      return {
        notification: data,
        authenticatedUserId: currentUserId
      };
    });
  }

  async runAllTests() {
    console.log('🚀 Starting Connection Notification Test Suite');
    console.log('📋 Test Accounts:', TEST_ACCOUNTS);
    
    this.results = [];
    this.isTestingStopped = false;

    try {
      // Authenticate as doctor for tests
      console.log('🔐 Starting authentication process...');
      await this.authenticateAsDoctor();
      
      if (this.isTestingStopped) {
        throw new Error('Testing stopped due to authentication timeout');
      }

      console.log('✅ Authentication successful, running tests...');

      // Run tests in sequence
      await this.testDatabaseConnectivity();
      
      if (!this.isTestingStopped) {
        await this.testConnectionNotificationFlow();
      }
      
    } catch (error) {
      console.error('❌ Test suite execution error:', error);
      this.isTestingStopped = true;
      this.results.push({
        test: 'Test Suite Execution',
        success: false,
        error: error instanceof Error ? error.message : String(error),
        duration: 0
      });
    } finally {
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
      successRate: total > 0 ? `${Math.round((passed / total) * 100)}%` : '0%',
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
      const { data: sessionData } = await supabase.auth.getSession();
      const currentUserId = sessionData?.session?.user?.id;

      if (currentUserId) {
        const { error } = await supabase
          .from('notifications')
          .delete()
          .ilike('title', '%test%')
          .eq('user_id', currentUserId);

        if (error) {
          console.warn('⚠️ Cleanup warning:', error.message);
        } else {
          console.log('✅ Cleanup completed');
        }
      }
    } catch (error) {
      console.warn('⚠️ Cleanup failed:', error);
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
    console.error('❌ Test suite failed:', error);
    await tester.cleanup();
    throw error;
  }
}

export async function debugFirebaseIntegration() {
  console.log('🔥 Firebase Integration Debug');
  
  try {
    const isFirebaseSupported = typeof window !== 'undefined' && 
                               'Notification' in window && 
                               window === window.top;
    
    console.log('🔍 Firebase context:', {
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
    console.error('❌ Firebase debug failed:', error);
    return { error: error instanceof Error ? error.message : String(error) };
  }
}
