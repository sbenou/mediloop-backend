
import React from 'react';
import { useAuth } from "@/hooks/auth/useAuth";
import CanvasSection from './canvas/CanvasSection';

interface DoctorStampSignatureProps {
  stampUrl: string | null;
  signatureUrl: string | null;
}

const DoctorStampSignature: React.FC<DoctorStampSignatureProps> = ({ stampUrl, signatureUrl }) => {
  const { profile } = useAuth();
  
  if (!profile?.id) {
    return <div>Loading profile information...</div>;
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
