
import React from 'react';
import { Button } from '@/components/ui/button';

interface TestHeaderProps {
  onResetAllTests: () => void;
  authJobId: string | null;
}

export const TestHeader: React.FC<TestHeaderProps> = ({ 
  onResetAllTests, 
  authJobId 
}) => {
  return (
    <div className="mb-8">
      <h1 className="text-3xl font-bold text-gray-900 mb-2">
        Luxembourg/LuxTrust Testing Suite
      </h1>
      <p className="text-gray-600">
        Interactive testing for LuxTrust authentication, location detection, and professional certification features
      </p>
      <Button onClick={onResetAllTests} variant="outline" className="mt-4">
        Reset All Tests
      </Button>
      {authJobId && (
        <div className="mt-2 p-2 bg-blue-50 rounded text-sm text-blue-800">
          Current Auth Job ID: {authJobId}
        </div>
      )}
    </div>
  );
};
