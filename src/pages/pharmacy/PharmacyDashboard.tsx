
import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/auth/useAuth";
import PharmacistLayout from "@/components/layout/PharmacistLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { usePharmacyDashboardStats } from "@/hooks/admin/useDashboardStats";
import { Skeleton } from "@/components/ui/skeleton";
import { StatisticsCharts } from "@/components/dashboard/StatisticsCharts";
import PatientsSection from "@/components/dashboard/views/pharmacy/PatientsSection";
import DashboardStats from "@/components/dashboard/views/pharmacy/DashboardStats";
import SectionHeader from "@/components/dashboard/views/pharmacy/SectionHeader";
import { supabase } from "@/lib/supabase";
import { toast } from "@/components/ui/use-toast";
import { Loader } from "lucide-react";

interface Patient {
  id: string;
  full_name: string;
  avatar_url: string | null;
  created_at: string;
}

const PharmacyDashboard = () => {
  const navigate = useNavigate();
  const { isAuthenticated, isLoading, profile, isPharmacist } = useAuth();
  const { data: stats, isLoading: isStatsLoading } = usePharmacyDashboardStats();
  const [patients, setPatients] = useState<Patient[]>([]);
  const [isLoadingPatients, setIsLoadingPatients] = useState(true);
  const [isInitialLoad, setIsInitialLoad] = useState(true);
  const redirectAttempted = React.useRef(false);
  const dashboardMounted = React.useRef(true);

  useEffect(() => {
    // Debug log for tracking
    console.log("PharmacyDashboard component mounted");
    dashboardMounted.current = true;
    
    console.log("Auth state:", { isAuthenticated, isLoading, isPharmacist });
    
    const fetchPatients = async () => {
      try {
        if (!dashboardMounted.current) return;
        
        const { data, error } = await supabase
          .from('profiles')
          .select('id, full_name, avatar_url, created_at')
          .eq('role', 'patient')
          .order('created_at', { ascending: false });

        if (error) throw error;
        
        if (dashboardMounted.current) {
          setPatients(data || []);
        }
      } catch (error) {
        console.error('Error fetching patients:', error);
      } finally {
        if (dashboardMounted.current) {
          setIsLoadingPatients(false);
        }
      }
    };

    // Only fetch data if authenticated
    if (isAuthenticated && !isLoading) {
      fetchPatients();
    }

    return () => {
      console.log("PharmacyDashboard component unmounted");
      dashboardMounted.current = false;
    };
  }, [isAuthenticated, isLoading, isPharmacist]);

  // Check authentication status when it changes, with improved stability
  useEffect(() => {
    if (!isLoading) {
      setIsInitialLoad(false);
      
      // Only redirect if we're sure the user is not authenticated (after initial load)
      // And don't redirect if we've already attempted a redirect
      if (!isAuthenticated && !redirectAttempted.current) {
        console.log("User not authenticated, redirecting to login");
        redirectAttempted.current = true;
        toast({
          variant: "destructive",
          title: "Authentication required",
          description: "Please login to access the pharmacy dashboard.",
        });
        navigate("/login");
        return;
      }

      // Check if user is a pharmacist, but only if not already redirected
      if (isAuthenticated && profile && profile.role !== "pharmacist" && !redirectAttempted.current) {
        console.log("User is not a pharmacist, redirecting to dashboard");
        redirectAttempted.current = true;
        toast({
          variant: "destructive",
          title: "Access denied",
          description: "Only pharmacists can access the pharmacy dashboard.",
        });
        navigate("/dashboard");
      }
    }
  }, [isAuthenticated, isLoading, navigate, profile, isPharmacist]);

  // Show loading state during initial load
  if (isLoading || isInitialLoad) {
    return (
      <div className="h-screen w-full flex items-center justify-center bg-background">
        <div className="flex flex-col items-center space-y-4">
          <Loader className="h-8 w-8 animate-spin text-primary" />
          <p className="text-muted-foreground">Loading pharmacy dashboard...</p>
        </div>
      </div>
    );
  }

  // Safety check - don't render if not authenticated or not a pharmacist
  // But use isPharmacist as well to be more permissive with the check
  if (!isAuthenticated || (!isPharmacist && profile && profile.role !== "pharmacist")) {
    return null;
  }

  const viewPatient = (patientId: string) => {
    navigate(`/dashboard?view=pharmacy&section=patients&id=${patientId}`);
  };

  const navigateToPharmacyPage = (path: string) => {
    navigate(`/dashboard?view=pharmacy&section=${path}`);
  };

  return (
    <PharmacistLayout>
      <div className="space-y-6">
        <SectionHeader 
          title="Pharmacy Dashboard" 
          subtitle={`Welcome back, ${profile?.full_name || 'Pharmacy Staff'}!`}
        />

        <DashboardStats 
          stats={stats}
          isLoading={isStatsLoading}
          onNavigate={navigateToPharmacyPage}
        />
        
        <PatientsSection 
          patients={patients}
          isLoading={isLoadingPatients}
          onViewPatient={viewPatient}
          onViewAllPatients={() => navigateToPharmacyPage('patients')}
          limit={5}
        />
        
        <StatisticsCharts />
      </div>
    </PharmacistLayout>
  );
};

export default PharmacyDashboard;
