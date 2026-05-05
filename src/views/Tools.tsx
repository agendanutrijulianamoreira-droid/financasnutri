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
  fi:        { label: 'Independência Financeira', desc: 'Projete quando você pode parar de trabalhar' },
  pj:        { label: 'Calculadora PJ', desc: 'Simule distribuição de lucros e pró-labore' },
  emergency: { label: 'Reserva de Emergência', desc: 'Quanto você precisa guardar' },
};

const panelStyle: React.CSSProperties = {
  borderRadius: 12, background: '#ffffff', border: '1px solid #ede4d5',
  padding: 20, boxShadow: '0 1px 4px rgba(43,26,16,0.05)',
};

function PanelTitle({ children }: { children: React.ReactNode }) {
  return (
    <h3 style={{ margin: '0 0 16px', fontFamily: 'Georgia, serif', fontSize: 14, fontWeight: 700, color: '#2b1a10' }}>
      {children}
    </h3>
  );
}

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
      <div style={panelStyle} className="space-y-4">
        <PanelTitle>Parâmetros</PanelTitle>
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

      <div style={{ ...panelStyle, borderTop: '2px solid #c9a435' }} className="space-y-5">
        <PanelTitle>Projeção</PanelTitle>
        <div className="grid grid-cols-2 gap-4">
          {[
            { label: 'Patrimônio alvo', value: formatCurrency(projection.target_amount), color: '#c9a435' },
            { label: 'Prazo estimado', value: projection.months_to_independence === 0 ? 'Atingido!' : `${years}a ${months}m`, color: '#2b1a10' },
            { label: 'Data projetada', value: projection.months_to_independence > 0 ? new Date(projection.projected_date + 'T12:00:00').toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' }) : '—', color: '#5e4a3c' },
            { label: 'Renda passiva/mês', value: formatCurrency(projection.monthly_passive_income), color: '#4a6741' },
          ].map((item) => (
            <div key={item.label}>
              <p style={{ margin: 0, fontSize: 10, color: '#9b7b5c', textTransform: 'uppercase', letterSpacing: '0.06em', fontWeight: 700 }}>{item.label}</p>
              <p style={{ margin: '6px 0 0', fontSize: 16, fontWeight: 700, fontFamily: 'Georgia, serif', color: item.color }}>{item.value}</p>
            </div>
          ))}
        </div>

        <div>
          <div className="mb-1 flex justify-between text-xs" style={{ color: '#9b7b5c' }}>
            <span>{formatCurrency(projection.current_net_worth)}</span>
            <span>{formatPercentage(progressPct)}</span>
          </div>
          <div className="progress-track">
            <div className="progress-fill" style={{ width: `${progressPct}%`, background: '#c9a435' }} />
          </div>
          <p style={{ margin: '4px 0 0', textAlign: 'right', fontSize: 11, color: '#9b7b5c' }}>{formatCurrency(projection.target_amount)}</p>
        </div>

        <div style={{ background: '#f9f6f0', border: '1px solid #e0d3c0', borderRadius: 8, padding: '10px 14px', fontSize: 12, color: '#7d6250' }}>
          Baseado na regra dos 4% (Taxa de Retirada Segura). O patrimônio alvo é calculado como{' '}
          <span style={{ color: '#5e4a3c', fontWeight: 600 }}>renda desejada × (1 / taxa mensal)</span>.
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
      <div style={panelStyle} className="space-y-4">
        <PanelTitle>Parâmetros do mês</PanelTitle>
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

      <div style={{ ...panelStyle, borderTop: '2px solid #c9a435' }}>
        <PanelTitle>DRE Simplificado</PanelTitle>
        <div className="space-y-1">
          {rows.map((row) => (
            <div
              key={row.label}
              className="flex items-center justify-between py-2"
              style={row.highlight ? { borderTop: '1px solid #f4efe4', marginTop: 4, paddingTop: 12 } : undefined}
            >
              <span style={{ fontSize: 13, color: row.highlight ? '#2b1a10' : '#7d6250', fontWeight: row.highlight ? 600 : 400 }}>
                {row.label}
              </span>
              <span style={{
                fontSize: 13,
                fontWeight: row.highlight ? 700 : 500,
                fontFamily: row.highlight ? 'Georgia, serif' : 'inherit',
                color: row.highlight && row.value >= 0 ? '#4a6741' : row.negative ? '#c0392b' : '#5e4a3c',
              }}>
                {row.negative ? '−' : ''} {formatCurrency(Math.abs(row.value))}
              </span>
            </div>
          ))}
        </div>

        <div style={{ marginTop: 16, background: '#f9f6f0', border: '1px solid #c9a435', borderRadius: 8, padding: '10px 14px', fontSize: 12, color: '#7d6250' }}>
          Você leva para casa:{' '}
          <strong style={{ color: '#2b1a10', fontFamily: 'Georgia, serif', fontSize: 14 }}>
            {formatCurrency(result.proLabore + result.profitDistribution)}/mês
          </strong>{' '}
          (pró-labore + distribuição)
        </div>
      </div>
    </div>
  );
}

