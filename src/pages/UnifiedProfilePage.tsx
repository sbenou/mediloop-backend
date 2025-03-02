
import UnifiedLayout from "@/components/layout/UnifiedLayout";
import { useAuth } from "@/hooks/auth/useAuth";
import { Card } from "@/components/ui/card";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { SidebarClose, SidebarOpen } from "lucide-react";
import { useState, useEffect } from "react";

const UnifiedProfilePage = () => {
  const { profile } = useAuth();
  const [isOpen, setIsOpen] = useState(true);

  // Adjust layout when drawer state changes
  useEffect(() => {
    // Add or remove a class to the main content when drawer opens/closes
    const mainContent = document.getElementById('main-content');
    if (mainContent) {
      if (isOpen) {
        mainContent.classList.add('mr-[320px]');
      } else {
        mainContent.classList.remove('mr-[320px]');
      }
    }
  }, [isOpen]);

  return (
    <UnifiedLayout>
      <div className="flex h-full relative">
        {/* Main content section with flexible width */}
        <div 
          id="main-content" 
          className="flex-1 space-y-8 pr-4 transition-all duration-300"
        >
          <div>
            <h1 className="text-3xl font-bold">Welcome, {profile?.full_name || 'User'}</h1>
            <p className="text-muted-foreground">Here's an overview of your healthcare information</p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <Card className="bg-white border rounded-lg shadow-sm p-6">
              <div className="text-center">
                <h3 className="text-base font-medium">Prescriptions</h3>
                <p className="text-sm text-muted-foreground">Total active prescriptions</p>
                <p className="text-4xl font-bold mt-2">0</p>
              </div>
            </Card>
            
            <Card className="bg-white border rounded-lg shadow-sm p-6">
              <div className="text-center">
                <h3 className="text-base font-medium">Orders</h3>
                <p className="text-sm text-muted-foreground">Total orders placed</p>
                <p className="text-4xl font-bold mt-2">0</p>
              </div>
            </Card>
            
            <Card className="bg-white border rounded-lg shadow-sm p-6">
              <div className="text-center">
                <h3 className="text-base font-medium">Doctors</h3>
                <p className="text-sm text-muted-foreground">Connected healthcare providers</p>
                <p className="text-4xl font-bold mt-2">0</p>
              </div>
            </Card>
            
            <Card className="bg-white border rounded-lg shadow-sm p-6">
              <div className="text-center">
                <h3 className="text-base font-medium">Teleconsultations</h3>
                <p className="text-sm text-muted-foreground">Upcoming appointments</p>
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

        {/* Activity drawer - now positioned with fixed positioning */}
        <Sheet open={isOpen} onOpenChange={setIsOpen}>
          <SheetContent 
            side="right" 
            className="w-[320px] p-4 border-l fixed inset-y-0 right-0 mt-16"
          >
            <h2 className="text-xl font-semibold mb-4">Recent Activity</h2>
            <div className="space-y-4">
              <p className="text-sm text-gray-500">No recent activity to display</p>
            </div>
          </SheetContent>
        </Sheet>
      </div>
    </UnifiedLayout>
  );
};

export default UnifiedProfilePage;
