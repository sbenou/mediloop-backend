
import { Button } from "@/components/ui/button";
import { seedTimBurtonData } from "@/utils/mockDataSeeder";
import { useState } from "react";

export const TestDataLoader = () => {
  const [isLoading, setIsLoading] = useState(false);

  const handleLoadTestData = async () => {
    setIsLoading(true);
    try {
      await seedTimBurtonData();
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed bottom-4 right-4 z-50">
      <Button 
        size="sm"
        variant="outline"
        onClick={handleLoadTestData}
        disabled={isLoading}
        className="bg-white border border-gray-300 text-gray-700 hover:bg-gray-100"
      >
        {isLoading ? "Loading..." : "Load Test Data"}
      </Button>
    </div>
  );
};
