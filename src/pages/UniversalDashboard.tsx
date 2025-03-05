
import { useState, useEffect, useCallback, useRef } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/auth/useAuth";
import UnifiedLayoutTemplate from "@/components/layout/UnifiedLayoutTemplate";
import { toast } from "@/components/ui/use-toast";
import { Skeleton } from "@/components/ui/skeleton";
import { ScrollArea } from "@/components/ui/scroll-area";
import { supabase } from "@/lib/supabase";

import {
  ProfileView,
  SettingsView,
  OrdersView,
  PrescriptionsView,
  TeleconsultationsView,
  HomeView,
} from "@/components/dashboard/views";

const UniversalDashboard = () => {
  const { userRole, isAuthenticated, isLoading } = useAuth();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const view = searchParams.get('view') || 'home';
  const [initialCheckDone, setInitialCheckDone] = useState(false);
  const [localLoading, setLocalLoading] = useState(true);
  const sessionCheckerRef = useRef<number | null>(null);

  // Function to verify session, separated for reuse
  const verifySession = useCallback(async () => {
    try {
      // First, try to get session from storage (faster)
      const storageKey = `sb-${window.location.hostname.split('.')[0]}-auth-token`;
      const storedSession = localStorage.getItem(storageKey) 
        ? JSON.parse(localStorage.getItem(storageKey) || '{}')
        : null;
      
      if (storedSession?.user) {
        return true;
      }
      
      // If not in storage, check API (slower)
      const { data: { session }, error } = await supabase.auth.getSession();
      
      if (error) {
        console.error("Error checking session:", error);
        return false;
      }
      
      // If we have a session but it's not in storage, make sure to store it
      if (session && !storedSession) {
        console.log("Found session in API but not in storage, storing it now");
        localStorage.setItem(storageKey, JSON.stringify(session));
        sessionStorage.setItem(storageKey, JSON.stringify(session));
      }
      
      return !!session;
    } catch (err) {
      console.error("Session verification error:", err);
      return false;
    }
  }, []);

  // Enhanced authentication check with session verification
  useEffect(() => {
    let mounted = true;
    
    const checkAuthentication = async () => {
      if (!isAuthenticated && !isLoading) {
        const hasValidSession = await verifySession();
        
        if (!hasValidSession && mounted) {
          console.log("No valid session found on dashboard load");
          toast({
            variant: "destructive",
            title: "Authentication required",
            description: "Please login to access this page.",
          });
          navigate("/login");
          return;
        }
      }
      
      if (mounted) {
        setInitialCheckDone(true);
        setLocalLoading(false);
      }
    };
    
    checkAuthentication();
    
    // Start continuous session verification process
    if (sessionCheckerRef.current) {
      window.clearInterval(sessionCheckerRef.current);
    }
    
    sessionCheckerRef.current = window.setInterval(async () => {
      if (document.visibilityState === 'visible') {
        await verifySession();
      }
    }, 5000); // Check every 5 seconds when tab is visible
    
    // Handle tab visibility changes with improved error handling
    const handleVisibilityChange = async () => {
      if (document.visibilityState === 'visible' && mounted) {
        console.log("Tab became visible, checking auth state");
        // Don't show loading state on tab switch if we already did the initial check
        if (initialCheckDone) {
          setLocalLoading(false);
        }
        
        const hasValidSession = await verifySession();
        
        if (!hasValidSession) {
          console.log("Session verification failed after tab switch");
          if (initialCheckDone && mounted) {
            toast({
              variant: "destructive",
              title: "Session expired",
              description: "Your session has expired. Please login again.",
            });
            navigate("/login");
          }
        } else {
          console.log("Session successfully verified after tab switch");
          if (mounted) {
            setLocalLoading(false);
          }
        }
      }
    };
    
    // Add the visibility change listener
    document.addEventListener('visibilitychange', handleVisibilityChange);
    
    // Listen for storage events for cross-tab authentication
    const handleStorageChange = (e: StorageEvent) => {
      if (!e.key) return;
      
      // Check for auth token changes
      if (e.key.includes('auth-token')) {
        console.log("Auth token changed in another tab");
        // Force session verification
        verifySession().then(hasSession => {
          if (!hasSession && mounted && initialCheckDone) {
            console.log("No valid session found after storage change");
            navigate("/login");
          } else if (mounted) {
            setLocalLoading(false);
          }
        });
      }
      
      // Check for explicit logout events
      if (e.key === 'last_auth_event') {
        try {
          const event = e.newValue ? JSON.parse(e.newValue) : null;
          if (event?.type === 'LOGOUT' && mounted && initialCheckDone) {
            console.log("Logout detected in another tab");
            navigate("/login");
          }
        } catch (error) {
          console.error("Error processing auth event:", error);
        }
      }
    };
    
    window.addEventListener('storage', handleStorageChange);
    
    return () => {
      mounted = false;
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('storage', handleStorageChange);
      
      // Clear interval on unmount
      if (sessionCheckerRef.current) {
        window.clearInterval(sessionCheckerRef.current);
        sessionCheckerRef.current = null;
      }
    };
  }, [isAuthenticated, isLoading, navigate, initialCheckDone, verifySession]);

  const hasPermissionForView = (view: string): boolean => {
    const commonViews = ['home', 'profile', 'settings'];
    
    if (commonViews.includes(view)) return true;
    
    switch (userRole) {
      case 'patient':
        return ['orders', 'prescriptions', 'teleconsultations'].includes(view);
      case 'doctor':
        return ['patients', 'appointments', 'prescriptions'].includes(view);
      case 'pharmacist':
        return ['inventory', 'orders', 'prescriptions'].includes(view);
      case 'superadmin':
        return true;
      default:
        return false;
    }
  };

  useEffect(() => {
    if (!isLoading && isAuthenticated && !hasPermissionForView(view)) {
      toast({
        variant: "destructive",
        title: "Access restricted",
        description: "You don't have permission to access this view.",
      });
      navigate("/dashboard?view=home");
    }
  }, [view, userRole, isAuthenticated, isLoading, navigate]);

  // Only show skeleton if we're in the actual loading state
  // This prevents skeleton from showing when just switching tabs
  if (isLoading && localLoading && !initialCheckDone) {
    return (
      <UnifiedLayoutTemplate>
        <div className="space-y-4">
          <Skeleton className="h-12 w-2/3" />
          <Skeleton className="h-64 w-full" />
        </div>
      </UnifiedLayoutTemplate>
    );
  }

  const renderView = () => {
    const commonProps = {
      ordersTab: searchParams.get('ordersTab') || 'orders',
      profileTab: searchParams.get('profileTab') || 'personal',
    };

    switch (view) {
      case 'profile':
        return <ProfileView activeTab={commonProps.profileTab} userRole={userRole} />;
      case 'settings':
        return <SettingsView userRole={userRole} />;
      case 'orders':
        return <OrdersView activeTab={commonProps.ordersTab} userRole={userRole} />;
      case 'prescriptions':
        return <PrescriptionsView userRole={userRole} />;
      case 'teleconsultations':
        return <TeleconsultationsView userRole={userRole} />;
      case 'home':
      default:
        return <HomeView userRole={userRole} />;
    }
  };

  return (
    <UnifiedLayoutTemplate>
      <div className="h-full overflow-hidden">
        <ScrollArea className="h-full w-full main-content-scroll">
          {renderView()}
        </ScrollArea>
      </div>
    </UnifiedLayoutTemplate>
  );
};

export default UniversalDashboard;
