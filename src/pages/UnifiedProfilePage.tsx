
import { useState, useEffect } from "react";
import UnifiedLayout from "@/components/layout/UnifiedLayout";
import { useAuth } from "@/hooks/auth/useAuth";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { SidebarClose, SidebarOpen } from "lucide-react";
import { toast } from "@/components/ui/use-toast";
import { ActivityFeed } from "@/components/activity/ActivityFeed";
import { mockActivities } from "@/components/activity/mockActivities";
import { Activity } from "@/components/activity/ActivityItem";

const UnifiedProfilePage = () => {
  const { profile } = useAuth();
  const [isOpen, setIsOpen] = useState(true);
  const [activities, setActivities] = useState<Activity[]>(mockActivities);

  // Adjust layout when drawer state changes
  useEffect(() => {
    // Add or remove a class to the main content when drawer opens/closes
    const mainContent = document.getElementById('main-content');
    if (mainContent) {
      if (isOpen) {
        mainContent.classList.add('mr-[300px]');
      } else {
        mainContent.classList.remove('mr-[300px]');
      }
    }
    
    // Force a re-render to ensure the drawer displays properly
    window.dispatchEvent(new Event('resize'));
  }, [isOpen]);

  const handleMarkRead = (id: string) => {
    setActivities(prevActivities => 
      prevActivities.map(activity => 
        activity.id === id ? { ...activity, read: true } : activity
      )
    );
    toast({
      title: "Activity marked as read",
      duration: 2000,
    });
  };

  const handleMarkAllRead = () => {
    setActivities(prevActivities => 
      prevActivities.map(activity => ({ ...activity, read: true }))
    );
    toast({
      title: "All activities marked as read",
      duration: 2000,
    });
  };

  return (
    <UnifiedLayout>
      <div className="flex h-full relative">
        {/* Main content section with flexible width */}
        <div 
          id="main-content" 
          className="flex-1 space-y-8 px-2 transition-all duration-300"
        >
          <div>
            <h1 className="text-3xl font-bold">Welcome, {profile?.full_name || 'User'}</h1>
            <p className="text-muted-foreground">Here's an overview of your healthcare information</p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <Card className="bg-white border rounded-lg shadow-sm p-6">
              <div className="text-center">
                <h3 className="text-base font-medium">Prescriptions</h3>
                <p className="text-xs text-muted-foreground line-clamp-2">Total active prescriptions</p>
                <p className="text-4xl font-bold mt-2">0</p>
              </div>
            </Card>
            
            <Card className="bg-white border rounded-lg shadow-sm p-6">
              <div className="text-center">
                <h3 className="text-base font-medium">Orders</h3>
                <p className="text-xs text-muted-foreground line-clamp-2">Total orders placed</p>
                <p className="text-4xl font-bold mt-2">0</p>
              </div>
            </Card>
            
            <Card className="bg-white border rounded-lg shadow-sm p-6">
              <div className="text-center">
                <h3 className="text-base font-medium">Doctors</h3>
                <p className="text-xs text-muted-foreground line-clamp-2">Connected healthcare providers</p>
                <p className="text-4xl font-bold mt-2">0</p>
              </div>
            </Card>
            
            <Card className="bg-white border rounded-lg shadow-sm p-6">
              <div className="text-center">
                <h3 className="text-base font-medium">Teleconsultations</h3>
                <p className="text-xs text-muted-foreground line-clamp-2">Upcoming appointments</p>
                <p className="text-4xl font-bold mt-2">0</p>
              </div>
            </Card>
          </div>
        </div>

        {/* Floating toggle button for the drawer */}
        <Button
          variant="outline"
          size="icon"
          className="fixed right-0 top-20 z-50"
          onClick={() => setIsOpen(!isOpen)}
        >
          {isOpen ? <SidebarClose className="h-4 w-4" /> : <SidebarOpen className="h-4 w-4" />}
        </Button>

        {/* Activity drawer - fixed position with proper z-index */}
        <div 
          className={`fixed inset-y-0 right-0 mt-16 w-[300px] border-l bg-white shadow-md transition-transform duration-300 z-40 overflow-hidden ${isOpen ? 'translate-x-0' : 'translate-x-full'}`}
        >
          <div className="p-4 h-full overflow-y-auto">
            <ActivityFeed 
              activities={activities}
              onMarkRead={handleMarkRead}
              onMarkAllRead={handleMarkAllRead}
            />
          </div>
        </div>
      </div>
    </UnifiedLayout>
  );
};

export default UnifiedProfilePage;
