
export interface Country {
  code: string;
  name: string;
}

export interface LuxTrustProfile {
  id: string;
  firstName: string;
  lastName: string;
  professionalId: string;
  certificationLevel: string;
  isVerified: boolean;
}

export interface Certification {
  id: string;
  fileName: string;
  type: string;
  status: 'pending' | 'verified';
  uploadedAt: string;
  verifiedAt?: string;
}

export type IdVerificationStatus = 'unverified' | 'verifying' | 'verified' | 'failed';
