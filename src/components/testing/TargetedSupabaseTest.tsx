
import React, { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

const TargetedSupabaseTest = () => {
  const [results, setResults] = useState<string[]>([]);
  const [isRunning, setIsRunning] = useState(false);

  const addResult = (message: string) => {
    const timestamp = new Date().toLocaleTimeString();
    setResults(prev => [...prev, `[${timestamp}] ${message}`]);
  };

  const runTargetedTest = async () => {
    setIsRunning(true);
    setResults([]);
    
    try {
      addResult('🎯 Starting targeted Supabase connectivity test...');
      
      // Test 1: Raw REST API call without Supabase client
      addResult('📡 Testing raw REST API call...');
      try {
        const response = await fetch(
          'https://hrrlefgnhkbzuwyklejj.supabase.co/rest/v1/profiles?select=count&limit=1',
          {
            method: 'GET',
            headers: {
              'apikey': 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImhycmxlZmduaGtienV3eWtsZWpqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzUyNTk4MDgsImV4cCI6MjA1MDgzNTgwOH0.U2ErpuuwTRYq6DryXR1VbFWGiTUcTnRReeS0oiSSP9U',
              'Authorization': 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImhycmxlZmduaGtienV3eWtsZWpqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzUyNTk4MDgsImV4cCI6MjA1MDgzNTgwOH0.U2ErpuuwTRYq6DryXR1VbFWGiTUcTnRReeS0oiSSP9U',
              'Content-Type': 'application/json'
            },
            signal: AbortSignal.timeout(5000)
          }
        );
        
        const data = await response.text();
        addResult(`✅ Raw REST API successful - Status: ${response.status}`);
        addResult(`📊 Response: ${data.substring(0, 100)}...`);
        
      } catch (restError) {
        addResult(`❌ Raw REST API failed: ${restError instanceof Error ? restError.message : String(restError)}`);
      }
      
      // Test 2: Test with minimal Supabase client that won't conflict
      addResult('🔧 Testing with isolated Supabase client...');
      try {
        // Import Supabase dynamically to create an isolated instance
        const { createClient } = await import('@supabase/supabase-js');
        
        const isolatedClient = createClient(
          'https://hrrlefgnhkbzuwyklejj.supabase.co',
          'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImhycmxlZmduaWtienV3eWtsZWpqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzUyNTk4MDgsImV4cCI6MjA1MDgzNTgwOH0.U2ErpuuwTRYq6DryXR1VbFWGiTUcTnRReeS0oiSSP9U',
          {
            auth: {
              persistSession: false,
              autoRefreshToken: false,
              detectSessionInUrl: false
            },
            global: {
              headers: {
                'x-client-info': 'isolated-test-client'
              }
            }
          }
        );
        
        addResult('✅ Isolated Supabase client created successfully');
        
        // Test a simple query with the isolated client
        addResult('📊 Testing isolated client query...');
        
        const queryPromise = isolatedClient
          .from('profiles')
          .select('count')
          .limit(1);
          
        const timeoutPromise = new Promise((_, reject) => 
          setTimeout(() => reject(new Error('Isolated client timeout')), 3000)
        );
        
        const result = await Promise.race([queryPromise, timeoutPromise]);
        
        addResult('✅ Isolated client query successful');
        addResult(`📊 Result: ${JSON.stringify(result)}`);
        
      } catch (clientError) {
        addResult(`❌ Isolated client test failed: ${clientError instanceof Error ? clientError.message : String(clientError)}`);
      }
      
    } catch (error) {
      addResult(`❌ Test suite failed: ${error instanceof Error ? error.message : String(error)}`);
    } finally {
      setIsRunning(false);
      addResult('🏁 Targeted Supabase test complete');
    }
  };

  return (
    <Card className="w-full max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle>Targeted Supabase Connectivity Test</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <Button 
          onClick={runTargetedTest} 
          disabled={isRunning}
          className="w-full"
        >
          {isRunning ? 'Running Targeted Test...' : 'Run Targeted Connectivity Test'}
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

export default TargetedSupabaseTest;
