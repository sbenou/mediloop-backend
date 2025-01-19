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
        Relationships: [
          {
            foreignKeyName: "addresses_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          }
        ]
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
        Relationships: []
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
        Relationships: [
          {
            foreignKeyName: "doctor_patient_connections_doctor_id_fkey"
            columns: ["doctor_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "doctor_patient_connections_patient_id_fkey"
            columns: ["patient_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          }
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      can_truncate_products: {
        Args: Record<PropertyKey, never>
        Returns: boolean
      }
      create_profile: {
        Args: {
          user_id: string
          user_role: string
          user_full_name: string
          user_email: string
          user_license_number: string
        }
        Returns: undefined
      }
      handle_connection_request: {
        Args: {
          doctor_id: string
          status: Database["public"]["Enums"]["connection_status"]
        }
        Returns: Json
      }
      soft_delete_user: {
        Args: {
          user_id: string
        }
        Returns: undefined
      }
      toggle_user_block: {
        Args: {
          user_id: string
        }
        Returns: undefined
      }
      truncate_products: {
        Args: Record<PropertyKey, never>
        Returns: undefined
      }
      update_user_role_and_permissions: {
        Args: {
          p_user_id: string
          p_new_role: string
          p_new_permissions: string[]
        }
        Returns: undefined
      }
      upsert_pharmacy: {
        Args: {
          p_name: string
          p_address: string
          p_city: string
          p_postal_code: string
          p_phone: string
          p_hours: string
        }
        Returns: undefined
      }
    }
    Enums: {
      connection_status: "pending" | "accepted" | "rejected"
      order_status: "pending" | "processing" | "shipped" | "delivered" | "cancelled" | "completed"
      prescription_status: "draft" | "active" | "completed" | "cancelled"
    }
  }
}