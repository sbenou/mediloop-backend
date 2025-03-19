
import React, { useEffect } from "react";
import CanvasSection from "./canvas/CanvasSection";
import { useAuth } from "@/hooks/auth/useAuth";
import { useRecoilState } from "recoil";
import { doctorStampUrlState, doctorSignatureUrlState } from "@/store/images/atoms";

interface DoctorStampSignatureProps {
  stampUrl: string | null;
  signatureUrl: string | null;
}

const DoctorStampSignature: React.FC<DoctorStampSignatureProps> = ({ 
  stampUrl: initialStampUrl,
  signatureUrl: initialSignatureUrl
}) => {
  const { profile, user } = useAuth();
  const [stampUrl, setStampUrl] = useRecoilState(doctorStampUrlState);
  const [signatureUrl, setSignatureUrl] = useRecoilState(doctorSignatureUrlState);
  
  // Initialize Recoil state from props on first render
  useEffect(() => {
    if (initialStampUrl && !stampUrl) {
      setStampUrl(initialStampUrl);
    }
    if (initialSignatureUrl && !signatureUrl) {
      setSignatureUrl(initialSignatureUrl);
    }
  }, [initialStampUrl, initialSignatureUrl]);
  
  // Initialize from profile if props don't have the data
  useEffect(() => {
    if (profile) {
      if (profile.doctor_stamp_url && !stampUrl) {
        setStampUrl(profile.doctor_stamp_url);
      }
      if (profile.doctor_signature_url && !signatureUrl) {
        setSignatureUrl(profile.doctor_signature_url);
      }
    }
  }, [profile]);

  return (
    <div className="space-y-8">
      <div>
        <p className="text-muted-foreground mb-4">
          Create your digital doctor stamp and signature to use on prescriptions and other medical documents.
        </p>
      </div>
      
      <CanvasSection
        title="Doctor Stamp"
        description="Create a professional stamp with your credentials"
        imageUrl={stampUrl}
        type="stamp"
        userId={user?.id || ""}
      />
      
      <CanvasSection
        title="Doctor Signature"
        description="Draw or upload your signature"
        imageUrl={signatureUrl}
        type="signature"
        userId={user?.id || ""}
      />
    </div>
  );
};

export default DoctorStampSignature;
