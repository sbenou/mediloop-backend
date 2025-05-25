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
      activities: {
        Row: {
          created_at: string
          description: string
          id: string
          meta: Json | null
          read: boolean
          related_id: string | null
          related_type: string | null
          team_id: string | null
          tenant_id: string | null
          timestamp: string
          title: string
          type: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          description: string
          id?: string
          meta?: Json | null
          read?: boolean
          related_id?: string | null
          related_type?: string | null
          team_id?: string | null
          tenant_id?: string | null
          timestamp?: string
          title: string
          type: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          description?: string
          id?: string
          meta?: Json | null
          read?: boolean
          related_id?: string | null
          related_type?: string | null
          team_id?: string | null
          tenant_id?: string | null
          timestamp?: string
          title?: string
          type?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
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
      bank_holidays: {
        Row: {
          country: Database["public"]["Enums"]["supported_country"]
          created_at: string
          holiday_date: string
          holiday_name: string
          id: string
          updated_at: string
        }
        Insert: {
          country: Database["public"]["Enums"]["supported_country"]
          created_at?: string
          holiday_date: string
          holiday_name: string
          id?: string
          updated_at?: string
        }
        Update: {
          country?: Database["public"]["Enums"]["supported_country"]
          created_at?: string
          holiday_date?: string
          holiday_name?: string
          id?: string
          updated_at?: string
        }
        Relationships: []
      }
      boost_prices: {
        Row: {
          boost_type: string
          created_at: string | null
          duration: string
          id: string
          price: number
          updated_at: string | null
        }
        Insert: {
          boost_type: string
          created_at?: string | null
          duration: string
          id?: string
          price: number
          updated_at?: string | null
        }
        Update: {
          boost_type?: string
          created_at?: string | null
          duration?: string
          id?: string
          price?: number
          updated_at?: string | null
        }
        Relationships: []
      }
      boosts: {
        Row: {
          created_at: string
          expires_at: string
          id: string
          start_date: string
          type: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          expires_at: string
          id?: string
          start_date?: string
          type: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          expires_at?: string
          id?: string
          start_date?: string
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
      doctor_availability: {
        Row: {
          additional_time_slots: Json | null
          appointment_type: string | null
          created_at: string
          day_of_week: number
          doctor_id: string
          end_time: string | null
          id: string
          is_available: boolean | null
          start_time: string | null
          updated_at: string
          workplace_id: string | null
        }
        Insert: {
          additional_time_slots?: Json | null
          appointment_type?: string | null
          created_at?: string
          day_of_week: number
          doctor_id: string
          end_time?: string | null
          id?: string
          is_available?: boolean | null
          start_time?: string | null
          updated_at?: string
          workplace_id?: string | null
        }
        Update: {
          additional_time_slots?: Json | null
          appointment_type?: string | null
          created_at?: string
          day_of_week?: number
          doctor_id?: string
          end_time?: string | null
          id?: string
          is_available?: boolean | null
          start_time?: string | null
          updated_at?: string
          workplace_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "doctor_availability_workplace_id_fkey"
            columns: ["workplace_id"]
            isOneToOne: false
            referencedRelation: "workplaces"
            referencedColumns: ["id"]
          },
        ]
      }
      doctor_metadata: {
        Row: {
          address: string | null
          city: string | null
          created_at: string | null
          doctor_id: string | null
          hours: string | null
          id: string
          logo_url: string | null
          postal_code: string | null
          updated_at: string | null
        }
        Insert: {
          address?: string | null
          city?: string | null
          created_at?: string | null
          doctor_id?: string | null
          hours?: string | null
          id?: string
          logo_url?: string | null
          postal_code?: string | null
          updated_at?: string | null
        }
        Update: {
          address?: string | null
          city?: string | null
          created_at?: string | null
          doctor_id?: string | null
          hours?: string | null
          id?: string
          logo_url?: string | null
          postal_code?: string | null
          updated_at?: string | null
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
      doctor_workplaces: {
        Row: {
          created_at: string
          id: string | null
          is_primary: boolean
          user_id: string
          workplace_id: string | null
        }
        Insert: {
          created_at?: string
          id?: string | null
          is_primary?: boolean
          user_id: string
          workplace_id?: string | null
        }
        Update: {
          created_at?: string
          id?: string | null
          is_primary?: boolean
          user_id?: string
          workplace_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "doctor_workplaces_workplace_id_fkey"
            columns: ["workplace_id"]
            isOneToOne: false
            referencedRelation: "workplaces"
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
          tenant_id: string | null
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
          tenant_id?: string | null
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
          tenant_id?: string | null
          title?: string
          type?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "notifications_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
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
      pharmacy_team_members: {
        Row: {
          created_at: string
          deleted_at: string | null
          id: string
          pharmacy_id: string | null
          role: string
          user_id: string | null
        }
        Insert: {
          created_at?: string
          deleted_at?: string | null
          id?: string
          pharmacy_id?: string | null
          role?: string
          user_id?: string | null
        }
        Update: {
          created_at?: string
          deleted_at?: string | null
          id?: string
          pharmacy_id?: string | null
          role?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "pharmacy_team_members_pharmacy_id_fkey"
            columns: ["pharmacy_id"]
            isOneToOne: false
            referencedRelation: "pharmacies"
            referencedColumns: ["id"]
          },
        ]
      }
      point_transactions: {
        Row: {
          amount: number
          created_at: string
          description: string | null
          id: string
          reference_id: string | null
          reference_type: string | null
          transaction_type: string
          user_id: string
        }
        Insert: {
          amount: number
          created_at?: string
          description?: string | null
          id?: string
          reference_id?: string | null
          reference_type?: string | null
          transaction_type: string
          user_id: string
        }
        Update: {
          amount?: number
          created_at?: string
          description?: string | null
          id?: string
          reference_id?: string | null
          reference_type?: string | null
          transaction_type?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "point_transactions_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
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
          doctor_id: string | null
          doctor_signature_url: string | null
          doctor_stamp_url: string | null
          email: string | null
          full_name: string | null
          id: string
          is_blocked: boolean | null
          license_number: string | null
          pharmacist_signature_url: string | null
          pharmacist_stamp_url: string | null
          pharmacy_logo_url: string | null
          pharmacy_name: string | null
          role: string
          role_id: string | null
          tenant_id: string | null
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
          doctor_id?: string | null
          doctor_signature_url?: string | null
          doctor_stamp_url?: string | null
          email?: string | null
          full_name?: string | null
          id: string
          is_blocked?: boolean | null
          license_number?: string | null
          pharmacist_signature_url?: string | null
          pharmacist_stamp_url?: string | null
          pharmacy_logo_url?: string | null
          pharmacy_name?: string | null
          role: string
          role_id?: string | null
          tenant_id?: string | null
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
          doctor_id?: string | null
          doctor_signature_url?: string | null
          doctor_stamp_url?: string | null
          email?: string | null
          full_name?: string | null
          id?: string
          is_blocked?: boolean | null
          license_number?: string | null
          pharmacist_signature_url?: string | null
          pharmacist_stamp_url?: string | null
          pharmacy_logo_url?: string | null
          pharmacy_name?: string | null
          role?: string
          role_id?: string | null
          tenant_id?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "profiles_doctor_id_fkey"
            columns: ["doctor_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "profiles_role_id_fkey"
            columns: ["role_id"]
            isOneToOne: false
            referencedRelation: "roles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "profiles_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      referrals: {
        Row: {
          converted_at: string | null
          created_at: string
          id: string
          notes: string | null
          points_awarded: number | null
          referral_code: string
          referral_email: string
          referral_points_received: number | null
          referrer_id: string
          status: string
          subscription_purchased_at: string | null
        }
        Insert: {
          converted_at?: string | null
          created_at?: string
          id?: string
          notes?: string | null
          points_awarded?: number | null
          referral_code: string
          referral_email: string
          referral_points_received?: number | null
          referrer_id: string
          status?: string
          subscription_purchased_at?: string | null
        }
        Update: {
          converted_at?: string | null
          created_at?: string
          id?: string
          notes?: string | null
          points_awarded?: number | null
          referral_code?: string
          referral_email?: string
          referral_points_received?: number | null
          referrer_id?: string
          status?: string
          subscription_purchased_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "referrals_referrer_id_fkey"
            columns: ["referrer_id"]
            isOneToOne: false
            referencedRelation: "profiles"
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
      tenants: {
        Row: {
          created_at: string
          domain: string
          id: string
          is_active: boolean
          name: string
          schema: string
          status: Database["public"]["Enums"]["tenant_status"]
          updated_at: string
        }
        Insert: {
          created_at?: string
          domain: string
          id?: string
          is_active?: boolean
          name: string
          schema: string
          status?: Database["public"]["Enums"]["tenant_status"]
          updated_at?: string
        }
        Update: {
          created_at?: string
          domain?: string
          id?: string
          is_active?: boolean
          name?: string
          schema?: string
          status?: Database["public"]["Enums"]["tenant_status"]
          updated_at?: string
        }
        Relationships: []
      }
      user_notification_tokens: {
        Row: {
          created_at: string | null
          id: string
          platform: string
          token: string
          updated_at: string | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          platform?: string
          token: string
          updated_at?: string | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          platform?: string
          token?: string
          updated_at?: string | null
          user_id?: string
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
      user_points: {
        Row: {
          created_at: string
          id: string
          level: string
          points: number
          registered_at: string
          total_points_earned: number
          total_points_spent: number
          updated_at: string
          user_id: string
          wallet_balance: number
        }
        Insert: {
          created_at?: string
          id?: string
          level?: string
          points?: number
          registered_at?: string
          total_points_earned?: number
          total_points_spent?: number
          updated_at?: string
          user_id: string
          wallet_balance?: number
        }
        Update: {
          created_at?: string
          id?: string
          level?: string
          points?: number
          registered_at?: string
          total_points_earned?: number
          total_points_spent?: number
          updated_at?: string
          user_id?: string
          wallet_balance?: number
        }
        Relationships: [
          {
            foreignKeyName: "user_points_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      user_wearables: {
        Row: {
          access_token: string | null
          battery_level: number | null
          connection_status: string
          created_at: string
          device_id: string
          device_name: string
          device_type: Database["public"]["Enums"]["wearable_device_type"]
          id: string
          last_synced: string | null
          meta: Json | null
          refresh_token: string | null
          token_expires_at: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          access_token?: string | null
          battery_level?: number | null
          connection_status?: string
          created_at?: string
          device_id: string
          device_name: string
          device_type: Database["public"]["Enums"]["wearable_device_type"]
          id?: string
          last_synced?: string | null
          meta?: Json | null
          refresh_token?: string | null
          token_expires_at?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          access_token?: string | null
          battery_level?: number | null
          connection_status?: string
          created_at?: string
          device_id?: string
          device_name?: string
          device_type?: Database["public"]["Enums"]["wearable_device_type"]
          id?: string
          last_synced?: string | null
          meta?: Json | null
          refresh_token?: string | null
          token_expires_at?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      workplaces: {
        Row: {
          address: string
          city: string
          created_at: string
          description: string | null
          hours: string | null
          id: string
          name: string
          phone: string | null
          postal_code: string
          updated_at: string
          workplace_type: Database["public"]["Enums"]["workplace_type"]
        }
        Insert: {
          address: string
          city: string
          created_at?: string
          description?: string | null
          hours?: string | null
          id?: string
          name: string
          phone?: string | null
          postal_code: string
          updated_at?: string
          workplace_type?: Database["public"]["Enums"]["workplace_type"]
        }
        Update: {
          address?: string
          city?: string
          created_at?: string
          description?: string | null
          hours?: string | null
          id?: string
          name?: string
          phone?: string | null
          postal_code?: string
          updated_at?: string
          workplace_type?: Database["public"]["Enums"]["workplace_type"]
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      add_user_points: {
        Args: {
          p_user_id: string
          p_points: number
          p_transaction_type: string
          p_description?: string
          p_reference_id?: string
          p_reference_type?: string
        }
        Returns: boolean
      }
      add_user_to_tenant: {
        Args: { p_user_id: string; p_tenant_id: string; p_role?: string }
        Returns: boolean
      }
      belongs_to_tenant: {
        Args: { tenant_id: string }
        Returns: boolean
      }
      can_truncate_products: {
        Args: Record<PropertyKey, never>
        Returns: boolean
      }
      column_exists: {
        Args: { p_table_name: string; p_column_name: string }
        Returns: boolean
      }
      create_activity: {
        Args: {
          p_user_id: string
          p_type: string
          p_title: string
          p_description: string
          p_related_id?: string
          p_related_type?: string
          p_meta?: Json
          p_tenant_id?: string
          p_team_id?: string
        }
        Returns: string
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
      create_system_activity: {
        Args: {
          p_type: string
          p_title: string
          p_description: string
          p_related_id?: string
          p_related_type?: string
          p_meta?: Json
        }
        Returns: string
      }
      create_tenant_schema: {
        Args: { tenant_name: string; tenant_domain: string }
        Returns: string
      }
      create_user_tenant: {
        Args: {
          p_user_id: string
          p_user_role: string
          p_user_name: string
          p_workplace_name?: string
          p_pharmacy_name?: string
        }
        Returns: string
      }
      extend_boost: {
        Args: { p_boost_id: string; p_duration: string; p_price: number }
        Returns: boolean
      }
      get_active_boost: {
        Args: { p_user_id: string }
        Returns: Json
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
      get_current_tenant: {
        Args: Record<PropertyKey, never>
        Returns: string
      }
      get_doctor_workplace: {
        Args: { p_user_id: string }
        Returns: string
      }
      get_record_by_id: {
        Args: { p_table_name: string; p_record_id: string }
        Returns: Json
      }
      get_tenant_id: {
        Args: Record<PropertyKey, never>
        Returns: string
      }
      get_user_loyalty_status: {
        Args: { p_user_id: string }
        Returns: Json
      }
      handle_connection_request: {
        Args: {
          doctor_id: string
          status: Database["public"]["Enums"]["connection_status"]
        }
        Returns: Json
      }
      is_pharmacist: {
        Args: Record<PropertyKey, never>
        Returns: boolean
      }
      is_user_pharmacist: {
        Args: Record<PropertyKey, never>
        Returns: boolean
      }
      mark_activity_read: {
        Args: { activity_id: string }
        Returns: undefined
      }
      mark_all_activities_read: {
        Args: Record<PropertyKey, never>
        Returns: undefined
      }
      mark_all_notifications_read: {
        Args: Record<PropertyKey, never>
        Returns: undefined
      }
      mark_notification_read: {
        Args: { notification_id: string }
        Returns: undefined
      }
      process_referral_conversion: {
        Args: {
          p_referral_email: string
          p_referred_user_id: string
          p_subscription_purchased?: boolean
        }
        Returns: boolean
      }
      set_tenant_search_path: {
        Args: { tenant_schema: string }
        Returns: undefined
      }
      soft_delete_team_member: {
        Args: { member_id: string }
        Returns: undefined
      }
      soft_delete_user: {
        Args: { user_id: string }
        Returns: undefined
      }
      toggle_user_block: {
        Args: { user_id: string }
        Returns: undefined
      }
      truncate_products: {
        Args: Record<PropertyKey, never>
        Returns: undefined
      }
      update_auth_method: {
        Args: { user_id: string; method: string }
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
      update_user_tenant_name: {
        Args: {
          p_user_id: string
          p_workplace_name?: string
          p_pharmacy_name?: string
        }
        Returns: boolean
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
      supported_country: "Luxembourg" | "France"
      teleconsultation_status:
        | "pending"
        | "confirmed"
        | "cancelled"
        | "completed"
      tenant_status: "active" | "inactive" | "pending"
      wearable_device_type:
        | "apple_watch"
        | "fitbit"
        | "oura_ring"
        | "samsung_galaxy_watch"
        | "garmin"
        | "whoop"
      workplace_type: "cabinet" | "clinic" | "hospital" | "pharmacy" | "other"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DefaultSchema = Database[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof (Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        Database[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? (Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      Database[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof Database },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof Database },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends { schema: keyof Database }
  ? Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      connection_status: ["pending", "accepted", "rejected"],
      order_status: [
        "pending",
        "processing",
        "shipped",
        "delivered",
        "cancelled",
      ],
      prescription_status: ["draft", "active", "completed"],
      supported_country: ["Luxembourg", "France"],
      teleconsultation_status: [
        "pending",
        "confirmed",
        "cancelled",
        "completed",
      ],
      tenant_status: ["active", "inactive", "pending"],
      wearable_device_type: [
        "apple_watch",
        "fitbit",
        "oura_ring",
        "samsung_galaxy_watch",
        "garmin",
        "whoop",
      ],
      workplace_type: ["cabinet", "clinic", "hospital", "pharmacy", "other"],
    },
  },
} as const
