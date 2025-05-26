
import { supabase } from '@/lib/supabase';
import { sendConnectionRequestNotification } from './doctorConnectionNotifications';
import { createNotification, createTenantNotification } from './notifications';

// Pre-existing test accounts that should already be in the database
const TEST_ACCOUNTS = {
  patient: {
    id: '7b8de1a4-fa25-46b4-8487-ed8fdae18eef',
    email: 'benou004@hotmail.com',
    name: 'sam testington'
  },
  doctor: {
    id: '697f1f0e-17a9-4ca6-a607-cf5df7b2be85', 
    email: 'ridam57@yahoo.fr',
    name: 'Tim Burton'
  },
  pharmacist: {
    id: 'f47ac10b-58cc-4372-a567-0e02b2c3d479',
    email: 'saady.london@gmail.com',
    name: 'Ahmed Saady'
  }
};

interface TestResult {
  test: string;
  success: boolean;
  data?: any;
  error?: string;
  duration: number;
}

interface TestSummary {
  total: number;
  passed: number;
  failed: number;
  successRate: string;
  totalTime: string;
  failedTests: Array<{ test: string; error: string }>;
}

export class ConnectionNotificationTester {
  private results: TestResult[] = [];
  private testTimeout = 10000; // 10 seconds
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

  async testDatabaseConnectivity() {
    return this.runTest('Database Connectivity', async () => {
      console.log('🔍 Testing database connection...');
      
      const { data, error } = await supabase
        .from('profiles')
        .select('id')
        .limit(1);
      
      if (error) {
        console.error('❌ Database connectivity error:', error);
        throw error;
      }
      
      console.log('✅ Database connection successful');
      return { message: 'Database connection successful', count: data?.length || 0 };
    });
  }

  async testCurrentAuthenticationState() {
    return this.runTest('Current Authentication State', async () => {
      console.log('🔐 Testing current authentication state...');
      
      const { data: sessionData, error: sessionError } = await supabase.auth.getSession();
      
      if (sessionError) {
        throw new Error(`Session error: ${sessionError.message}`);
      }

      const isAuthenticated = !!sessionData?.session?.user;
      const userId = sessionData?.session?.user?.id;

      console.log('🔍 Current authentication state:', {
        isAuthenticated,
        userId,
        sessionExists: !!sessionData?.session
      });

      return {
        isAuthenticated,
        userId,
        sessionExists: !!sessionData?.session,
        userEmail: sessionData?.session?.user?.email
      };
    });
  }

  async testDoctorProfileExists() {
    return this.runTest('Doctor Profile Exists', async () => {
      console.log('👨‍⚕️ Testing if doctor profile exists...');
      
      const { data: profile, error } = await supabase
        .from('profiles')
        .select('id, full_name, role')
        .eq('id', TEST_ACCOUNTS.doctor.id)
        .maybeSingle();

      if (error) {
        console.error('❌ Doctor profile fetch error:', error);
        throw new Error(`Doctor profile fetch failed: ${error.message}`);
      }

      if (!profile) {
        throw new Error('Doctor profile not found');
      }

      console.log('✅ Doctor profile found:', profile);
      return {
        profile,
        doctorId: TEST_ACCOUNTS.doctor.id
      };
    });
  }

  async testPatientProfileExists() {
    return this.runTest('Patient Profile Exists', async () => {
      console.log('🤒 Testing if patient profile exists...');
      
      const { data: profile, error } = await supabase
        .from('profiles')
        .select('id, full_name, role')
        .eq('id', TEST_ACCOUNTS.patient.id)
        .maybeSingle();

      if (error) {
        console.error('❌ Patient profile fetch error:', error);
        throw new Error(`Patient profile fetch failed: ${error.message}`);
      }

      if (!profile) {
        throw new Error('Patient profile not found');
      }

      console.log('✅ Patient profile found:', profile);
      return {
        profile,
        patientId: TEST_ACCOUNTS.patient.id
      };
    });
  }

  async testNotificationCreationDirect() {
    return this.runTest('Direct Notification Creation', async () => {
      console.log('🔔 Testing direct notification creation...');
      
      const notificationData = {
        user_id: TEST_ACCOUNTS.doctor.id,
        type: 'connection_request',
        title: 'Test Connection Request (Direct)',
        message: `${TEST_ACCOUNTS.patient.name} has requested to connect with you (TEST)`,
        read: false,
        tenant_id: null
      };

      console.log('📝 Creating test notification:', notificationData);
      
      const { data, error } = await supabase
        .from('notifications')
        .insert(notificationData)
        .select()
        .maybeSingle();

      if (error) {
        console.error('❌ Direct notification creation error:', error);
        throw new Error(`Direct notification creation failed: ${error.message}`);
      }

      if (!data) {
        throw new Error('Notification creation returned no data');
      }

      console.log('✅ Direct notification created successfully:', data);
      return {
        notification: data,
        targetUserId: TEST_ACCOUNTS.doctor.id
      };
    });
  }

  async testNotificationHelperFunction() {
    return this.runTest('Notification Helper Function', async () => {
      console.log('🔧 Testing notification helper function...');
      
      const result = await createNotification({
        userId: TEST_ACCOUNTS.doctor.id,
        type: 'connection_request',
        title: 'Test Function Notification',
        message: 'Testing notification helper function (TEST)'
      });

      if (!result) {
        throw new Error('Notification helper function returned null');
      }

      console.log('✅ Notification helper function test successful:', result);
      return {
        notification: result,
        userId: TEST_ACCOUNTS.doctor.id
      };
    });
  }

