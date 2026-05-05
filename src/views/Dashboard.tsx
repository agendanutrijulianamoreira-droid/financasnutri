import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '../lib/supabaseClient';
import { useProfile } from '../hooks/useProfile';
import { useFinancialStats } from '../hooks/useFinancialStats';
import { useAppStore } from '../store/useAppStore';
import {
  computeGoalProgress,
  projectFinancialIndependence,
  formatCurrency,
  formatPercentage,
} from '../services/financialCalculations';
import type { FinancialGoal } from '../types';
import { GoalStatus } from '../types';

// ─── Sub-components ───────────────────────────────────────────────────────────

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

// ─── Main ─────────────────────────────────────────────────────────────────────

export function Dashboard() {
  const now = new Date();
  const { activeMonth, activeYear } = useAppStore();
  const month = activeMonth;
  const year = activeYear;

  const { data: profile } = useProfile();
  const { data: stats, isLoading: statsLoading } = useFinancialStats(month, year);

  // Goals list (top 3 active)
  const { data: goals = [] } = useQuery({
    queryKey: ['goals-dashboard'],
    queryFn: async () => {
      const { data } = await supabase
        .from('financial_goals')
        .select('*')
        .eq('status', GoalStatus.ACTIVE)
        .order('target_date')
        .limit(3);
      return (data ?? []) as FinancialGoal[];
    },
  });

  if (statsLoading || !stats) {
    return (
      <div className="flex h-64 items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-neutral-700 border-t-brand-500" />
      </div>
    );
  }

  const fiTarget = profile?.financial_independence_target ?? null;
  const fiProjection = fiTarget
    ? projectFinancialIndependence({
        currentNetWorth: stats.netWorth,
        monthlyContribution: stats.monthlySavings > 0 ? stats.monthlySavings : 0,
        desiredMonthlyPassiveIncome: fiTarget / 300,
        annualReturnRate: 8,
      })
    : null;

  const monthName = new Date(year, month - 1).toLocaleDateString('pt-BR', {
    month: 'long',
    year: 'numeric',
  });

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
        <StatCard label="Saldo Total" value={formatCurrency(stats.totalBalance)} />
        <StatCard label="Patrimônio" value={formatCurrency(stats.netWorth)} />
        <StatCard
          label="Resultado do Mês"
          value={formatCurrency(stats.monthlySavings)}
          valueClass={stats.monthlySavings >= 0 ? 'text-green-400' : 'text-red-400'}
          sub={`Taxa de poupança: ${formatPercentage(stats.savingsRate)}`}
        />
        <StatCard
          label="Ativos Líquidos"
          value={formatCurrency(stats.liquidAssets)}
          sub={`${stats.runway.coverageMonths.toFixed(1)} meses de reserva`}
        />
      </div>

      {/* PF vs PJ */}
      <div>
        <SectionTitle to="/transactions">Receitas e Despesas — Mês Atual</SectionTitle>
        <div className="grid grid-cols-2 gap-4">
          {[
            { label: 'Pessoa Física', income: stats.pfIncome, expenses: stats.pfExpenses, balance: stats.pfBalance },
            { label: 'Pessoa Jurídica', income: stats.pjIncome, expenses: stats.pjExpenses, balance: stats.pjBalance },
          ].map(({ label, income, expenses, balance }) => (
            <div key={label} className="rounded-xl border border-neutral-800 bg-neutral-900 p-5">
              <div className="mb-3 flex items-center justify-between">
                <span className="text-sm font-medium text-neutral-300">{label}</span>
                <span className="text-sm font-semibold text-neutral-100">{formatCurrency(balance)}</span>
              </div>
              <div className="space-y-2">
                <div className="flex justify-between text-xs">
                  <span className="text-neutral-500">Receitas</span>
                  <span className="text-green-400">{formatCurrency(income)}</span>
                </div>
                <div className="flex justify-between text-xs">
                  <span className="text-neutral-500">Despesas</span>
                  <span className="text-red-400">{formatCurrency(expenses)}</span>
                </div>
                <div className="pt-1">
                  <ProgressBar
                    value={expenses}
                    max={income || 1}
                    colorClass={expenses > income ? 'bg-red-500' : 'bg-brand-500'}
                  />
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Tax Estimate */}
      {stats.taxEstimate && (
        <div>
          <SectionTitle to="/tools">Estimativa de Impostos do Mês</SectionTitle>
          <div className="rounded-xl border border-neutral-800 bg-neutral-900 p-5">
            <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
              <div>
                <p className="text-xs text-neutral-500">IRPF estimado</p>
                <p className="mt-1 text-lg font-semibold text-red-400">{formatCurrency(stats.taxEstimate.irpfDue)}</p>
                <p className="text-xs text-neutral-600">Faixa {stats.taxEstimate.irpfBracket}</p>
              </div>
              <div>
                <p className="text-xs text-neutral-500">INSS</p>
                <p className="mt-1 text-lg font-semibold text-red-400">{formatCurrency(stats.taxEstimate.inssDeduction)}</p>
              </div>
              <div>
                <p className="text-xs text-neutral-500">Impostos PJ</p>
                <p className="mt-1 text-lg font-semibold text-red-400">{formatCurrency(stats.taxEstimate.pjTaxesDue)}</p>
              </div>
              <div>
                <p className="text-xs text-neutral-500">Carga total</p>
                <p className="mt-1 text-lg font-semibold text-amber-400">{formatCurrency(stats.taxEstimate.totalTaxBurden)}</p>
                <p className="text-xs text-neutral-600">{formatPercentage(stats.taxEstimate.effectiveIRPFRate)} efetivo PF</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Emergency Fund — uses real 3-month average */}
      <div>
        <SectionTitle to="/tools">Reserva de Emergência</SectionTitle>
        <div className="rounded-xl border border-neutral-800 bg-neutral-900 p-5">
          <div className="mb-3 flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-neutral-200">
                {formatCurrency(stats.runway.liquidAmount)}{' '}
                <span className="font-normal text-neutral-500">
                  de {formatCurrency(stats.runway.avgMonthlyExpenses * stats.runway.targetMonths)}
                </span>
              </p>
              <p className="mt-0.5 text-xs text-neutral-500">
                {stats.runway.coverageMonths.toFixed(1)} de {stats.runway.targetMonths} meses
                {stats.runway.monthsAnalyzed > 0
                  ? ` · média baseada nos últimos ${stats.runway.monthsAnalyzed} meses reais`
                  : ''}
              </p>
            </div>
            <span className={`text-sm font-semibold ${stats.runway.isAdequate ? 'text-green-400' : 'text-amber-400'}`}>
              {stats.runway.isAdequate
                ? '✓ Adequada'
                : `Faltam ${formatCurrency(
                    stats.runway.avgMonthlyExpenses * stats.runway.targetMonths - stats.runway.liquidAmount,
                  )}`}
            </span>
          </div>
          <ProgressBar
            value={stats.runway.liquidAmount}
            max={Math.max(stats.runway.avgMonthlyExpenses * stats.runway.targetMonths, 1)}
            colorClass={stats.runway.isAdequate ? 'bg-green-500' : 'bg-amber-500'}
          />
        </div>
      </div>

      {/* Goals */}
      {goals.length > 0 && (
        <div>
          <SectionTitle to="/goals">Metas em Progresso</SectionTitle>
          <div className="space-y-3">
            {goals.map((goal) => {
              const prog = computeGoalProgress(goal);
              return (
                <div key={goal.id} className="rounded-xl border border-neutral-800 bg-neutral-900 p-4">
                  <div className="mb-2 flex items-center justify-between">
                    <span className="text-sm font-medium text-neutral-200">{goal.name}</span>
                    <span className="text-sm font-semibold text-neutral-100">{formatPercentage(prog.percentage)}</span>
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
                <p className="text-xs text-neutral-500">Prazo estimado</p>
                <p className="mt-1 text-lg font-semibold text-neutral-100">
                  {fiProjection.months_to_independence === 0
                    ? '🎉 Atingido!'
                    : `${Math.floor(fiProjection.months_to_independence / 12)}a ${fiProjection.months_to_independence % 12}m`}
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
            { to: '/tools', label: 'Ferramentas', icon: '⊕' },
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
