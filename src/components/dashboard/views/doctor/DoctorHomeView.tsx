import React from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/auth/useAuth";
import { StatisticsCharts } from "@/components/dashboard/StatisticsCharts";
import WearableDataDisplay from "@/components/dashboard/WearableDataDisplay";
import HealthStateIndicator from "@/components/dashboard/HealthStateIndicator";
import DashboardStats from "@/components/dashboard/views/pharmacy/DashboardStats";
import DoctorPatientsSection from "./DoctorPatientsSection";
import { useDoctorRecentPatients } from "@/hooks/doctor/useDoctorRecentPatients";

interface DoctorHomeViewProps {
  userRole: string | null;
}

const DoctorHomeView: React.FC<DoctorHomeViewProps> = ({ userRole }) => {
  const { profile } = useAuth();
  const navigate = useNavigate();
  
  // Fetch recent patients
  const { recentPatients: patients, loading: isPatientsLoading } = useDoctorRecentPatients(profile?.id);

  const handleViewChange = (view: string, tab?: string) => {
    if (tab) {
      navigate(`/dashboard?view=${view}&${view}Tab=${tab}`);
    } else {
      navigate(`/dashboard?view=${view}`);
    }
  };

  const handleViewPatient = (patientId: string) => {
    // Navigate to the patient detail view
    navigate(`/dashboard?view=doctor&section=patients&patientId=${patientId}`);
  };

  const handleViewAllPatients = () => {
    // Navigate to the patients section
    navigate(`/dashboard?view=doctor&section=patients`);
  };

  return (
    <div className="space-y-8">
      <div className="text-center md:text-left">
        <h1 className="text-3xl font-bold mb-2">Welcome, {profile?.full_name || 'Doctor'}</h1>
        <p className="text-muted-foreground">
          Here's an overview of your practice
        </p>
      </div>
      
      {/* Dashboard Stats */}
      <DashboardStats 
        stats={{
          total_patients: patients?.length || 0,
          pending_orders: 0,
          total_prescriptions: 0,
          monthly_revenue: 0
        }}
        isLoading={isPatientsLoading}
        onNavigate={handleViewChange}
        userRole={userRole || undefined}
      />
      
      {/* Recent Patients Section */}
      <DoctorPatientsSection
        patients={patients || []}
        isLoading={isPatientsLoading}
        onViewPatient={handleViewPatient}
        onViewAllPatients={handleViewAllPatients}
      />
      
      {/* Health State Indicators */}
      <HealthStateIndicator userRole={userRole} />
      
      {/* Wearable Data Display */}
      <WearableDataDisplay userRole={userRole} />
      
      {/* Statistics Charts */}
      <StatisticsCharts />
    </div>
  );
};

export default DoctorHomeView;
