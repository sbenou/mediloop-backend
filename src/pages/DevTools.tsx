
import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Play, Square, Terminal, Server, CheckCircle, XCircle } from 'lucide-react';
import { toast } from '@/hooks/use-toast';

const DevTools = () => {
  const [backendStatus, setBackendStatus] = useState<'stopped' | 'starting' | 'running' | 'error'>('stopped');
  const [logs, setLogs] = useState<string[]>([]);

  const addLog = (message: string) => {
    setLogs(prev => [...prev, `${new Date().toLocaleTimeString()}: ${message}`]);
  };

  const checkBackendHealth = async () => {
    try {
      const response = await fetch('http://localhost:8000/health');
      if (response.ok) {
        setBackendStatus('running');
        addLog('Backend health check passed');
        return true;
      } else {
        setBackendStatus('error');
        addLog('Backend health check failed');
        return false;
      }
    } catch (error) {
      setBackendStatus('stopped');
      addLog('Backend is not responding');
      return false;
    }
  };

  const startBackend = async () => {
    setBackendStatus('starting');
    addLog('Starting Deno auth backend...');
    
    toast({
      title: 'Starting Backend',
      description: 'The Deno auth backend is starting up...',
    });

    // Since we can't actually run terminal commands from the browser,
    // we'll simulate the process and check if it's already running
    setTimeout(async () => {
      const isRunning = await checkBackendHealth();
      if (isRunning) {
        toast({
          title: 'Backend Started',
          description: 'The Deno auth backend is now running on port 8000',
        });
      } else {
        setBackendStatus('error');
        addLog('Failed to start backend - please run manually in terminal');
        toast({
          title: 'Manual Start Required',
          description: 'Please run "cd auth-backend && deno task dev" in your terminal',
          variant: 'destructive'
        });
      }
    }, 2000);
  };

  const stopBackend = () => {
    setBackendStatus('stopped');
    addLog('Backend stopped (manual action required in terminal)');
    toast({
      title: 'Backend Stop',
      description: 'Please stop the backend manually in your terminal (Ctrl+C)',
    });
  };

  const clearLogs = () => {
    setLogs([]);
  };

  const getStatusIcon = () => {
    switch (backendStatus) {
      case 'running':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'starting':
        return <Play className="h-4 w-4 text-yellow-500 animate-spin" />;
      case 'error':
        return <XCircle className="h-4 w-4 text-red-500" />;
      default:
        return <Square className="h-4 w-4 text-gray-500" />;
    }
  };

  const getStatusBadge = () => {
    switch (backendStatus) {
      case 'running':
        return <Badge variant="default" className="bg-green-500">Running</Badge>;
      case 'starting':
        return <Badge variant="secondary">Starting...</Badge>;
      case 'error':
        return <Badge variant="destructive">Error</Badge>;
      default:
        return <Badge variant="outline">Stopped</Badge>;
    }
  };

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center space-x-2">
        <Terminal className="h-6 w-6" />
        <h1 className="text-3xl font-bold">Developer Tools</h1>
      </div>

      {/* Backend Status Card */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Server className="h-5 w-5" />
            <span>Deno Auth Backend</span>
            {getStatusIcon()}
            {getStatusBadge()}
          </CardTitle>
          <CardDescription>
            Manage the Deno authentication backend service
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex space-x-2">
            <Button 
              onClick={startBackend} 
              disabled={backendStatus === 'running' || backendStatus === 'starting'}
              className="flex items-center space-x-2"
            >
              <Play className="h-4 w-4" />
              <span>Start Backend</span>
            </Button>
            <Button 
              onClick={stopBackend} 
              variant="destructive"
              disabled={backendStatus === 'stopped'}
              className="flex items-center space-x-2"
            >
              <Square className="h-4 w-4" />
              <span>Stop Backend</span>
            </Button>
            <Button 
              onClick={checkBackendHealth} 
              variant="outline"
              className="flex items-center space-x-2"
            >
              <CheckCircle className="h-4 w-4" />
              <span>Check Health</span>
            </Button>
          </div>

          <div className="p-3 bg-gray-50 rounded-md">
            <h4 className="font-medium mb-2">Manual Commands:</h4>
            <div className="space-y-1 text-sm font-mono">
              <div>Start: <code className="bg-gray-200 px-1 rounded">cd auth-backend && deno task dev</code></div>
              <div>Health Check: <code className="bg-gray-200 px-1 rounded">curl http://localhost:8000/health</code></div>
              <div>Stop: <code className="bg-gray-200 px-1 rounded">Ctrl+C in terminal</code></div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Logs Card */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span>Backend Logs</span>
            <Button onClick={clearLogs} variant="outline" size="sm">Clear Logs</Button>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="bg-black text-green-400 p-4 rounded-md font-mono text-sm max-h-60 overflow-y-auto">
            {logs.length === 0 ? (
              <div className="text-gray-500">No logs yet...</div>
            ) : (
              logs.map((log, index) => (
                <div key={index}>{log}</div>
              ))
            )}
          </div>
        </CardContent>
      </Card>

      {/* Quick Actions Card */}
      <Card>
        <CardHeader>
          <CardTitle>Quick Actions</CardTitle>
          <CardDescription>
            Common development tasks
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-2">
          <Button 
            onClick={() => window.open('http://localhost:8000/health', '_blank')} 
            variant="outline" 
            className="w-full justify-start"
          >
            Open Backend Health Check
          </Button>
          <Button 
            onClick={() => window.open('/test-luxembourg', '_blank')} 
            variant="outline" 
            className="w-full justify-start"
          >
            Open LuxTrust Test Page
          </Button>
          <Button 
            onClick={() => {
              navigator.clipboard.writeText('cd auth-backend && deno task dev');
              toast({ title: 'Copied!', description: 'Start command copied to clipboard' });
            }} 
            variant="outline" 
            className="w-full justify-start"
          >
            Copy Start Command
          </Button>
        </CardContent>
      </Card>
    </div>
  );
};

export default DevTools;
