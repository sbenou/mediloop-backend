
import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/auth/useAuth";
import { Card } from "@/components/ui/card";
import { StatisticsCharts } from "@/components/dashboard/StatisticsCharts";
import { usePharmacyDashboardStats } from "@/hooks/admin/useDashboardStats";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Users,
  ShoppingBag,
  FileText,
  ArrowRight,
} from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { supabase } from "@/lib/supabase";

interface PharmacyViewProps {
  userRole: string | null;
}

interface Patient {
  id: string;
  full_name: string;
  avatar_url: string | null;
  created_at: string;
}

const PharmacyView: React.FC<PharmacyViewProps> = ({ userRole }) => {
  const { profile } = useAuth();
  const navigate = useNavigate();
  const { data: stats, isLoading, error } = usePharmacyDashboardStats();
  const [patients, setPatients] = useState<Patient[]>([]);
  const [isLoadingPatients, setIsLoadingPatients] = useState(true);

  useEffect(() => {
    const fetchPatients = async () => {
      try {
        const { data, error } = await supabase
          .from('profiles')
          .select('id, full_name, avatar_url, created_at')
          .eq('role', 'patient')
          .order('created_at', { ascending: false });

        if (error) throw error;
        setPatients(data || []);
      } catch (error) {
        console.error('Error fetching patients:', error);
      } finally {
        setIsLoadingPatients(false);
      }
    };

    fetchPatients();
  }, []);

  const navigateToPharmacyPage = (path: string) => {
    // Navigate within the new dashboard structure
    navigate(`/dashboard?view=pharmacy&section=${path}`);
  };

  const viewPatient = (patientId: string) => {
    // Navigate within the new dashboard structure
    navigate(`/dashboard?view=pharmacy&section=patients&id=${patientId}`);
  };

  // Split full name into first and last name
  const getNameParts = (fullName: string) => {
    const parts = fullName ? fullName.split(' ') : ['', ''];
    const lastName = parts.length > 1 ? parts.pop() || '' : '';
    const firstName = parts.join(' ');
    return { firstName, lastName };
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Pharmacy Dashboard</h1>
        <p className="text-muted-foreground">
          Welcome back, {profile?.full_name || 'Pharmacy Staff'}!
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card className="bg-white border rounded-lg shadow-sm p-6 cursor-pointer hover:shadow-md transition-shadow"
              onClick={() => navigateToPharmacyPage('patients')}>
          <div className="flex flex-row items-center justify-between space-y-0 pb-2">
            <h3 className="text-sm font-medium">Active Patients</h3>
            <Users className="h-5 w-5 text-muted-foreground" />
          </div>
          <div className="pt-2">
            {isLoading ? (
              <Skeleton className="h-8 w-24" />
            ) : (
              <div className="text-2xl font-bold">+{stats?.total_patients || 0}</div>
            )}
          </div>
        </Card>
        
        <Card className="bg-white border rounded-lg shadow-sm p-6 cursor-pointer hover:shadow-md transition-shadow"
              onClick={() => navigateToPharmacyPage('orders')}>
          <div className="flex flex-row items-center justify-between space-y-0 pb-2">
            <h3 className="text-sm font-medium">Pending Orders</h3>
            <ShoppingBag className="h-5 w-5 text-muted-foreground" />
          </div>
          <div className="pt-2">
            {isLoading ? (
              <Skeleton className="h-8 w-24" />
            ) : (
              <div className="text-2xl font-bold">+{stats?.pending_orders || 0}</div>
            )}
          </div>
        </Card>
        
        <Card className="bg-white border rounded-lg shadow-sm p-6 cursor-pointer hover:shadow-md transition-shadow"
              onClick={() => navigateToPharmacyPage('prescriptions')}>
          <div className="flex flex-row items-center justify-between space-y-0 pb-2">
            <h3 className="text-sm font-medium">Prescriptions</h3>
            <FileText className="h-5 w-5 text-muted-foreground" />
          </div>
          <div className="pt-2">
            {isLoading ? (
              <Skeleton className="h-8 w-24" />
            ) : (
              <div className="text-2xl font-bold">+{stats?.total_prescriptions || 0}</div>
            )}
          </div>
        </Card>
        
        <Card className="bg-white border rounded-lg shadow-sm p-6 cursor-pointer hover:shadow-md transition-shadow">
          <div className="flex flex-row items-center justify-between space-y-0 pb-2">
            <h3 className="text-sm font-medium">Monthly Revenue</h3>
            <span className="text-muted-foreground">€</span>
          </div>
          <div className="pt-2">
            {isLoading ? (
              <Skeleton className="h-8 w-24" />
            ) : (
              <div className="text-2xl font-bold">€{stats?.monthly_revenue?.toLocaleString() || 0}</div>
            )}
          </div>
        </Card>
      </div>
      
      {/* Patients Table */}
      <div className="bg-white border rounded-lg shadow-sm p-6">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-semibold">Recent Patients</h2>
          <Button 
            variant="outline" 
            size="sm" 
            onClick={() => navigateToPharmacyPage('patients')}
          >
            View All
          </Button>
        </div>
        
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[80px]">Avatar</TableHead>
                <TableHead>First Name</TableHead>
                <TableHead>Last Name</TableHead>
                <TableHead>Date Added</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoadingPatients ? (
                <TableRow>
                  <TableCell colSpan={5} className="h-24 text-center">
                    <Skeleton className="h-8 w-full mx-auto" />
                  </TableCell>
                </TableRow>
              ) : patients.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="h-24 text-center text-muted-foreground">
                    No patients found.
                  </TableCell>
                </TableRow>
              ) : (
                patients.slice(0, 5).map((patient) => {
                  const { firstName, lastName } = getNameParts(patient.full_name || '');
                  return (
                    <TableRow key={patient.id}>
                      <TableCell className="font-medium">
                        <Avatar className="h-8 w-8">
                          <AvatarImage src={patient.avatar_url || undefined} alt={patient.full_name || 'Patient'} />
                          <AvatarFallback>{firstName.charAt(0)}{lastName.charAt(0)}</AvatarFallback>
                        </Avatar>
                      </TableCell>
                      <TableCell>{firstName}</TableCell>
                      <TableCell>{lastName}</TableCell>
                      <TableCell>{new Date(patient.created_at).toLocaleDateString()}</TableCell>
                      <TableCell className="text-right">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => viewPatient(patient.id)}
                          className="text-primary"
                        >
                          View
                          <ArrowRight className="ml-1 h-4 w-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
        </div>
      </div>
      
      {/* Add statistics charts */}
      <StatisticsCharts />
    </div>
  );
};

export default PharmacyView;
