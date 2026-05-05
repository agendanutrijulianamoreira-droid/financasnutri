import { supabase } from '../lib/supabaseClient';
import { parseSupabaseError } from '../lib/errors';
import { createInsuranceSchema, type CreateInsuranceInput } from '../lib/validations';
import type { Insurance } from '../types';

export const insuranceApi = {
  async list(): Promise<Insurance[]> {
    const { data, error } = await supabase
      .from('insurances')
      .select('*')
      .order('name');
    if (error) throw parseSupabaseError(error);
    return data as Insurance[];
  },

  async create(input: CreateInsuranceInput): Promise<Insurance> {
    const validated = createInsuranceSchema.parse(input);
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Usuário não autenticado');

    const { data, error } = await supabase
      .from('insurances')
      .insert({ ...validated, user_id: user.id, is_active: true })
      .select()
      .single();
    if (error) throw parseSupabaseError(error);
    return data as Insurance;
  },

  async remove(id: string): Promise<void> {
    const { error } = await supabase.from('insurances').delete().eq('id', id);
    if (error) throw parseSupabaseError(error);
  },
};
