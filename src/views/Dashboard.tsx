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

// ─── Helpers ──────────────────────────────────────────────────────────────────

function Card({
  children,
  featured,
  className = '',
}: {
  children: React.ReactNode;
  featured?: boolean;
  className?: string;
}) {
  return (
    <div
      className={`rounded-xl p-6 ${className}`}
      style={{
        background: '#ffffff',
        border: '1px solid #ede4d5',
        borderTop: featured ? '2px solid #c9a435' : '1px solid #ede4d5',
        boxShadow: '0 1px 4px rgba(43,26,16,0.05), 0 4px 12px rgba(43,26,16,0.04)',
      }}
    >
      {children}
    </div>
  );
}

function StatCard({
  label,
  value,
  sub,
  valueColor = '#2b1a10',
  featured,
}: {
  label: string;
  value: string;
  sub?: string;
  valueColor?: string;
  featured?: boolean;
}) {
  return (
    <Card featured={featured}>
      <p
        style={{
          margin: 0,
          fontSize: 10,
          fontWeight: 700,
          letterSpacing: '0.08em',
          textTransform: 'uppercase',
          color: '#9b7b5c',
        }}
      >
        {label}
      </p>
      <p
        style={{
          margin: '8px 0 0',
          fontSize: 22,
          fontWeight: 700,
          fontFamily: 'Georgia, serif',
          color: valueColor,
          lineHeight: 1.1,
        }}
      >
        {value}
      </p>
      {sub && (
        <p style={{ margin: '4px 0 0', fontSize: 11, color: '#9b7b5c' }}>{sub}</p>
      )}
    </Card>
  );
}

function ProgressBar({
  value,
  max,
  color = '#c9a435',
}: {
  value: number;
  max: number;
  color?: string;
}) {
  const pct = max > 0 ? Math.min(100, (value / max) * 100) : 0;
  return (
    <div className="progress-track">
      <div className="progress-fill" style={{ width: `${pct}%`, background: color }} />
    </div>
  );
}

function SectionTitle({
  children,
  to,
}: {
  children: React.ReactNode;
  to?: string;
}) {
  return (
    <div className="mb-4 flex items-center justify-between">
      <h2
        style={{
          margin: 0,
          fontFamily: 'Georgia, serif',
          fontSize: 14,
          fontWeight: 700,
          color: '#2b1a10',
        }}
      >
        {children}
      </h2>
      {to && (
        <Link
          to={to}
          style={{ fontSize: 12, color: '#c9a435', textDecoration: 'none', fontWeight: 600 }}
          onMouseEnter={(e) => ((e.currentTarget as HTMLAnchorElement).style.textDecoration = 'underline')}
          onMouseLeave={(e) => ((e.currentTarget as HTMLAnchorElement).style.textDecoration = 'none')}
        >
          Ver tudo →
        </Link>
      )}
    </div>
  );
}

// ─── Main ─────────────────────────────────────────────────────────────────────

