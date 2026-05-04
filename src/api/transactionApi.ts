import { supabase } from '../lib/supabaseClient';
import { parseSupabaseError } from '../lib/errors';
import { createTransactionSchema, type CreateTransactionInput } from '../lib/validations';
import type { TransactionWithAccount, PersonType } from '../types';

interface ListFilters {
  person_type?: PersonType;
  month?: number;
  year?: number;
  account_id?: string;
}

export const transactionApi = {
  async list(filters: ListFilters = {}): Promise<TransactionWithAccount[]> {
    let query = supabase
      .from('transactions')
      .select(`
        *,
        account:accounts(id, name, bank_name, color)
      `)
      .order('date', { ascending: false });

    if (filters.person_type) query = query.eq('person_type', filters.person_type);
    if (filters.account_id) query = query.eq('account_id', filters.account_id);
    if (filters.month && filters.year) {
      const start = `${filters.year}-${String(filters.month).padStart(2, '0')}-01`;
      const end = new Date(filters.year, filters.month, 0).toISOString().split('T')[0];
      query = query.gte('date', start).lte('date', end);
    }

    const { data, error } = await query;
    if (error) throw parseSupabaseError(error);
    return data as TransactionWithAccount[];
  },

  async create(input: CreateTransactionInput) {
    const validated = createTransactionSchema.parse(input);
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Usuário não autenticado');

    const { data, error } = await supabase
      .from('transactions')
      .insert({ ...validated, user_id: user.id })
      .select()
      .single();

    if (error) throw parseSupabaseError(error);
    return data;
  },

  async remove(id: string) {
    const { error } = await supabase.from('transactions').delete().eq('id', id);
    if (error) throw parseSupabaseError(error);
  },
};
