
import React, { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { CheckCircle, XCircle, Clock, Database, AlertTriangle, Server } from 'lucide-react';
import { ServerConnectivityTest } from './ServerConnectivityTest';
import SimpleConnectivityTest from './SimpleConnectivityTest';
import TargetedSupabaseTest from './TargetedSupabaseTest';

export const DatabaseConnectivityTest = () => {
  const [activeTest, setActiveTest] = useState<'backend' | 'supabase' | 'simple' | null>(null);

  return (
    <div className="min-h-screen bg-gray-50 p-4">
      <div className="max-w-4xl mx-auto space-y-6">
        <div className="text-center">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Database Connectivity Testing</h1>
          <p className="text-gray-600">Test your database connections and multi-tenant setup</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card className="cursor-pointer hover:shadow-md transition-shadow" onClick={() => setActiveTest('backend')}>
            <CardHeader className="text-center">
              <Server className="h-12 w-12 mx-auto text-blue-600 mb-2" />
              <CardTitle className="text-lg">Backend Server Test</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-gray-600 text-center">
                Test connectivity to your Deno backend server and multi-tenant database structure
              </p>
            </CardContent>
          </Card>

          <Card className="cursor-pointer hover:shadow-md transition-shadow" onClick={() => setActiveTest('supabase')}>
            <CardHeader className="text-center">
              <Database className="h-12 w-12 mx-auto text-green-600 mb-2" />
              <CardTitle className="text-lg">Supabase Test</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-gray-600 text-center">
                Test direct Supabase connectivity and authentication flow
              </p>
            </CardContent>
          </Card>

          <Card className="cursor-pointer hover:shadow-md transition-shadow" onClick={() => setActiveTest('simple')}>
            <CardHeader className="text-center">
              <CheckCircle className="h-12 w-12 mx-auto text-purple-600 mb-2" />
              <CardTitle className="text-lg">Simple Test</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-gray-600 text-center">
                Basic connectivity test with minimal configuration
              </p>
            </CardContent>
          </Card>
        </div>

        {activeTest === 'backend' && (
          <div className="mt-8">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-semibold">Backend Server Connectivity Test</h2>
              <Button variant="outline" onClick={() => setActiveTest(null)}>
                Back to Tests
              </Button>
            </div>
            <ServerConnectivityTest />
          </div>
        )}

        {activeTest === 'supabase' && (
          <div className="mt-8">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-semibold">Targeted Supabase Test</h2>
              <Button variant="outline" onClick={() => setActiveTest(null)}>
                Back to Tests
              </Button>
            </div>
            <TargetedSupabaseTest />
          </div>
        )}

        {activeTest === 'simple' && (
          <div className="mt-8">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-semibold">Simple Connectivity Test</h2>
              <Button variant="outline" onClick={() => setActiveTest(null)}>
                Back to Tests
              </Button>
            </div>
            <SimpleConnectivityTest />
          </div>
        )}

        {!activeTest && (
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <div className="flex items-start gap-2">
              <AlertTriangle className="h-5 w-5 text-blue-600 mt-0.5" />
              <div className="text-sm text-blue-800">
                <h3 className="font-medium mb-2">Testing Instructions:</h3>
                <ol className="list-decimal list-inside space-y-1">
                  <li><strong>Backend Server Test:</strong> Tests your Deno server on localhost:8000 and the multi-tenant database structure</li>
                  <li><strong>Supabase Test:</strong> Tests direct connection to Supabase for authentication and data access</li>
                  <li><strong>Simple Test:</strong> Basic connectivity test with minimal setup</li>
                </ol>
                <p className="mt-2 text-xs">
                  Start with the Backend Server Test to verify your multi-tenant setup is working correctly.
                </p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
