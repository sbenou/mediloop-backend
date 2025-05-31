
export interface LuxTrustProfile {
  id: string;
  firstName: string;
  lastName: string;
  professionalId?: string;
  certificationLevel: 'basic' | 'professional' | 'advanced';
  isVerified: boolean;
}

export interface Certification {
  id: string;
  fileName: string;
  type: 'doctor' | 'pharmacist' | 'nurse' | 'other';
  status: 'pending' | 'verified' | 'rejected';
  uploadedAt: string;
  verifiedAt?: string;
}

export interface ProfessionalCertification {
  id: string;
  userId: string;
  certificationType: 'doctor' | 'pharmacist' | 'nurse' | 'other';
  documentUrl: string;
  verificationStatus: 'pending' | 'verified' | 'rejected';
  luxtrustVerificationId?: string;
  verifiedAt?: string;
  expiresAt?: string;
  createdAt: string;
  updatedAt: string;
}

export interface LuxTrustAuthResponse {
  success: boolean;
  profile?: LuxTrustProfile;
  signature?: string;
  timestamp: string;
  verificationId: string;
}

export interface LocationPreference {
  country: string;
  isLuxembourg: boolean;
  detectedFromAddress?: boolean;
}
