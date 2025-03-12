
export interface TeamMember {
  id: string;
  user_id: string;
  full_name: string;
  email: string;
  avatar_url: string | null;
  role: string;
  is_active: boolean;
}

export interface PharmacyTeamMemberDB {
  id: string;
  user_id: string;
  pharmacy_id: string;
  role: string;
  created_at: string;
  deleted_at: string | null;
}

export interface AddressSuggestion {
  street: string;
  city: string;
  postal_code: string;
  country: string;
  formatted: string;
}

export interface FormData {
  full_name: string;
  email: string;
  password: string;
  role: string;
  street: string;
  city: string;
  postal_code: string;
  country: string;
  next_of_kin_name: string;
  next_of_kin_phone: string;
  next_of_kin_relation: string;
  next_of_kin_street: string;
  next_of_kin_city: string;
  next_of_kin_postal_code: string;
  next_of_kin_country: string;
}
