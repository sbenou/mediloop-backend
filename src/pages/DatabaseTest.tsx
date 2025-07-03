
import React from 'react';
import { DatabaseConnectivityTest } from '@/components/testing/DatabaseConnectivityTest';

const DatabaseTest = () => {
  return (
    <div className="min-h-screen bg-gray-50">
      <DatabaseConnectivityTest />
    </div>
  );
};

export default DatabaseTest;
