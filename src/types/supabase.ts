import { Database } from './database.types'

export type Tables<T extends keyof Database['public']['Tables']> = Database['public']['Tables'][T]['Row']
export type Enums<T extends keyof Database['public']['Enums']> = Database['public']['Enums'][T]
export type Functions<T extends keyof Database['public']['Functions']> = Database['public']['Functions'][T]

// Specific type exports
export type ConnectionStatus = Enums<'connection_status'>
export type OrderStatus = Enums<'order_status'>
export type PrescriptionStatus = Enums<'prescription_status'>

// Table types
export type Address = Tables<'addresses'>
export type Category = Tables<'categories'>
export type DoctorPatientConnection = Tables<'doctor_patient_connections'>

// Function argument types
export type CreateProfileArgs = Functions<'create_profile'>['Args']
export type HandleConnectionRequestArgs = Functions<'handle_connection_request'>['Args']
export type UpdateUserRoleAndPermissionsArgs = Functions<'update_user_role_and_permissions'>['Args']
export type UpsertPharmacyArgs = Functions<'upsert_pharmacy'>['Args']