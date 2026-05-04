// Auto-generated types that mirror the Supabase schema.
// Run `supabase gen types typescript --local` to regenerate after migrations.

export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[];

export interface Database {
  public: {
    Tables: {
      user_profiles: {
        Row: {
          id: string;
          email: string;
          full_name: string;
          avatar_url: string | null;
          profession: string | null;
          phone: string | null;
          monthly_income_target: number | null;
          emergency_fund_months: number;
          financial_independence_target: number | null;
          created_at: string;
          updated_at: string;
        };
        Insert: Omit<Database['public']['Tables']['user_profiles']['Row'], 'created_at' | 'updated_at'>;
        Update: Partial<Database['public']['Tables']['user_profiles']['Insert']>;
      };
      pf_profiles: {
        Row: {
          id: string;
          user_id: string;
          cpf: string | null;
          tax_bracket: number | null;
          created_at: string;
          updated_at: string;
        };
        Insert: Omit<Database['public']['Tables']['pf_profiles']['Row'], 'id' | 'created_at' | 'updated_at'>;
        Update: Partial<Database['public']['Tables']['pf_profiles']['Insert']>;
      };
      pj_profiles: {
        Row: {
          id: string;
          user_id: string;
          cnpj: string;
          company_name: string;
          tax_regime: 'SIMPLES' | 'LUCRO_PRESUMIDO' | 'LUCRO_REAL';
          pro_labore: number | null;
          created_at: string;
          updated_at: string;
        };
        Insert: Omit<Database['public']['Tables']['pj_profiles']['Row'], 'id' | 'created_at' | 'updated_at'>;
        Update: Partial<Database['public']['Tables']['pj_profiles']['Insert']>;
      };
      accounts: {
        Row: {
          id: string;
          user_id: string;
          name: string;
          bank_name: string;
          type: 'CHECKING' | 'SAVINGS' | 'INVESTMENT' | 'CREDIT_CARD' | 'CASH';
          person_type: 'PF' | 'PJ';
          balance: number;
          currency: string;
          is_active: boolean;
          color: string | null;
          icon: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: Omit<Database['public']['Tables']['accounts']['Row'], 'id' | 'created_at' | 'updated_at'>;
        Update: Partial<Database['public']['Tables']['accounts']['Insert']>;
      };
      transactions: {
        Row: {
          id: string;
          user_id: string;
          account_id: string;
          recurrence_id: string | null;
          person_type: 'PF' | 'PJ';
          type: 'INCOME' | 'EXPENSE' | 'TRANSFER';
          category: string;
          amount: number;
          description: string;
          date: string;
          is_recurring: boolean;
          tags: string[];
          notes: string | null;
          attachments: string[];
          is_confirmed: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: Omit<Database['public']['Tables']['transactions']['Row'], 'id' | 'created_at' | 'updated_at'>;
        Update: Partial<Database['public']['Tables']['transactions']['Insert']>;
      };
      budgets: {
        Row: {
          id: string;
          user_id: string;
          person_type: 'PF' | 'PJ';
          category: string;
          period: 'MONTHLY' | 'YEARLY';
          amount: number;
          month: number | null;
          year: number;
          created_at: string;
          updated_at: string;
        };
        Insert: Omit<Database['public']['Tables']['budgets']['Row'], 'id' | 'created_at' | 'updated_at'>;
        Update: Partial<Database['public']['Tables']['budgets']['Insert']>;
      };
      financial_goals: {
        Row: {
          id: string;
          user_id: string;
          name: string;
          description: string | null;
          target_amount: number;
          current_amount: number;
          target_date: string;
          status: 'ACTIVE' | 'COMPLETED' | 'PAUSED' | 'CANCELLED';
          person_type: 'PF' | 'PJ';
          monthly_contribution: number;
          color: string | null;
          icon: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: Omit<Database['public']['Tables']['financial_goals']['Row'], 'id' | 'created_at' | 'updated_at'>;
        Update: Partial<Database['public']['Tables']['financial_goals']['Insert']>;
      };
      assets: {
        Row: {
          id: string;
          user_id: string;
          name: string;
          type: 'FIXED_INCOME' | 'VARIABLE_INCOME' | 'REAL_ESTATE' | 'CRYPTO' | 'PENSION' | 'OTHER';
          person_type: 'PF' | 'PJ';
          institution: string;
          current_value: number;
          purchase_value: number | null;
          purchase_date: string | null;
          annual_return_rate: number | null;
          is_liquid: boolean;
          notes: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: Omit<Database['public']['Tables']['assets']['Row'], 'id' | 'created_at' | 'updated_at'>;
        Update: Partial<Database['public']['Tables']['assets']['Insert']>;
      };
      asset_history: {
        Row: {
          id: string;
          asset_id: string;
          user_id: string;
          value: number;
          recorded_at: string;
          created_at: string;
          updated_at: string;
        };
        Insert: Omit<Database['public']['Tables']['asset_history']['Row'], 'id' | 'created_at' | 'updated_at'>;
        Update: Partial<Database['public']['Tables']['asset_history']['Insert']>;
      };
      insurances: {
        Row: {
          id: string;
          user_id: string;
          name: string;
          type: 'LIFE' | 'HEALTH' | 'AUTO' | 'HOME' | 'PROFESSIONAL_LIABILITY' | 'OTHER';
          insurer: string;
          policy_number: string | null;
          monthly_premium: number;
          coverage_amount: number;
          start_date: string;
          end_date: string | null;
          is_active: boolean;
          notes: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: Omit<Database['public']['Tables']['insurances']['Row'], 'id' | 'created_at' | 'updated_at'>;
        Update: Partial<Database['public']['Tables']['insurances']['Insert']>;
      };
      monthly_reports: {
        Row: {
          id: string;
          user_id: string;
          month: number;
          year: number;
          pf_total_income: number;
          pf_total_expenses: number;
          pf_net_result: number;
          pj_gross_revenue: number;
          pj_total_expenses: number;
          pj_taxes_paid: number;
          pj_net_profit: number;
          pj_pro_labore: number;
          pj_profit_distribution: number;
          total_savings: number;
          total_investments_added: number;
          net_worth_snapshot: number;
          report_data: Json;
          created_at: string;
          updated_at: string;
        };
        Insert: Omit<Database['public']['Tables']['monthly_reports']['Row'], 'id' | 'created_at' | 'updated_at'>;
        Update: Partial<Database['public']['Tables']['monthly_reports']['Insert']>;
      };
    };
    Views: Record<string, never>;
    Functions: Record<string, never>;
    Enums: {
      person_type: 'PF' | 'PJ';
      transaction_type: 'INCOME' | 'EXPENSE' | 'TRANSFER';
      account_type: 'CHECKING' | 'SAVINGS' | 'INVESTMENT' | 'CREDIT_CARD' | 'CASH';
      asset_type: 'FIXED_INCOME' | 'VARIABLE_INCOME' | 'REAL_ESTATE' | 'CRYPTO' | 'PENSION' | 'OTHER';
    };
  };
}
