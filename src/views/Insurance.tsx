import { useState } from 'react';
import { useInsurance, useCreateInsurance, useDeleteInsurance } from '../hooks/useInsurance';
import { Modal } from '../components/ui/Modal';
import { Button } from '../components/ui/Button';
import { Badge } from '../components/ui/Badge';
import { EmptyState } from '../components/ui/EmptyState';
import { PageHeader } from '../components/ui/PageHeader';
import { FormField, Input, Select, Textarea } from '../components/ui/FormField';
import { formatCurrency } from '../services/financialCalculations';
import { InsuranceType } from '../types';
import type { CreateInsuranceInput } from '../lib/validations';

const INSURANCE_TYPE_LABELS: Record<InsuranceType, string> = {
  LIFE: 'Vida', HEALTH: 'Saúde', AUTO: 'Auto',
  HOME: 'Residencial', PROFESSIONAL_LIABILITY: 'Resp. Civil', OTHER: 'Outro',
};

const defaultForm = (): CreateInsuranceInput => ({
  name: '', type: InsuranceType.HEALTH, insurer: '', policy_number: null,
  monthly_premium: 0, coverage_amount: 0, start_date: '', end_date: null, notes: null,
});

export function Insurance() {
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState<CreateInsuranceInput>(defaultForm());
  const [formError, setFormError] = useState('');

  const { data: insurances = [], isLoading } = useInsurance();
  const createInsurance = useCreateInsurance();
  const deleteInsurance = useDeleteInsurance();

  const active = insurances.filter((i) => i.is_active);
  const totalMonthly  = active.reduce((s, i) => s + i.monthly_premium, 0);
  const totalCoverage = active.reduce((s, i) => s + i.coverage_amount, 0);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setFormError('');
    if (!form.start_date) { setFormError('Informe a data de início'); return; }
    try {
      await createInsurance.mutateAsync(form);
      setOpen(false);
      setForm(defaultForm());
    } catch (err) {
      setFormError(err instanceof Error ? err.message : 'Erro ao salvar');
    }
  }

  return (
    <div>
      <PageHeader
        title="Seguros"
        description="Sua proteção patrimonial e pessoal"
        action={<Button onClick={() => setOpen(true)}>+ Novo seguro</Button>}
      />

      {/* Summary */}
      <div className="mb-6 grid grid-cols-3 gap-3">
        {[
          { label: 'Seguros ativos', value: String(active.length), color: '#2b1a10' },
          { label: 'Custo mensal', value: formatCurrency(totalMonthly), color: '#c0392b' },
          { label: 'Cobertura total', value: formatCurrency(totalCoverage), color: '#4a6741' },
        ].map((s) => (
          <div key={s.label} style={{ borderRadius: 10, background: '#ffffff', border: '1px solid #ede4d5', padding: '14px 18px', boxShadow: '0 1px 4px rgba(43,26,16,0.05)' }}>
            <p style={{ margin: 0, fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.07em', color: '#9b7b5c' }}>{s.label}</p>
            <p style={{ margin: '6px 0 0', fontSize: 20, fontWeight: 700, fontFamily: 'Georgia, serif', color: s.color }}>{s.value}</p>
          </div>
        ))}
      </div>

      {isLoading ? (
        <div className="flex justify-center py-16">
          <div className="h-7 w-7 animate-spin rounded-full border-2" style={{ borderColor: '#e0d3c0', borderTopColor: '#c9a435' }} />
        </div>
      ) : insurances.length === 0 ? (
        <EmptyState
          title="Nenhum seguro cadastrado"
          description="Registre seus seguros para ter uma visão completa da sua proteção."
          action={<Button onClick={() => setOpen(true)}>+ Novo seguro</Button>}
        />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {insurances.map((ins) => (
            <div
              key={ins.id}
              style={{
                borderRadius: 12, background: '#ffffff', border: '1px solid #ede4d5',
                borderTop: '2px solid #c9a435', padding: 20,
                boxShadow: '0 1px 4px rgba(43,26,16,0.05)',
              }}
            >
              <div className="flex items-start justify-between gap-2 mb-4">
                <div>
                  <h3 style={{ margin: 0, fontFamily: 'Georgia, serif', fontSize: 15, fontWeight: 700, color: '#2b1a10' }}>{ins.name}</h3>
                  <p style={{ margin: '3px 0 0', fontSize: 11, color: '#9b7b5c' }}>{ins.insurer}</p>
                </div>
                <div className="flex flex-col items-end gap-1.5">
                  <Badge>{INSURANCE_TYPE_LABELS[ins.type]}</Badge>
                  <Badge variant={ins.is_active ? 'success' : 'danger'}>{ins.is_active ? 'Ativo' : 'Inativo'}</Badge>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3 text-sm">
                {[
                  { label: 'Prêmio/mês', value: formatCurrency(ins.monthly_premium), color: '#c0392b' },
                  { label: 'Cobertura', value: formatCurrency(ins.coverage_amount), color: '#4a6741' },
                  { label: 'Início', value: new Date(ins.start_date + 'T12:00:00').toLocaleDateString('pt-BR'), color: '#5e4a3c' },
                  ins.end_date
                    ? { label: 'Vencimento', value: new Date(ins.end_date + 'T12:00:00').toLocaleDateString('pt-BR'), color: '#5e4a3c' }
                    : null,
                ].filter(Boolean).map((item) => (
                  <div key={item!.label}>
                    <p style={{ margin: 0, fontSize: 10, color: '#ceb99f', textTransform: 'uppercase', letterSpacing: '0.06em', fontWeight: 700 }}>{item!.label}</p>
                    <p style={{ margin: '3px 0 0', fontSize: 13, fontWeight: 600, color: item!.color }}>{item!.value}</p>
                  </div>
                ))}
              </div>

              <div className="mt-4 flex justify-end">
                <button
                  onClick={() => void deleteInsurance.mutateAsync(ins.id)}
                  style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 11, color: '#ceb99f', transition: 'color 0.15s', fontFamily: 'Inter, system-ui, sans-serif' }}
                  onMouseEnter={(e) => ((e.currentTarget as HTMLButtonElement).style.color = '#c0392b')}
                  onMouseLeave={(e) => ((e.currentTarget as HTMLButtonElement).style.color = '#ceb99f')}
                >
                  Remover
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      <Modal open={open} onClose={() => setOpen(false)} title="Novo Seguro" maxWidth="lg">
        <form onSubmit={(e) => void handleSubmit(e)} className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <FormField label="Nome do seguro" required>
              <Input value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} placeholder="Ex: Plano de saúde" required />
            </FormField>
            <FormField label="Tipo" required>
              <Select value={form.type} onChange={(e) => setForm((f) => ({ ...f, type: e.target.value as InsuranceType }))}>
                {Object.entries(INSURANCE_TYPE_LABELS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
              </Select>
            </FormField>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <FormField label="Seguradora" required>
              <Input value={form.insurer} onChange={(e) => setForm((f) => ({ ...f, insurer: e.target.value }))} placeholder="Ex: SulAmérica" required />
            </FormField>
            <FormField label="Número da apólice">
              <Input value={form.policy_number ?? ''} onChange={(e) => setForm((f) => ({ ...f, policy_number: e.target.value || null }))} placeholder="Opcional" />
            </FormField>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <FormField label="Prêmio mensal (R$)" required>
              <Input type="number" min="0" step="0.01" value={form.monthly_premium || ''} onChange={(e) => setForm((f) => ({ ...f, monthly_premium: parseFloat(e.target.value) || 0 }))} placeholder="0,00" required />
            </FormField>
            <FormField label="Cobertura (R$)" required>
              <Input type="number" min="0" step="0.01" value={form.coverage_amount || ''} onChange={(e) => setForm((f) => ({ ...f, coverage_amount: parseFloat(e.target.value) || 0 }))} placeholder="0,00" required />
            </FormField>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <FormField label="Data de início" required>
              <Input type="date" value={form.start_date} onChange={(e) => setForm((f) => ({ ...f, start_date: e.target.value }))} required />
            </FormField>
            <FormField label="Data de vencimento">
              <Input type="date" value={form.end_date ?? ''} onChange={(e) => setForm((f) => ({ ...f, end_date: e.target.value || null }))} />
            </FormField>
          </div>

          <FormField label="Observações">
            <Textarea value={form.notes ?? ''} onChange={(e) => setForm((f) => ({ ...f, notes: e.target.value || null }))} placeholder="Opcional" />
          </FormField>

          {formError && <p style={{ fontSize: 12, color: '#c0392b' }}>{formError}</p>}
          <div className="flex justify-end gap-3 pt-2">
            <Button type="button" variant="secondary" onClick={() => setOpen(false)}>Cancelar</Button>
            <Button type="submit" loading={createInsurance.isPending}>Salvar</Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
