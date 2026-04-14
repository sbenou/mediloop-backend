
import React, { useState, useEffect } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/auth/useAuth";
import { StatisticsCharts } from "@/components/dashboard/StatisticsCharts";
import { usePharmacyDashboardStats } from "@/hooks/admin/useDashboardStats";
import { fetchPharmacyPatientsApi } from "@/services/clinicalApi";
import NotificationsView from "./NotificationsView";
import PrescriptionsView from "./PrescriptionsView";
import OrdersView from "./OrdersView";
import ProfileView from "./ProfileView";
import SettingsView from "./SettingsView";
import { useLoyaltyStatus } from "@/hooks/loyalty/useLoyaltyStatus";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Medal } from "lucide-react";

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

const PharmacyView: React.FC<PharmacyViewProps> = ({ userRole, section = "dashboard" }) => {
  const { profile } = useAuth();
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();
  const { data: stats, isLoading, error } = usePharmacyDashboardStats();
  const [patients, setPatients] = useState<Patient[]>([]);
  const [isLoadingPatients, setIsLoadingPatients] = useState(true);
  
  // Fetch loyalty status
  const loyalty = useLoyaltyStatus();
  
  // Get tab parameter for sections that need it
  const profileTab = searchParams.get("profileTab") || "personal";
  const ordersTab = searchParams.get("ordersTab") || "pending";

  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      try {
        const rows = await fetchPharmacyPatientsApi();
        if (cancelled) return;
        setPatients(
          rows.map((r) => ({
            id: r.id,
            full_name: r.full_name || "Unknown",
            avatar_url: null,
            created_at: r.created_at,
          })),
        );
      } catch (error) {
        console.error("Error fetching pharmacy patients:", error);
        if (!cancelled) setPatients([]);
      } finally {
        if (!cancelled) setIsLoadingPatients(false);
      }
    };
    load();
    return () => {
      cancelled = true;
    };
  }, []);

  const navigateToPharmacyPage = (path: string) => {
    // Navigate within the new dashboard structure
    setSearchParams({ view: 'pharmacy', section: path });
  };

  const viewPatient = (patientId: string) => {
    navigate(`/pharmacy/patients/${patientId}`);
  };

  if (section === "notifications") {
    return (
      <div className="space-y-6">
        <NotificationsView userRole="pharmacist" />
      </div>
    );
  }

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
      
      {/* Loyalty Program Section */}
      <Card className="relative overflow-hidden bg-gradient-to-br from-primary/5 to-primary/10 border-primary/20">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Medal className="h-5 w-5 text-primary" />
            Pharmacy Loyalty Benefits
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center">
              <p className="text-sm text-muted-foreground">Marketing Credits</p>
              <p className="text-2xl font-bold text-primary">€{loyalty.marketingCredits || 0}</p>
            </div>
            <div className="text-center">
              <p className="text-sm text-muted-foreground">Free Deliveries</p>
              <p className="text-2xl font-bold">{loyalty.freeDeliveries || 0}</p>
            </div>
            <div className="text-center">
              <p className="text-sm text-muted-foreground">Wallet Balance</p>
              <p className="text-2xl font-bold text-green-600">€{loyalty.walletBalance.toFixed(2)}</p>
            </div>
            <div className="text-center">
              <p className="text-sm text-muted-foreground">Member Level</p>
              <p className="text-2xl font-bold capitalize">{loyalty.currentLevel}</p>
            </div>
          </div>
          <Button
            variant="outline"
            className="w-full"
            onClick={() => navigate('/account')}
          >
            View Full Loyalty Details
          </Button>
        </CardContent>
      </Card>
      
      <StatisticsCharts />
    </div>
  );
};

export default PharmacyView;