export function Dashboard() {
  const { activeMonth, activeYear } = useAppStore();
  const month = activeMonth;
  const year = activeYear;

  const { data: profile } = useProfile();
  const { data: stats, isLoading: statsLoading } = useFinancialStats(month, year);

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
        <div
          className="h-7 w-7 animate-spin rounded-full border-2"
          style={{ borderColor: '#e0d3c0', borderTopColor: '#c9a435' }}
        />
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
    <div className="space-y-8 animate-fade-in">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1
            style={{
              fontFamily: 'Georgia, serif',
              fontSize: 24,
              fontWeight: 700,
              color: '#2b1a10',
              margin: 0,
              textTransform: 'capitalize',
            }}
          >
            {monthName}
          </h1>
          <p className="mt-1 text-sm" style={{ color: '#9b7b5c' }}>
            Olá{profile?.full_name ? `, ${profile.full_name.split(' ')[0]}` : ''}! Aqui está seu resumo.
          </p>
        </div>
        <Link
          to="/transactions"
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            borderRadius: 8,
            background: '#2b1a10',
            color: '#ffffff',
            padding: '8px 16px',
            fontSize: 12,
            fontWeight: 700,
            letterSpacing: '0.08em',
            textTransform: 'uppercase',
            textDecoration: 'none',
            transition: 'background 0.15s',
          }}
          onMouseEnter={(e) => ((e.currentTarget as HTMLAnchorElement).style.background = '#3d2e22')}
          onMouseLeave={(e) => ((e.currentTarget as HTMLAnchorElement).style.background = '#2b1a10')}
        >
          + Lançamento
        </Link>
      </div>

      {/* Top KPIs */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatCard label="Saldo Total" value={formatCurrency(stats.totalBalance)} featured />
        <StatCard label="Patrimônio Líquido" value={formatCurrency(stats.netWorth)} />
        <StatCard
          label="Resultado do Mês"
          value={formatCurrency(stats.monthlySavings)}
          valueColor={stats.monthlySavings >= 0 ? '#4a6741' : '#c0392b'}
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
            <Card key={label}>
              <div className="mb-4 flex items-center justify-between">
                <span style={{ fontSize: 13, fontWeight: 600, color: '#5e4a3c' }}>{label}</span>
                <span
                  style={{
                    fontSize: 15,
                    fontWeight: 700,
                    fontFamily: 'Georgia, serif',
                    color: '#2b1a10',
                  }}
                >
                  {formatCurrency(balance)}
                </span>
              </div>
              <div className="space-y-2">
                <div className="flex justify-between text-xs">
                  <span style={{ color: '#9b7b5c' }}>Receitas</span>
                  <span style={{ color: '#4a6741', fontWeight: 600 }}>{formatCurrency(income)}</span>
                </div>
                <div className="flex justify-between text-xs">
                  <span style={{ color: '#9b7b5c' }}>Despesas</span>
                  <span style={{ color: '#c0392b', fontWeight: 600 }}>{formatCurrency(expenses)}</span>
                </div>
                <div className="pt-1">
                  <ProgressBar
                    value={expenses}
                    max={income || 1}
                    color={expenses > income ? '#c0392b' : '#c9a435'}
                  />
                </div>
              </div>
            </Card>
          ))}
        </div>
      </div>

      {/* Tax Estimate */}
      {stats.taxEstimate && (
        <div>
          <SectionTitle to="/tools">Estimativa de Impostos do Mês</SectionTitle>
          <Card>
            <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
              {[
                { label: 'IRPF estimado', value: stats.taxEstimate.irpfDue, sub: `Faixa ${stats.taxEstimate.irpfBracket}`, color: '#c0392b' },
                { label: 'INSS', value: stats.taxEstimate.inssDeduction, sub: null, color: '#c0392b' },
                { label: 'Impostos PJ', value: stats.taxEstimate.pjTaxesDue, sub: null, color: '#c0392b' },
                { label: 'Carga total', value: stats.taxEstimate.totalTaxBurden, sub: `${formatPercentage(stats.taxEstimate.effectiveIRPFRate)} efetivo PF`, color: '#b7882c' },
              ].map((item) => (
                <div key={item.label}>
                  <p style={{ margin: 0, fontSize: 10, color: '#9b7b5c', textTransform: 'uppercase', letterSpacing: '0.06em', fontWeight: 700 }}>
                    {item.label}
                  </p>
                  <p style={{ margin: '6px 0 0', fontSize: 16, fontWeight: 700, fontFamily: 'Georgia, serif', color: item.color }}>
                    {formatCurrency(item.value)}
                  </p>
                  {item.sub && <p style={{ margin: '2px 0 0', fontSize: 11, color: '#9b7b5c' }}>{item.sub}</p>}
                </div>
              ))}
            </div>
          </Card>
        </div>
      )}

      {/* Emergency Fund */}
      <div>
        <SectionTitle to="/tools">Reserva de Emergência</SectionTitle>
        <Card>
          <div className="mb-3 flex items-start justify-between">
            <div>
              <p style={{ margin: 0, fontSize: 16, fontWeight: 700, fontFamily: 'Georgia, serif', color: '#2b1a10' }}>
                {formatCurrency(stats.runway.liquidAmount)}{' '}
                <span style={{ fontSize: 13, fontWeight: 400, color: '#9b7b5c' }}>
                  de {formatCurrency(stats.runway.avgMonthlyExpenses * stats.runway.targetMonths)}
                </span>
              </p>
              <p style={{ margin: '4px 0 0', fontSize: 11, color: '#9b7b5c' }}>
                {stats.runway.coverageMonths.toFixed(1)} de {stats.runway.targetMonths} meses
                {stats.runway.monthsAnalyzed > 0
                  ? ` · média dos últimos ${stats.runway.monthsAnalyzed} meses`
                  : ''}
              </p>
            </div>
            <span
              style={{
                fontSize: 12,
                fontWeight: 700,
                color: stats.runway.isAdequate ? '#4a6741' : '#b7882c',
                background: stats.runway.isAdequate ? '#e8f0e5' : '#fef3e0',
                padding: '4px 10px',
                borderRadius: 99,
              }}
            >
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
            color={stats.runway.isAdequate ? '#4a6741' : '#b7882c'}
          />
        </Card>
      </div>

      {/* Goals */}
      {goals.length > 0 && (
        <div>
          <SectionTitle to="/goals">Metas em Progresso</SectionTitle>
          <div className="space-y-3">
            {goals.map((goal) => {
              const prog = computeGoalProgress(goal);
              return (
                <Card key={goal.id}>
                  <div className="mb-2 flex items-center justify-between">
                    <span style={{ fontSize: 13, fontWeight: 600, color: '#2b1a10' }}>{goal.name}</span>
                    <span style={{ fontSize: 13, fontWeight: 700, color: '#c9a435' }}>
                      {formatPercentage(prog.percentage)}
                    </span>
                  </div>
                  <ProgressBar value={goal.current_amount} max={goal.target_amount} color="#c9a435" />
                  <div className="mt-2 flex justify-between text-xs" style={{ color: '#9b7b5c' }}>
                    <span>{formatCurrency(goal.current_amount)}</span>
                    <span>{formatCurrency(goal.target_amount)}</span>
                  </div>
                </Card>
              );
            })}
          </div>
        </div>
      )}

      {/* Financial Independence */}
      {fiProjection && (
        <div>
          <SectionTitle to="/tools">Independência Financeira</SectionTitle>
          <Card featured>
            <div className="grid grid-cols-3 gap-4 mb-4">
              {[
                { label: 'Patrimônio atual', value: formatCurrency(fiProjection.current_net_worth), color: '#2b1a10' },
                { label: 'Patrimônio alvo', value: formatCurrency(fiProjection.target_amount), color: '#c9a435' },
                {
                  label: 'Prazo estimado',
                  value: fiProjection.months_to_independence === 0
                    ? 'Atingido!'
                    : `${Math.floor(fiProjection.months_to_independence / 12)}a ${fiProjection.months_to_independence % 12}m`,
                  color: '#2b1a10',
                },
              ].map((item) => (
                <div key={item.label}>
                  <p style={{ margin: 0, fontSize: 10, color: '#9b7b5c', textTransform: 'uppercase', letterSpacing: '0.06em', fontWeight: 700 }}>
                    {item.label}
                  </p>
                  <p style={{ margin: '6px 0 0', fontSize: 17, fontWeight: 700, fontFamily: 'Georgia, serif', color: item.color }}>
                    {item.value}
                  </p>
                </div>
              ))}
            </div>
            <ProgressBar
              value={fiProjection.current_net_worth}
              max={fiProjection.target_amount}
              color="#c9a435"
            />
            <p style={{ margin: '6px 0 0', textAlign: 'right', fontSize: 11, color: '#9b7b5c' }}>
              {formatPercentage((fiProjection.current_net_worth / fiProjection.target_amount) * 100)} do caminho percorrido
            </p>
          </Card>
        </div>
      )}

      {/* Quick Links */}
      <div>
        <SectionTitle>Acesso Rápido</SectionTitle>
        <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
          {[
            { to: '/transactions', label: 'Novo lançamento', icon: '↕' },
            { to: '/goals',        label: 'Minhas metas',    icon: '◆' },
            { to: '/tools',        label: 'Ferramentas',     icon: '⊕' },
            { to: '/reports',      label: 'Relatórios',      icon: '▤' },
          ].map((item) => (
            <Link
              key={item.to}
              to={item.to}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 12,
                borderRadius: 10,
                background: '#ffffff',
                border: '1px solid #ede4d5',
                padding: '14px 16px',
                textDecoration: 'none',
                boxShadow: '0 1px 4px rgba(43,26,16,0.05)',
                transition: 'border-color 0.15s, box-shadow 0.15s',
              }}
              onMouseEnter={(e) => {
                const el = e.currentTarget as HTMLAnchorElement;
                el.style.borderColor = '#c9a435';
                el.style.boxShadow = '0 2px 8px rgba(201,164,53,0.15)';
              }}
              onMouseLeave={(e) => {
                const el = e.currentTarget as HTMLAnchorElement;
                el.style.borderColor = '#ede4d5';
                el.style.boxShadow = '0 1px 4px rgba(43,26,16,0.05)';
              }}
            >
              <span style={{ fontSize: 17, color: '#c9a435', flexShrink: 0 }}>{item.icon}</span>
              <span style={{ fontSize: 13, fontWeight: 600, color: '#2b1a10' }}>{item.label}</span>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
