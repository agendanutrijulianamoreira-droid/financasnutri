import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '../lib/supabaseClient';
import { useProfile } from '../hooks/useProfile';
import {
  buildDashboardSummary,
  computeEmergencyFundStatus,
  computeGoalProgress,
  projectFinancialIndependence,
  formatCurrency,
  formatPercentage,
  computeMonthlyPL,
} from '../services/financialCalculations';
import type { Account, Transaction, Asset, FinancialGoal } from '../types';
import { GoalStatus } from '../types';

// ─── Sub-components ────────────────────────────────────────────────────────────

function StatCard({
  label, value, sub, valueClass = 'text-neutral-100',
}: { label: string; value: string; sub?: string; valueClass?: string }) {
  return (
    <div className="rounded-xl border border-neutral-800 bg-neutral-900 p-5">
      <p className="text-xs font-medium uppercase tracking-wider text-neutral-500">{label}</p>
      <p className={`mt-2 text-2xl font-semibold ${valueClass}`}>{value}</p>
      {sub && <p className="mt-1 text-xs text-neutral-500">{sub}</p>}
    </div>
  );
}

function ProgressBar({ value, max, colorClass = 'bg-brand-500' }: { value: number; max: number; colorClass?: string }) {
  const pct = max > 0 ? Math.min(100, (value / max) * 100) : 0;
  return (
    <div className="h-2 overflow-hidden rounded-full bg-neutral-800">
      <div className={`h-full rounded-full transition-all ${colorClass}`} style={{ width: `${pct}%` }} />
    </div>
  );
}

function SectionTitle({ children, to }: { children: React.ReactNode; to?: string }) {
  return (
    <div className="mb-3 flex items-center justify-between">
      <h2 className="text-sm font-semibold text-neutral-400">{children}</h2>
      {to && <Link to={to} className="text-xs text-brand-500 hover:underline">Ver tudo →</Link>}
    </div>
  );
}

// ─── Main ──────────────────────────────────────────────────────────────────────

