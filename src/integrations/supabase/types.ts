export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.15"
  }
  public: {
    Tables: {
      profiles: {
        Row: {
          avatar_path: string | null
          bio: string | null
          created_at: string
          date_of_birth: string | null
          email: string | null
          first_name: string | null
          full_name: string | null
          id: string
          last_name: string | null
          middle_name: string | null
          phone_e164: string | null
          phone_verified_at: string | null
          privacy_accepted_at: string | null
          privacy_policy_version: string | null
          profile_completed_at: string | null
          updated_at: string
        }
        Insert: {
          avatar_path?: string | null
          bio?: string | null
          created_at?: string
          date_of_birth?: string | null
          email?: string | null
          first_name?: string | null
          full_name?: string | null
          id: string
          last_name?: string | null
          middle_name?: string | null
          phone_e164?: string | null
          phone_verified_at?: string | null
          privacy_accepted_at?: string | null
          privacy_policy_version?: string | null
          profile_completed_at?: string | null
          updated_at?: string
        }
        Update: {
          avatar_path?: string | null
          bio?: string | null
          created_at?: string
          date_of_birth?: string | null
          email?: string | null
          first_name?: string | null
          full_name?: string | null
          id?: string
          last_name?: string | null
          middle_name?: string | null
          phone_e164?: string | null
          phone_verified_at?: string | null
          privacy_accepted_at?: string | null
          privacy_policy_version?: string | null
          profile_completed_at?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      property_registrations: {
        Row: {
          address_line1: string
          address_line2: string | null
          affirm_accurate: boolean
          affirm_authorized: boolean
          affirm_not_title: boolean
          city: string
          county: string
          created_at: string
          id: string
          normalized_address: string | null
          parcel_id: string | null
          postal_code: string
          property_type: Database["public"]["Enums"]["property_type"]
          public_source_notes: string | null
          receipt_code: string
          relationship: Database["public"]["Enums"]["submitter_relationship"]
          relationship_other: string | null
          state: string
          status: Database["public"]["Enums"]["registration_status"]
          submitted_at: string | null
          submitter_full_name: string
          updated_at: string
          user_id: string
          user_note: string | null
        }
        Insert: {
          address_line1: string
          address_line2?: string | null
          affirm_accurate?: boolean
          affirm_authorized?: boolean
          affirm_not_title?: boolean
          city: string
          county: string
          created_at?: string
          id?: string
          normalized_address?: string | null
          parcel_id?: string | null
          postal_code: string
          property_type: Database["public"]["Enums"]["property_type"]
          public_source_notes?: string | null
          receipt_code?: string
          relationship: Database["public"]["Enums"]["submitter_relationship"]
          relationship_other?: string | null
          state?: string
          status?: Database["public"]["Enums"]["registration_status"]
          submitted_at?: string | null
          submitter_full_name: string
          updated_at?: string
          user_id: string
          user_note?: string | null
        }
        Update: {
          address_line1?: string
          address_line2?: string | null
          affirm_accurate?: boolean
          affirm_authorized?: boolean
          affirm_not_title?: boolean
          city?: string
          county?: string
          created_at?: string
          id?: string
          normalized_address?: string | null
          parcel_id?: string | null
          postal_code?: string
          property_type?: Database["public"]["Enums"]["property_type"]
          public_source_notes?: string | null
          receipt_code?: string
          relationship?: Database["public"]["Enums"]["submitter_relationship"]
          relationship_other?: string | null
          state?: string
          status?: Database["public"]["Enums"]["registration_status"]
          submitted_at?: string | null
          submitter_full_name?: string
          updated_at?: string
          user_id?: string
          user_note?: string | null
        }
        Relationships: []
      }
      record_anchors: {
        Row: {
          anchored_at: string | null
          canonical_payload_hash: string | null
          created_at: string
          id: string
          registration_id: string
          updated_at: string
          validated_ledger_index: number | null
          xrpl_network: string | null
          xrpl_tx_hash: string | null
        }
        Insert: {
          anchored_at?: string | null
          canonical_payload_hash?: string | null
          created_at?: string
          id?: string
          registration_id: string
          updated_at?: string
          validated_ledger_index?: number | null
          xrpl_network?: string | null
          xrpl_tx_hash?: string | null
        }
        Update: {
          anchored_at?: string | null
          canonical_payload_hash?: string | null
          created_at?: string
          id?: string
          registration_id?: string
          updated_at?: string
          validated_ledger_index?: number | null
          xrpl_network?: string | null
          xrpl_tx_hash?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "record_anchors_registration_id_fkey"
            columns: ["registration_id"]
            isOneToOne: true
            referencedRelation: "property_registrations"
            referencedColumns: ["id"]
          },
        ]
      }
      registration_status_history: {
        Row: {
          changed_by: string | null
          created_at: string
          from_status: Database["public"]["Enums"]["registration_status"] | null
          id: string
          is_user_visible: boolean
          registration_id: string
          to_status: Database["public"]["Enums"]["registration_status"]
          user_visible_message: string | null
        }
        Insert: {
          changed_by?: string | null
          created_at?: string
          from_status?:
            | Database["public"]["Enums"]["registration_status"]
            | null
          id?: string
          is_user_visible?: boolean
          registration_id: string
          to_status: Database["public"]["Enums"]["registration_status"]
          user_visible_message?: string | null
        }
        Update: {
          changed_by?: string | null
          created_at?: string
          from_status?:
            | Database["public"]["Enums"]["registration_status"]
            | null
          id?: string
          is_user_visible?: boolean
          registration_id?: string
          to_status?: Database["public"]["Enums"]["registration_status"]
          user_visible_message?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "registration_status_history_registration_id_fkey"
            columns: ["registration_id"]
            isOneToOne: false
            referencedRelation: "property_registrations"
            referencedColumns: ["id"]
          },
        ]
      }
      staff_notes: {
        Row: {
          author_id: string | null
          body: string
          created_at: string
          id: string
          registration_id: string
        }
        Insert: {
          author_id?: string | null
          body: string
          created_at?: string
          id?: string
          registration_id: string
        }
        Update: {
          author_id?: string | null
          body?: string
          created_at?: string
          id?: string
          registration_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "staff_notes_registration_id_fkey"
            columns: ["registration_id"]
            isOneToOne: false
            referencedRelation: "property_registrations"
            referencedColumns: ["id"]
          },
        ]
      }
      staff_roles: {
        Row: {
          created_at: string
          id: string
          role: Database["public"]["Enums"]["staff_role"]
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          role: Database["public"]["Enums"]["staff_role"]
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          role?: Database["public"]["Enums"]["staff_role"]
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      review_registration_status: {
        Args: {
          _registration_id: string
          _to_status: Database["public"]["Enums"]["registration_status"]
          _user_visible_message?: string
        }
        Returns: undefined
      }
    }
    Enums: {
      property_type:
        | "single_family"
        | "multi_family"
        | "condo"
        | "townhouse"
        | "land"
        | "commercial"
        | "mixed_use"
        | "other"
      registration_status:
        | "draft"
        | "submitted"
        | "under_review"
        | "needs_information"
        | "approved"
        | "anchoring"
        | "anchored"
        | "rejected"
      staff_role: "admin" | "reviewer"
      submitter_relationship:
        | "owner"
        | "authorized_representative"
        | "property_professional"
        | "other"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
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
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
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
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
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
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      property_type: [
        "single_family",
        "multi_family",
        "condo",
        "townhouse",
        "land",
        "commercial",
        "mixed_use",
        "other",
      ],
      registration_status: [
        "draft",
        "submitted",
        "under_review",
        "needs_information",
        "approved",
        "anchoring",
        "anchored",
        "rejected",
      ],
      staff_role: ["admin", "reviewer"],
      submitter_relationship: [
        "owner",
        "authorized_representative",
        "property_professional",
        "other",
      ],
    },
  },
} as const
