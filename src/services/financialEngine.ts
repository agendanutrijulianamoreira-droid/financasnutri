/**
 * financialEngine.ts
 * Pure, testable financial calculation functions.
 * All functions return typed results and never produce NaN or undefined.
 */

import type { Transaction, Asset } from '../types';
import { TransactionType, PersonType } from '../types';

// ─── Types ────────────────────────────────────────────────────────────────────

export interface RunwayResult {
  /** Average monthly expenses over the last N months */
  avgMonthlyExpenses: number;
  /** How many months the liquid reserves cover */
  coverageMonths: number;
  /** Months used for the average calculation */
  monthsAnalyzed: number;
  isAdequate: boolean;
  targetMonths: number;
  liquidAmount: number;
}

export interface TaxEstimate {
  // PF
  grossIncomePF: number;
  inssDeduction: number;
  simplifiedDeduction: number;
  taxableIncomePF: number;
  irpfBracket: string;
  irpfAliquot: number;
  irpfDue: number;
  effectiveIRPFRate: number;
  // PJ
  pjGrossRevenue: number;
  pjTaxAliquot: number;
  pjTaxesDue: number;
  // Total
  totalTaxBurden: number;
  netAfterTax: number;
}

export interface WealthProjection {
  currentNetWorth: number;
  monthlyContribution: number;
  targetAmount: number;
  annualReturnRate: number;
  monthsToTarget: number;
  projectedDate: string;
  milestones: Array<{ pct: number; amount: number; monthsFromNow: number; date: string }>;
  monthlyPassiveIncome: number;
}

// ─── calculateRunway ──────────────────────────────────────────────────────────

/**
 * Calculates emergency fund runway using the actual average of the last N months of expenses.
 * More accurate than using a single month snapshot.
 */
export function calculateRunway(
  transactions: Transaction[],
  assets: Asset[],
  targetMonths: number,
  lookbackMonths = 3,
): RunwayResult {
  const now = new Date();
  const liquidAmount = assets
    .filter((a) => a.is_liquid)
    .reduce((sum, a) => sum + a.current_value, 0);

  // Build monthly expense buckets for the last N months
  const monthlyTotals: number[] = [];

  for (let i = 1; i <= lookbackMonths; i++) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const year = d.getFullYear();
    const month = d.getMonth() + 1;
    const startStr = `${year}-${String(month).padStart(2, '0')}-01`;
    const endDate = new Date(year, month, 0);
    const endStr = endDate.toISOString().split('T')[0];

    const total = transactions
      .filter(
        (t) =>
          t.type === TransactionType.EXPENSE &&
          t.is_confirmed &&
          t.date >= startStr &&
          t.date <= endStr,
      )
      .reduce((sum, t) => sum + t.amount, 0);

    // Only count months that have at least one expense (avoids skewing the average with zero-data months)
    if (total > 0) monthlyTotals.push(total);
  }

  const monthsAnalyzed = monthlyTotals.length;
  const avgMonthlyExpenses =
    monthsAnalyzed > 0
      ? monthlyTotals.reduce((s, v) => s + v, 0) / monthsAnalyzed
      : 0;

  const coverageMonths =
    avgMonthlyExpenses > 0 ? liquidAmount / avgMonthlyExpenses : liquidAmount > 0 ? 999 : 0;

  return {
    avgMonthlyExpenses,
    coverageMonths,
    monthsAnalyzed,
    isAdequate: coverageMonths >= targetMonths,
    targetMonths,
    liquidAmount,
  };
}

// ─── calculateTaxEstimate ─────────────────────────────────────────────────────

// IRPF 2024 table (annual income brackets → monthly equivalent shown in comments)
const IRPF_BRACKETS = [
  { upTo: 2259.20, aliquot: 0, deduction: 0 },        // exempt
  { upTo: 2826.65, aliquot: 0.075, deduction: 169.44 },
  { upTo: 3751.05, aliquot: 0.15, deduction: 381.44 },
  { upTo: 4664.68, aliquot: 0.225, deduction: 662.77 },
  { upTo: Infinity, aliquot: 0.275, deduction: 896.00 },
] as const;

const INSS_BRACKETS = [
  { upTo: 1412.00, aliquot: 0.075 },
  { upTo: 2666.68, aliquot: 0.09 },
  { upTo: 4000.03, aliquot: 0.12 },
  { upTo: 7786.02, aliquot: 0.14 },
] as const;

function calcINSS(salary: number): number {
  let inss = 0;
  let prev = 0;
  for (const b of INSS_BRACKETS) {
    if (salary <= prev) break;
    const taxable = Math.min(salary, b.upTo) - prev;
    inss += taxable * b.aliquot;
    prev = b.upTo;
    if (salary <= b.upTo) break;
  }
  return Math.min(inss, 908.86); // INSS cap 2024
}

function calcIRPF(taxableMonthlyIncome: number): { tax: number; aliquot: number; bracketLabel: string } {
  for (const b of IRPF_BRACKETS) {
    if (taxableMonthlyIncome <= b.upTo) {
      const tax = Math.max(0, taxableMonthlyIncome * b.aliquot - b.deduction);
      return { tax, aliquot: b.aliquot, bracketLabel: `${(b.aliquot * 100).toFixed(1)}%` };
    }
  }
  return { tax: 0, aliquot: 0, bracketLabel: '0%' };
}

/**
 * Estimates monthly tax burden for PF income and PJ revenue.
 * Uses 2024 IRPF progressive table and a simplified INSS calculation.
 */