export function Dashboard() {
  const now = new Date();
  const month = now.getMonth() + 1;
  const year = now.getFullYear();
  const startDate = `${year}-${String(month).padStart(2, '0')}-01`;
  const endDate = new Date(year, month, 0).toISOString().split('T')[0];

  const { data: profile } = useProfile();

  const { data, isLoading } = useQuery({
    queryKey: ['dashboard', month, year],
    queryFn: async () => {
      const [accountsRes, txRes, assetsRes, goalsRes] = await Promise.all([
        supabase.from('accounts').select('*').eq('is_active', true),
        supabase.from('transactions').select('*').gte('date', startDate).lte('date', endDate).eq('is_confirmed', true),
        supabase.from('assets').select('*'),
        supabase.from('financial_goals').select('*').eq('status', GoalStatus.ACTIVE).limit(3),
      ]);
      return {
        accounts: (accountsRes.data ?? []) as Account[],
        transactions: (txRes.data ?? []) as Transaction[],
        assets: (assetsRes.data ?? []) as Asset[],
        goals: (goalsRes.data ?? []) as FinancialGoal[],
      };
    },
  });

  if (isLoading || !data) {
    return (
      <div className="flex h-64 items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-neutral-700 border-t-brand-500" />
      </div>
    );
  }

  const summary = buildDashboardSummary(data.accounts, data.transactions, data.assets);
  const pfPL = computeMonthlyPL(data.transactions, 'PF' as const);
  const pjPL = computeMonthlyPL(data.transactions, 'PJ' as const);

  const emergencyMonths = profile?.emergency_fund_months ?? 6;
  const emergencyStatus = computeEmergencyFundStatus(
    data.assets,
    summary.monthly_expenses || (profile?.monthly_income_target ? profile.monthly_income_target * 0.7 : 5000),
    emergencyMonths,
  );

  const fiTarget = profile?.financial_independence_target ?? null;
  const fiProjection = fiTarget
    ? projectFinancialIndependence({
        currentNetWorth: summary.net_worth,
        monthlyContribution: summary.monthly_savings > 0 ? summary.monthly_savings : 0,
        desiredMonthlyPassiveIncome: fiTarget / 300,
        annualReturnRate: 8,
      })
    : null;

  const monthName = now.toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' });

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-semibold capitalize text-neutral-100">{monthName}</h1>
          <p className="mt-1 text-sm text-neutral-500">
            Olá{profile?.full_name ? `, ${profile.full_name.split(' ')[0]}` : ''}! Aqui está seu resumo.
          </p>
        </div>
        <Link
          to="/transactions"
          className="rounded-lg bg-brand-600 px-4 py-2 text-sm font-medium text-white hover:bg-brand-700"
        >
          + Lançamento
        </Link>
      </div>

      {/* Top KPIs */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatCard label="Saldo Total" value={formatCurrency(summary.total_balance)} />
        <StatCard label="Patrimônio" value={formatCurrency(summary.net_worth)} />
        <StatCard
          label="Resultado do Mês"
          value={formatCurrency(summary.monthly_savings)}
          valueClass={summary.monthly_savings >= 0 ? 'text-green-400' : 'text-red-400'}
          sub={`Taxa: ${formatPercentage(summary.savings_rate)}`}
        />
        <StatCard
          label="Ativos Líquidos"
          value={formatCurrency(summary.liquid_assets)}
          sub={`${emergencyStatus.coverageMonths.toFixed(1)} meses de reserva`}
        />
      </div>

      {/* PF vs PJ */}
      <div>
        <SectionTitle to="/transactions">Receitas e Despesas — Mês Atual</SectionTitle>
        <div className="grid grid-cols-2 gap-4">
          {[
            { label: 'Pessoa Física', pl: pfPL, balance: summary.pf_balance },
            { label: 'Pessoa Jurídica', pl: pjPL, balance: summary.pj_balance },
          ].map(({ label, pl, balance }) => (
            <div key={label} className="rounded-xl border border-neutral-800 bg-neutral-900 p-5">
              <div className="mb-3 flex items-center justify-between">
                <span className="text-sm font-medium text-neutral-300">{label}</span>
                <span className="text-sm font-semibold text-neutral-100">{formatCurrency(balance)}</span>
              </div>
              <div className="space-y-2">
                <div className="flex justify-between text-xs">
                  <span className="text-neutral-500">Receitas</span>
                  <span className="text-green-400">{formatCurrency(pl.income)}</span>
                </div>
                <div className="flex justify-between text-xs">
                  <span className="text-neutral-500">Despesas</span>
                  <span className="text-red-400">{formatCurrency(pl.expenses)}</span>
                </div>
                <div className="pt-1">
                  <ProgressBar
                    value={pl.expenses}
                    max={pl.income || 1}
                    colorClass={pl.expenses > pl.income ? 'bg-red-500' : 'bg-brand-500'}
                  />
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Emergency Fund */}
      <div>
        <SectionTitle to="/assets">Reserva de Emergência</SectionTitle>
        <div className="rounded-xl border border-neutral-800 bg-neutral-900 p-5">
          <div className="mb-3 flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-neutral-200">
                {formatCurrency(emergencyStatus.currentLiquidAmount)}{' '}
                <span className="text-neutral-500 font-normal">de {formatCurrency(emergencyStatus.targetAmount)}</span>
              </p>
              <p className="mt-0.5 text-xs text-neutral-500">
                {emergencyStatus.coverageMonths.toFixed(1)} de {emergencyMonths} meses cobertos
              </p>
            </div>
            <span className={`text-sm font-semibold ${emergencyStatus.isAdequate ? 'text-green-400' : 'text-amber-400'}`}>
              {emergencyStatus.isAdequate ? '✓ Adequada' : `Faltam ${formatCurrency(emergencyStatus.missingAmount)}`}
            </span>
          </div>
          <ProgressBar
            value={emergencyStatus.currentLiquidAmount}
            max={emergencyStatus.targetAmount}
            colorClass={emergencyStatus.isAdequate ? 'bg-green-500' : 'bg-amber-500'}
          />
        </div>
      </div>

      {/* Goals */}
      {data.goals.length > 0 && (
        <div>
          <SectionTitle to="/goals">Metas em Progresso</SectionTitle>
          <div className="space-y-3">
            {data.goals.map((goal) => {
              const prog = computeGoalProgress(goal);
              return (
                <div key={goal.id} className="rounded-xl border border-neutral-800 bg-neutral-900 p-4">
                  <div className="mb-2 flex items-center justify-between">
                    <span className="text-sm font-medium text-neutral-200">{goal.name}</span>
                    <span className="text-sm font-semibold text-neutral-100">
                      {formatPercentage(prog.percentage)}
                    </span>
                  </div>
                  <ProgressBar value={goal.current_amount} max={goal.target_amount} />
                  <div className="mt-2 flex justify-between text-xs text-neutral-500">
                    <span>{formatCurrency(goal.current_amount)}</span>
                    <span>{formatCurrency(goal.target_amount)}</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Financial Independence */}
      {fiProjection && (
        <div>
          <SectionTitle to="/tools">Independência Financeira</SectionTitle>
          <div className="rounded-xl border border-neutral-800 bg-neutral-900 p-5">
            <div className="grid grid-cols-3 gap-4">
              <div>
                <p className="text-xs text-neutral-500">Patrimônio atual</p>
                <p className="mt-1 text-lg font-semibold text-neutral-100">{formatCurrency(fiProjection.current_net_worth)}</p>
              </div>
              <div>
                <p className="text-xs text-neutral-500">Patrimônio alvo</p>
                <p className="mt-1 text-lg font-semibold text-brand-400">{formatCurrency(fiProjection.target_amount)}</p>
              </div>
              <div>
                <p className="text-xs text-neutral-500">Projeção</p>
                <p className="mt-1 text-lg font-semibold text-neutral-100">
                  {fiProjection.months_to_independence > 0
                    ? `${Math.floor(fiProjection.months_to_independence / 12)}a ${fiProjection.months_to_independence % 12}m`
                    : '🎉 Atingido!'}
                </p>
              </div>
            </div>
            <div className="mt-4">
              <ProgressBar
                value={fiProjection.current_net_worth}
                max={fiProjection.target_amount}
                colorClass="bg-brand-500"
              />
              <p className="mt-1 text-right text-xs text-neutral-500">
                {formatPercentage((fiProjection.current_net_worth / fiProjection.target_amount) * 100)} do caminho percorrido
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Quick Links */}
      <div>
        <SectionTitle>Acesso Rápido</SectionTitle>
        <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
          {[
            { to: '/transactions', label: 'Novo lançamento', icon: '↕' },
            { to: '/goals', label: 'Minhas metas', icon: '◈' },
            { to: '/assets', label: 'Patrimônio', icon: '◆' },
            { to: '/reports', label: 'Relatórios', icon: '▤' },
          ].map((item) => (
            <Link
              key={item.to}
              to={item.to}
              className="flex items-center gap-3 rounded-xl border border-neutral-800 bg-neutral-900 p-4 transition hover:border-neutral-700 hover:bg-neutral-800"
            >
              <span className="text-lg text-brand-400">{item.icon}</span>
              <span className="text-sm font-medium text-neutral-300">{item.label}</span>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
