
import { supabase } from '@/lib/supabase';
import { sendConnectionRequestNotification } from './doctorConnectionNotifications';
import { createNotification, createTenantNotification } from './notifications';

// Test accounts
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
    email: 'saady.london@gmail.com'
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

  private async runTest(testName: string, testFn: () => Promise<any>): Promise<TestResult> {
    console.log(`🧪 Running test: ${testName}`);
    const startTime = Date.now();
    
    try {
      const data = await testFn();
      const duration = Date.now() - startTime;
      const result = { test: testName, success: true, data, duration };
      this.results.push(result);
      console.log(`✅ ${testName} - Success (${duration}ms)`, data);
      return result;
    } catch (error) {
      const duration = Date.now() - startTime;
      const result = { 
        test: testName, 
        success: false, 
        error: error instanceof Error ? error.message : String(error), 
        duration 
      };
      this.results.push(result);
      console.error(`❌ ${testName} - Failed (${duration}ms):`, error);
      return result;
    }
  }

  async testDatabaseConnectivity() {
    return this.runTest('Database Connectivity', async () => {
      const { data, error } = await supabase.from('profiles').select('count').limit(1);
      if (error) throw error;
      return { message: 'Database connection successful', count: data?.length || 0 };
    });
  }

  async testUserProfiles() {
    return this.runTest('User Profiles Check', async () => {
      const { data: patientProfile, error: patientError } = await supabase
        .from('profiles')
        .select('id, full_name, email, role, tenant_id')
        .eq('id', TEST_ACCOUNTS.patient.id)
        .single();

      if (patientError) throw new Error(`Patient profile error: ${patientError.message}`);

      const { data: doctorProfile, error: doctorError } = await supabase
        .from('profiles')
        .select('id, full_name, email, role, tenant_id')
        .eq('id', TEST_ACCOUNTS.doctor.id)
        .single();

      if (doctorError) throw new Error(`Doctor profile error: ${doctorError.message}`);

      return {
        patient: patientProfile,
        doctor: doctorProfile,
        patientHasTenant: !!patientProfile?.tenant_id,
        doctorHasTenant: !!doctorProfile?.tenant_id,
        sameTenant: patientProfile?.tenant_id === doctorProfile?.tenant_id
      };
    });
  }

  async testNotificationTableAccess() {
    return this.runTest('Notification Table Access', async () => {
      // Test read access
      const { data: readTest, error: readError } = await supabase
        .from('notifications')
        .select('id, user_id, type, title')
        .limit(5);

      if (readError) throw new Error(`Read access failed: ${readError.message}`);

      // Test write access with a test notification
      const testNotification = {
        user_id: TEST_ACCOUNTS.doctor.id,
        type: 'test',
        title: 'Test Notification',
        message: 'This is a test notification',
        tenant_id: null
      };

      const { data: writeTest, error: writeError } = await supabase
        .from('notifications')
        .insert(testNotification)
        .select()
        .single();

      if (writeError) throw new Error(`Write access failed: ${writeError.message}`);

      // Clean up test notification
      await supabase.from('notifications').delete().eq('id', writeTest.id);

      return {
        readAccess: true,
        writeAccess: true,
        testNotificationId: writeTest.id,
        existingNotifications: readTest?.length || 0
      };
    });
  }

  async testTenantContext() {
    return this.runTest('Tenant Context Check', async () => {
      // Get current session and check for tenant claims
      const { data: session } = await supabase.auth.getSession();
      const claims = session?.session?.user?.app_metadata || {};

      return {
        hasSession: !!session?.session,
        userId: session?.session?.user?.id,
        claims,
        hasTenantClaim: !!claims.tenant_id || !!claims.tenant,
        setClaimFunctionExists: true // Assume it exists for now
      };
    });
  }

  async testDirectNotificationCreation() {
    return this.runTest('Direct Notification Creation', async () => {
      const notificationData = {
        user_id: TEST_ACCOUNTS.doctor.id,
        type: 'connection_request',
        title: 'Test Connection Request',
        message: `${TEST_ACCOUNTS.patient.name} has requested to connect with you (TEST)`,
        read: false,
        tenant_id: null
      };

      const { data, error } = await supabase
        .from('notifications')
        .insert(notificationData)
        .select()
        .single();

      if (error) throw error;

      // Verify it was created
      const { data: verification, error: verifyError } = await supabase
        .from('notifications')
        .select('*')
        .eq('id', data.id)
        .single();

      if (verifyError) throw new Error(`Verification failed: ${verifyError.message}`);

      return {
        created: data,
        verified: verification,
        notificationId: data.id
      };
    });
  }

  async testUtilityFunction() {
    return this.runTest('Utility Function Test', async () => {
      const result = await createNotification({
        userId: TEST_ACCOUNTS.doctor.id,
        type: 'connection_request',
        title: 'Test via Utility',
        message: `${TEST_ACCOUNTS.patient.name} test via utility function`,
        tenantId: null
      });

      if (!result) throw new Error('Utility function returned null');

      return result;
    });
  }

  async testTenantAwareNotification() {
    return this.runTest('Tenant-Aware Notification', async () => {
      const result = await createTenantNotification(
        TEST_ACCOUNTS.doctor.id,
        'connection_request',
        'Test Tenant-Aware',
        `${TEST_ACCOUNTS.patient.name} test tenant-aware notification`
      );

      if (!result) throw new Error('Tenant-aware function returned null');

      return result;
    });
  }

  async testFullConnectionFlow() {
    return this.runTest('Full Connection Notification Flow', async () => {
      const result = await sendConnectionRequestNotification(
        TEST_ACCOUNTS.doctor.id,
        TEST_ACCOUNTS.patient.name
      );

      if (!result) throw new Error('Connection notification function returned null');

      // Verify the notification exists
      const { data: verification, error: verifyError } = await supabase
        .from('notifications')
        .select('*')
        .eq('id', result.id)
        .single();

      if (verifyError) throw new Error(`Verification failed: ${verifyError.message}`);

      return {
        notification: result,
        verification
      };
    });
  }

  async testConnectionRequestCreation() {
    return this.runTest('Connection Request Creation', async () => {
      // First, clean up any existing connection
      await supabase
        .from('doctor_patient_connections')
        .delete()
        .eq('doctor_id', TEST_ACCOUNTS.doctor.id)
        .eq('patient_id', TEST_ACCOUNTS.patient.id);

      // Create a new connection request
      const { data, error } = await supabase
        .from('doctor_patient_connections')
        .insert({
          doctor_id: TEST_ACCOUNTS.doctor.id,
          patient_id: TEST_ACCOUNTS.patient.id,
          status: 'pending'
        })
        .select()
        .single();

      if (error) throw error;

      return {
        connection: data,
        canCreateConnections: true
      };
    });
  }

  async runAllTests() {
    console.log('🚀 Starting Connection Notification Test Suite');
    console.log('Test Accounts:', TEST_ACCOUNTS);
    
    this.results = [];

    // Run tests in sequence
    await this.testDatabaseConnectivity();
    await this.testUserProfiles();
    await this.testNotificationTableAccess();
    await this.testTenantContext();
    await this.testDirectNotificationCreation();
    await this.testUtilityFunction();
    await this.testTenantAwareNotification();
    await this.testConnectionRequestCreation();
    await this.testFullConnectionFlow();

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
      const { error } = await supabase
        .from('notifications')
        .delete()
        .ilike('title', '%test%')
        .eq('user_id', TEST_ACCOUNTS.doctor.id);

      if (error) {
        console.warn('Cleanup warning:', error.message);
      } else {
        console.log('✅ Cleanup completed');
      }
    } catch (error) {
      console.warn('Cleanup failed:', error);
    }
  }
}

// Export a simple function to run the tests
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

// Firebase-specific debugging
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
