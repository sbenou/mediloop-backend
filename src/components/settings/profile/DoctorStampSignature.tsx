
import React, { useEffect } from 'react';
import { useAuth } from "@/hooks/auth/useAuth";
import CanvasSection from './canvas/CanvasSection';
import { toast } from "@/components/ui/use-toast";

interface DoctorStampSignatureProps {
  stampUrl: string | null;
  signatureUrl: string | null;
}

const DoctorStampSignature: React.FC<DoctorStampSignatureProps> = ({ stampUrl, signatureUrl }) => {
  const { profile, isAuthenticated } = useAuth();
  
  useEffect(() => {
    // Add resilience check to ensure we have authentication
    if (!isAuthenticated || !profile?.id) {
      console.warn('DoctorStampSignature: Authentication check failed');
      toast({
        title: "Authentication Required",
        description: "Please ensure you're logged in to access this feature",
        variant: "destructive"
      });
    }
  }, [isAuthenticated, profile]);
  
  // Fallback if no profile is available
  if (!profile?.id) {
    return (
      <div className="p-4 border rounded-md bg-muted">
        <p className="text-center text-muted-foreground">
          Loading profile information...
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
