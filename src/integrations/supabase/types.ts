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
    PostgrestVersion: "13.0.4"
  }
  public: {
    Tables: {
      campaign_answers: {
        Row: {
          answered_at: string
          campaign_id: string
          confidence: number | null
          confirmation_message: string | null
          confirmed_at: string | null
          contact_id: string
          created_at: string
          id: string
          interpreted_value: string | null
          is_confirmed: boolean
          option_letter: string | null
          question_code: string | null
          question_id: string
          questionnaire_id: string
          raw_text: string | null
          structured_json: Json | null
          updated_at: string
          value_json: Json | null
          value_text: string | null
        }
        Insert: {
          answered_at?: string
          campaign_id: string
          confidence?: number | null
          confirmation_message?: string | null
          confirmed_at?: string | null
          contact_id: string
          created_at?: string
          id?: string
          interpreted_value?: string | null
          is_confirmed?: boolean
          option_letter?: string | null
          question_code?: string | null
          question_id: string
          questionnaire_id: string
          raw_text?: string | null
          structured_json?: Json | null
          updated_at?: string
          value_json?: Json | null
          value_text?: string | null
        }
        Update: {
          answered_at?: string
          campaign_id?: string
          confidence?: number | null
          confirmation_message?: string | null
          confirmed_at?: string | null
          contact_id?: string
          created_at?: string
          id?: string
          interpreted_value?: string | null
          is_confirmed?: boolean
          option_letter?: string | null
          question_code?: string | null
          question_id?: string
          questionnaire_id?: string
          raw_text?: string | null
          structured_json?: Json | null
          updated_at?: string
          value_json?: Json | null
          value_text?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "campaign_answers_campaign_id_fkey"
            columns: ["campaign_id"]
            isOneToOne: false
            referencedRelation: "campaigns"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "campaign_answers_contact_id_fkey"
            columns: ["contact_id"]
            isOneToOne: false
            referencedRelation: "contacts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "campaign_answers_question_id_fkey"
            columns: ["question_id"]
            isOneToOne: false
            referencedRelation: "questions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "campaign_answers_questionnaire_id_fkey"
            columns: ["questionnaire_id"]
            isOneToOne: false
            referencedRelation: "questionnaires"
            referencedColumns: ["id"]
          },
        ]
      }
      campaign_questionnaires: {
        Row: {
          assigned_at: string
          campaign_id: string
          completed_at: string | null
          id: string
          questionnaire_id: string
          started_at: string | null
        }
        Insert: {
          assigned_at?: string
          campaign_id: string
          completed_at?: string | null
          id?: string
          questionnaire_id: string
          started_at?: string | null
        }
        Update: {
          assigned_at?: string
          campaign_id?: string
          completed_at?: string | null
          id?: string
          questionnaire_id?: string
          started_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "campaign_questionnaires_campaign_id_fkey"
            columns: ["campaign_id"]
            isOneToOne: false
            referencedRelation: "campaigns"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "campaign_questionnaires_questionnaire_id_fkey"
            columns: ["questionnaire_id"]
            isOneToOne: false
            referencedRelation: "questionnaires"
            referencedColumns: ["id"]
          },
        ]
      }
      campaigns: {
        Row: {
          answered_questions: number[] | null
          answers: Json | null
          awaiting_other_for: number | null
          calendly_event_type: string | null
          calendly_payload_json: Json | null
          consent_received_at: string | null
          contact_id: string
          created_at: string
          external_conversation_sid: string | null
          id: string
          last_question_id: number | null
          name: string | null
          notes: string | null
          pending_other_field: string | null
          scheduled_end: string | null
          scheduled_start: string | null
          skipped_questions: number[] | null
          status: string
          twilio_conversation_sid: string | null
          updated_at: string
        }
        Insert: {
          answered_questions?: number[] | null
          answers?: Json | null
          awaiting_other_for?: number | null
          calendly_event_type?: string | null
          calendly_payload_json?: Json | null
          consent_received_at?: string | null
          contact_id: string
          created_at?: string
          external_conversation_sid?: string | null
          id?: string
          last_question_id?: number | null
          name?: string | null
          notes?: string | null
          pending_other_field?: string | null
          scheduled_end?: string | null
          scheduled_start?: string | null
          skipped_questions?: number[] | null
          status?: string
          twilio_conversation_sid?: string | null
          updated_at?: string
        }
        Update: {
          answered_questions?: number[] | null
          answers?: Json | null
          awaiting_other_for?: number | null
          calendly_event_type?: string | null
          calendly_payload_json?: Json | null
          consent_received_at?: string | null
          contact_id?: string
          created_at?: string
          external_conversation_sid?: string | null
          id?: string
          last_question_id?: number | null
          name?: string | null
          notes?: string | null
          pending_other_field?: string | null
          scheduled_end?: string | null
          scheduled_start?: string | null
          skipped_questions?: number[] | null
          status?: string
          twilio_conversation_sid?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "campaigns_contact_id_fkey"
            columns: ["contact_id"]
            isOneToOne: false
            referencedRelation: "contacts"
            referencedColumns: ["id"]
          },
        ]
      }
      company_settings: {
        Row: {
          company_name: string | null
          created_at: string
          id: string
          logo_url: string | null
          updated_at: string
        }
        Insert: {
          company_name?: string | null
          created_at?: string
          id?: string
          logo_url?: string | null
          updated_at?: string
        }
        Update: {
          company_name?: string | null
          created_at?: string
          id?: string
          logo_url?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      contacts: {
        Row: {
          created_at: string
          email: string | null
          first_name: string | null
          id: string
          last_name: string | null
          phone_e164: string | null
          source: string | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          email?: string | null
          first_name?: string | null
          id?: string
          last_name?: string | null
          phone_e164?: string | null
          source?: string | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          email?: string | null
          first_name?: string | null
          id?: string
          last_name?: string | null
          phone_e164?: string | null
          source?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      messages: {
        Row: {
          body: string
          campaign_id: string
          created_at: string
          external_message_sid: string | null
          id: string
          meta: Json | null
          sender_display: string | null
          sender_type: string
          sent_at: string
        }
        Insert: {
          body: string
          campaign_id: string
          created_at?: string
          external_message_sid?: string | null
          id?: string
          meta?: Json | null
          sender_display?: string | null
          sender_type: string
          sent_at?: string
        }
        Update: {
          body?: string
          campaign_id?: string
          created_at?: string
          external_message_sid?: string | null
          id?: string
          meta?: Json | null
          sender_display?: string | null
          sender_type?: string
          sent_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "messages_campaign_id_fkey"
            columns: ["campaign_id"]
            isOneToOne: false
            referencedRelation: "campaigns"
            referencedColumns: ["id"]
          },
        ]
      }
      questionnaires: {
        Row: {
          created_at: string
          id: string
          is_active: boolean | null
          name: string
          version: number
        }
        Insert: {
          created_at?: string
          id?: string
          is_active?: boolean | null
          name: string
          version?: number
        }
        Update: {
          created_at?: string
          id?: string
          is_active?: boolean | null
          name?: string
          version?: number
        }
        Relationships: []
      }
      questions: {
        Row: {
          code: string
          confirm_template: string | null
          created_at: string
          id: string
          options_json: Json | null
          ordinal: number
          questionnaire_id: string
          requires_confirmation: boolean
          section: string | null
          text: string
          type: string
        }
        Insert: {
          code: string
          confirm_template?: string | null
          created_at?: string
          id?: string
          options_json?: Json | null
          ordinal: number
          questionnaire_id: string
          requires_confirmation?: boolean
          section?: string | null
          text: string
          type: string
        }
        Update: {
          code?: string
          confirm_template?: string | null
          created_at?: string
          id?: string
          options_json?: Json | null
          ordinal?: number
          questionnaire_id?: string
          requires_confirmation?: boolean
          section?: string | null
          text?: string
          type?: string
        }
        Relationships: [
          {
            foreignKeyName: "questions_questionnaire_id_fkey"
            columns: ["questionnaire_id"]
            isOneToOne: false
            referencedRelation: "questionnaires"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      create_questionnaire_with_questions: {
        Args: { p_name: string; p_questions: Json }
        Returns: string
      }
      upsert_contact: {
        Args: {
          p_email: string
          p_first_name: string
          p_last_name: string
          p_phone_e164: string
          p_source?: string
        }
        Returns: {
          created_at: string
          email: string | null
          first_name: string | null
          id: string
          last_name: string | null
          phone_e164: string | null
          source: string | null
          updated_at: string
        }
      }
    }
    Enums: {
      [_ in never]: never
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
    Enums: {},
  },
} as const
