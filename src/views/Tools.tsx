import { useState } from 'react';
import { useAssets } from '../hooks/useAssets';
import { useProfile } from '../hooks/useProfile';
import {
  projectFinancialIndependence,
  computePJDistribution,
  computeEmergencyFundStatus,
  formatCurrency,
  formatPercentage,
} from '../services/financialCalculations';
import { PageHeader } from '../components/ui/PageHeader';
import { FormField, Input, Select } from '../components/ui/FormField';

type Tool = 'fi' | 'pj' | 'emergency';

const TOOL_LABELS: Record<Tool, { label: string; desc: string }> = {
  fi: { label: 'Independência Financeira', desc: 'Projete quando você pode parar de trabalhar' },
  pj: { label: 'Calculadora PJ', desc: 'Simule distribuição de lucros e pró-labore' },
  emergency: { label: 'Reserva de Emergência', desc: 'Quanto você precisa guardar' },
};

// ─── FI Calculator ─────────────────────────────────────────────────────────────

function FICalculator({ defaultNetWorth }: { defaultNetWorth: number }) {
  const [form, setForm] = useState({
    currentNetWorth: defaultNetWorth,
    monthlyContribution: 2000,
    desiredMonthlyIncome: 10000,
    annualReturnRate: 8,
  });

  const projection = projectFinancialIndependence({
    currentNetWorth: form.currentNetWorth,
    monthlyContribution: form.monthlyContribution,
    desiredMonthlyPassiveIncome: form.desiredMonthlyIncome,
    annualReturnRate: form.annualReturnRate,
  });

  const years = Math.floor(projection.months_to_independence / 12);
  const months = projection.months_to_independence % 12;
  const progressPct = projection.target_amount > 0
    ? Math.min(100, (projection.current_net_worth / projection.target_amount) * 100)
    : 0;

  function field(key: keyof typeof form) {
    return (e: React.ChangeEvent<HTMLInputElement>) =>
      setForm((f) => ({ ...f, [key]: parseFloat(e.target.value) || 0 }));
  }

  return (
    <div className="grid gap-6 lg:grid-cols-2">
      {/* Inputs */}
      <div className="rounded-xl border border-neutral-800 bg-neutral-900 p-5 space-y-4">
        <h3 className="text-sm font-semibold text-neutral-300">Parâmetros</h3>

        <FormField label="Patrimônio atual (R$)">
          <Input type="number" min="0" step="1000" value={form.currentNetWorth} onChange={field('currentNetWorth')} />
        </FormField>
        <FormField label="Aporte mensal (R$)">
          <Input type="number" min="0" step="100" value={form.monthlyContribution} onChange={field('monthlyContribution')} />
        </FormField>
        <FormField label="Renda passiva desejada/mês (R$)">
          <Input type="number" min="0" step="500" value={form.desiredMonthlyIncome} onChange={field('desiredMonthlyIncome')} />
        </FormField>
        <FormField label="Rentabilidade anual esperada (%)">
          <Input type="number" min="0" max="30" step="0.5" value={form.annualReturnRate} onChange={field('annualReturnRate')} />
        </FormField>
      </div>

      {/* Results */}
      <div className="rounded-xl border border-neutral-800 bg-neutral-900 p-5 space-y-5">
        <h3 className="text-sm font-semibold text-neutral-300">Projeção</h3>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <p className="text-xs text-neutral-500">Patrimônio alvo</p>
            <p className="mt-1 text-xl font-semibold text-brand-400">{formatCurrency(projection.target_amount)}</p>
          </div>
          <div>
            <p className="text-xs text-neutral-500">Prazo estimado</p>
            <p className="mt-1 text-xl font-semibold text-neutral-100">
              {projection.months_to_independence === 0 ? '🎉 Já atingiu!' : `${years}a ${months}m`}
            </p>
          </div>
          <div>
            <p className="text-xs text-neutral-500">Data projetada</p>
            <p className="mt-1 text-sm font-medium text-neutral-200">
              {projection.months_to_independence > 0
                ? new Date(projection.projected_date + 'T12:00:00').toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' })
                : '—'}
            </p>
          </div>
          <div>
            <p className="text-xs text-neutral-500">Renda passiva/mês</p>
            <p className="mt-1 text-sm font-medium text-green-400">{formatCurrency(projection.monthly_passive_income)}</p>
          </div>
        </div>

        <div>
          <div className="mb-1 flex justify-between text-xs text-neutral-500">
            <span>{formatCurrency(projection.current_net_worth)}</span>
            <span>{formatPercentage(progressPct)}</span>
          </div>
          <div className="h-3 overflow-hidden rounded-full bg-neutral-800">
            <div className="h-full rounded-full bg-brand-500 transition-all" style={{ width: `${progressPct}%` }} />
          </div>
          <p className="mt-1 text-right text-xs text-neutral-600">{formatCurrency(projection.target_amount)}</p>
        </div>

        <div className="rounded-lg border border-neutral-800 bg-neutral-950 p-3 text-xs text-neutral-500">
          Baseado na regra dos 4% (Taxa de Retirada Segura). O patrimônio alvo é calculado como{' '}
          <span className="text-neutral-400">renda desejada × (1 / taxa mensal)</span>.
        </div>
      </div>
    </div>
  );
}

