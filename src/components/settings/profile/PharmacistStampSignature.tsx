
import React, { useEffect } from "react";
import CanvasSection from "./canvas/CanvasSection";
import { useAuth } from "@/hooks/auth/useAuth";
import { useRecoilState } from "recoil";
import { pharmacistStampUrlState, pharmacistSignatureUrlState } from "@/store/images/atoms";

interface PharmacistStampSignatureProps {
  stampUrl: string | null;
  signatureUrl: string | null;
}

const PharmacistStampSignature: React.FC<PharmacistStampSignatureProps> = ({ 
  stampUrl: initialStampUrl,
  signatureUrl: initialSignatureUrl
}) => {
  const { profile, user } = useAuth();
  const [stampUrl, setStampUrl] = useRecoilState(pharmacistStampUrlState);
  const [signatureUrl, setSignatureUrl] = useRecoilState(pharmacistSignatureUrlState);
  
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
      if (profile.pharmacist_stamp_url && !stampUrl) {
        setStampUrl(profile.pharmacist_stamp_url);
      }
      if (profile.pharmacist_signature_url && !signatureUrl) {
        setSignatureUrl(profile.pharmacist_signature_url);
      }
    }
  }, [profile]);

  return (
    <div className="space-y-8">
      <div>
        <p className="text-muted-foreground mb-4">
          Create your digital pharmacist stamp and signature to use on prescriptions and other pharmacy documents.
        </p>
      </div>
      
      <CanvasSection
        title="Pharmacist Stamp"
        description="Create a professional stamp with your credentials"
        imageUrl={stampUrl}
        type="stamp"
        userId={user?.id || ""}
      />
      
      <CanvasSection
        title="Pharmacist Signature"
        description="Draw or upload your signature"
        imageUrl={signatureUrl}
        type="signature"
        userId={user?.id || ""}
      />
    </div>
  );
};

export default PharmacistStampSignature;
