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
    PostgrestVersion: "14.5"
  }
  public: {
    Tables: {
      agape_brother_charges: {
        Row: {
          account_id: string | null
          amount: number
          brother_id: string
          closing_id: string | null
          consumed_amount: number
          created_at: string
          id: string
          month: number
          notes: string | null
          payment_date: string | null
          recorded_by: string | null
          status: string
          transaction_id: string | null
          updated_at: string
          year: number
        }
        Insert: {
          account_id?: string | null
          amount: number
          brother_id: string
          closing_id?: string | null
          consumed_amount?: number
          created_at?: string
          id?: string
          month: number
          notes?: string | null
          payment_date?: string | null
          recorded_by?: string | null
          status?: string
          transaction_id?: string | null
          updated_at?: string
          year: number
        }
        Update: {
          account_id?: string | null
          amount?: number
          brother_id?: string
          closing_id?: string | null
          consumed_amount?: number
          created_at?: string
          id?: string
          month?: number
          notes?: string | null
          payment_date?: string | null
          recorded_by?: string | null
          status?: string
          transaction_id?: string | null
          updated_at?: string
          year?: number
        }
        Relationships: [
          {
            foreignKeyName: "agape_brother_charges_account_id_fkey"
            columns: ["account_id"]
            isOneToOne: false
            referencedRelation: "financial_account_balances"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "agape_brother_charges_account_id_fkey"
            columns: ["account_id"]
            isOneToOne: false
            referencedRelation: "financial_accounts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "agape_brother_charges_brother_id_fkey"
            columns: ["brother_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "agape_brother_charges_closing_id_fkey"
            columns: ["closing_id"]
            isOneToOne: false
            referencedRelation: "agape_monthly_closings"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "agape_brother_charges_recorded_by_fkey"
            columns: ["recorded_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "agape_brother_charges_transaction_id_fkey"
            columns: ["transaction_id"]
            isOneToOne: false
            referencedRelation: "financial_transactions"
            referencedColumns: ["id"]
          },
        ]
      }
      agape_consumptions: {
        Row: {
          brother_id: string
          created_at: string
          id: string
          menu_item_id: string
          notes: string | null
          quantity: number
          recorded_by: string | null
          session_id: string
          total_amount: number
          unit_price: number
          updated_at: string
        }
        Insert: {
          brother_id: string
          created_at?: string
          id?: string
          menu_item_id: string
          notes?: string | null
          quantity?: number
          recorded_by?: string | null
          session_id: string
          total_amount: number
          unit_price: number
          updated_at?: string
        }
        Update: {
          brother_id?: string
          created_at?: string
          id?: string
          menu_item_id?: string
          notes?: string | null
          quantity?: number
          recorded_by?: string | null
          session_id?: string
          total_amount?: number
          unit_price?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "agape_consumptions_brother_id_fkey"
            columns: ["brother_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "agape_consumptions_menu_item_id_fkey"
            columns: ["menu_item_id"]
            isOneToOne: false
            referencedRelation: "agape_menu_items"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "agape_consumptions_recorded_by_fkey"
            columns: ["recorded_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "agape_consumptions_session_id_fkey"
            columns: ["session_id"]
            isOneToOne: false
            referencedRelation: "agape_sessions"
            referencedColumns: ["id"]
          },
        ]
      }
      agape_menu_items: {
        Row: {
          category: string | null
          created_at: string
          description: string | null
          id: string
          image_url: string | null
          is_active: boolean | null
          name: string
          price: number
          updated_at: string
        }
        Insert: {
          category?: string | null
          created_at?: string
          description?: string | null
          id?: string
          image_url?: string | null
          is_active?: boolean | null
          name: string
          price: number
          updated_at?: string
        }
        Update: {
          category?: string | null
          created_at?: string
          description?: string | null
          id?: string
          image_url?: string | null
          is_active?: boolean | null
          name?: string
          price?: number
          updated_at?: string
        }
        Relationships: []
      }
      agape_monthly_closings: {
        Row: {
          closed_at: string | null
          closed_by: string | null
          created_at: string
          id: string
          month: number
          notes: string | null
          status: string
          total_beverages_spent: number | null
          total_consumed: number
          total_paid: number
          updated_at: string
          year: number
        }
        Insert: {
          closed_at?: string | null
          closed_by?: string | null
          created_at?: string
          id?: string
          month: number
          notes?: string | null
          status?: string
          total_beverages_spent?: number | null
          total_consumed?: number
          total_paid?: number
          updated_at?: string
          year: number
        }
        Update: {
          closed_at?: string | null
          closed_by?: string | null
          created_at?: string
          id?: string
          month?: number
          notes?: string | null
          status?: string
          total_beverages_spent?: number | null
          total_consumed?: number
          total_paid?: number
          updated_at?: string
          year?: number
        }
        Relationships: [
          {
            foreignKeyName: "agape_monthly_closings_closed_by_fkey"
            columns: ["closed_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      agape_sessions: {
        Row: {
          created_at: string
          created_by: string | null
          date: string
          description: string | null
          event_id: string | null
          id: string
          source: string
          status: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          date: string
          description?: string | null
          event_id?: string | null
          id?: string
          source?: string
          status?: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          created_by?: string | null
          date?: string
          description?: string | null
          event_id?: string | null
          id?: string
          source?: string
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "agape_sessions_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "agape_sessions_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "events"
            referencedColumns: ["id"]
          },
        ]
      }
      announcements: {
        Row: {
          author_id: string | null
          author_name: string
          content: string
          created_at: string
          id: string
          is_private: boolean
          title: string
          updated_at: string
        }
        Insert: {
          author_id?: string | null
          author_name: string
          content: string
          created_at?: string
          id?: string
          is_private?: boolean
          title: string
          updated_at?: string
        }
        Update: {
          author_id?: string | null
          author_name?: string
          content?: string
          created_at?: string
          id?: string
          is_private?: boolean
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
      attendance: {
        Row: {
          brother_id: string
          created_at: string
          id: string
          justification: string | null
          session_record_id: string
          source: string | null
          status: string
          updated_at: string
        }
        Insert: {
          brother_id: string
          created_at?: string
          id?: string
          justification?: string | null
          session_record_id: string
          source?: string | null
          status?: string
          updated_at?: string
        }
        Update: {
          brother_id?: string
          created_at?: string
          id?: string
          justification?: string | null
          session_record_id?: string
          source?: string | null
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "attendance_brother_id_fkey"
            columns: ["brother_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "attendance_session_record_id_fkey"
            columns: ["session_record_id"]
            isOneToOne: false
            referencedRelation: "session_records"
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
      bank_accounts: {
        Row: {
          color: string | null
          created_at: string
          id: string
          initial_balance: number
          name: string
          type: string
          updated_at: string
        }
        Insert: {
          color?: string | null
          created_at?: string
          id?: string
          initial_balance?: number
          name: string
          type: string
          updated_at?: string
        }
        Update: {
          color?: string | null
          created_at?: string
          id?: string
          initial_balance?: number
          name?: string
          type?: string
          updated_at?: string
        }
        Relationships: []
      }
      brother_ceremony_payment_installments: {
        Row: {
          account_id: string | null
          amount: number
          created_at: string
          due_date: string | null
          id: string
          installment_number: number
          notes: string | null
          payment_date: string | null
          plan_id: string
          recorded_by: string | null
          status: string
          transaction_id: string | null
          updated_at: string
        }
        Insert: {
          account_id?: string | null
          amount: number
          created_at?: string
          due_date?: string | null
          id?: string
          installment_number: number
          notes?: string | null
          payment_date?: string | null
          plan_id: string
          recorded_by?: string | null
          status?: string
          transaction_id?: string | null
          updated_at?: string
        }
        Update: {
          account_id?: string | null
          amount?: number
          created_at?: string
          due_date?: string | null
          id?: string
          installment_number?: number
          notes?: string | null
          payment_date?: string | null
          plan_id?: string
          recorded_by?: string | null
          status?: string
          transaction_id?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "brother_ceremony_payment_installments_account_id_fkey"
            columns: ["account_id"]
            isOneToOne: false
            referencedRelation: "financial_account_balances"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "brother_ceremony_payment_installments_account_id_fkey"
            columns: ["account_id"]
            isOneToOne: false
            referencedRelation: "financial_accounts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "brother_ceremony_payment_installments_plan_id_fkey"
            columns: ["plan_id"]
            isOneToOne: false
            referencedRelation: "brother_ceremony_payment_plans"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "brother_ceremony_payment_installments_recorded_by_fkey"
            columns: ["recorded_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "brother_ceremony_payment_installments_transaction_id_fkey"
            columns: ["transaction_id"]
            isOneToOne: false
            referencedRelation: "financial_transactions"
            referencedColumns: ["id"]
          },
        ]
      }
      brother_ceremony_payment_plans: {
        Row: {
          brother_id: string
          ceremony_date: string | null
          created_at: string
          description: string | null
          id: string
          installments_count: number
          payment_type: string
          recorded_by: string | null
          status: string
          total_amount: number
          updated_at: string
        }
        Insert: {
          brother_id: string
          ceremony_date?: string | null
          created_at?: string
          description?: string | null
          id?: string
          installments_count?: number
          payment_type: string
          recorded_by?: string | null
          status?: string
          total_amount: number
          updated_at?: string
        }
        Update: {
          brother_id?: string
          ceremony_date?: string | null
          created_at?: string
          description?: string | null
          id?: string
          installments_count?: number
          payment_type?: string
          recorded_by?: string | null
          status?: string
          total_amount?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "brother_ceremony_payment_plans_brother_id_fkey"
            columns: ["brother_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "brother_ceremony_payment_plans_recorded_by_fkey"
            columns: ["recorded_by"]
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
          cim: string | null
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
          membership_situation: string
          name: string
          notes: string | null
          obedience: string | null
          origin_lodge: string | null
          origin_lodge_number: string | null
          phone: string
          photo_url: string | null
          profile_id: string | null
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
          cim?: string | null
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
          membership_situation?: string
          name: string
          notes?: string | null
          obedience?: string | null
          origin_lodge?: string | null
          origin_lodge_number?: string | null
          phone: string
          photo_url?: string | null
          profile_id?: string | null
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
          cim?: string | null
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
          membership_situation?: string
          name?: string
          notes?: string | null
          obedience?: string | null
          origin_lodge?: string | null
          origin_lodge_number?: string | null
          phone?: string
          photo_url?: string | null
          profile_id?: string | null
          regular_status?: string | null
          role?: string
          spouse_dob?: string | null
          spouse_name?: string | null
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "brothers_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      budgets: {
        Row: {
          amount: number
          category_id: string | null
          created_at: string
          end_date: string | null
          id: string
          name: string
          period: string
          start_date: string | null
          type: string
          updated_at: string
        }
        Insert: {
          amount: number
          category_id?: string | null
          created_at?: string
          end_date?: string | null
          id?: string
          name: string
          period: string
          start_date?: string | null
          type: string
          updated_at?: string
        }
        Update: {
          amount?: number
          category_id?: string | null
          created_at?: string
          end_date?: string | null
          id?: string
          name?: string
          period?: string
          start_date?: string | null
          type?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "budgets_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "financial_categories"
            referencedColumns: ["id"]
          },
        ]
      }
      candidate_phase_progress: {
        Row: {
          candidate_id: string
          completed_at: string | null
          created_at: string
          id: string
          notes: string | null
          phase_definition_id: string
          started_at: string | null
          status: string
          updated_at: string
        }
        Insert: {
          candidate_id: string
          completed_at?: string | null
          created_at?: string
          id?: string
          notes?: string | null
          phase_definition_id: string
          started_at?: string | null
          status?: string
          updated_at?: string
        }
        Update: {
          candidate_id?: string
          completed_at?: string | null
          created_at?: string
          id?: string
          notes?: string | null
          phase_definition_id?: string
          started_at?: string | null
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "candidate_phase_progress_candidate_id_fkey"
            columns: ["candidate_id"]
            isOneToOne: false
            referencedRelation: "initiation_candidates"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "candidate_phase_progress_phase_definition_id_fkey"
            columns: ["phase_definition_id"]
            isOneToOne: false
            referencedRelation: "sindicancia_phase_definitions"
            referencedColumns: ["id"]
          },
        ]
      }
      charity_donations: {
        Row: {
          amount: number
          brother_id: string
          created_at: string
          description: string | null
          id: string
          updated_at: string
        }
        Insert: {
          amount: number
          brother_id: string
          created_at?: string
          description?: string | null
          id?: string
          updated_at?: string
        }
        Update: {
          amount?: number
          brother_id?: string
          created_at?: string
          description?: string | null
          id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "charity_donations_brother_id_fkey"
            columns: ["brother_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      checkin_tokens: {
        Row: {
          created_at: string
          expires_at: string
          id: string
          session_record_id: string
          token: string
        }
        Insert: {
          created_at?: string
          expires_at: string
          id?: string
          session_record_id: string
          token?: string
        }
        Update: {
          created_at?: string
          expires_at?: string
          id?: string
          session_record_id?: string
          token?: string
        }
        Relationships: [
          {
            foreignKeyName: "checkin_tokens_session_record_id_fkey"
            columns: ["session_record_id"]
            isOneToOne: false
            referencedRelation: "session_records"
            referencedColumns: ["id"]
          },
        ]
      }
      contact_messages: {
        Row: {
          category: string | null
          created_at: string
          email: string
          id: string
          message: string
          name: string
          replied_at: string | null
          replied_by: string | null
          reply_text: string | null
          status: string
          updated_at: string
        }
        Insert: {
          category?: string | null
          created_at?: string
          email: string
          id?: string
          message: string
          name: string
          replied_at?: string | null
          replied_by?: string | null
          reply_text?: string | null
          status?: string
          updated_at?: string
        }
        Update: {
          category?: string | null
          created_at?: string
          email?: string
          id?: string
          message?: string
          name?: string
          replied_at?: string | null
          replied_by?: string | null
          reply_text?: string | null
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "contact_messages_replied_by_fkey"
            columns: ["replied_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      contributions: {
        Row: {
          account_id: string | null
          amount: number
          brother_id: string
          created_at: string
          id: string
          month: number
          notes: string | null
          payment_date: string | null
          recorded_by: string | null
          status: string
          transaction_id: string | null
          updated_at: string
          year: number
        }
        Insert: {
          account_id?: string | null
          amount: number
          brother_id: string
          created_at?: string
          id?: string
          month: number
          notes?: string | null
          payment_date?: string | null
          recorded_by?: string | null
          status?: string
          transaction_id?: string | null
          updated_at?: string
          year: number
        }
        Update: {
          account_id?: string | null
          amount?: number
          brother_id?: string
          created_at?: string
          id?: string
          month?: number
          notes?: string | null
          payment_date?: string | null
          recorded_by?: string | null
          status?: string
          transaction_id?: string | null
          updated_at?: string
          year?: number
        }
        Relationships: [
          {
            foreignKeyName: "contributions_account_id_fkey"
            columns: ["account_id"]
            isOneToOne: false
            referencedRelation: "financial_account_balances"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "contributions_account_id_fkey"
            columns: ["account_id"]
            isOneToOne: false
            referencedRelation: "financial_accounts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "contributions_brother_id_fkey"
            columns: ["brother_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "contributions_recorded_by_fkey"
            columns: ["recorded_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "contributions_transaction_id_fkey"
            columns: ["transaction_id"]
            isOneToOne: false
            referencedRelation: "financial_transactions"
            referencedColumns: ["id"]
          },
        ]
      }
      essential_links: {
        Row: {
          created_at: string
          icon_name: string
          id: string
          is_active: boolean
          sort_order: number
          title: string
          updated_at: string
          url: string
        }
        Insert: {
          created_at?: string
          icon_name?: string
          id?: string
          is_active?: boolean
          sort_order?: number
          title: string
          updated_at?: string
          url: string
        }
        Update: {
          created_at?: string
          icon_name?: string
          id?: string
          is_active?: boolean
          sort_order?: number
          title?: string
          updated_at?: string
          url?: string
        }
        Relationships: []
      }
      event_generation_batches: {
        Row: {
          created_at: string
          created_by: string | null
          first_date: string | null
          id: string
          last_date: string | null
          sessions_count: number
          undone_at: string | null
          undone_by: string | null
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          first_date?: string | null
          id?: string
          last_date?: string | null
          sessions_count?: number
          undone_at?: string | null
          undone_by?: string | null
        }
        Update: {
          created_at?: string
          created_by?: string | null
          first_date?: string | null
          id?: string
          last_date?: string | null
          sessions_count?: number
          undone_at?: string | null
          undone_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "event_generation_batches_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "event_generation_batches_undone_by_fkey"
            columns: ["undone_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      events: {
        Row: {
          created_at: string
          date: string
          degree: string | null
          description: string | null
          generated_batch_id: string | null
          id: string
          is_auto_generated: boolean
          location: string
          location_id: string | null
          time: string
          title: string
          type: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          date: string
          degree?: string | null
          description?: string | null
          generated_batch_id?: string | null
          id?: string
          is_auto_generated?: boolean
          location: string
          location_id?: string | null
          time: string
          title: string
          type?: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          date?: string
          degree?: string | null
          description?: string | null
          generated_batch_id?: string | null
          id?: string
          is_auto_generated?: boolean
          location?: string
          location_id?: string | null
          time?: string
          title?: string
          type?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "events_generated_batch_id_fkey"
            columns: ["generated_batch_id"]
            isOneToOne: false
            referencedRelation: "event_generation_batches"
            referencedColumns: ["id"]
          },
        ]
      }
      financial_account_reconciliation_extrato: {
        Row: {
          account_id: string
          extrato_balance: number | null
          note: string | null
          updated_at: string
          updated_by: string | null
        }
        Insert: {
          account_id: string
          extrato_balance?: number | null
          note?: string | null
          updated_at?: string
          updated_by?: string | null
        }
        Update: {
          account_id?: string
          extrato_balance?: number | null
          note?: string | null
          updated_at?: string
          updated_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "financial_account_reconciliation_extrato_account_id_fkey"
            columns: ["account_id"]
            isOneToOne: true
            referencedRelation: "financial_account_balances"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "financial_account_reconciliation_extrato_account_id_fkey"
            columns: ["account_id"]
            isOneToOne: true
            referencedRelation: "financial_accounts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "financial_account_reconciliation_extrato_updated_by_fkey"
            columns: ["updated_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      financial_accounts: {
        Row: {
          color: string | null
          created_at: string
          created_by: string | null
          id: string
          initial_balance: number
          name: string
          type: string
          updated_at: string
        }
        Insert: {
          color?: string | null
          created_at?: string
          created_by?: string | null
          id?: string
          initial_balance?: number
          name: string
          type: string
          updated_at?: string
        }
        Update: {
          color?: string | null
          created_at?: string
          created_by?: string | null
          id?: string
          initial_balance?: number
          name?: string
          type?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "financial_accounts_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      financial_audit_log: {
        Row: {
          action: string
          changed_at: string
          changed_by: string | null
          id: string
          new_values: Json | null
          old_values: Json | null
          record_id: string
          table_name: string
        }
        Insert: {
          action: string
          changed_at?: string
          changed_by?: string | null
          id?: string
          new_values?: Json | null
          old_values?: Json | null
          record_id: string
          table_name: string
        }
        Update: {
          action?: string
          changed_at?: string
          changed_by?: string | null
          id?: string
          new_values?: Json | null
          old_values?: Json | null
          record_id?: string
          table_name?: string
        }
        Relationships: [
          {
            foreignKeyName: "financial_audit_log_changed_by_fkey"
            columns: ["changed_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      financial_budgets: {
        Row: {
          amount: number
          category: string
          created_at: string
          created_by: string | null
          description: string | null
          id: string
          period_end: string
          period_start: string
          updated_at: string
        }
        Insert: {
          amount: number
          category: string
          created_at?: string
          created_by?: string | null
          description?: string | null
          id?: string
          period_end: string
          period_start: string
          updated_at?: string
        }
        Update: {
          amount?: number
          category?: string
          created_at?: string
          created_by?: string | null
          description?: string | null
          id?: string
          period_end?: string
          period_start?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "financial_budgets_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      financial_categories: {
        Row: {
          color: string | null
          created_at: string
          created_by: string | null
          description: string | null
          id: string
          name: string
          type: string
          updated_at: string
        }
        Insert: {
          color?: string | null
          created_at?: string
          created_by?: string | null
          description?: string | null
          id?: string
          name: string
          type: string
          updated_at?: string
        }
        Update: {
          color?: string | null
          created_at?: string
          created_by?: string | null
          description?: string | null
          id?: string
          name?: string
          type?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "financial_categories_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      financial_forecast_items: {
        Row: {
          category_id: string | null
          created_at: string
          created_by: string | null
          description: string
          due_day: number
          expected_amount: number
          id: string
          is_active: boolean
          notes: string | null
          preferred_account_id: string | null
          recurrence: string
          recurrence_month: number | null
          sort_order: number
          type: string
          updated_at: string
        }
        Insert: {
          category_id?: string | null
          created_at?: string
          created_by?: string | null
          description: string
          due_day: number
          expected_amount: number
          id?: string
          is_active?: boolean
          notes?: string | null
          preferred_account_id?: string | null
          recurrence?: string
          recurrence_month?: number | null
          sort_order?: number
          type: string
          updated_at?: string
        }
        Update: {
          category_id?: string | null
          created_at?: string
          created_by?: string | null
          description?: string
          due_day?: number
          expected_amount?: number
          id?: string
          is_active?: boolean
          notes?: string | null
          preferred_account_id?: string | null
          recurrence?: string
          recurrence_month?: number | null
          sort_order?: number
          type?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "financial_forecast_items_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "financial_categories"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "financial_forecast_items_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "financial_forecast_items_preferred_account_id_fkey"
            columns: ["preferred_account_id"]
            isOneToOne: false
            referencedRelation: "financial_account_balances"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "financial_forecast_items_preferred_account_id_fkey"
            columns: ["preferred_account_id"]
            isOneToOne: false
            referencedRelation: "financial_accounts"
            referencedColumns: ["id"]
          },
        ]
      }
      financial_forecast_month_overrides: {
        Row: {
          created_at: string
          created_by: string | null
          expected_amount_override: number
          forecast_item_id: string
          id: string
          month: number
          notes: string | null
          updated_at: string
          year: number
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          expected_amount_override: number
          forecast_item_id: string
          id?: string
          month: number
          notes?: string | null
          updated_at?: string
          year: number
        }
        Update: {
          created_at?: string
          created_by?: string | null
          expected_amount_override?: number
          forecast_item_id?: string
          id?: string
          month?: number
          notes?: string | null
          updated_at?: string
          year?: number
        }
        Relationships: [
          {
            foreignKeyName: "financial_forecast_month_overrides_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "financial_forecast_month_overrides_forecast_item_id_fkey"
            columns: ["forecast_item_id"]
            isOneToOne: false
            referencedRelation: "financial_forecast_items"
            referencedColumns: ["id"]
          },
        ]
      }
      financial_goals: {
        Row: {
          created_at: string
          created_by: string | null
          current_amount: number | null
          deadline: string
          description: string | null
          id: string
          linked_category_id: string | null
          name: string
          status: string | null
          target_amount: number
          title: string | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          current_amount?: number | null
          deadline: string
          description?: string | null
          id?: string
          linked_category_id?: string | null
          name: string
          status?: string | null
          target_amount: number
          title?: string | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          created_by?: string | null
          current_amount?: number | null
          deadline?: string
          description?: string | null
          id?: string
          linked_category_id?: string | null
          name?: string
          status?: string | null
          target_amount?: number
          title?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "financial_goals_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "financial_goals_linked_category_id_fkey"
            columns: ["linked_category_id"]
            isOneToOne: false
            referencedRelation: "financial_categories"
            referencedColumns: ["id"]
          },
        ]
      }
      financial_membership_forecast_overrides: {
        Row: {
          created_at: string
          created_by: string | null
          expected_amount_override: number
          id: string
          month: number
          notes: string | null
          updated_at: string
          year: number
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          expected_amount_override: number
          id?: string
          month: number
          notes?: string | null
          updated_at?: string
          year: number
        }
        Update: {
          created_at?: string
          created_by?: string | null
          expected_amount_override?: number
          id?: string
          month?: number
          notes?: string | null
          updated_at?: string
          year?: number
        }
        Relationships: [
          {
            foreignKeyName: "financial_membership_forecast_overrides_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      financial_payables: {
        Row: {
          account_id: string | null
          amount: number
          category_id: string
          created_at: string
          created_by: string | null
          description: string
          document_reference: string | null
          due_date: string
          forecast_item_id: string | null
          id: string
          notes: string | null
          payment_date: string | null
          status: string
          supplier_name: string | null
          transaction_id: string | null
          updated_at: string
        }
        Insert: {
          account_id?: string | null
          amount: number
          category_id: string
          created_at?: string
          created_by?: string | null
          description: string
          document_reference?: string | null
          due_date: string
          forecast_item_id?: string | null
          id?: string
          notes?: string | null
          payment_date?: string | null
          status?: string
          supplier_name?: string | null
          transaction_id?: string | null
          updated_at?: string
        }
        Update: {
          account_id?: string | null
          amount?: number
          category_id?: string
          created_at?: string
          created_by?: string | null
          description?: string
          document_reference?: string | null
          due_date?: string
          forecast_item_id?: string | null
          id?: string
          notes?: string | null
          payment_date?: string | null
          status?: string
          supplier_name?: string | null
          transaction_id?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "financial_payables_account_id_fkey"
            columns: ["account_id"]
            isOneToOne: false
            referencedRelation: "financial_account_balances"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "financial_payables_account_id_fkey"
            columns: ["account_id"]
            isOneToOne: false
            referencedRelation: "financial_accounts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "financial_payables_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "financial_categories"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "financial_payables_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "financial_payables_forecast_item_id_fkey"
            columns: ["forecast_item_id"]
            isOneToOne: false
            referencedRelation: "financial_forecast_items"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "financial_payables_transaction_id_fkey"
            columns: ["transaction_id"]
            isOneToOne: false
            referencedRelation: "financial_transactions"
            referencedColumns: ["id"]
          },
        ]
      }
      financial_reconciliation_alert_acknowledgments: {
        Row: {
          acknowledged_at: string
          acknowledged_by: string | null
          alert_key: string
          alert_type: string
          id: string
          note: string | null
          transaction_fingerprint: string
        }
        Insert: {
          acknowledged_at?: string
          acknowledged_by?: string | null
          alert_key: string
          alert_type: string
          id?: string
          note?: string | null
          transaction_fingerprint: string
        }
        Update: {
          acknowledged_at?: string
          acknowledged_by?: string | null
          alert_key?: string
          alert_type?: string
          id?: string
          note?: string | null
          transaction_fingerprint?: string
        }
        Relationships: [
          {
            foreignKeyName: "financial_reconciliation_alert_acknowledgm_acknowledged_by_fkey"
            columns: ["acknowledged_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      financial_transaction_attachments: {
        Row: {
          created_at: string
          document_type: string
          file_name: string
          file_path: string
          file_size: number
          id: string
          mime_type: string
          thumbnail_path: string | null
          transaction_id: string
          uploaded_by: string | null
        }
        Insert: {
          created_at?: string
          document_type: string
          file_name: string
          file_path: string
          file_size: number
          id?: string
          mime_type: string
          thumbnail_path?: string | null
          transaction_id: string
          uploaded_by?: string | null
        }
        Update: {
          created_at?: string
          document_type?: string
          file_name?: string
          file_path?: string
          file_size?: number
          id?: string
          mime_type?: string
          thumbnail_path?: string | null
          transaction_id?: string
          uploaded_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "financial_transaction_attachments_transaction_id_fkey"
            columns: ["transaction_id"]
            isOneToOne: false
            referencedRelation: "financial_transactions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "financial_transaction_attachments_uploaded_by_fkey"
            columns: ["uploaded_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      financial_transactions: {
        Row: {
          account_id: string | null
          amount: number
          attachment_notes: string | null
          category: string | null
          category_id: string
          created_at: string
          created_by: string | null
          date: string
          description: string
          forecast_item_id: string | null
          id: string
          idempotency_key: string | null
          is_control_only: boolean
          type: string
          updated_at: string
        }
        Insert: {
          account_id?: string | null
          amount: number
          attachment_notes?: string | null
          category?: string | null
          category_id: string
          created_at?: string
          created_by?: string | null
          date: string
          description: string
          forecast_item_id?: string | null
          id?: string
          idempotency_key?: string | null
          is_control_only?: boolean
          type: string
          updated_at?: string
        }
        Update: {
          account_id?: string | null
          amount?: number
          attachment_notes?: string | null
          category?: string | null
          category_id?: string
          created_at?: string
          created_by?: string | null
          date?: string
          description?: string
          forecast_item_id?: string | null
          id?: string
          idempotency_key?: string | null
          is_control_only?: boolean
          type?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "financial_transactions_account_id_fkey"
            columns: ["account_id"]
            isOneToOne: false
            referencedRelation: "financial_account_balances"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "financial_transactions_account_id_fkey"
            columns: ["account_id"]
            isOneToOne: false
            referencedRelation: "financial_accounts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "financial_transactions_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "financial_categories"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "financial_transactions_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "financial_transactions_forecast_item_id_fkey"
            columns: ["forecast_item_id"]
            isOneToOne: false
            referencedRelation: "financial_forecast_items"
            referencedColumns: ["id"]
          },
        ]
      }
      initiation_candidates: {
        Row: {
          created_at: string
          email: string | null
          id: string
          indicated_by: string
          indication_date: string
          name: string
          notes: string | null
          phone: string | null
          status: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          email?: string | null
          id?: string
          indicated_by: string
          indication_date?: string
          name: string
          notes?: string | null
          phone?: string | null
          status?: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          email?: string | null
          id?: string
          indicated_by?: string
          indication_date?: string
          name?: string
          notes?: string | null
          phone?: string | null
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
      library_items: {
        Row: {
          added_at: string
          created_at: string
          degree: string
          file_name: string | null
          file_size: number | null
          file_url: string
          id: string
          title: string
          type: string
          updated_at: string
          uploaded_by: string | null
        }
        Insert: {
          added_at?: string
          created_at?: string
          degree: string
          file_name?: string | null
          file_size?: number | null
          file_url: string
          id?: string
          title: string
          type: string
          updated_at?: string
          uploaded_by?: string | null
        }
        Update: {
          added_at?: string
          created_at?: string
          degree?: string
          file_name?: string | null
          file_size?: number | null
          file_url?: string
          id?: string
          title?: string
          type?: string
          updated_at?: string
          uploaded_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "library_items_uploaded_by_fkey"
            columns: ["uploaded_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      lodge_documents: {
        Row: {
          category: string
          created_at: string
          description: string | null
          file_name: string
          file_size: number | null
          file_type: string | null
          file_url: string
          id: string
          title: string
          updated_at: string
          upload_date: string
          uploaded_by: string | null
        }
        Insert: {
          category: string
          created_at?: string
          description?: string | null
          file_name: string
          file_size?: number | null
          file_type?: string | null
          file_url: string
          id?: string
          title: string
          updated_at?: string
          upload_date?: string
          uploaded_by?: string | null
        }
        Update: {
          category?: string
          created_at?: string
          description?: string | null
          file_name?: string
          file_size?: number | null
          file_type?: string | null
          file_url?: string
          id?: string
          title?: string
          updated_at?: string
          upload_date?: string
          uploaded_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "lodge_documents_uploaded_by_fkey"
            columns: ["uploaded_by"]
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
      membership_reminder_runs: {
        Row: {
          alerts_count: number
          error: string | null
          failed_count: number
          finished_at: string | null
          id: string
          message: string | null
          sent_count: number
          skipped_count: number
          source: string
          started_at: string
        }
        Insert: {
          alerts_count?: number
          error?: string | null
          failed_count?: number
          finished_at?: string | null
          id?: string
          message?: string | null
          sent_count?: number
          skipped_count?: number
          source: string
          started_at?: string
        }
        Update: {
          alerts_count?: number
          error?: string | null
          failed_count?: number
          finished_at?: string | null
          id?: string
          message?: string | null
          sent_count?: number
          skipped_count?: number
          source?: string
          started_at?: string
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
      payable_reminder_logs: {
        Row: {
          created_at: string
          id: string
          payable_id: string
          recipient_email: string
          sent_date: string
        }
        Insert: {
          created_at?: string
          id?: string
          payable_id: string
          recipient_email: string
          sent_date?: string
        }
        Update: {
          created_at?: string
          id?: string
          payable_id?: string
          recipient_email?: string
          sent_date?: string
        }
        Relationships: [
          {
            foreignKeyName: "payable_reminder_logs_payable_id_fkey"
            columns: ["payable_id"]
            isOneToOne: false
            referencedRelation: "financial_payables"
            referencedColumns: ["id"]
          },
        ]
      }
      payable_reminder_runs: {
        Row: {
          alerts_count: number
          error: string | null
          failed_count: number
          finished_at: string | null
          id: string
          message: string | null
          sent_count: number
          skipped_count: number
          source: string
          started_at: string
        }
        Insert: {
          alerts_count?: number
          error?: string | null
          failed_count?: number
          finished_at?: string | null
          id?: string
          message?: string | null
          sent_count?: number
          skipped_count?: number
          source?: string
          started_at?: string
        }
        Update: {
          alerts_count?: number
          error?: string | null
          failed_count?: number
          finished_at?: string | null
          id?: string
          message?: string | null
          sent_count?: number
          skipped_count?: number
          source?: string
          started_at?: string
        }
        Relationships: []
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
      reminder_logs: {
        Row: {
          brother_id: string
          contribution_id: string | null
          created_at: string
          id: string
          method: string
          sent_date: string
        }
        Insert: {
          brother_id: string
          contribution_id?: string | null
          created_at?: string
          id?: string
          method: string
          sent_date?: string
        }
        Update: {
          brother_id?: string
          contribution_id?: string | null
          created_at?: string
          id?: string
          method?: string
          sent_date?: string
        }
        Relationships: [
          {
            foreignKeyName: "reminder_logs_brother_id_fkey"
            columns: ["brother_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "reminder_logs_contribution_id_fkey"
            columns: ["contribution_id"]
            isOneToOne: false
            referencedRelation: "contributions"
            referencedColumns: ["id"]
          },
        ]
      }
      session_records: {
        Row: {
          charity_collection: number | null
          created_at: string
          date: string
          event_id: string
          id: string
          observations: string | null
          status: string
          updated_at: string
        }
        Insert: {
          charity_collection?: number | null
          created_at?: string
          date: string
          event_id: string
          id?: string
          observations?: string | null
          status?: string
          updated_at?: string
        }
        Update: {
          charity_collection?: number | null
          created_at?: string
          date?: string
          event_id?: string
          id?: string
          observations?: string | null
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "session_records_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "events"
            referencedColumns: ["id"]
          },
        ]
      }
      sindicancia_phase_definitions: {
        Row: {
          created_at: string
          description: string | null
          id: string
          name: string
          order: number
        }
        Insert: {
          created_at?: string
          description?: string | null
          id?: string
          name: string
          order?: number
        }
        Update: {
          created_at?: string
          description?: string | null
          id?: string
          name?: string
          order?: number
        }
        Relationships: []
      }
      site_settings: {
        Row: {
          checkin_open_minutes_before: number | null
          checkin_radius_meters: number | null
          checkin_temple_url: string | null
          contact_address: string | null
          contact_city: string | null
          contact_email: string | null
          contact_message_email: string | null
          contact_phone: string | null
          contact_secondary_email: string | null
          contact_zip: string | null
          created_at: string
          custom_sections: Json | null
          favicon_url: string | null
          font_family: string | null
          hero_card_bg_url: string | null
          history_image_url: string | null
          history_text: string | null
          history_title: string | null
          home_banner_url: string | null
          id: number
          logo_url: string | null
          membership_fee_amount: number | null
          membership_fee_base_amount: number | null
          membership_fee_due_day: number | null
          membership_fee_session_package_amount: number | null
          membership_reminder_days: number
          membership_reminder_enabled: boolean
          membership_reminder_frequency: string
          meta_description: string | null
          payable_reminder_days: number
          payable_reminder_enabled: boolean
          payable_reminder_frequency: string
          primary_color: string | null
          secondary_color: string | null
          section_order: Json | null
          session_default_location_id: string
          session_default_time: string
          session_default_title: string
          session_months_ahead: number
          session_temple_name: string | null
          session_weekday: number
          session_weeks_of_month: Json
          site_title: string | null
          temple_latitude: number | null
          temple_longitude: number | null
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
          checkin_open_minutes_before?: number | null
          checkin_radius_meters?: number | null
          checkin_temple_url?: string | null
          contact_address?: string | null
          contact_city?: string | null
          contact_email?: string | null
          contact_message_email?: string | null
          contact_phone?: string | null
          contact_secondary_email?: string | null
          contact_zip?: string | null
          created_at?: string
          custom_sections?: Json | null
          favicon_url?: string | null
          font_family?: string | null
          hero_card_bg_url?: string | null
          history_image_url?: string | null
          history_text?: string | null
          history_title?: string | null
          home_banner_url?: string | null
          id?: number
          logo_url?: string | null
          membership_fee_amount?: number | null
          membership_fee_base_amount?: number | null
          membership_fee_due_day?: number | null
          membership_fee_session_package_amount?: number | null
          membership_reminder_days?: number
          membership_reminder_enabled?: boolean
          membership_reminder_frequency?: string
          meta_description?: string | null
          payable_reminder_days?: number
          payable_reminder_enabled?: boolean
          payable_reminder_frequency?: string
          primary_color?: string | null
          secondary_color?: string | null
          section_order?: Json | null
          session_default_location_id?: string
          session_default_time?: string
          session_default_title?: string
          session_months_ahead?: number
          session_temple_name?: string | null
          session_weekday?: number
          session_weeks_of_month?: Json
          site_title?: string | null
          temple_latitude?: number | null
          temple_longitude?: number | null
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
          checkin_open_minutes_before?: number | null
          checkin_radius_meters?: number | null
          checkin_temple_url?: string | null
          contact_address?: string | null
          contact_city?: string | null
          contact_email?: string | null
          contact_message_email?: string | null
          contact_phone?: string | null
          contact_secondary_email?: string | null
          contact_zip?: string | null
          created_at?: string
          custom_sections?: Json | null
          favicon_url?: string | null
          font_family?: string | null
          hero_card_bg_url?: string | null
          history_image_url?: string | null
          history_text?: string | null
          history_title?: string | null
          home_banner_url?: string | null
          id?: number
          logo_url?: string | null
          membership_fee_amount?: number | null
          membership_fee_base_amount?: number | null
          membership_fee_due_day?: number | null
          membership_fee_session_package_amount?: number | null
          membership_reminder_days?: number
          membership_reminder_enabled?: boolean
          membership_reminder_frequency?: string
          meta_description?: string | null
          payable_reminder_days?: number
          payable_reminder_enabled?: boolean
          payable_reminder_frequency?: string
          primary_color?: string | null
          secondary_color?: string | null
          section_order?: Json | null
          session_default_location_id?: string
          session_default_time?: string
          session_default_title?: string
          session_months_ahead?: number
          session_temple_name?: string | null
          session_weekday?: number
          session_weeks_of_month?: Json
          site_title?: string | null
          temple_latitude?: number | null
          temple_longitude?: number | null
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
      temple_sales: {
        Row: {
          account_id: string | null
          amount: number
          brother_id: string
          created_at: string
          description: string
          due_date: string | null
          id: string
          notes: string | null
          payment_date: string | null
          payment_mode: string
          recorded_by: string | null
          sale_date: string
          status: string
          transaction_id: string | null
          updated_at: string
        }
        Insert: {
          account_id?: string | null
          amount: number
          brother_id: string
          created_at?: string
          description: string
          due_date?: string | null
          id?: string
          notes?: string | null
          payment_date?: string | null
          payment_mode?: string
          recorded_by?: string | null
          sale_date?: string
          status?: string
          transaction_id?: string | null
          updated_at?: string
        }
        Update: {
          account_id?: string | null
          amount?: number
          brother_id?: string
          created_at?: string
          description?: string
          due_date?: string | null
          id?: string
          notes?: string | null
          payment_date?: string | null
          payment_mode?: string
          recorded_by?: string | null
          sale_date?: string
          status?: string
          transaction_id?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "temple_sales_account_id_fkey"
            columns: ["account_id"]
            isOneToOne: false
            referencedRelation: "financial_account_balances"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "temple_sales_account_id_fkey"
            columns: ["account_id"]
            isOneToOne: false
            referencedRelation: "financial_accounts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "temple_sales_brother_id_fkey"
            columns: ["brother_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "temple_sales_recorded_by_fkey"
            columns: ["recorded_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "temple_sales_transaction_id_fkey"
            columns: ["transaction_id"]
            isOneToOne: false
            referencedRelation: "financial_transactions"
            referencedColumns: ["id"]
          },
        ]
      }
      user_email_log: {
        Row: {
          email: string
          email_type: string
          profile_id: string
          sent_at: string
        }
        Insert: {
          email: string
          email_type: string
          profile_id: string
          sent_at?: string
        }
        Update: {
          email?: string
          email_type?: string
          profile_id?: string
          sent_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_email_log_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      venerables: {
        Row: {
          created_at: string
          id: string
          image_url: string | null
          mandate_order: number | null
          name: string
          period: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: string
          image_url?: string | null
          mandate_order?: number | null
          name: string
          period: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          image_url?: string | null
          mandate_order?: number | null
          name?: string
          period?: string
          updated_at?: string
        }
        Relationships: []
      }
      visitor_attendances: {
        Row: {
          created_at: string
          created_by: string | null
          degree: string
          id: string
          lodge: string
          lodge_number: string
          masonic_number: string | null
          name: string
          obedience: string
          session_record_id: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          degree: string
          id?: string
          lodge: string
          lodge_number: string
          masonic_number?: string | null
          name: string
          obedience: string
          session_record_id: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          created_by?: string | null
          degree?: string
          id?: string
          lodge?: string
          lodge_number?: string
          masonic_number?: string | null
          name?: string
          obedience?: string
          session_record_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "visitor_attendances_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      financial_account_balances: {
        Row: {
          color: string | null
          created_at: string | null
          current_balance: number | null
          id: string | null
          initial_balance: number | null
          name: string | null
          transaction_count: number | null
          type: string | null
          updated_at: string | null
        }
        Relationships: []
      }
      financial_category_totals: {
        Row: {
          average_amount: number | null
          category: string | null
          max_amount: number | null
          min_amount: number | null
          total_amount: number | null
          transaction_count: number | null
          type: string | null
        }
        Relationships: []
      }
      financial_monthly_summary: {
        Row: {
          month: string | null
          total_amount: number | null
          transaction_count: number | null
          type: string | null
        }
        Relationships: []
      }
    }
    Functions: {
      can_access_financial_attachments: {
        Args: { p_user_id?: string }
        Returns: boolean
      }
      can_approve_users: { Args: { p_user_id: string }; Returns: boolean }
      can_manage_agape: { Args: { p_user_id: string }; Returns: boolean }
      can_manage_agape_closing: {
        Args: { p_user_id: string }
        Returns: boolean
      }
      can_manage_chancellor_data: {
        Args: { p_user_id: string }
        Returns: boolean
      }
      can_manage_secretariat: { Args: { p_user_id: string }; Returns: boolean }
      can_manage_temple_sales: { Args: { p_user_id: string }; Returns: boolean }
      can_record_agape_consumption: {
        Args: { p_user_id: string }
        Returns: boolean
      }
      get_account_balance: {
        Args: { p_account_id: string; p_date?: string }
        Returns: number
      }
      get_agape_monthly_consumption_totals: {
        Args: { p_month: number; p_year: number }
        Returns: {
          brother_id: string
          brother_name: string
          total_amount: number
          total_items: number
        }[]
      }
      get_chancellor_brothers: {
        Args: never
        Returns: {
          attendance_rate: number
          cim: string | null
          degree: string
          elevation_date: string | null
          email: string
          exaltation_date: string | null
          id: string
          initiation_date: string
          membership_situation: string
          name: string
          profile_id: string | null
          role: string
          status: string
        }[]
      }
      get_brother_session_total: {
        Args: { p_brother_id: string; p_session_id: string }
        Returns: {
          total_amount: number
          total_items: number
        }[]
      }
      get_open_session_for_checkin: {
        Args: never
        Returns: {
          event_date: string
          event_id: string
          event_time: string
          session_record_id: string
        }[]
      }
      get_or_create_checkin_token: {
        Args: { p_session_record_id: string }
        Returns: string
      }
      get_period_totals: {
        Args: { p_end_date: string; p_start_date: string }
        Returns: {
          net_amount: number
          total_expense: number
          total_income: number
          transaction_count: number
        }[]
      }
      get_session_total: {
        Args: { p_session_id: string }
        Returns: {
          total_amount: number
          total_brothers: number
          total_items: number
        }[]
      }
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
      is_agape_financial_transaction: {
        Args: {
          p_tx: Database["public"]["Tables"]["financial_transactions"]["Row"]
        }
        Returns: boolean
      }
      is_approved_lodge_member: {
        Args: { p_user_id?: string }
        Returns: boolean
      }
      is_directorate_active: { Args: { p_user_id: string }; Returns: boolean }
      is_own_brother_row: {
        Args: { b: Database["public"]["Tables"]["brothers"]["Row"] }
        Returns: boolean
      }
      normalize_profile_masonic_degree: {
        Args: { deg: string }
        Returns: string
      }
      queue_membership_reminder_job: { Args: never; Returns: undefined }
      queue_payables_reminder_job: { Args: never; Returns: undefined }
      queue_user_lifecycle_email: {
        Args: {
          p_email: string
          p_full_name: string
          p_profile_id: string
          p_type: string
        }
        Returns: undefined
      }
      refresh_ceremony_plan_status: {
        Args: { p_plan_id: string }
        Returns: undefined
      }
      reset_agape_operational_data: {
        Args: never
        Returns: {
          charges_removed: number
          closings_removed: number
          consumptions_removed: number
          menu_items_removed: number
          sessions_removed: number
          transactions_removed: number
        }[]
      }
      update_brother_degree_info: {
        Args: {
          p_brother_id: string
          p_degree: string
          p_elevation_date: string | null
          p_exaltation_date: string | null
          p_initiation_date: string | null
        }
        Returns: undefined
      }
    }
    Enums: {
      app_role: "admin" | "editor" | "member"
      lodge_position_type:
        | "veneravel_mestre"
        | "orador"
        | "secretario"
        | "chanceler"
        | "tesoureiro"
        | "mestre_banquete"
        | "primeiro_vigilante"
        | "segundo_vigilante"
        | "mestre_cerimonias"
        | "mestre_harmonia"
        | "hospitaleiro"
      user_status:
        | "pending"
        | "approved"
        | "blocked"
        | "in_memoriam"
        | "adormecido"
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never) = never,
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
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
  EnumName extends (DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never) = never,
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
  CompositeTypeName extends (PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never) = never,
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
      app_role: ["admin", "editor", "member"],
      lodge_position_type: [
        "veneravel_mestre",
        "orador",
        "secretario",
        "chanceler",
        "tesoureiro",
        "mestre_banquete",
        "primeiro_vigilante",
        "segundo_vigilante",
        "mestre_cerimonias",
        "mestre_harmonia",
        "hospitaleiro",
      ],
      user_status: [
        "pending",
        "approved",
        "blocked",
        "in_memoriam",
        "adormecido",
      ],
    },
  },
} as const
