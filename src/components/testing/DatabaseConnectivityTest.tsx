import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { CheckCircle, XCircle, Clock, Database, Mail, User } from 'lucide-react';

interface TestResult {
  success: boolean;
  message?: string;
  tests?: any;
  error?: string;
  timestamp?: string;
  validations?: {
    emailAvailable: boolean;
    roleExists: boolean;
    availableRoles: any[];
  };
  emailId?: string;
}

export const DatabaseConnectivityTest = () => {
  const [healthResult, setHealthResult] = useState<TestResult | null>(null);
  const [userTestResult, setUserTestResult] = useState<TestResult | null>(null);
  const [emailTestResult, setEmailTestResult] = useState<TestResult | null>(null);
  const [loading, setLoading] = useState<string | null>(null);
  const [testEmail, setTestEmail] = useState('');
  const [testUserData, setTestUserData] = useState({
    email: '',
    fullName: '',
    role: 'patient'
  });

  const runHealthCheck = async () => {
    setLoading('health');
    try {
      const response = await fetch('http://localhost:8000/api/health');
      const result = await response.json();
      setHealthResult(result);
    } catch (error) {
      setHealthResult({
        success: false,
        error: error.message,
        timestamp: new Date().toISOString()
      });
    } finally {
      setLoading(null);
    }
  };

  const testUserCreation = async () => {
    if (!testUserData.email || !testUserData.fullName) {
      alert('Please fill in email and full name');
      return;
    }

    setLoading('user');
    try {
      const response = await fetch('http://localhost:8000/api/test-user-creation', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...testUserData, testMode: true })
      });
      const result = await response.json();
      setUserTestResult(result);
    } catch (error) {
      setUserTestResult({
        success: false,
        error: error.message,
        timestamp: new Date().toISOString()
      });
    } finally {
      setLoading(null);
    }
  };

  const testEmailService = async () => {
    if (!testEmail) {
      alert('Please enter a test email address');
      return;
    }

    setLoading('email');
    try {
      const response = await fetch('http://localhost:8000/api/test-email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: testEmail, testType: 'connectivity' })
      });
      const result = await response.json();
      setEmailTestResult(result);
    } catch (error) {
      setEmailTestResult({
        success: false,
        error: error.message,
        timestamp: new Date().toISOString()
      });
    } finally {
      setLoading(null);
    }
  };

  const ResultIcon = ({ success }: { success: boolean }) => 
    success ? <CheckCircle className="h-5 w-5 text-green-500" /> : <XCircle className="h-5 w-5 text-red-500" />;

  const LoadingIcon = () => <Clock className="h-5 w-5 animate-spin text-blue-500" />;

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-6">
      <h1 className="text-2xl font-bold mb-6">Database Connectivity Tests</h1>
      
      {/* Health Check */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Database className="h-5 w-5" />
            Database Health Check
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <Button 
            onClick={runHealthCheck} 
            disabled={loading === 'health'}
            className="w-full"
          >
            {loading === 'health' ? <LoadingIcon /> : 'Run Health Check'}
          </Button>
          
          {healthResult && (
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <ResultIcon success={healthResult.success} />
                <span className="font-medium">
                  {healthResult.success ? 'Health Check Passed' : 'Health Check Failed'}
                </span>
              </div>
              
              {healthResult.tests && (
                <div className="grid grid-cols-2 gap-2 text-sm">
                  <Badge variant={healthResult.tests.connection ? 'default' : 'destructive'}>
                    Connection: {healthResult.tests.connection ? 'OK' : 'Failed'}
                  </Badge>
                  <Badge variant={healthResult.tests.profilesTable ? 'default' : 'destructive'}>
                    Profiles Table: {healthResult.tests.profilesTable ? 'OK' : 'Failed'}
                  </Badge>
                  <Badge variant={healthResult.tests.rolesTable ? 'default' : 'destructive'}>
                    Roles Table: {healthResult.tests.rolesTable ? 'OK' : 'Failed'}
                  </Badge>
                  <Badge variant="outline">
                    Profile Count: {healthResult.tests.profileCount}
                  </Badge>
                </div>
              )}
              
              {healthResult.error && (
                <div className="bg-red-50 p-3 rounded text-red-700 text-sm">
                  Error: {healthResult.error}
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* User Creation Test */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <User className="h-5 w-5" />
            User Creation Test
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <Input
              placeholder="test@example.com"
              value={testUserData.email}
              onChange={(e) => setTestUserData({...testUserData, email: e.target.value})}
            />
            <Input
              placeholder="Test User"
              value={testUserData.fullName}
              onChange={(e) => setTestUserData({...testUserData, fullName: e.target.value})}
            />
            <select
              className="px-3 py-2 border rounded-md"
              value={testUserData.role}
              onChange={(e) => setTestUserData({...testUserData, role: e.target.value})}
            >
              <option value="patient">Patient</option>
              <option value="doctor">Doctor</option>
              <option value="pharmacist">Pharmacist</option>
            </select>
          </div>
          
          <Button 
            onClick={testUserCreation} 
            disabled={loading === 'user'}
            className="w-full"
          >
            {loading === 'user' ? <LoadingIcon /> : 'Test User Creation (Safe Mode)'}
          </Button>
          
          {userTestResult && (
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <ResultIcon success={userTestResult.success} />
                <span className="font-medium">
                  {userTestResult.success ? 'User Test Passed' : 'User Test Failed'}
                </span>
              </div>
              
              {userTestResult.validations && (
                <div className="grid grid-cols-2 gap-2 text-sm">
                  <Badge variant={userTestResult.validations.emailAvailable ? 'default' : 'secondary'}>
                    Email Available: {userTestResult.validations.emailAvailable ? 'Yes' : 'No'}
                  </Badge>
                  <Badge variant={userTestResult.validations.roleExists ? 'default' : 'destructive'}>
                    Role Exists: {userTestResult.validations.roleExists ? 'Yes' : 'No'}
                  </Badge>
                </div>
              )}
              
              {userTestResult.error && (
                <div className="bg-red-50 p-3 rounded text-red-700 text-sm">
                  Error: {userTestResult.error}
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Email Service Test */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Mail className="h-5 w-5" />
            Email Service Test
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <Input
            placeholder="your-email@example.com"
            value={testEmail}
            onChange={(e) => setTestEmail(e.target.value)}
          />
          
          <Button 
            onClick={testEmailService} 
            disabled={loading === 'email'}
            className="w-full"
          >
            {loading === 'email' ? <LoadingIcon /> : 'Send Test Email'}
          </Button>
          
          {emailTestResult && (
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <ResultIcon success={emailTestResult.success} />
                <span className="font-medium">
                  {emailTestResult.success ? 'Email Test Passed' : 'Email Test Failed'}
                </span>
              </div>
              
              {emailTestResult.success && emailTestResult.emailId && (
                <Badge variant="outline">
                  Email ID: {emailTestResult.emailId}
                </Badge>
              )}
              
              {emailTestResult.error && (
                <div className="bg-red-50 p-3 rounded text-red-700 text-sm">
                  Error: {emailTestResult.error}
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      <div className="bg-blue-50 p-4 rounded-lg">
        <h3 className="font-medium text-blue-900 mb-2">Testing Instructions:</h3>
        <ol className="text-sm text-blue-800 space-y-1">
          <li>1. Run the Health Check first to verify database connectivity</li>
          <li>2. Test user creation with safe mode to validate the process</li>
          <li>3. Test email service with your email address</li>
          <li>4. All tests should pass before proceeding to auth flow migration</li>
        </ol>
      </div>
    </div>
  );
};
