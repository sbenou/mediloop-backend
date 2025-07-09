
import React, { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { CheckCircle, XCircle, User, Shield, Database } from 'lucide-react';
import { authClient } from '@/services/authClient';

export const JWTAuthTest = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [results, setResults] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const addResult = (result: any) => {
    setResults(prev => [result, ...prev]);
  };

  const testRegister = async () => {
    if (!email || !password || !fullName) {
      addResult({
        type: 'register',
        success: false,
        message: 'Please fill in all fields',
        timestamp: new Date().toISOString()
      });
      return;
    }

    setIsLoading(true);
    try {
      const response = await authClient.register(email, password, fullName, 'patient');
      addResult({
        type: 'register',
        success: true,
        message: 'Registration successful',
        data: response,
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      addResult({
        type: 'register',
        success: false,
        message: error instanceof Error ? error.message : 'Registration failed',
        timestamp: new Date().toISOString()
      });
    } finally {
      setIsLoading(false);
    }
  };

  const testLogin = async () => {
    if (!email || !password) {
      addResult({
        type: 'login',
        success: false,
        message: 'Please enter email and password',
        timestamp: new Date().toISOString()
      });
      return;
    }

    setIsLoading(true);
    try {
      const response = await authClient.login(email, password);
      addResult({
        type: 'login',
        success: true,
        message: 'Login successful',
        data: response,
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      addResult({
        type: 'login',
        success: false,
        message: error instanceof Error ? error.message : 'Login failed',
        timestamp: new Date().toISOString()
      });
    } finally {
      setIsLoading(false);
    }
  };

  const testProtectedRoute = async () => {
    setIsLoading(true);
    try {
      const response = await authClient.testProtectedRoute();
      addResult({
        type: 'protected',
        success: true,
        message: 'Protected route access successful',
        data: response,
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      addResult({
        type: 'protected',
        success: false,
        message: error instanceof Error ? error.message : 'Protected route failed',
        timestamp: new Date().toISOString()
      });
    } finally {
      setIsLoading(false);
    }
  };

  const testProfile = async () => {
    setIsLoading(true);
    try {
      const response = await authClient.getProfile();
      addResult({
        type: 'profile',
        success: true,
        message: 'Profile fetch successful',
        data: response,
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      addResult({
        type: 'profile',
        success: false,
        message: error instanceof Error ? error.message : 'Profile fetch failed',
        timestamp: new Date().toISOString()
      });
    } finally {
      setIsLoading(false);
    }
  };

  const clearResults = () => {
    setResults([]);
  };

  const logout = () => {
    authClient.logout();
    addResult({
      type: 'logout',
      success: true,
      message: 'Logged out successfully',
      timestamp: new Date().toISOString()
    });
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold mb-2">JWT Authentication Testing</h2>
        <p className="text-gray-600">Test your Deno backend JWT authentication system</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Test Controls */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <User className="h-5 w-5" />
              Authentication Tests
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="test@example.com"
                />
              </div>
              <div>
                <Label htmlFor="password">Password</Label>
                <Input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="password123"
                />
              </div>
            </div>
            
            <div>
              <Label htmlFor="fullName">Full Name (for registration)</Label>
              <Input
                id="fullName"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                placeholder="John Doe"
              />
            </div>

            <div className="grid grid-cols-2 gap-2">
              <Button onClick={testRegister} disabled={isLoading}>
                Register
              </Button>
              <Button onClick={testLogin} disabled={isLoading}>
                Login
              </Button>
              <Button onClick={testProtectedRoute} disabled={isLoading}>
                Test Protected
              </Button>
              <Button onClick={testProfile} disabled={isLoading}>
                Get Profile
              </Button>
            </div>

            <div className="flex gap-2">
              <Button onClick={logout} variant="outline" disabled={isLoading}>
                Logout
              </Button>
              <Button onClick={clearResults} variant="outline">
                Clear Results
              </Button>
            </div>

            <div className="text-sm text-gray-500 p-2 bg-gray-50 rounded">
              <p>Status: {authClient.isAuthenticated() ? '🟢 Authenticated' : '🔴 Not authenticated'}</p>
              <p>Token: {authClient.getToken() ? '✓ Present' : '✗ Missing'}</p>
            </div>
          </CardContent>
        </Card>

        {/* Results */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Shield className="h-5 w-5" />
              Test Results
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3 max-h-96 overflow-y-auto">
              {results.length === 0 && (
                <p className="text-gray-500 text-center py-4">No test results yet</p>
              )}
              
              {results.map((result, index) => (
                <div
                  key={index}
                  className={`p-3 border rounded-lg ${
                    result.success ? 'border-green-200 bg-green-50' : 'border-red-200 bg-red-50'
                  }`}
                >
                  <div className={`flex items-center gap-2 ${
                    result.success ? 'text-green-600' : 'text-red-600'
                  } font-medium mb-1`}>
                    {result.success ? (
                      <CheckCircle className="h-4 w-4" />
                    ) : (
                      <XCircle className="h-4 w-4" />
                    )}
                    {result.type.toUpperCase()}: {result.message}
                  </div>
                  
                  {result.data && (
                    <pre className="text-xs bg-white p-2 rounded mt-2 overflow-x-auto">
                      {JSON.stringify(result.data, null, 2)}
                    </pre>
                  )}
                  
                  <div className="text-xs text-gray-500 mt-1">
                    {new Date(result.timestamp).toLocaleTimeString()}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};
