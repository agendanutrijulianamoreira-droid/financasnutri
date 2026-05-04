// Edge Function: financial-projection
// Returns financial independence projection based on current data.
// POST /functions/v1/financial-projection  { "desired_monthly_income": 10000, "annual_return_rate": 8 }

import { serve } from 'https://deno.land/std@0.177.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

function projectFI(params: {
  currentNetWorth: number;
  monthlyContribution: number;
  desiredMonthlyPassiveIncome: number;
  annualReturnRate: number;
}) {
  const { currentNetWorth, monthlyContribution, desiredMonthlyPassiveIncome, annualReturnRate } = params;
  const monthlyRate = annualReturnRate / 100 / 12;
  const targetAmount = monthlyRate > 0 ? desiredMonthlyPassiveIncome / monthlyRate : desiredMonthlyPassiveIncome * 300;

  let monthsToFI: number;
  if (currentNetWorth >= targetAmount) {
    monthsToFI = 0;
  } else if (monthlyRate === 0) {
    monthsToFI = monthlyContribution > 0 ? Math.ceil((targetAmount - currentNetWorth) / monthlyContribution) : 999999;
  } else {
    const r = monthlyRate;
    monthsToFI = Math.ceil(
      Math.log((targetAmount * r + monthlyContribution) / (currentNetWorth * r + monthlyContribution)) / Math.log(1 + r),
    );
  }

  const projectedDate = new Date();
  projectedDate.setMonth(projectedDate.getMonth() + monthsToFI);

  return {
    current_net_worth: currentNetWorth,
    monthly_contribution: monthlyContribution,
    target_amount: targetAmount,
    annual_return_rate: annualReturnRate,
    months_to_independence: monthsToFI,
    projected_date: projectedDate.toISOString().split('T')[0],
    monthly_passive_income: desiredMonthlyPassiveIncome,
  };
}

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

    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError || !user) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const body = await req.json() as {
      desired_monthly_income?: number;
      annual_return_rate?: number;
      monthly_contribution?: number;
    };

    const desiredMonthlyIncome = body.desired_monthly_income ?? 10000;
    const annualReturnRate = body.annual_return_rate ?? 8;

    // Get current net worth from assets
    const { data: assets } = await supabase.from('assets').select('current_value').eq('user_id', user.id);
    const netWorth = assets?.reduce((s: number, a) => s + Number(a.current_value), 0) ?? 0;

    // Get average monthly savings from last 3 months
    let monthlyContribution = body.monthly_contribution ?? 0;
    if (!body.monthly_contribution) {
      const threeMonthsAgo = new Date();
      threeMonthsAgo.setMonth(threeMonthsAgo.getMonth() - 3);
      const { data: reports } = await supabase
        .from('monthly_reports')
        .select('total_savings')
        .eq('user_id', user.id)
        .gte('created_at', threeMonthsAgo.toISOString())
        .limit(3);

      if (reports && reports.length > 0) {
        monthlyContribution = reports.reduce((s: number, r) => s + Number(r.total_savings), 0) / reports.length;
      }
    }

    const projection = projectFI({
      currentNetWorth: netWorth,
      monthlyContribution,
      desiredMonthlyPassiveIncome: desiredMonthlyIncome,
      annualReturnRate,
    });

    return new Response(JSON.stringify({ data: projection }), {
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
