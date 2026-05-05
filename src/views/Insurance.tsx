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
  LIFE: 'Vida',
  HEALTH: 'Saúde',
  AUTO: 'Auto',
  HOME: 'Residencial',
  PROFESSIONAL_LIABILITY: 'Resp. Civil',
  OTHER: 'Outro',
};

const defaultForm = (): CreateInsuranceInput => ({
  name: '',
  type: InsuranceType.HEALTH,
  insurer: '',
  policy_number: null,
  monthly_premium: 0,
  coverage_amount: 0,
  start_date: '',
  end_date: null,
  notes: null,
});

export function Insurance() {
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState<CreateInsuranceInput>(defaultForm());
  const [formError, setFormError] = useState('');

  const { data: insurances = [], isLoading } = useInsurance();
  const createInsurance = useCreateInsurance();
  const deleteInsurance = useDeleteInsurance();

  const totalMonthly = insurances.filter((i) => i.is_active).reduce((s, i) => s + i.monthly_premium, 0);
  const totalCoverage = insurances.filter((i) => i.is_active).reduce((s, i) => s + i.coverage_amount, 0);

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

      <div className="mb-6 grid grid-cols-3 gap-3">
        <div className="rounded-xl border border-neutral-800 bg-neutral-900 p-4">
          <p className="text-xs text-neutral-500">Seguros ativos</p>
          <p className="mt-1 text-xl font-semibold text-neutral-100">{insurances.filter((i) => i.is_active).length}</p>
        </div>
        <div className="rounded-xl border border-neutral-800 bg-neutral-900 p-4">
          <p className="text-xs text-neutral-500">Custo mensal</p>
          <p className="mt-1 text-xl font-semibold text-red-400">{formatCurrency(totalMonthly)}</p>
        </div>
        <div className="rounded-xl border border-neutral-800 bg-neutral-900 p-4">
          <p className="text-xs text-neutral-500">Cobertura total</p>
          <p className="mt-1 text-xl font-semibold text-green-400">{formatCurrency(totalCoverage)}</p>
        </div>
      </div>

      {isLoading ? (
        <div className="flex justify-center py-16">
          <div className="h-7 w-7 animate-spin rounded-full border-2 border-neutral-700 border-t-brand-500" />
        </div>
      ) : insurances.length === 0 ? (
        <EmptyState
          title="Nenhum seguro cadastrado"
          description="Registre seus seguros para ter uma visão completa da sua proteção."
          action={<Button onClick={() => setOpen(true)}>+ Novo seguro</Button>}
        />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {insurances.map((insurance) => (
            <div key={insurance.id} className="rounded-xl border border-neutral-800 bg-neutral-900 p-5">
              <div className="flex items-start justify-between gap-2">
                <div>
                  <h3 className="font-semibold text-neutral-100">{insurance.name}</h3>
                  <p className="mt-0.5 text-xs text-neutral-500">{insurance.insurer}</p>
                </div>
                <div className="flex flex-col items-end gap-1">
                  <Badge>{INSURANCE_TYPE_LABELS[insurance.type]}</Badge>
                  <Badge variant={insurance.is_active ? 'success' : 'danger'}>
                    {insurance.is_active ? 'Ativo' : 'Inativo'}
                  </Badge>
                </div>
              </div>

              <div className="mt-4 grid grid-cols-2 gap-3 text-sm">
                <div>
                  <p className="text-xs text-neutral-600">Prêmio/mês</p>
                  <p className="font-medium text-neutral-200">{formatCurrency(insurance.monthly_premium)}</p>
                </div>
                <div>
                  <p className="text-xs text-neutral-600">Cobertura</p>
                  <p className="font-medium text-neutral-200">{formatCurrency(insurance.coverage_amount)}</p>
                </div>
                <div>
                  <p className="text-xs text-neutral-600">Início</p>
                  <p className="text-neutral-400">
                    {new Date(insurance.start_date + 'T12:00:00').toLocaleDateString('pt-BR')}
                  </p>
                </div>
                {insurance.end_date && (
                  <div>
                    <p className="text-xs text-neutral-600">Vencimento</p>
                    <p className="text-neutral-400">
                      {new Date(insurance.end_date + 'T12:00:00').toLocaleDateString('pt-BR')}
                    </p>
                  </div>
                )}
              </div>

              <div className="mt-4 flex justify-end">
                <button onClick={() => void deleteInsurance.mutateAsync(insurance.id)} className="text-xs text-neutral-600 hover:text-red-400">Remover</button>
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

          {formError && <p className="text-xs text-red-400">{formError}</p>}
          <div className="flex justify-end gap-3 pt-2">
            <Button type="button" variant="secondary" onClick={() => setOpen(false)}>Cancelar</Button>
            <Button type="submit" loading={createInsurance.isPending}>Salvar</Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
