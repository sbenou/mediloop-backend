
import React, { useEffect } from "react";
import CanvasSection from "./canvas/CanvasSection";
import { useAuth } from "@/hooks/auth/useAuth";
import { useRecoilState } from "recoil";
import { 
  doctorStampUrlState, 
  doctorSignatureUrlState,
  pharmacistStampUrlState,
  pharmacistSignatureUrlState 
} from "@/store/images/atoms";
import { UserRole } from "@/types/role";

interface ProfessionalStampSignatureProps {
  userRole: UserRole.Doctor | UserRole.Pharmacist;
  stampUrl: string | null;
  signatureUrl: string | null;
}

const ProfessionalStampSignature: React.FC<ProfessionalStampSignatureProps> = ({ 
  userRole,
  stampUrl: initialStampUrl,
  signatureUrl: initialSignatureUrl
}) => {
  const { profile, user } = useAuth();
  
  // Define state atoms based on role
  const [stampUrl, setStampUrl] = useRecoilState(
    userRole === UserRole.Doctor ? doctorStampUrlState : pharmacistStampUrlState
  );
  const [signatureUrl, setSignatureUrl] = useRecoilState(
    userRole === UserRole.Doctor ? doctorSignatureUrlState : pharmacistSignatureUrlState
  );
  
  // Initialize Recoil state from props on first render
  useEffect(() => {
    if (initialStampUrl && !stampUrl) {
      setStampUrl(initialStampUrl);
    }
    if (initialSignatureUrl && !signatureUrl) {
      setSignatureUrl(initialSignatureUrl);
    }
  }, [initialStampUrl, initialSignatureUrl, setStampUrl, setSignatureUrl, stampUrl, signatureUrl]);
  
  // Initialize from profile if props don't have the data
  useEffect(() => {
    if (profile) {
      if (userRole === UserRole.Doctor) {
        if (profile.doctor_stamp_url && !stampUrl) {
          setStampUrl(profile.doctor_stamp_url);
        }
        if (profile.doctor_signature_url && !signatureUrl) {
          setSignatureUrl(profile.doctor_signature_url);
        }
      } else if (userRole === UserRole.Pharmacist) {
        if (profile.pharmacist_stamp_url && !stampUrl) {
          setStampUrl(profile.pharmacist_stamp_url);
        }
        if (profile.pharmacist_signature_url && !signatureUrl) {
          setSignatureUrl(profile.pharmacist_signature_url);
        }
      }
    }
  }, [profile, userRole, setStampUrl, setSignatureUrl, stampUrl, signatureUrl]);

  const rolePrefix = userRole === UserRole.Doctor ? "Doctor" : "Pharmacist";

  return (
    <div className="space-y-8">
      <div>
        <p className="text-muted-foreground mb-4">
          Create your digital {rolePrefix.toLowerCase()} stamp and signature to use on prescriptions and other {userRole === UserRole.Doctor ? "medical" : "pharmacy"} documents.
        </p>
      </div>
      
      <CanvasSection
        title={`${rolePrefix} Stamp`}
        description={`Create a professional stamp with your credentials`}
        imageUrl={stampUrl}
        type="stamp"
        userId={user?.id || ""}
      />
      
      <CanvasSection
        title={`${rolePrefix} Signature`}
        description={`Draw or upload your signature`}
        imageUrl={signatureUrl}
        type="signature"
        userId={user?.id || ""}
      />
    </div>
  );
};

export default ProfessionalStampSignature;
