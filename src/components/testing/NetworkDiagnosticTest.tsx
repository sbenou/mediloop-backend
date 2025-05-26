
import React, { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { supabase } from '@/lib/supabase';

const NetworkDiagnosticTest = () => {
  const [results, setResults] = useState<string[]>([]);
  const [isRunning, setIsRunning] = useState(false);

  const addResult = (message: string) => {
    const timestamp = new Date().toLocaleTimeString();
    setResults(prev => [...prev, `[${timestamp}] ${message}`]);
  };

  const runDiagnostics = async () => {
    setIsRunning(true);
    setResults([]);
    
    try {
      addResult('🔍 Starting network diagnostics...');
      
      // Test 1: Basic fetch to Supabase REST API
      addResult('🌐 Testing basic HTTP connectivity to Supabase...');
      try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 5000);
        
        const response = await fetch(
          'https://hrrlefgnhkbzuwyklejj.supabase.co/rest/v1/',
          {
            method: 'HEAD',
            headers: {
              'apikey': 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImhycmxlZmduaGtienV3eWtsZWpqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzUyNTk4MDgsImV4cCI6MjA1MDgzNTgwOH0.U2ErpuuwTRYq6DryXR1VbFWGiTUcTnRReeS0oiSSP9U'
            },
            signal: controller.signal
          }
        );
        
        clearTimeout(timeoutId);
        addResult(`✅ HTTP connectivity successful - Status: ${response.status}`);
        
        // Check response headers for more info
        const serverHeader = response.headers.get('server');
        const corsHeader = response.headers.get('access-control-allow-origin');
        addResult(`📋 Server: ${serverHeader || 'Not specified'}`);
        addResult(`🔒 CORS: ${corsHeader || 'Not configured'}`);
        
      } catch (fetchError) {
        if (fetchError instanceof Error) {
          if (fetchError.name === 'AbortError') {
            addResult('❌ HTTP connectivity timed out after 5 seconds');
          } else {
            addResult(`❌ HTTP connectivity failed: ${fetchError.message}`);
          }
        } else {
          addResult(`❌ HTTP connectivity failed: ${String(fetchError)}`);
        }
      }
      
      // Test 2: DNS resolution test
      addResult('🔍 Testing DNS resolution...');
      try {
        const dnsController = new AbortController();
        const dnsTimeoutId = setTimeout(() => dnsController.abort(), 3000);
        
        await fetch('https://hrrlefgnhkbzuwyklejj.supabase.co/', {
          method: 'HEAD',
          signal: dnsController.signal
        });
        
        clearTimeout(dnsTimeoutId);
        addResult('✅ DNS resolution successful');
      } catch (dnsError) {
        if (dnsError instanceof Error && dnsError.name === 'AbortError') {
          addResult('❌ DNS resolution timed out - possible DNS issues');
        } else {
          addResult('❌ DNS resolution failed');
        }
      }
      
      // Test 3: Check if we're in the right environment
      addResult('🔧 Checking environment details...');
      addResult(`🌍 User Agent: ${navigator.userAgent.substring(0, 100)}...`);
      addResult(`📍 Origin: ${window.location.origin}`);
      addResult(`🔗 Protocol: ${window.location.protocol}`);
      
      // Test 4: Simple Supabase client health check
      addResult('⚕️ Testing Supabase client configuration...');
      try {
        // Check if the client is properly configured
        const clientConfig = (supabase as any).supabaseUrl;
        addResult(`📍 Client URL: ${clientConfig || 'Not found'}`);
        
        // Try a very simple operation with shorter timeout
        const healthController = new AbortController();
        setTimeout(() => healthController.abort(), 2000);
        
        // This should fail fast if there's a configuration issue
        const healthCheck = await Promise.race([
          supabase.from('profiles').select('count').limit(0),
          new Promise((_, reject) => 
            setTimeout(() => reject(new Error('Health check timeout')), 2000)
          )
        ]);
        
        addResult('✅ Supabase client appears configured correctly');
      } catch (healthError) {
        addResult(`❌ Supabase client issue: ${healthError instanceof Error ? healthError.message : String(healthError)}`);
      }
      
      // Test 5: Check for proxy/firewall issues
      addResult('🛡️ Testing for proxy/firewall issues...');
      try {
        const proxyController = new AbortController();
        setTimeout(() => proxyController.abort(), 3000);
        
        // Try connecting to a different endpoint
        await fetch('https://api.github.com', {
          method: 'HEAD',
          signal: proxyController.signal
        });
        addResult('✅ External connectivity works (GitHub accessible)');
        
        // Now try Supabase main domain
        await fetch('https://supabase.com', {
          method: 'HEAD',
          signal: proxyController.signal
        });
        addResult('✅ Supabase main domain accessible');
        
      } catch (proxyError) {
        addResult('❌ External connectivity issues detected - possible proxy/firewall');
      }
      
    } catch (error) {
      addResult(`❌ Diagnostic failed: ${error instanceof Error ? error.message : String(error)}`);
    } finally {
      setIsRunning(false);
      addResult('🏁 Network diagnostics complete');
    }
  };

  return (
    <Card className="w-full max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle>Network Connectivity Diagnostics</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <Button 
          onClick={runDiagnostics} 
          disabled={isRunning}
          className="w-full"
        >
          {isRunning ? 'Running Diagnostics...' : 'Run Network Diagnostics'}
        </Button>
        
        {results.length > 0 && (
          <div className="bg-gray-100 p-4 rounded-lg max-h-96 overflow-y-auto">
            <h4 className="font-semibold mb-2">Diagnostic Results:</h4>
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

export default NetworkDiagnosticTest;
