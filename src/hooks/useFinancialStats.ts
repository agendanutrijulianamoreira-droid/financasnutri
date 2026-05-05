import { useQuery } from '@tanstack/react-query';
import { supabase } from '../lib/supabaseClient';
import {
  computeBalanceByPersonType,
  computeMonthlyPL,
  computeNetWorth,
  computeGoalProgress,
} from '../services/financialCalculations';
import { calculateRunway, calculateTaxEstimate } from '../services/financialEngine';
import type { Account, Transaction, Asset, FinancialGoal } from '../types';
import { GoalStatus, PersonType } from '../types';

export interface FinancialStats {
  // Balances
  totalBalance: number;
  pfBalance: number;
  pjBalance: number;

  // Monthly P&L
  monthlyIncome: number;
  monthlyExpenses: number;
  monthlySavings: number;
  savingsRate: number;
  pfIncome: number;
  pfExpenses: number;
  pjIncome: number;
  pjExpenses: number;

  // Net worth
  netWorth: number;
  liquidAssets: number;
  pfNetWorth: number;
  pjNetWorth: number;

  // Goals
  activeGoalsCount: number;
  completedGoalsCount: number;
  totalGoalProgress: number; // weighted average %

  // Emergency fund (based on last 3 months real data)
  runway: {
    avgMonthlyExpenses: number;
    coverageMonths: number;
    monthsAnalyzed: number;
    isAdequate: boolean;
    targetMonths: number;
    liquidAmount: number;
  };

  // Tax estimate
  taxEstimate: {
    irpfDue: number;
    irpfBracket: string;
    effectiveIRPFRate: number;
    pjTaxesDue: number;
    totalTaxBurden: number;
    inssDeduction: number;
  } | null;

  // PJ alerts
  pjBalanceBelowProLabore: boolean;
  proLabore: number;
}

/**
 * Aggregates all financial data into a single stats object.
 * Cached for 2 minutes; invalidated when accounts, transactions or assets change.
 */
export function useFinancialStats(month: number, year: number) {
  return useQuery({
    queryKey: ['financial-stats', month, year],
    queryFn: async (): Promise<FinancialStats> => {
      const startDate = `${year}-${String(month).padStart(2, '0')}-01`;
      const endDate = new Date(year, month, 0).toISOString().split('T')[0];

      // Lookback: 3 months of transactions for runway
      const lookbackStart = new Date(year, month - 4, 1).toISOString().split('T')[0];

      const [accountsRes, currentTxRes, lookbackTxRes, assetsRes, goalsRes, pjProfileRes] =
        await Promise.all([
          supabase.from('accounts').select('*').eq('is_active', true),
          supabase
            .from('transactions')
            .select('*')
            .gte('date', startDate)
            .lte('date', endDate)
            .eq('is_confirmed', true),
          supabase
            .from('transactions')
            .select('*')
            .gte('date', lookbackStart)
            .lt('date', startDate)
            .eq('is_confirmed', true),
          supabase.from('assets').select('*'),
          supabase.from('financial_goals').select('*'),
          supabase.from('pj_profiles').select('pro_labore, tax_regime').maybeSingle(),
        ]);

      const accounts = (accountsRes.data ?? []) as Account[];
      const currentTx = (currentTxRes.data ?? []) as Transaction[];
      const lookbackTx = (lookbackTxRes.data ?? []) as Transaction[];
      const assets = (assetsRes.data ?? []) as Asset[];
      const goals = (goalsRes.data ?? []) as FinancialGoal[];
      const pjProfile = pjProfileRes.data;

      // Balances
      const balances = computeBalanceByPersonType(accounts);

      // Monthly P&L
      const totalPL = computeMonthlyPL(currentTx);
      const pfPL = computeMonthlyPL(currentTx, PersonType.PF);
      const pjPL = computeMonthlyPL(currentTx, PersonType.PJ);

      // Net worth
      const netWorth = computeNetWorth(assets);

      // Goals
      const activeGoals = goals.filter((g) => g.status === GoalStatus.ACTIVE);
      const completedGoals = goals.filter((g) => g.status === GoalStatus.COMPLETED);
      const avgGoalProgress =
        activeGoals.length > 0
          ? activeGoals.reduce((sum, g) => sum + computeGoalProgress(g).percentage, 0) /
            activeGoals.length
          : 0;

      // Runway using last 3 months real data
      const proLabore = pjProfile?.pro_labore ?? 0;
      const runway = calculateRunway(lookbackTx, assets, 6, 3);

      // PJ balance alert
      const pjBalance = balances.pj;
      const pjBalanceBelowProLabore = proLabore > 0 && pjBalance < proLabore;

      // Tax estimate
      const pjTaxAliquot =
        pjProfile?.tax_regime === 'SIMPLES'
          ? 6
          : pjProfile?.tax_regime === 'LUCRO_PRESUMIDO'
          ? 11.33
          : 15;

      const taxEstimateRaw = calculateTaxEstimate({
        monthlyProLabore: proLabore,
        otherPFIncome: pfPL.income - proLabore > 0 ? pfPL.income - proLabore : 0,
        pjGrossRevenue: pjPL.income,
        pjTaxAliquotPct: pjTaxAliquot,
      });

      return {
        totalBalance: balances.total,
        pfBalance: balances.pf,
        pjBalance: balances.pj,

        monthlyIncome: totalPL.income,
        monthlyExpenses: totalPL.expenses,
        monthlySavings: totalPL.savings,
        savingsRate: totalPL.savingsRate,
        pfIncome: pfPL.income,
        pfExpenses: pfPL.expenses,
        pjIncome: pjPL.income,
        pjExpenses: pjPL.expenses,

        netWorth: netWorth.total,
        liquidAssets: netWorth.liquid,
        pfNetWorth: netWorth.pf,
        pjNetWorth: netWorth.pj,

        activeGoalsCount: activeGoals.length,
        completedGoalsCount: completedGoals.length,
        totalGoalProgress: avgGoalProgress,

        runway,

        taxEstimate:
          proLabore > 0 || pjPL.income > 0
            ? {
                irpfDue: taxEstimateRaw.irpfDue,
                irpfBracket: taxEstimateRaw.irpfBracket,
                effectiveIRPFRate: taxEstimateRaw.effectiveIRPFRate,
                pjTaxesDue: taxEstimateRaw.pjTaxesDue,
                totalTaxBurden: taxEstimateRaw.totalTaxBurden,
                inssDeduction: taxEstimateRaw.inssDeduction,
              }
            : null,

        pjBalanceBelowProLabore,
        proLabore,
      };
    },
    staleTime: 1000 * 60 * 2,
  });
}
