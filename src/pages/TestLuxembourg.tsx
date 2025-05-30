
import React from 'react';
import { Button } from '@/components/ui/button';
import { toast } from '@/components/ui/use-toast';
import { TestHeader } from '@/components/test-luxembourg/TestHeader';
import { TestContainer } from '@/components/test-luxembourg/TestContainer';
import { useTestLuxembourgState } from '@/hooks/useTestLuxembourgState';

const TestLuxembourg: React.FC = () => {
  const { 
    resetAllTests,
    authJobId,
    ...state 
  } = useTestLuxembourgState();

  const handleResetAllTests = () => {
    resetAllTests();
    toast({
      title: 'Tests Reset',
      description: 'All test states have been reset.'
    });
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto py-8 px-4">
        <TestHeader 
          onResetAllTests={handleResetAllTests}
          authJobId={authJobId}
        />
        <TestContainer {...state} />
      </div>
    </div>
  );
};

export default TestLuxembourg;