// ─── PJ Calculator ─────────────────────────────────────────────────────────────

function PJCalculator({ defaultProLabore }: { defaultProLabore: number }) {
  const [form, setForm] = useState({
    grossRevenue: 20000,
    operationalExpenses: 3000,
    taxRate: 6,
    proLabore: defaultProLabore || 5000,
    distributionPercentage: 70,
  });

  const result = computePJDistribution(form);

  function field(key: keyof typeof form) {
    return (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) =>
      setForm((f) => ({ ...f, [key]: parseFloat(e.target.value) || 0 }));
  }

  const rows: { label: string; value: number; highlight?: boolean; negative?: boolean }[] = [
    { label: 'Faturamento bruto', value: result.grossRevenue },
    { label: `Impostos (${form.taxRate}%)`, value: result.taxes, negative: true },
    { label: 'Receita líquida', value: result.netRevenue, highlight: true },
    { label: 'Despesas operacionais', value: result.operationalExpenses, negative: true },
    { label: 'Pró-labore', value: result.proLabore, negative: true },
    { label: 'Lucro líquido', value: result.netProfit, highlight: true },
    { label: `Distribuição (${form.distributionPercentage}%)`, value: result.profitDistribution, highlight: true },
    { label: 'Reinvestimento', value: result.reinvestment },
  ];

  return (
    <div className="grid gap-6 lg:grid-cols-2">
      {/* Inputs */}
      <div className="rounded-xl border border-neutral-800 bg-neutral-900 p-5 space-y-4">
        <h3 className="text-sm font-semibold text-neutral-300">Parâmetros do mês</h3>

        <FormField label="Faturamento bruto (R$)">
          <Input type="number" min="0" step="100" value={form.grossRevenue} onChange={field('grossRevenue')} />
        </FormField>
        <FormField label="Despesas operacionais (R$)">
          <Input type="number" min="0" step="100" value={form.operationalExpenses} onChange={field('operationalExpenses')} />
        </FormField>
        <FormField label="Pró-labore (R$)">
          <Input type="number" min="0" step="100" value={form.proLabore} onChange={field('proLabore')} />
        </FormField>
        <FormField label="Alíquota de imposto (%)">
          <Select value={form.taxRate} onChange={field('taxRate')}>
            <option value={4}>4% — Simples (faixa inicial)</option>
            <option value={6}>6% — Simples</option>
            <option value={8}>8% — Simples</option>
            <option value={11.33}>11,33% — Lucro Presumido (serviços)</option>
            <option value={15}>15% — Lucro Presumido</option>
          </Select>
        </FormField>
        <FormField label="Distribuição de lucros (%)">
          <Input type="number" min="0" max="100" step="5" value={form.distributionPercentage} onChange={field('distributionPercentage')} />
        </FormField>
      </div>

      {/* Results */}
      <div className="rounded-xl border border-neutral-800 bg-neutral-900 p-5">
        <h3 className="mb-4 text-sm font-semibold text-neutral-300">DRE Simplificado</h3>
        <div className="space-y-1">
          {rows.map((row) => (
            <div
              key={row.label}
              className={[
                'flex items-center justify-between py-2',
                row.highlight ? 'border-t border-neutral-800 mt-1 pt-3' : '',
              ].join(' ')}
            >
              <span className={`text-sm ${row.highlight ? 'font-semibold text-neutral-200' : 'text-neutral-400'}`}>
                {row.label}
              </span>
              <span className={[
                'text-sm font-medium',
                row.highlight && row.value >= 0 ? 'text-green-400' : '',
                row.negative ? 'text-red-400' : '',
                !row.highlight && !row.negative ? 'text-neutral-200' : '',
              ].join(' ')}>
                {row.negative ? '−' : ''} {formatCurrency(Math.abs(row.value))}
              </span>
            </div>
          ))}
        </div>

        <div className="mt-4 rounded-lg border border-brand-800/50 bg-brand-950/30 p-3 text-xs text-brand-300">
          Você leva para casa:{' '}
          <strong className="text-brand-200">
            {formatCurrency(result.proLabore + result.profitDistribution)}/mês
          </strong>{' '}
          (pró-labore + distribuição)
        </div>
      </div>
    </div>
  );
}

// ─── Emergency Fund ─────────────────────────────────────────────────────────────

