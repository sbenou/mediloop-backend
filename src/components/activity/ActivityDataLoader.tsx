
import { Button } from "@/components/ui/button";
import { useState } from "react";
import { seedTimBurtonData } from "@/utils/mockDataSeeder";
import { seedUserNotifications } from "@/utils/seedNotifications";
import { useAuth } from "@/hooks/auth/useAuth";
import { toast } from "@/components/ui/use-toast";

export const ActivityDataLoader = () => {
  const [isLoading, setIsLoading] = useState(false);
  const { user } = useAuth();

  const handleLoadActivitiesData = async () => {
    setIsLoading(true);
    try {
      await seedTimBurtonData();
      toast({
        title: "Activities test data loaded",
        description: "Mock activities have been loaded successfully"
      });
    } catch (error) {
      console.error("Error loading activities data:", error);
      toast({
        title: "Error",
        description: "Failed to load activities test data",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleLoadNotifications = async () => {
    if (!user) {
      toast({
        title: "Error",
        description: "You must be logged in to load notifications",
        variant: "destructive"
      });
      return;
    }
    
    setIsLoading(true);
    try {
      await seedUserNotifications(user.id);
      toast({
        title: "Notifications test data loaded",
        description: "Mock notifications have been loaded successfully"
      });
    } catch (error) {
      console.error("Error loading notifications data:", error);
      toast({
        title: "Error",
        description: "Failed to load notifications test data",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed bottom-4 right-4 z-50 flex flex-col gap-2">
      <Button 
        size="sm"
        variant="outline"
        onClick={handleLoadActivitiesData}
        disabled={isLoading}
        className="bg-white border border-gray-300 text-gray-700 hover:bg-gray-100"
      >
        {isLoading ? "Loading..." : "Load Activities Data"}
      </Button>
      <Button 
        size="sm"
        variant="outline"
        onClick={handleLoadNotifications}
        disabled={isLoading}
        className="bg-white border border-gray-300 text-gray-700 hover:bg-gray-100"
      >
        {isLoading ? "Loading..." : "Load Notifications Data"}
      </Button>
    </div>
  );
};
