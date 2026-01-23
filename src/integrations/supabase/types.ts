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
      clients: {
        Row: {
          assigned_account_manager_email: string | null
          assigned_account_manager_id: string | null
          assigned_account_manager_name: string | null
          assigned_am_slack_uid: string | null
          assigned_inbox_manager_email: string | null
          assigned_inbox_manager_id: string | null
          assigned_inbox_manager_name: string | null
          assigned_sdr_email: string | null
          assigned_sdr_id: string | null
          assigned_sdr_name: string | null
          avg_dollar_gen_pm: number | null
          booking_link: string | null
          client_code: string
          client_company_name: string | null
          client_email: string | null
          client_id: number
          client_name: string | null
          client_website: string | null
          closelix: boolean | null
          correspondence_emails: string[] | null
          created_at: string
          exit_date: string | null
          onboarding_activated: boolean | null
          onboarding_date: string | null
          phone_number: string | null
          recurring_cost_usd: number | null
          relationship_status: string | null
          relationship_type: string | null
          team_member_id: number | null
          updated_at: string
          website_canonical: string | null
          weekend_sending_effective: boolean | null
          weekend_sending_mode: string | null
          weekly_target: string | null
          weekly_target_launch_date: string | null
        }
        Insert: {
          assigned_account_manager_email?: string | null
          assigned_account_manager_id?: string | null
          assigned_account_manager_name?: string | null
          assigned_am_slack_uid?: string | null
          assigned_inbox_manager_email?: string | null
          assigned_inbox_manager_id?: string | null
          assigned_inbox_manager_name?: string | null
          assigned_sdr_email?: string | null
          assigned_sdr_id?: string | null
          assigned_sdr_name?: string | null
          avg_dollar_gen_pm?: number | null
          booking_link?: string | null
          client_code: string
          client_company_name?: string | null
          client_email?: string | null
          client_id: number
          client_name?: string | null
          client_website?: string | null
          closelix?: boolean | null
          correspondence_emails?: string[] | null
          created_at?: string
          exit_date?: string | null
          onboarding_activated?: boolean | null
          onboarding_date?: string | null
          phone_number?: string | null
          recurring_cost_usd?: number | null
          relationship_status?: string | null
          relationship_type?: string | null
          team_member_id?: number | null
          updated_at?: string
          website_canonical?: string | null
          weekend_sending_effective?: boolean | null
          weekend_sending_mode?: string | null
          weekly_target?: string | null
          weekly_target_launch_date?: string | null
        }
        Update: {
          assigned_account_manager_email?: string | null
          assigned_account_manager_id?: string | null
          assigned_account_manager_name?: string | null
          assigned_am_slack_uid?: string | null
          assigned_inbox_manager_email?: string | null
          assigned_inbox_manager_id?: string | null
          assigned_inbox_manager_name?: string | null
          assigned_sdr_email?: string | null
          assigned_sdr_id?: string | null
          assigned_sdr_name?: string | null
          avg_dollar_gen_pm?: number | null
          booking_link?: string | null
          client_code?: string
          client_company_name?: string | null
          client_email?: string | null
          client_id?: number
          client_name?: string | null
          client_website?: string | null
          closelix?: boolean | null
          correspondence_emails?: string[] | null
          created_at?: string
          exit_date?: string | null
          onboarding_activated?: boolean | null
          onboarding_date?: string | null
          phone_number?: string | null
          recurring_cost_usd?: number | null
          relationship_status?: string | null
          relationship_type?: string | null
          team_member_id?: number | null
          updated_at?: string
          website_canonical?: string | null
          weekend_sending_effective?: boolean | null
          weekend_sending_mode?: string | null
          weekly_target?: string | null
          weekly_target_launch_date?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "clients_assigned_account_manager_id_fkey"
            columns: ["assigned_account_manager_id"]
            isOneToOne: false
            referencedRelation: "team_member_load"
            referencedColumns: ["member_id"]
          },
          {
            foreignKeyName: "clients_assigned_account_manager_id_fkey"
            columns: ["assigned_account_manager_id"]
            isOneToOne: false
            referencedRelation: "team_members"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "clients_assigned_inbox_manager_id_fkey"
            columns: ["assigned_inbox_manager_id"]
            isOneToOne: false
            referencedRelation: "team_member_load"
            referencedColumns: ["member_id"]
          },
          {
            foreignKeyName: "clients_assigned_inbox_manager_id_fkey"
            columns: ["assigned_inbox_manager_id"]
            isOneToOne: false
            referencedRelation: "team_members"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "clients_assigned_sdr_id_fkey"
            columns: ["assigned_sdr_id"]
            isOneToOne: false
            referencedRelation: "team_member_load"
            referencedColumns: ["member_id"]
          },
          {
            foreignKeyName: "clients_assigned_sdr_id_fkey"
            columns: ["assigned_sdr_id"]
            isOneToOne: false
            referencedRelation: "team_members"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "clients_relationship_status_fkey"
            columns: ["relationship_status"]
            isOneToOne: false
            referencedRelation: "relationship_statuses"
            referencedColumns: ["name"]
          },
          {
            foreignKeyName: "clients_relationship_type_fkey"
            columns: ["relationship_type"]
            isOneToOne: false
            referencedRelation: "relationship_types"
            referencedColumns: ["name"]
          },
          {
            foreignKeyName: "fk_clients_am"
            columns: ["assigned_account_manager_id"]
            isOneToOne: false
            referencedRelation: "team_member_load"
            referencedColumns: ["member_id"]
          },
          {
            foreignKeyName: "fk_clients_am"
            columns: ["assigned_account_manager_id"]
            isOneToOne: false
            referencedRelation: "team_members"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_clients_im"
            columns: ["assigned_inbox_manager_id"]
            isOneToOne: false
            referencedRelation: "team_member_load"
            referencedColumns: ["member_id"]
          },
          {
            foreignKeyName: "fk_clients_im"
            columns: ["assigned_inbox_manager_id"]
            isOneToOne: false
            referencedRelation: "team_members"
            referencedColumns: ["id"]
          },
        ]
      }
      clients_audit_assignment: {
        Row: {
          audit_id: number
          changed_at: string
          changed_by: string | null
          client_code: string
          client_id: number
          new_account_manager_id: string | null
          new_inbox_manager_id: string | null
          old_account_manager_id: string | null
          old_inbox_manager_id: string | null
        }
        Insert: {
          audit_id?: number
          changed_at?: string
          changed_by?: string | null
          client_code: string
          client_id: number
          new_account_manager_id?: string | null
          new_inbox_manager_id?: string | null
          old_account_manager_id?: string | null
          old_inbox_manager_id?: string | null
        }
        Update: {
          audit_id?: number
          changed_at?: string
          changed_by?: string | null
          client_code?: string
          client_id?: number
          new_account_manager_id?: string | null
          new_inbox_manager_id?: string | null
          old_account_manager_id?: string | null
          old_inbox_manager_id?: string | null
        }
        Relationships: []
      }
      clients_audit_pricing: {
        Row: {
          audit_id: number
          changed_at: string
          changed_by: string | null
          client_code: string
          client_id: number
          new_avg_dollar_gen_pm: number | null
          new_recurring_cost_usd: number | null
          old_avg_dollar_gen_pm: number | null
          old_recurring_cost_usd: number | null
        }
        Insert: {
          audit_id?: number
          changed_at?: string
          changed_by?: string | null
          client_code: string
          client_id: number
          new_avg_dollar_gen_pm?: number | null
          new_recurring_cost_usd?: number | null
          old_avg_dollar_gen_pm?: number | null
          old_recurring_cost_usd?: number | null
        }
        Update: {
          audit_id?: number
          changed_at?: string
          changed_by?: string | null
          client_code?: string
          client_id?: number
          new_avg_dollar_gen_pm?: number | null
          new_recurring_cost_usd?: number | null
          old_avg_dollar_gen_pm?: number | null
          old_recurring_cost_usd?: number | null
        }
        Relationships: []
      }
      clients_audit_status: {
        Row: {
          audit_id: number
          changed_at: string
          changed_by: string | null
          client_code: string
          client_id: number
          new_status: string
          old_status: string | null
        }
        Insert: {
          audit_id?: number
          changed_at?: string
          changed_by?: string | null
          client_code: string
          client_id: number
          new_status: string
          old_status?: string | null
        }
        Update: {
          audit_id?: number
          changed_at?: string
          changed_by?: string | null
          client_code?: string
          client_id?: number
          new_status?: string
          old_status?: string | null
        }
        Relationships: []
      }
      clients_audit_type: {
        Row: {
          audit_id: number
          changed_at: string
          changed_by: string | null
          client_code: string
          client_id: number
          new_type: string | null
          old_type: string | null
        }
        Insert: {
          audit_id?: number
          changed_at?: string
          changed_by?: string | null
          client_code: string
          client_id: number
          new_type?: string | null
          old_type?: string | null
        }
        Update: {
          audit_id?: number
          changed_at?: string
          changed_by?: string | null
          client_code?: string
          client_id?: number
          new_type?: string | null
          old_type?: string | null
        }
        Relationships: []
      }
      clients_staging: {
        Row: {
          assigned_account_manager: string | null
          assigned_inbox_manager: string | null
          avg_dollar_gen_pm: string | null
          booking_link: string | null
          client_code: string | null
          client_company_name: string | null
          client_email: string | null
          client_id: number | null
          client_name: string | null
          client_website: string | null
          exit_date: string | null
          id_primary_key: number
          onboarding_activated: string | null
          onboarding_date: string | null
          phone_number: string | null
          recurring_cost_usd: string | null
          relationship_status: string | null
          relationship_type: string | null
          weekend_sending: string | null
        }
        Insert: {
          assigned_account_manager?: string | null
          assigned_inbox_manager?: string | null
          avg_dollar_gen_pm?: string | null
          booking_link?: string | null
          client_code?: string | null
          client_company_name?: string | null
          client_email?: string | null
          client_id?: number | null
          client_name?: string | null
          client_website?: string | null
          exit_date?: string | null
          id_primary_key?: number
          onboarding_activated?: string | null
          onboarding_date?: string | null
          phone_number?: string | null
          recurring_cost_usd?: string | null
          relationship_status?: string | null
          relationship_type?: string | null
          weekend_sending?: string | null
        }
        Update: {
          assigned_account_manager?: string | null
          assigned_inbox_manager?: string | null
          avg_dollar_gen_pm?: string | null
          booking_link?: string | null
          client_code?: string | null
          client_company_name?: string | null
          client_email?: string | null
          client_id?: number | null
          client_name?: string | null
          client_website?: string | null
          exit_date?: string | null
          id_primary_key?: number
          onboarding_activated?: string | null
          onboarding_date?: string | null
          phone_number?: string | null
          recurring_cost_usd?: string | null
          relationship_status?: string | null
          relationship_type?: string | null
          weekend_sending?: string | null
        }
        Relationships: []
      }
      relationship_statuses: {
        Row: {
          name: string
        }
        Insert: {
          name: string
        }
        Update: {
          name?: string
        }
        Relationships: []
      }
      relationship_types: {
        Row: {
          name: string
        }
        Insert: {
          name: string
        }
        Update: {
          name?: string
        }
        Relationships: []
      }
      round_robin_groups: {
        Row: {
          enabled: boolean
          name: string
          role: string
        }
        Insert: {
          enabled?: boolean
          name: string
          role: string
        }
        Update: {
          enabled?: boolean
          name?: string
          role?: string
        }
        Relationships: []
      }
      round_robin_state: {
        Row: {
          group_name: string
          last_member_id: string | null
        }
        Insert: {
          group_name: string
          last_member_id?: string | null
        }
        Update: {
          group_name?: string
          last_member_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "round_robin_state_group_name_fkey"
            columns: ["group_name"]
            isOneToOne: true
            referencedRelation: "round_robin_groups"
            referencedColumns: ["name"]
          },
        ]
      }
      team_members: {
        Row: {
          active: boolean
          capacity_clients: number | null
          created_at: string
          email: string
          external: Json | null
          full_name: string
          id: string
          role: string | null
          round_robin_group: string | null
          slack_uuid: string | null
          team_member_id: number | null
          timezone: string | null
          weight: number
        }
        Insert: {
          active?: boolean
          capacity_clients?: number | null
          created_at?: string
          email: string
          external?: Json | null
          full_name: string
          id?: string
          role?: string | null
          round_robin_group?: string | null
          slack_uuid?: string | null
          team_member_id?: number | null
          timezone?: string | null
          weight?: number
        }
        Update: {
          active?: boolean
          capacity_clients?: number | null
          created_at?: string
          email?: string
          external?: Json | null
          full_name?: string
          id?: string
          role?: string | null
          round_robin_group?: string | null
          slack_uuid?: string | null
          team_member_id?: number | null
          timezone?: string | null
          weight?: number
        }
        Relationships: []
      }
    }
    Views: {
      team_member_load: {
        Row: {
          active: boolean | null
          active_clients_am: number | null
          active_clients_im: number | null
          capacity_clients: number | null
          email: string | null
          full_name: string | null
          member_id: string | null
          role: string | null
          round_robin_group: string | null
        }
        Relationships: []
      }
    }
    Functions: {
      assign_account_manager: {
        Args: { p_client_code: string; p_client_id: number; p_group: string }
        Returns: string
      }
      assign_inbox_manager: {
        Args: { p_client_code: string; p_client_id: number; p_group: string }
        Returns: string
      }
      current_user_uid: { Args: never; Returns: string }
      next_round_robin_member: { Args: { p_group: string }; Returns: string }
      norm_name: { Args: { txt: string }; Returns: string }
      normalize_url: { Args: { u: string }; Returns: string }
      to_bool: { Args: { x: string }; Returns: boolean }
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
