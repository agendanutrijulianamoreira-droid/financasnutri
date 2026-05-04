import { z } from 'zod';
import { PersonType, TransactionType, TransactionCategory, AccountType, AssetType, InsuranceType, BudgetPeriod } from '../types';

// ─── Transaction ──────────────────────────────────────────────
export const createTransactionSchema = z.object({
  account_id: z.string().uuid('ID de conta inválido'),
  person_type: z.nativeEnum(PersonType),
  type: z.nativeEnum(TransactionType),
  category: z.nativeEnum(TransactionCategory),
  amount: z.number().positive('O valor deve ser positivo'),
  description: z.string().min(2, 'Descrição muito curta').max(255, 'Descrição muito longa'),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Data inválida (use YYYY-MM-DD)'),
  is_recurring: z.boolean().default(false),
  tags: z.array(z.string().max(50)).max(10).default([]),
  notes: z.string().max(1000).nullable().default(null),
  is_confirmed: z.boolean().default(true),
});

export type CreateTransactionInput = z.infer<typeof createTransactionSchema>;

// ─── Account ──────────────────────────────────────────────────
export const createAccountSchema = z.object({
  name: z.string().min(2).max(100),
  bank_name: z.string().min(2).max(100),
  type: z.nativeEnum(AccountType),
  person_type: z.nativeEnum(PersonType),
  currency: z.string().length(3).default('BRL'),
  initial_balance: z.number().default(0),
  color: z.string().regex(/^#[0-9A-Fa-f]{6}$/).nullable().default(null),
  icon: z.string().max(50).nullable().default(null),
});

export type CreateAccountInput = z.infer<typeof createAccountSchema>;

// ─── Financial Goal ───────────────────────────────────────────
export const createGoalSchema = z.object({
  name: z.string().min(2).max(100),
  description: z.string().max(500).nullable().default(null),
  target_amount: z.number().positive(),
  target_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  person_type: z.nativeEnum(PersonType),
  monthly_contribution: z.number().min(0).default(0),
  color: z.string().regex(/^#[0-9A-Fa-f]{6}$/).nullable().default(null),
  icon: z.string().max(50).nullable().default(null),
});

export type CreateGoalInput = z.infer<typeof createGoalSchema>;

// ─── Asset ────────────────────────────────────────────────────
export const createAssetSchema = z.object({
  name: z.string().min(2).max(100),
  type: z.nativeEnum(AssetType),
  person_type: z.nativeEnum(PersonType),
  institution: z.string().min(2).max(100),
  current_value: z.number().min(0),
  purchase_value: z.number().positive().nullable().default(null),
  purchase_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).nullable().default(null),
  annual_return_rate: z.number().min(-100).max(10000).nullable().default(null),
  is_liquid: z.boolean().default(false),
  notes: z.string().max(1000).nullable().default(null),
});

export type CreateAssetInput = z.infer<typeof createAssetSchema>;

// ─── Insurance ────────────────────────────────────────────────
export const createInsuranceSchema = z.object({
  name: z.string().min(2).max(100),
  type: z.nativeEnum(InsuranceType),
  insurer: z.string().min(2).max(100),
  policy_number: z.string().max(100).nullable().default(null),
  monthly_premium: z.number().min(0),
  coverage_amount: z.number().min(0),
  start_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  end_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).nullable().default(null),
  notes: z.string().max(1000).nullable().default(null),
});

export type CreateInsuranceInput = z.infer<typeof createInsuranceSchema>;

// ─── Budget ───────────────────────────────────────────────────
export const createBudgetSchema = z.object({
  person_type: z.nativeEnum(PersonType),
  category: z.nativeEnum(TransactionCategory),
  period: z.nativeEnum(BudgetPeriod),
  amount: z.number().positive(),
  month: z.number().int().min(1).max(12).nullable().default(null),
  year: z.number().int().min(2020).max(2100),
});

export type CreateBudgetInput = z.infer<typeof createBudgetSchema>;

// ─── Auth ─────────────────────────────────────────────────────
export const loginSchema = z.object({
  email: z.string().email('E-mail inválido'),
  password: z.string().min(8, 'A senha deve ter pelo menos 8 caracteres'),
});

export const signUpSchema = loginSchema.extend({
  full_name: z.string().min(2, 'Nome muito curto').max(100, 'Nome muito longo'),
  confirm_password: z.string(),
}).refine((data) => data.password === data.confirm_password, {
  message: 'As senhas não coincidem',
  path: ['confirm_password'],
});

export type LoginInput = z.infer<typeof loginSchema>;
export type SignUpInput = z.infer<typeof signUpSchema>;
