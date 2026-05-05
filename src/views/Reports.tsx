import { useState } from 'react';
import { useReports, useMonthlyReport, useTriggerMonthlyClose } from '../hooks/useReports';
import { useAppStore } from '../store/useAppStore';
import { Button } from '../components/ui/Button';
import { Badge } from '../components/ui/Badge';
import { EmptyState } from '../components/ui/EmptyState';
import { PageHeader } from '../components/ui/PageHeader';
import { formatCurrency } from '../services/financialCalculations';

const MONTHS = ['Janeiro','Fevereiro','Março','Abril','Maio','Junho','Julho','Agosto','Setembro','Outubro','Novembro','Dezembro'];

const filterSelectStyle: React.CSSProperties = {
  borderRadius: 8, border: '1px solid #e0d3c0', background: '#ffffff',
  padding: '7px 12px', fontSize: 13, color: '#2b1a10', outline: 'none',
  cursor: 'pointer', fontFamily: 'Inter, system-ui, sans-serif',
};

function ReportRow({ label, value, positive, divider }: { label: string; value: number; positive?: boolean; divider?: boolean }) {
  const color = positive === undefined ? '#5e4a3c' : value >= 0 ? '#4a6741' : '#c0392b';
  return (
    <div
      className="flex items-center justify-between py-2.5"
      style={divider ? { borderTop: '1px solid #f4efe4', marginTop: 4, paddingTop: 12 } : undefined}
    >
      <span style={{ fontSize: 13, color: divider ? '#2b1a10' : '#7d6250', fontWeight: divider ? 600 : 400 }}>{label}</span>
      <span style={{ fontSize: 13, fontWeight: divider ? 700 : 500, fontFamily: divider ? 'Georgia, serif' : 'inherit', color }}>
        {formatCurrency(value)}
      </span>
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

  const cardStyle: React.CSSProperties = {
    borderRadius: 12, background: '#ffffff', border: '1px solid #ede4d5',
    padding: 20, boxShadow: '0 1px 4px rgba(43,26,16,0.05)',
  };

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
        <select value={activeMonth} onChange={(e) => setActivePeriod(Number(e.target.value), activeYear)} style={filterSelectStyle}>
          {MONTHS.map((m, i) => <option key={i} value={i + 1}>{m}</option>)}
        </select>
        <select value={activeYear} onChange={(e) => setActivePeriod(activeMonth, Number(e.target.value))} style={filterSelectStyle}>
          {[2024, 2025, 2026, 2027].map((y) => <option key={y} value={y}>{y}</option>)}
        </select>
      </div>

      {reportLoading ? (
        <div className="flex justify-center py-16">
          <div className="h-7 w-7 animate-spin rounded-full border-2" style={{ borderColor: '#e0d3c0', borderTopColor: '#c9a435' }} />
        </div>
      ) : !report ? (
        <EmptyState
          title="Nenhum relatório para este período"
          description="Clique em 'Gerar Fechamento' para processar os dados do mês."
          action={<Button onClick={() => void handleClose()} loading={triggerClose.isPending}>Gerar Fechamento</Button>}
        />
      ) : (
        <div className="space-y-6">
          {/* Tabs */}
          <div style={{ display: 'flex', gap: 4, borderRadius: 10, background: '#f9f6f0', border: '1px solid #e0d3c0', padding: 4 }}>
            {(['consolidado', 'pf', 'pj'] as const).map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                style={{
                  flex: 1, borderRadius: 7, padding: '8px 12px', fontSize: 12, fontWeight: 700,
                  border: 'none', cursor: 'pointer', transition: 'background 0.15s, color 0.15s',
                  background: activeTab === tab ? '#2b1a10' : 'transparent',
                  color: activeTab === tab ? '#ffffff' : '#9b7b5c',
                  fontFamily: 'Inter, system-ui, sans-serif',
                  letterSpacing: '0.04em',
                }}
              >
                {tab === 'pf' ? 'Pessoa Física' : tab === 'pj' ? 'Pessoa Jurídica' : 'Consolidado'}
              </button>
            ))}
          </div>

          {activeTab === 'consolidado' && (
            <div className="grid gap-4 lg:grid-cols-2">
              <div style={cardStyle}>
                <h3 style={{ margin: '0 0 12px', fontFamily: 'Georgia, serif', fontSize: 14, fontWeight: 700, color: '#2b1a10' }}>
                  Resultado Consolidado
                </h3>
                <ReportRow label="Receitas PF" value={report.pf_total_income} />
                <ReportRow label="Receitas PJ" value={report.pj_gross_revenue} />
                <ReportRow label="Despesas PF" value={-report.pf_total_expenses} positive />
                <ReportRow label="Despesas PJ" value={-report.pj_total_expenses} positive />
                <ReportRow label="Resultado Líquido" value={report.total_savings} positive divider />
              </div>
              <div style={cardStyle}>
                <h3 style={{ margin: '0 0 12px', fontFamily: 'Georgia, serif', fontSize: 14, fontWeight: 700, color: '#2b1a10' }}>
                  Patrimônio
                </h3>
                <ReportRow label="Snapshot do Patrimônio" value={report.net_worth_snapshot} />
                <ReportRow label="Investimentos Adicionados" value={report.total_investments_added} />
                <ReportRow label="Poupança do Mês" value={report.total_savings} positive divider />
              </div>
            </div>
          )}

          {activeTab === 'pf' && (
            <div style={cardStyle}>
              <h3 style={{ margin: '0 0 12px', fontFamily: 'Georgia, serif', fontSize: 14, fontWeight: 700, color: '#2b1a10' }}>
                Pessoa Física
              </h3>
              <ReportRow label="Receitas" value={report.pf_total_income} />
              <ReportRow label="Despesas" value={-report.pf_total_expenses} positive />
              <ReportRow label="Resultado PF" value={report.pf_net_result} positive divider />
            </div>
          )}

          {activeTab === 'pj' && (
            <div style={cardStyle}>
              <h3 style={{ margin: '0 0 12px', fontFamily: 'Georgia, serif', fontSize: 14, fontWeight: 700, color: '#2b1a10' }}>
                Pessoa Jurídica
              </h3>
              <ReportRow label="Faturamento Bruto" value={report.pj_gross_revenue} />
              <ReportRow label="Impostos" value={-report.pj_taxes_paid} positive />
              <ReportRow label="Despesas Operacionais" value={-report.pj_total_expenses} positive />
              <ReportRow label="Pró-Labore" value={-report.pj_pro_labore} positive />
              <ReportRow label="Distribuição de Lucros" value={report.pj_profit_distribution} />
              <ReportRow label="Lucro Líquido" value={report.pj_net_profit} positive divider />
            </div>
          )}

          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderRadius: 8, background: '#f9f6f0', border: '1px solid #e0d3c0', padding: '10px 16px' }}>
            <span style={{ fontSize: 11, color: '#9b7b5c' }}>
              Gerado em {new Date(report.updated_at).toLocaleString('pt-BR')}
            </span>
            <Badge variant="success">Fechamento processado</Badge>
          </div>
        </div>
      )}

      {/* Historical */}
      {allReports.length > 0 && (
        <div className="mt-8">
          <h3 style={{ margin: '0 0 12px', fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: '#9b7b5c' }}>
            Histórico
          </h3>
          <div style={{ overflow: 'hidden', borderRadius: 10, border: '1px solid #ede4d5', boxShadow: '0 1px 4px rgba(43,26,16,0.05)' }}>
            <table className="w-full text-sm" style={{ background: '#ffffff' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid #f4efe4', background: '#fdfbf8' }}>
                  {['Período', 'Receitas', 'Despesas', 'Resultado'].map((h, i) => (
                    <th key={h} style={{ padding: '10px 16px', textAlign: i > 0 ? 'right' : 'left', fontSize: 10, fontWeight: 700, letterSpacing: '0.07em', textTransform: 'uppercase', color: '#9b7b5c' }}>
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {allReports.map((r, idx) => (
                  <tr
                    key={r.id}
                    onClick={() => setActivePeriod(r.month, r.year)}
                    style={{ borderTop: idx > 0 ? '1px solid #f9f6f0' : undefined, cursor: 'pointer' }}
                    onMouseEnter={(e) => ((e.currentTarget as HTMLTableRowElement).style.background = '#fdfbf8')}
                    onMouseLeave={(e) => ((e.currentTarget as HTMLTableRowElement).style.background = 'transparent')}
                  >
                    <td style={{ padding: '11px 16px', color: '#2b1a10', fontWeight: 500 }}>{MONTHS[r.month - 1]} {r.year}</td>
                    <td style={{ padding: '11px 16px', textAlign: 'right', color: '#4a6741', fontWeight: 600 }}>{formatCurrency(r.pf_total_income + r.pj_gross_revenue)}</td>
                    <td style={{ padding: '11px 16px', textAlign: 'right', color: '#c0392b', fontWeight: 600 }}>{formatCurrency(r.pf_total_expenses + r.pj_total_expenses)}</td>
                    <td style={{ padding: '11px 16px', textAlign: 'right', fontWeight: 700, fontFamily: 'Georgia, serif', color: r.total_savings >= 0 ? '#4a6741' : '#c0392b' }}>{formatCurrency(r.total_savings)}</td>
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
