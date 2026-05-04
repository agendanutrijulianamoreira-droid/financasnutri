// Edge Function: monthly-close
// Processes end-of-month financial data and upserts a monthly_report record.
// Invoke via POST /functions/v1/monthly-close  { "month": 4, "year": 2026 }

import { serve } from 'https://deno.land/std@0.177.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(JSON.stringify({ error: 'Missing Authorization header' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      { global: { headers: { Authorization: authHeader } } },
    );

    // Validate user session
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError || !user) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const body = await req.json() as { month?: number; year?: number };
    const now = new Date();
    const month: number = body.month ?? now.getMonth() + 1;
    const year: number = body.year ?? now.getFullYear();

    if (month < 1 || month > 12 || year < 2020) {
      return new Response(JSON.stringify({ error: 'Invalid month/year' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const startDate = `${year}-${String(month).padStart(2, '0')}-01`;
    const endDate = new Date(year, month, 0).toISOString().split('T')[0];

    // Fetch transactions for the period
    const { data: transactions, error: txError } = await supabase
      .from('transactions')
      .select('*')
      .eq('user_id', user.id)
      .eq('is_confirmed', true)
      .gte('date', startDate)
      .lte('date', endDate);

    if (txError) throw txError;

    // Aggregate PF
    const pfIncome = transactions
      ?.filter((t) => t.person_type === 'PF' && t.type === 'INCOME')
      .reduce((s: number, t) => s + Number(t.amount), 0) ?? 0;

    const pfExpenses = transactions
      ?.filter((t) => t.person_type === 'PF' && t.type === 'EXPENSE')
      .reduce((s: number, t) => s + Number(t.amount), 0) ?? 0;

    // Aggregate PJ
    const pjRevenue = transactions
      ?.filter((t) => t.person_type === 'PJ' && t.type === 'INCOME')
      .reduce((s: number, t) => s + Number(t.amount), 0) ?? 0;

    const pjExpenses = transactions
      ?.filter((t) => t.person_type === 'PJ' && t.type === 'EXPENSE')
      .reduce((s: number, t) => s + Number(t.amount), 0) ?? 0;

    const pjProLabore = transactions
      ?.filter((t) => t.person_type === 'PJ' && t.category === 'SALARY')
      .reduce((s: number, t) => s + Number(t.amount), 0) ?? 0;

    const pjDistribution = transactions
      ?.filter((t) => t.person_type === 'PJ' && t.category === 'PROFIT_DISTRIBUTION')
      .reduce((s: number, t) => s + Number(t.amount), 0) ?? 0;

    // Net worth snapshot
    const { data: assets } = await supabase
      .from('assets')
      .select('current_value')
      .eq('user_id', user.id);

    const netWorth = assets?.reduce((s: number, a) => s + Number(a.current_value), 0) ?? 0;

    const report = {
      user_id: user.id,
      month,
      year,
      pf_total_income: pfIncome,
      pf_total_expenses: pfExpenses,
      pf_net_result: pfIncome - pfExpenses,
      pj_gross_revenue: pjRevenue,
      pj_total_expenses: pjExpenses,
      pj_taxes_paid: 0, // computed separately via PJ distribution logic
      pj_net_profit: pjRevenue - pjExpenses,
      pj_pro_labore: pjProLabore,
      pj_profit_distribution: pjDistribution,
      total_savings: (pfIncome - pfExpenses) + (pjRevenue - pjExpenses),
      total_investments_added: 0,
      net_worth_snapshot: netWorth,
      report_data: { transactions_count: transactions?.length ?? 0, generated_at: new Date().toISOString() },
    };

    const { data: upserted, error: upsertError } = await supabase
      .from('monthly_reports')
      .upsert(report, { onConflict: 'user_id,month,year' })
      .select()
      .single();

    if (upsertError) throw upsertError;

    return new Response(JSON.stringify({ data: upserted }), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Internal server error';
    return new Response(JSON.stringify({ error: message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
