
import { useEffect, useState } from "react";
import UnifiedLayout from "@/components/layout/UnifiedLayout";
import { useAuth } from "@/hooks/auth/useAuth";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { SidebarClose, SidebarOpen } from "lucide-react";
import { toast } from "@/components/ui/use-toast";
import { ActivityFeed } from "@/components/activity/ActivityFeed";
import { Advertisements } from "@/components/activity/Advertisements";
import { mockActivities } from "@/components/activity/mockActivities";
import { Activity } from "@/components/activity/ActivityItem";
import { StatisticsCharts } from "@/components/dashboard/StatisticsCharts";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useSearchParams } from "react-router-dom";
import { CardHeader, CardTitle, CardContent } from "@/components/ui/card";

// Import settings components for settings view
import PasswordChange from "@/components/settings/PasswordChange";
import AccountDeletion from "@/components/settings/AccountDeletion";
import AddressManagement from "@/components/settings/AddressManagement";
import PharmacySelection from "@/components/settings/PharmacySelection";
import DoctorManagement from "@/components/settings/DoctorManagement";
import PersonalDetails from "@/components/settings/PersonalDetails";

// Import pages for content views
import MyPrescriptions from "@/pages/MyPrescriptions";
import MyOrders from "@/pages/MyOrders";
import FindDoctor from "@/pages/FindDoctor";
import Teleconsultations from "@/pages/Teleconsultations";
import CreatePrescription from "@/pages/CreatePrescription";

