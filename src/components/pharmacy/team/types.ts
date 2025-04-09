
export type TeamMemberStatus = 'active' | 'inactive' | 'pending';

export interface TeamMember {
  id: string;
  full_name: string;
  email: string;
  phone_number?: string;
  role: string;
  pharmacy_id?: string;
  doctor_id?: string; // Add doctor_id property
  status: TeamMemberStatus;
  profile_image?: string;
  isAvailable?: boolean;
}

export interface TeamMemberUpdateData {
  full_name?: string;
  email?: string;
  phone_number?: string;
  role?: string;
  status?: TeamMemberStatus;
}

export interface InviteTeamMemberData {
  email: string;
  role: string;
  pharmacy_id: string;
}
