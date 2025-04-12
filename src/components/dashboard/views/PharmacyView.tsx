
import React, { useState, useEffect, useCallback, memo } from "react";
import { useSearchParams } from "react-router-dom";
import { useAuth } from "@/hooks/auth/useAuth";
import { StatisticsCharts } from "@/components/dashboard/StatisticsCharts";
import { usePharmacyDashboardStats } from "@/hooks/admin/useDashboardStats";
import { supabase } from "@/lib/supabase";
import PrescriptionsView from "./PrescriptionsView";
import OrdersView from "./OrdersView";
import ProfileView from "./ProfileView";
import SettingsView from "./SettingsView";

// Import refactored components
import SectionHeader from "./pharmacy/SectionHeader";
import DashboardStats from "./pharmacy/DashboardStats";
import PatientsSection from "./pharmacy/PatientsSection";
import PatientTable from "./pharmacy/PatientTable";

interface PharmacyViewProps {
  userRole: string | null;
  section?: string;
}

interface Patient {
  id: string;
  full_name: string;
  avatar_url: string | null;
  created_at: string;
}

// Use memo to prevent unnecessary re-renders
const PharmacyView: React.FC<PharmacyViewProps> = memo(({ userRole, section = "dashboard" }) => {
  const { profile } = useAuth();
  const [searchParams, setSearchParams] = useSearchParams();
  const { data: stats, isLoading, error } = usePharmacyDashboardStats();
  const [patients, setPatients] = useState<Patient[]>([]);
  const [isLoadingPatients, setIsLoadingPatients] = useState(true);
  
  // Get tab parameter for sections that need it
  const profileTab = searchParams.get("profileTab") || "personal";
  const ordersTab = searchParams.get("ordersTab") || "pending";

  // Use useCallback to prevent unnecessary re-renders
  const fetchPatients = useCallback(async () => {
    try {
      setIsLoadingPatients(true);
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
  }, []);

  useEffect(() => {
    fetchPatients();
  }, [fetchPatients]);

  // Use useCallback for event handlers to prevent unnecessary re-renders
  const navigateToPharmacyPage = useCallback((path: string) => {
    setSearchParams({ view: 'pharmacy', section: path });
  }, [setSearchParams]);

  const viewPatient = useCallback((patientId: string) => {
    setSearchParams({ view: 'pharmacy', section: 'patients', id: patientId });
  }, [setSearchParams]);

  // Render prescriptions section
  if (section === "prescriptions") {
    return (
      <div className="space-y-6">
        <PrescriptionsView userRole="pharmacist" />
      </div>
    );
  }

  // Render orders section
  if (section === "orders") {
    return (
      <div className="space-y-6">
        <OrdersView userRole="pharmacist" activeTab={ordersTab} />
      </div>
    );
  }

  // Render profile section
  if (section === "profile") {
    return (
      <div className="space-y-6">
        <ProfileView userRole="pharmacist" activeTab={profileTab} />
      </div>
    );
  }

  // Render settings section
  if (section === "settings") {
    return (
      <div className="space-y-6">
        <SettingsView userRole="pharmacist" />
      </div>
    );
  }

  // Render patients section
  if (section === "patients") {
    return (
      <div className="space-y-6">
        <SectionHeader 
          title="Patients" 
          subtitle="Manage all patients that have prescriptions in your pharmacy."
        />
        
        <div className="bg-white border rounded-lg shadow-sm p-6">
          <PatientTable 
            patients={patients}
            isLoading={isLoadingPatients}
            onViewPatient={viewPatient}
          />
        </div>
      </div>
    );
  }

  // Default dashboard view
  return (
    <div className="space-y-6">
      <SectionHeader 
        title="Pharmacy Dashboard" 
        subtitle={`Welcome back, ${profile?.full_name || 'Pharmacy Staff'}!`}
      />

      <DashboardStats 
        stats={stats}
        isLoading={isLoading}
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
  );
});

// Add displayName for better debugging
PharmacyView.displayName = 'PharmacyView';

export default PharmacyView;