const PatientDashboard = () => {
  const { profile } = useAuth();
  const [searchParams, setSearchParams] = useSearchParams();
  const view = searchParams.get('view') || 'home';
  const [isOpen, setIsOpen] = useState(true);
  const [activities, setActivities] = useState<Activity[]>(mockActivities);
  const [activeDrawerTab, setActiveDrawerTab] = useState<string>("home");

  useEffect(() => {
    console.log("PatientDashboard page loaded with view:", view);
  }, [view]);

  useEffect(() => {
    const mainContent = document.getElementById('main-content');
    if (mainContent) {
      if (isOpen) {
        mainContent.classList.add('mr-[300px]');
      } else {
        mainContent.classList.remove('mr-[300px]');
      }
    }
    
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

  const handleViewChange = (newView: string) => {
    setSearchParams({ view: newView });
  };

  // Render settings view when requested
  if (view === "settings") {
    return (
      <UnifiedLayout>
        <div>
          <h1 className="text-3xl font-bold mb-8 text-left">Account Settings</h1>
          
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="text-left">Personal Details</CardTitle>
              </CardHeader>
              <CardContent>
                <PersonalDetails />
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-left">Password Management</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <PasswordChange />
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-left">Address Management</CardTitle>
              </CardHeader>
              <CardContent>
                <AddressManagement />
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-left">Default Pharmacy</CardTitle>
              </CardHeader>
              <CardContent>
                <PharmacySelection />
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-left">Doctor Management</CardTitle>
              </CardHeader>
              <CardContent>
                <DoctorManagement />
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-left">Danger Zone</CardTitle>
              </CardHeader>
              <CardContent>
                <AccountDeletion />
              </CardContent>
            </Card>
          </div>
        </div>
      </UnifiedLayout>
    );
  }

  // Render MyPrescriptions view
  if (view === "prescriptions") {
    return (
      <UnifiedLayout>
        <div className="pt-2 pb-6">
          <Button 
            variant="ghost" 
            className="mb-4"
            onClick={() => handleViewChange('home')}
          >
            ← Back to Dashboard
          </Button>
          <div>
            <h1 className="text-3xl font-bold mb-6">My Prescriptions</h1>
            <p className="text-muted-foreground mb-8">View and manage your prescriptions</p>
            
            {/* Placeholder content for prescriptions */}
            <div className="bg-gray-100 rounded-lg p-8 text-center">
              <p className="text-lg">No active prescriptions found</p>
              <p className="text-muted-foreground mt-2">
                Your prescriptions will appear here once you receive them from your doctor
              </p>
            </div>
          </div>
        </div>
      </UnifiedLayout>
    );
  }

  // Render MyOrders view
  if (view === "orders") {
    return (
      <UnifiedLayout>
        <div className="pt-2 pb-6">
          <Button 
            variant="ghost" 
            className="mb-4"
            onClick={() => handleViewChange('home')}
          >
            ← Back to Dashboard
          </Button>
          <div>
            <h1 className="text-3xl font-bold mb-6">My Orders</h1>
            
            <Tabs defaultValue="orders" className="space-y-4">
              <TabsList>
                <TabsTrigger value="orders">Orders</TabsTrigger>
                <TabsTrigger value="payments">Payments</TabsTrigger>
              </TabsList>

              <TabsContent value="orders">
                <div className="bg-gray-100 rounded-lg p-8 text-center">
                  <p className="text-lg">No orders found</p>
                  <p className="text-muted-foreground mt-2">
                    Your order history will appear here once you make a purchase
                  </p>
                </div>
              </TabsContent>

              <TabsContent value="payments">
                <div className="bg-gray-100 rounded-lg p-8 text-center">
                  <p className="text-lg">No payment records found</p>
                  <p className="text-muted-foreground mt-2">
                    Your payment history will appear here once you make a purchase
                  </p>
                </div>
              </TabsContent>
            </Tabs>
          </div>
        </div>
      </UnifiedLayout>
    );
  }

  // Render CreatePrescription view
  if (view === "create-prescription") {
    return (
      <UnifiedLayout>
        <div className="pt-2 pb-6">
          <Button 
            variant="ghost" 
            className="mb-4"
            onClick={() => handleViewChange('home')}
          >
            ← Back to Dashboard
          </Button>
          <div>
            <h1 className="text-3xl font-bold text-gray-900 mb-6">
              Create Electronic Prescription
            </h1>
            {/* Import PrescriptionForm component instead of the whole page */}
            <div className="bg-white rounded-lg shadow p-6">
              <div className="text-center py-8">
                <p className="text-lg">Prescription creation coming soon</p>
                <p className="text-muted-foreground mt-2">
                  This feature is currently under development
                </p>
              </div>
            </div>
          </div>
        </div>
      </UnifiedLayout>
    );
  }

  // Render FindDoctor view
  if (view === "find-doctor") {
    return (
      <UnifiedLayout>
        <div className="pt-2 pb-6">
          <Button 
            variant="ghost" 
            className="mb-4"
            onClick={() => handleViewChange('home')}
          >
            ← Back to Dashboard
          </Button>
          <div>
            <h1 className="text-3xl font-bold mb-6">Find a Doctor</h1>
            <div className="bg-white rounded-lg shadow p-6">
              <div className="text-center py-8">
                <p className="text-lg">Doctor search coming soon</p>
                <p className="text-muted-foreground mt-2">
                  This feature is currently under development
                </p>
              </div>
            </div>
          </div>
        </div>
      </UnifiedLayout>
    );
  }

  // Render SearchPharmacy view
  if (view === "search-pharmacy") {
    return (
      <UnifiedLayout>
        <div className="pt-2 pb-6">
          <Button 
            variant="ghost" 
            className="mb-4"
            onClick={() => handleViewChange('home')}
          >
            ← Back to Dashboard
          </Button>
          <div>
            <h1 className="text-3xl font-bold mb-6">Find a Pharmacy</h1>
            <div className="bg-white rounded-lg shadow p-6">
              <div className="text-center py-8">
                <p className="text-lg">Pharmacy search coming soon</p>
                <p className="text-muted-foreground mt-2">
                  This feature is currently under development
                </p>
              </div>
            </div>
          </div>
        </div>
      </UnifiedLayout>
    );
  }

  // Render Teleconsultations view
  if (view === "teleconsultations") {
    return (
      <UnifiedLayout>
        <div className="pt-2 pb-6">
          <Button 
            variant="ghost" 
            className="mb-4"
            onClick={() => handleViewChange('home')}
          >
            ← Back to Dashboard
          </Button>
          <div>
            <h1 className="text-3xl font-bold mb-6">Teleconsultations</h1>
            <p className="text-muted-foreground mb-8">Schedule and manage your video consultations with doctors</p>
            
            <div className="bg-gray-100 rounded-lg p-8 text-center">
              <p className="text-lg">No scheduled teleconsultations</p>
              <p className="text-muted-foreground mt-2">
                Your upcoming teleconsultations will appear here once scheduled
              </p>
            </div>
          </div>
        </div>
      </UnifiedLayout>
    );
  }

  // Default dashboard view with UnifiedLayout
  return (
    <UnifiedLayout>
      <div className="flex h-full relative font-sans">
        <div 
          id="main-content" 
          className="flex-1 space-y-8 px-1 mx-0 transition-all duration-300"
        >
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-3xl font-bold">Welcome, {profile?.full_name || 'User'}</h1>
              <p className="text-muted-foreground">Here's an overview of your healthcare information</p>
            </div>
            <div>
              <Button 
                variant="outline" 
                onClick={() => handleViewChange('settings')}
              >
                Settings
              </Button>
            </div>
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
          
          {/* Add the statistics charts below the stats cards */}
          <StatisticsCharts />

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Quick Actions</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <Button 
                  className="w-full justify-start" 
                  variant="outline"
                  onClick={() => handleViewChange('prescriptions')}
                >
                  View My Prescriptions
                </Button>
                <Button 
                  className="w-full justify-start" 
                  variant="outline"
                  onClick={() => handleViewChange('orders')}
                >
                  Track My Orders
                </Button>
                <Button 
                  className="w-full justify-start" 
                  variant="outline"
                  onClick={() => handleViewChange('create-prescription')}
                >
                  Create New Prescription
                </Button>
                <Button 
                  className="w-full justify-start" 
                  variant="outline"
                  onClick={() => handleViewChange('find-doctor')}
                >
                  Find a Doctor
                </Button>
                <Button 
                  className="w-full justify-start" 
                  variant="outline"
                  onClick={() => handleViewChange('search-pharmacy')}
                >
                  Find a Pharmacy
                </Button>
                <Button 
                  className="w-full justify-start" 
                  variant="outline"
                  onClick={() => handleViewChange('teleconsultations')}
                >
                  Book Teleconsultation
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>

        <Button
          variant="outline"
          size="icon"
          className="fixed right-0 top-20 z-50"
          onClick={() => setIsOpen(!isOpen)}
        >
          {isOpen ? <SidebarClose className="h-4 w-4" /> : <SidebarOpen className="h-4 w-4" />}
        </Button>

        <div 
          className={`fixed inset-y-0 right-0 mt-16 w-[300px] border-l bg-white shadow-md transition-transform duration-300 z-40 overflow-hidden ${isOpen ? 'translate-x-0' : 'translate-x-full'}`}
        >
          <div className="p-4 h-full overflow-y-auto">
            <Tabs 
              defaultValue="home" 
              className="w-full" 
              value={activeDrawerTab}
              onValueChange={setActiveDrawerTab}
            >
              <TabsList className="grid grid-cols-2 mb-4">
                <TabsTrigger value="home">Home</TabsTrigger>
                <TabsTrigger value="activity">Activity</TabsTrigger>
              </TabsList>
              
              <TabsContent value="home" className="mt-0">
                <Advertisements />
              </TabsContent>
              
              <TabsContent value="activity" className="mt-0">
                <ActivityFeed 
                  activities={activities}
                  onMarkRead={handleMarkRead}
                  onMarkAllRead={handleMarkAllRead}
                />
              </TabsContent>
            </Tabs>
          </div>
        </div>
      </div>
    </UnifiedLayout>
  );
};

export default PatientDashboard;
