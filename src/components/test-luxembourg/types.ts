
export interface Country {
  code: string;
  name: string;
}

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

export type IdVerificationStatus = 'unverified' | 'verifying' | 'verified' | 'failed';
