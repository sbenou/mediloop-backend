
import React, { useState } from "react";
import { useWearableConnections } from "@/hooks/wearables/useWearableConnections";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import { Separator } from "@/components/ui/separator";
import { Loader2, CheckCircle2, XCircle, AlertTriangle } from "lucide-react";
import { toast } from "@/components/ui/use-toast";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { UserWearable } from "@/types/wearables";

interface ManageWearablesDialogProps {
  children?: React.ReactNode;
  triggerClassName?: string;
}

export const ManageWearablesDialog = ({ children, triggerClassName }: ManageWearablesDialogProps) => {
  const [open, setOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<string>("connected");
  
  const {
    connectedWearables,
    availableWearables,
    connectWearable,
    disconnectWearable,
    syncWearable,
    isLoading,
  } = useWearableConnections();

  const handleDisconnect = async (wearable: UserWearable) => {
    try {
      await disconnectWearable(wearable.id);
      toast({
        title: "Wearable disconnected",
        description: `Your ${wearable.device_name} has been disconnected successfully.`,
      });
    } catch (error) {
      console.error("Error disconnecting wearable:", error);
      toast({
        title: "Failed to disconnect",
        description: "There was a problem disconnecting your device. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleConnect = async (deviceType: string) => {
    try {
      // Start the connection process
      await connectWearable(deviceType);
      toast({
        title: "Connection initiated",
        description: "Please follow the instructions to connect your device.",
      });
    } catch (error) {
      console.error("Error connecting wearable:", error);
      toast({
        title: "Connection failed",
        description: "There was a problem connecting your device. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleSync = async (wearableId: string) => {
    try {
      await syncWearable(wearableId);
      toast({
        title: "Sync successful",
        description: "Your wearable data has been updated.",
      });
    } catch (error) {
      console.error("Error syncing wearable:", error);
      toast({
        title: "Sync failed",
        description: "There was a problem syncing your device. Please try again.",
        variant: "destructive",
      });
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {children || (
          <Button variant="ghost" size="sm" className={triggerClassName}>
            Manage Connections
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="sm:max-w-[500px] max-h-[85vh]">
        <DialogHeader>
          <DialogTitle>Manage Wearable Connections</DialogTitle>
          <DialogDescription>
            Connect, disconnect, and sync your wearable devices to track your health data.
          </DialogDescription>
        </DialogHeader>
        
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="connected">Connected Devices</TabsTrigger>
            <TabsTrigger value="available">Add New Device</TabsTrigger>
          </TabsList>
          
          <TabsContent value="connected" className="mt-4">
            <ScrollArea className="h-[400px] pr-4">
              {isLoading ? (
                <div className="flex items-center justify-center h-40">
                  <Loader2 className="h-8 w-8 animate-spin text-primary" />
                </div>
              ) : connectedWearables.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-40 text-center">
                  <AlertTriangle className="h-12 w-12 text-muted-foreground mb-2" />
                  <p className="text-muted-foreground">No connected devices found</p>
                  <p className="text-sm text-muted-foreground mt-1 max-w-xs">
                    Add a device to start tracking your health metrics
                  </p>
                  <Button 
                    variant="outline" 
                    size="sm" 
                    className="mt-4"
                    onClick={() => setActiveTab("available")}
                  >
                    Connect a Device
                  </Button>
                </div>
              ) : (
                <div className="space-y-4">
                  {connectedWearables.map((wearable) => (
                    <div key={wearable.id} className="border rounded-lg p-4">
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center">
                          <h3 className="font-medium">{wearable.device_name}</h3>
                          <Badge 
                            variant={wearable.connection_status === "connected" ? "outline" : "secondary"} 
                            className="ml-2"
                          >
                            {wearable.connection_status}
                          </Badge>
                        </div>
                        <div className="text-xs text-muted-foreground">
                          Last synced: {wearable.last_synced ? new Date(wearable.last_synced).toLocaleString() : 'Never'}
                        </div>
                      </div>
                      
                      <Separator className="my-2" />
                      
                      <div className="flex justify-end space-x-2 mt-4">
                        <Button 
                          variant="outline" 
                          size="sm" 
                          onClick={() => handleSync(wearable.id)}
                          disabled={isLoading || wearable.connection_status !== "connected"}
                        >
                          {isLoading ? (
                            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                          ) : null}
                          Sync Now
                        </Button>
                        <Button 
                          variant="destructive" 
                          size="sm" 
                          onClick={() => handleDisconnect(wearable)}
                          disabled={isLoading}
                        >
                          Disconnect
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </ScrollArea>
          </TabsContent>
          
          <TabsContent value="available" className="mt-4">
            <ScrollArea className="h-[400px] pr-4">
              <div className="space-y-4">
                {availableWearables.map((wearable) => {
                  const isConnected = connectedWearables.some(
                    (connected) => connected.device_type === wearable.id
                  );
                  
                  return (
                    <div key={wearable.id} className="border rounded-lg p-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <h3 className="font-medium">{wearable.name}</h3>
                          <p className="text-sm text-muted-foreground mt-1">{wearable.description}</p>
                        </div>
                        <div>
                          {isConnected ? (
                            <Button variant="ghost" size="sm" disabled className="text-green-500">
                              <CheckCircle2 className="h-5 w-5 mr-1" /> Connected
                            </Button>
                          ) : (
                            <Button
                              variant="secondary"
                              size="sm"
                              onClick={() => handleConnect(wearable.id)}
                              disabled={isLoading}
                            >
                              {isLoading ? (
                                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                              ) : null}
                              Connect
                            </Button>
                          )}
                        </div>
                      </div>
                      
                      {wearable.features && (
                        <div className="mt-3">
                          <p className="text-xs font-medium mb-1">Tracked metrics:</p>
                          <div className="flex flex-wrap gap-1">
                            {wearable.features.map((feature, i) => (
                              <Badge key={i} variant="outline" className="text-xs">
                                {feature}
                              </Badge>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </ScrollArea>
          </TabsContent>
        </Tabs>
        
        <DialogFooter>
          <Button onClick={() => setOpen(false)}>Close</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
