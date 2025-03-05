import { useState, useEffect, useCallback, useRef } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/auth/useAuth";
import UnifiedLayoutTemplate from "@/components/layout/UnifiedLayoutTemplate";
import { toast } from "@/components/ui/use-toast";
import { Skeleton } from "@/components/ui/skeleton";
import { ScrollArea } from "@/components/ui/scroll-area";
import { supabase, getSessionFromStorage } from "@/lib/supabase";

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
  const [hasLocalSessionCheck, setHasLocalSessionCheck] = useState(false);
  const sessionCheckerRef = useRef<number | null>(null);
  const mountedRef = useRef(true);

  const verifySession = useCallback(async (forceApiCheck = false) => {
    try {
      if (!forceApiCheck) {
        const storedSession = getSessionFromStorage();
        if (storedSession?.user) {
          return true;
        }
      }
      
      const { data: { session }, error } = await supabase.auth.getSession();
      
      if (error) {
        console.error("Error checking session:", error);
        return false;
      }
      
      return !!session;
    } catch (err) {
      console.error("Session verification error:", err);
      return false;
    }
  }, []);

  useEffect(() => {
    const quickSessionCheck = async () => {
      const storedSession = getSessionFromStorage();
      setHasLocalSessionCheck(!!storedSession?.user);
    };
    
    quickSessionCheck();
  }, []);

  useEffect(() => {
    if (!mountedRef.current) return;
    
    const checkAuthentication = async () => {
      if (isAuthenticated && !isLoading) {
        setInitialCheckDone(true);
        return;
      }
      
      if (isLoading) {
        return;
      }
      
      const hasValidSession = await verifySession();
      
      if (!hasValidSession && mountedRef.current) {
        console.log("No valid session found on dashboard load");
        toast({
          variant: "destructive",
          title: "Authentication required",
          description: "Please login to access this page.",
        });
        navigate("/login");
        return;
      }
      
      if (mountedRef.current) {
        setInitialCheckDone(true);
      }
    };
    
    checkAuthentication();
    
    if (sessionCheckerRef.current) {
      window.clearInterval(sessionCheckerRef.current);
    }
    
    sessionCheckerRef.current = window.setInterval(() => {
      if (document.visibilityState === 'visible' && mountedRef.current) {
        verifySession(false);
      }
    }, 5000);
    
    const apiCheckerInterval = window.setInterval(() => {
      if (document.visibilityState === 'visible' && mountedRef.current) {
        verifySession(true);
      }
    }, 30000);
    
    return () => {
      mountedRef.current = false;
      
      if (sessionCheckerRef.current) {
        window.clearInterval(sessionCheckerRef.current);
        sessionCheckerRef.current = null;
      }
      
      window.clearInterval(apiCheckerInterval);
    };
  }, [isAuthenticated, isLoading, navigate, verifySession]);

  useEffect(() => {
    const handleVisibilityChange = async () => {
      if (document.visibilityState === 'visible' && mountedRef.current) {
        console.log("Tab became visible, checking auth state");
        const hasValidSession = await verifySession(true);
        
        if (!hasValidSession && mountedRef.current && initialCheckDone) {
          console.log("Session verification failed after tab switch");
          toast({
            variant: "destructive",
            title: "Session expired",
            description: "Your session has expired. Please login again.",
          });
          navigate("/login");
        }
      }
    };
    
    document.addEventListener('visibilitychange', handleVisibilityChange);
    
    const handleAuthUpdate = async (event: Event) => {
      const customEvent = event as CustomEvent;
      console.log("Auth update event received:", customEvent.detail?.type);
      
      if (customEvent.detail?.type === 'session_removed' && mountedRef.current && initialCheckDone) {
        navigate("/login");
      }
    };
    
    window.addEventListener('supabase:auth:update', handleAuthUpdate);
    
    const handleStorageChange = (e: StorageEvent) => {
      if (!mountedRef.current) return;
      if (!e.key) return;
      
      if (e.key.includes('auth-token')) {
        console.log("Auth token changed in another tab");
        if (initialCheckDone) {
          verifySession(true).then(hasSession => {
            if (!hasSession && mountedRef.current) {
              navigate("/login");
            }
          });
        }
      }
      
      if (e.key === 'supabase_auth_event') {
        try {
          const event = e.newValue ? JSON.parse(e.newValue) : null;
          if (event?.type === 'SIGNED_OUT' && mountedRef.current && initialCheckDone) {
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
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('supabase:auth:update', handleAuthUpdate);
      window.removeEventListener('storage', handleStorageChange);
    };
  }, [initialCheckDone, navigate, verifySession]);

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

  if (isLoading && !hasLocalSessionCheck) {
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
