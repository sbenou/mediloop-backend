import { useState, useEffect, useCallback } from "react";
import { UserWearable, AvailableWearable } from "@/types/wearables";
import { toast } from "@/components/ui/use-toast";
import { useAuth } from "@/hooks/auth/useAuth";
import {
  createWearable,
  deleteWearable,
  fetchMyWearables,
  patchWearable,
} from "@/services/wearablesApi";

function isConnectivityFailure(error: unknown): boolean {
  const msg =
    error instanceof Error
      ? error.message
      : typeof error === "object" &&
          error !== null &&
          "message" in error &&
          typeof (error as { message: unknown }).message === "string"
        ? (error as { message: string }).message
        : String(error);
  const m = msg.toLowerCase();
  return (
    m.includes("failed to fetch") ||
    m.includes("networkerror") ||
    m.includes("load failed") ||
    m.includes("network request failed")
  );
}

// List of available wearables users can connect to
const availableWearablesList: AvailableWearable[] = [
  {
    id: "apple_watch",
    name: "Apple Watch",
    description:
      "Connect your Apple Watch to track steps, heart rate, and more.",
    features: ["Heart Rate", "Steps", "Sleep", "Calories", "Oxygen Level"],
    connectionMethod: "oauth",
  },
  {
    id: "fitbit",
    name: "Fitbit",
    description:
      "Connect your Fitbit to track activity, sleep, and heart rate.",
    features: ["Heart Rate", "Steps", "Sleep", "Calories"],
    connectionMethod: "oauth",
  },
  {
    id: "oura_ring",
    name: "Oura Ring",
    description:
      "Connect your Oura Ring to track sleep, readiness, and activity.",
    features: ["Sleep", "Heart Rate", "Temperature", "Readiness Score"],
    connectionMethod: "oauth",
  },
  {
    id: "samsung_galaxy_watch",
    name: "Samsung Galaxy Watch",
    description:
      "Connect your Galaxy Watch to track fitness and health metrics.",
    features: ["Heart Rate", "Steps", "Sleep", "Calories", "Stress Level"],
    connectionMethod: "oauth",
  },
  {
    id: "garmin",
    name: "Garmin",
    description:
      "Connect your Garmin device for comprehensive fitness tracking.",
    features: [
      "Heart Rate",
      "Steps",
      "Sleep",
      "Calories",
      "VO2 Max",
      "Training Status",
    ],
    connectionMethod: "oauth",
  },
  {
    id: "whoop",
    name: "WHOOP",
    description:
      "Connect WHOOP to track recovery, strain, and sleep performance.",
    features: ["Recovery", "Strain", "Sleep", "Heart Rate Variability"],
    connectionMethod: "oauth",
  },
];

export function useWearableConnections() {
  const [connectedWearables, setConnectedWearables] = useState<UserWearable[]>(
    [],
  );
  const [isLoading, setIsLoading] = useState(true);
  const { user } = useAuth();

  const fetchConnectedWearables = useCallback(async () => {
    if (!user?.id) return;

    try {
      setIsLoading(true);
      const list = await fetchMyWearables();
      setConnectedWearables(list);
    } catch (error) {
      console.error("Error fetching connected wearables:", error);
      setConnectedWearables([]);
      if (!isConnectivityFailure(error)) {
        toast({
          title: "Error",
          description: "Failed to load your connected devices",
          variant: "destructive",
        });
      } else {
        console.warn(
          "[useWearableConnections] Wearables API unreachable (check backend / VITE_API_URL).",
        );
      }
    } finally {
      setIsLoading(false);
    }
  }, [user?.id]);

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

      const wearableInfo = availableWearablesList.find(
        (w) => w.id === deviceType,
      );
      if (!wearableInfo) throw new Error("Wearable type not found");

      if (wearableInfo.connectionMethod === "oauth") {
        const mockDeviceId = `mock-${deviceType}-${Math.random().toString(36).substring(2, 9)}`;

        await createWearable({
          device_type: deviceType,
          device_name: wearableInfo.name,
          device_id: mockDeviceId,
          connection_status: "connected",
          last_synced: new Date().toISOString(),
          battery_level: Math.floor(Math.random() * 100),
          meta: {
            features: wearableInfo.features || [],
            connected_at: new Date().toISOString(),
          },
        });

        await fetchConnectedWearables();

        toast({
          title: "Device connected",
          description: `Your ${wearableInfo.name} has been connected successfully.`,
        });
      }
    } catch (error) {
      console.error("Error connecting wearable:", error);
      if (isConnectivityFailure(error)) {
        toast({
          title: "Wearables sync unavailable",
          description:
            "Cannot reach the API. Ensure the backend is running and you are logged in.",
          variant: "destructive",
        });
      } else {
        toast({
          title: "Connection failed",
          description:
            "There was a problem connecting your device. Please try again.",
          variant: "destructive",
        });
      }
    } finally {
      setIsLoading(false);
    }
  };

  const disconnectWearable = async (wearableId: string) => {
    if (!user?.id) return;

    try {
      setIsLoading(true);
      await deleteWearable(wearableId);
      setConnectedWearables((prev) => prev.filter((w) => w.id !== wearableId));
    } catch (error) {
      console.error("Error disconnecting wearable:", error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const syncWearable = async (wearableId: string) => {
    if (!user?.id) return;

    try {
      setIsLoading(true);

      await patchWearable(wearableId, {
        last_synced: new Date().toISOString(),
        battery_level: Math.floor(Math.random() * 100),
      });

      await fetchConnectedWearables();
    } catch (error) {
      console.error("Error syncing wearable:", error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (user?.id) {
      fetchConnectedWearables();
    } else {
      setIsLoading(false);
    }
  }, [user?.id, fetchConnectedWearables]);

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
