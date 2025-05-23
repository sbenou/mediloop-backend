
import React from 'react';

interface TestDataLoaderProps {
  children: React.ReactNode;
}

const TestDataLoader: React.FC<TestDataLoaderProps> = ({ children }) => {
  // Simply pass the children through
  return <>{children}</>;
};

export default TestDataLoader;