function EmergencyFundCalc({
  liquidAssets,
  defaultMonths,
}: {
  liquidAssets: number;
  defaultMonths: number;
}) {
  const [monthlyExpenses, setMonthlyExpenses] = useState(5000);
  const [targetMonths, setTargetMonths] = useState(defaultMonths);

  const status = computeEmergencyFundStatus(
    [],
    monthlyExpenses,
    targetMonths,
  );
  // Override with real liquid amount
  const realStatus = {
    ...status,
    currentLiquidAmount: liquidAssets,
    targetAmount: monthlyExpenses * targetMonths,
    coverageMonths: monthlyExpenses > 0 ? liquidAssets / monthlyExpenses : 0,
    isAdequate: liquidAssets >= monthlyExpenses * targetMonths,
    missingAmount: Math.max(0, monthlyExpenses * targetMonths - liquidAssets),
  };

  const pct = Math.min(100, realStatus.targetAmount > 0 ? (liquidAssets / realStatus.targetAmount) * 100 : 0);

  return (
    <div className="grid gap-6 lg:grid-cols-2">
      {/* Inputs */}
      <div className="rounded-xl border border-neutral-800 bg-neutral-900 p-5 space-y-4">
        <h3 className="text-sm font-semibold text-neutral-300">Parâmetros</h3>
        <FormField label="Despesas mensais médias (R$)">
          <Input
            type="number"
            min="0"
            step="500"
            value={monthlyExpenses}
            onChange={(e) => setMonthlyExpenses(parseFloat(e.target.value) || 0)}
          />
        </FormField>
        <FormField label="Meses de cobertura desejados">
          <Select
            value={targetMonths}
            onChange={(e) => setTargetMonths(parseInt(e.target.value))}
          >
            {[3, 6, 9, 12, 18, 24].map((m) => (
              <option key={m} value={m}>{m} meses</option>
            ))}
          </Select>
        </FormField>
      </div>

      {/* Results */}
      <div className="rounded-xl border border-neutral-800 bg-neutral-900 p-5 space-y-5">
        <h3 className="text-sm font-semibold text-neutral-300">Status</h3>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <p className="text-xs text-neutral-500">Meta da reserva</p>
            <p className="mt-1 text-xl font-semibold text-neutral-100">{formatCurrency(realStatus.targetAmount)}</p>
          </div>
          <div>
            <p className="text-xs text-neutral-500">Ativos líquidos</p>
            <p className="mt-1 text-xl font-semibold text-green-400">{formatCurrency(liquidAssets)}</p>
          </div>
          <div>
            <p className="text-xs text-neutral-500">Cobertura atual</p>
            <p className="mt-1 text-sm font-medium text-neutral-200">
              {realStatus.coverageMonths.toFixed(1)} meses
            </p>
          </div>
          <div>
            <p className="text-xs text-neutral-500">Situação</p>
            <p className={`mt-1 text-sm font-semibold ${realStatus.isAdequate ? 'text-green-400' : 'text-amber-400'}`}>
              {realStatus.isAdequate ? '✓ Adequada' : 'Incompleta'}
            </p>
          </div>
        </div>

        <div>
          <div className="h-3 overflow-hidden rounded-full bg-neutral-800">
            <div
              className={`h-full rounded-full transition-all ${realStatus.isAdequate ? 'bg-green-500' : 'bg-amber-500'}`}
              style={{ width: `${pct}%` }}
            />
          </div>
          <p className="mt-2 text-xs text-neutral-500">
            {formatPercentage(pct)} da meta atingida
          </p>
        </div>

        {!realStatus.isAdequate && (
          <div className="rounded-lg border border-amber-800/50 bg-amber-950/30 p-3 text-xs text-amber-300">
            Faltam <strong className="text-amber-200">{formatCurrency(realStatus.missingAmount)}</strong> para completar a reserva.
            Guardando <strong className="text-amber-200">{formatCurrency(realStatus.missingAmount / 12)}/mês</strong>, você completa em 1 ano.
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Main View ─────────────────────────────────────────────────────────────────

export function Tools() {
  const [activeTool, setActiveTool] = useState<Tool>('fi');
  const { data: profile } = useProfile();
  const { data: assets = [] } = useAssets();

  const netWorth = assets.reduce((s, a) => s + a.current_value, 0);
  const liquidAssets = assets.filter((a) => a.is_liquid).reduce((s, a) => s + a.current_value, 0);

  return (
    <div>
      <PageHeader title="Ferramentas Financeiras" description="Simuladores e calculadoras para decisões estratégicas" />

      {/* Tool Selector */}
      <div className="mb-6 grid grid-cols-3 gap-3">
        {(Object.entries(TOOL_LABELS) as [Tool, typeof TOOL_LABELS[Tool]][]).map(([key, { label, desc }]) => (
          <button
            key={key}
            onClick={() => setActiveTool(key)}
            className={[
              'rounded-xl border p-4 text-left transition',
              activeTool === key
                ? 'border-brand-600 bg-brand-900/20'
                : 'border-neutral-800 bg-neutral-900 hover:border-neutral-700',
            ].join(' ')}
          >
            <p className={`text-sm font-semibold ${activeTool === key ? 'text-brand-400' : 'text-neutral-200'}`}>{label}</p>
            <p className="mt-1 text-xs text-neutral-500">{desc}</p>
          </button>
        ))}
      </div>

      {/* Tool Content */}
      <div>
        {activeTool === 'fi' && <FICalculator defaultNetWorth={netWorth} />}
        {activeTool === 'pj' && <PJCalculator defaultProLabore={profile?.pj_profile?.pro_labore ?? 0} />}
        {activeTool === 'emergency' && (
          <EmergencyFundCalc
            liquidAssets={liquidAssets}
            defaultMonths={profile?.emergency_fund_months ?? 6}
          />
        )}
      </div>
    </div>
  );
}
