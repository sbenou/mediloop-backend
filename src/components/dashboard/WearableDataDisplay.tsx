
import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Activity, Heart, Watch, Thermometer, Battery, Signal } from "lucide-react";

// Fake wearable data types
interface WearableData {
  deviceType: "Apple Watch" | "Fitbit" | "Oura Ring";
  lastSynced: string;
  batteryLevel: number;
  heartRate: number;
  steps: number;
  caloriesBurned: number;
  sleepHours: number;
  temperature?: number;
  oxygenLevel?: number;
  connectionStatus: "connected" | "disconnected" | "syncing";
}

// Generate fake data for the wearables
const generateFakeWearableData = (): WearableData[] => {
  return [
    {
      deviceType: "Apple Watch",
      lastSynced: "10 minutes ago",
      batteryLevel: 78,
      heartRate: 72,
      steps: 8432,
      caloriesBurned: 390,
      sleepHours: 7.2,
      oxygenLevel: 98,
      connectionStatus: "connected"
    },
    {
      deviceType: "Fitbit",
      lastSynced: "3 hours ago",
      batteryLevel: 45,
      heartRate: 68,
      steps: 5210,
      caloriesBurned: 210,
      sleepHours: 6.5,
      connectionStatus: "disconnected"
    },
    {
      deviceType: "Oura Ring",
      lastSynced: "2 hours ago",
      batteryLevel: 62,
      heartRate: 65,
      steps: 0, // Oura Ring doesn't track steps as accurately
      caloriesBurned: 0, // Not a primary metric for Oura
      sleepHours: 8.1,
      temperature: 36.8,
      connectionStatus: "connected"
    }
  ];
};

interface WearableDataDisplayProps {
  userRole: string | null;
}

const WearableDataDisplay: React.FC<WearableDataDisplayProps> = ({ userRole }) => {
  // Only display for patients, not for doctors
  if (userRole !== 'patient') {
    return null;
  }

  const wearablesData = generateFakeWearableData();

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold">Connected Wearables</h2>
        <button className="text-sm text-primary hover:underline">Manage Connections</button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {wearablesData.map((device, index) => (
          <Card key={index} className={`${device.connectionStatus === 'disconnected' ? 'opacity-70' : ''}`}>
            <CardHeader className="pb-2">
              <div className="flex justify-between items-center">
                <CardTitle className="text-lg">{device.deviceType}</CardTitle>
                <div className="flex items-center gap-1">
                  <Signal className={`h-4 w-4 ${device.connectionStatus === 'connected' ? 'text-green-500' : 'text-gray-400'}`} />
                  <Battery className={`h-4 w-4 ${device.batteryLevel > 20 ? 'text-green-500' : 'text-red-500'}`} />
                </div>
              </div>
              <p className="text-xs text-muted-foreground">Last synced: {device.lastSynced}</p>
            </CardHeader>
            <CardContent className="pt-0">
              <div className="grid grid-cols-2 gap-2">
                <div className="flex items-center">
                  <Heart className="h-4 w-4 mr-2 text-red-500" />
                  <span className="text-sm">{device.heartRate} bpm</span>
                </div>
                <div className="flex items-center">
                  <Activity className="h-4 w-4 mr-2 text-blue-500" />
                  <span className="text-sm">{device.steps.toLocaleString()} steps</span>
                </div>
                <div className="flex items-center">
                  <Watch className="h-4 w-4 mr-2 text-purple-500" />
                  <span className="text-sm">{device.sleepHours} hrs sleep</span>
                </div>
                {device.temperature && (
                  <div className="flex items-center">
                    <Thermometer className="h-4 w-4 mr-2 text-orange-500" />
                    <span className="text-sm">{device.temperature}°C</span>
                  </div>
                )}
                {device.oxygenLevel && (
                  <div className="flex items-center col-span-2">
                    <div className="rounded-full bg-blue-100 p-1 mr-2">
                      <span className="text-xs font-medium text-blue-800">O2</span>
                    </div>
                    <span className="text-sm">{device.oxygenLevel}%</span>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
};

export default WearableDataDisplay;
