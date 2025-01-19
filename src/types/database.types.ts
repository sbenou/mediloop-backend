export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Database {
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
      categories: {
        Row: {
          id: string
          name: string
          type: string
          created_at: string
        }
        Insert: {
          id?: string
          name: string
          type: string
          created_at?: string
        }
        Update: {
          id?: string
          name?: string
          type?: string
          created_at?: string
        }
      }
      doctor_patient_connections: {
        Row: {
          id: string
          doctor_id: string
          patient_id: string
          status: Database["public"]["Enums"]["connection_status"]
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          doctor_id: string
          patient_id: string
          status?: Database["public"]["Enums"]["connection_status"]
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          doctor_id?: string
          patient_id?: string
          status?: Database["public"]["Enums"]["connection_status"]
          created_at?: string
          updated_at?: string
        }
      }
      orders: {
        Row: {
          id: string
          user_id: string
          status: Database["public"]["Enums"]["order_status"]
          total: number
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          status?: Database["public"]["Enums"]["order_status"]
          total: number
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          status?: Database["public"]["Enums"]["order_status"]
          total?: number
          created_at?: string
          updated_at?: string
        }
      }
      pharmacies: {
        Row: {
          id: string
          name: string
          address: string
          city: string
          postal_code: string
          phone: string | null
          hours: string | null
          created_at: string
        }
        Insert: {
          id?: string
          name: string
          address: string
          city: string
          postal_code: string
          phone?: string | null
          hours?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          name?: string
          address?: string
          city?: string
          postal_code?: string
          phone?: string | null
          hours?: string | null
          created_at?: string
        }
      }
      prescriptions: {
        Row: {
          id: string
          doctor_id: string
          patient_id: string
          medication_name: string
          dosage: string
          frequency: string
          duration: string
          notes: string | null
          status: Database["public"]["Enums"]["prescription_status"] | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          doctor_id: string
          patient_id: string
          medication_name: string
          dosage: string
          frequency: string
          duration: string
          notes?: string | null
          status?: Database["public"]["Enums"]["prescription_status"] | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          doctor_id?: string
          patient_id?: string
          medication_name?: string
          dosage?: string
          frequency?: string
          duration?: string
          notes?: string | null
          status?: Database["public"]["Enums"]["prescription_status"] | null
          created_at?: string
          updated_at?: string
        }
      }
      products: {
        Row: {
          id: string
          name: string
          description: string | null
          price: number
          type: string | null
          requires_prescription: boolean | null
          pharmacy_id: string | null
          category_id: string | null
          subcategory_id: string | null
          image_url: string | null
          created_at: string
        }
        Insert: {
          id?: string
          name: string
          description?: string | null
          price: number
          type?: string | null
          requires_prescription?: boolean | null
          pharmacy_id?: string | null
          category_id?: string | null
          subcategory_id?: string | null
          image_url?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          name?: string
          description?: string | null
          price?: number
          type?: string | null
          requires_prescription?: boolean | null
          pharmacy_id?: string | null
          category_id?: string | null
          subcategory_id?: string | null
          image_url?: string | null
          created_at?: string
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
      role_permissions: {
        Row: {
          role_id: string
          permission_id: string
          created_at: string
        }
        Insert: {
          role_id: string
          permission_id: string
          created_at?: string
        }
        Update: {
          role_id?: string
          permission_id?: string
          created_at?: string
        }
      }
      roles: {
        Row: {
          id: string
          name: string
          description: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          name: string
          description?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          name?: string
          description?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      subcategories: {
        Row: {
          id: string
          name: string
          category_id: string | null
          created_at: string
        }
        Insert: {
          id?: string
          name: string
          category_id?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          name?: string
          category_id?: string | null
          created_at?: string
        }
      }
      user_pharmacies: {
        Row: {
          user_id: string
          pharmacy_id: string | null
          created_at: string
        }
        Insert: {
          user_id: string
          pharmacy_id?: string | null
          created_at?: string
        }
        Update: {
          user_id?: string
          pharmacy_id?: string | null
          created_at?: string
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