export function calculateTaxEstimate(params: {
  monthlyProLabore: number;        // PF salary from PJ (pro-labore)
  otherPFIncome: number;           // Other PF income (consulting, etc.)
  pjGrossRevenue: number;          // Total PJ revenue
  pjTaxAliquotPct: number;         // e.g. 6 = 6%
}): TaxEstimate {
  const { monthlyProLabore, otherPFIncome, pjGrossRevenue, pjTaxAliquotPct } = params;

  const grossIncomePF = monthlyProLabore + otherPFIncome;

  // INSS only applies to pro-labore portion
  const inssDeduction = calcINSS(monthlyProLabore);

  // Standard simplified deduction (desconto simplificado = R$ 564,80/month for 2024)
  const simplifiedDeduction = 564.80;

  const taxableIncomePF = Math.max(0, grossIncomePF - inssDeduction - simplifiedDeduction);

  const { tax: irpfDue, aliquot: irpfAliquot, bracketLabel } = calcIRPF(taxableIncomePF);

  const effectiveIRPFRate = grossIncomePF > 0 ? (irpfDue / grossIncomePF) * 100 : 0;

  // PJ taxes (Simples / Presumido approximation)
  const pjTaxesDue = pjGrossRevenue * (Math.max(0, pjTaxAliquotPct) / 100);

  const totalTaxBurden = irpfDue + inssDeduction + pjTaxesDue;

  // Net income = PF income + PJ net revenue - all taxes
  const pjNet = pjGrossRevenue - pjTaxesDue;
  const netAfterTax = grossIncomePF - irpfDue - inssDeduction + pjNet;

  return {
    grossIncomePF,
    inssDeduction,
    simplifiedDeduction,
    taxableIncomePF,
    irpfBracket: bracketLabel,
    irpfAliquot,
    irpfDue,
    effectiveIRPFRate,
    pjGrossRevenue,
    pjTaxAliquot: pjTaxAliquotPct,
    pjTaxesDue,
    totalTaxBurden,
    netAfterTax,
  };
}

// ─── projectWealth ────────────────────────────────────────────────────────────

/**
 * Projects wealth growth with compound interest and regular contributions.
 * Returns milestones at 25%, 50%, 75% and 100% of the target.
 * Uses FV formula: FV = PV*(1+r)^n + PMT*((1+r)^n - 1)/r
 */
export function projectWealth(params: {
  currentNetWorth: number;
  monthlyContribution: number;
  annualReturnRate: number;    // percentage, e.g. 8 = 8%
  targetAmount: number;
}): WealthProjection {
  const { currentNetWorth, monthlyContribution, annualReturnRate, targetAmount } = params;

  const safeReturn = Math.max(0, annualReturnRate);
  const r = safeReturn / 100 / 12;
  const monthlyPassiveIncome = r > 0 ? targetAmount * r : targetAmount / 300;

  function monthsToReach(goal: number): number {
    if (currentNetWorth >= goal) return 0;
    if (r === 0) {
      return monthlyContribution > 0
        ? Math.ceil((goal - currentNetWorth) / monthlyContribution)
        : Infinity;
    }
    const pv = currentNetWorth;
    const pmt = monthlyContribution;
    const n = Math.ceil(
      Math.log((goal * r + pmt) / (pv * r + pmt)) / Math.log(1 + r),
    );
    return Math.max(0, isFinite(n) ? n : Infinity);
  }

  function futureDate(months: number): string {
    if (!isFinite(months)) return '—';
    const d = new Date();
    d.setMonth(d.getMonth() + months);
    return d.toISOString().split('T')[0];
  }

  const monthsToTarget = monthsToReach(targetAmount);

  const milestones = [0.25, 0.5, 0.75, 1].map((pct) => {
    const amount = targetAmount * pct;
    const months = monthsToReach(amount);
    return { pct: pct * 100, amount, monthsFromNow: months, date: futureDate(months) };
  });

  return {
    currentNetWorth,
    monthlyContribution,
    targetAmount,
    annualReturnRate: safeReturn,
    monthsToTarget,
    projectedDate: futureDate(monthsToTarget),
    milestones,
    monthlyPassiveIncome,
  };
}

// ─── Alert Evaluators ─────────────────────────────────────────────────────────

export interface FinancialAlert {
  id: string;
  type: 'success' | 'warning' | 'info';
  title: string;
  message: string;
}

/**
 * Evaluates the current financial state and returns a list of actionable alerts.
 * Called once after data loads; results are fed into the toast/notification system.
 */
export function evaluateAlerts(params: {
  pjAccountBalance: number;
  proLabore: number;
  runway: RunwayResult;
  goalJustCompleted?: string; // goal name if a contribution just completed it
}): FinancialAlert[] {
  const alerts: FinancialAlert[] = [];
  const { pjAccountBalance, proLabore, runway, goalJustCompleted } = params;

  if (goalJustCompleted) {
    alerts.push({
      id: `goal-complete-${Date.now()}`,
      type: 'success',
      title: 'Meta atingida! 🎉',
      message: `Parabéns! Você completou a meta "${goalJustCompleted}".`,
    });
  }

  if (proLabore > 0 && pjAccountBalance < proLabore) {
    alerts.push({
      id: 'pj-low-balance',
      type: 'warning',
      title: 'Saldo PJ insuficiente',
      message: `O saldo PJ (${pjAccountBalance.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}) está abaixo do pró-labore (${proLabore.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}).`,
    });
  }

  if (!runway.isAdequate && runway.monthsAnalyzed > 0) {
    alerts.push({
      id: 'emergency-fund-low',
      type: 'warning',
      title: 'Reserva de emergência incompleta',
      message: `Você tem ${runway.coverageMonths.toFixed(1)} de ${runway.targetMonths} meses cobertos. Média de gastos: ${runway.avgMonthlyExpenses.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}/mês.`,
    });
  }

  return alerts;
}
