import type { Transaction, Account, Asset, FinancialGoal, FinancialIndependenceProjection, DashboardSummary } from '../types';
import { PersonType, TransactionType } from '../types';

// ─── Balance ──────────────────────────────────────────────────

export function computeBalanceByPersonType(accounts: Account[]): { pf: number; pj: number; total: number } {
  const pf = accounts
    .filter((a) => a.person_type === PersonType.PF && a.is_active)
    .reduce((sum, a) => sum + a.balance, 0);

  const pj = accounts
    .filter((a) => a.person_type === PersonType.PJ && a.is_active)
    .reduce((sum, a) => sum + a.balance, 0);

  return { pf, pj, total: pf + pj };
}

// ─── Monthly P&L ──────────────────────────────────────────────

interface MonthlyPL {
  income: number;
  expenses: number;
  savings: number;
  savingsRate: number; // 0-100
}

export function computeMonthlyPL(transactions: Transaction[], personType?: PersonType): MonthlyPL {
  const filtered = personType
    ? transactions.filter((t) => t.person_type === personType)
    : transactions;

  const income = filtered
    .filter((t) => t.type === TransactionType.INCOME && t.is_confirmed)
    .reduce((sum, t) => sum + t.amount, 0);

  const expenses = filtered
    .filter((t) => t.type === TransactionType.EXPENSE && t.is_confirmed)
    .reduce((sum, t) => sum + t.amount, 0);

  const savings = income - expenses;
  const savingsRate = income > 0 ? (savings / income) * 100 : 0;

  return { income, expenses, savings, savingsRate };
}

// ─── Net Worth ────────────────────────────────────────────────

export function computeNetWorth(assets: Asset[]): { total: number; pf: number; pj: number; liquid: number } {
  const pf = assets
    .filter((a) => a.person_type === PersonType.PF)
    .reduce((sum, a) => sum + a.current_value, 0);

  const pj = assets
    .filter((a) => a.person_type === PersonType.PJ)
    .reduce((sum, a) => sum + a.current_value, 0);

  const liquid = assets
    .filter((a) => a.is_liquid)
    .reduce((sum, a) => sum + a.current_value, 0);

  return { total: pf + pj, pf, pj, liquid };
}

// ─── Emergency Fund ───────────────────────────────────────────

export interface EmergencyFundStatus {
  targetMonths: number;
  monthlyExpenses: number;
  targetAmount: number;
  currentLiquidAmount: number;
  coverageMonths: number;
  isAdequate: boolean;
  missingAmount: number;
}

export function computeEmergencyFundStatus(
  assets: Asset[],
  monthlyExpenses: number,
  targetMonths: number,
): EmergencyFundStatus {
  const liquidAmount = assets
    .filter((a) => a.is_liquid)
    .reduce((sum, a) => sum + a.current_value, 0);

  const targetAmount = monthlyExpenses * targetMonths;
  const coverageMonths = monthlyExpenses > 0 ? liquidAmount / monthlyExpenses : 0;

  return {
    targetMonths,
    monthlyExpenses,
    targetAmount,
    currentLiquidAmount: liquidAmount,
    coverageMonths,
    isAdequate: liquidAmount >= targetAmount,
    missingAmount: Math.max(0, targetAmount - liquidAmount),
  };
}

// ─── Financial Independence ───────────────────────────────────

/**
 * Projects time to financial independence using compound interest (FV formula).
 * FI target = monthly passive income needed / monthly return rate
 * Months = log((FV - PMT/r) / (PV - PMT/r)) / log(1+r)
 */
