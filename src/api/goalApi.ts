import { supabase } from '../lib/supabaseClient';
import { parseSupabaseError } from '../lib/errors';
import { createGoalSchema, type CreateGoalInput } from '../lib/validations';
import type { FinancialGoal } from '../types';
import { GoalStatus } from '../types';

export const goalApi = {
  async list(): Promise<FinancialGoal[]> {
    const { data, error } = await supabase
      .from('financial_goals')
      .select('*')
      .order('target_date', { ascending: true });
    if (error) throw parseSupabaseError(error);
    return data as FinancialGoal[];
  },

  async create(input: CreateGoalInput): Promise<FinancialGoal> {
    const validated = createGoalSchema.parse(input);
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Usuário não autenticado');

    const { data, error } = await supabase
      .from('financial_goals')
      .insert({ ...validated, user_id: user.id, current_amount: 0, status: GoalStatus.ACTIVE })
      .select()
      .single();
    if (error) throw parseSupabaseError(error);
    return data as FinancialGoal;
  },

  async addContribution(id: string, amount: number): Promise<void> {
    const { data: goal, error: fetchErr } = await supabase
      .from('financial_goals')
      .select('current_amount, target_amount')
      .eq('id', id)
      .single();
    if (fetchErr) throw parseSupabaseError(fetchErr);

    const newAmount = Number(goal.current_amount) + amount;
    const status = newAmount >= Number(goal.target_amount) ? GoalStatus.COMPLETED : GoalStatus.ACTIVE;

    const { error } = await supabase
      .from('financial_goals')
      .update({ current_amount: newAmount, status })
      .eq('id', id);
    if (error) throw parseSupabaseError(error);
  },

  async updateStatus(id: string, status: GoalStatus): Promise<void> {
    const { error } = await supabase.from('financial_goals').update({ status }).eq('id', id);
    if (error) throw parseSupabaseError(error);
  },

  async remove(id: string): Promise<void> {
    const { error } = await supabase.from('financial_goals').delete().eq('id', id);
    if (error) throw parseSupabaseError(error);
  },
};
