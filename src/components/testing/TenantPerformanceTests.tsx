
import React, { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { CheckCircle, XCircle, Clock, Users, Database, Zap, Activity } from 'lucide-react';

interface TestResult {
  success: boolean;
  testResults?: any;
  performanceBreakdown?: {
    fastest?: number;
    slowest?: number;
    median?: number;
  };
  error?: string;
  timestamp: string;
}

export const TenantPerformanceTests = () => {
  const [concurrentUsers, setConcurrentUsers] = useState(5);
  const [tenantIterations, setTenantIterations] = useState(100);
  const [schemaCount, setSchemaCount] = useState(3);
  const [concurrentQueries, setConcurrentQueries] = useState(20);
  
  const [testStates, setTestStates] = useState({
    concurrent: { running: false, result: null as TestResult | null },
    resolution: { running: false, result: null as TestResult | null },
    schema: { running: false, result: null as TestResult | null },
    connection: { running: false, result: null as TestResult | null }
  });

  const runTest = async (testType: string, endpoint: string, payload: any) => {
    setTestStates(prev => ({
      ...prev,
      [testType]: { running: true, result: null }
    }));

    try {
      const response = await fetch(`http://localhost:8000${endpoint}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload)
      });

      const result = await response.json();
      
      setTestStates(prev => ({
        ...prev,
        [testType]: { running: false, result }
      }));
    } catch (error) {
      setTestStates(prev => ({
        ...prev,
        [testType]: { 
          running: false, 
          result: { 
            success: false, 
            error: error instanceof Error ? error.message : 'Unknown error',
            timestamp: new Date().toISOString()
          }
        }
      }));
    }
  };

  const runConcurrentTest = () => {
    runTest('concurrent', '/api/test/concurrent-registrations', {
      userCount: concurrentUsers,
      role: 'patient',
      testPrefix: 'perftest'
    });
  };

  const runResolutionTest = () => {
    runTest('resolution', '/api/test/tenant-resolution', {
      iterations: tenantIterations
    });
  };

  const runSchemaTest = () => {
    runTest('schema', '/api/test/schema-creation', {
      testCount: schemaCount
    });
  };

  const runConnectionTest = () => {
    runTest('connection', '/api/test/connection-pool', {
      concurrentQueries: concurrentQueries
    });
  };

  const renderTestResult = (result: TestResult | null, type: string) => {
    if (!result) return null;

    const isSuccess = result.success;
    const Icon = isSuccess ? CheckCircle : XCircle;
    const colorClass = isSuccess ? 'text-green-600' : 'text-red-600';

    return (
      <div className={`mt-4 p-4 border rounded-lg ${isSuccess ? 'border-green-200 bg-green-50' : 'border-red-200 bg-red-50'}`}>
        <div className={`flex items-center gap-2 ${colorClass} font-medium mb-2`}>
          <Icon className="h-5 w-5" />
          {isSuccess ? 'Test Passed' : 'Test Failed'}
        </div>
        
        {isSuccess && result.testResults && (
          <div className="space-y-2 text-sm">
            {type === 'concurrent' && (
              <>
                <div>✅ Successful: {result.testResults.successful}/{result.testResults.totalUsers}</div>
                <div>⏱️ Total Duration: {result.testResults.totalDurationMs?.toFixed(2)}ms</div>
                <div>📊 Throughput: {result.testResults.throughputUsersPerSecond?.toFixed(2)} users/sec</div>
                <div>📈 Average: {result.testResults.averageDurationMs?.toFixed(2)}ms per user</div>
              </>
            )}
            
            {type === 'resolution' && (
              <>
                <div>🔍 Lookups: {result.testResults.totalIterations}</div>
                <div>⏱️ Average Time: {result.testResults.averageLookupTimeMs?.toFixed(2)}ms</div>
                <div>📊 Throughput: {result.testResults.lookupsPerSecond?.toFixed(2)} lookups/sec</div>
                {result.performanceBreakdown && (
                  <>
                    <div>🚀 Fastest: {result.performanceBreakdown.fastest?.toFixed(2)}ms</div>
                    <div>🐌 Slowest: {result.performanceBreakdown.slowest?.toFixed(2)}ms</div>
                  </>
                )}
              </>
            )}
            
            {type === 'schema' && (
              <>
                <div>🏗️ Schemas Created: {result.testResults.successful}/{result.testResults.totalSchemas}</div>
                <div>⏱️ Average Creation: {result.testResults.averageCreationTimeMs?.toFixed(2)}ms</div>
                <div>📊 Throughput: {result.testResults.schemasPerSecond?.toFixed(2)} schemas/sec</div>
              </>
            )}
            
            {type === 'connection' && (
              <>
                <div>🔗 Queries: {result.testResults.successful}/{result.testResults.totalQueries}</div>
                <div>🌐 Unique Connections: {result.testResults.uniqueConnections}</div>
                <div>♻️ Reuse Ratio: {(result.testResults.connectionReuseRatio * 100).toFixed(1)}%</div>
                <div>📊 Throughput: {result.testResults.queriesPerSecond?.toFixed(2)} queries/sec</div>
              </>
            )}
          </div>
        )}
        
        {!isSuccess && (
          <div className="text-red-600 text-sm">
            Error: {result.error}
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold mb-2">Tenant Performance Testing</h2>
        <p className="text-gray-600">Test your multi-tenant architecture performance and identify bottlenecks</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Concurrent Registrations Test */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5" />
              Concurrent Registrations
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div>
                <Label htmlFor="concurrent-users">Number of Users</Label>
                <Input
                  id="concurrent-users"
                  type="number"
                  value={concurrentUsers}
                  onChange={(e) => setConcurrentUsers(parseInt(e.target.value) || 5)}
                  min={1}
                  max={50}
                />
              </div>
              
              <Button 
                onClick={runConcurrentTest}
                disabled={testStates.concurrent.running}
                className="w-full"
              >
                {testStates.concurrent.running ? (
                  <>
                    <Clock className="mr-2 h-4 w-4 animate-spin" />
                    Testing...
                  </>
                ) : (
                  'Test Concurrent Registrations'
                )}
              </Button>
              
              {renderTestResult(testStates.concurrent.result, 'concurrent')}
            </div>
          </CardContent>
        </Card>

        {/* Tenant Resolution Test */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Zap className="h-5 w-5" />
              Tenant Resolution Speed
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div>
                <Label htmlFor="tenant-iterations">Iterations</Label>
                <Input
                  id="tenant-iterations"
                  type="number"
                  value={tenantIterations}
                  onChange={(e) => setTenantIterations(parseInt(e.target.value) || 100)}
                  min={10}
                  max={1000}
                />
              </div>
              
              <Button 
                onClick={runResolutionTest}
                disabled={testStates.resolution.running}
                className="w-full"
              >
                {testStates.resolution.running ? (
                  <>
                    <Clock className="mr-2 h-4 w-4 animate-spin" />
                    Testing...
                  </>
                ) : (
                  'Test Tenant Resolution'
                )}
              </Button>
              
              {renderTestResult(testStates.resolution.result, 'resolution')}
            </div>
          </CardContent>
        </Card>

        {/* Schema Creation Test */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Database className="h-5 w-5" />
              Schema Creation Performance
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div>
                <Label htmlFor="schema-count">Number of Schemas</Label>
                <Input
                  id="schema-count"
                  type="number"
                  value={schemaCount}
                  onChange={(e) => setSchemaCount(parseInt(e.target.value) || 3)}
                  min={1}
                  max={10}
                />
              </div>
              
              <Button 
                onClick={runSchemaTest}
                disabled={testStates.schema.running}
                className="w-full"
              >
                {testStates.schema.running ? (
                  <>
                    <Clock className="mr-2 h-4 w-4 animate-spin" />
                    Testing...
                  </>
                ) : (
                  'Test Schema Creation'
                )}
              </Button>
              
              {renderTestResult(testStates.schema.result, 'schema')}
            </div>
          </CardContent>
        </Card>

        {/* Connection Pool Test */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Activity className="h-5 w-5" />
              Connection Pool Performance
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div>
                <Label htmlFor="concurrent-queries">Concurrent Queries</Label>
                <Input
                  id="concurrent-queries"
                  type="number"
                  value={concurrentQueries}
                  onChange={(e) => setConcurrentQueries(parseInt(e.target.value) || 20)}
                  min={5}
                  max={100}
                />
              </div>
              
              <Button 
                onClick={runConnectionTest}
                disabled={testStates.connection.running}
                className="w-full"
              >
                {testStates.connection.running ? (
                  <>
                    <Clock className="mr-2 h-4 w-4 animate-spin" />
                    Testing...
                  </>
                ) : (
                  'Test Connection Pool'
                )}
              </Button>
              
              {renderTestResult(testStates.connection.result, 'connection')}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};
