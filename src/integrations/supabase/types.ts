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
      registration_corrections: {
        Row: {
          corrected_fields: Json
          created_at: string
          created_by: string | null
          dispute_note: string | null
          field_confidence: Json | null
          id: string
          registration_id: string
          responded_at: string | null
          response: Database["public"]["Enums"]["correction_response"] | null
          round: number
          sent_at: string | null
          source: Database["public"]["Enums"]["correction_source"]
          staff_rationale: string | null
          updated_at: string
        }
        Insert: {
          corrected_fields?: Json
          created_at?: string
          created_by?: string | null
          dispute_note?: string | null
          field_confidence?: Json | null
          id?: string
          registration_id: string
          responded_at?: string | null
          response?: Database["public"]["Enums"]["correction_response"] | null
          round?: number
          sent_at?: string | null
          source?: Database["public"]["Enums"]["correction_source"]
          staff_rationale?: string | null
          updated_at?: string
        }
        Update: {
          corrected_fields?: Json
          created_at?: string
          created_by?: string | null
          dispute_note?: string | null
          field_confidence?: Json | null
          id?: string
          registration_id?: string
          responded_at?: string | null
          response?: Database["public"]["Enums"]["correction_response"] | null
          round?: number
          sent_at?: string | null
          source?: Database["public"]["Enums"]["correction_source"]
          staff_rationale?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "registration_corrections_registration_id_fkey"
            columns: ["registration_id"]
            isOneToOne: false
            referencedRelation: "property_registrations"
            referencedColumns: ["id"]
          },
        ]
      }
      registration_documents: {
        Row: {
          byte_size: number
          created_at: string
          document_type: Database["public"]["Enums"]["registration_document_type"]
          file_name: string
          id: string
          mime_type: string
          registration_id: string
          storage_path: string
          uploaded_at: string
          user_id: string
        }
        Insert: {
          byte_size: number
          created_at?: string
          document_type: Database["public"]["Enums"]["registration_document_type"]
          file_name: string
          id?: string
          mime_type: string
          registration_id: string
          storage_path: string
          uploaded_at?: string
          user_id: string
        }
        Update: {
          byte_size?: number
          created_at?: string
          document_type?: Database["public"]["Enums"]["registration_document_type"]
          file_name?: string
          id?: string
          mime_type?: string
          registration_id?: string
          storage_path?: string
          uploaded_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "registration_documents_registration_id_fkey"
            columns: ["registration_id"]
            isOneToOne: false
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
      verification_checks: {
        Row: {
          check_kind: Database["public"]["Enums"]["verification_check_kind"]
          checked_at: string | null
          checked_by: string | null
          created_at: string
          id: string
          outcome: Database["public"]["Enums"]["verification_check_outcome"]
          public_summary: string | null
          report_id: string
          updated_at: string
        }
        Insert: {
          check_kind: Database["public"]["Enums"]["verification_check_kind"]
          checked_at?: string | null
          checked_by?: string | null
          created_at?: string
          id?: string
          outcome?: Database["public"]["Enums"]["verification_check_outcome"]
          public_summary?: string | null
          report_id: string
          updated_at?: string
        }
        Update: {
          check_kind?: Database["public"]["Enums"]["verification_check_kind"]
          checked_at?: string | null
          checked_by?: string | null
          created_at?: string
          id?: string
          outcome?: Database["public"]["Enums"]["verification_check_outcome"]
          public_summary?: string | null
          report_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "verification_checks_report_id_fkey"
            columns: ["report_id"]
            isOneToOne: false
            referencedRelation: "verification_reports"
            referencedColumns: ["id"]
          },
        ]
      }
      verification_reports: {
        Row: {
          completed_at: string | null
          created_at: string
          id: string
          methodology_version: string
          public_summary: string | null
          published_at: string | null
          registration_id: string
          report_code: string
          requested_at: string
          review_started_at: string | null
          reviewer_id: string | null
          status: Database["public"]["Enums"]["verification_report_status"]
          updated_at: string
          valid_until: string | null
        }
        Insert: {
          completed_at?: string | null
          created_at?: string
          id?: string
          methodology_version?: string
          public_summary?: string | null
          published_at?: string | null
          registration_id: string
          report_code?: string
          requested_at?: string
          review_started_at?: string | null
          reviewer_id?: string | null
          status?: Database["public"]["Enums"]["verification_report_status"]
          updated_at?: string
          valid_until?: string | null
        }
        Update: {
          completed_at?: string | null
          created_at?: string
          id?: string
          methodology_version?: string
          public_summary?: string | null
          published_at?: string | null
          registration_id?: string
          report_code?: string
          requested_at?: string
          review_started_at?: string | null
          reviewer_id?: string | null
          status?: Database["public"]["Enums"]["verification_report_status"]
          updated_at?: string
          valid_until?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "verification_reports_registration_id_fkey"
            columns: ["registration_id"]
            isOneToOne: true
            referencedRelation: "property_registrations"
            referencedColumns: ["id"]
          },
        ]
      }
      verification_sources: {
        Row: {
          check_id: string
          content_hash: string | null
          created_at: string
          created_by: string
          id: string
          jurisdiction: string | null
          record_reference: string | null
          retrieved_at: string
          source_name: string
          source_url: string | null
          staff_note: string | null
        }
        Insert: {
          check_id: string
          content_hash?: string | null
          created_at?: string
          created_by: string
          id?: string
          jurisdiction?: string | null
          record_reference?: string | null
          retrieved_at?: string
          source_name: string
          source_url?: string | null
          staff_note?: string | null
        }
        Update: {
          check_id?: string
          content_hash?: string | null
          created_at?: string
          created_by?: string
          id?: string
          jurisdiction?: string | null
          record_reference?: string | null
          retrieved_at?: string
          source_name?: string
          source_url?: string | null
          staff_note?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "verification_sources_check_id_fkey"
            columns: ["check_id"]
            isOneToOne: false
            referencedRelation: "verification_checks"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      publish_verification_report: {
        Args: {
          _outcome: Database["public"]["Enums"]["verification_report_status"]
          _public_summary: string
          _report_id: string
          _valid_until?: string
        }
        Returns: undefined
      }
      review_registration_status: {
        Args: {
          _registration_id: string
          _to_status: Database["public"]["Enums"]["registration_status"]
          _user_visible_message?: string
        }
        Returns: {
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
        SetofOptions: {
          from: "*"
          to: "property_registrations"
          isOneToOne: true
          isSetofReturn: false
        }
      }
      set_verification_report_progress: {
        Args: {
          _report_id: string
          _status: Database["public"]["Enums"]["verification_report_status"]
        }
        Returns: undefined
      }
      sync_staff_access: {
        Args: never
        Returns: Database["public"]["Enums"]["staff_role"]
      }
    }
    Enums: {
      correction_response: "confirmed" | "disputed"
      correction_source: "staff" | "engine"
      property_type:
        | "single_family"
        | "multi_family"
        | "condo"
        | "townhouse"
        | "land"
        | "commercial"
        | "mixed_use"
        | "other"
      registration_document_type:
        | "deed_title"
        | "tax_statement"
        | "mortgage_statement"
        | "insurance_declaration"
        | "utility_occupancy"
        | "photo_id"
        | "authority_document"
        | "other"
        | "property_photo"
      registration_status:
        | "draft"
        | "submitted"
        | "under_review"
        | "needs_information"
        | "approved"
        | "anchoring"
        | "anchored"
        | "rejected"
        | "correction_sent"
        | "confirmed_by_user"
      staff_role: "admin" | "reviewer"
      submitter_relationship:
        | "owner"
        | "authorized_representative"
        | "property_professional"
        | "other"
      verification_check_kind:
        | "identity"
        | "ownership"
        | "property_record"
        | "deed_title"
        | "tax"
        | "lien"
        | "encumbrance"
        | "document_authenticity"
        | "address"
        | "other"
      verification_check_outcome:
        | "pending"
        | "passed"
        | "failed"
        | "inconclusive"
        | "not_applicable"
      verification_report_status:
        | "queued"
        | "in_review"
        | "needs_information"
        | "verified"
        | "not_verified"
        | "inconclusive"
        | "expired"
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
      correction_response: ["confirmed", "disputed"],
      correction_source: ["staff", "engine"],
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
      registration_document_type: [
        "deed_title",
        "tax_statement",
        "mortgage_statement",
        "insurance_declaration",
        "utility_occupancy",
        "photo_id",
        "authority_document",
        "other",
        "property_photo",
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
        "correction_sent",
        "confirmed_by_user",
      ],
      staff_role: ["admin", "reviewer"],
      submitter_relationship: [
        "owner",
        "authorized_representative",
        "property_professional",
        "other",
      ],
      verification_check_kind: [
        "identity",
        "ownership",
        "property_record",
        "deed_title",
        "tax",
        "lien",
        "encumbrance",
        "document_authenticity",
        "address",
        "other",
      ],
      verification_check_outcome: [
        "pending",
        "passed",
        "failed",
        "inconclusive",
        "not_applicable",
      ],
      verification_report_status: [
        "queued",
        "in_review",
        "needs_information",
        "verified",
        "not_verified",
        "inconclusive",
        "expired",
      ],
    },
  },
} as const
