
import React, { useEffect, useState } from 'react';
import {
  BrowserRouter as Router,
  Route,
  Routes,
  Navigate,
  useLocation,
  useSearchParams,
} from 'react-router-dom';
import { RecoilRoot } from 'recoil';
import { useAuth } from '@/hooks/auth/useAuth';
import {
  ProfileView,
  SettingsView,
  OrdersView,
  PrescriptionsView,
  TeleconsultationsView,
  HomeView,
  PharmacyInventoryView,
  PharmacyPatientsView,
} from '@/components/dashboard/views';
import { Button } from "@/components/ui/button"
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet"
import { clearAllAuthStorage } from '@/lib/supabase';
import { toast } from "@/components/ui/use-toast"
import { useNavigate } from 'react-router-dom';
import PharmacyDashboard from './pages/pharmacy/PharmacyDashboard';

function AppContent() {
  const { isAuthenticated, userRole, isLoading } = useAuth();
  const [showLogoutConfirmation, setShowLogoutConfirmation] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const [searchParams] = useSearchParams();

  // Get the active tabs from URL params
  const getActiveTab = (paramName: string, defaultTab: string) => {
    return searchParams.get(paramName) || defaultTab;
  };

  const handleLogout = () => {
    setShowLogoutConfirmation(true);
  };

  const confirmLogout = async () => {
    setShowLogoutConfirmation(false);
    try {
      await clearAllAuthStorage();
      toast({
        title: "Logged out successfully.",
        description: "You have been logged out."
      });
      navigate('/login');
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Logout failed.",
        description: "There was an error logging you out. Please try again."
      });
    }
  };

  const cancelLogout = () => {
    setShowLogoutConfirmation(false);
  };

  const renderView = () => {
    if (isLoading) {
      return (
        <div className="h-screen flex items-center justify-center">
          <p className="text-lg">Loading...</p>
        </div>
      );
    }

    if (!isAuthenticated) {
      return <Navigate to="/login" replace />;
    }

    let initialView = 'home';
    if (userRole === 'patient') {
      initialView = 'prescriptions';
    } else if (userRole === 'pharmacist') {
      initialView = 'inventory';
    }

    // Get active tabs for components that need them
    const profileTab = getActiveTab('profileTab', 'personal');
    const ordersTab = getActiveTab('ordersTab', 'orders');

    return (
      <Routes>
        <Route path="/" element={<Navigate to={`/dashboard?view=${initialView}`} replace />} />
        <Route path="/dashboard" element={<HomeView userRole={userRole} />} />
        <Route path="/profile" element={<ProfileView activeTab={profileTab} userRole={userRole} />} />
        <Route path="/settings" element={<SettingsView userRole={userRole} />} />
        <Route path="/orders" element={<OrdersView activeTab={ordersTab} userRole={userRole} />} />
        <Route path="/prescriptions" element={<PrescriptionsView userRole={userRole} />} />
        <Route path="/teleconsultations" element={<TeleconsultationsView userRole={userRole} />} />

        {userRole === 'pharmacist' && (
          <>
            <Route path="/pharmacy/inventory" element={<PharmacyInventoryView />} />
            <Route path="/pharmacy/patients" element={<PharmacyPatientsView />} />
          </>
        )}

        {/* Superadmin routes would go here */}

        {/* Fallback route */}
        <Route path="*" element={<Navigate to="/dashboard" replace />} />
        <Route path="/legacy/pharmacy-dashboard" element={<PharmacyDashboard />} />
      </Routes>
    );
  };

  return (
    <>
      {renderView()}

      {/* Logout Confirmation Sheet */}
      <Sheet open={showLogoutConfirmation} onOpenChange={setShowLogoutConfirmation}>
        <SheetContent>
          <SheetHeader>
            <SheetTitle>Confirm Logout</SheetTitle>
            <SheetDescription>
              Are you sure you want to log out?
            </SheetDescription>
          </SheetHeader>
          <div className="grid gap-4">
            <Button onClick={confirmLogout}>Confirm Logout</Button>
            <Button variant="secondary" onClick={cancelLogout}>Cancel</Button>
          </div>
        </SheetContent>
      </Sheet>
    </>
  );
}

function App() {
  return (
    <RecoilRoot>
      <Router>
        <AppContent />
      </Router>
    </RecoilRoot>
  );
}

export default App;
