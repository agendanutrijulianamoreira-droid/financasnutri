import { supabase } from '../lib/supabaseClient';
import { parseSupabaseError } from '../lib/errors';
import type { UserProfile, PFProfile, PJProfile } from '../types';
import type { Database } from '../lib/database.types';

type ProfileUpdate = Partial<Omit<Database['public']['Tables']['user_profiles']['Update'], 'id'>>;
type PFUpdate = Partial<Omit<Database['public']['Tables']['pf_profiles']['Update'], 'user_id'>>;
type PJUpdate = Partial<Omit<Database['public']['Tables']['pj_profiles']['Update'], 'user_id'>>;

export const profileApi = {
  async get(): Promise<UserProfile> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Não autenticado');

    const [profileRes, pfRes, pjRes] = await Promise.all([
      supabase.from('user_profiles').select('*').eq('id', user.id).single(),
      supabase.from('pf_profiles').select('*').eq('user_id', user.id).maybeSingle(),
      supabase.from('pj_profiles').select('*').eq('user_id', user.id).maybeSingle(),
    ]);

    if (profileRes.error) throw parseSupabaseError(profileRes.error);

    return {
      ...profileRes.data,
      pf_profile: (pfRes.data ?? null) as PFProfile | null,
      pj_profile: (pjRes.data ?? null) as PJProfile | null,
    } as UserProfile;
  },

  async updateProfile(data: ProfileUpdate): Promise<void> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Não autenticado');

    const { error } = await supabase.from('user_profiles').update(data).eq('id', user.id);
    if (error) throw parseSupabaseError(error);
  },

  async upsertPF(data: PFUpdate): Promise<void> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Não autenticado');

    const { error } = await supabase
      .from('pf_profiles')
      .upsert({ ...data, user_id: user.id }, { onConflict: 'user_id' });
    if (error) throw parseSupabaseError(error);
  },

  async upsertPJ(data: PJUpdate & { cnpj: string; company_name: string }): Promise<void> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Não autenticado');

    const { error } = await supabase
      .from('pj_profiles')
      .upsert({ ...data, user_id: user.id }, { onConflict: 'user_id' });
    if (error) throw parseSupabaseError(error);
  },
};
