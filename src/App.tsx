
import { useEffect } from 'react';
import { Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { useRecoilValue, useSetRecoilState } from 'recoil';
import { supabase } from './lib/supabase';

// Pages
import Index from './pages/Index';
import Login from './pages/Login';
import Signup from './pages/Signup';
import ResetPassword from './pages/ResetPassword';
import Profile from './pages/Profile';
import Products from './pages/Products';
import BecomePartner from './pages/BecomePartner';
import BecomeTransporter from './pages/BecomeTransporter';
import FindDoctor from './pages/FindDoctor';
import SearchPharmacy from './pages/SearchPharmacy';
import Settings from './pages/Settings';
import AdminSettings from './pages/AdminSettings';
import MyOrders from './pages/MyOrders';
import MyPrescriptions from './pages/MyPrescriptions';
import Services from './pages/Services';
import DoctorConnections from './pages/DoctorConnections';
import CreatePrescription from './pages/CreatePrescription';
import Notifications from './pages/Notifications';

// Auth Components
import EmailConfirmationHandler from './components/auth/EmailConfirmationHandler';
import { OTPVerificationPage } from './components/auth/login/OTPVerificationPage';

// States
import { authState } from './store/auth/atoms';
import { isAuthenticatedSelector, isLoadingSelector } from './store/auth/selectors';

// Layout
import SidebarLayout from './components/layout/SidebarLayout';

// CSS
import './App.css';

function App() {
  const setAuth = useSetRecoilState(authState);
  const isAuthenticated = useRecoilValue(isAuthenticatedSelector);
  const isLoading = useRecoilValue(isLoadingSelector);
  const location = useLocation();

  useEffect(() => {
    // Check for initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) {
        setAuth((prev) => ({ ...prev, user: session.user }));
        // Fetch user profile
        supabase
          .from('profiles')
          .select('*')
          .eq('id', session.user.id)
          .single()
          .then(({ data, error }) => {
            if (error) {
              console.error('Error fetching profile:', error);
              return;
            }
            
            if (data) {
              setAuth((prev) => ({ ...prev, profile: data }));
            }
          });

          // Fetch user permissions
          supabase
            .from('role_permissions')
            .select('permission_id')
            .eq('role_id', session.user.id)
            .then(({ data, error }) => {
              if (error) {
                console.error('Error fetching permissions:', error);
                return;
              }
              
              if (data) {
                const permissions = data.map(item => item.permission_id);
                setAuth((prev) => ({ ...prev, permissions }));
              }
            });
      }
    });

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        console.log('Auth state changed:', event);
        
        if (session) {
          setAuth((prev) => ({ ...prev, user: session.user }));
          
          // Fetch user profile on auth change
          const { data, error } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', session.user.id)
            .single();
            
          if (error) {
            console.error('Error fetching profile:', error);
          } else if (data) {
            setAuth((prev) => ({ ...prev, profile: data }));
          }

          // Fetch user permissions
          const { data: permissionsData, error: permissionsError } = await supabase
            .from('role_permissions')
            .select('permission_id')
            .eq('role_id', session.user.id);
            
          if (permissionsError) {
            console.error('Error fetching permissions:', permissionsError);
          } else if (permissionsData) {
            const permissions = permissionsData.map(item => item.permission_id);
            setAuth((prev) => ({ ...prev, permissions }));
          }
        } else {
          setAuth((prev) => ({ ...prev, user: null, profile: null, permissions: [] }));
        }
      }
    );

    return () => {
      subscription.unsubscribe();
    };
  }, [setAuth]);

  // Pages that use the sidebar layout
  const sidebarLayoutPages = [
    '/profile',
    '/my-orders',
    '/my-prescriptions',
    '/settings',
    '/admin-settings',
    '/admin-users',
    '/admin-roles',
    '/admin-permissions',
    '/admin-products',
    '/my-payments',
    '/notifications'
  ];

  // Check if current path should use sidebar layout
  const useSidebarLayout = sidebarLayoutPages.some(path => 
    location.pathname === path || location.pathname.startsWith(`${path}/`)
  );

  // Pages that are accessible both authenticated and not
  const publicPages = ['/', '/login', '/signup', '/reset-password', '/products', '/services'];
  
  if (isLoading) {
    // Show loading state while checking auth
    return <div className="loading">Loading...</div>;
  }

  // Redirect to login for protected pages if not authenticated
  if (!isAuthenticated && !publicPages.includes(location.pathname) && 
      !location.pathname.includes('/auth/confirm') && 
      !location.pathname.includes('/auth/verify')) {
    return <Navigate to="/login" replace />;
  }

  return (
    <>
      {useSidebarLayout ? (
        <SidebarLayout>
          <Routes>
            <Route path="/profile" element={<Profile />} />
            <Route path="/my-orders" element={<MyOrders />} />
            <Route path="/my-prescriptions" element={<MyPrescriptions />} />
            <Route path="/settings" element={<Settings />} />
            <Route path="/admin-settings" element={<AdminSettings />} />
            <Route path="/notifications" element={<Notifications />} />
            <Route path="*" element={<Navigate to="/profile" replace />} />
          </Routes>
        </SidebarLayout>
      ) : (
        <Routes>
          <Route path="/" element={<Index />} />
          <Route path="/login" element={<Login />} />
          <Route path="/signup" element={<Signup />} />
          <Route path="/reset-password" element={<ResetPassword />} />
          <Route path="/products" element={<Products />} />
          <Route path="/services" element={<Services />} />
          <Route path="/auth/confirm" element={<EmailConfirmationHandler />} />
          <Route path="/auth/verify" element={<OTPVerificationPage />} />
          <Route path="/become-partner" element={<BecomePartner />} />
          <Route path="/become-transporter" element={<BecomeTransporter />} />
          <Route path="/find-doctor" element={<FindDoctor />} />
          <Route path="/search-pharmacy" element={<SearchPharmacy />} />
          <Route path="/doctor-connections" element={<DoctorConnections />} />
          <Route path="/create-prescription" element={<CreatePrescription />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      )}
    </>
  );
}

export default App;
