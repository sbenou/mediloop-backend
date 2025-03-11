
import { Database } from './database.types';
import { Tables } from './database.types';

// Re-export enum types
export type ConnectionStatus = Database['public']['Enums']['connection_status'];
export type OrderStatus = Database['public']['Enums']['order_status'];
export type PrescriptionStatus = Database['public']['Enums']['prescription_status'];
export type TeleconsultationStatus = Database['public']['Enums']['teleconsultation_status'];

// Specific table type exports using the Tables helper type
export type Address = Tables<'addresses'>
export type Profile = Tables<'profiles'>
export type Category = Tables<'categories'>
export type DoctorPatientConnection = Tables<'doctor_patient_connections'>
export type Order = Tables<'orders'>
export type Pharmacy = Tables<'pharmacies'>
export type Prescription = Tables<'prescriptions'>
export type Product = Tables<'products'>
export type Role = Tables<'roles'>
export type RolePermission = Tables<'role_permissions'>
export type Subcategory = Tables<'subcategories'>
export type UserPharmacy = Tables<'user_pharmacies'>
export type Notification = Tables<'notifications'>
export type Teleconsultation = Tables<'teleconsultations'>

// Update the PharmacyTeamMember type to match the database schema
export type PharmacyTeamMember = {
  id: string;
  user_id: string;
  pharmacy_id: string;
  role: string;
  created_at: string;
  deleted_at: string | null;
};

// Define a custom type for doctor workplace since it's not in the generated types yet
export interface DoctorWorkplace {
  user_id: string;
  workplace_id: string;
  created_at: string;
}

// Define a complete user profile type for avatar and other components
export interface UserProfile {
  id: string;
  avatar_url: string | null;
  full_name: string | null;
  role: string | null;
  role_id: string | null;
  email: string | null;
  date_of_birth: string | null;
  city: string | null;
  auth_method: string | null;
  is_blocked: boolean | null;
  doctor_stamp_url: string | null;
  doctor_signature_url: string | null;
  cns_card_front: string | null;
  cns_card_back: string | null;
  cns_number: string | null;
  deleted_at: string | null;
  created_at: string | null;
  updated_at: string | null;
  license_number: string | null;
}

// Define a custom extended type for pharmacy team members with profile information
export interface PharmacyTeamMemberWithProfile extends PharmacyTeamMember {
  full_name?: string;
  email?: string;
  avatar_url?: string | null;
  is_active?: boolean;
  phone_number?: string;
}
