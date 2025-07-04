
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Terminal, Play, Square, RotateCcw, Copy, CheckCircle } from 'lucide-react';
import { useToast } from "@/hooks/use-toast";
import UnifiedLayoutTemplate from "@/components/layout/UnifiedLayoutTemplate";

const DenoBackendManagement = () => {
  const [terminalOutput, setTerminalOutput] = useState('');
  const [isRunning, setIsRunning] = useState(false);
  const { toast } = useToast();

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast({
      title: "Copied to clipboard",
      description: "Command copied successfully",
    });
  };

  const commands = [
    {
      title: "Development Mode (Task)",
      description: "Start the auth backend in development mode with hot reload using Deno task",
      command: "cd auth-backend && deno task dev",
      badge: "Development"
    },
    {
      title: "Development Mode (Direct)",
      description: "Start the auth backend directly with Deno run command",
      command: "cd auth-backend && deno run --allow-net --allow-env --allow-read main.ts",
      badge: "Development"
    },
    {
      title: "Production Mode",
      description: "Start the auth backend in production mode",
      command: "cd auth-backend && deno task start",
      badge: "Production"
    },
    {
      title: "Cached Production",
      description: "Start with cached modules only (production deployment)",
      command: "cd auth-backend && deno task prod",
      badge: "Production"
    }
  ];

  const environmentVariables = [
    { key: "DATABASE_URL", description: "Your Neon PostgreSQL database connection string", required: true, example: "postgresql://user:password@host.neon.tech/database?sslmode=require" },
    { key: "JWT_SECRET", description: "Secret key for JWT token signing", required: true, example: "your-super-secret-jwt-key" },
    { key: "RESEND_API_KEY", description: "Resend email service API key", required: true, example: "re_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx" },
    { key: "GOOGLE_CLIENT_ID", description: "Google OAuth client ID", required: false, example: "xxxxx.apps.googleusercontent.com" },
    { key: "GOOGLE_CLIENT_SECRET", description: "Google OAuth client secret", required: false, example: "GOCSPX-xxxxxxxxxxxxxxxxxxxxxxxx" },
    { key: "FRANCECONNECT_CLIENT_ID", description: "FranceConnect OAuth client ID", required: false, example: "your-franceconnect-client-id" },
    { key: "FRANCECONNECT_CLIENT_SECRET", description: "FranceConnect OAuth client secret", required: false, example: "your-franceconnect-client-secret" },
    { key: "LUXTRUST_CLIENT_ID", description: "LuxTrust OAuth client ID", required: false, example: "your-luxtrust-client-id" },
    { key: "LUXTRUST_CLIENT_SECRET", description: "LuxTrust OAuth client secret", required: false, example: "your-luxtrust-client-secret" },
    { key: "FRONTEND_URL", description: "Frontend application URL", required: true, example: "http://localhost:5173" },
    { key: "SERVICE_URL", description: "Backend service URL", required: true, example: "http://localhost:8000" }
  ];

  const simulateTerminalOutput = (command: string) => {
    setIsRunning(true);
    setTerminalOutput(prev => prev + `$ ${command}\n`);
    
    // Simulate starting the server
    setTimeout(() => {
      setTerminalOutput(prev => prev + "Deno Backend Service starting on port 8000...\n");
    }, 500);

    setTimeout(() => {
      setTerminalOutput(prev => prev + "✅ Server is running at http://localhost:8000\n");
      setTerminalOutput(prev => prev + "📋 Health check available at: http://localhost:8000/api/health\n");
      setTerminalOutput(prev => prev + "🔐 Auth endpoints: /auth/*\n");
      setTerminalOutput(prev => prev + "🇱🇺 LuxTrust endpoints: /luxtrust/*\n");
      setTerminalOutput(prev => prev + "🔗 OAuth endpoints: /oauth/*\n");
      setTerminalOutput(prev => prev + "📧 Email endpoints: /api/test-email\n");
      setTerminalOutput(prev => prev + "👤 User test endpoints: /api/test-user-creation\n");
      setTerminalOutput(prev => prev + "🗄️ Connected to Neon PostgreSQL database\n");
    }, 1000);
  };

  const stopServer = () => {
    setIsRunning(false);
    setTerminalOutput(prev => prev + "\n🛑 Server stopped\n");
  };

  const clearTerminal = () => {
    setTerminalOutput('');
  };

  return (
    <UnifiedLayoutTemplate>
      <div className="container mx-auto p-6 space-y-6">
        <div className="flex items-center gap-2 mb-6">
          <Terminal className="h-6 w-6" />
          <h1 className="text-3xl font-bold">Deno Backend Management</h1>
        </div>

        {/* Quick Start Instructions */}
        <Card>
          <CardHeader>
            <CardTitle>Quick Start Instructions</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="bg-muted p-4 rounded-lg">
              <h3 className="font-semibold mb-2">Prerequisites:</h3>
              <ul className="list-disc list-inside space-y-1 text-sm">
                <li>Deno runtime installed on your system</li>
                <li>Environment variables configured (see below)</li>
                <li>Neon PostgreSQL database connection available</li>
              </ul>
            </div>
            
            <div className="bg-blue-50 p-4 rounded-lg border-l-4 border-blue-400">
              <p className="text-sm">
                <strong>Important:</strong> You need to start your local Deno backend server first. 
                The backend runs on localhost:8000 and connects to your Neon database in the cloud.
              </p>
            </div>
            
            <div className="bg-amber-50 p-4 rounded-lg border-l-4 border-amber-400">
              <p className="text-sm">
                <strong>Setup Flow:</strong> Frontend (localhost:5173) → Deno Backend (localhost:8000) → Neon Database (cloud)
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Environment Variables */}
        <Card>
          <CardHeader>
            <CardTitle>Environment Variables Configuration</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <p className="text-sm text-muted-foreground mb-4">
                Configure these environment variables in your system or create a .env file in the auth-backend directory:
              </p>
              {environmentVariables.map((env) => (
                <div key={env.key} className="p-3 border rounded-lg">
                  <div className="flex items-center gap-2 mb-2">
                    <code className="text-sm font-mono bg-muted px-2 py-1 rounded">{env.key}</code>
                    {env.required && <Badge variant="destructive" className="text-xs">Required</Badge>}
                  </div>
                  <p className="text-sm text-muted-foreground mb-1">{env.description}</p>
                  <p className="text-xs text-gray-500">Example: <code>{env.example}</code></p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Commands */}
        <Card>
          <CardHeader>
            <CardTitle>Available Commands</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {commands.map((cmd, index) => (
              <div key={index} className="border rounded-lg p-4">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <h3 className="font-semibold">{cmd.title}</h3>
                    <Badge variant={cmd.badge === 'Development' ? 'default' : 'secondary'}>
                      {cmd.badge}
                    </Badge>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => copyToClipboard(cmd.command)}
                    >
                      <Copy className="h-3 w-3" />
                    </Button>
                    <Button
                      size="sm"
                      onClick={() => simulateTerminalOutput(cmd.command)}
                      disabled={isRunning}
                    >
                      <Play className="h-3 w-3 mr-1" />
                      Run
                    </Button>
                  </div>
                </div>
                <p className="text-sm text-muted-foreground mb-2">{cmd.description}</p>
                <code className="text-sm bg-muted p-2 rounded block font-mono">
                  {cmd.command}
                </code>
              </div>
            ))}
          </CardContent>
        </Card>

        {/* Terminal Simulator */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span>Terminal Output</span>
              <div className="flex gap-2">
                {isRunning && (
                  <Button variant="destructive" size="sm" onClick={stopServer}>
                    <Square className="h-3 w-3 mr-1" />
                    Stop
                  </Button>
                )}
                <Button variant="outline" size="sm" onClick={clearTerminal}>
                  <RotateCcw className="h-3 w-3 mr-1" />
                  Clear
                </Button>
              </div>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="bg-black text-green-400 p-4 rounded-lg font-mono text-sm min-h-[200px]">
              <Textarea
                value={terminalOutput}
                readOnly
                className="bg-transparent border-none text-green-400 font-mono resize-none focus:ring-0 focus:outline-none"
                placeholder="Terminal output will appear here..."
                rows={10}
              />
            </div>
          </CardContent>
        </Card>

        {/* Service Endpoints */}
        <Card>
          <CardHeader>
            <CardTitle>Service Endpoints</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex items-center justify-between p-3 border rounded-lg">
                <div>
                  <code className="text-sm font-mono">http://localhost:8000/api/health</code>
                  <p className="text-sm text-muted-foreground">Health check and database connectivity test</p>
                </div>
                <CheckCircle className="h-5 w-5 text-green-500" />
              </div>
              
              <div className="flex items-center justify-between p-3 border rounded-lg">
                <div>
                  <code className="text-sm font-mono">http://localhost:8000/api/test-user-creation</code>
                  <p className="text-sm text-muted-foreground">Test user creation process</p>
                </div>
              </div>
              
              <div className="flex items-center justify-between p-3 border rounded-lg">
                <div>
                  <code className="text-sm font-mono">http://localhost:8000/api/test-email</code>
                  <p className="text-sm text-muted-foreground">Test email service connectivity</p>
                </div>
              </div>
              
              <div className="flex items-center justify-between p-3 border rounded-lg">
                <div>
                  <code className="text-sm font-mono">http://localhost:8000/auth/*</code>
                  <p className="text-sm text-muted-foreground">Authentication endpoints</p>
                </div>
              </div>
              
              <div className="flex items-center justify-between p-3 border rounded-lg">
                <div>
                  <code className="text-sm font-mono">http://localhost:8000/luxtrust/*</code>
                  <p className="text-sm text-muted-foreground">LuxTrust integration endpoints</p>
                </div>
              </div>
              
              <div className="flex items-center justify-between p-3 border rounded-lg">
                <div>
                  <code className="text-sm font-mono">http://localhost:8000/oauth/*</code>
                  <p className="text-sm text-muted-foreground">OAuth provider endpoints</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Database Connection Info */}
        <Card>
          <CardHeader>
            <CardTitle>Database Connection</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="bg-green-50 p-4 rounded-lg border-l-4 border-green-400">
              <h3 className="font-semibold text-green-900 mb-2">Neon PostgreSQL Database</h3>
              <ul className="text-sm text-green-800 space-y-1">
                <li>• Connected to your Neon PostgreSQL database</li>
                <li>• SSL/TLS encrypted connection</li>
                <li>• Pooled connections for better performance</li>
                <li>• Health checks verify database connectivity</li>
              </ul>
            </div>
          </CardContent>
        </Card>
      </div>
    </UnifiedLayoutTemplate>
  );
};

export default DenoBackendManagement;
