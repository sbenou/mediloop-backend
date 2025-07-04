
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { CheckCircle, XCircle, Clock, Server } from 'lucide-react';

interface ConnectivityResult {
  test: string;
  success: boolean;
  details: string;
  timestamp: string;
}

export const ServerConnectivityTest = () => {
  const [results, setResults] = useState<ConnectivityResult[]>([]);
  const [loading, setLoading] = useState(false);

  const addResult = (test: string, success: boolean, details: string) => {
    const result: ConnectivityResult = {
      test,
      success,
      details,
      timestamp: new Date().toISOString()
    };
    setResults(prev => [...prev, result]);
    console.log(`🧪 Test Result - ${test}:`, result);
  };

  const runConnectivityTests = async () => {
    setLoading(true);
    setResults([]);
    
    const backendUrl = 'http://localhost:8000';
    
    // Test 1: Basic server reachability (no CORS)
    try {
      console.log('🧪 Test 1: Basic server connectivity');
      const response = await fetch(`${backendUrl}/api/health`, {
        method: 'GET',
        mode: 'no-cors' // This bypasses CORS completely
      });
      addResult('Basic Server Reachability', true, `Server responded (no-cors mode)`);
    } catch (error) {
      addResult('Basic Server Reachability', false, `Error: ${error.message}`);
    }

    // Test 2: CORS preflight test
    try {
      console.log('🧪 Test 2: CORS preflight test');
      const response = await fetch(`${backendUrl}/api/health`, {
        method: 'OPTIONS',
        headers: {
          'Origin': 'https://preview--mediloop.lovable.app',
          'Access-Control-Request-Method': 'GET',
          'Access-Control-Request-Headers': 'content-type'
        }
      });
      
      const corsHeaders = {
        'Access-Control-Allow-Origin': response.headers.get('Access-Control-Allow-Origin'),
        'Access-Control-Allow-Methods': response.headers.get('Access-Control-Allow-Methods'),
        'Access-Control-Allow-Headers': response.headers.get('Access-Control-Allow-Headers')
      };
      
      addResult('CORS Preflight', response.ok, `Status: ${response.status}, Headers: ${JSON.stringify(corsHeaders)}`);
    } catch (error) {
      addResult('CORS Preflight', false, `Error: ${error.message}`);
    }

    // Test 3: Full CORS request
    try {
      console.log('🧪 Test 3: Full CORS request');
      const response = await fetch(`${backendUrl}/api/health`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json'
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        addResult('Full CORS Request', true, `Success: ${JSON.stringify(data.message || 'Response received')}`);
      } else {
        addResult('Full CORS Request', false, `HTTP ${response.status}: ${response.statusText}`);
      }
    } catch (error) {
      addResult('Full CORS Request', false, `Error: ${error.message}`);
    }

    // Test 4: Simple ping test with different origin
    try {
      console.log('🧪 Test 4: Simple ping with custom headers');
      const response = await fetch(`${backendUrl}/api/health`, {
        method: 'GET',
        headers: {
          'X-Test': 'connectivity-test',
          'Content-Type': 'application/json'
        }
      });
      
      addResult('Custom Headers Test', response.ok, `Status: ${response.status}, Type: ${response.type}`);
    } catch (error) {
      addResult('Custom Headers Test', false, `Error: ${error.message}`);
    }

    setLoading(false);
  };

  const ResultIcon = ({ success }: { success: boolean }) => 
    success ? <CheckCircle className="h-4 w-4 text-green-500" /> : <XCircle className="h-4 w-4 text-red-500" />;

  return (
    <Card className="w-full max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Server className="h-5 w-5" />
          Server Connectivity Diagnostics
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <Button 
          onClick={runConnectivityTests} 
          disabled={loading}
          className="w-full"
        >
          {loading ? (
            <>
              <Clock className="h-4 w-4 animate-spin mr-2" />
              Running Diagnostics...
            </>
          ) : (
            'Run Connectivity Tests'
          )}
        </Button>
        
        {results.length > 0 && (
          <div className="space-y-3">
            <h3 className="font-medium">Test Results:</h3>
            {results.map((result, index) => (
              <div key={index} className="flex items-start gap-3 p-3 border rounded-lg">
                <ResultIcon success={result.success} />
                <div className="flex-1 min-w-0">
                  <div className="font-medium text-sm">{result.test}</div>
                  <div className="text-xs text-gray-600 break-all">{result.details}</div>
                  <div className="text-xs text-gray-400">{new Date(result.timestamp).toLocaleTimeString()}</div>
                </div>
              </div>
            ))}
          </div>
        )}
        
        <div className="bg-blue-50 p-3 rounded text-sm text-blue-800">
          <strong>Note:</strong> This diagnostic tool tests different aspects of server connectivity:
          <ul className="list-disc list-inside mt-1 space-y-1">
            <li>Basic reachability (bypassing CORS)</li>
            <li>CORS preflight OPTIONS request</li>
            <li>Full CORS-enabled GET request</li>
            <li>Custom headers test</li>
          </ul>
        </div>
      </CardContent>
    </Card>
  );
};
