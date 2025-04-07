
export interface StaffMember {
  id: string;
  full_name: string;
  email: string;
  role: string;
  status: 'active' | 'inactive';
  avatar_url?: string;
}