// ─── Emergency Fund ─────────────────────────────────────────────────────────────

function EmergencyFundCalc({ liquidAssets, defaultMonths }: { liquidAssets: number; defaultMonths: number }) {
  const [monthlyExpenses, setMonthlyExpenses] = useState(5000);
  const [targetMonths, setTargetMonths] = useState(defaultMonths);

  const status = computeEmergencyFundStatus([], monthlyExpenses, targetMonths);
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
      <div style={panelStyle} className="space-y-4">
        <PanelTitle>Parâmetros</PanelTitle>
        <FormField label="Despesas mensais médias (R$)">
          <Input type="number" min="0" step="500" value={monthlyExpenses} onChange={(e) => setMonthlyExpenses(parseFloat(e.target.value) || 0)} />
        </FormField>
        <FormField label="Meses de cobertura desejados">
          <Select value={targetMonths} onChange={(e) => setTargetMonths(parseInt(e.target.value))}>
            {[3, 6, 9, 12, 18, 24].map((m) => <option key={m} value={m}>{m} meses</option>)}
          </Select>
        </FormField>
      </div>

      <div style={{ ...panelStyle, borderTop: `2px solid ${realStatus.isAdequate ? '#4a6741' : '#b7882c'}` }} className="space-y-5">
        <PanelTitle>Status</PanelTitle>
        <div className="grid grid-cols-2 gap-4">
          {[
            { label: 'Meta da reserva', value: formatCurrency(realStatus.targetAmount), color: '#2b1a10' },
            { label: 'Ativos líquidos', value: formatCurrency(liquidAssets), color: '#4a6741' },
            { label: 'Cobertura atual', value: `${realStatus.coverageMonths.toFixed(1)} meses`, color: '#5e4a3c' },
            { label: 'Situação', value: realStatus.isAdequate ? '✓ Adequada' : 'Incompleta', color: realStatus.isAdequate ? '#4a6741' : '#b7882c' },
          ].map((item) => (
            <div key={item.label}>
              <p style={{ margin: 0, fontSize: 10, color: '#9b7b5c', textTransform: 'uppercase', letterSpacing: '0.06em', fontWeight: 700 }}>{item.label}</p>
              <p style={{ margin: '6px 0 0', fontSize: 16, fontWeight: 700, fontFamily: 'Georgia, serif', color: item.color }}>{item.value}</p>
            </div>
          ))}
        </div>

        <div>
          <div className="progress-track">
            <div className="progress-fill" style={{ width: `${pct}%`, background: realStatus.isAdequate ? '#4a6741' : '#b7882c' }} />
          </div>
          <p style={{ margin: '4px 0 0', fontSize: 11, color: '#9b7b5c' }}>{formatPercentage(pct)} da meta atingida</p>
        </div>

        {!realStatus.isAdequate && (
          <div style={{ background: '#fef3e0', border: '1px solid #b7882c', borderRadius: 8, padding: '10px 14px', fontSize: 12, color: '#7d6250' }}>
            Faltam <strong style={{ color: '#b7882c', fontFamily: 'Georgia, serif' }}>{formatCurrency(realStatus.missingAmount)}</strong> para completar a reserva.
            Guardando <strong style={{ color: '#b7882c' }}>{formatCurrency(realStatus.missingAmount / 12)}/mês</strong>, você completa em 1 ano.
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

  const netWorth    = assets.reduce((s, a) => s + a.current_value, 0);
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
            style={{
              borderRadius: 12,
              border: `1px solid ${activeTool === key ? '#c9a435' : '#ede4d5'}`,
              background: activeTool === key ? '#fffbf0' : '#ffffff',
              padding: 16,
              textAlign: 'left',
              cursor: 'pointer',
              transition: 'border-color 0.15s, background 0.15s',
              boxShadow: '0 1px 4px rgba(43,26,16,0.05)',
            }}
            onMouseEnter={(e) => {
              if (activeTool !== key) {
                (e.currentTarget as HTMLButtonElement).style.borderColor = '#c9a435';
              }
            }}
            onMouseLeave={(e) => {
              if (activeTool !== key) {
                (e.currentTarget as HTMLButtonElement).style.borderColor = '#ede4d5';
              }
            }}
          >
            <p style={{ margin: 0, fontSize: 13, fontWeight: 700, fontFamily: 'Georgia, serif', color: activeTool === key ? '#c9a435' : '#2b1a10' }}>{label}</p>
            <p style={{ margin: '4px 0 0', fontSize: 11, color: '#9b7b5c' }}>{desc}</p>
          </button>
        ))}
      </div>

      {/* Tool Content */}
      <div>
        {activeTool === 'fi' && <FICalculator defaultNetWorth={netWorth} />}
        {activeTool === 'pj' && <PJCalculator defaultProLabore={profile?.pj_profile?.pro_labore ?? 0} />}
        {activeTool === 'emergency' && (
          <EmergencyFundCalc liquidAssets={liquidAssets} defaultMonths={profile?.emergency_fund_months ?? 6} />
        )}
      </div>
    </div>
  );
}
