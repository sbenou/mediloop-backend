
import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Activity, Heart, Watch, Thermometer, Battery, Signal } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useWearableData } from "@/hooks/wearables/useWearableData";
import { ManageWearablesDialog } from "./wearables/ManageWearablesDialog";
import { Skeleton } from "@/components/ui/skeleton";

interface WearableDataDisplayProps {
  userRole: string | null;
}

const WearableDataDisplay: React.FC<WearableDataDisplayProps> = ({ userRole }) => {
  // Only display for patients, not for doctors
  if (userRole !== 'patient') {
    return null;
  }

  const { wearablesData, isLoading } = useWearableData();

  if (isLoading) {
    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-semibold">Connected Wearables</h2>
          <Button variant="ghost" size="sm" disabled>
            Manage Connections
          </Button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {[1, 2, 3].map((i) => (
            <Card key={i} className="overflow-hidden">
              <CardHeader className="pb-2">
                <Skeleton className="h-6 w-3/4" />
                <Skeleton className="h-4 w-1/2" />
              </CardHeader>
              <CardContent className="pt-0">
                <div className="grid grid-cols-2 gap-2">
                  <Skeleton className="h-5 w-full" />
                  <Skeleton className="h-5 w-full" />
                  <Skeleton className="h-5 w-full" />
                  <Skeleton className="h-5 w-full" />
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold">Connected Wearables</h2>
        <ManageWearablesDialog>
          <Button variant="ghost" size="sm" className="text-primary hover:text-primary hover:bg-primary/10">
            Manage Connections
          </Button>
        </ManageWearablesDialog>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {wearablesData.map((device, index) => (
          <Card key={index} className={`${device.connectionStatus === 'disconnected' ? 'opacity-70' : ''}`}>
            <CardHeader className="pb-2">
              <div className="flex justify-between items-center">
                <CardTitle className="text-lg">{device.deviceName}</CardTitle>
                <div className="flex items-center gap-1">
                  <Signal className={`h-4 w-4 ${device.connectionStatus === 'connected' ? 'text-green-500' : 'text-gray-400'}`} />
                  <Battery className={`h-4 w-4 ${device.batteryLevel > 20 ? 'text-green-500' : 'text-red-500'}`} />
                </div>
              </div>
              <p className="text-xs text-muted-foreground">Last synced: {device.lastSynced}</p>
            </CardHeader>
            <CardContent className="pt-0">
              <div className="grid grid-cols-2 gap-2">
                {device.data.heartRate !== null && (
                  <div className="flex items-center">
                    <Heart className="h-4 w-4 mr-2 text-red-500" />
                    <span className="text-sm">{device.data.heartRate} bpm</span>
                  </div>
                )}
                {device.data.steps !== null && (
                  <div className="flex items-center">
                    <Activity className="h-4 w-4 mr-2 text-blue-500" />
                    <span className="text-sm">{device.data.steps.toLocaleString()} steps</span>
                  </div>
                )}
                {device.data.sleepHours !== null && (
                  <div className="flex items-center">
                    <Watch className="h-4 w-4 mr-2 text-purple-500" />
                    <span className="text-sm">{device.data.sleepHours.toFixed(1)} hrs sleep</span>
                  </div>
                )}
                {device.data.temperature && (
                  <div className="flex items-center">
                    <Thermometer className="h-4 w-4 mr-2 text-orange-500" />
                    <span className="text-sm">{device.data.temperature}°C</span>
                  </div>
                )}
                {device.data.oxygenLevel && (
                  <div className="flex items-center col-span-2">
                    <div className="rounded-full bg-blue-100 p-1 mr-2">
                      <span className="text-xs font-medium text-blue-800">O2</span>
                    </div>
                    <span className="text-sm">{device.data.oxygenLevel}%</span>
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
