export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  public: {
    Tables: {
      addresses: {
        Row: {
          id: string
          user_id: string
          street: string
          city: string
          postal_code: string
          country: string
          type: string
          is_default: boolean | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          street: string
          city: string
          postal_code: string
          country: string
          type: string
          is_default?: boolean | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          street?: string
          city?: string
          postal_code?: string
          country?: string
          type?: string
          is_default?: boolean | null
          created_at?: string
          updated_at?: string
        }
      }
      profiles: {
        Row: {
          id: string
          role: string
          full_name: string | null
          email: string | null
          license_number: string | null
          created_at: string | null
          updated_at: string | null
          city: string | null
          role_id: string | null
          is_blocked: boolean | null
          deleted_at: string | null
          cns_card_front: string | null
          cns_card_back: string | null
          cns_number: string | null
          date_of_birth: string | null
          avatar_url: string | null
          doctor_stamp_url: string | null
          doctor_signature_url: string | null
        }
        Insert: {
          id: string
          role: string
          full_name?: string | null
          email?: string | null
          license_number?: string | null
          created_at?: string | null
          updated_at?: string | null
          city?: string | null
          role_id?: string | null
          is_blocked?: boolean | null
          deleted_at?: string | null
          cns_card_front?: string | null
          cns_card_back?: string | null
          cns_number?: string | null
          date_of_birth?: string | null
          avatar_url?: string | null
          doctor_stamp_url?: string | null
          doctor_signature_url?: string | null
        }
        Update: {
          id?: string
          role?: string
          full_name?: string | null
          email?: string | null
          license_number?: string | null
          created_at?: string | null
          updated_at?: string | null
          city?: string | null
          role_id?: string | null
          is_blocked?: boolean | null
          deleted_at?: string | null
          cns_card_front?: string | null
          cns_card_back?: string | null
          cns_number?: string | null
          date_of_birth?: string | null
          avatar_url?: string | null
          doctor_stamp_url?: string | null
          doctor_signature_url?: string | null
        }
      }
    }
    Enums: {
      connection_status: "pending" | "accepted" | "rejected"
      order_status: "pending" | "processing" | "shipped" | "delivered" | "cancelled"
      prescription_status: "draft" | "active" | "completed" | "cancelled"
    }
  }
}

export type Tables<T extends keyof Database['public']['Tables']> = Database['public']['Tables'][T]['Row']
export type Enums<T extends keyof Database['public']['Enums']> = Database['public']['Enums'][T]