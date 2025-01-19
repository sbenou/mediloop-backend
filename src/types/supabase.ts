import { Database } from './database.types'

// Basic table and enum type exports
export type Tables<T extends keyof Database['public']['Tables']> = Database['public']['Tables'][T]['Row']
export type Enums<T extends keyof Database['public']['Enums']> = Database['public']['Enums'][T]

// Specific enum type exports
export type ConnectionStatus = Database['public']['Enums']['connection_status']
export type OrderStatus = Database['public']['Enums']['order_status']
export type PrescriptionStatus = Database['public']['Enums']['prescription_status']

// Specific table type exports
export type Address = Database['public']['Tables']['addresses']['Row']
export type Profile = Database['public']['Tables']['profiles']['Row']
export type Category = Database['public']['Tables']['categories']['Row']
export type DoctorPatientConnection = Database['public']['Tables']['doctor_patient_connections']['Row']
export type Order = Database['public']['Tables']['orders']['Row']
export type Pharmacy = Database['public']['Tables']['pharmacies']['Row']
export type Prescription = Database['public']['Tables']['prescriptions']['Row']
export type Product = Database['public']['Tables']['products']['Row']
export type Role = Database['public']['Tables']['roles']['Row']
export type RolePermission = Database['public']['Tables']['role_permissions']['Row']
export type Subcategory = Database['public']['Tables']['subcategories']['Row']
export type UserPharmacy = Database['public']['Tables']['user_pharmacies']['Row']