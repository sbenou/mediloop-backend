
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { runConnectionNotificationTests, debugFirebaseIntegration } from '@/utils/connectionNotificationTests';
import { Play, RefreshCw, Bug, CheckCircle, XCircle, Clock, AlertTriangle } from 'lucide-react';
import SimpleConnectivityTest from './SimpleConnectivityTest';
import NetworkDiagnosticTest from './NetworkDiagnosticTest';

interface TestResult {
  test: string;
  success: boolean;
  data?: any;
  error?: string;
  duration: number;
}

interface TestSummary {
  total: number;
  passed: number;
  failed: number;
  successRate: string;
  totalTime: string;
  failedTests: Array<{ test: string; error: string }>;
}

const NotificationTestPanel = () => {
  const [isRunning, setIsRunning] = useState(false);
  const [results, setResults] = useState<TestResult[]>([]);
  const [summary, setSummary] = useState<TestSummary | null>(null);
  const [firebaseDebug, setFirebaseDebug] = useState<any>(null);
  const [logs, setLogs] = useState<string[]>([]);
  const [showSimpleTest, setShowSimpleTest] = useState(true);
  const [showNetworkTest, setShowNetworkTest] = useState(false);

  const addLog = (message: string) => {
    const timestamp = new Date().toLocaleTimeString();
    setLogs(prev => [...prev, `[${timestamp}] ${message}`]);
  };

  const runTests = async () => {
    setIsRunning(true);
    setResults([]);
    setSummary(null);
    setLogs([]);
    
    addLog('Starting connection notification tests...');
    
    try {
      const testResults = await runConnectionNotificationTests();
      setResults(testResults.results);
      setSummary(testResults.summary);
      addLog(`Tests completed: ${testResults.summary.passed}/${testResults.summary.total} passed`);
    } catch (error) {
      addLog(`Test suite failed: ${error instanceof Error ? error.message : String(error)}`);
    } finally {
      setIsRunning(false);
    }
  };

  const runFirebaseDebug = async () => {
    addLog('Running Firebase integration debug...');
    
    try {
      const debug = await debugFirebaseIntegration();
      setFirebaseDebug(debug);
      addLog('Firebase debug completed');
    } catch (error) {
      addLog(`Firebase debug failed: ${error instanceof Error ? error.message : String(error)}`);
    }
  };

  const getStatusIcon = (success: boolean) => {
    return success ? (
      <CheckCircle className="h-4 w-4 text-green-500" />
    ) : (
      <XCircle className="h-4 w-4 text-red-500" />
    );
  };

  const getStatusBadge = (success: boolean) => {
    return (
      <Badge variant={success ? "default" : "destructive"}>
        {success ? "PASS" : "FAIL"}
      </Badge>
    );
  };

  return (
    <div className="space-y-6 p-6">
      {/* Critical connectivity issues detected */}
      <Card className="border-red-200 bg-red-50">
        <CardContent className="pt-6">
          <div className="flex items-start gap-3">
            <AlertTriangle className="h-5 w-5 text-red-500 mt-0.5" />
            <div>
              <h3 className="font-semibold text-red-800 mb-2">Critical Connectivity Issues Detected</h3>
              <p className="text-sm text-red-700 mb-3">
                All Supabase operations are timing out. This indicates a network connectivity problem between your application and the Supabase servers.
              </p>
              <div className="flex gap-2">
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => setShowNetworkTest(!showNetworkTest)}
                >
                  {showNetworkTest ? 'Hide' : 'Show'} Network Diagnostics
                </Button>
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => setShowSimpleTest(!showSimpleTest)}
                >
                  {showSimpleTest ? 'Hide' : 'Show'} Simple Test
                </Button>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Network diagnostic test */}
      {showNetworkTest && <NetworkDiagnosticTest />}

      {/* Simple connectivity test */}
      {showSimpleTest && <SimpleConnectivityTest />}

      {/* Original test suite */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Bug className="h-5 w-5" />
            Full Connection Notification Test Suite
            <Badge variant="destructive">Currently Non-Functional</Badge>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
            <p className="text-sm text-yellow-800">
              <strong>Note:</strong> The full test suite will not work until the connectivity issues are resolved. 
              Please run the Network Diagnostics first to identify the root cause.
            </p>
          </div>
          
          <div className="flex gap-4">
            <Button 
              onClick={runTests} 
              disabled={isRunning}
              className="flex items-center gap-2"
              variant="outline"
            >
              {isRunning ? (
                <RefreshCw className="h-4 w-4 animate-spin" />
              ) : (
                <Play className="h-4 w-4" />
              )}
              {isRunning ? 'Running Tests...' : 'Run Full Test Suite (Will Fail)'}
            </Button>
            
            <Button 
              variant="outline"
              onClick={runFirebaseDebug}
              className="flex items-center gap-2"
            >
              <Bug className="h-4 w-4" />
              Debug Firebase
            </Button>
          </div>

          {summary && (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Test Summary</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-4">
                  <div>
                    <div className="text-2xl font-bold">{summary.total}</div>
                    <div className="text-sm text-gray-600">Total Tests</div>
                  </div>
                  <div>
                    <div className="text-2xl font-bold text-green-600">{summary.passed}</div>
                    <div className="text-sm text-gray-600">Passed</div>
                  </div>
                  <div>
                    <div className="text-2xl font-bold text-red-600">{summary.failed}</div>
                    <div className="text-sm text-gray-600">Failed</div>
                  </div>
                  <div>
                    <div className="text-2xl font-bold">{summary.successRate}</div>
                    <div className="text-sm text-gray-600">Success Rate</div>
                  </div>
                  <div>
                    <div className="text-2xl font-bold">{summary.totalTime}</div>
                    <div className="text-sm text-gray-600">Total Time</div>
                  </div>
                </div>

                {summary.failedTests.length > 0 && (
                  <div>
                    <h4 className="font-semibold text-red-600 mb-2">Failed Tests:</h4>
                    <ul className="space-y-1">
                      {summary.failedTests.map((failure, index) => (
                        <li key={index} className="text-sm">
                          <span className="font-medium">{failure.test}:</span> {failure.error}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {results.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Detailed Results</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {results.map((result, index) => (
                    <div key={index} className="flex items-center justify-between p-3 border rounded-lg">
                      <div className="flex items-center gap-3">
                        {getStatusIcon(result.success)}
                        <span className="font-medium">{result.test}</span>
                        {getStatusBadge(result.success)}
                      </div>
                      <div className="flex items-center gap-2 text-sm text-gray-600">
                        <Clock className="h-3 w-3" />
                        {result.duration}ms
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {firebaseDebug && (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Firebase Debug Info</CardTitle>
              </CardHeader>
              <CardContent>
                <pre className="bg-gray-100 p-4 rounded text-sm overflow-auto">
                  {JSON.stringify(firebaseDebug, null, 2)}
                </pre>
              </CardContent>
            </Card>
          )}

          {logs.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Test Logs</CardTitle>
              </CardHeader>
              <CardContent>
                <Textarea
                  value={logs.join('\n')}
                  readOnly
                  className="h-40 font-mono text-sm"
                  placeholder="Test logs will appear here..."
                />
              </CardContent>
            </Card>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default NotificationTestPanel;
