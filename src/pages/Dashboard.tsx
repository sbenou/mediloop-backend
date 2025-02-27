
import PatientLayout from "@/components/layout/PatientLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useAuth } from "@/hooks/auth/useAuth";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import { StatsSection } from "@/components/home/StatsSection";
import { Skeleton } from "@/components/ui/skeleton";
import { useEffect } from "react";

const Dashboard = () => {
  const { profile } = useAuth();

  // Fetch statistics including new connection count
  const { data: stats, isLoading } = useQuery({
    queryKey: ['platform-stats'],
    queryFn: async () => {
      try {
        const [
          { count: ordersCount } = { count: 0 },
          { count: pharmaciesCount } = { count: 0 },
          { count: doctorsCount } = { count: 0 },
          { count: prescriptionsCount } = { count: 0 },
          { count: connectionsCount } = { count: 0 },
        ] = await Promise.all([
          supabase.from('orders').select('*', { count: 'exact', head: true }),
          supabase.from('profiles').select('*', { count: 'exact', head: true }).eq('role', 'pharmacist'),
          supabase.from('profiles').select('*', { count: 'exact', head: true }).eq('role', 'doctor'),
          supabase.from('prescriptions').select('*', { count: 'exact', head: true }),
          supabase.from('doctor_patient_connections').select('*', { count: 'exact', head: true }).eq('status', 'accepted'),
        ]);

        return {
          ordersCount: ordersCount || 0,
          pharmaciesCount: pharmaciesCount || 0,
          doctorsCount: doctorsCount || 0,
          prescriptionsCount: prescriptionsCount || 0,
          connectionsCount: connectionsCount || 0,
        };
      } catch (error) {
        console.error('Error fetching stats:', error);
        return {
          ordersCount: 0,
          pharmaciesCount: 0,
          doctorsCount: 0,
          prescriptionsCount: 0,
          connectionsCount: 0,
        };
      }
    },
  });

  // Log for debugging
  useEffect(() => {
    console.log("Dashboard page loaded");
  }, []);

  return (
    <PatientLayout>
      <div className="space-y-8">
        <div>
          <h1 className="text-3xl font-bold mb-2">Welcome, {profile?.full_name || 'Patient'}</h1>
          <p className="text-muted-foreground">
            Here's an overview of your healthcare information
          </p>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Prescriptions</CardTitle>
              <CardDescription>Total active prescriptions</CardDescription>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <Skeleton className="h-10 w-24" />
              ) : (
                <p className="text-2xl font-bold">{stats?.prescriptionsCount || 0}</p>
              )}
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Orders</CardTitle>
              <CardDescription>Total orders placed</CardDescription>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <Skeleton className="h-10 w-24" />
              ) : (
                <p className="text-2xl font-bold">{stats?.ordersCount || 0}</p>
              )}
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Doctors</CardTitle>
              <CardDescription>Connected healthcare providers</CardDescription>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <Skeleton className="h-10 w-24" />
              ) : (
                <p className="text-2xl font-bold">{stats?.connectionsCount || 0}</p>
              )}
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Teleconsultations</CardTitle>
              <CardDescription>Upcoming appointments</CardDescription>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <Skeleton className="h-10 w-24" />
              ) : (
                <p className="text-2xl font-bold">0</p>
              )}
            </CardContent>
          </Card>
        </div>
        
        <StatsSection stats={stats || { 
          ordersCount: 0, 
          pharmaciesCount: 0, 
          doctorsCount: 0, 
          prescriptionsCount: 0, 
          connectionsCount: 0 
        }} />
      </div>
    </PatientLayout>
  );
};

export default Dashboard;
