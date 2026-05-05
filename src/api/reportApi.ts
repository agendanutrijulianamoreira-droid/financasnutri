import { supabase } from '../lib/supabaseClient';
import { parseSupabaseError } from '../lib/errors';
import type { MonthlyReport } from '../types';

export const reportApi = {
  async list(): Promise<MonthlyReport[]> {
    const { data, error } = await supabase
      .from('monthly_reports')
      .select('*')
      .order('year', { ascending: false })
      .order('month', { ascending: false });
    if (error) throw parseSupabaseError(error);
    return data as MonthlyReport[];
  },

  async get(month: number, year: number): Promise<MonthlyReport | null> {
    const { data, error } = await supabase
      .from('monthly_reports')
      .select('*')
      .eq('month', month)
      .eq('year', year)
      .maybeSingle();
    if (error) throw parseSupabaseError(error);
    return data as MonthlyReport | null;
  },

  async triggerClose(month: number, year: number): Promise<MonthlyReport> {
    const { data: sessionData } = await supabase.auth.getSession();
    const token = sessionData.session?.access_token;
    if (!token) throw new Error('Sessão inválida');

    const res = await fetch(
      `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/monthly-close`,
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ month, year }),
      },
    );

    if (!res.ok) {
      const err = await res.json() as { error?: string };
      throw new Error(err.error ?? 'Erro ao processar fechamento');
    }

    const json = await res.json() as { data: MonthlyReport };
    return json.data;
  },
};
