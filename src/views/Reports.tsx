import { useState } from 'react';
import { useReports, useMonthlyReport, useTriggerMonthlyClose } from '../hooks/useReports';
import { useAppStore } from '../store/useAppStore';
import { Button } from '../components/ui/Button';
import { Badge } from '../components/ui/Badge';
import { EmptyState } from '../components/ui/EmptyState';
import { PageHeader } from '../components/ui/PageHeader';
import { formatCurrency } from '../services/financialCalculations';

const MONTHS = ['Janeiro','Fevereiro','Março','Abril','Maio','Junho','Julho','Agosto','Setembro','Outubro','Novembro','Dezembro'];

function ReportRow({ label, value, positive }: { label: string; value: number; positive?: boolean }) {
  const color = positive === undefined ? 'text-neutral-200' : value >= 0 ? 'text-green-400' : 'text-red-400';
  return (
    <div className="flex items-center justify-between py-2">
      <span className="text-sm text-neutral-400">{label}</span>
      <span className={`text-sm font-medium ${color}`}>{formatCurrency(value)}</span>
    </div>
  );
}

export function Reports() {
  const { activeMonth, activeYear, setActivePeriod } = useAppStore();
  const [activeTab, setActiveTab] = useState<'pf' | 'pj' | 'consolidado'>('consolidado');

  const { data: report, isLoading: reportLoading } = useMonthlyReport(activeMonth, activeYear);
  const { data: allReports = [] } = useReports();
  const triggerClose = useTriggerMonthlyClose();

  async function handleClose() {
    await triggerClose.mutateAsync({ month: activeMonth, year: activeYear });
  }

  return (
    <div>
      <PageHeader
        title="Relatórios"
        description="Resumo financeiro mensal"
        action={
          <Button onClick={() => void handleClose()} loading={triggerClose.isPending} variant="secondary">
            Gerar Fechamento
          </Button>
        }
      />

      {/* Period selector */}
      <div className="mb-6 flex flex-wrap items-center gap-3">
        <select
          value={activeMonth}
          onChange={(e) => setActivePeriod(Number(e.target.value), activeYear)}
          className="rounded-lg border border-neutral-700 bg-neutral-800 px-3 py-1.5 text-sm text-neutral-200 focus:outline-none"
        >
          {MONTHS.map((m, i) => <option key={i} value={i + 1}>{m}</option>)}
        </select>
        <select
          value={activeYear}
          onChange={(e) => setActivePeriod(activeMonth, Number(e.target.value))}
          className="rounded-lg border border-neutral-700 bg-neutral-800 px-3 py-1.5 text-sm text-neutral-200 focus:outline-none"
        >
          {[2024, 2025, 2026, 2027].map((y) => <option key={y} value={y}>{y}</option>)}
        </select>
      </div>

      {reportLoading ? (
        <div className="flex justify-center py-16">
          <div className="h-7 w-7 animate-spin rounded-full border-2 border-neutral-700 border-t-brand-500" />
        </div>
      ) : !report ? (
        <EmptyState
          title="Nenhum relatório para este período"
          description="Clique em 'Gerar Fechamento' para processar os dados do mês."
          action={
            <Button onClick={() => void handleClose()} loading={triggerClose.isPending}>
              Gerar Fechamento
            </Button>
          }
        />
      ) : (
        <div className="space-y-6">
          {/* Tabs */}
          <div className="flex gap-1 overflow-hidden rounded-lg border border-neutral-800 bg-neutral-900 p-1">
            {(['consolidado', 'pf', 'pj'] as const).map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={[
                  'flex-1 rounded-md py-2 text-sm font-medium transition',
                  activeTab === tab ? 'bg-brand-600 text-white' : 'text-neutral-400 hover:text-neutral-200',
                ].join(' ')}
              >
                {tab === 'pf' ? 'Pessoa Física' : tab === 'pj' ? 'Pessoa Jurídica' : 'Consolidado'}
              </button>
            ))}
          </div>

          {activeTab === 'consolidado' && (
            <div className="grid gap-4 lg:grid-cols-2">
              <div className="rounded-xl border border-neutral-800 bg-neutral-900 p-5">
                <h3 className="mb-3 text-sm font-semibold text-neutral-300">Resultado Consolidado</h3>
                <div className="divide-y divide-neutral-800">
                  <ReportRow label="Receitas PF" value={report.pf_total_income} />
                  <ReportRow label="Receitas PJ" value={report.pj_gross_revenue} />
                  <ReportRow label="Despesas PF" value={-report.pf_total_expenses} />
                  <ReportRow label="Despesas PJ" value={-report.pj_total_expenses} />
                  <ReportRow label="Resultado Líquido" value={report.total_savings} positive />
                </div>
              </div>

              <div className="rounded-xl border border-neutral-800 bg-neutral-900 p-5">
                <h3 className="mb-3 text-sm font-semibold text-neutral-300">Patrimônio</h3>
                <div className="divide-y divide-neutral-800">
                  <ReportRow label="Snapshot do Patrimônio" value={report.net_worth_snapshot} />
                  <ReportRow label="Investimentos Adicionados" value={report.total_investments_added} />
                  <ReportRow label="Poupança do Mês" value={report.total_savings} positive />
                </div>
              </div>
            </div>
          )}

          {activeTab === 'pf' && (
            <div className="rounded-xl border border-neutral-800 bg-neutral-900 p-5">
              <h3 className="mb-3 text-sm font-semibold text-neutral-300">Pessoa Física</h3>
              <div className="divide-y divide-neutral-800">
                <ReportRow label="Receitas" value={report.pf_total_income} />
                <ReportRow label="Despesas" value={-report.pf_total_expenses} />
                <ReportRow label="Resultado PF" value={report.pf_net_result} positive />
              </div>
            </div>
          )}

          {activeTab === 'pj' && (
            <div className="rounded-xl border border-neutral-800 bg-neutral-900 p-5">
              <h3 className="mb-3 text-sm font-semibold text-neutral-300">Pessoa Jurídica</h3>
              <div className="divide-y divide-neutral-800">
                <ReportRow label="Faturamento Bruto" value={report.pj_gross_revenue} />
                <ReportRow label="Impostos" value={-report.pj_taxes_paid} />
                <ReportRow label="Despesas Operacionais" value={-report.pj_total_expenses} />
                <ReportRow label="Pró-Labore" value={-report.pj_pro_labore} />
                <ReportRow label="Distribuição de Lucros" value={report.pj_profit_distribution} />
                <ReportRow label="Lucro Líquido" value={report.pj_net_profit} positive />
              </div>
            </div>
          )}

          <div className="flex items-center justify-between rounded-lg border border-neutral-800 bg-neutral-900/40 px-4 py-3">
            <span className="text-xs text-neutral-600">
              Gerado em {new Date(report.updated_at).toLocaleString('pt-BR')}
            </span>
            <Badge variant="success">Fechamento processado</Badge>
          </div>
        </div>
      )}

      {/* Historical */}
      {allReports.length > 0 && (
        <div className="mt-8">
          <h3 className="mb-3 text-sm font-semibold text-neutral-500">Histórico</h3>
          <div className="overflow-hidden rounded-xl border border-neutral-800">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-neutral-800 bg-neutral-900/60">
                  <th className="px-4 py-3 text-left text-xs font-medium text-neutral-500">Período</th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-neutral-500">Receitas</th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-neutral-500">Despesas</th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-neutral-500">Resultado</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-800 bg-neutral-900">
                {allReports.map((r) => (
                  <tr
                    key={r.id}
                    className="cursor-pointer hover:bg-neutral-800/50"
                    onClick={() => setActivePeriod(r.month, r.year)}
                  >
                    <td className="px-4 py-3 text-neutral-200">
                      {MONTHS[r.month - 1]} {r.year}
                    </td>
                    <td className="px-4 py-3 text-right text-green-400">
                      {formatCurrency(r.pf_total_income + r.pj_gross_revenue)}
                    </td>
                    <td className="px-4 py-3 text-right text-red-400">
                      {formatCurrency(r.pf_total_expenses + r.pj_total_expenses)}
                    </td>
                    <td className={`px-4 py-3 text-right font-medium ${r.total_savings >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                      {formatCurrency(r.total_savings)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