  async testConnectionNotificationFlow() {
    return this.runTest('Connection Notification Flow (Background Job)', async () => {
      console.log('🔗 Testing connection notification flow with background job...');
      
      const result = await sendConnectionRequestNotification(
        TEST_ACCOUNTS.doctor.id,
        TEST_ACCOUNTS.patient.name
      );

      if (!result) {
        throw new Error('Background job notification flow returned null');
      }

      console.log('✅ Background job notification flow successful:', result);
      return {
        notification: result.notification,
        pushResults: result.pushResults,
        doctorId: TEST_ACCOUNTS.doctor.id,
        patientName: TEST_ACCOUNTS.patient.name,
        backgroundJobUsed: true
      };
    });
  }

  async testBackgroundJobDirectly() {
    return this.runTest('Background Job Direct Call', async () => {
      console.log('🚀 Testing background job direct call...');
      
      const { data, error } = await supabase.functions.invoke('process-connection-notifications', {
        body: { 
          doctorId: TEST_ACCOUNTS.doctor.id, 
          patientName: TEST_ACCOUNTS.patient.name + ' (Direct Test)'
        }
      });

      if (error) {
        throw new Error(`Background job failed: ${error.message}`);
      }

      if (!data) {
        throw new Error('Background job returned no data');
      }

      console.log('✅ Background job direct call successful:', data);
      return {
        backgroundJobResult: data,
        doctorId: TEST_ACCOUNTS.doctor.id,
        patientName: TEST_ACCOUNTS.patient.name
      };
    });
  }

  async testFCMTokenRegistration() {
    return this.runTest('FCM Token Registration', async () => {
      console.log('📱 Testing FCM token registration...');
      
      const mockToken = `test_fcm_token_${crypto.randomUUID()}`;
      
      const { error } = await supabase
        .from('user_notification_tokens')
        .upsert({
          user_id: TEST_ACCOUNTS.doctor.id,
          token: mockToken,
          platform: 'web',
          created_at: new Date().toISOString()
        });

      if (error) {
        throw new Error(`FCM token registration failed: ${error.message}`);
      }

      // Verify the token was stored
      const { data: storedToken } = await supabase
        .from('user_notification_tokens')
        .select('*')
        .eq('user_id', TEST_ACCOUNTS.doctor.id)
        .eq('token', mockToken)
        .single();

      console.log('✅ FCM token registration successful:', storedToken);
      return {
        tokenStored: !!storedToken,
        mockToken,
        userId: TEST_ACCOUNTS.doctor.id
      };
    });
  }

  async testNotificationQuery() {
    return this.runTest('Notification Query', async () => {
      console.log('📋 Testing notification query...');
      
      const { data: notifications, error } = await supabase
        .from('notifications')
        .select('id, title, message, created_at')
        .eq('user_id', TEST_ACCOUNTS.doctor.id)
        .order('created_at', { ascending: false })
        .limit(5);

      if (error) {
        console.error('❌ Notification query error:', error);
        throw new Error(`Notification query failed: ${error.message}`);
      }

      console.log('✅ Notification query successful:', notifications);
      return {
        notifications,
        count: notifications?.length || 0,
        userId: TEST_ACCOUNTS.doctor.id
      };
    });
  }

  async testFirebaseIntegration() {
    return this.runTest('Firebase Integration', async () => {
      console.log('🔥 Testing Firebase integration...');
      
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
        browserNotificationTest: isFirebaseSupported,
        context: 'firebase_integration_test'
      };
    });
  }

  async runAllTests() {
    console.log('🚀 Starting Connection Notification Test Suite (Background Jobs + Firebase)');
    console.log('📋 Test Accounts:', TEST_ACCOUNTS);
    
    this.results = [];
    this.isTestingStopped = false;

    try {
      console.log('✅ Using pre-existing test accounts, running individual tests...');

      // Run tests in sequence
      await this.testDatabaseConnectivity();
      await this.testCurrentAuthenticationState();
      await this.testDoctorProfileExists();
      await this.testPatientProfileExists();
      await this.testFCMTokenRegistration();
      await this.testNotificationCreationDirect();
      await this.testNotificationHelperFunction();
      await this.testBackgroundJobDirectly();
      await this.testConnectionNotificationFlow();
      await this.testNotificationQuery();
      await this.testFirebaseIntegration();
      
    } catch (error) {
      console.error('❌ Test suite execution error:', error);
      this.isTestingStopped = true;
      this.results.push({
        test: 'Test Suite Setup',
        success: false,
        error: error instanceof Error ? error.message : String(error),
        duration: 0
      });
    }

    // Generate summary
    const summary = this.generateSummary();
    console.log('📊 Test Suite Complete:', summary);
    
    return {
      results: this.results,
      summary
    };
  }

  private generateSummary(): TestSummary {
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
        error: r.error || 'Unknown error'
      }))
    };
  }

  // Clean up any test notifications
  async cleanup() {
    console.log('🧹 Cleaning up test notifications...');
    
    try {
      const { error } = await supabase
        .from('notifications')
        .delete()
        .ilike('title', '%test%')
        .in('user_id', [TEST_ACCOUNTS.doctor.id, TEST_ACCOUNTS.patient.id]);

      if (error) {
        console.warn('⚠️ Cleanup warning:', error.message);
      } else {
        console.log('✅ Cleanup completed');
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
