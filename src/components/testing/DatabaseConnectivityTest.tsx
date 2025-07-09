
import React, { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { CheckCircle, XCircle, Clock, Database, AlertTriangle, Server } from 'lucide-react';
import { ServerConnectivityTest } from './ServerConnectivityTest';

export const DatabaseConnectivityTest = () => {
  const [activeTest, setActiveTest] = useState<'backend' | null>(null);

  return (
    <div className="min-h-screen bg-gray-50 p-4">
      <div className="max-w-4xl mx-auto space-y-6">
        <div className="text-center">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Database Connectivity Testing</h1>
          <p className="text-gray-600">Test your Neon PostgreSQL database connection via Deno backend</p>
        </div>

        <div className="grid grid-cols-1 gap-4 max-w-md mx-auto">
          <Card className="cursor-pointer hover:shadow-md transition-shadow" onClick={() => setActiveTest('backend')}>
            <CardHeader className="text-center">
              <Server className="h-12 w-12 mx-auto text-blue-600 mb-2" />
              <CardTitle className="text-lg">Neon Database Test</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-gray-600 text-center">
                Test connectivity to your Deno backend server and Neon PostgreSQL database with multi-tenant structure
              </p>
            </CardContent>
          </Card>
        </div>

        {activeTest === 'backend' && (
          <div className="mt-8">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-semibold">Neon Database Connectivity Test</h2>
              <Button variant="outline" onClick={() => setActiveTest(null)}>
                Back to Tests
              </Button>
            </div>
            <ServerConnectivityTest />
          </div>
        )}

        {!activeTest && (
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <div className="flex items-start gap-2">
              <AlertTriangle className="h-5 w-5 text-blue-600 mt-0.5" />
              <div className="text-sm text-blue-800">
                <h3 className="font-medium mb-2">Testing Instructions:</h3>
                <p className="mb-2">
                  This test will verify that your Deno backend server (localhost:8000) can successfully connect to your Neon PostgreSQL database and that your multi-tenant database structure is working correctly.
                </p>
                <p className="text-xs">
                  Make sure your Deno backend is running on localhost:8000 before starting the test.
                </p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
