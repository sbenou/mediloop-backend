
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
      const result = await seedTimBurtonData();
      console.log("Activities data loading result:", result);
      
      if (result?.success) {
        toast({
          title: "Activities test data loaded",
          description: "Mock activities have been loaded successfully"
        });
      } else {
        throw new Error("Failed to load activities data");
      }
    } catch (error) {
      console.error("Error loading activities data:", error);
      toast({
        title: "Error",
        description: "Failed to load activities test data",
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
      const result = await seedUserNotifications(user.id);
      console.log("Notifications data loading result:", result);
      
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
