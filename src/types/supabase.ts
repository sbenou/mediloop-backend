import { Database } from './database.types'

// Basic table and enum type exports
export type Tables<T extends keyof Database['public']['Tables']> = Database['public']['Tables'][T]['Row']
export type Enums<T extends keyof Database['public']['Enums']> = Database['public']['Enums'][T]

// Specific enum type exports
export type ConnectionStatus = Database['public']['Enums']['connection_status']
export type OrderStatus = Database['public']['Enums']['order_status']
export type PrescriptionStatus = Database['public']['Enums']['prescription_status']

// Specific table type exports
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