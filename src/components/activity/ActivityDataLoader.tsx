
import { Button } from "@/components/ui/button";
import { useState } from "react";
import { seedTimBurtonData } from "@/utils/mockDataSeeder";
import { seedUserNotifications } from "@/utils/seedNotifications";
import { useAuth } from "@/hooks/auth/useAuth";
import { toast } from "@/components/ui/use-toast";
import { Loader2 } from "lucide-react";

export const ActivityDataLoader = () => {
  const [isLoadingActivities, setIsLoadingActivities] = useState(false);
  const [isLoadingNotifications, setIsLoadingNotifications] = useState(false);
  const { user } = useAuth();

  const handleLoadActivitiesData = async () => {
    setIsLoadingActivities(true);
    try {
      console.log("Starting to load activities data...");
      const result = await seedTimBurtonData();
      console.log("Activities data loading result:", result);
      
      if (result?.success) {
        toast({
          title: "Activities test data loaded",
          description: `Mock activities have been loaded successfully (${result.activitiesCount || 0} activities)`
        });
      } else {
        console.error("Failed to load activities data:", result?.error || "Unknown error");
        throw new Error(result?.error?.message || "Failed to load activities data");
      }
    } catch (error) {
      console.error("Error loading activities data:", error);
      toast({
        title: "Error",
        description: `Failed to load activities test data: ${error instanceof Error ? error.message : 'Unknown error'}`,
        variant: "destructive"
      });
    } finally {
      setIsLoadingActivities(false);
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
    
    setIsLoadingNotifications(true);
    try {
      console.log("Starting to load notifications data for user:", user.id);
      const result = await seedUserNotifications(user.id);
      console.log("Notifications data loading result:", result);
      
      if (result?.success) {
        toast({
          title: "Notifications test data loaded",
          description: `Mock notifications have been loaded successfully (${result.count || 0} notifications)`
        });
      } else {
        console.error("Failed to load notifications:", result?.error || "Unknown error");
        throw new Error(result?.error?.message || "Failed to load notifications");
      }
    } catch (error) {
      console.error("Error loading notifications data:", error);
      toast({
        title: "Error",
        description: `Failed to load notifications test data: ${error instanceof Error ? error.message : 'Unknown error'}`,
        variant: "destructive"
      });
    } finally {
      setIsLoadingNotifications(false);
    }
  };

  return (
    <div className="fixed bottom-4 right-4 z-50 flex flex-col gap-2">
      <Button 
        size="sm"
        variant="outline"
        onClick={handleLoadActivitiesData}
        disabled={isLoadingActivities || isLoadingNotifications}
        className="bg-white border border-gray-300 text-gray-700 hover:bg-gray-100 min-w-[180px] justify-between"
      >
        {isLoadingActivities ? (
          <>
            <Loader2 className="h-4 w-4 animate-spin mr-2" />
            <span>Loading Activities...</span>
          </>
        ) : (
          <span>Load Activities Data</span>
        )}
      </Button>
      <Button 
        size="sm"
        variant="outline"
        onClick={handleLoadNotifications}
        disabled={isLoadingActivities || isLoadingNotifications || !user}
        className="bg-white border border-gray-300 text-gray-700 hover:bg-gray-100 min-w-[180px] justify-between"
      >
        {isLoadingNotifications ? (
          <>
            <Loader2 className="h-4 w-4 animate-spin mr-2" />
            <span>Loading Notifications...</span>
          </>
        ) : (
          <span>Load Notifications Data</span>
        )}
      </Button>
    </div>
  );
};
