
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
      
      // Test 2: Simple auth check (no query)
      addResult('🔐 Checking auth state...');
      const { data: session } = await supabase.auth.getSession();
      addResult(`✅ Auth check complete - User: ${session?.session?.user?.id || 'None'}`);
      
      // Test 3: Very simple query with timeout
      addResult('🗄️ Testing database with simple query...');
      
      const queryPromise = supabase.rpc('get_admin_dashboard_stats');
      const timeoutPromise = new Promise((_, reject) => 
        setTimeout(() => reject(new Error('Query timeout')), 5000)
      );
      
      try {
        const { data, error } = await Promise.race([queryPromise, timeoutPromise]) as any;
        
        if (error) {
          addResult(`❌ Database query error: ${error.message}`);
        } else {
          addResult('✅ Database query successful');
          addResult(`📊 Data received: ${JSON.stringify(data)}`);
        }
      } catch (timeoutError) {
        addResult('⏰ Database query timed out after 5 seconds');
      }
      
      // Test 4: Direct table access
      addResult('📋 Testing direct table access...');
      try {
        const tablePromise = supabase.from('profiles').select('count').limit(0);
        const tableTimeoutPromise = new Promise((_, reject) => 
          setTimeout(() => reject(new Error('Table query timeout')), 3000)
        );
        
        const { error: tableError } = await Promise.race([tablePromise, tableTimeoutPromise]) as any;
        
        if (tableError) {
          addResult(`❌ Table access error: ${tableError.message}`);
        } else {
          addResult('✅ Table access successful');
        }
      } catch (tableTimeoutError) {
        addResult('⏰ Table query timed out after 3 seconds');
      }
      
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
        <CardTitle>Simple Connectivity Test</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <Button 
          onClick={runSimpleTest} 
          disabled={isRunning}
          className="w-full"
        >
          {isRunning ? 'Testing...' : 'Run Simple Test'}
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
