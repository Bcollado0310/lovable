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
      admin_audit_log: {
        Row: {
          action: string
          admin_user_id: string
          created_at: string
          id: string
          ip_address: unknown | null
          resource_id: string | null
          table_name: string
          user_agent: string | null
        }
        Insert: {
          action: string
          admin_user_id: string
          created_at?: string
          id?: string
          ip_address?: unknown | null
          resource_id?: string | null
          table_name: string
          user_agent?: string | null
        }
        Update: {
          action?: string
          admin_user_id?: string
          created_at?: string
          id?: string
          ip_address?: unknown | null
          resource_id?: string | null
          table_name?: string
          user_agent?: string | null
        }
        Relationships: []
      }
      auth_rate_limit: {
        Row: {
          attempt_count: number
          blocked_until: string | null
          id: string
          ip_address: unknown
          last_attempt: string
        }
        Insert: {
          attempt_count?: number
          blocked_until?: string | null
          id?: string
          ip_address: unknown
          last_attempt?: string
        }
        Update: {
          attempt_count?: number
          blocked_until?: string | null
          id?: string
          ip_address?: unknown
          last_attempt?: string
        }
        Relationships: []
      }
      cache_invalidation_log: {
        Row: {
          cache_key: string
          id: string
          invalidated_at: string
          invalidated_by: string | null
          invalidation_reason: string
          offering_id: string | null
          organization_id: string | null
        }
        Insert: {
          cache_key: string
          id?: string
          invalidated_at?: string
          invalidated_by?: string | null
          invalidation_reason: string
          offering_id?: string | null
          organization_id?: string | null
        }
        Update: {
          cache_key?: string
          id?: string
          invalidated_at?: string
          invalidated_by?: string | null
          invalidation_reason?: string
          offering_id?: string | null
          organization_id?: string | null
        }
        Relationships: []
      }
      data_access_policies: {
        Row: {
          created_at: string
          id: string
          policy_content: string
          policy_name: string
          updated_at: string
          version: number
        }
        Insert: {
          created_at?: string
          id?: string
          policy_content: string
          policy_name: string
          updated_at?: string
          version?: number
        }
        Update: {
          created_at?: string
          id?: string
          policy_content?: string
          policy_name?: string
          updated_at?: string
          version?: number
        }
        Relationships: []
      }
      developer_contribution_events: {
        Row: {
          amount: number
          created_at: string
          event_type: string
          id: string
          investor_id: string
          offering_id: string
          organization_id: string
          status: string
        }
        Insert: {
          amount: number
          created_at?: string
          event_type?: string
          id?: string
          investor_id: string
          offering_id: string
          organization_id: string
          status?: string
        }
        Update: {
          amount?: number
          created_at?: string
          event_type?: string
          id?: string
          investor_id?: string
          offering_id?: string
          organization_id?: string
          status?: string
        }
        Relationships: [
          {
            foreignKeyName: "developer_contribution_events_investor_id_fkey"
            columns: ["investor_id"]
            isOneToOne: false
            referencedRelation: "developer_investor_summary"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "developer_contribution_events_investor_id_fkey"
            columns: ["investor_id"]
            isOneToOne: false
            referencedRelation: "developer_investors"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "developer_contribution_events_offering_id_fkey"
            columns: ["offering_id"]
            isOneToOne: false
            referencedRelation: "developer_offerings"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "developer_contribution_events_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "developer_organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      developer_daily_contributions: {
        Row: {
          contribution_date: string
          created_at: string | null
          daily_amount: number
          id: string
          offering_id: string
          organization_id: string
        }
        Insert: {
          contribution_date: string
          created_at?: string | null
          daily_amount?: number
          id?: string
          offering_id: string
          organization_id: string
        }
        Update: {
          contribution_date?: string
          created_at?: string | null
          daily_amount?: number
          id?: string
          offering_id?: string
          organization_id?: string
        }
        Relationships: []
      }
      developer_investor_aliases: {
        Row: {
          alias_name: string
          created_at: string
          id: string
          investor_id: string
          organization_id: string
        }
        Insert: {
          alias_name: string
          created_at?: string
          id?: string
          investor_id: string
          organization_id: string
        }
        Update: {
          alias_name?: string
          created_at?: string
          id?: string
          investor_id?: string
          organization_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "developer_investor_aliases_investor_id_fkey"
            columns: ["investor_id"]
            isOneToOne: false
            referencedRelation: "developer_investor_summary"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "developer_investor_aliases_investor_id_fkey"
            columns: ["investor_id"]
            isOneToOne: false
            referencedRelation: "developer_investors"
            referencedColumns: ["id"]
          },
        ]
      }
      developer_investors: {
        Row: {
          created_at: string
          email: string
          email_encrypted: string | null
          first_name: string
          first_name_encrypted: string | null
          id: string
          investment_count: number
          investor_type: string
          last_name: string
          last_name_encrypted: string | null
          organization_id: string
          phone: string | null
          phone_encrypted: string | null
          status: string
          total_invested: number
          updated_at: string
          user_id: string | null
        }
        Insert: {
          created_at?: string
          email: string
          email_encrypted?: string | null
          first_name: string
          first_name_encrypted?: string | null
          id?: string
          investment_count?: number
          investor_type?: string
          last_name: string
          last_name_encrypted?: string | null
          organization_id: string
          phone?: string | null
          phone_encrypted?: string | null
          status?: string
          total_invested?: number
          updated_at?: string
          user_id?: string | null
        }
        Update: {
          created_at?: string
          email?: string
          email_encrypted?: string | null
          first_name?: string
          first_name_encrypted?: string | null
          id?: string
          investment_count?: number
          investor_type?: string
          last_name?: string
          last_name_encrypted?: string | null
          organization_id?: string
          phone?: string | null
          phone_encrypted?: string | null
          status?: string
          total_invested?: number
          updated_at?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "developer_investors_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "developer_organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      developer_investors_encrypted: {
        Row: {
          address_encrypted: string | null
          bank_last4_encrypted: string | null
          created_at: string
          documents_encrypted: string | null
          id: string
          investor_id: string
          updated_at: string
        }
        Insert: {
          address_encrypted?: string | null
          bank_last4_encrypted?: string | null
          created_at?: string
          documents_encrypted?: string | null
          id?: string
          investor_id: string
          updated_at?: string
        }
        Update: {
          address_encrypted?: string | null
          bank_last4_encrypted?: string | null
          created_at?: string
          documents_encrypted?: string | null
          id?: string
          investor_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "developer_investors_encrypted_investor_id_fkey"
            columns: ["investor_id"]
            isOneToOne: true
            referencedRelation: "developer_investor_summary"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "developer_investors_encrypted_investor_id_fkey"
            columns: ["investor_id"]
            isOneToOne: true
            referencedRelation: "developer_investors"
            referencedColumns: ["id"]
          },
        ]
      }
      developer_offering_investor_aliases: {
        Row: {
          alias_code: string
          created_at: string
          id: string
          investor_id: string
          offering_id: string
          organization_id: string
        }
        Insert: {
          alias_code: string
          created_at?: string
          id?: string
          investor_id: string
          offering_id: string
          organization_id: string
        }
        Update: {
          alias_code?: string
          created_at?: string
          id?: string
          investor_id?: string
          offering_id?: string
          organization_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "developer_offering_investor_aliases_investor_id_fkey"
            columns: ["investor_id"]
            isOneToOne: false
            referencedRelation: "developer_investor_summary"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "developer_offering_investor_aliases_investor_id_fkey"
            columns: ["investor_id"]
            isOneToOne: false
            referencedRelation: "developer_investors"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "developer_offering_investor_aliases_offering_id_fkey"
            columns: ["offering_id"]
            isOneToOne: false
            referencedRelation: "developer_offerings"
            referencedColumns: ["id"]
          },
        ]
      }
      developer_offerings: {
        Row: {
          created_at: string
          description: string
          documents: string[] | null
          expected_annual_return: number | null
          funding_deadline: string | null
          id: string
          images: string[] | null
          investor_count: number
          location: string
          minimum_investment: number
          organization_id: string
          property_type: string
          raised_amount: number
          status: string
          target_amount: number
          title: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          description: string
          documents?: string[] | null
          expected_annual_return?: number | null
          funding_deadline?: string | null
          id?: string
          images?: string[] | null
          investor_count?: number
          location: string
          minimum_investment?: number
          organization_id: string
          property_type?: string
          raised_amount?: number
          status?: string
          target_amount: number
          title: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          description?: string
          documents?: string[] | null
          expected_annual_return?: number | null
          funding_deadline?: string | null
          id?: string
          images?: string[] | null
          investor_count?: number
          location?: string
          minimum_investment?: number
          organization_id?: string
          property_type?: string
          raised_amount?: number
          status?: string
          target_amount?: number
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "developer_offerings_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "developer_organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      developer_organization_members: {
        Row: {
          created_at: string
          id: string
          invited_by: string | null
          joined_at: string
          organization_id: string
          role: Database["public"]["Enums"]["developer_role"]
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          invited_by?: string | null
          joined_at?: string
          organization_id: string
          role?: Database["public"]["Enums"]["developer_role"]
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          invited_by?: string | null
          joined_at?: string
          organization_id?: string
          role?: Database["public"]["Enums"]["developer_role"]
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "developer_organization_members_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "developer_organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      developer_organizations: {
        Row: {
          created_at: string
          description: string | null
          id: string
          logo_url: string | null
          name: string
          updated_at: string
          website: string | null
        }
        Insert: {
          created_at?: string
          description?: string | null
          id?: string
          logo_url?: string | null
          name: string
          updated_at?: string
          website?: string | null
        }
        Update: {
          created_at?: string
          description?: string | null
          id?: string
          logo_url?: string | null
          name?: string
          updated_at?: string
          website?: string | null
        }
        Relationships: []
      }
      documents: {
        Row: {
          category: Database["public"]["Enums"]["document_category"]
          checksum_sha256: string | null
          created_at: string
          download_count: number
          filename: string
          id: string
          mime_type: string
          offering_id: string
          size_bytes: number
          storage_key: string
          title: string
          updated_at: string
          uploaded_at: string
          uploaded_by: string | null
          visibility: Database["public"]["Enums"]["document_visibility"]
        }
        Insert: {
          category?: Database["public"]["Enums"]["document_category"]
          checksum_sha256?: string | null
          created_at?: string
          download_count?: number
          filename: string
          id?: string
          mime_type: string
          offering_id: string
          size_bytes: number
          storage_key: string
          title: string
          updated_at?: string
          uploaded_at?: string
          uploaded_by?: string | null
          visibility?: Database["public"]["Enums"]["document_visibility"]
        }
        Update: {
          category?: Database["public"]["Enums"]["document_category"]
          checksum_sha256?: string | null
          created_at?: string
          download_count?: number
          filename?: string
          id?: string
          mime_type?: string
          offering_id?: string
          size_bytes?: number
          storage_key?: string
          title?: string
          updated_at?: string
          uploaded_at?: string
          uploaded_by?: string | null
          visibility?: Database["public"]["Enums"]["document_visibility"]
        }
        Relationships: [
          {
            foreignKeyName: "documents_offering_id_fkey"
            columns: ["offering_id"]
            isOneToOne: false
            referencedRelation: "developer_offerings"
            referencedColumns: ["id"]
          },
        ]
      }
      feature_flags: {
        Row: {
          created_at: string
          created_by: string | null
          description: string | null
          enabled: boolean
          environment: string
          flag_name: string
          id: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          description?: string | null
          enabled?: boolean
          environment?: string
          flag_name: string
          id?: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          created_by?: string | null
          description?: string | null
          enabled?: boolean
          environment?: string
          flag_name?: string
          id?: string
          updated_at?: string
        }
        Relationships: []
      }
      investments: {
        Row: {
          amount_invested: number
          created_at: string
          current_value: number
          id: string
          investment_date: string
          investment_status: Database["public"]["Enums"]["investment_status"]
          property_id: string
          shares_owned: number
          total_returns: number
          updated_at: string
          user_id: string
        }
        Insert: {
          amount_invested: number
          created_at?: string
          current_value?: number
          id?: string
          investment_date?: string
          investment_status?: Database["public"]["Enums"]["investment_status"]
          property_id: string
          shares_owned: number
          total_returns?: number
          updated_at?: string
          user_id: string
        }
        Update: {
          amount_invested?: number
          created_at?: string
          current_value?: number
          id?: string
          investment_date?: string
          investment_status?: Database["public"]["Enums"]["investment_status"]
          property_id?: string
          shares_owned?: number
          total_returns?: number
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "investments_property_id_fkey"
            columns: ["property_id"]
            isOneToOne: false
            referencedRelation: "properties"
            referencedColumns: ["id"]
          },
        ]
      }
      offering_media: {
        Row: {
          alt_text: string | null
          caption: string | null
          created_at: string | null
          data: string | null
          duration: number | null
          filename: string | null
          height: number | null
          id: string
          is_hero: boolean | null
          kind: string
          medium_url: string | null
          mime_type: string | null
          offering_id: string
          position: number | null
          poster_url: string | null
          size_bytes: number | null
          thumbnail_url: string | null
          updated_at: string | null
          url: string
          visibility: string | null
          width: number | null
        }
        Insert: {
          alt_text?: string | null
          caption?: string | null
          created_at?: string | null
          data?: string | null
          duration?: number | null
          filename?: string | null
          height?: number | null
          id?: string
          is_hero?: boolean | null
          kind: string
          medium_url?: string | null
          mime_type?: string | null
          offering_id: string
          position?: number | null
          poster_url?: string | null
          size_bytes?: number | null
          thumbnail_url?: string | null
          updated_at?: string | null
          url: string
          visibility?: string | null
          width?: number | null
        }
        Update: {
          alt_text?: string | null
          caption?: string | null
          created_at?: string | null
          data?: string | null
          duration?: number | null
          filename?: string | null
          height?: number | null
          id?: string
          is_hero?: boolean | null
          kind?: string
          medium_url?: string | null
          mime_type?: string | null
          offering_id?: string
          position?: number | null
          poster_url?: string | null
          size_bytes?: number | null
          thumbnail_url?: string | null
          updated_at?: string | null
          url?: string
          visibility?: string | null
          width?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "offering_media_offering_id_fkey"
            columns: ["offering_id"]
            isOneToOne: false
            referencedRelation: "offerings"
            referencedColumns: ["id"]
          },
        ]
      }
      offerings: {
        Row: {
          address: string | null
          city: string | null
          close_date: string | null
          country: string | null
          cover_url: string | null
          created_at: string | null
          description: string | null
          distribution_freq: string | null
          equity_multiple: number | null
          goal: number | null
          hard_cap: number | null
          hold_years: number | null
          id: string
          is_featured: boolean | null
          is_private: boolean | null
          lat: number | null
          lng: number | null
          max_invest: number | null
          min_invest: number | null
          org_id: string
          risk_bucket: string | null
          soft_cap: number | null
          state: string | null
          step_invest: number | null
          summary: string | null
          tags: string[] | null
          target_irr: number | null
          title: string
          type: string | null
          updated_at: string | null
          valuation: number | null
        }
        Insert: {
          address?: string | null
          city?: string | null
          close_date?: string | null
          country?: string | null
          cover_url?: string | null
          created_at?: string | null
          description?: string | null
          distribution_freq?: string | null
          equity_multiple?: number | null
          goal?: number | null
          hard_cap?: number | null
          hold_years?: number | null
          id?: string
          is_featured?: boolean | null
          is_private?: boolean | null
          lat?: number | null
          lng?: number | null
          max_invest?: number | null
          min_invest?: number | null
          org_id: string
          risk_bucket?: string | null
          soft_cap?: number | null
          state?: string | null
          step_invest?: number | null
          summary?: string | null
          tags?: string[] | null
          target_irr?: number | null
          title: string
          type?: string | null
          updated_at?: string | null
          valuation?: number | null
        }
        Update: {
          address?: string | null
          city?: string | null
          close_date?: string | null
          country?: string | null
          cover_url?: string | null
          created_at?: string | null
          description?: string | null
          distribution_freq?: string | null
          equity_multiple?: number | null
          goal?: number | null
          hard_cap?: number | null
          hold_years?: number | null
          id?: string
          is_featured?: boolean | null
          is_private?: boolean | null
          lat?: number | null
          lng?: number | null
          max_invest?: number | null
          min_invest?: number | null
          org_id?: string
          risk_bucket?: string | null
          soft_cap?: number | null
          state?: string | null
          step_invest?: number | null
          summary?: string | null
          tags?: string[] | null
          target_irr?: number | null
          title?: string
          type?: string | null
          updated_at?: string | null
          valuation?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "offerings_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "developer_organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      pii_access_audit: {
        Row: {
          accessed_column: string
          accessed_table: string
          admin_user_id: string
          created_at: string
          id: string
          ip_address: unknown | null
          operation: string
          record_id: string
          user_agent: string | null
        }
        Insert: {
          accessed_column: string
          accessed_table: string
          admin_user_id: string
          created_at?: string
          id?: string
          ip_address?: unknown | null
          operation: string
          record_id: string
          user_agent?: string | null
        }
        Update: {
          accessed_column?: string
          accessed_table?: string
          admin_user_id?: string
          created_at?: string
          id?: string
          ip_address?: unknown | null
          operation?: string
          record_id?: string
          user_agent?: string | null
        }
        Relationships: []
      }
      portfolios: {
        Row: {
          created_at: string
          current_value: number
          id: string
          last_calculated: string
          monthly_income: number
          properties_count: number
          total_invested: number
          total_returns: number
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          current_value?: number
          id?: string
          last_calculated?: string
          monthly_income?: number
          properties_count?: number
          total_invested?: number
          total_returns?: number
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          current_value?: number
          id?: string
          last_calculated?: string
          monthly_income?: number
          properties_count?: number
          total_invested?: number
          total_returns?: number
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          created_at: string
          id: string
        }
        Insert: {
          created_at?: string
          id: string
        }
        Update: {
          created_at?: string
          id?: string
        }
        Relationships: []
      }
      properties: {
        Row: {
          address: string
          city: string
          completion_date: string | null
          country: string
          created_at: string
          current_funding: number
          description: string
          documents: string[] | null
          expected_annual_return: number
          funding_deadline: string | null
          id: string
          images: string[] | null
          minimum_investment: number
          property_status: Database["public"]["Enums"]["property_status"]
          property_type: Database["public"]["Enums"]["property_type"]
          rental_yield: number | null
          risk_rating: number | null
          target_funding: number
          title: string
          total_value: number
          updated_at: string
        }
        Insert: {
          address: string
          city: string
          completion_date?: string | null
          country: string
          created_at?: string
          current_funding?: number
          description: string
          documents?: string[] | null
          expected_annual_return: number
          funding_deadline?: string | null
          id?: string
          images?: string[] | null
          minimum_investment?: number
          property_status?: Database["public"]["Enums"]["property_status"]
          property_type?: Database["public"]["Enums"]["property_type"]
          rental_yield?: number | null
          risk_rating?: number | null
          target_funding: number
          title: string
          total_value: number
          updated_at?: string
        }
        Update: {
          address?: string
          city?: string
          completion_date?: string | null
          country?: string
          created_at?: string
          current_funding?: number
          description?: string
          documents?: string[] | null
          expected_annual_return?: number
          funding_deadline?: string | null
          id?: string
          images?: string[] | null
          minimum_investment?: number
          property_status?: Database["public"]["Enums"]["property_status"]
          property_type?: Database["public"]["Enums"]["property_type"]
          rental_yield?: number | null
          risk_rating?: number | null
          target_funding?: number
          title?: string
          total_value?: number
          updated_at?: string
        }
        Relationships: []
      }
      transactions: {
        Row: {
          amount: number
          created_at: string
          description: string | null
          id: string
          investment_id: string | null
          payment_date: string | null
          processed_at: string | null
          property_id: string | null
          transaction_type: Database["public"]["Enums"]["transaction_type"]
          user_id: string
        }
        Insert: {
          amount: number
          created_at?: string
          description?: string | null
          id?: string
          investment_id?: string | null
          payment_date?: string | null
          processed_at?: string | null
          property_id?: string | null
          transaction_type: Database["public"]["Enums"]["transaction_type"]
          user_id: string
        }
        Update: {
          amount?: number
          created_at?: string
          description?: string | null
          id?: string
          investment_id?: string | null
          payment_date?: string | null
          processed_at?: string | null
          property_id?: string | null
          transaction_type?: Database["public"]["Enums"]["transaction_type"]
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "transactions_investment_id_fkey"
            columns: ["investment_id"]
            isOneToOne: false
            referencedRelation: "investments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "transactions_property_id_fkey"
            columns: ["property_id"]
            isOneToOne: false
            referencedRelation: "properties"
            referencedColumns: ["id"]
          },
        ]
      }
      user_roles: {
        Row: {
          created_at: string
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
      waitlist_signups: {
        Row: {
          age: number
          country_code: string
          created_at: string
          email: string
          first_name: string
          id: string
          income_bracket: Database["public"]["Enums"]["income_bracket_eur"]
          ip: unknown | null
          last_name: string
          marketing_opt_in: boolean
          marketing_opt_in_at: string | null
          privacy_accepted: boolean
          privacy_accepted_at: string
          referer_url: string | null
          updated_at: string
          user_agent: string | null
          utm_campaign: string | null
          utm_content: string | null
          utm_medium: string | null
          utm_source: string | null
          utm_term: string | null
        }
        Insert: {
          age: number
          country_code: string
          created_at?: string
          email: string
          first_name: string
          id?: string
          income_bracket: Database["public"]["Enums"]["income_bracket_eur"]
          ip?: unknown | null
          last_name: string
          marketing_opt_in?: boolean
          marketing_opt_in_at?: string | null
          privacy_accepted?: boolean
          privacy_accepted_at?: string
          referer_url?: string | null
          updated_at?: string
          user_agent?: string | null
          utm_campaign?: string | null
          utm_content?: string | null
          utm_medium?: string | null
          utm_source?: string | null
          utm_term?: string | null
        }
        Update: {
          age?: number
          country_code?: string
          created_at?: string
          email?: string
          first_name?: string
          id?: string
          income_bracket?: Database["public"]["Enums"]["income_bracket_eur"]
          ip?: unknown | null
          last_name?: string
          marketing_opt_in?: boolean
          marketing_opt_in_at?: string | null
          privacy_accepted?: boolean
          privacy_accepted_at?: string
          referer_url?: string | null
          updated_at?: string
          user_agent?: string | null
          utm_campaign?: string | null
          utm_content?: string | null
          utm_medium?: string | null
          utm_source?: string | null
          utm_term?: string | null
        }
        Relationships: []
      }
    }
    Views: {
      developer_investor_summary: {
        Row: {
          created_at: string | null
          id: string | null
          investment_count: number | null
          investor_name: string | null
          investor_type: string | null
          organization_id: string | null
          status: string | null
          total_invested: number | null
          updated_at: string | null
        }
        Relationships: [
          {
            foreignKeyName: "developer_investors_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "developer_organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      document_storage_migration_status: {
        Row: {
          legacy_paths: number | null
          migrated_paths: number | null
          total_documents: number | null
        }
        Relationships: []
      }
    }
    Functions: {
      audit_pii_access: {
        Args: {
          p_column_name: string
          p_operation: string
          p_record_id: string
          p_table_name: string
        }
        Returns: boolean
      }
      backfill_offering_investor_aliases: {
        Args: Record<PropertyKey, never>
        Returns: undefined
      }
      belongs_to_organization: {
        Args: { _org_id: string; _user_id: string }
        Returns: boolean
      }
      decrypt_pii: {
        Args: {
          encrypted_data: string
          p_column_name: string
          p_record_id: string
          p_table_name: string
        }
        Returns: string
      }
      encrypt_pii: {
        Args: {
          p_column_name: string
          p_record_id: string
          p_table_name: string
          plaintext: string
        }
        Returns: string
      }
      get_investor_pii: {
        Args: { p_investor_id: string }
        Returns: Json
      }
      get_user_org_role: {
        Args: { _org_id: string; _user_id: string }
        Returns: Database["public"]["Enums"]["developer_role"]
      }
      has_developer_role: {
        Args: {
          _org_id: string
          _role: Database["public"]["Enums"]["developer_role"]
          _user_id: string
        }
        Returns: boolean
      }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      is_admin: {
        Args: Record<PropertyKey, never>
        Returns: boolean
      }
      is_feature_enabled: {
        Args: { env?: string; flag_name: string }
        Returns: boolean
      }
      log_admin_access: {
        Args: { p_action: string; p_resource_id?: string; p_table_name: string }
        Returns: boolean
      }
      log_pii_access_denial: {
        Args: {
          p_denial_reason: string
          p_resource_id: string
          p_resource_type: string
          p_user_id: string
        }
        Returns: boolean
      }
      migrate_document_storage_path: {
        Args: { old_path: string }
        Returns: string
      }
      purge_pii_cache: {
        Args: { p_offering_id?: string; p_organization_id: string }
        Returns: number
      }
    }
    Enums: {
      app_role: "admin" | "user"
      developer_role: "owner" | "manager" | "editor" | "viewer"
      document_category:
        | "Financial"
        | "Appraisal"
        | "Legal"
        | "Technical"
        | "Other"
      document_visibility: "Public" | "Private"
      income_bracket_eur:
        | "€0–€20k"
        | "€20k–€50k"
        | "€50k–€100k"
        | "€100k–€200k"
        | "€200k+"
        | "Prefer not to say"
      investment_status: "active" | "completed" | "cancelled"
      property_status: "available" | "funding" | "fully_funded" | "completed"
      property_type: "residential" | "commercial" | "mixed_use" | "industrial"
      transaction_type:
        | "investment"
        | "dividend"
        | "capital_gain"
        | "fee"
        | "withdrawal"
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
      app_role: ["admin", "user"],
      developer_role: ["owner", "manager", "editor", "viewer"],
      document_category: [
        "Financial",
        "Appraisal",
        "Legal",
        "Technical",
        "Other",
      ],
      document_visibility: ["Public", "Private"],
      income_bracket_eur: [
        "€0–€20k",
        "€20k–€50k",
        "€50k–€100k",
        "€100k–€200k",
        "€200k+",
        "Prefer not to say",
      ],
      investment_status: ["active", "completed", "cancelled"],
      property_status: ["available", "funding", "fully_funded", "completed"],
      property_type: ["residential", "commercial", "mixed_use", "industrial"],
      transaction_type: [
        "investment",
        "dividend",
        "capital_gain",
        "fee",
        "withdrawal",
      ],
    },
  },
} as const
