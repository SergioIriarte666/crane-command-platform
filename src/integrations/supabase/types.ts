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
      backup_logs: {
        Row: {
          backup_type: string
          created_at: string | null
          created_by: string | null
          error_message: string | null
          file_size_bytes: number | null
          id: string
          metadata: Json | null
          status: string
          tenant_id: string | null
        }
        Insert: {
          backup_type: string
          created_at?: string | null
          created_by?: string | null
          error_message?: string | null
          file_size_bytes?: number | null
          id?: string
          metadata?: Json | null
          status: string
          tenant_id?: string | null
        }
        Update: {
          backup_type?: string
          created_at?: string | null
          created_by?: string | null
          error_message?: string | null
          file_size_bytes?: number | null
          id?: string
          metadata?: Json | null
          status?: string
          tenant_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "backup_logs_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      bank_transactions: {
        Row: {
          account_number: string | null
          amount: number
          bank_name: string | null
          created_at: string | null
          description: string
          id: string
          import_batch: string | null
          imported_at: string | null
          is_credit: boolean
          matched_at: string | null
          matched_by: string | null
          matched_payment_id: string | null
          notes: string | null
          reference: string | null
          status: Database["public"]["Enums"]["reconciliation_status"]
          tenant_id: string
          transaction_date: string
        }
        Insert: {
          account_number?: string | null
          amount: number
          bank_name?: string | null
          created_at?: string | null
          description: string
          id?: string
          import_batch?: string | null
          imported_at?: string | null
          is_credit?: boolean
          matched_at?: string | null
          matched_by?: string | null
          matched_payment_id?: string | null
          notes?: string | null
          reference?: string | null
          status?: Database["public"]["Enums"]["reconciliation_status"]
          tenant_id: string
          transaction_date: string
        }
        Update: {
          account_number?: string | null
          amount?: number
          bank_name?: string | null
          created_at?: string | null
          description?: string
          id?: string
          import_batch?: string | null
          imported_at?: string | null
          is_credit?: boolean
          matched_at?: string | null
          matched_by?: string | null
          matched_payment_id?: string | null
          notes?: string | null
          reference?: string | null
          status?: Database["public"]["Enums"]["reconciliation_status"]
          tenant_id?: string
          transaction_date?: string
        }
        Relationships: [
          {
            foreignKeyName: "bank_transactions_matched_payment_id_fkey"
            columns: ["matched_payment_id"]
            isOneToOne: false
            referencedRelation: "payments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "bank_transactions_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      billing_closure_services: {
        Row: {
          client_adjustment: number | null
          client_notes: string | null
          closure_id: string
          created_at: string | null
          discount: number | null
          id: string
          is_approved: boolean | null
          origin_destination: string | null
          service_date: string | null
          service_folio: string
          service_id: string
          service_type: string | null
          subtotal: number | null
          total: number | null
          vehicle_info: string | null
        }
        Insert: {
          client_adjustment?: number | null
          client_notes?: string | null
          closure_id: string
          created_at?: string | null
          discount?: number | null
          id?: string
          is_approved?: boolean | null
          origin_destination?: string | null
          service_date?: string | null
          service_folio: string
          service_id: string
          service_type?: string | null
          subtotal?: number | null
          total?: number | null
          vehicle_info?: string | null
        }
        Update: {
          client_adjustment?: number | null
          client_notes?: string | null
          closure_id?: string
          created_at?: string | null
          discount?: number | null
          id?: string
          is_approved?: boolean | null
          origin_destination?: string | null
          service_date?: string | null
          service_folio?: string
          service_id?: string
          service_type?: string | null
          subtotal?: number | null
          total?: number | null
          vehicle_info?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "billing_closure_services_closure_id_fkey"
            columns: ["closure_id"]
            isOneToOne: false
            referencedRelation: "billing_closures"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "billing_closure_services_service_id_fkey"
            columns: ["service_id"]
            isOneToOne: false
            referencedRelation: "services"
            referencedColumns: ["id"]
          },
        ]
      }
      billing_closures: {
        Row: {
          approved_at: string | null
          approved_by: string | null
          client_comments: string | null
          client_id: string
          client_reviewed_at: string | null
          client_reviewed_by: string | null
          created_at: string | null
          created_by: string | null
          discount_amount: number | null
          folio: string
          id: string
          invoice_id: string | null
          notes: string | null
          period_end: string
          period_start: string
          services_count: number | null
          status: string
          subtotal: number | null
          tax_amount: number | null
          tax_rate: number | null
          tenant_id: string
          total: number | null
          updated_at: string | null
        }
        Insert: {
          approved_at?: string | null
          approved_by?: string | null
          client_comments?: string | null
          client_id: string
          client_reviewed_at?: string | null
          client_reviewed_by?: string | null
          created_at?: string | null
          created_by?: string | null
          discount_amount?: number | null
          folio: string
          id?: string
          invoice_id?: string | null
          notes?: string | null
          period_end: string
          period_start: string
          services_count?: number | null
          status?: string
          subtotal?: number | null
          tax_amount?: number | null
          tax_rate?: number | null
          tenant_id: string
          total?: number | null
          updated_at?: string | null
        }
        Update: {
          approved_at?: string | null
          approved_by?: string | null
          client_comments?: string | null
          client_id?: string
          client_reviewed_at?: string | null
          client_reviewed_by?: string | null
          created_at?: string | null
          created_by?: string | null
          discount_amount?: number | null
          folio?: string
          id?: string
          invoice_id?: string | null
          notes?: string | null
          period_end?: string
          period_start?: string
          services_count?: number | null
          status?: string
          subtotal?: number | null
          tax_amount?: number | null
          tax_rate?: number | null
          tenant_id?: string
          total?: number | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "billing_closures_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "billing_closures_invoice_id_fkey"
            columns: ["invoice_id"]
            isOneToOne: false
            referencedRelation: "invoices"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "billing_closures_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      catalog_items: {
        Row: {
          catalog_type: string
          code: string
          created_at: string | null
          description: string | null
          id: string
          is_active: boolean | null
          metadata: Json | null
          name: string
          parent_id: string | null
          sort_order: number | null
          tenant_id: string
          updated_at: string | null
        }
        Insert: {
          catalog_type: string
          code: string
          created_at?: string | null
          description?: string | null
          id?: string
          is_active?: boolean | null
          metadata?: Json | null
          name: string
          parent_id?: string | null
          sort_order?: number | null
          tenant_id: string
          updated_at?: string | null
        }
        Update: {
          catalog_type?: string
          code?: string
          created_at?: string | null
          description?: string | null
          id?: string
          is_active?: boolean | null
          metadata?: Json | null
          name?: string
          parent_id?: string | null
          sort_order?: number | null
          tenant_id?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "catalog_items_parent_id_fkey"
            columns: ["parent_id"]
            isOneToOne: false
            referencedRelation: "catalog_items"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "catalog_items_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      clients: {
        Row: {
          address: string | null
          city: string | null
          code: string | null
          contacts: Json | null
          country: string | null
          created_at: string | null
          created_by: string | null
          credit_limit: number | null
          default_discount: number | null
          email: string | null
          id: string
          is_active: boolean | null
          name: string
          notes: string | null
          payment_terms: number | null
          phone: string | null
          phone_alt: string | null
          requires_approval: boolean | null
          requires_po: boolean | null
          state: string | null
          tax_id: string | null
          tax_regime: string | null
          tenant_id: string
          trade_name: string | null
          type: Database["public"]["Enums"]["client_type"]
          updated_at: string | null
          website: string | null
          zip_code: string | null
        }
        Insert: {
          address?: string | null
          city?: string | null
          code?: string | null
          contacts?: Json | null
          country?: string | null
          created_at?: string | null
          created_by?: string | null
          credit_limit?: number | null
          default_discount?: number | null
          email?: string | null
          id?: string
          is_active?: boolean | null
          name: string
          notes?: string | null
          payment_terms?: number | null
          phone?: string | null
          phone_alt?: string | null
          requires_approval?: boolean | null
          requires_po?: boolean | null
          state?: string | null
          tax_id?: string | null
          tax_regime?: string | null
          tenant_id: string
          trade_name?: string | null
          type?: Database["public"]["Enums"]["client_type"]
          updated_at?: string | null
          website?: string | null
          zip_code?: string | null
        }
        Update: {
          address?: string | null
          city?: string | null
          code?: string | null
          contacts?: Json | null
          country?: string | null
          created_at?: string | null
          created_by?: string | null
          credit_limit?: number | null
          default_discount?: number | null
          email?: string | null
          id?: string
          is_active?: boolean | null
          name?: string
          notes?: string | null
          payment_terms?: number | null
          phone?: string | null
          phone_alt?: string | null
          requires_approval?: boolean | null
          requires_po?: boolean | null
          state?: string | null
          tax_id?: string | null
          tax_regime?: string | null
          tenant_id?: string
          trade_name?: string | null
          type?: Database["public"]["Enums"]["client_type"]
          updated_at?: string | null
          website?: string | null
          zip_code?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "clients_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      commission_services: {
        Row: {
          commission_amount: number | null
          commission_id: string
          created_at: string | null
          id: string
          service_date: string | null
          service_folio: string
          service_id: string
          service_total: number | null
        }
        Insert: {
          commission_amount?: number | null
          commission_id: string
          created_at?: string | null
          id?: string
          service_date?: string | null
          service_folio: string
          service_id: string
          service_total?: number | null
        }
        Update: {
          commission_amount?: number | null
          commission_id?: string
          created_at?: string | null
          id?: string
          service_date?: string | null
          service_folio?: string
          service_id?: string
          service_total?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "commission_services_commission_id_fkey"
            columns: ["commission_id"]
            isOneToOne: false
            referencedRelation: "commissions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "commission_services_service_id_fkey"
            columns: ["service_id"]
            isOneToOne: false
            referencedRelation: "services"
            referencedColumns: ["id"]
          },
        ]
      }
      commissions: {
        Row: {
          adjustment_notes: string | null
          approved_at: string | null
          approved_by: string | null
          bonus: number | null
          calculated_amount: number | null
          commission_fixed: number | null
          commission_percentage: number | null
          commission_type: Database["public"]["Enums"]["commission_type"]
          created_at: string | null
          created_by: string | null
          deductions: number | null
          id: string
          notes: string | null
          operator_id: string
          paid_at: string | null
          payment_reference: string | null
          period_end: string
          period_start: string
          services_count: number | null
          status: Database["public"]["Enums"]["commission_status"]
          tenant_id: string
          total_amount: number | null
          total_services_value: number | null
          updated_at: string | null
        }
        Insert: {
          adjustment_notes?: string | null
          approved_at?: string | null
          approved_by?: string | null
          bonus?: number | null
          calculated_amount?: number | null
          commission_fixed?: number | null
          commission_percentage?: number | null
          commission_type?: Database["public"]["Enums"]["commission_type"]
          created_at?: string | null
          created_by?: string | null
          deductions?: number | null
          id?: string
          notes?: string | null
          operator_id: string
          paid_at?: string | null
          payment_reference?: string | null
          period_end: string
          period_start: string
          services_count?: number | null
          status?: Database["public"]["Enums"]["commission_status"]
          tenant_id: string
          total_amount?: number | null
          total_services_value?: number | null
          updated_at?: string | null
        }
        Update: {
          adjustment_notes?: string | null
          approved_at?: string | null
          approved_by?: string | null
          bonus?: number | null
          calculated_amount?: number | null
          commission_fixed?: number | null
          commission_percentage?: number | null
          commission_type?: Database["public"]["Enums"]["commission_type"]
          created_at?: string | null
          created_by?: string | null
          deductions?: number | null
          id?: string
          notes?: string | null
          operator_id?: string
          paid_at?: string | null
          payment_reference?: string | null
          period_end?: string
          period_start?: string
          services_count?: number | null
          status?: Database["public"]["Enums"]["commission_status"]
          tenant_id?: string
          total_amount?: number | null
          total_services_value?: number | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "commissions_operator_id_fkey"
            columns: ["operator_id"]
            isOneToOne: false
            referencedRelation: "operators"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "commissions_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      cost_categories: {
        Row: {
          color: string | null
          created_at: string | null
          description: string | null
          display_order: number | null
          icon: string | null
          id: string
          is_active: boolean | null
          name: string
          tenant_id: string
          updated_at: string | null
        }
        Insert: {
          color?: string | null
          created_at?: string | null
          description?: string | null
          display_order?: number | null
          icon?: string | null
          id?: string
          is_active?: boolean | null
          name: string
          tenant_id: string
          updated_at?: string | null
        }
        Update: {
          color?: string | null
          created_at?: string | null
          description?: string | null
          display_order?: number | null
          icon?: string | null
          id?: string
          is_active?: boolean | null
          name?: string
          tenant_id?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "cost_categories_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      cost_centers: {
        Row: {
          budget_amount: number | null
          code: string
          created_at: string | null
          description: string | null
          id: string
          is_active: boolean | null
          name: string
          parent_id: string | null
          tenant_id: string
          updated_at: string | null
        }
        Insert: {
          budget_amount?: number | null
          code: string
          created_at?: string | null
          description?: string | null
          id?: string
          is_active?: boolean | null
          name: string
          parent_id?: string | null
          tenant_id: string
          updated_at?: string | null
        }
        Update: {
          budget_amount?: number | null
          code?: string
          created_at?: string | null
          description?: string | null
          id?: string
          is_active?: boolean | null
          name?: string
          parent_id?: string | null
          tenant_id?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "cost_centers_parent_id_fkey"
            columns: ["parent_id"]
            isOneToOne: false
            referencedRelation: "cost_centers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "cost_centers_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      cost_subcategories: {
        Row: {
          category_id: string
          created_at: string | null
          description: string | null
          display_order: number | null
          id: string
          is_active: boolean | null
          name: string
          tenant_id: string
          updated_at: string | null
        }
        Insert: {
          category_id: string
          created_at?: string | null
          description?: string | null
          display_order?: number | null
          id?: string
          is_active?: boolean | null
          name: string
          tenant_id: string
          updated_at?: string | null
        }
        Update: {
          category_id?: string
          created_at?: string | null
          description?: string | null
          display_order?: number | null
          id?: string
          is_active?: boolean | null
          name?: string
          tenant_id?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "cost_subcategories_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "cost_categories"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "cost_subcategories_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      costs: {
        Row: {
          approved_at: string | null
          approved_by: string | null
          catalog_category_id: string | null
          catalog_cost_center_id: string | null
          category: Database["public"]["Enums"]["cost_category"]
          category_id: string | null
          code: string
          cost_center_id: string | null
          cost_date: string
          crane_id: string | null
          created_at: string
          created_by: string | null
          description: string
          discount: number
          id: string
          immediate_consumption: boolean | null
          kilometraje: number | null
          notes: string | null
          operator_id: string | null
          part_name: string | null
          payment_date: string | null
          purchase_quantity: number | null
          purchase_unit_cost: number | null
          quantity: number
          rejected_at: string | null
          rejected_by: string | null
          rejection_reason: string | null
          service_folio: string | null
          service_id: string | null
          status: Database["public"]["Enums"]["cost_status"]
          subcategory_id: string | null
          subtotal: number | null
          supplier_id: string | null
          supplier_name: string | null
          supplier_phone: string | null
          tax_amount: number | null
          tax_rate: number
          tenant_id: string
          total: number | null
          unit_value: number
          updated_at: string
        }
        Insert: {
          approved_at?: string | null
          approved_by?: string | null
          catalog_category_id?: string | null
          catalog_cost_center_id?: string | null
          category?: Database["public"]["Enums"]["cost_category"]
          category_id?: string | null
          code: string
          cost_center_id?: string | null
          cost_date?: string
          crane_id?: string | null
          created_at?: string
          created_by?: string | null
          description: string
          discount?: number
          id?: string
          immediate_consumption?: boolean | null
          kilometraje?: number | null
          notes?: string | null
          operator_id?: string | null
          part_name?: string | null
          payment_date?: string | null
          purchase_quantity?: number | null
          purchase_unit_cost?: number | null
          quantity?: number
          rejected_at?: string | null
          rejected_by?: string | null
          rejection_reason?: string | null
          service_folio?: string | null
          service_id?: string | null
          status?: Database["public"]["Enums"]["cost_status"]
          subcategory_id?: string | null
          subtotal?: number | null
          supplier_id?: string | null
          supplier_name?: string | null
          supplier_phone?: string | null
          tax_amount?: number | null
          tax_rate?: number
          tenant_id: string
          total?: number | null
          unit_value?: number
          updated_at?: string
        }
        Update: {
          approved_at?: string | null
          approved_by?: string | null
          catalog_category_id?: string | null
          catalog_cost_center_id?: string | null
          category?: Database["public"]["Enums"]["cost_category"]
          category_id?: string | null
          code?: string
          cost_center_id?: string | null
          cost_date?: string
          crane_id?: string | null
          created_at?: string
          created_by?: string | null
          description?: string
          discount?: number
          id?: string
          immediate_consumption?: boolean | null
          kilometraje?: number | null
          notes?: string | null
          operator_id?: string | null
          part_name?: string | null
          payment_date?: string | null
          purchase_quantity?: number | null
          purchase_unit_cost?: number | null
          quantity?: number
          rejected_at?: string | null
          rejected_by?: string | null
          rejection_reason?: string | null
          service_folio?: string | null
          service_id?: string | null
          status?: Database["public"]["Enums"]["cost_status"]
          subcategory_id?: string | null
          subtotal?: number | null
          supplier_id?: string | null
          supplier_name?: string | null
          supplier_phone?: string | null
          tax_amount?: number | null
          tax_rate?: number
          tenant_id?: string
          total?: number | null
          unit_value?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "costs_catalog_category_id_fkey"
            columns: ["catalog_category_id"]
            isOneToOne: false
            referencedRelation: "catalog_items"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "costs_catalog_cost_center_id_fkey"
            columns: ["catalog_cost_center_id"]
            isOneToOne: false
            referencedRelation: "catalog_items"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "costs_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "cost_categories"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "costs_cost_center_id_fkey"
            columns: ["cost_center_id"]
            isOneToOne: false
            referencedRelation: "cost_centers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "costs_crane_id_fkey"
            columns: ["crane_id"]
            isOneToOne: false
            referencedRelation: "cranes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "costs_operator_id_fkey"
            columns: ["operator_id"]
            isOneToOne: false
            referencedRelation: "operators"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "costs_service_id_fkey"
            columns: ["service_id"]
            isOneToOne: false
            referencedRelation: "services"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "costs_subcategory_id_fkey"
            columns: ["subcategory_id"]
            isOneToOne: false
            referencedRelation: "cost_subcategories"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "costs_supplier_id_fkey"
            columns: ["supplier_id"]
            isOneToOne: false
            referencedRelation: "suppliers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "costs_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      crane_documents: {
        Row: {
          crane_id: string
          created_at: string | null
          expiry_date: string | null
          file_url: string | null
          id: string
          issue_date: string | null
          name: string
          reminder_days: number | null
          type: Database["public"]["Enums"]["document_type"]
        }
        Insert: {
          crane_id: string
          created_at?: string | null
          expiry_date?: string | null
          file_url?: string | null
          id?: string
          issue_date?: string | null
          name: string
          reminder_days?: number | null
          type: Database["public"]["Enums"]["document_type"]
        }
        Update: {
          crane_id?: string
          created_at?: string | null
          expiry_date?: string | null
          file_url?: string | null
          id?: string
          issue_date?: string | null
          name?: string
          reminder_days?: number | null
          type?: Database["public"]["Enums"]["document_type"]
        }
        Relationships: [
          {
            foreignKeyName: "crane_documents_crane_id_fkey"
            columns: ["crane_id"]
            isOneToOne: false
            referencedRelation: "cranes"
            referencedColumns: ["id"]
          },
        ]
      }
      crane_maintenance: {
        Row: {
          completed_date: string | null
          cost: number | null
          crane_id: string
          created_at: string | null
          created_by: string | null
          description: string
          id: string
          invoice_number: string | null
          km_at_maintenance: number | null
          next_maintenance_km: number | null
          notes: string | null
          provider_name: string | null
          scheduled_date: string | null
          status: Database["public"]["Enums"]["maintenance_status"]
          type: Database["public"]["Enums"]["maintenance_type"]
        }
        Insert: {
          completed_date?: string | null
          cost?: number | null
          crane_id: string
          created_at?: string | null
          created_by?: string | null
          description: string
          id?: string
          invoice_number?: string | null
          km_at_maintenance?: number | null
          next_maintenance_km?: number | null
          notes?: string | null
          provider_name?: string | null
          scheduled_date?: string | null
          status?: Database["public"]["Enums"]["maintenance_status"]
          type?: Database["public"]["Enums"]["maintenance_type"]
        }
        Update: {
          completed_date?: string | null
          cost?: number | null
          crane_id?: string
          created_at?: string | null
          created_by?: string | null
          description?: string
          id?: string
          invoice_number?: string | null
          km_at_maintenance?: number | null
          next_maintenance_km?: number | null
          notes?: string | null
          provider_name?: string | null
          scheduled_date?: string | null
          status?: Database["public"]["Enums"]["maintenance_status"]
          type?: Database["public"]["Enums"]["maintenance_type"]
        }
        Relationships: [
          {
            foreignKeyName: "crane_maintenance_crane_id_fkey"
            columns: ["crane_id"]
            isOneToOne: false
            referencedRelation: "cranes"
            referencedColumns: ["id"]
          },
        ]
      }
      cranes: {
        Row: {
          acquisition_cost: number | null
          acquisition_date: string | null
          assigned_operator_id: string | null
          brand: string | null
          capacity_tons: number | null
          circulation_permit: string | null
          created_at: string | null
          created_by: string | null
          current_km: number | null
          fuel_efficiency: number | null
          fuel_type: string | null
          gps_device_id: string | null
          id: string
          insurance_expiry: string | null
          insurance_policy: string | null
          is_active: boolean | null
          model: string | null
          next_verification: string | null
          notes: string | null
          permit_expiry: string | null
          plates: string | null
          serial_number: string | null
          status: Database["public"]["Enums"]["crane_status"]
          tenant_id: string
          type: Database["public"]["Enums"]["crane_type"]
          unit_number: string
          updated_at: string | null
          verification_date: string | null
          year: number | null
        }
        Insert: {
          acquisition_cost?: number | null
          acquisition_date?: string | null
          assigned_operator_id?: string | null
          brand?: string | null
          capacity_tons?: number | null
          circulation_permit?: string | null
          created_at?: string | null
          created_by?: string | null
          current_km?: number | null
          fuel_efficiency?: number | null
          fuel_type?: string | null
          gps_device_id?: string | null
          id?: string
          insurance_expiry?: string | null
          insurance_policy?: string | null
          is_active?: boolean | null
          model?: string | null
          next_verification?: string | null
          notes?: string | null
          permit_expiry?: string | null
          plates?: string | null
          serial_number?: string | null
          status?: Database["public"]["Enums"]["crane_status"]
          tenant_id: string
          type?: Database["public"]["Enums"]["crane_type"]
          unit_number: string
          updated_at?: string | null
          verification_date?: string | null
          year?: number | null
        }
        Update: {
          acquisition_cost?: number | null
          acquisition_date?: string | null
          assigned_operator_id?: string | null
          brand?: string | null
          capacity_tons?: number | null
          circulation_permit?: string | null
          created_at?: string | null
          created_by?: string | null
          current_km?: number | null
          fuel_efficiency?: number | null
          fuel_type?: string | null
          gps_device_id?: string | null
          id?: string
          insurance_expiry?: string | null
          insurance_policy?: string | null
          is_active?: boolean | null
          model?: string | null
          next_verification?: string | null
          notes?: string | null
          permit_expiry?: string | null
          plates?: string | null
          serial_number?: string | null
          status?: Database["public"]["Enums"]["crane_status"]
          tenant_id?: string
          type?: Database["public"]["Enums"]["crane_type"]
          unit_number?: string
          updated_at?: string | null
          verification_date?: string | null
          year?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "cranes_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_assigned_operator"
            columns: ["assigned_operator_id"]
            isOneToOne: false
            referencedRelation: "operators"
            referencedColumns: ["id"]
          },
        ]
      }
      inventory_items: {
        Row: {
          barcode: string | null
          category: Database["public"]["Enums"]["inventory_category"]
          code: string
          created_at: string | null
          created_by: string | null
          current_stock: number | null
          description: string | null
          id: string
          is_active: boolean | null
          is_tool: boolean | null
          last_purchase_cost: number | null
          location: string | null
          max_stock: number | null
          min_stock: number | null
          name: string
          reorder_point: number | null
          tenant_id: string
          unit: Database["public"]["Enums"]["inventory_unit"]
          unit_cost: number | null
          updated_at: string | null
        }
        Insert: {
          barcode?: string | null
          category?: Database["public"]["Enums"]["inventory_category"]
          code: string
          created_at?: string | null
          created_by?: string | null
          current_stock?: number | null
          description?: string | null
          id?: string
          is_active?: boolean | null
          is_tool?: boolean | null
          last_purchase_cost?: number | null
          location?: string | null
          max_stock?: number | null
          min_stock?: number | null
          name: string
          reorder_point?: number | null
          tenant_id: string
          unit?: Database["public"]["Enums"]["inventory_unit"]
          unit_cost?: number | null
          updated_at?: string | null
        }
        Update: {
          barcode?: string | null
          category?: Database["public"]["Enums"]["inventory_category"]
          code?: string
          created_at?: string | null
          created_by?: string | null
          current_stock?: number | null
          description?: string | null
          id?: string
          is_active?: boolean | null
          is_tool?: boolean | null
          last_purchase_cost?: number | null
          location?: string | null
          max_stock?: number | null
          min_stock?: number | null
          name?: string
          reorder_point?: number | null
          tenant_id?: string
          unit?: Database["public"]["Enums"]["inventory_unit"]
          unit_cost?: number | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "inventory_items_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      inventory_movements: {
        Row: {
          created_at: string | null
          created_by: string | null
          id: string
          item_id: string
          notes: string | null
          quantity: number
          reference_id: string | null
          reference_type: string | null
          tenant_id: string
          type: Database["public"]["Enums"]["movement_type"]
          unit_cost: number | null
        }
        Insert: {
          created_at?: string | null
          created_by?: string | null
          id?: string
          item_id: string
          notes?: string | null
          quantity: number
          reference_id?: string | null
          reference_type?: string | null
          tenant_id: string
          type: Database["public"]["Enums"]["movement_type"]
          unit_cost?: number | null
        }
        Update: {
          created_at?: string | null
          created_by?: string | null
          id?: string
          item_id?: string
          notes?: string | null
          quantity?: number
          reference_id?: string | null
          reference_type?: string | null
          tenant_id?: string
          type?: Database["public"]["Enums"]["movement_type"]
          unit_cost?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "inventory_movements_item_id_fkey"
            columns: ["item_id"]
            isOneToOne: false
            referencedRelation: "inventory_items"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "inventory_movements_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      invitations: {
        Row: {
          accepted_at: string | null
          created_at: string | null
          email: string
          expires_at: string
          id: string
          invited_by: string
          role: Database["public"]["Enums"]["app_role"] | null
          tenant_id: string
          token: string
        }
        Insert: {
          accepted_at?: string | null
          created_at?: string | null
          email: string
          expires_at?: string
          id?: string
          invited_by: string
          role?: Database["public"]["Enums"]["app_role"] | null
          tenant_id: string
          token?: string
        }
        Update: {
          accepted_at?: string | null
          created_at?: string | null
          email?: string
          expires_at?: string
          id?: string
          invited_by?: string
          role?: Database["public"]["Enums"]["app_role"] | null
          tenant_id?: string
          token?: string
        }
        Relationships: [
          {
            foreignKeyName: "invitations_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      invoice_cancellations: {
        Row: {
          cancellation_reason: string
          cancelled_at: string | null
          cancelled_by: string | null
          created_at: string | null
          credit_note_number: string
          id: string
          invoice_id: string
          original_client_id: string | null
          original_folio: string
          original_numero_fiscal: string | null
          original_total: number
          reason_details: string | null
          tenant_id: string
        }
        Insert: {
          cancellation_reason: string
          cancelled_at?: string | null
          cancelled_by?: string | null
          created_at?: string | null
          credit_note_number: string
          id?: string
          invoice_id: string
          original_client_id?: string | null
          original_folio: string
          original_numero_fiscal?: string | null
          original_total: number
          reason_details?: string | null
          tenant_id: string
        }
        Update: {
          cancellation_reason?: string
          cancelled_at?: string | null
          cancelled_by?: string | null
          created_at?: string | null
          credit_note_number?: string
          id?: string
          invoice_id?: string
          original_client_id?: string | null
          original_folio?: string
          original_numero_fiscal?: string | null
          original_total?: number
          reason_details?: string | null
          tenant_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "invoice_cancellations_cancelled_by_fkey"
            columns: ["cancelled_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "invoice_cancellations_invoice_id_fkey"
            columns: ["invoice_id"]
            isOneToOne: true
            referencedRelation: "invoices"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "invoice_cancellations_original_client_id_fkey"
            columns: ["original_client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "invoice_cancellations_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      invoice_items: {
        Row: {
          created_at: string | null
          description: string
          discount_amount: number | null
          discount_percent: number | null
          id: string
          invoice_id: string
          quantity: number | null
          service_id: string | null
          sort_order: number | null
          subtotal: number | null
          tax_amount: number | null
          tax_rate: number | null
          total: number | null
          unit_price: number | null
        }
        Insert: {
          created_at?: string | null
          description: string
          discount_amount?: number | null
          discount_percent?: number | null
          id?: string
          invoice_id: string
          quantity?: number | null
          service_id?: string | null
          sort_order?: number | null
          subtotal?: number | null
          tax_amount?: number | null
          tax_rate?: number | null
          total?: number | null
          unit_price?: number | null
        }
        Update: {
          created_at?: string | null
          description?: string
          discount_amount?: number | null
          discount_percent?: number | null
          id?: string
          invoice_id?: string
          quantity?: number | null
          service_id?: string | null
          sort_order?: number | null
          subtotal?: number | null
          tax_amount?: number | null
          tax_rate?: number | null
          total?: number | null
          unit_price?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "invoice_items_invoice_id_fkey"
            columns: ["invoice_id"]
            isOneToOne: false
            referencedRelation: "invoices"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "invoice_items_service_id_fkey"
            columns: ["service_id"]
            isOneToOne: false
            referencedRelation: "services"
            referencedColumns: ["id"]
          },
        ]
      }
      invoices: {
        Row: {
          amount_paid: number | null
          balance_due: number | null
          billing_closure_id: string | null
          cancellation_reason: string | null
          cancelled_at: string | null
          client_id: string
          created_at: string | null
          created_by: string | null
          discount_amount: number | null
          due_date: string
          fiscal_folio: string | null
          folio: string
          id: string
          internal_notes: string | null
          invoice_type: string | null
          issue_date: string
          notes: string | null
          paid_at: string | null
          payment_terms_id: string | null
          pdf_url: string | null
          sent_at: string | null
          status: string
          subtotal: number | null
          tax_amount: number | null
          tax_rate: number | null
          tenant_id: string
          total: number | null
          updated_at: string | null
          vat: number | null
          xml_url: string | null
        }
        Insert: {
          amount_paid?: number | null
          balance_due?: number | null
          billing_closure_id?: string | null
          cancellation_reason?: string | null
          cancelled_at?: string | null
          client_id: string
          created_at?: string | null
          created_by?: string | null
          discount_amount?: number | null
          due_date: string
          fiscal_folio?: string | null
          folio: string
          id?: string
          internal_notes?: string | null
          invoice_type?: string | null
          issue_date?: string
          notes?: string | null
          paid_at?: string | null
          payment_terms_id?: string | null
          pdf_url?: string | null
          sent_at?: string | null
          status?: string
          subtotal?: number | null
          tax_amount?: number | null
          tax_rate?: number | null
          tenant_id: string
          total?: number | null
          updated_at?: string | null
          vat?: number | null
          xml_url?: string | null
        }
        Update: {
          amount_paid?: number | null
          balance_due?: number | null
          billing_closure_id?: string | null
          cancellation_reason?: string | null
          cancelled_at?: string | null
          client_id?: string
          created_at?: string | null
          created_by?: string | null
          discount_amount?: number | null
          due_date?: string
          fiscal_folio?: string | null
          folio?: string
          id?: string
          internal_notes?: string | null
          invoice_type?: string | null
          issue_date?: string
          notes?: string | null
          paid_at?: string | null
          payment_terms_id?: string | null
          pdf_url?: string | null
          sent_at?: string | null
          status?: string
          subtotal?: number | null
          tax_amount?: number | null
          tax_rate?: number | null
          tenant_id?: string
          total?: number | null
          updated_at?: string | null
          vat?: number | null
          xml_url?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "invoices_billing_closure_id_fkey"
            columns: ["billing_closure_id"]
            isOneToOne: false
            referencedRelation: "billing_closures"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "invoices_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "invoices_payment_terms_id_fkey"
            columns: ["payment_terms_id"]
            isOneToOne: false
            referencedRelation: "catalog_items"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "invoices_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      operator_documents: {
        Row: {
          created_at: string | null
          expiry_date: string | null
          file_url: string | null
          id: string
          issue_date: string | null
          name: string
          operator_id: string
          reminder_days: number | null
          type: Database["public"]["Enums"]["document_type"]
        }
        Insert: {
          created_at?: string | null
          expiry_date?: string | null
          file_url?: string | null
          id?: string
          issue_date?: string | null
          name: string
          operator_id: string
          reminder_days?: number | null
          type: Database["public"]["Enums"]["document_type"]
        }
        Update: {
          created_at?: string | null
          expiry_date?: string | null
          file_url?: string | null
          id?: string
          issue_date?: string | null
          name?: string
          operator_id?: string
          reminder_days?: number | null
          type?: Database["public"]["Enums"]["document_type"]
        }
        Relationships: [
          {
            foreignKeyName: "operator_documents_operator_id_fkey"
            columns: ["operator_id"]
            isOneToOne: false
            referencedRelation: "operators"
            referencedColumns: ["id"]
          },
        ]
      }
      operators: {
        Row: {
          address: string | null
          assigned_crane_id: string | null
          bank_account: string | null
          bank_name: string | null
          birth_date: string | null
          blood_type: string | null
          clabe: string | null
          commission_fixed_amount: number | null
          commission_percentage: number | null
          commission_type: Database["public"]["Enums"]["commission_type"] | null
          created_at: string | null
          created_by: string | null
          email: string | null
          emergency_phone: string | null
          employee_number: string
          full_name: string
          hire_date: string | null
          id: string
          is_active: boolean | null
          license_expiry: string | null
          license_number: string | null
          license_type: string | null
          notes: string | null
          phone: string | null
          photo_url: string | null
          status: Database["public"]["Enums"]["operator_status"]
          tenant_id: string
          updated_at: string | null
          user_id: string | null
        }
        Insert: {
          address?: string | null
          assigned_crane_id?: string | null
          bank_account?: string | null
          bank_name?: string | null
          birth_date?: string | null
          blood_type?: string | null
          clabe?: string | null
          commission_fixed_amount?: number | null
          commission_percentage?: number | null
          commission_type?:
            | Database["public"]["Enums"]["commission_type"]
            | null
          created_at?: string | null
          created_by?: string | null
          email?: string | null
          emergency_phone?: string | null
          employee_number: string
          full_name: string
          hire_date?: string | null
          id?: string
          is_active?: boolean | null
          license_expiry?: string | null
          license_number?: string | null
          license_type?: string | null
          notes?: string | null
          phone?: string | null
          photo_url?: string | null
          status?: Database["public"]["Enums"]["operator_status"]
          tenant_id: string
          updated_at?: string | null
          user_id?: string | null
        }
        Update: {
          address?: string | null
          assigned_crane_id?: string | null
          bank_account?: string | null
          bank_name?: string | null
          birth_date?: string | null
          blood_type?: string | null
          clabe?: string | null
          commission_fixed_amount?: number | null
          commission_percentage?: number | null
          commission_type?:
            | Database["public"]["Enums"]["commission_type"]
            | null
          created_at?: string | null
          created_by?: string | null
          email?: string | null
          emergency_phone?: string | null
          employee_number?: string
          full_name?: string
          hire_date?: string | null
          id?: string
          is_active?: boolean | null
          license_expiry?: string | null
          license_number?: string | null
          license_type?: string | null
          notes?: string | null
          phone?: string | null
          photo_url?: string | null
          status?: Database["public"]["Enums"]["operator_status"]
          tenant_id?: string
          updated_at?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "fk_assigned_crane"
            columns: ["assigned_crane_id"]
            isOneToOne: false
            referencedRelation: "cranes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "operators_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      payments: {
        Row: {
          account_last_digits: string | null
          amount: number
          bank_name: string | null
          client_id: string
          confirmed_at: string | null
          confirmed_by: string | null
          created_at: string | null
          created_by: string | null
          id: string
          invoice_id: string | null
          notes: string | null
          payment_date: string
          payment_method: Database["public"]["Enums"]["payment_method"]
          receipt_url: string | null
          reconciliation_id: string | null
          reference_number: string | null
          status: Database["public"]["Enums"]["payment_status"]
          tenant_id: string
          updated_at: string | null
        }
        Insert: {
          account_last_digits?: string | null
          amount: number
          bank_name?: string | null
          client_id: string
          confirmed_at?: string | null
          confirmed_by?: string | null
          created_at?: string | null
          created_by?: string | null
          id?: string
          invoice_id?: string | null
          notes?: string | null
          payment_date?: string
          payment_method?: Database["public"]["Enums"]["payment_method"]
          receipt_url?: string | null
          reconciliation_id?: string | null
          reference_number?: string | null
          status?: Database["public"]["Enums"]["payment_status"]
          tenant_id: string
          updated_at?: string | null
        }
        Update: {
          account_last_digits?: string | null
          amount?: number
          bank_name?: string | null
          client_id?: string
          confirmed_at?: string | null
          confirmed_by?: string | null
          created_at?: string | null
          created_by?: string | null
          id?: string
          invoice_id?: string | null
          notes?: string | null
          payment_date?: string
          payment_method?: Database["public"]["Enums"]["payment_method"]
          receipt_url?: string | null
          reconciliation_id?: string | null
          reference_number?: string | null
          status?: Database["public"]["Enums"]["payment_status"]
          tenant_id?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "payments_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "payments_invoice_id_fkey"
            columns: ["invoice_id"]
            isOneToOne: false
            referencedRelation: "invoices"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "payments_reconciliation_id_fkey"
            columns: ["reconciliation_id"]
            isOneToOne: false
            referencedRelation: "bank_transactions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "payments_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      permissions: {
        Row: {
          created_at: string | null
          description: string | null
          group_name: string
          id: string
          label: string
          sort_order: number | null
        }
        Insert: {
          created_at?: string | null
          description?: string | null
          group_name: string
          id: string
          label: string
          sort_order?: number | null
        }
        Update: {
          created_at?: string | null
          description?: string | null
          group_name?: string
          id?: string
          label?: string
          sort_order?: number | null
        }
        Relationships: []
      }
      plan_configs: {
        Row: {
          color: string | null
          created_at: string | null
          icon: string | null
          id: string
          is_active: boolean | null
          max_clients: number | null
          max_cranes: number | null
          max_operators: number | null
          max_users: number | null
          name: string
          plan_key: string
          price: string
          price_amount: number | null
          sort_order: number | null
          updated_at: string | null
        }
        Insert: {
          color?: string | null
          created_at?: string | null
          icon?: string | null
          id?: string
          is_active?: boolean | null
          max_clients?: number | null
          max_cranes?: number | null
          max_operators?: number | null
          max_users?: number | null
          name: string
          plan_key: string
          price: string
          price_amount?: number | null
          sort_order?: number | null
          updated_at?: string | null
        }
        Update: {
          color?: string | null
          created_at?: string | null
          icon?: string | null
          id?: string
          is_active?: boolean | null
          max_clients?: number | null
          max_cranes?: number | null
          max_operators?: number | null
          max_users?: number | null
          name?: string
          plan_key?: string
          price?: string
          price_amount?: number | null
          sort_order?: number | null
          updated_at?: string | null
        }
        Relationships: []
      }
      plan_features: {
        Row: {
          created_at: string | null
          feature_text: string
          id: string
          plan_config_id: string
          sort_order: number | null
        }
        Insert: {
          created_at?: string | null
          feature_text: string
          id?: string
          plan_config_id: string
          sort_order?: number | null
        }
        Update: {
          created_at?: string | null
          feature_text?: string
          id?: string
          plan_config_id?: string
          sort_order?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "plan_features_plan_config_id_fkey"
            columns: ["plan_config_id"]
            isOneToOne: false
            referencedRelation: "plan_configs"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          avatar_url: string | null
          created_at: string | null
          email: string
          full_name: string | null
          id: string
          is_active: boolean | null
          phone: string | null
          preferences: Json | null
          tenant_id: string | null
          updated_at: string | null
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string | null
          email: string
          full_name?: string | null
          id: string
          is_active?: boolean | null
          phone?: string | null
          preferences?: Json | null
          tenant_id?: string | null
          updated_at?: string | null
        }
        Update: {
          avatar_url?: string | null
          created_at?: string | null
          email?: string
          full_name?: string | null
          id?: string
          is_active?: boolean | null
          phone?: string | null
          preferences?: Json | null
          tenant_id?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "profiles_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      role_permissions: {
        Row: {
          created_at: string | null
          id: string
          permission_id: string
          role: Database["public"]["Enums"]["app_role"]
          tenant_id: string | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          permission_id: string
          role: Database["public"]["Enums"]["app_role"]
          tenant_id?: string | null
        }
        Update: {
          created_at?: string | null
          id?: string
          permission_id?: string
          role?: Database["public"]["Enums"]["app_role"]
          tenant_id?: string | null
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
            foreignKeyName: "role_permissions_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      service_costs: {
        Row: {
          amount: number
          category_id: string | null
          cost_date: string | null
          created_at: string | null
          description: string
          id: string
          notes: string | null
          quantity: number | null
          service_id: string
          subcategory: string | null
          tenant_id: string
          unit_price: number | null
          updated_at: string | null
        }
        Insert: {
          amount?: number
          category_id?: string | null
          cost_date?: string | null
          created_at?: string | null
          description: string
          id?: string
          notes?: string | null
          quantity?: number | null
          service_id: string
          subcategory?: string | null
          tenant_id: string
          unit_price?: number | null
          updated_at?: string | null
        }
        Update: {
          amount?: number
          category_id?: string | null
          cost_date?: string | null
          created_at?: string | null
          description?: string
          id?: string
          notes?: string | null
          quantity?: number | null
          service_id?: string
          subcategory?: string | null
          tenant_id?: string
          unit_price?: number | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "service_costs_service_id_fkey"
            columns: ["service_id"]
            isOneToOne: false
            referencedRelation: "services"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "service_costs_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      service_operators: {
        Row: {
          commission: number | null
          created_at: string | null
          hours: number | null
          id: string
          notes: string | null
          operator_id: string
          role: string | null
          service_id: string
          tenant_id: string
          updated_at: string | null
        }
        Insert: {
          commission?: number | null
          created_at?: string | null
          hours?: number | null
          id?: string
          notes?: string | null
          operator_id: string
          role?: string | null
          service_id: string
          tenant_id: string
          updated_at?: string | null
        }
        Update: {
          commission?: number | null
          created_at?: string | null
          hours?: number | null
          id?: string
          notes?: string | null
          operator_id?: string
          role?: string | null
          service_id?: string
          tenant_id?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "service_operators_operator_id_fkey"
            columns: ["operator_id"]
            isOneToOne: false
            referencedRelation: "operators"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "service_operators_service_id_fkey"
            columns: ["service_id"]
            isOneToOne: false
            referencedRelation: "services"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "service_operators_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      service_pipeline_stages: {
        Row: {
          color: string
          created_at: string | null
          description: string | null
          id: string
          is_active: boolean | null
          name: string
          sort_order: number
          status: Database["public"]["Enums"]["service_status"]
          tenant_id: string
        }
        Insert: {
          color?: string
          created_at?: string | null
          description?: string | null
          id?: string
          is_active?: boolean | null
          name: string
          sort_order?: number
          status: Database["public"]["Enums"]["service_status"]
          tenant_id: string
        }
        Update: {
          color?: string
          created_at?: string | null
          description?: string | null
          id?: string
          is_active?: boolean | null
          name?: string
          sort_order?: number
          status?: Database["public"]["Enums"]["service_status"]
          tenant_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "service_pipeline_stages_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      service_status_history: {
        Row: {
          changed_by: string | null
          created_at: string | null
          from_status: Database["public"]["Enums"]["service_status"] | null
          id: string
          notes: string | null
          service_id: string
          to_status: Database["public"]["Enums"]["service_status"]
        }
        Insert: {
          changed_by?: string | null
          created_at?: string | null
          from_status?: Database["public"]["Enums"]["service_status"] | null
          id?: string
          notes?: string | null
          service_id: string
          to_status: Database["public"]["Enums"]["service_status"]
        }
        Update: {
          changed_by?: string | null
          created_at?: string | null
          from_status?: Database["public"]["Enums"]["service_status"] | null
          id?: string
          notes?: string | null
          service_id?: string
          to_status?: Database["public"]["Enums"]["service_status"]
        }
        Relationships: [
          {
            foreignKeyName: "service_status_history_service_id_fkey"
            columns: ["service_id"]
            isOneToOne: false
            referencedRelation: "services"
            referencedColumns: ["id"]
          },
        ]
      }
      services: {
        Row: {
          arrival_time: string | null
          base_rate: number | null
          billing_closure_id: string | null
          client_contact_name: string | null
          client_contact_phone: string | null
          client_covered_amount: number | null
          client_id: string | null
          completion_time: string | null
          crane_id: string | null
          created_at: string | null
          created_by: string | null
          destination_address: string | null
          destination_city: string | null
          destination_lat: number | null
          destination_lng: number | null
          destination_references: string | null
          destination_state: string | null
          discounts: Json | null
          dispatch_time: string | null
          distance_km: number | null
          excess_amount: number | null
          folio: string
          folio_prefix: string | null
          has_excess: boolean | null
          highway_tolls: number | null
          id: string
          insurance_adjuster: string | null
          insurance_adjuster_phone: string | null
          insurance_claim: string | null
          insurance_company_id: string | null
          insurance_policy: string | null
          internal_notes: string | null
          invoice_id: string | null
          is_insured: boolean | null
          km_charged: number | null
          km_rate: number | null
          maneuver_charges: Json | null
          notes: string | null
          observations: string | null
          operator_id: string | null
          origin_address: string | null
          origin_city: string | null
          origin_lat: number | null
          origin_lng: number | null
          origin_references: string | null
          origin_state: string | null
          photos: Json | null
          po_file_url: string | null
          po_number: string | null
          priority: Database["public"]["Enums"]["service_priority"]
          quote_number: string | null
          request_date: string | null
          scheduled_date: string | null
          scheduled_time: string | null
          service_date: string | null
          service_value: number | null
          signature_url: string | null
          status: string
          subtotal: number | null
          surcharges: Json | null
          tax_amount: number | null
          tax_rate: number | null
          tenant_id: string
          total: number | null
          type: string
          updated_at: string | null
          vehicle_brand: string | null
          vehicle_color: string | null
          vehicle_condition:
            | Database["public"]["Enums"]["vehicle_condition"]
            | null
          vehicle_keys: boolean | null
          vehicle_model: string | null
          vehicle_notes: string | null
          vehicle_plates: string | null
          vehicle_type: Database["public"]["Enums"]["vehicle_type"] | null
          vehicle_year: number | null
          waiting_rate: number | null
          waiting_time_hours: number | null
        }
        Insert: {
          arrival_time?: string | null
          base_rate?: number | null
          billing_closure_id?: string | null
          client_contact_name?: string | null
          client_contact_phone?: string | null
          client_covered_amount?: number | null
          client_id?: string | null
          completion_time?: string | null
          crane_id?: string | null
          created_at?: string | null
          created_by?: string | null
          destination_address?: string | null
          destination_city?: string | null
          destination_lat?: number | null
          destination_lng?: number | null
          destination_references?: string | null
          destination_state?: string | null
          discounts?: Json | null
          dispatch_time?: string | null
          distance_km?: number | null
          excess_amount?: number | null
          folio: string
          folio_prefix?: string | null
          has_excess?: boolean | null
          highway_tolls?: number | null
          id?: string
          insurance_adjuster?: string | null
          insurance_adjuster_phone?: string | null
          insurance_claim?: string | null
          insurance_company_id?: string | null
          insurance_policy?: string | null
          internal_notes?: string | null
          invoice_id?: string | null
          is_insured?: boolean | null
          km_charged?: number | null
          km_rate?: number | null
          maneuver_charges?: Json | null
          notes?: string | null
          observations?: string | null
          operator_id?: string | null
          origin_address?: string | null
          origin_city?: string | null
          origin_lat?: number | null
          origin_lng?: number | null
          origin_references?: string | null
          origin_state?: string | null
          photos?: Json | null
          po_file_url?: string | null
          po_number?: string | null
          priority?: Database["public"]["Enums"]["service_priority"]
          quote_number?: string | null
          request_date?: string | null
          scheduled_date?: string | null
          scheduled_time?: string | null
          service_date?: string | null
          service_value?: number | null
          signature_url?: string | null
          status?: string
          subtotal?: number | null
          surcharges?: Json | null
          tax_amount?: number | null
          tax_rate?: number | null
          tenant_id: string
          total?: number | null
          type?: string
          updated_at?: string | null
          vehicle_brand?: string | null
          vehicle_color?: string | null
          vehicle_condition?:
            | Database["public"]["Enums"]["vehicle_condition"]
            | null
          vehicle_keys?: boolean | null
          vehicle_model?: string | null
          vehicle_notes?: string | null
          vehicle_plates?: string | null
          vehicle_type?: Database["public"]["Enums"]["vehicle_type"] | null
          vehicle_year?: number | null
          waiting_rate?: number | null
          waiting_time_hours?: number | null
        }
        Update: {
          arrival_time?: string | null
          base_rate?: number | null
          billing_closure_id?: string | null
          client_contact_name?: string | null
          client_contact_phone?: string | null
          client_covered_amount?: number | null
          client_id?: string | null
          completion_time?: string | null
          crane_id?: string | null
          created_at?: string | null
          created_by?: string | null
          destination_address?: string | null
          destination_city?: string | null
          destination_lat?: number | null
          destination_lng?: number | null
          destination_references?: string | null
          destination_state?: string | null
          discounts?: Json | null
          dispatch_time?: string | null
          distance_km?: number | null
          excess_amount?: number | null
          folio?: string
          folio_prefix?: string | null
          has_excess?: boolean | null
          highway_tolls?: number | null
          id?: string
          insurance_adjuster?: string | null
          insurance_adjuster_phone?: string | null
          insurance_claim?: string | null
          insurance_company_id?: string | null
          insurance_policy?: string | null
          internal_notes?: string | null
          invoice_id?: string | null
          is_insured?: boolean | null
          km_charged?: number | null
          km_rate?: number | null
          maneuver_charges?: Json | null
          notes?: string | null
          observations?: string | null
          operator_id?: string | null
          origin_address?: string | null
          origin_city?: string | null
          origin_lat?: number | null
          origin_lng?: number | null
          origin_references?: string | null
          origin_state?: string | null
          photos?: Json | null
          po_file_url?: string | null
          po_number?: string | null
          priority?: Database["public"]["Enums"]["service_priority"]
          quote_number?: string | null
          request_date?: string | null
          scheduled_date?: string | null
          scheduled_time?: string | null
          service_date?: string | null
          service_value?: number | null
          signature_url?: string | null
          status?: string
          subtotal?: number | null
          surcharges?: Json | null
          tax_amount?: number | null
          tax_rate?: number | null
          tenant_id?: string
          total?: number | null
          type?: string
          updated_at?: string | null
          vehicle_brand?: string | null
          vehicle_color?: string | null
          vehicle_condition?:
            | Database["public"]["Enums"]["vehicle_condition"]
            | null
          vehicle_keys?: boolean | null
          vehicle_model?: string | null
          vehicle_notes?: string | null
          vehicle_plates?: string | null
          vehicle_type?: Database["public"]["Enums"]["vehicle_type"] | null
          vehicle_year?: number | null
          waiting_rate?: number | null
          waiting_time_hours?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "services_billing_closure_id_fkey"
            columns: ["billing_closure_id"]
            isOneToOne: false
            referencedRelation: "billing_closures"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "services_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "services_crane_id_fkey"
            columns: ["crane_id"]
            isOneToOne: false
            referencedRelation: "cranes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "services_insurance_company_id_fkey"
            columns: ["insurance_company_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "services_invoice_id_fkey"
            columns: ["invoice_id"]
            isOneToOne: false
            referencedRelation: "invoices"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "services_operator_id_fkey"
            columns: ["operator_id"]
            isOneToOne: false
            referencedRelation: "operators"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "services_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      supplier_products: {
        Row: {
          created_at: string | null
          description: string | null
          id: string
          is_active: boolean | null
          lead_time_days: number | null
          name: string
          product_code: string | null
          supplier_id: string
          unit: Database["public"]["Enums"]["inventory_unit"] | null
          unit_price: number | null
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          description?: string | null
          id?: string
          is_active?: boolean | null
          lead_time_days?: number | null
          name: string
          product_code?: string | null
          supplier_id: string
          unit?: Database["public"]["Enums"]["inventory_unit"] | null
          unit_price?: number | null
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          description?: string | null
          id?: string
          is_active?: boolean | null
          lead_time_days?: number | null
          name?: string
          product_code?: string | null
          supplier_id?: string
          unit?: Database["public"]["Enums"]["inventory_unit"] | null
          unit_price?: number | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "supplier_products_supplier_id_fkey"
            columns: ["supplier_id"]
            isOneToOne: false
            referencedRelation: "suppliers"
            referencedColumns: ["id"]
          },
        ]
      }
      suppliers: {
        Row: {
          address: string | null
          bank_account: string | null
          bank_name: string | null
          category: Database["public"]["Enums"]["supplier_category"]
          city: string | null
          clabe: string | null
          code: string
          contact_email: string | null
          contact_name: string | null
          contact_phone: string | null
          country: string | null
          created_at: string | null
          created_by: string | null
          credit_limit: number | null
          email: string | null
          id: string
          is_active: boolean | null
          name: string
          notes: string | null
          payment_terms: number | null
          phone: string | null
          rating: number | null
          state: string | null
          tax_id: string | null
          tax_regime: string | null
          tenant_id: string
          trade_name: string | null
          updated_at: string | null
          website: string | null
          zip_code: string | null
        }
        Insert: {
          address?: string | null
          bank_account?: string | null
          bank_name?: string | null
          category?: Database["public"]["Enums"]["supplier_category"]
          city?: string | null
          clabe?: string | null
          code: string
          contact_email?: string | null
          contact_name?: string | null
          contact_phone?: string | null
          country?: string | null
          created_at?: string | null
          created_by?: string | null
          credit_limit?: number | null
          email?: string | null
          id?: string
          is_active?: boolean | null
          name: string
          notes?: string | null
          payment_terms?: number | null
          phone?: string | null
          rating?: number | null
          state?: string | null
          tax_id?: string | null
          tax_regime?: string | null
          tenant_id: string
          trade_name?: string | null
          updated_at?: string | null
          website?: string | null
          zip_code?: string | null
        }
        Update: {
          address?: string | null
          bank_account?: string | null
          bank_name?: string | null
          category?: Database["public"]["Enums"]["supplier_category"]
          city?: string | null
          clabe?: string | null
          code?: string
          contact_email?: string | null
          contact_name?: string | null
          contact_phone?: string | null
          country?: string | null
          created_at?: string | null
          created_by?: string | null
          credit_limit?: number | null
          email?: string | null
          id?: string
          is_active?: boolean | null
          name?: string
          notes?: string | null
          payment_terms?: number | null
          phone?: string | null
          rating?: number | null
          state?: string | null
          tax_id?: string | null
          tax_regime?: string | null
          tenant_id?: string
          trade_name?: string | null
          updated_at?: string | null
          website?: string | null
          zip_code?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "suppliers_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      tenants: {
        Row: {
          address: string | null
          created_at: string | null
          email: string | null
          folio_format: string | null
          id: string
          is_active: boolean | null
          is_trial: boolean | null
          logo_url: string | null
          max_cranes: number | null
          max_users: number | null
          name: string
          next_folio_number: number | null
          phone: string | null
          plan: string | null
          primary_color: string | null
          slug: string
          tax_id: string | null
          trial_ends_at: string | null
          updated_at: string | null
        }
        Insert: {
          address?: string | null
          created_at?: string | null
          email?: string | null
          folio_format?: string | null
          id?: string
          is_active?: boolean | null
          is_trial?: boolean | null
          logo_url?: string | null
          max_cranes?: number | null
          max_users?: number | null
          name: string
          next_folio_number?: number | null
          phone?: string | null
          plan?: string | null
          primary_color?: string | null
          slug: string
          tax_id?: string | null
          trial_ends_at?: string | null
          updated_at?: string | null
        }
        Update: {
          address?: string | null
          created_at?: string | null
          email?: string | null
          folio_format?: string | null
          id?: string
          is_active?: boolean | null
          is_trial?: boolean | null
          logo_url?: string | null
          max_cranes?: number | null
          max_users?: number | null
          name?: string
          next_folio_number?: number | null
          phone?: string | null
          plan?: string | null
          primary_color?: string | null
          slug?: string
          tax_id?: string | null
          trial_ends_at?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      trial_settings: {
        Row: {
          allowed_durations: number[] | null
          created_at: string | null
          default_duration_days: number | null
          id: string
          is_active: boolean | null
          trial_plan: string | null
          updated_at: string | null
        }
        Insert: {
          allowed_durations?: number[] | null
          created_at?: string | null
          default_duration_days?: number | null
          id?: string
          is_active?: boolean | null
          trial_plan?: string | null
          updated_at?: string | null
        }
        Update: {
          allowed_durations?: number[] | null
          created_at?: string | null
          default_duration_days?: number | null
          id?: string
          is_active?: boolean | null
          trial_plan?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      trial_audit_logs: {
        Row: {
          action: string
          actor_id: string | null
          created_at: string | null
          details: Json | null
          id: string
          target_tenant_id: string | null
        }
        Insert: {
          action: string
          actor_id?: string | null
          created_at?: string | null
          details?: Json | null
          id?: string
          target_tenant_id?: string | null
        }
        Update: {
          action?: string
          actor_id?: string | null
          created_at?: string | null
          details?: Json | null
          id?: string
          target_tenant_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "trial_audit_logs_actor_id_fkey"
            columns: ["actor_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "trial_audit_logs_target_tenant_id_fkey"
            columns: ["target_tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          }
        ]
      }
      upgrade_requests: {
        Row: {
          contact_email: string
          contact_name: string
          contact_phone: string | null
          created_at: string
          current_plan: string
          id: string
          message: string | null
          processed_at: string | null
          processed_by: string | null
          requested_plan: string
          status: string
          tenant_id: string
        }
        Insert: {
          contact_email: string
          contact_name: string
          contact_phone?: string | null
          created_at?: string
          current_plan: string
          id?: string
          message?: string | null
          processed_at?: string | null
          processed_by?: string | null
          requested_plan: string
          status?: string
          tenant_id: string
        }
        Update: {
          contact_email?: string
          contact_name?: string
          contact_phone?: string | null
          created_at?: string
          current_plan?: string
          id?: string
          message?: string | null
          processed_at?: string | null
          processed_by?: string | null
          requested_plan?: string
          status?: string
          tenant_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "upgrade_requests_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      user_roles: {
        Row: {
          created_at: string | null
          id: string
          role: Database["public"]["Enums"]["app_role"]
          tenant_id: string | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          tenant_id?: string | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          tenant_id?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_roles_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      create_tenant_for_user: {
        Args: {
          _address?: string
          _email?: string
          _phone?: string
          _tax_id?: string
          _tenant_name: string
          _tenant_slug: string
          _user_id: string
        }
        Returns: string
      }
      generate_client_code: { Args: { _tenant_id: string }; Returns: string }
      generate_closure_folio: { Args: { _tenant_id: string }; Returns: string }
      generate_commission_folio: {
        Args: { _tenant_id: string }
        Returns: string
      }
      generate_crane_unit_number: {
        Args: { _tenant_id: string }
        Returns: string
      }
      generate_database_backup: { Args: never; Returns: string }
      generate_employee_number: {
        Args: { _tenant_id: string }
        Returns: string
      }
      generate_inventory_code: { Args: { _tenant_id: string }; Returns: string }
      generate_invoice_folio: { Args: { _tenant_id: string }; Returns: string }
      generate_quick_backup: { Args: never; Returns: Json }
      generate_service_folio: { Args: { _tenant_id: string }; Returns: string }
      generate_supplier_code: { Args: { _tenant_id: string }; Returns: string }
      get_user_tenant_id: { Args: { _user_id: string }; Returns: string }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      is_super_admin: { Args: { _user_id: string }; Returns: boolean }
      seed_status_catalogs_for_tenant: {
        Args: { _tenant_id: string }
        Returns: undefined
      }
    }
    Enums: {
      app_role: "super_admin" | "admin" | "dispatcher" | "operator"
      client_category: "A" | "B" | "C"
      client_type: "particular" | "empresa" | "aseguradora" | "gobierno"
      closure_status:
        | "draft"
        | "review"
        | "client_review"
        | "approved"
        | "invoicing"
        | "invoiced"
        | "cancelled"
        | "closed"
      commission_status: "pending" | "approved" | "paid" | "cancelled"
      commission_type: "percentage" | "fixed" | "mixed"
      cost_category:
        | "materials"
        | "labor"
        | "services"
        | "taxes"
        | "transport"
        | "equipment"
        | "other"
      cost_status: "draft" | "pending_approval" | "approved" | "rejected"
      crane_status:
        | "available"
        | "in_service"
        | "maintenance"
        | "out_of_service"
      crane_type: "plataforma" | "arrastre" | "pesada" | "lowboy" | "auxilio"
      document_type:
        | "insurance"
        | "permit"
        | "verification"
        | "registration"
        | "license"
        | "ine"
        | "medical"
        | "training"
        | "other"
      inventory_category:
        | "parts"
        | "tires"
        | "oil"
        | "tools"
        | "equipment"
        | "consumables"
        | "other"
      inventory_unit: "piece" | "liter" | "kg" | "set" | "service" | "hour"
      invoice_status:
        | "draft"
        | "pending"
        | "sent"
        | "paid"
        | "partial"
        | "overdue"
        | "cancelled"
      maintenance_status:
        | "scheduled"
        | "in_progress"
        | "completed"
        | "cancelled"
      maintenance_type: "preventive" | "corrective"
      movement_type: "in" | "out" | "adjustment" | "transfer"
      operator_status: "active" | "inactive" | "vacation" | "suspended"
      payment_method: "cash" | "transfer" | "check" | "card"
      payment_status: "pending" | "confirmed" | "rejected"
      reconciliation_status: "pending" | "matched" | "unmatched" | "disputed"
      service_priority: "normal" | "urgent"
      service_status:
        | "draft"
        | "quoted"
        | "confirmed"
        | "assigned"
        | "en_route"
        | "on_site"
        | "in_progress"
        | "completed"
        | "invoiced"
        | "cancelled"
      service_type: "local" | "foraneo" | "pension" | "maniobra" | "auxilio"
      supplier_category:
        | "maintenance"
        | "tires"
        | "fuel"
        | "parts"
        | "services"
        | "other"
      vehicle_condition: "runs" | "neutral" | "blocked" | "accident"
      vehicle_type:
        | "sedan"
        | "suv"
        | "pickup"
        | "van"
        | "truck"
        | "motorcycle"
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
      app_role: ["super_admin", "admin", "dispatcher", "operator"],
      client_category: ["A", "B", "C"],
      client_type: ["particular", "empresa", "aseguradora", "gobierno"],
      closure_status: [
        "draft",
        "review",
        "client_review",
        "approved",
        "invoicing",
        "invoiced",
        "cancelled",
        "closed",
      ],
      commission_status: ["pending", "approved", "paid", "cancelled"],
      commission_type: ["percentage", "fixed", "mixed"],
      cost_category: [
        "materials",
        "labor",
        "services",
        "taxes",
        "transport",
        "equipment",
        "other",
      ],
      cost_status: ["draft", "pending_approval", "approved", "rejected"],
      crane_status: [
        "available",
        "in_service",
        "maintenance",
        "out_of_service",
      ],
      crane_type: ["plataforma", "arrastre", "pesada", "lowboy", "auxilio"],
      document_type: [
        "insurance",
        "permit",
        "verification",
        "registration",
        "license",
        "ine",
        "medical",
        "training",
        "other",
      ],
      inventory_category: [
        "parts",
        "tires",
        "oil",
        "tools",
        "equipment",
        "consumables",
        "other",
      ],
      inventory_unit: ["piece", "liter", "kg", "set", "service", "hour"],
      invoice_status: [
        "draft",
        "pending",
        "sent",
        "paid",
        "partial",
        "overdue",
        "cancelled",
      ],
      maintenance_status: [
        "scheduled",
        "in_progress",
        "completed",
        "cancelled",
      ],
      maintenance_type: ["preventive", "corrective"],
      movement_type: ["in", "out", "adjustment", "transfer"],
      operator_status: ["active", "inactive", "vacation", "suspended"],
      payment_method: ["cash", "transfer", "check", "card"],
      payment_status: ["pending", "confirmed", "rejected"],
      reconciliation_status: ["pending", "matched", "unmatched", "disputed"],
      service_priority: ["normal", "urgent"],
      service_status: [
        "draft",
        "quoted",
        "confirmed",
        "assigned",
        "en_route",
        "on_site",
        "in_progress",
        "completed",
        "invoiced",
        "cancelled",
      ],
      service_type: ["local", "foraneo", "pension", "maniobra", "auxilio"],
      supplier_category: [
        "maintenance",
        "tires",
        "fuel",
        "parts",
        "services",
        "other",
      ],
      vehicle_condition: ["runs", "neutral", "blocked", "accident"],
      vehicle_type: [
        "sedan",
        "suv",
        "pickup",
        "van",
        "truck",
        "motorcycle",
        "other",
      ],
    },
  },
} as const
