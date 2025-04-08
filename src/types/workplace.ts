
export interface Workplace {
  id: string;
  name: string;
  address: string;
  city: string;
  postal_code: string;
  phone: string | null;
  hours: string | null;
  created_at: string;
  updated_at: string;
  workplace_type: WorkplaceType;
  description: string | null;
}

export type WorkplaceType = 'cabinet' | 'clinic' | 'hospital' | 'pharmacy' | 'other';

export interface DoctorWorkplace {
  user_id: string;
  workplace_id: string;
  is_primary?: boolean;
  created_at: string;
}

export interface WorkplaceSelectionOptions {
  usesMultipleWorkplaces: boolean;
  primaryWorkplaceId: string | null;
  additionalWorkplaceIds?: string[];
}
