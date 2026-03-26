/**
 * Patient wearable cards: loads devices via Deno `/api/wearables` (Neon tenant schema).
 * No Supabase client — data path is JWT → backend → `"tenant_*".user_wearables`.
 */
import { useState, useEffect } from "react";
import type { WearableData } from "@/types/wearables";
import { useAuth } from "@/hooks/auth/useAuth";
import { fetchMyWearables } from "@/services/wearablesApi";

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

  const generateDataForDevice = (deviceType: string): WearableData => {
    switch (deviceType) {
      case "apple_watch":
        return {
          steps: Math.floor(Math.random() * 12000) + 3000,
          heartRate: Math.floor(Math.random() * 20) + 60,
          caloriesBurned: Math.floor(Math.random() * 500) + 200,
          sleepHours: Math.round((Math.random() * 3 + 5) * 10) / 10,
          oxygenLevel: Math.floor(Math.random() * 3) + 96,
        };
      case "fitbit":
        return {
          steps: Math.floor(Math.random() * 10000) + 2000,
          heartRate: Math.floor(Math.random() * 15) + 65,
          caloriesBurned: Math.floor(Math.random() * 400) + 150,
          sleepHours: Math.round((Math.random() * 2 + 5) * 10) / 10,
          oxygenLevel: null,
        };
      case "oura_ring":
        return {
          steps: null,
          heartRate: Math.floor(Math.random() * 10) + 60,
          caloriesBurned: null,
          sleepHours: Math.round((Math.random() * 4 + 6) * 10) / 10,
          temperature: Math.floor(Math.random() * 10) / 10 + 36.3,
        };
      default:
        return {
          steps: Math.floor(Math.random() * 8000) + 1000,
          heartRate: Math.floor(Math.random() * 25) + 60,
          caloriesBurned: Math.floor(Math.random() * 300) + 100,
          sleepHours: Math.round((Math.random() * 3 + 5) * 10) / 10,
        };
    }
  };

  useEffect(() => {
    const load = async () => {
      if (!user?.id) {
        setIsLoading(false);
        setWearablesData([]);
        return;
      }

      try {
        setIsLoading(true);
        const wearables = await fetchMyWearables();

        if (wearables.length > 0) {
          const devicesWithData = wearables.map((w) => ({
            deviceType: w.device_name,
            deviceName: w.device_name,
            lastSynced: w.last_synced
              ? new Date(w.last_synced).toLocaleString()
              : "Never",
            batteryLevel:
              w.battery_level ?? Math.floor(Math.random() * 100),
            connectionStatus: w.connection_status,
            data: generateDataForDevice(w.device_type),
          }));
          setWearablesData(devicesWithData);
        } else {
          setWearablesData([]);
        }
      } catch (error) {
        console.error("Error fetching wearables data:", error);
        setWearablesData([]);
      } finally {
        setIsLoading(false);
      }
    };

    load();
  }, [user?.id]);

  return { wearablesData, isLoading };
}
