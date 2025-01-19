import { Database } from './database.types';
import { Tables } from './database.types';

// Re-export enum types
export type ConnectionStatus = Database['public']['Enums']['connection_status'];
export type OrderStatus = Database['public']['Enums']['order_status'];
export type PrescriptionStatus = Database['public']['Enums']['prescription_status'];

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