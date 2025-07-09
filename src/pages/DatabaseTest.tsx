
import React, { useState } from 'react';
import { DatabaseConnectivityTest } from '@/components/testing/DatabaseConnectivityTest';
import { TenantPerformanceTests } from '@/components/testing/TenantPerformanceTests';
import { Button } from "@/components/ui/button";

const DatabaseTest = () => {
  const [activeView, setActiveView] = useState<'connectivity' | 'performance'>('connectivity');

  return (
    <div className="min-h-screen bg-gray-50 p-4">
      <div className="max-w-6xl mx-auto space-y-6">
        <div className="text-center">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Database Testing Suite</h1>
          <p className="text-gray-600">Comprehensive testing for your multi-tenant Neon PostgreSQL setup</p>
        </div>

        <div className="flex justify-center space-x-4">
          <Button
            variant={activeView === 'connectivity' ? 'default' : 'outline'}
            onClick={() => setActiveView('connectivity')}
          >
            Connectivity Tests
          </Button>
          <Button
            variant={activeView === 'performance' ? 'default' : 'outline'}
            onClick={() => setActiveView('performance')}
          >
            Performance Tests
          </Button>
        </div>

        {activeView === 'connectivity' && <DatabaseConnectivityTest />}
        {activeView === 'performance' && <TenantPerformanceTests />}
      </div>
    </div>
  );
};

export default DatabaseTest;
