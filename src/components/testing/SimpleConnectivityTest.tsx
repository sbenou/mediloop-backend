
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
      
      // Test 2: Test auth with timeout and proper error handling
      addResult('🔐 Testing auth with 5 second timeout...');
      try {
        const authController = new AbortController();
        const authTimeout = setTimeout(() => authController.abort(), 5000);
        
        const authPromise = supabase.auth.getSession();
        const { data: session, error } = await Promise.race([
          authPromise,
          new Promise<any>((_, reject) => 
            setTimeout(() => reject(new Error('Auth timeout')), 5000)
          )
        ]);
        
        clearTimeout(authTimeout);
        
        if (error) {
          addResult(`⚠️ Auth error: ${error.message}`);
        } else {
          addResult(`✅ Auth check complete - User: ${session?.session?.user?.id || 'None'}`);
        }
      } catch (authError) {
        addResult(`⏰ Auth timed out or failed: ${authError instanceof Error ? authError.message : String(authError)}`);
      }
      
      // Test 3: Direct database query with proper timeout handling
      addResult('🗄️ Testing direct database query with 5 second timeout...');
      try {
        const queryController = new AbortController();
        const queryTimeout = setTimeout(() => queryController.abort(), 5000);
        
        const { data, error: queryError } = await Promise.race([
          supabase.from('profiles').select('count').limit(1),
          new Promise<any>((_, reject) => 
            setTimeout(() => reject(new Error('Query timeout')), 5000)
          )
        ]);
        
        clearTimeout(queryTimeout);
        
        if (queryError) {
          addResult(`❌ Database query error: ${queryError.message}`);
        } else {
          addResult('✅ Database query successful');
          addResult(`📊 Query returned: ${data ? data.length : 0} results`);
        }
      } catch (queryTimeoutError) {
        addResult(`⏰ Database query timed out: ${queryTimeoutError instanceof Error ? queryTimeoutError.message : String(queryTimeoutError)}`);
      }
      
      // Test 4: Check configuration
      addResult('🔧 Checking configuration...');
      addResult(`📍 Supabase URL: https://hrrlefgnhkbzuwyklejj.supabase.co`);
      addResult(`🔑 Anon Key configured: Yes`);
      
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
        <CardTitle>Simple Connectivity Test (Single Client Instance)</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <Button 
          onClick={runSimpleTest} 
          disabled={isRunning}
          className="w-full"
        >
          {isRunning ? 'Testing...' : 'Run Single Client Test'}
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
