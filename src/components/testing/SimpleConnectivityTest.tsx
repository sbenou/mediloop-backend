
import React, { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { supabase } from '@/lib/supabase';

const SimpleConnectivityTest = () => {
  const [results, setResults] = useState<string[]>([]);
  const [isRunning, setIsRunning] = useState(false);

  const addResult = (message: string) => {
    const timestamp = new Date().toLocaleTimeString();
    setResults(prev => [...prev, `[${timestamp}] ${message}`]);
  };

  const runSimpleTest = async () => {
    setIsRunning(true);
    setResults([]);
    
    try {
      addResult('🔍 Testing basic Supabase connectivity...');
      
      // Test 1: Check if supabase client exists
      if (!supabase) {
        addResult('❌ Supabase client is not initialized');
        return;
      }
      addResult('✅ Supabase client exists');
      
      // Test 2: Test auth with timeout
      addResult('🔐 Testing auth with 3 second timeout...');
      try {
        const authPromise = supabase.auth.getSession();
        const timeoutPromise = new Promise((_, reject) => 
          setTimeout(() => reject(new Error('Auth timeout')), 3000)
        );
        
        const { data: session, error } = await Promise.race([authPromise, timeoutPromise]) as any;
        
        if (error) {
          addResult(`❌ Auth error: ${error.message}`);
        } else {
          addResult(`✅ Auth check complete - User: ${session?.session?.user?.id || 'None'}`);
        }
      } catch (authError) {
        addResult(`⏰ Auth timed out or failed: ${authError instanceof Error ? authError.message : String(authError)}`);
      }
      
      // Test 3: Direct database query with timeout
      addResult('🗄️ Testing direct database query...');
      try {
        const queryPromise = supabase.from('profiles').select('count').limit(0);
        const queryTimeoutPromise = new Promise((_, reject) => 
          setTimeout(() => reject(new Error('Query timeout')), 3000)
        );
        
        const { error: queryError } = await Promise.race([queryPromise, queryTimeoutPromise]) as any;
        
        if (queryError) {
          addResult(`❌ Database query error: ${queryError.message}`);
        } else {
          addResult('✅ Database query successful');
        }
      } catch (queryTimeoutError) {
        addResult(`⏰ Database query timed out: ${queryTimeoutError instanceof Error ? queryTimeoutError.message : String(queryTimeoutError)}`);
      }
      
      // Test 4: Test raw SQL function call
      addResult('⚙️ Testing database function call...');
      try {
        const functionPromise = supabase.rpc('get_admin_dashboard_stats');
        const functionTimeoutPromise = new Promise((_, reject) => 
          setTimeout(() => reject(new Error('Function timeout')), 3000)
        );
        
        const { data, error } = await Promise.race([functionPromise, functionTimeoutPromise]) as any;
        
        if (error) {
          addResult(`❌ Function call error: ${error.message}`);
        } else {
          addResult('✅ Function call successful');
          addResult(`📊 Data received: ${JSON.stringify(data)}`);
        }
      } catch (functionError) {
        addResult(`⏰ Function call timed out: ${functionError instanceof Error ? functionError.message : String(functionError)}`);
      }
      
      // Test 5: Check environment variables
      addResult('🔧 Checking configuration...');
      const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'fallback URL in use';
      const hasAnonKey = !!(import.meta.env.VITE_SUPABASE_ANON_KEY || 'fallback key in use');
      addResult(`📍 Supabase URL: ${supabaseUrl}`);
      addResult(`🔑 Anon Key configured: ${hasAnonKey ? 'Yes' : 'No'}`);
      
    } catch (error) {
      addResult(`❌ Test failed: ${error instanceof Error ? error.message : String(error)}`);
    } finally {
      setIsRunning(false);
      addResult('🏁 Simple connectivity test complete');
    }
  };

  return (
    <Card className="w-full max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle>Simple Connectivity Test (Fixed Timeouts)</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <Button 
          onClick={runSimpleTest} 
          disabled={isRunning}
          className="w-full"
        >
          {isRunning ? 'Testing...' : 'Run Fixed Simple Test'}
        </Button>
        
        {results.length > 0 && (
          <div className="bg-gray-100 p-4 rounded-lg max-h-96 overflow-y-auto">
            <h4 className="font-semibold mb-2">Test Results:</h4>
            <div className="space-y-1 text-sm font-mono">
              {results.map((result, index) => (
                <div key={index}>{result}</div>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default SimpleConnectivityTest;
