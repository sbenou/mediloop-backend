
import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/lib/supabase";
import { UserWearable, AvailableWearable } from "@/types/wearables";
import { toast } from "@/components/ui/use-toast";
import { useAuth } from "@/hooks/auth/useAuth";

// List of available wearables users can connect to
const availableWearablesList: AvailableWearable[] = [
  {
    id: "apple_watch",
    name: "Apple Watch",
    description: "Connect your Apple Watch to track steps, heart rate, and more.",
    features: ["Heart Rate", "Steps", "Sleep", "Calories", "Oxygen Level"],
    connectionMethod: "oauth"
  },
  {
    id: "fitbit",
    name: "Fitbit",
    description: "Connect your Fitbit to track activity, sleep, and heart rate.",
    features: ["Heart Rate", "Steps", "Sleep", "Calories"],
    connectionMethod: "oauth"
  },
  {
    id: "oura_ring",
    name: "Oura Ring",
    description: "Connect your Oura Ring to track sleep, readiness, and activity.",
    features: ["Sleep", "Heart Rate", "Temperature", "Readiness Score"],
    connectionMethod: "oauth"
  },
  {
    id: "samsung_galaxy_watch",
    name: "Samsung Galaxy Watch",
    description: "Connect your Galaxy Watch to track fitness and health metrics.",
    features: ["Heart Rate", "Steps", "Sleep", "Calories", "Stress Level"],
    connectionMethod: "oauth"
  },
  {
    id: "garmin",
    name: "Garmin",
    description: "Connect your Garmin device for comprehensive fitness tracking.",
    features: ["Heart Rate", "Steps", "Sleep", "Calories", "VO2 Max", "Training Status"],
    connectionMethod: "oauth"
  },
  {
    id: "whoop",
    name: "WHOOP",
    description: "Connect WHOOP to track recovery, strain, and sleep performance.",
    features: ["Recovery", "Strain", "Sleep", "Heart Rate Variability"],
    connectionMethod: "oauth"
  }
];

export function useWearableConnections() {
  const [connectedWearables, setConnectedWearables] = useState<UserWearable[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { user } = useAuth();

  // Function to fetch connected wearables
  const fetchConnectedWearables = useCallback(async () => {
    if (!user?.id) return;
    
    try {
      setIsLoading(true);
      const { data, error } = await supabase
        .from("user_wearables")
        .select("*")
        .eq("user_id", user.id)
        .order("updated_at", { ascending: false });

      if (error) {
        throw new Error(error.message);
      }

      setConnectedWearables(data || []);
    } catch (error) {
      console.error("Error fetching connected wearables:", error);
      toast({
        title: "Error",
        description: "Failed to load your connected devices",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  }, [user]);

  // Function to connect a wearable
  const connectWearable = async (deviceType: string) => {
    if (!user?.id) {
      toast({
        title: "Error",
        description: "You must be logged in to connect a device.",
        variant: "destructive",
      });
      return;
    }

    try {
      setIsLoading(true);
      
      // For demo purposes, we'll simulate a successful connection
      // In a real app, you would redirect to OAuth flow or handle
      // the connection process based on the device type
      
      const wearableInfo = availableWearablesList.find(w => w.id === deviceType);
      if (!wearableInfo) throw new Error("Wearable type not found");
      
      if (wearableInfo.connectionMethod === "oauth") {
        // In a real app, redirect to OAuth flow
        // window.location.href = `/api/oauth-connect?device=${deviceType}&user_id=${user.id}`;
        
        // For now, simulate successful connection with mock data
        const mockDeviceId = `mock-${deviceType}-${Math.random().toString(36).substring(2, 9)}`;
        
        const { data, error } = await supabase.from("user_wearables").insert({
          user_id: user.id,
          device_type: deviceType as any, // Cast to any to handle the type mismatch
          device_name: wearableInfo.name,
          device_id: mockDeviceId,
          connection_status: "connected",
          last_synced: new Date().toISOString(),
          battery_level: Math.floor(Math.random() * 100),
          meta: {
            features: wearableInfo.features || [],
            connected_at: new Date().toISOString()
          }
        }).select();
        
        if (error) throw new Error(error.message);
        
        // Refresh the list of connected wearables
        await fetchConnectedWearables();
        
        toast({
          title: "Device connected",
          description: `Your ${wearableInfo.name} has been connected successfully.`,
        });
      }
    } catch (error) {
      console.error("Error connecting wearable:", error);
      toast({
        title: "Connection failed",
        description: "There was a problem connecting your device. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Function to disconnect a wearable
  const disconnectWearable = async (wearableId: string) => {
    if (!user?.id) return;
    
    try {
      setIsLoading(true);
      const { error } = await supabase
        .from("user_wearables")
        .delete()
        .eq("id", wearableId)
        .eq("user_id", user.id);

      if (error) {
        throw new Error(error.message);
      }

      // Update local state
      setConnectedWearables(connectedWearables.filter(w => w.id !== wearableId));
      
    } catch (error) {
      console.error("Error disconnecting wearable:", error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  // Function to sync wearable data
  const syncWearable = async (wearableId: string) => {
    if (!user?.id) return;
    
    try {
      setIsLoading(true);
      
      // In a real app, you would call an API to sync data from the wearable
      // For demo purposes, we'll just update the last_synced timestamp
      
      const { error } = await supabase
        .from("user_wearables")
        .update({
          last_synced: new Date().toISOString(),
          battery_level: Math.floor(Math.random() * 100) // Mock battery level update
        })
        .eq("id", wearableId)
        .eq("user_id", user.id);

      if (error) {
        throw new Error(error.message);
      }

      // Refresh the list of connected wearables
      await fetchConnectedWearables();
      
    } catch (error) {
      console.error("Error syncing wearable:", error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  // Load connected wearables on component mount
  useEffect(() => {
    if (user?.id) {
      fetchConnectedWearables();
    } else {
      setIsLoading(false);
    }
  }, [user, fetchConnectedWearables]);

  return {
    connectedWearables,
    availableWearables: availableWearablesList,
    connectWearable,
    disconnectWearable,
    syncWearable,
    isLoading,
    refresh: fetchConnectedWearables,
  };
}
