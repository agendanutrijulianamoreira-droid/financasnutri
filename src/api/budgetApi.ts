import { supabase } from '../lib/supabaseClient';
import { parseSupabaseError } from '../lib/errors';
import { createBudgetSchema, type CreateBudgetInput } from '../lib/validations';
import type { Budget, BudgetWithSpent } from '../types';

export const budgetApi = {
  async listWithSpent(month: number, year: number): Promise<BudgetWithSpent[]> {
    const { data: budgets, error } = await supabase
      .from('budgets')
      .select('*')
      .eq('year', year)
      .or(`month.eq.${month},month.is.null`)
      .order('category');
    if (error) throw parseSupabaseError(error);

    const startDate = `${year}-${String(month).padStart(2, '0')}-01`;
    const endDate = new Date(year, month, 0).toISOString().split('T')[0];

    const { data: transactions, error: txErr } = await supabase
      .from('transactions')
      .select('category, amount, person_type')
      .eq('type', 'EXPENSE')
      .eq('is_confirmed', true)
      .gte('date', startDate)
      .lte('date', endDate);
    if (txErr) throw parseSupabaseError(txErr);

    return (budgets as Budget[]).map((b) => {
      const spent = (transactions ?? [])
        .filter((t) => t.category === b.category && t.person_type === b.person_type)
        .reduce((sum, t) => sum + Number(t.amount), 0);
      const remaining = Math.max(0, b.amount - spent);
      const percentage_used = b.amount > 0 ? (spent / b.amount) * 100 : 0;
      return { ...b, spent, remaining, percentage_used };
    });
  },

  async create(input: CreateBudgetInput): Promise<Budget> {
    const validated = createBudgetSchema.parse(input);
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Usuário não autenticado');

    const { data, error } = await supabase
      .from('budgets')
      .upsert({ ...validated, user_id: user.id }, { onConflict: 'user_id,person_type,category,period,month,year' })
      .select()
      .single();
    if (error) throw parseSupabaseError(error);
    return data as Budget;
  },

  async remove(id: string): Promise<void> {
    const { error } = await supabase.from('budgets').delete().eq('id', id);
    if (error) throw parseSupabaseError(error);
  },
};
