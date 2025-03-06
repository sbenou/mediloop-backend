
import React from "react";
import { Card } from "@/components/ui/card";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Package, FileText, Users, ShoppingBag, Clock, PieChart } from "lucide-react";
import { StatisticsCharts } from "../StatisticsCharts";
import WearableDataDisplay from "../WearableDataDisplay";
import HealthStateIndicator from "../HealthStateIndicator";

interface HomeViewProps {
  userRole: string | null;
}

const HomeView = ({ userRole }: HomeViewProps) => {
  const navigate = useNavigate();
  const [, setSearchParams] = useSearchParams();

  const handleViewChange = (view: string, tab?: string) => {
    if (tab) {
      setSearchParams({ view, [`${view}Tab`]: tab });
    } else {
      setSearchParams({ view });
    }
  };

  if (userRole === 'pharmacist') {
    return (
      <div className="space-y-8">
        <div>
          <h1 className="text-3xl font-bold">Pharmacy Dashboard</h1>
          <p className="text-muted-foreground">Monitor your pharmacy's performance and operations</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card 
            className="p-6 cursor-pointer hover:shadow-md transition-shadow"
            onClick={() => handleViewChange('inventory')}
          >
            <div className="flex flex-col items-center">
              <Package className="h-8 w-8 text-primary mb-2" />
              <h3 className="text-lg font-medium">Inventory</h3>
              <p className="text-xs text-muted-foreground mt-1">Total Products</p>
              <p className="text-4xl font-bold mt-2">0</p>
            </div>
          </Card>

          <Card 
            className="p-6 cursor-pointer hover:shadow-md transition-shadow"
            onClick={() => handleViewChange('prescriptions')}
          >
            <div className="flex flex-col items-center">
              <FileText className="h-8 w-8 text-primary mb-2" />
              <h3 className="text-lg font-medium">Prescriptions</h3>
              <p className="text-xs text-muted-foreground mt-1">Pending Fulfillment</p>
              <p className="text-4xl font-bold mt-2">0</p>
            </div>
          </Card>

          <Card 
            className="p-6 cursor-pointer hover:shadow-md transition-shadow"
            onClick={() => handleViewChange('patients')}
          >
            <div className="flex flex-col items-center">
              <Users className="h-8 w-8 text-primary mb-2" />
              <h3 className="text-lg font-medium">Patients</h3>
              <p className="text-xs text-muted-foreground mt-1">Registered Patients</p>
              <p className="text-4xl font-bold mt-2">0</p>
            </div>
          </Card>

          <Card 
            className="p-6 cursor-pointer hover:shadow-md transition-shadow"
            onClick={() => handleViewChange('orders')}
          >
            <div className="flex flex-col items-center">
              <ShoppingBag className="h-8 w-8 text-primary mb-2" />
              <h3 className="text-lg font-medium">Orders</h3>
              <p className="text-xs text-muted-foreground mt-1">Pending Delivery</p>
              <p className="text-4xl font-bold mt-2">0</p>
            </div>
          </Card>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card className="p-6">
            <h3 className="text-lg font-medium mb-4">Recent Activities</h3>
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <Clock className="h-5 w-5 text-muted-foreground" />
                <div>
                  <p className="text-sm">No recent activities</p>
                  <p className="text-xs text-muted-foreground">Your recent activities will appear here</p>
                </div>
              </div>
            </div>
          </Card>

          <Card className="p-6">
            <h3 className="text-lg font-medium mb-4">Analytics Overview</h3>
            <div className="h-40 flex items-center justify-center">
              <PieChart className="h-8 w-8 text-muted-foreground" />
              <p className="ml-3 text-muted-foreground">No analytics data available</p>
            </div>
          </Card>
        </div>

        <StatisticsCharts />
      </div>
    );
  }

  // Default to patient dashboard for other roles
  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold">Welcome to Your Dashboard</h1>
        <p className="text-muted-foreground">Here's an overview of your healthcare information</p>
      </div>
          
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card 
          className="p-6 cursor-pointer hover:shadow-md transition-shadow"
          onClick={() => handleViewChange('prescriptions')}
        >
          <div className="flex flex-col items-center">
            <FileText className="h-8 w-8 text-primary mb-2" />
            <h3 className="text-lg font-medium">Prescriptions</h3>
            <p className="text-xs text-muted-foreground mt-1">Active Prescriptions</p>
            <p className="text-4xl font-bold mt-2">0</p>
          </div>
        </Card>
              
        <Card 
          className="p-6 cursor-pointer hover:shadow-md transition-shadow"
          onClick={() => handleViewChange('orders')}
        >
          <div className="flex flex-col items-center">
            <ShoppingBag className="h-8 w-8 text-primary mb-2" />
            <h3 className="text-lg font-medium">Orders</h3>
            <p className="text-xs text-muted-foreground mt-1">Total Orders</p>
            <p className="text-4xl font-bold mt-2">0</p>
          </div>
        </Card>
              
        {userRole === 'patient' && (
          <>
            <Card 
              className="p-6 cursor-pointer hover:shadow-md transition-shadow"
              onClick={() => handleViewChange('profile', 'doctor')}
            >
              <div className="flex flex-col items-center">
                <Users className="h-8 w-8 text-primary mb-2" />
                <h3 className="text-lg font-medium">Doctors</h3>
                <p className="text-xs text-muted-foreground mt-1">Connected Providers</p>
                <p className="text-4xl font-bold mt-2">0</p>
              </div>
            </Card>
                  
            <Card 
              className="p-6 cursor-pointer hover:shadow-md transition-shadow"
              onClick={() => handleViewChange('teleconsultations')}
            >
              <div className="flex flex-col items-center">
                <Clock className="h-8 w-8 text-primary mb-2" />
                <h3 className="text-lg font-medium">Teleconsultations</h3>
                <p className="text-xs text-muted-foreground mt-1">Upcoming Appointments</p>
                <p className="text-4xl font-bold mt-2">0</p>
              </div>
            </Card>
          </>
        )}
      </div>
      
      {userRole === 'patient' && (
        <>
          <HealthStateIndicator userRole={userRole} />
          <WearableDataDisplay userRole={userRole} />
        </>
      )}
      
      <StatisticsCharts />
    </div>
  );
};

export default HomeView;
