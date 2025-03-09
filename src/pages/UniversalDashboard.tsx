
import React from 'react';
import { useSearchParams } from 'react-router-dom';
import { useAuth } from '@/hooks/auth/useAuth';
import HomeView from '@/components/dashboard/views/HomeView';
import ProfileView from '@/components/dashboard/views/ProfileView';
import OrdersView from '@/components/dashboard/views/OrdersView';
import PrescriptionsView from '@/components/dashboard/views/PrescriptionsView';
import SettingsView from '@/components/dashboard/views/SettingsView';
import TeleconsultationsView from '@/components/dashboard/views/TeleconsultationsView';
import PharmacyView from '@/components/dashboard/views/PharmacyView';
import { DashboardSidebar } from '@/components/sidebar/DashboardSidebar';

const UniversalDashboard = () => {
  const [searchParams] = useSearchParams();
  const { profile } = useAuth();
  
  const currentView = searchParams.get('view') || 'home';
  const role = profile?.role || null;

  const renderView = () => {
    switch (currentView) {
      case 'home':
        return <HomeView userRole={role} />;
      case 'profile':
        return <ProfileView />;
      case 'orders':
        return <OrdersView />;
      case 'prescriptions':
        return <PrescriptionsView />;
      case 'settings':
        return <SettingsView />;
      case 'teleconsultations':
        return <TeleconsultationsView />;
      case 'pharmacy':
        return <PharmacyView />;
      default:
        return <HomeView userRole={role} />;
    }
  };

  return (
    <div className="flex h-screen bg-gray-100">
      <DashboardSidebar />
      <main className="flex-1 overflow-y-auto p-4 md:p-8">
        {renderView()}
      </main>
    </div>
  );
};

export default UniversalDashboard;
