
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { CheckCircle, XCircle, Clock, Server, AlertTriangle } from 'lucide-react';

interface ConnectivityResult {
  test: string;
  success: boolean;
  details: string;
  timestamp: string;
  error?: any;
}

export const ServerConnectivityTest = () => {
  const [results, setResults] = useState<ConnectivityResult[]>([]);
  const [loading, setLoading] = useState(false);

  const addResult = (test: string, success: boolean, details: string, error?: any) => {
    const result: ConnectivityResult = {
      test,
      success,
      details,
      timestamp: new Date().toISOString(),
      error
    };
    setResults(prev => [...prev, result]);
    console.log(`🧪 Test Result - ${test}:`, result);
  };

  const runConnectivityTests = async () => {
    setLoading(true);
    setResults([]);
    
    const backendUrl = 'http://localhost:8000';
    
    // Test 0: Simple port check
    console.log('🧪 Test 0: Simple server port check');
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 5000);
      
      const response = await fetch(`${backendUrl}`, {
        method: 'GET',
        signal: controller.signal
      });
      clearTimeout(timeoutId);
      
      addResult(
        'Server Port Check', 
        true, 
        `Server responding on port 8000. Status: ${response.status}`
      );
    } catch (error) {
      console.error('Port check error:', error);
      addResult(
        'Server Port Check', 
        false, 
        `Cannot connect to localhost:8000. Error: ${error.name} - ${error.message}. Is the Deno server running?`,
        error
      );
    }

    // Test 1: Basic server reachability with timeout
    console.log('🧪 Test 1: Basic server connectivity with timeout');
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 5000);
      
      const response = await fetch(`${backendUrl}/api/health`, {
        method: 'GET',
        mode: 'no-cors',
        signal: controller.signal
      });
      clearTimeout(timeoutId);
      
      addResult(
        'Basic Server Reachability', 
        true, 
        `Server responded (no-cors mode). Response type: ${response.type}`
      );
    } catch (error) {
      console.error('Basic connectivity error:', error);
      if (error.name === 'AbortError') {
        addResult(
          'Basic Server Reachability', 
          false, 
          'Request timed out after 5 seconds. Server may not be running on localhost:8000',
          error
        );
      } else {
        addResult(
          'Basic Server Reachability', 
          false, 
          `Network error: ${error.name} - ${error.message}. Check if Deno server is running.`,
          error
        );
      }
    }

    // Test 2: CORS preflight test with detailed error handling
    console.log('🧪 Test 2: CORS preflight test');
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 5000);
      
      const response = await fetch(`${backendUrl}/api/health`, {
        method: 'OPTIONS',
        headers: {
          'Origin': window.location.origin,
          'Access-Control-Request-Method': 'GET',
          'Access-Control-Request-Headers': 'content-type'
        },
        signal: controller.signal
      });
      clearTimeout(timeoutId);
      
      const corsHeaders = {
        'Access-Control-Allow-Origin': response.headers.get('Access-Control-Allow-Origin'),
        'Access-Control-Allow-Methods': response.headers.get('Access-Control-Allow-Methods'),
        'Access-Control-Allow-Headers': response.headers.get('Access-Control-Allow-Headers')
      };
      
      addResult(
        'CORS Preflight', 
        response.ok, 
        `Status: ${response.status} ${response.statusText}. Headers: ${JSON.stringify(corsHeaders, null, 2)}`
      );
    } catch (error) {
      console.error('CORS preflight error:', error);
      if (error.name === 'AbortError') {
        addResult(
          'CORS Preflight', 
          false, 
          'OPTIONS request timed out after 5 seconds',
          error
        );
      } else {
        addResult(
          'CORS Preflight', 
          false, 
          `CORS preflight failed: ${error.name} - ${error.message}`,
          error
        );
      }
    }

    // Test 3: Full CORS request with timeout
    console.log('🧪 Test 3: Full CORS request');
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 10000); // Longer timeout for full request
      
      const response = await fetch(`${backendUrl}/api/health`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Origin': window.location.origin
        },
        signal: controller.signal
      });
      clearTimeout(timeoutId);
      
      if (response.ok) {
        try {
          const data = await response.json();
          addResult(
            'Full CORS Request', 
            true, 
            `Success! Server response: ${JSON.stringify(data, null, 2)}`
          );
        } catch (jsonError) {
          addResult(
            'Full CORS Request', 
            true, 
            `Response received but couldn't parse JSON. Status: ${response.status}`
          );
        }
      } else {
        addResult(
          'Full CORS Request', 
          false, 
          `HTTP ${response.status}: ${response.statusText}`
        );
      }
    } catch (error) {
      console.error('Full CORS request error:', error);
      if (error.name === 'AbortError') {
        addResult(
          'Full CORS Request', 
          false, 
          'Request timed out after 10 seconds',
          error
        );
      } else {
        addResult(
          'Full CORS Request', 
          false, 
          `CORS request failed: ${error.name} - ${error.message}`,
          error
        );
      }
    }

    // Test 4: Server status check
    console.log('🧪 Test 4: Server status check');
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 5000);
      
      // Try to connect to the server root first
      const rootResponse = await fetch(`${backendUrl}/`, {
        method: 'GET',
        mode: 'no-cors',
        signal: controller.signal
      });
      clearTimeout(timeoutId);
      
      addResult(
        'Server Status Check', 
        true, 
        `Server root accessible. Response type: ${rootResponse.type}`
      );
    } catch (error) {
      console.error('Server status error:', error);
      addResult(
        'Server Status Check', 
        false, 
        `Cannot reach server root: ${error.name} - ${error.message}`,
        error
      );
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
        <div className="bg-amber-50 p-3 rounded-lg border border-amber-200">
          <div className="flex items-start gap-2">
            <AlertTriangle className="h-4 w-4 text-amber-600 mt-0.5" />
            <div className="text-sm text-amber-800">
              <strong>Before running tests:</strong>
              <ol className="list-decimal list-inside mt-1 space-y-1">
                <li>Make sure you have started the Deno backend server</li>
                <li>Navigate to the <code>auth-backend</code> folder</li>
                <li>Run: <code>deno task dev</code> or <code>deno run --allow-net --allow-env --allow-read main.ts</code></li>
                <li>Check that you see server startup logs in your terminal</li>
              </ol>
            </div>
          </div>
        </div>

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
                  <div className="text-xs text-gray-600 break-all whitespace-pre-wrap">{result.details}</div>
                  <div className="text-xs text-gray-400">{new Date(result.timestamp).toLocaleTimeString()}</div>
                  {result.error && (
                    <details className="mt-2">
                      <summary className="text-xs text-red-600 cursor-pointer">Error Details</summary>
                      <pre className="text-xs text-red-500 mt-1 bg-red-50 p-2 rounded overflow-auto">
                        {JSON.stringify(result.error, null, 2)}
                      </pre>
                    </details>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
        
        <div className="bg-blue-50 p-3 rounded text-sm text-blue-800">
          <strong>Interpretation Guide:</strong>
          <ul className="list-disc list-inside mt-1 space-y-1">
            <li><strong>Server Port Check:</strong> Verifies if anything is listening on port 8000</li>
            <li><strong>Basic Reachability:</strong> Tests if server responds (bypassing CORS)</li>
            <li><strong>CORS Preflight:</strong> Tests OPTIONS request with CORS headers</li>
            <li><strong>Full CORS Request:</strong> Tests actual GET request with CORS</li>
            <li><strong>Server Status:</strong> Tests server root endpoint</li>
          </ul>
          <div className="mt-2 p-2 bg-blue-100 rounded">
            <strong>If all tests fail:</strong> The Deno server is likely not running. Start it with <code>cd auth-backend && deno task dev</code>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
