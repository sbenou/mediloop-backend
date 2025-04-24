
import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { WearableData } from "@/types/wearables";
import { useAuth } from "@/hooks/auth/useAuth";

export interface DeviceData {
  deviceType: string;
  deviceName: string;
  lastSynced: string;
  batteryLevel: number;
  connectionStatus: string;
  data: WearableData;
}

export function useWearableData() {
  const [isLoading, setIsLoading] = useState(true);
  const [wearablesData, setWearablesData] = useState<DeviceData[]>([]);
  const { user } = useAuth();

  // Mock data generation function - in a real app, this would come from the database
  const generateDataForDevice = (deviceType: string): WearableData => {
    switch (deviceType) {
      case "apple_watch":
        return {
          steps: Math.floor(Math.random() * 12000) + 3000,
          heartRate: Math.floor(Math.random() * 20) + 60,
          caloriesBurned: Math.floor(Math.random() * 500) + 200,
          sleepHours: Math.round((Math.random() * 3) + 5) + Math.random(),
          oxygenLevel: Math.floor(Math.random() * 3) + 96,
        };
      case "fitbit":
        return {
          steps: Math.floor(Math.random() * 10000) + 2000,
          heartRate: Math.floor(Math.random() * 15) + 65,
          caloriesBurned: Math.floor(Math.random() * 400) + 150,
          sleepHours: Math.round((Math.random() * 2) + 5) + Math.random(),
          oxygenLevel: null,
        };
      case "oura_ring":
        return {
          steps: null, // Oura Ring doesn't track steps as accurately
          heartRate: Math.floor(Math.random() * 10) + 60,
          caloriesBurned: null,
          sleepHours: Math.round((Math.random() * 4) + 6) + Math.random(),
          temperature: Math.floor(Math.random() * 10) / 10 + 36.3,
        };
      default:
        return {
          steps: Math.floor(Math.random() * 8000) + 1000,
          heartRate: Math.floor(Math.random() * 25) + 60,
          caloriesBurned: Math.floor(Math.random() * 300) + 100,
          sleepHours: Math.round((Math.random() * 3) + 5) + Math.random(),
        };
    }
  };

  useEffect(() => {
    const fetchWearablesData = async () => {
      if (!user?.id) {
        setIsLoading(false);
        return;
      }

      try {
        setIsLoading(true);
        
        // Fetch user's connected wearables
        const { data: wearables, error } = await supabase
          .from("user_wearables")
          .select("*")
          .eq("user_id", user.id)
          .order("updated_at", { ascending: false });

        if (error) throw error;

        if (wearables && wearables.length > 0) {
          // Transform wearables data to include health metrics
          const devicesWithData = wearables.map(wearable => ({
            deviceType: wearable.device_name,
            deviceName: wearable.device_name,
            lastSynced: wearable.last_synced || "Never",
            batteryLevel: wearable.battery_level || Math.floor(Math.random() * 100),
            connectionStatus: wearable.connection_status,
            data: generateDataForDevice(wearable.device_type)
          }));
          
          setWearablesData(devicesWithData);
        } else {
          // If no connected wearables, use fallback dummy data
          setWearablesData([
            {
              deviceType: "Apple Watch",
              deviceName: "Apple Watch",
              lastSynced: "10 minutes ago",
              batteryLevel: 78,
              connectionStatus: "connected",
              data: {
                steps: 8432,
                heartRate: 72,
                caloriesBurned: 390,
                sleepHours: 7.2,
                oxygenLevel: 98,
              }
            },
            {
              deviceType: "Fitbit",
              deviceName: "Fitbit",
              lastSynced: "3 hours ago",
              batteryLevel: 45,
              connectionStatus: "disconnected",
              data: {
                steps: 5210,
                heartRate: 68,
                caloriesBurned: 210,
                sleepHours: 6.5,
                oxygenLevel: null,
              }
            },
            {
              deviceType: "Oura Ring",
              deviceName: "Oura Ring",
              lastSynced: "2 hours ago",
              batteryLevel: 62,
              connectionStatus: "connected",
              data: {
                steps: 0,
                heartRate: 65,
                caloriesBurned: 0,
                sleepHours: 8.1,
                temperature: 36.8,
              }
            }
          ]);
        }
      } catch (error) {
        console.error("Error fetching wearables data:", error);
        // Use fallback data
        setWearablesData([
          {
            deviceType: "Apple Watch",
            deviceName: "Apple Watch",
            lastSynced: "Unknown",
            batteryLevel: 78,
            connectionStatus: "connected",
            data: {
              steps: 8432,
              heartRate: 72,
              caloriesBurned: 390,
              sleepHours: 7.2,
              oxygenLevel: 98,
            }
          }
        ]);
      } finally {
        setIsLoading(false);
      }
    };

    fetchWearablesData();
  }, [user]);

  return { wearablesData, isLoading };
}
