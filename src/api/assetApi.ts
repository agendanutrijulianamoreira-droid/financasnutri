import { supabase } from '../lib/supabaseClient';
import { parseSupabaseError } from '../lib/errors';
import { createAssetSchema, type CreateAssetInput } from '../lib/validations';
import type { Asset } from '../types';

export const assetApi = {
  async list(): Promise<Asset[]> {
    const { data, error } = await supabase
      .from('assets')
      .select('*')
      .order('current_value', { ascending: false });
    if (error) throw parseSupabaseError(error);
    return data as Asset[];
  },

  async create(input: CreateAssetInput): Promise<Asset> {
    const validated = createAssetSchema.parse(input);
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Usuário não autenticado');

    const { data, error } = await supabase
      .from('assets')
      .insert({ ...validated, user_id: user.id })
      .select()
      .single();
    if (error) throw parseSupabaseError(error);
    return data as Asset;
  },

  async updateValue(id: string, currentValue: number): Promise<void> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Usuário não autenticado');

    const { error: histErr } = await supabase.from('asset_history').insert({
      asset_id: id,
      user_id: user.id,
      value: currentValue,
    });
    if (histErr) throw parseSupabaseError(histErr);

    const { error } = await supabase.from('assets').update({ current_value: currentValue }).eq('id', id);
    if (error) throw parseSupabaseError(error);
  },

  async remove(id: string): Promise<void> {
    const { error } = await supabase.from('assets').delete().eq('id', id);
    if (error) throw parseSupabaseError(error);
  },
};
