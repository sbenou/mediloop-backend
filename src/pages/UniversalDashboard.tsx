
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
import DashboardSidebar from '@/components/sidebar/DashboardSidebar';

const UniversalDashboard = () => {
  const [searchParams] = useSearchParams();
  const { profile, isPharmacist } = useAuth();
  
  const currentView = searchParams.get('view') || 'home';
  const section = searchParams.get('section') || 'dashboard';
  const role = profile?.role || null;
  
  console.log('UniversalDashboard rendering:', {
    currentView,
    section,
    role,
    isPharmacist
  });
  
  // Get tab parameters from URL for components that need it
  const profileTab = searchParams.get('profileTab') || 'personal';
  const ordersTab = searchParams.get('ordersTab') || 'orders';

  // If user is a pharmacist and no specific view is set, show pharmacy view
  const effectiveView = (role === 'pharmacist' || isPharmacist) && currentView === 'home' 
    ? 'pharmacy' 
    : currentView;

  const renderView = () => {
    console.log('Rendering view:', effectiveView, 'with section:', section);
    
    switch (effectiveView) {
      case 'home':
        return <HomeView userRole={role} />;
      case 'profile':
        return <ProfileView activeTab={profileTab} userRole={role} />;
      case 'orders':
        return <OrdersView activeTab={ordersTab} userRole={role} />;
      case 'prescriptions':
        return <PrescriptionsView userRole={role} />;
      case 'settings':
        return <SettingsView userRole={role} />;
      case 'teleconsultations':
        return <TeleconsultationsView userRole={role} />;
      case 'pharmacy':
        console.log('Rendering PharmacyView with section:', section);
        return <PharmacyView userRole={role} section={section} />;
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