export function projectFinancialIndependence(params: {
  currentNetWorth: number;
  monthlyContribution: number;
  desiredMonthlyPassiveIncome: number;
  annualReturnRate: number; // % e.g. 8 = 8%
}): FinancialIndependenceProjection {
  const { currentNetWorth, monthlyContribution, desiredMonthlyPassiveIncome, annualReturnRate } = params;
  const monthlyRate = annualReturnRate / 100 / 12;
  const targetAmount = monthlyRate > 0
    ? desiredMonthlyPassiveIncome / monthlyRate
    : desiredMonthlyPassiveIncome * 300; // fallback: 300x multiplier

  let monthsToFI: number;
  if (currentNetWorth >= targetAmount) {
    monthsToFI = 0;
  } else if (monthlyRate === 0) {
    monthsToFI = monthlyContribution > 0
      ? Math.ceil((targetAmount - currentNetWorth) / monthlyContribution)
      : Infinity;
  } else {
    const pv = currentNetWorth;
    const pmt = monthlyContribution;
    const fv = targetAmount;
    const r = monthlyRate;
    // Solve: FV = PV*(1+r)^n + PMT*((1+r)^n - 1)/r  for n
    monthsToFI = Math.ceil(Math.log((fv * r + pmt) / (pv * r + pmt)) / Math.log(1 + r));
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

// ─── PJ: Profit Distribution ──────────────────────────────────

export interface PJDistributionResult {
  grossRevenue: number;
  taxes: number;
  netRevenue: number;
  operationalExpenses: number;
  netProfit: number;
  proLabore: number;
  profitDistribution: number;
  reinvestment: number;
}

export function computePJDistribution(params: {
  grossRevenue: number;
  operationalExpenses: number;
  taxRate: number; // % e.g. 6 = 6% (Simples)
  proLabore: number;
  distributionPercentage: number; // % of net profit to distribute
}): PJDistributionResult {
  const { grossRevenue, operationalExpenses, taxRate, proLabore, distributionPercentage } = params;

  const taxes = grossRevenue * (taxRate / 100);
  const netRevenue = grossRevenue - taxes;
  const netProfit = netRevenue - operationalExpenses - proLabore;
  const profitDistribution = Math.max(0, netProfit * (distributionPercentage / 100));
  const reinvestment = Math.max(0, netProfit - profitDistribution);

  return {
    grossRevenue,
    taxes,
    netRevenue,
    operationalExpenses,
    netProfit,
    proLabore,
    profitDistribution,
    reinvestment,
  };
}

// ─── Goal Progress ────────────────────────────────────────────

export function computeGoalProgress(goal: FinancialGoal): {
  percentage: number;
  remaining: number;
  monthsLeft: number;
  requiredMonthlyContribution: number;
  isOnTrack: boolean;
} {
  const percentage = Math.min(100, (goal.current_amount / goal.target_amount) * 100);
  const remaining = Math.max(0, goal.target_amount - goal.current_amount);

  const now = new Date();
  const target = new Date(goal.target_date);
  const diffMs = target.getTime() - now.getTime();
  const monthsLeft = Math.max(0, Math.ceil(diffMs / (1000 * 60 * 60 * 24 * 30.44)));

  const requiredMonthlyContribution = monthsLeft > 0 ? remaining / monthsLeft : remaining;
  const isOnTrack = goal.monthly_contribution >= requiredMonthlyContribution;

  return { percentage, remaining, monthsLeft, requiredMonthlyContribution, isOnTrack };
}

// ─── Dashboard Summary ────────────────────────────────────────

export function buildDashboardSummary(
  accounts: Account[],
  transactions: Transaction[],
  assets: Asset[],
): DashboardSummary {
  const balances = computeBalanceByPersonType(accounts);
  const pl = computeMonthlyPL(transactions);
  const netWorth = computeNetWorth(assets);

  return {
    total_balance: balances.total,
    pf_balance: balances.pf,
    pj_balance: balances.pj,
    monthly_income: pl.income,
    monthly_expenses: pl.expenses,
    monthly_savings: pl.savings,
    savings_rate: pl.savingsRate,
    net_worth: netWorth.total,
    liquid_assets: netWorth.liquid,
  };
}

// ─── Formatters ───────────────────────────────────────────────

export function formatCurrency(value: number, currency = 'BRL'): string {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency,
    minimumFractionDigits: 2,
  }).format(value);
}

export function formatPercentage(value: number, decimals = 1): string {
  return `${value.toFixed(decimals)}%`;
}
