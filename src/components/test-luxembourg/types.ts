
import type { LuxTrustProfile, Certification } from '@/types/luxembourg';

export interface Country {
  code: string;
  name: string;
}

export type IdVerificationStatus = 'unverified' | 'verifying' | 'verified' | 'failed';

export interface TestContainerProps {
  // Location Detection
  currentCountry: string;
  isLuxembourg: boolean;
  countries: Country[];
  onCountryChange: (countryCode: string) => void;
  
  // LuxTrust Auth
  isAuthenticating: boolean;
  isAuthenticated: boolean;
  luxtrustProfile: LuxTrustProfile | null;
  onAuthenticate: () => void;
  
  // Professional Certification
  certifications: Certification[];
  selectedFile: File | null;
  isUploading: boolean;
  onFileSelect: (file: File | null) => void;
  onUpload: () => void;
  onVerify: (certId: string) => void;
  
  // LuxTrust ID Field
  luxtrustId: string;
  isIdVisible: boolean;
  idVerificationStatus: IdVerificationStatus;
  isVerifying: boolean;
  onIdChange: (id: string) => void;
  onToggleVisibility: () => void;
  onVerifyId: () => void;
  onResetVerification: () => void;
  onFillTestId: () => void;
}

export { LuxTrustProfile, Certification };
