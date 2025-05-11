
// This file is now empty as we're removing the test data loader functionality
// The file will remain in the codebase but with no content for now
import React from 'react';

interface TestDataLoaderProps {
  children: React.ReactNode;
}

const TestDataLoader: React.FC<TestDataLoaderProps> = ({ children }) => {
  // Simply pass the children through
  return <>{children}</>;
};

export default TestDataLoader;
