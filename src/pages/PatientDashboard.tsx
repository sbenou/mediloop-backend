
import React, { useState, useEffect } from "react";
import { useSearchParams, Link, useNavigate } from "react-router-dom";
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
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import WearableDataDisplay from "@/components/dashboard/WearableDataDisplay";
import HealthStateIndicator from "@/components/dashboard/HealthStateIndicator";
import DashboardStats from "@/components/dashboard/views/pharmacy/DashboardStats";
import { usePatientDashboardStats } from "@/hooks/patient/usePatientDashboardStats";
import PharmacySelection from "@/components/settings/PharmacySelection";
import DoctorSearch from "@/components/DoctorSearch";
import DoctorManagement from "@/components/settings/DoctorManagement";
import PatientLayout from "@/components/layout/PatientLayout";
import { Activity as ActivityIcon, FileText, Calendar, Package, AlertCircle } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";

const PatientDashboard = () => {
  const { profile } = useAuth();
  const [searchParams, setSearchParams] = useSearchParams();
  const view = searchParams.get('view') || 'home';
  const ordersTab = searchParams.get('ordersTab') || 'orders';
  const profileTab = searchParams.get('profileTab') || 'personal';
  const [isOpen, setIsOpen] = useState(true);
  const [activities, setActivities] = useState<Activity[]>([]); // Start with empty activities
  const [activeDrawerTab, setActiveDrawerTab] = useState<string>("home");
  const navigate = useNavigate();
  
  // Fetch stats data for the patient dashboard
  const { data: statsData, isLoading: isStatsLoading } = usePatientDashboardStats();

  useEffect(() => {
    console.log("PatientDashboard page loaded with view:", view, "and ordersTab:", ordersTab);
    
    // Simulate loading data
    setTimeout(() => {
      setActivities(mockActivities);
    }, 500);
    
    window.dispatchEvent(new Event('resize'));
  }, [view, ordersTab]);

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

  // Helper function to get icon based on activity type
  const getActivityIcon = (type: string) => {
    switch (type) {
      case "prescription_created":
      case "prescription_updated":
        return FileText;
      case "appointment_scheduled":
      case "teleconsultation_scheduled":
        return Calendar;
      case "order_placed":
      case "order_shipped":
      case "order_delivered":
        return Package;
      case "system_alert":
      case "payment_failed":
        return AlertCircle;
      default:
        return ActivityIcon;
    }
  };

  if (view === "profile") {
    return (
      <PatientLayout>
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
                <Button
                  onClick={() => navigate('/search-pharmacy')}
                  className="w-full"
                >
                  Search and Select a Pharmacy
                </Button>
              </div>
            </TabsContent>
            
            <TabsContent value="doctor" className="mt-4">
              <div className="bg-white shadow rounded-lg p-6">
                <h2 className="text-xl font-semibold mb-4">My Doctor</h2>
                <Button
                  onClick={() => navigate('/find-doctor')}
                  className="w-full"
                >
                  Find and Connect with a Doctor
                </Button>
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
      </PatientLayout>
    );
  }

  if (view === "settings") {
    return (
      <PatientLayout>
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
      </PatientLayout>
    );
  }

  if (view === "orders") {
    return (
      <PatientLayout>
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
      </PatientLayout>
    );
  }

  if (view === "prescriptions") {
    return (
      <PatientLayout>
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
      </PatientLayout>
    );
  }

  if (view === "teleconsultations") {
    return (
      <PatientLayout>
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
      </PatientLayout>
    );
  }

  // EmptyState component
  const EmptyState = ({ icon: Icon, message }: { icon: any, message: string }) => (
    <div className="flex flex-col items-center justify-center py-8">
      <Icon className="h-16 w-16 text-gray-400 mb-4" />
      <p className="text-sm text-gray-500 text-center">{message}</p>
    </div>
  );

  return (
    <PatientLayout>
      <div className="space-y-8">
        <div>
          <h1 className="text-3xl font-bold">Welcome, {profile?.full_name || 'Patient'}</h1>
          <p className="text-muted-foreground">Here's an overview of your healthcare information</p>
        </div>
        
        {/* Dashboard Stats with sparklines - now using patient-specific stats */}
        <DashboardStats 
          stats={{
            total_prescriptions: statsData?.total_prescriptions || 0,
            pending_orders: statsData?.pending_orders || 0,
            total_patients: statsData?.active_teleconsultations || 0, // Reuse this field for teleconsultations
            monthly_revenue: statsData?.completed_payments || 0 // Reuse this field for payments
          }}
          isLoading={isStatsLoading}
          onNavigate={handleViewChange}
        />
        
        {/* Recent Activities Card with updated styling */}
        <Card className="relative overflow-hidden bg-white p-6 shadow-sm border-0 md:col-span-1 lg:col-span-1">
          <div className="flex justify-between items-center mb-6">
            <h3 className="text-lg font-medium">Recent Activities</h3>
            {activities.length > 0 && (
              <Button variant="ghost" size="sm" className="text-xs">
                View All
              </Button>
            )}
          </div>
          
          {isStatsLoading ? (
            <div className="space-y-4">
              <Skeleton className="h-12 w-full" />
              <Skeleton className="h-12 w-full" />
              <Skeleton className="h-12 w-full" />
            </div>
          ) : activities.length === 0 ? (
            <EmptyState 
              icon={ActivityIcon} 
              message="No recent activities to display" 
            />
          ) : (
            <div className="space-y-3">
              {activities.slice(0, 3).map((activity) => {
                const ActivityTypeIcon = getActivityIcon(activity.type);
                return (
                  <div key={activity.id} className="flex items-center gap-4">
                    <div className="h-12 w-12 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center">
                      <ActivityTypeIcon className="h-6 w-6" />
                    </div>
                    <div className="flex-1">
                      <p className="text-sm font-semibold">{activity.title}</p>
                      <p className="text-xs text-muted-foreground">{activity.description}</p>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </Card>
        
        <HealthStateIndicator userRole="patient" />
        
        <WearableDataDisplay userRole="patient" />
        
        <StatisticsCharts />
      </div>
    </PatientLayout>
  );
};

export default PatientDashboard;
