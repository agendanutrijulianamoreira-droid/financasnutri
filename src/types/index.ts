// ─── Enums ────────────────────────────────────────────────────────────────────

export enum PersonType {
  PF = 'PF', // Pessoa Física
  PJ = 'PJ', // Pessoa Jurídica
}

export enum TransactionType {
  INCOME = 'INCOME',
  EXPENSE = 'EXPENSE',
  TRANSFER = 'TRANSFER',
}

export enum TransactionCategory {
  // Receitas
  SALARY = 'SALARY',
  CONSULTING = 'CONSULTING',
  INVESTMENT_RETURN = 'INVESTMENT_RETURN',
  PROFIT_DISTRIBUTION = 'PROFIT_DISTRIBUTION',
  OTHER_INCOME = 'OTHER_INCOME',
  // Despesas
  HOUSING = 'HOUSING',
  FOOD = 'FOOD',
  HEALTH = 'HEALTH',
  EDUCATION = 'EDUCATION',
  TRANSPORTATION = 'TRANSPORTATION',
  LEISURE = 'LEISURE',
  INSURANCE = 'INSURANCE',
  TAXES = 'TAXES',
  OPERATIONAL = 'OPERATIONAL',
  OTHER_EXPENSE = 'OTHER_EXPENSE',
}

export enum AccountType {
  CHECKING = 'CHECKING',
  SAVINGS = 'SAVINGS',
  INVESTMENT = 'INVESTMENT',
  CREDIT_CARD = 'CREDIT_CARD',
  CASH = 'CASH',
}

export enum AssetType {
  FIXED_INCOME = 'FIXED_INCOME',
  VARIABLE_INCOME = 'VARIABLE_INCOME',
  REAL_ESTATE = 'REAL_ESTATE',
  CRYPTO = 'CRYPTO',
  PENSION = 'PENSION',
  OTHER = 'OTHER',
}

export enum InsuranceType {
  LIFE = 'LIFE',
  HEALTH = 'HEALTH',
  AUTO = 'AUTO',
  HOME = 'HOME',
  PROFESSIONAL_LIABILITY = 'PROFESSIONAL_LIABILITY',
  OTHER = 'OTHER',
}

export enum BudgetPeriod {
  MONTHLY = 'MONTHLY',
  YEARLY = 'YEARLY',
}

export enum GoalStatus {
  ACTIVE = 'ACTIVE',
  COMPLETED = 'COMPLETED',
  PAUSED = 'PAUSED',
  CANCELLED = 'CANCELLED',
}

// ─── Base Entity ──────────────────────────────────────────────────────────────

interface BaseEntity {
  id: string;
  created_at: string;
  updated_at: string;
}

// ─── User ─────────────────────────────────────────────────────────────────────

export interface User extends BaseEntity {
  email: string;
  full_name: string;
  avatar_url: string | null;
  profession: string | null;
  phone: string | null;
  // Metas pessoais
  monthly_income_target: number | null;
  emergency_fund_months: number; // quantos meses de reserva deseja
  financial_independence_target: number | null; // patrimônio alvo
}

export interface UserProfile extends User {
  pf_profile: PFProfile | null;
  pj_profile: PJProfile | null;
}

export interface PFProfile extends BaseEntity {
  user_id: string;
  cpf: string | null;
  tax_bracket: number | null; // alíquota IRPF
}

export interface PJProfile extends BaseEntity {
  user_id: string;
  cnpj: string;
  company_name: string;
  tax_regime: 'SIMPLES' | 'LUCRO_PRESUMIDO' | 'LUCRO_REAL';
  pro_labore: number | null;
}

// ─── Account ──────────────────────────────────────────────────────────────────

export interface Account extends BaseEntity {
  user_id: string;
  name: string;
  bank_name: string;
  type: AccountType;
  person_type: PersonType;
  balance: number;
  currency: string;
  is_active: boolean;
  color: string | null;
  icon: string | null;
}

// ─── Transaction ──────────────────────────────────────────────────────────────

export interface Transaction extends BaseEntity {
  user_id: string;
  account_id: string;
  person_type: PersonType;
  type: TransactionType;
  category: TransactionCategory;
  amount: number;
  description: string;
  date: string; // ISO date string
  is_recurring: boolean;
  recurrence_id: string | null;
  tags: string[];
  notes: string | null;
  attachments: string[];
  is_confirmed: boolean;
}

