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
          city: string
          country: string
          created_at: string
          id: string
          is_default: boolean | null
          postal_code: string
          street: string
          type: string
          updated_at: string
          user_id: string
        }
        Insert: {
          city: string
          country: string
          created_at?: string
          id?: string
          is_default?: boolean | null
          postal_code: string
          street: string
          type: string
          updated_at?: string
          user_id: string
        }
        Update: {
          city?: string
          country?: string
          created_at?: string
          id?: string
          is_default?: boolean | null
          postal_code?: string
          street?: string
          type?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      categories: {
        Row: {
          created_at: string
          id: string
          name: string
          type: string
        }
        Insert: {
          created_at?: string
          id?: string
          name: string
          type: string
        }
        Update: {
          created_at?: string
          id?: string
          name?: string
          type?: string
        }
        Relationships: []
      }
      doctor_patient_connections: {
        Row: {
          created_at: string
          deleted_at: string | null
          doctor_id: string
          id: string
          patient_id: string
          status: Database["public"]["Enums"]["connection_status"]
          updated_at: string
        }
        Insert: {
          created_at?: string
          deleted_at?: string | null
          doctor_id: string
          id?: string
          patient_id: string
          status?: Database["public"]["Enums"]["connection_status"]
          updated_at?: string
        }
        Update: {
          created_at?: string
          deleted_at?: string | null
          doctor_id?: string
          id?: string
          patient_id?: string
          status?: Database["public"]["Enums"]["connection_status"]
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
          },
        ]
      }
      next_of_kin: {
        Row: {
          city: string
          country: string
          created_at: string
          full_name: string
          id: string
          phone_number: string
          postal_code: string
          relation: string
          street: string
          updated_at: string
          user_id: string
        }
        Insert: {
          city: string
          country: string
          created_at?: string
          full_name: string
          id?: string
          phone_number: string
          postal_code: string
          relation: string
          street: string
          updated_at?: string
          user_id: string
        }
        Update: {
          city?: string
          country?: string
          created_at?: string
          full_name?: string
          id?: string
          phone_number?: string
          postal_code?: string
          relation?: string
          street?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      notifications: {
        Row: {
          created_at: string
          deleted_at: string | null
          id: string
          link: string | null
          message: string
          meta: Json | null
          read: boolean
          title: string
          type: string
          user_id: string
        }
        Insert: {
          created_at?: string
          deleted_at?: string | null
          id?: string
          link?: string | null
          message: string
          meta?: Json | null
          read?: boolean
          title: string
          type: string
          user_id: string
        }
        Update: {
          created_at?: string
          deleted_at?: string | null
          id?: string
          link?: string | null
          message?: string
          meta?: Json | null
          read?: boolean
          title?: string
          type?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "notifications_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      orders: {
        Row: {
          created_at: string
          id: string
          status: Database["public"]["Enums"]["order_status"]
          total: number
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          status?: Database["public"]["Enums"]["order_status"]
          total: number
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          status?: Database["public"]["Enums"]["order_status"]
          total?: number
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      permissions: {
        Row: {
          created_at: string | null
          description: string | null
          id: string
          name: string
        }
        Insert: {
          created_at?: string | null
          description?: string | null
          id: string
          name: string
        }
        Update: {
          created_at?: string | null
          description?: string | null
          id?: string
          name?: string
        }
        Relationships: []
      }
      pharmacies: {
        Row: {
          address: string
          city: string
          created_at: string
          endorsed: boolean
          hours: string | null
          id: string
          name: string
          phone: string | null
          postal_code: string
        }
        Insert: {
          address: string
          city: string
          created_at?: string
          endorsed?: boolean
          hours?: string | null
          id?: string
          name: string
          phone?: string | null
          postal_code: string
        }
        Update: {
          address?: string
          city?: string
          created_at?: string
          endorsed?: boolean
          hours?: string | null
          id?: string
          name?: string
          phone?: string | null
          postal_code?: string
        }
        Relationships: []
      }
      pharmacy_metadata: {
        Row: {
          created_at: string | null
          id: string
          logo_url: string | null
          pharmacy_id: string | null
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          logo_url?: string | null
          pharmacy_id?: string | null
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          id?: string
          logo_url?: string | null
          pharmacy_id?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "pharmacy_metadata_pharmacy_id_fkey"
            columns: ["pharmacy_id"]
            isOneToOne: false
            referencedRelation: "pharmacies"
            referencedColumns: ["id"]
          },
        ]
      }
      prescriptions: {
        Row: {
          created_at: string
          doctor_id: string
          dosage: string
          duration: string
          frequency: string
          id: string
          medication_name: string
          notes: string | null
          patient_id: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          doctor_id: string
          dosage: string
          duration: string
          frequency: string
          id?: string
          medication_name: string
          notes?: string | null
          patient_id: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          doctor_id?: string
          dosage?: string
          duration?: string
          frequency?: string
          id?: string
          medication_name?: string
          notes?: string | null
          patient_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "prescriptions_doctor_id_fkey"
            columns: ["doctor_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "prescriptions_patient_id_fkey"
            columns: ["patient_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      products: {
        Row: {
          category_id: string | null
          created_at: string
          description: string | null
          id: string
          image_url: string | null
          name: string
          pharmacy_id: string | null
          price: number
          requires_prescription: boolean | null
          subcategory_id: string | null
          type: string
        }
        Insert: {
          category_id?: string | null
          created_at?: string
          description?: string | null
          id?: string
          image_url?: string | null
          name: string
          pharmacy_id?: string | null
          price: number
          requires_prescription?: boolean | null
          subcategory_id?: string | null
          type: string
        }
        Update: {
          category_id?: string | null
          created_at?: string
          description?: string | null
          id?: string
          image_url?: string | null
          name?: string
          pharmacy_id?: string | null
          price?: number
          requires_prescription?: boolean | null
          subcategory_id?: string | null
          type?: string
        }
        Relationships: [
          {
            foreignKeyName: "products_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "categories"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "products_pharmacy_id_fkey"
            columns: ["pharmacy_id"]
            isOneToOne: false
            referencedRelation: "pharmacies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "products_subcategory_id_fkey"
            columns: ["subcategory_id"]
            isOneToOne: false
            referencedRelation: "subcategories"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          auth_method: string | null
          avatar_url: string | null
          city: string | null
          cns_card_back: string | null
          cns_card_front: string | null
          cns_number: string | null
          created_at: string | null
          date_of_birth: string | null
          deleted_at: string | null
          doctor_signature_url: string | null
          doctor_stamp_url: string | null
          email: string | null
          full_name: string | null
          id: string
          is_blocked: boolean | null
          license_number: string | null
          role: string
          role_id: string | null
          updated_at: string | null
        }
        Insert: {
          auth_method?: string | null
          avatar_url?: string | null
          city?: string | null
          cns_card_back?: string | null
          cns_card_front?: string | null
          cns_number?: string | null
          created_at?: string | null
          date_of_birth?: string | null
          deleted_at?: string | null
          doctor_signature_url?: string | null
          doctor_stamp_url?: string | null
          email?: string | null
          full_name?: string | null
          id: string
          is_blocked?: boolean | null
          license_number?: string | null
          role: string
          role_id?: string | null
          updated_at?: string | null
        }
        Update: {
          auth_method?: string | null
          avatar_url?: string | null
          city?: string | null
          cns_card_back?: string | null
          cns_card_front?: string | null
          cns_number?: string | null
          created_at?: string | null
          date_of_birth?: string | null
          deleted_at?: string | null
          doctor_signature_url?: string | null
          doctor_stamp_url?: string | null
          email?: string | null
          full_name?: string | null
          id?: string
          is_blocked?: boolean | null
          license_number?: string | null
          role?: string
          role_id?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "profiles_role_id_fkey"
            columns: ["role_id"]
            isOneToOne: false
            referencedRelation: "roles"
            referencedColumns: ["id"]
          },
        ]
      }
      role_permissions: {
        Row: {
          created_at: string
          id: string
          permission_id: string
          role_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          permission_id: string
          role_id: string
        }
        Update: {
          created_at?: string
          id?: string
          permission_id?: string
          role_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "role_permissions_permission_id_fkey"
            columns: ["permission_id"]
            isOneToOne: false
            referencedRelation: "permissions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "role_permissions_role_id_fkey"
            columns: ["role_id"]
            isOneToOne: false
            referencedRelation: "roles"
            referencedColumns: ["id"]
          },
        ]
      }
      roles: {
        Row: {
          created_at: string
          description: string | null
          id: string
          name: string
          requires_license: boolean
          updated_at: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          id?: string
          name: string
          requires_license?: boolean
          updated_at?: string
        }
        Update: {
          created_at?: string
          description?: string | null
          id?: string
          name?: string
          requires_license?: boolean
          updated_at?: string
        }
        Relationships: []
      }
      subcategories: {
        Row: {
          category_id: string | null
          created_at: string
          id: string
          name: string
        }
        Insert: {
          category_id?: string | null
          created_at?: string
          id?: string
          name: string
        }
        Update: {
          category_id?: string | null
          created_at?: string
          id?: string
          name?: string
        }
        Relationships: [
          {
            foreignKeyName: "subcategories_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "categories"
            referencedColumns: ["id"]
          },
        ]
      }
      teleconsultations: {
        Row: {
          created_at: string
          doctor_id: string
          end_time: string
          id: string
          patient_id: string
          reason: string | null
          room_id: string | null
          start_time: string
          status: Database["public"]["Enums"]["teleconsultation_status"]
          updated_at: string
        }
        Insert: {
          created_at?: string
          doctor_id: string
          end_time: string
          id?: string
          patient_id: string
          reason?: string | null
          room_id?: string | null
          start_time: string
          status?: Database["public"]["Enums"]["teleconsultation_status"]
          updated_at?: string
        }
        Update: {
          created_at?: string
          doctor_id?: string
          end_time?: string
          id?: string
          patient_id?: string
          reason?: string | null
          room_id?: string | null
          start_time?: string
          status?: Database["public"]["Enums"]["teleconsultation_status"]
          updated_at?: string
        }
        Relationships: []
      }
      user_permissions: {
        Row: {
          created_at: string | null
          id: string
          permission_id: string
          user_id: string | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          permission_id: string
          user_id?: string | null
        }
        Update: {
          created_at?: string | null
          id?: string
          permission_id?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "user_permissions_permission_id_fkey"
            columns: ["permission_id"]
            isOneToOne: false
            referencedRelation: "permissions"
            referencedColumns: ["id"]
          },
        ]
      }
      user_pharmacies: {
        Row: {
          created_at: string
          pharmacy_id: string | null
          user_id: string
        }
        Insert: {
          created_at?: string
          pharmacy_id?: string | null
          user_id: string
        }
        Update: {
          created_at?: string
          pharmacy_id?: string | null
          user_id?: string
        }
        Relationships: []
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
      create_profile_secure: {
        Args: {
          user_id: string
          user_role: string
          user_full_name: string
          user_email: string
          user_license_number: string
        }
        Returns: undefined
      }
      get_admin_dashboard_stats: {
        Args: Record<PropertyKey, never>
        Returns: {
          total_users: number
          total_roles: number
          total_permissions: number
          total_products: number
        }[]
      }
      handle_connection_request: {
        Args: {
          doctor_id: string
          status: Database["public"]["Enums"]["connection_status"]
        }
        Returns: Json
      }
      mark_all_notifications_read: {
        Args: Record<PropertyKey, never>
        Returns: undefined
      }
      mark_notification_read: {
        Args: {
          notification_id: string
        }
        Returns: undefined
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
      update_auth_method: {
        Args: {
          user_id: string
          method: string
        }
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
      order_status:
        | "pending"
        | "processing"
        | "shipped"
        | "delivered"
        | "cancelled"
      prescription_status: "draft" | "active" | "completed"
      teleconsultation_status:
        | "pending"
        | "confirmed"
        | "cancelled"
        | "completed"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type PublicSchema = Database[Extract<keyof Database, "public">]

export type Tables<
  PublicTableNameOrOptions extends
    | keyof (PublicSchema["Tables"] & PublicSchema["Views"])
    | { schema: keyof Database },
  TableName extends PublicTableNameOrOptions extends { schema: keyof Database }
    ? keyof (Database[PublicTableNameOrOptions["schema"]]["Tables"] &
        Database[PublicTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = PublicTableNameOrOptions extends { schema: keyof Database }
  ? (Database[PublicTableNameOrOptions["schema"]]["Tables"] &
      Database[PublicTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : PublicTableNameOrOptions extends keyof (PublicSchema["Tables"] &
        PublicSchema["Views"])
    ? (PublicSchema["Tables"] &
        PublicSchema["Views"])[PublicTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  PublicTableNameOrOptions extends
    | keyof PublicSchema["Tables"]
    | { schema: keyof Database },
  TableName extends PublicTableNameOrOptions extends { schema: keyof Database }
    ? keyof Database[PublicTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = PublicTableNameOrOptions extends { schema: keyof Database }
  ? Database[PublicTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : PublicTableNameOrOptions extends keyof PublicSchema["Tables"]
    ? PublicSchema["Tables"][PublicTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  PublicTableNameOrOptions extends
    | keyof PublicSchema["Tables"]
    | { schema: keyof Database },
  TableName extends PublicTableNameOrOptions extends { schema: keyof Database }
    ? keyof Database[PublicTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = PublicTableNameOrOptions extends { schema: keyof Database }
  ? Database[PublicTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : PublicTableNameOrOptions extends keyof PublicSchema["Tables"]
    ? PublicSchema["Tables"][PublicTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  PublicEnumNameOrOptions extends
    | keyof PublicSchema["Enums"]
    | { schema: keyof Database },
  EnumName extends PublicEnumNameOrOptions extends { schema: keyof Database }
    ? keyof Database[PublicEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = PublicEnumNameOrOptions extends { schema: keyof Database }
  ? Database[PublicEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : PublicEnumNameOrOptions extends keyof PublicSchema["Enums"]
    ? PublicSchema["Enums"][PublicEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof PublicSchema["CompositeTypes"]
    | { schema: keyof Database },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends { schema: keyof Database }
  ? Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof PublicSchema["CompositeTypes"]
    ? PublicSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never
