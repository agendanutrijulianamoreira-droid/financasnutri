import { useQuery } from '@tanstack/react-query';
import { supabase } from '../lib/supabaseClient';
import { buildDashboardSummary, formatCurrency, formatPercentage } from '../services/financialCalculations';
import type { Account, Transaction, Asset } from '../types';

function StatCard({ label, value, sub }: { label: string; value: string; sub?: string }) {
  return (
    <div className="rounded-xl border border-neutral-800 bg-neutral-900 p-5">
      <p className="text-xs font-medium uppercase tracking-wider text-neutral-500">{label}</p>
      <p className="mt-2 text-2xl font-semibold text-neutral-100">{value}</p>
      {sub && <p className="mt-1 text-xs text-neutral-500">{sub}</p>}
    </div>
  );
}

export function Dashboard() {
  const now = new Date();
  const month = now.getMonth() + 1;
  const year = now.getFullYear();
  const startDate = `${year}-${String(month).padStart(2, '0')}-01`;
  const endDate = new Date(year, month, 0).toISOString().split('T')[0];

  const { data, isLoading } = useQuery({
    queryKey: ['dashboard', month, year],
    queryFn: async () => {
      const [accountsRes, txRes, assetsRes] = await Promise.all([
        supabase.from('accounts').select('*').eq('is_active', true),
        supabase.from('transactions').select('*').gte('date', startDate).lte('date', endDate),
        supabase.from('assets').select('*'),
      ]);
      return buildDashboardSummary(
        (accountsRes.data ?? []) as Account[],
        (txRes.data ?? []) as Transaction[],
        (assetsRes.data ?? []) as Asset[],
      );
    },
  });

  if (isLoading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-neutral-700 border-t-brand-500" />
      </div>
    );
  }

  const s = data!;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-neutral-100">Dashboard</h1>
        <p className="mt-1 text-sm text-neutral-500">
          {new Date().toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' })}
        </p>
      </div>

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatCard label="Saldo Total" value={formatCurrency(s.total_balance)} />
        <StatCard label="Patrimônio Líquido" value={formatCurrency(s.net_worth)} />
        <StatCard label="Receitas do Mês" value={formatCurrency(s.monthly_income)} />
        <StatCard label="Despesas do Mês" value={formatCurrency(s.monthly_expenses)} />
      </div>

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-3">
        <StatCard label="Saldo PF" value={formatCurrency(s.pf_balance)} sub="Pessoa Física" />
        <StatCard label="Saldo PJ" value={formatCurrency(s.pj_balance)} sub="Pessoa Jurídica" />
        <StatCard
          label="Taxa de Poupança"
          value={formatPercentage(s.savings_rate)}
          sub={`${formatCurrency(s.monthly_savings)} guardados`}
        />
      </div>
    </div>
  );
}
