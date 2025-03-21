
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
  const [isPageMounted, setIsPageMounted] = useState(true);
  const redirectAttempted = React.useRef(false);
  const dashboardMounted = React.useRef(true);
  const authCheckComplete = React.useRef(false);

  // Set up dashboardMounted ref for tracking component lifecycle
  useEffect(() => {
    // Debug log for tracking
    console.log("PharmacyDashboard component mounted");
    dashboardMounted.current = true;
    setIsPageMounted(true);
    
    console.log("Auth state:", { isAuthenticated, isLoading, isPharmacist });
    
    return () => {
      console.log("PharmacyDashboard component unmounted");
      dashboardMounted.current = false;
      setIsPageMounted(false);
    };
  }, []);

  // Fetch patients data
  useEffect(() => {
    const fetchPatients = async () => {
      if (!dashboardMounted.current || !isPageMounted) return;
      
      try {
        const { data, error } = await supabase
          .from('profiles')
          .select('id, full_name, avatar_url, created_at')
          .eq('role', 'patient')
          .order('created_at', { ascending: false });

        if (error) throw error;
        
        if (dashboardMounted.current && isPageMounted) {
          setPatients(data || []);
          setIsLoadingPatients(false);
        }
      } catch (error) {
        console.error('Error fetching patients:', error);
        if (dashboardMounted.current && isPageMounted) {
          setIsLoadingPatients(false);
        }
      }
    };

    // Only fetch data if authenticated
    if (isAuthenticated && !isLoading && isPageMounted) {
      fetchPatients();
    }
  }, [isAuthenticated, isLoading, isPharmacist, isPageMounted]);

  // Set initial load state
  useEffect(() => {
    if (!isLoading && isPageMounted) {
      setIsInitialLoad(false);
    }
  }, [isLoading, isPageMounted]);

  // Check authentication status when it changes - with improved stability
  useEffect(() => {
    // Skip if we've already checked auth and attempted redirect
    if (authCheckComplete.current || !dashboardMounted.current || !isPageMounted) return;
    
    if (!isLoading) {
      // Only perform auth check once
      if (!authCheckComplete.current) {
        authCheckComplete.current = true;
        
        // Only redirect if we're sure the user is not authenticated (after initial load)
        // And don't redirect if we've already attempted a redirect
        if (!isAuthenticated && !redirectAttempted.current && isPageMounted) {
          console.log("User not authenticated, redirecting to login");
          redirectAttempted.current = true;
          
          // If we need to redirect away, do it safely
          if (dashboardMounted.current && isPageMounted) {
            toast({
              variant: "destructive",
              title: "Authentication required",
              description: "Please login to access the pharmacy dashboard.",
            });
            navigate("/login", { replace: true });
          }
          return;
        }

        // Check if user is a pharmacist, but only if not already redirected
        if (isAuthenticated && profile && profile.role !== "pharmacist" && !redirectAttempted.current && isPageMounted) {
          console.log("User is not a pharmacist, redirecting to dashboard");
          redirectAttempted.current = true;
          
          // If we need to redirect away, do it safely
          if (dashboardMounted.current && isPageMounted) {
            toast({
              variant: "destructive",
              title: "Access denied",
              description: "Only pharmacists can access the pharmacy dashboard.",
            });
            navigate("/dashboard", { replace: true });
          }
        }
      }
    }
  }, [isAuthenticated, isLoading, navigate, profile, isPharmacist, isPageMounted]);

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
    if (!dashboardMounted.current || !isPageMounted) return;
    navigate(`/dashboard?view=pharmacy&section=patients&id=${patientId}`);
  };

  const navigateToPharmacyPage = (path: string) => {
    if (!dashboardMounted.current || !isPageMounted) return;
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
