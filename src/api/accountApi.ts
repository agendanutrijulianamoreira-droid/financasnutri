import { supabase } from '../lib/supabaseClient';
import { parseSupabaseError } from '../lib/errors';
import { createAccountSchema, type CreateAccountInput } from '../lib/validations';
import type { Account, PersonType } from '../types';

export const accountApi = {
  async list(person_type?: PersonType): Promise<Account[]> {
    let query = supabase
      .from('accounts')
      .select('*')
      .eq('is_active', true)
      .order('name');

    if (person_type) query = query.eq('person_type', person_type);

    const { data, error } = await query;
    if (error) throw parseSupabaseError(error);
    return data as Account[];
  },

  async create(input: CreateAccountInput): Promise<Account> {
    const { initial_balance, ...validated } = createAccountSchema.parse(input);
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Usuário não autenticado');

    const { data, error } = await supabase
      .from('accounts')
      .insert({ ...validated, user_id: user.id, balance: initial_balance ?? 0 })
      .select()
      .single();

    if (error) throw parseSupabaseError(error);
    return data as Account;
  },

  async deactivate(id: string): Promise<void> {
    const { error } = await supabase
      .from('accounts')
      .update({ is_active: false })
      .eq('id', id);
    if (error) throw parseSupabaseError(error);
  },
};
