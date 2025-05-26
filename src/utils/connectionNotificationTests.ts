import { supabase } from '@/lib/supabase';
import { createNotification } from '@/utils/notifications';
import { registerFCMToken, testPushNotification } from '@/utils/firebaseNotificationUtils';
import { sendDoctorConnectionNotification } from '@/utils/notificationHelpers';

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

export const runConnectionNotificationTests = async (): Promise<{ results: TestResult[]; summary: TestSummary }> => {
  const results: TestResult[] = [];
  const startTime = Date.now();

  const runTest = async (testName: string, testFn: () => Promise<any>): Promise<TestResult> => {
    const testStart = Date.now();
    try {
      const result = await testFn();
      const duration = Date.now() - testStart;
      return {
        test: testName,
        success: true,
        data: result,
        duration
      };
    } catch (error) {
      const duration = Date.now() - testStart;
      return {
        test: testName,
        success: false,
        error: error instanceof Error ? error.message : String(error),
        duration
      };
    }
  };

  // Test 1: Database Connectivity (KEEP ORIGINAL - DON'T MODIFY)
  results.push(await runTest('Database Connectivity', async () => {
    const { data, error } = await supabase.from('profiles').select('count').limit(1);
    if (error) throw error;
    return data;
  }));

  // Test 2: Current Authentication State (KEEP ORIGINAL - DON'T MODIFY)
  results.push(await runTest('Current Authentication State', async () => {
    const { data: { user }, error } = await supabase.auth.getUser();
    if (error) throw error;
    if (!user) throw new Error('No authenticated user found');
    return { userId: user.id, email: user.email };
  }));

  // Get current user for subsequent tests
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    throw new Error('Authentication required for notification tests');
  }

  // Test 3: Doctor Profile Exists (KEEP ORIGINAL - DON'T MODIFY)
  results.push(await runTest('Doctor Profile Exists', async () => {
    const { data, error } = await supabase
      .from('profiles')
      .select('id, full_name, role')
      .eq('id', user.id)
      .single();
    
    if (error) throw error;
    if (!data) throw new Error('Profile not found');
    return data;
  }));

  // Test 4: Patient Profile Exists (KEEP ORIGINAL - DON'T MODIFY)
  results.push(await runTest('Patient Profile Exists', async () => {
    const { data, error } = await supabase
      .from('profiles')
      .select('id, full_name, role')
      .eq('role', 'patient')
      .limit(1)
      .single();
    
    if (error && error.code !== 'PGRST116') throw error;
    if (!data) {
      // If no patient exists, that's ok for this test
      return { message: 'No patient profiles found, but test passed' };
    }
    return data;
  }));

  // Test 5: FCM Token Registration (FIXED FOR RLS)
  results.push(await runTest('FCM Token Registration', async () => {
    const testToken = `test_fcm_token_${Date.now()}`;
    
    // Ensure we have a valid session before attempting the operation
    const { data: { session }, error: sessionError } = await supabase.auth.getSession();
    if (sessionError || !session) {
      throw new Error('No valid session for FCM token registration');
    }
    
    const { data, error } = await supabase
      .from('user_notification_tokens')
      .upsert({
        user_id: user.id,
        token: testToken,
        platform: 'web'
      }, {
        onConflict: 'user_id, token'
      })
      .select()
      .single();

    if (error) throw error;
    return data;
  }));

  // Test 6: Direct Notification Creation (FIXED FOR RLS)
  results.push(await runTest('Direct Notification Creation', async () => {
    // Ensure we have a valid session before attempting the operation
    const { data: { session }, error: sessionError } = await supabase.auth.getSession();
    if (sessionError || !session) {
      throw new Error('No valid session for notification creation');
    }

    const { data, error } = await supabase
      .from('notifications')
      .insert({
        user_id: user.id,
        type: 'connection_request',
        title: 'Test Notification',
        message: 'This is a test notification for connection testing',
        meta: { test: true, timestamp: new Date().toISOString() }
      })
      .select()
      .single();

    if (error) throw error;
    return data;
  }));

  // Test 7: Notification Helper Function (FIXED FOR RLS)
  results.push(await runTest('Notification Helper Function', async () => {
    // Ensure we have a valid session before attempting the operation
    const { data: { session }, error: sessionError } = await supabase.auth.getSession();
    if (sessionError || !session) {
      throw new Error('No valid session for notification helper');
    }

    const notification = await createNotification({
      userId: user.id,
      type: 'connection_request',
      title: 'Helper Function Test',
      message: 'Testing notification creation via helper function'
    });
    
    if (!notification) throw new Error('Helper function returned null');
    return notification;
  }));

  // Test 8: Background Job Direct Call (KEEP ORIGINAL - DON'T MODIFY)
  results.push(await runTest('Background Job Direct Call', async () => {
    const { data, error } = await supabase.functions.invoke('process-connection-notifications', {
      body: { 
        doctorId: user.id, 
        patientName: 'Test Patient',
        isTest: true
      }
    });
    
    if (error) throw error;
    return data;
  }));

  // Test 9: Connection Notification Flow (Background Job) (KEEP ORIGINAL - DON'T MODIFY)
  results.push(await runTest('Connection Notification Flow (Background Job)', async () => {
    const result = await sendDoctorConnectionNotification(user.id, 'Integration Test Patient');
    if (!result) throw new Error('Connection notification flow failed');
    return result;
  }));

  // Test 10: Notification Query (KEEP ORIGINAL - DON'T MODIFY)
  results.push(await runTest('Notification Query', async () => {
    const { data, error } = await supabase
      .from('notifications')
      .select('*')
      .eq('user_id', user.id)
      .limit(5);
    
    if (error) throw error;
    return data;
  }));

  // Test 11: Firebase Integration (KEEP ORIGINAL - DON'T MODIFY)
  results.push(await runTest('Firebase Integration', async () => {
    // Basic firebase integration test
    return { firebase: 'available', messaging: typeof window !== 'undefined' && 'serviceWorker' in navigator };
  }));

  const endTime = Date.now();
  const totalTime = endTime - startTime;
  const passed = results.filter(r => r.success).length;
  const failed = results.filter(r => !r.success).length;
  const failedTests = results.filter(r => !r.success).map(r => ({ test: r.test, error: r.error || 'Unknown error' }));

  const summary: TestSummary = {
    total: results.length,
    passed,
    failed,
    successRate: `${Math.round((passed / results.length) * 100)}%`,
    totalTime: `${totalTime}ms`,
    failedTests
  };

  return { results, summary };
};

export const debugFirebaseIntegration = async () => {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    
    return {
      timestamp: new Date().toISOString(),
      userAuthenticated: !!user,
      userId: user?.id,
      userEmail: user?.email,
      serviceWorkerSupported: typeof window !== 'undefined' && 'serviceWorker' in navigator,
      notificationPermission: typeof window !== 'undefined' ? Notification.permission : 'unknown',
      supabaseUrl: 'https://hrrlefgnhkbzuwyklejj.supabase.co',
      environment: process.env.NODE_ENV || 'development'
    };
  } catch (error) {
    return {
      error: error instanceof Error ? error.message : String(error),
      timestamp: new Date().toISOString()
    };
  }
};
