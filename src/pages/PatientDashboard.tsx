import { useState, useEffect } from "react";
import { useSearchParams } from "react-router-dom";
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
import PasswordChange from "@/components/settings/PasswordChange";
import AccountDeletion from "@/components/settings/AccountDeletion";
import { CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import UnifiedLayout from "@/components/layout/UnifiedLayout";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import WearableDataDisplay from "@/components/dashboard/WearableDataDisplay";
import HealthStateIndicator from "@/components/dashboard/HealthStateIndicator";

const PatientDashboard = () => {
  const { profile } = useAuth();
  const [searchParams, setSearchParams] = useSearchParams();
  const view = searchParams.get('view') || 'home';
  const ordersTab = searchParams.get('ordersTab') || 'orders';
  const profileTab = searchParams.get('profileTab') || 'personal';
  const [isOpen, setIsOpen] = useState(true);
  const [activities, setActivities] = useState<Activity[]>(mockActivities);
  const [activeDrawerTab, setActiveDrawerTab] = useState<string>("home");

  useEffect(() => {
    console.log("PatientDashboard page loaded with view:", view, "and ordersTab:", ordersTab);
    
    const mainContent = document.getElementById('main-content');
    if (mainContent) {
      if (isOpen) {
        mainContent.classList.add('mr-[300px]');
      } else {
        mainContent.classList.remove('mr-[300px]');
      }
    }
    
    window.dispatchEvent(new Event('resize'));
  }, [isOpen, view, ordersTab]);

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

  const handleViewChange = (newView: string, tab?: string) => {
    if (tab) {
      setSearchParams({ view: newView, [`${newView}Tab`]: tab });
    } else {
      setSearchParams({ view: newView });
    }
  };

  const handleOrdersTabChange = (value: string) => {
    setSearchParams({ view: 'orders', ordersTab: value });
  };

  const handleProfileTabChange = (value: string) => {
    setSearchParams({ view: 'profile', profileTab: value });
  };

  if (view === "profile") {
    return (
      <UnifiedLayout>
        <div>
          <h1 className="text-3xl font-bold mb-6">My Profile</h1>
          
          <Tabs value={profileTab} onValueChange={handleProfileTabChange}>
            <TabsList>
              <TabsTrigger value="personal">Personal Info</TabsTrigger>
              <TabsTrigger value="addresses">Addresses</TabsTrigger>
              <TabsTrigger value="pharmacy">Default Pharmacy</TabsTrigger>
              <TabsTrigger value="doctor">My Doctor</TabsTrigger>
              <TabsTrigger value="nextofkin">Next of Kin</TabsTrigger>
            </TabsList>
            
            <TabsContent value="personal" className="mt-4">
              <div className="bg-white shadow rounded-lg p-6">
                <h2 className="text-xl font-semibold mb-4">Personal Information</h2>
                <div className="space-y-4">
                  <div>
                    <p className="text-sm text-muted-foreground">Full Name</p>
                    <p className="text-base">{profile?.full_name || 'No name provided'}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Email</p>
                    <p className="text-base">{profile?.email || 'No email provided'}</p>
                  </div>
                </div>
              </div>
            </TabsContent>
            
            <TabsContent value="addresses" className="mt-4">
              <div className="bg-white shadow rounded-lg p-6">
                <h2 className="text-xl font-semibold mb-4">My Addresses</h2>
                <p className="text-muted-foreground">No addresses found. Add your first address to get started.</p>
              </div>
            </TabsContent>
            
            <TabsContent value="pharmacy" className="mt-4">
              <div className="bg-white shadow rounded-lg p-6">
                <h2 className="text-xl font-semibold mb-4">Default Pharmacy</h2>
                <p className="text-muted-foreground">No default pharmacy selected.</p>
              </div>
            </TabsContent>
            
            <TabsContent value="doctor" className="mt-4">
              <div className="bg-white shadow rounded-lg p-6">
                <h2 className="text-xl font-semibold mb-4">My Doctor</h2>
                <p className="text-muted-foreground">No doctor connection found.</p>
              </div>
            </TabsContent>
            
            <TabsContent value="nextofkin" className="mt-4">
              <div className="bg-white shadow rounded-lg p-6">
                <h2 className="text-xl font-semibold mb-4">Next of Kin</h2>
                <p className="text-muted-foreground">No next of kin information provided.</p>
              </div>
            </TabsContent>
          </Tabs>
        </div>
      </UnifiedLayout>
    );
  }

  if (view === "settings") {
    return (
      <UnifiedLayout>
        <div>
          <h1 className="text-3xl font-bold mb-8 text-left">Account Settings</h1>
          
          <div className="space-y-6">
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

  if (view === "orders") {
    return (
      <UnifiedLayout>
        <div className="space-y-6">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">My Orders</h1>
            <p className="text-muted-foreground">
              View and manage all your orders.
            </p>
          </div>

          <Tabs value={ordersTab} onValueChange={handleOrdersTabChange}>
            <TabsList>
              <TabsTrigger value="orders">Orders</TabsTrigger>
              <TabsTrigger value="payments">Payments</TabsTrigger>
            </TabsList>
            
            <TabsContent value="orders" className="mt-4">
              <div className="bg-white shadow rounded-lg">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Order ID</TableHead>
                      <TableHead>Date</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className="text-right">Amount</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    <TableRow>
                      <TableCell colSpan={4} className="text-center py-8">
                        No orders found.
                      </TableCell>
                    </TableRow>
                  </TableBody>
                </Table>
              </div>
            </TabsContent>
            
            <TabsContent value="payments" className="mt-4">
              <div className="bg-white shadow rounded-lg">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Payment ID</TableHead>
                      <TableHead>Order ID</TableHead>
                      <TableHead>Date</TableHead>
                      <TableHead className="text-right">Amount</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    <TableRow>
                      <TableCell colSpan={4} className="text-center py-8">
                        No payment records found.
                      </TableCell>
                    </TableRow>
                  </TableBody>
                </Table>
              </div>
            </TabsContent>
          </Tabs>
        </div>
      </UnifiedLayout>
    );
  }

  if (view === "prescriptions") {
    return (
      <UnifiedLayout>
        <div>
          <h1 className="text-3xl font-bold mb-6">My Prescriptions</h1>
          <p className="text-muted-foreground mb-8">View and manage your prescriptions</p>
          
          <div className="bg-gray-100 rounded-lg p-8 text-center">
            <p className="text-lg">No active prescriptions found</p>
            <p className="text-muted-foreground mt-2">
              Your prescriptions will appear here once you receive them from your doctor
            </p>
          </div>
        </div>
      </UnifiedLayout>
    );
  }

  if (view === "teleconsultations") {
    return (
      <UnifiedLayout>
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
      </UnifiedLayout>
    );
  }

  return (
    <UnifiedLayout>
      <div className="flex h-full relative font-sans">
        <div 
          id="main-content" 
          className={`flex-1 space-y-8 px-1 mx-0 transition-all duration-300 ${isOpen ? 'mr-[300px]' : 'mr-0'}`}
        >
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-3xl font-bold">Welcome, {profile?.full_name || 'Patient'}</h1>
              <p className="text-muted-foreground">Here's an overview of your healthcare information</p>
            </div>
          </div>
          
          <div className="flex flex-wrap gap-4">
            <Card className="bg-white border rounded-lg shadow-sm p-6 cursor-pointer hover:shadow-md transition-shadow" 
                  onClick={() => handleViewChange('prescriptions')}>
              <div className="text-center">
                <h3 className="text-base font-medium">Prescriptions</h3>
                <p className="text-xs text-muted-foreground line-clamp-2">Total active prescriptions</p>
                <p className="text-4xl font-bold mt-2">0</p>
              </div>
            </Card>
            
            <Card className="bg-white border rounded-lg shadow-sm p-6 cursor-pointer hover:shadow-md transition-shadow"
                  onClick={() => handleViewChange('orders')}>
              <div className="text-center">
                <h3 className="text-base font-medium">Orders</h3>
                <p className="text-xs text-muted-foreground line-clamp-2">Total orders placed</p>
                <p className="text-4xl font-bold mt-2">0</p>
              </div>
            </Card>
            
            <Card className="bg-white border rounded-lg shadow-sm p-6 cursor-pointer hover:shadow-md transition-shadow"
                  onClick={() => handleViewChange('profile', 'doctor')}>
              <div className="text-center">
                <h3 className="text-base font-medium">Doctors</h3>
                <p className="text-xs text-muted-foreground line-clamp-2">Connected healthcare providers</p>
                <p className="text-4xl font-bold mt-2">0</p>
              </div>
            </Card>
            
            <Card className="bg-white border rounded-lg shadow-sm p-6 cursor-pointer hover:shadow-md transition-shadow"
                  onClick={() => handleViewChange('teleconsultations')}>
              <div className="text-center">
                <h3 className="text-base font-medium">Teleconsultations</h3>
                <p className="text-xs text-muted-foreground line-clamp-2">Upcoming appointments</p>
                <p className="text-4xl font-bold mt-2">0</p>
              </div>
            </Card>
          </div>
          
          <HealthStateIndicator userRole="patient" />
          
          <WearableDataDisplay userRole="patient" />
          
          <StatisticsCharts />
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
