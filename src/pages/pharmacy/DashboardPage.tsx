
import { useState, useEffect } from "react";
import PharmacistLayout from "@/components/layout/PharmacistLayout";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ShoppingBag, Users, CreditCard, FileText, ArrowRight } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/auth/useAuth";

const DashboardPage = () => {
  const { profile } = useAuth();
  const navigate = useNavigate();
  const [stats, setStats] = useState({
    pendingOrders: 0,
    totalPrescriptions: 0,
    activePatients: 0,
    monthlyRevenue: 0
  });

  // In a real app, you would fetch actual data here
  useEffect(() => {
    // Simulated data fetch
    setTimeout(() => {
      setStats({
        pendingOrders: 12,
        totalPrescriptions: 48,
        activePatients: 124,
        monthlyRevenue: 4250
      });
    }, 500);
  }, []);

  return (
    <PharmacistLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Pharmacy Dashboard</h1>
          <p className="text-muted-foreground">
            Welcome back, {profile?.full_name || 'Pharmacy Staff'}!
          </p>
        </div>

        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Pending Orders</CardTitle>
              <ShoppingBag className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.pendingOrders}</div>
              <p className="text-xs text-muted-foreground">
                {stats.pendingOrders > 0 ? '+4 since yesterday' : 'No new orders'}
              </p>
            </CardContent>
            <CardFooter>
              <Button 
                variant="ghost" 
                className="w-full justify-between" 
                onClick={() => navigate('/pharmacy/orders')}
              >
                <span>View all orders</span>
                <ArrowRight className="h-4 w-4" />
              </Button>
            </CardFooter>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Active Patients</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.activePatients}</div>
              <p className="text-xs text-muted-foreground">
                +{Math.floor(stats.activePatients * 0.05)} new this month
              </p>
            </CardContent>
            <CardFooter>
              <Button 
                variant="ghost" 
                className="w-full justify-between" 
                onClick={() => navigate('/pharmacy/patients')}
              >
                <span>Manage patients</span>
                <ArrowRight className="h-4 w-4" />
              </Button>
            </CardFooter>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Monthly Revenue</CardTitle>
              <CreditCard className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">€{stats.monthlyRevenue.toLocaleString()}</div>
              <p className="text-xs text-muted-foreground">
                +12.5% from last month
              </p>
            </CardContent>
            <CardFooter>
              <Button 
                variant="ghost" 
                className="w-full justify-between" 
                onClick={() => navigate('/pharmacy/orders?tab=payments')}
              >
                <span>View payments</span>
                <ArrowRight className="h-4 w-4" />
              </Button>
            </CardFooter>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Prescriptions</CardTitle>
              <FileText className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.totalPrescriptions}</div>
              <p className="text-xs text-muted-foreground">
                {Math.floor(stats.totalPrescriptions * 0.15)} need review
              </p>
            </CardContent>
            <CardFooter>
              <Button 
                variant="ghost" 
                className="w-full justify-between" 
                onClick={() => navigate('/pharmacy/prescriptions')}
              >
                <span>Manage prescriptions</span>
                <ArrowRight className="h-4 w-4" />
              </Button>
            </CardFooter>
          </Card>
        </div>

        {/* More dashboard content can be added here */}
      </div>
    </PharmacistLayout>
  );
};

export default DashboardPage;
