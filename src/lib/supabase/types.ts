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
    PostgrestVersion: "14.1"
  }
  public: {
    Tables: {
      announcements: {
        Row: {
          author_id: string | null
          author_name: string
          content: string
          created_at: string
          id: string
          title: string
          updated_at: string
        }
        Insert: {
          author_id?: string | null
          author_name: string
          content: string
          created_at?: string
          id?: string
          title: string
          updated_at?: string
        }
        Update: {
          author_id?: string | null
          author_name?: string
          content?: string
          created_at?: string
          id?: string
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "announcements_author_id_fkey"
            columns: ["author_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      audit_logs: {
        Row: {
          action: string
          created_at: string
          details: Json | null
          entity_id: string
          entity_type: string
          id: string
          profile_id: string | null
        }
        Insert: {
          action: string
          created_at?: string
          details?: Json | null
          entity_id: string
          entity_type: string
          id?: string
          profile_id?: string | null
        }
        Update: {
          action?: string
          created_at?: string
          details?: Json | null
          entity_id?: string
          entity_type?: string
          id?: string
          profile_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "audit_logs_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      brothers: {
        Row: {
          address: string | null
          address_city: string | null
          address_complement: string | null
          address_neighborhood: string | null
          address_number: string | null
          address_state: string | null
          address_street: string | null
          address_zipcode: string | null
          affiliation_date: string | null
          attendance_rate: number | null
          children: Json | null
          cpf: string | null
          created_at: string
          current_lodge_number: string | null
          degree: string
          dob: string | null
          elevation_date: string | null
          email: string
          exaltation_date: string | null
          id: string
          initiation_date: string
          masonic_registration_number: string | null
          name: string
          notes: string | null
          obedience: string | null
          origin_lodge: string | null
          origin_lodge_number: string | null
          phone: string
          photo_url: string | null
          regular_status: string | null
          role: string
          spouse_dob: string | null
          spouse_name: string | null
          status: string
          updated_at: string
        }
        Insert: {
          address?: string | null
          address_city?: string | null
          address_complement?: string | null
          address_neighborhood?: string | null
          address_number?: string | null
          address_state?: string | null
          address_street?: string | null
          address_zipcode?: string | null
          affiliation_date?: string | null
          attendance_rate?: number | null
          children?: Json | null
          cpf?: string | null
          created_at?: string
          current_lodge_number?: string | null
          degree?: string
          dob?: string | null
          elevation_date?: string | null
          email: string
          exaltation_date?: string | null
          id?: string
          initiation_date: string
          masonic_registration_number?: string | null
          name: string
          notes?: string | null
          obedience?: string | null
          origin_lodge?: string | null
          origin_lodge_number?: string | null
          phone: string
          photo_url?: string | null
          regular_status?: string | null
          role?: string
          spouse_dob?: string | null
          spouse_name?: string | null
          status?: string
          updated_at?: string
        }
        Update: {
          address?: string | null
          address_city?: string | null
          address_complement?: string | null
          address_neighborhood?: string | null
          address_number?: string | null
          address_state?: string | null
          address_street?: string | null
          address_zipcode?: string | null
          affiliation_date?: string | null
          attendance_rate?: number | null
          children?: Json | null
          cpf?: string | null
          created_at?: string
          current_lodge_number?: string | null
          degree?: string
          dob?: string | null
          elevation_date?: string | null
          email?: string
          exaltation_date?: string | null
          id?: string
          initiation_date?: string
          masonic_registration_number?: string | null
          name?: string
          notes?: string | null
          obedience?: string | null
          origin_lodge?: string | null
          origin_lodge_number?: string | null
          phone?: string
          photo_url?: string | null
          regular_status?: string | null
          role?: string
          spouse_dob?: string | null
          spouse_name?: string | null
          status?: string
          updated_at?: string
        }
        Relationships: []
      }
      internal_messages: {
        Row: {
          content: string
          created_at: string
          id: string
          is_read: boolean
          recipient_id: string
          recipient_name: string
          sender_id: string
          sender_name: string
          subject: string
        }
        Insert: {
          content: string
          created_at?: string
          id?: string
          is_read?: boolean
          recipient_id: string
          recipient_name: string
          sender_id: string
          sender_name: string
          subject: string
        }
        Update: {
          content?: string
          created_at?: string
          id?: string
          is_read?: boolean
          recipient_id?: string
          recipient_name?: string
          sender_id?: string
          sender_name?: string
          subject?: string
        }
        Relationships: [
          {
            foreignKeyName: "internal_messages_recipient_id_fkey"
            columns: ["recipient_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "internal_messages_sender_id_fkey"
            columns: ["sender_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      lodge_position_history: {
        Row: {
          created_at: string
          end_date: string
          id: string
          position_type: Database["public"]["Enums"]["lodge_position_type"]
          start_date: string
          user_id: string | null
        }
        Insert: {
          created_at?: string
          end_date: string
          id?: string
          position_type: Database["public"]["Enums"]["lodge_position_type"]
          start_date: string
          user_id?: string | null
        }
        Update: {
          created_at?: string
          end_date?: string
          id?: string
          position_type?: Database["public"]["Enums"]["lodge_position_type"]
          start_date?: string
          user_id?: string | null
        }
        Relationships: []
      }
      lodge_positions: {
        Row: {
          created_at: string
          end_date: string
          id: string
          position_type: Database["public"]["Enums"]["lodge_position_type"]
          start_date: string
          updated_at: string
          user_id: string | null
        }
        Insert: {
          created_at?: string
          end_date: string
          id?: string
          position_type: Database["public"]["Enums"]["lodge_position_type"]
          start_date: string
          updated_at?: string
          user_id?: string | null
        }
        Update: {
          created_at?: string
          end_date?: string
          id?: string
          position_type?: Database["public"]["Enums"]["lodge_position_type"]
          start_date?: string
          updated_at?: string
          user_id?: string | null
        }
        Relationships: []
      }
      minutes: {
        Row: {
          content: string
          created_at: string
          date: string
          id: string
          title: string
          updated_at: string
        }
        Insert: {
          content: string
          created_at?: string
          date: string
          id?: string
          title: string
          updated_at?: string
        }
        Update: {
          content?: string
          created_at?: string
          date?: string
          id?: string
          title?: string
          updated_at?: string
        }
        Relationships: []
      }
      minutes_signatures: {
        Row: {
          id: string
          minute_id: string
          profile_id: string
          signed_at: string
        }
        Insert: {
          id?: string
          minute_id: string
          profile_id: string
          signed_at?: string
        }
        Update: {
          id?: string
          minute_id?: string
          profile_id?: string
          signed_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "minutes_signatures_minute_id_fkey"
            columns: ["minute_id"]
            isOneToOne: false
            referencedRelation: "minutes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "minutes_signatures_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      news_events: {
        Row: {
          category: string | null
          content: string
          created_at: string
          event_date: string | null
          id: string
          image_url: string | null
          is_published: boolean | null
          title: string
          updated_at: string
        }
        Insert: {
          category?: string | null
          content: string
          created_at?: string
          event_date?: string | null
          id?: string
          image_url?: string | null
          is_published?: boolean | null
          title: string
          updated_at?: string
        }
        Update: {
          category?: string | null
          content?: string
          created_at?: string
          event_date?: string | null
          id?: string
          image_url?: string | null
          is_published?: boolean | null
          title?: string
          updated_at?: string
        }
        Relationships: []
      }
      notifications: {
        Row: {
          created_at: string
          id: string
          is_read: boolean
          link: string | null
          message: string
          profile_id: string
          title: string
        }
        Insert: {
          created_at?: string
          id?: string
          is_read?: boolean
          link?: string | null
          message: string
          profile_id: string
          title: string
        }
        Update: {
          created_at?: string
          id?: string
          is_read?: boolean
          link?: string | null
          message?: string
          profile_id?: string
          title?: string
        }
        Relationships: [
          {
            foreignKeyName: "notifications_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          avatar_url: string | null
          created_at: string
          email: string | null
          full_name: string | null
          id: string
          masonic_degree: string | null
          role: Database["public"]["Enums"]["app_role"] | null
          status: Database["public"]["Enums"]["user_status"] | null
          updated_at: string
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string
          email?: string | null
          full_name?: string | null
          id: string
          masonic_degree?: string | null
          role?: Database["public"]["Enums"]["app_role"] | null
          status?: Database["public"]["Enums"]["user_status"] | null
          updated_at?: string
        }
        Update: {
          avatar_url?: string | null
          created_at?: string
          email?: string | null
          full_name?: string | null
          id?: string
          masonic_degree?: string | null
          role?: Database["public"]["Enums"]["app_role"] | null
          status?: Database["public"]["Enums"]["user_status"] | null
          updated_at?: string
        }
        Relationships: []
      }
      push_subscriptions: {
        Row: {
          created_at: string
          id: string
          profile_id: string
          subscription_data: Json
        }
        Insert: {
          created_at?: string
          id?: string
          profile_id: string
          subscription_data: Json
        }
        Update: {
          created_at?: string
          id?: string
          profile_id?: string
          subscription_data?: Json
        }
        Relationships: [
          {
            foreignKeyName: "push_subscriptions_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      redirects: {
        Row: {
          created_at: string
          id: string
          is_permanent: boolean | null
          source_path: string
          target_path: string
        }
        Insert: {
          created_at?: string
          id?: string
          is_permanent?: boolean | null
          source_path: string
          target_path: string
        }
        Update: {
          created_at?: string
          id?: string
          is_permanent?: boolean | null
          source_path?: string
          target_path?: string
        }
        Relationships: []
      }
      site_settings: {
        Row: {
          contact_address: string | null
          contact_city: string | null
          contact_email: string | null
          contact_secondary_email: string | null
          contact_zip: string | null
          created_at: string
          custom_sections: Json | null
          favicon_url: string | null
          font_family: string | null
          history_image_url: string | null
          history_text: string | null
          history_title: string | null
          id: number
          logo_url: string | null
          meta_description: string | null
          primary_color: string | null
          secondary_color: string | null
          section_order: Json | null
          site_title: string | null
          typography_font_size_base: string | null
          typography_font_weight_base: string | null
          typography_font_weight_bold: string | null
          typography_letter_spacing: string | null
          typography_line_height: string | null
          typography_text_color: string | null
          typography_text_color_muted: string | null
          typography_text_decoration: string | null
          typography_text_transform: string | null
          updated_at: string
          values_equality: string | null
          values_fraternity: string | null
          values_liberty: string | null
        }
        Insert: {
          contact_address?: string | null
          contact_city?: string | null
          contact_email?: string | null
          contact_secondary_email?: string | null
          contact_zip?: string | null
          created_at?: string
          custom_sections?: Json | null
          favicon_url?: string | null
          font_family?: string | null
          history_image_url?: string | null
          history_text?: string | null
          history_title?: string | null
          id?: number
          logo_url?: string | null
          meta_description?: string | null
          primary_color?: string | null
          secondary_color?: string | null
          section_order?: Json | null
          site_title?: string | null
          typography_font_size_base?: string | null
          typography_font_weight_base?: string | null
          typography_font_weight_bold?: string | null
          typography_letter_spacing?: string | null
          typography_line_height?: string | null
          typography_text_color?: string | null
          typography_text_color_muted?: string | null
          typography_text_decoration?: string | null
          typography_text_transform?: string | null
          updated_at?: string
          values_equality?: string | null
          values_fraternity?: string | null
          values_liberty?: string | null
        }
        Update: {
          contact_address?: string | null
          contact_city?: string | null
          contact_email?: string | null
          contact_secondary_email?: string | null
          contact_zip?: string | null
          created_at?: string
          custom_sections?: Json | null
          favicon_url?: string | null
          font_family?: string | null
          history_image_url?: string | null
          history_text?: string | null
          history_title?: string | null
          id?: number
          logo_url?: string | null
          meta_description?: string | null
          primary_color?: string | null
          secondary_color?: string | null
          section_order?: Json | null
          site_title?: string | null
          typography_font_size_base?: string | null
          typography_font_weight_base?: string | null
          typography_font_weight_bold?: string | null
          typography_letter_spacing?: string | null
          typography_line_height?: string | null
          typography_text_color?: string | null
          typography_text_color_muted?: string | null
          typography_text_decoration?: string | null
          typography_text_transform?: string | null
          updated_at?: string
          values_equality?: string | null
          values_fraternity?: string | null
          values_liberty?: string | null
        }
        Relationships: []
      }
      venerables: {
        Row: {
          created_at: string
          id: string
          image_url: string | null
          name: string
          period: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: string
          image_url?: string | null
          name: string
          period: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          image_url?: string | null
          name?: string
          period?: string
          updated_at?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      get_user_current_position: {
        Args: { p_user_id: string }
        Returns: Database["public"]["Enums"]["lodge_position_type"]
      }
      has_active_position: {
        Args: {
          p_position_type: Database["public"]["Enums"]["lodge_position_type"]
          p_user_id: string
        }
        Returns: boolean
      }
      has_module_permission: {
        Args: { p_module: string; p_user_id: string }
        Returns: boolean
      }
      is_admin: { Args: never; Returns: boolean }
      is_admin_or_editor: { Args: never; Returns: boolean }
    }
    Enums: {
      app_role: "admin" | "editor" | "member"
      lodge_position_type:
        | "veneravel_mestre"
        | "orador"
        | "secretario"
        | "chanceler"
        | "tesoureiro"
      user_status: "pending" | "approved" | "blocked"
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
    ? DefaultSchema[DefaultSchemaEnumNameOrOptions]
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
    ? DefaultSchema[PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      app_role: ["admin", "editor", "member"],
      lodge_position_type: [
        "veneravel_mestre",
        "orador",
        "secretario",
        "chanceler",
        "tesoureiro",
      ],
      user_status: ["pending", "approved", "blocked"],
    },
  },
} as const