export interface TransactionWithAccount extends Transaction {
  account: Pick<Account, 'id' | 'name' | 'bank_name' | 'color'>;
}

export interface RecurringTransaction extends BaseEntity {
  user_id: string;
  account_id: string;
  person_type: PersonType;
  type: TransactionType;
  category: TransactionCategory;
  amount: number;
  description: string;
  frequency: 'DAILY' | 'WEEKLY' | 'MONTHLY' | 'YEARLY';
  start_date: string;
  end_date: string | null;
  day_of_month: number | null;
  is_active: boolean;
}

// ─── Budget ───────────────────────────────────────────────────────────────────

export interface Budget extends BaseEntity {
  user_id: string;
  person_type: PersonType;
  category: TransactionCategory;
  period: BudgetPeriod;
  amount: number;
  month: number | null; // 1-12, null when yearly
  year: number;
}

export interface BudgetWithSpent extends Budget {
  spent: number;
  remaining: number;
  percentage_used: number;
}

// ─── Financial Goal ───────────────────────────────────────────────────────────

export interface FinancialGoal extends BaseEntity {
  user_id: string;
  name: string;
  description: string | null;
  target_amount: number;
  current_amount: number;
  target_date: string;
  status: GoalStatus;
  person_type: PersonType;
  monthly_contribution: number;
  color: string | null;
  icon: string | null;
}

// ─── Asset (Patrimônio) ───────────────────────────────────────────────────────

export interface Asset extends BaseEntity {
  user_id: string;
  name: string;
  type: AssetType;
  person_type: PersonType;
  institution: string;
  current_value: number;
  purchase_value: number | null;
  purchase_date: string | null;
  annual_return_rate: number | null; // % ao ano
  is_liquid: boolean;
  notes: string | null;
}

export interface AssetHistory extends BaseEntity {
  asset_id: string;
  user_id: string;
  value: number;
  recorded_at: string;
}

// ─── Insurance ────────────────────────────────────────────────────────────────

export interface Insurance extends BaseEntity {
  user_id: string;
  name: string;
  type: InsuranceType;
  insurer: string;
  policy_number: string | null;
  monthly_premium: number;
  coverage_amount: number;
  start_date: string;
  end_date: string | null;
  is_active: boolean;
  notes: string | null;
}

// ─── Monthly Report ───────────────────────────────────────────────────────────

export interface MonthlyReport extends BaseEntity {
  user_id: string;
  month: number;
  year: number;
  // PF
  pf_total_income: number;
  pf_total_expenses: number;
  pf_net_result: number;
  // PJ
  pj_gross_revenue: number;
  pj_total_expenses: number;
  pj_taxes_paid: number;
  pj_net_profit: number;
  pj_pro_labore: number;
  pj_profit_distribution: number;
  // Consolidated
  total_savings: number;
  total_investments_added: number;
  net_worth_snapshot: number;
  report_data: Record<string, unknown>; // JSON completo do relatório
}

// ─── API / Form DTOs ──────────────────────────────────────────────────────────

export type CreateTransactionDTO = Omit<Transaction, keyof BaseEntity | 'user_id' | 'recurrence_id' | 'attachments' | 'is_confirmed'> & {
  is_confirmed?: boolean;
};

export type UpdateTransactionDTO = Partial<CreateTransactionDTO>;

export type CreateAccountDTO = Omit<Account, keyof BaseEntity | 'user_id' | 'balance'> & {
  initial_balance?: number;
};

export type CreateGoalDTO = Omit<FinancialGoal, keyof BaseEntity | 'user_id' | 'current_amount' | 'status'>;

export type CreateAssetDTO = Omit<Asset, keyof BaseEntity | 'user_id'>;

export type CreateBudgetDTO = Omit<Budget, keyof BaseEntity | 'user_id'>;

// ─── Dashboard Aggregates ─────────────────────────────────────────────────────

export interface DashboardSummary {
  total_balance: number;
  pf_balance: number;
  pj_balance: number;
  monthly_income: number;
  monthly_expenses: number;
  monthly_savings: number;
  savings_rate: number; // %
  net_worth: number;
  liquid_assets: number;
}

export interface FinancialIndependenceProjection {
  current_net_worth: number;
  monthly_contribution: number;
  target_amount: number;
  annual_return_rate: number;
  months_to_independence: number;
  projected_date: string;
  monthly_passive_income: number;
}
