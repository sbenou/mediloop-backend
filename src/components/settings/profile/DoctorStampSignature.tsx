
import React, { useEffect, useState, useCallback } from 'react';
import { useAuth } from "@/hooks/auth/useAuth";
import CanvasSection from './canvas/CanvasSection';
import { toast } from "@/components/ui/use-toast";
import { Loader } from "lucide-react";
import { supabase } from '@/lib/supabase';

interface DoctorStampSignatureProps {
  stampUrl: string | null;
  signatureUrl: string | null;
}

const DoctorStampSignature: React.FC<DoctorStampSignatureProps> = ({ stampUrl, signatureUrl }) => {
  const { profile, isAuthenticated, isLoading, refreshSession } = useAuth();
  const [localLoading, setLocalLoading] = useState(true);
  const [localAuth, setLocalAuth] = useState(false);
  const [userId, setUserId] = useState<string | null>(null);

  // Direct session check for improved reliability
  const checkSessionDirectly = useCallback(async () => {
    try {
      console.log("DoctorStampSignature: Performing direct session check");
      const { data } = await supabase.auth.getSession();
      
      if (data?.session?.user?.id) {
        console.log(`DoctorStampSignature: Direct session check found user: ${data.session.user.id}`);
        setLocalAuth(true);
        setUserId(data.session.user.id);
        return data.session.user.id;
      } else {
        console.log("DoctorStampSignature: Direct session check - no active session");
        setLocalAuth(false);
        return null;
      }
    } catch (error) {
      console.error("DoctorStampSignature: Direct session check error:", error);
      return null;
    }
  }, []);

  // Ensure we have a valid session before rendering
  useEffect(() => {
    const checkAuth = async () => {
      console.log("DoctorStampSignature: Initial auth check, isAuthenticated =", isAuthenticated);
      
      if (!isAuthenticated && !isLoading) {
        console.log("DoctorStampSignature: Not authenticated via hook, checking directly");
        const directUserId = await checkSessionDirectly();
        
        if (!directUserId) {
          console.log("DoctorStampSignature: No direct session found, attempting refresh");
          try {
            // Try to refresh session
            const session = await refreshSession();
            if (session?.user?.id) {
              console.log(`DoctorStampSignature: Session refresh successful: ${session.user.id}`);
              setLocalAuth(true);
              setUserId(session.user.id);
            } else {
              console.warn('DoctorStampSignature: Authentication refresh failed');
              toast({
                title: "Authentication Required",
                description: "Please ensure you're logged in to access this feature",
                variant: "destructive"
              });
            }
          } catch (error) {
            console.error("DoctorStampSignature: Session refresh error:", error);
          }
        }
      } else if (isAuthenticated && profile?.id) {
        console.log(`DoctorStampSignature: User authenticated via hook: ${profile.id}`);
        setLocalAuth(true);
        setUserId(profile.id);
      }
      
      setLocalLoading(false);
    };

    checkAuth();
    
    // Check again when visibility state changes
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        console.log("DoctorStampSignature: Tab visible, rechecking auth");
        checkAuth();
      }
    };
    
    document.addEventListener('visibilitychange', handleVisibilityChange);
    
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [isAuthenticated, isLoading, refreshSession, profile, checkSessionDirectly]);
  
  // Show loading state when authentication status is being determined
  if (isLoading || localLoading) {
    return (
      <div className="flex items-center justify-center p-8 border rounded-md bg-muted h-64">
        <div className="flex flex-col items-center space-y-4">
          <Loader className="h-8 w-8 animate-spin text-primary" />
          <p className="text-muted-foreground">Verifying user credentials...</p>
        </div>
      </div>
    );
  }
  
  // Fallback if no profile is available
  if (!isAuthenticated && !localAuth) {
    return (
      <div className="p-6 border rounded-md bg-muted">
        <p className="text-center text-muted-foreground">
          Authentication required to access stamp and signature tools.
        </p>
        <p className="text-center text-muted-foreground mt-2">
          Please log in to continue.
        </p>
      </div>
    );
  }

  // Use either the profile ID from the auth hook or the locally detected user ID
  const effectiveUserId = profile?.id || userId;
  
  if (!effectiveUserId) {
    return (
      <div className="p-6 border rounded-md bg-muted">
        <p className="text-center text-muted-foreground">
          Unable to determine user identity.
        </p>
        <p className="text-center text-muted-foreground mt-2">
          Please try refreshing the page.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <CanvasSection
        title="Doctor Stamp"
        description="This stamp will appear on your prescriptions and official documents"
        imageUrl={stampUrl}
        type="stamp"
        userId={effectiveUserId}
      />
      
      <CanvasSection
        title="Doctor Signature"
        description="This signature will appear on your prescriptions and official documents"
        imageUrl={signatureUrl}
        type="signature"
        userId={effectiveUserId}
      />
    </div>
  );
};

export default DoctorStampSignature;
