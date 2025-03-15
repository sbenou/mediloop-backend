
import React, { useEffect, useState } from 'react';
import { useAuth } from "@/hooks/auth/useAuth";
import CanvasSection from './canvas/CanvasSection';
import { toast } from "@/components/ui/use-toast";
import { Loader } from "lucide-react";

interface DoctorStampSignatureProps {
  stampUrl: string | null;
  signatureUrl: string | null;
}

const DoctorStampSignature: React.FC<DoctorStampSignatureProps> = ({ stampUrl, signatureUrl }) => {
  const { profile, isAuthenticated, isLoading, refreshSession } = useAuth();
  const [localLoading, setLocalLoading] = useState(true);

  // Ensure we have a valid session before rendering
  useEffect(() => {
    const checkAuth = async () => {
      if (!isAuthenticated && !isLoading) {
        console.log("DoctorStampSignature: Not authenticated, attempting session refresh");
        try {
          // Try to refresh session
          const session = await refreshSession();
          if (!session) {
            console.warn('DoctorStampSignature: Authentication refresh failed');
            toast({
              title: "Authentication Required",
              description: "Please ensure you're logged in to access this feature",
              variant: "destructive"
            });
          }
        } catch (error) {
          console.error("Session refresh error:", error);
        }
      }
      setLocalLoading(false);
    };

    checkAuth();
  }, [isAuthenticated, isLoading, refreshSession]);
  
  // Handle authentication checks
  useEffect(() => {
    if (!isLoading && !localLoading) {
      if (!isAuthenticated || !profile?.id) {
        console.warn('DoctorStampSignature: Authentication check failed');
        toast({
          title: "Authentication Required",
          description: "Please ensure you're logged in to access this feature",
          variant: "destructive"
        });
      } else {
        console.log('DoctorStampSignature: Authentication successful, profile ID:', profile.id);
      }
    }
  }, [isAuthenticated, profile, isLoading, localLoading]);
  
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
  if (!isAuthenticated || !profile?.id) {
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

  return (
    <div className="space-y-6">
      <CanvasSection
        title="Doctor Stamp"
        description="This stamp will appear on your prescriptions and official documents"
        imageUrl={stampUrl}
        type="stamp"
        userId={profile.id}
      />
      
      <CanvasSection
        title="Doctor Signature"
        description="This signature will appear on your prescriptions and official documents"
        imageUrl={signatureUrl}
        type="signature"
        userId={profile.id}
      />
    </div>
  );
};

export default DoctorStampSignature;
