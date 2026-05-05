import { useState } from 'react';
import { useGoals, useCreateGoal, useAddGoalContribution, useDeleteGoal } from '../hooks/useGoals';
import { Modal } from '../components/ui/Modal';
import { Button } from '../components/ui/Button';
import { Badge } from '../components/ui/Badge';
import { EmptyState } from '../components/ui/EmptyState';
import { PageHeader } from '../components/ui/PageHeader';
import { FormField, Input, Select, Textarea } from '../components/ui/FormField';
import { formatCurrency, formatPercentage, computeGoalProgress } from '../services/financialCalculations';
import { PersonType, GoalStatus } from '../types';
import type { CreateGoalInput } from '../lib/validations';

const STATUS_LABELS: Record<GoalStatus, string> = {
  ACTIVE: 'Ativa', COMPLETED: 'Concluída', PAUSED: 'Pausada', CANCELLED: 'Cancelada',
};
const STATUS_VARIANTS: Record<GoalStatus, 'success' | 'brand' | 'warning' | 'danger'> = {
  ACTIVE: 'brand', COMPLETED: 'success', PAUSED: 'warning', CANCELLED: 'danger',
};

const defaultForm = (): CreateGoalInput => ({
  name: '', description: null, target_amount: 0, target_date: '',
  person_type: PersonType.PF, monthly_contribution: 0, color: null, icon: null,
});

export function Goals() {
  const [open, setOpen] = useState(false);
  const [contributionGoalId, setContributionGoalId] = useState<{ id: string; name: string } | null>(null);
  const [contributionAmount, setContributionAmount] = useState(0);
  const [form, setForm] = useState<CreateGoalInput>(defaultForm());
  const [formError, setFormError] = useState('');

  const { data: goals = [], isLoading } = useGoals();
  const createGoal = useCreateGoal();
  const addContribution = useAddGoalContribution();
  const deleteGoal = useDeleteGoal();

  const activeGoals = goals.filter((g) => g.status === GoalStatus.ACTIVE);
  const totalTarget = activeGoals.reduce((s, g) => s + g.target_amount, 0);
  const totalSaved  = activeGoals.reduce((s, g) => s + g.current_amount, 0);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setFormError('');
    if (form.target_amount <= 0) { setFormError('O valor alvo deve ser maior que zero'); return; }
    if (!form.target_date)        { setFormError('Defina a data alvo'); return; }
    try {
      await createGoal.mutateAsync(form);
      setOpen(false);
      setForm(defaultForm());
    } catch (err) {
      setFormError(err instanceof Error ? err.message : 'Erro ao salvar');
    }
  }

  async function handleContribution(e: React.FormEvent) {
    e.preventDefault();
    if (!contributionGoalId || contributionAmount <= 0) return;
    await addContribution.mutateAsync({
      id: contributionGoalId.id,
      amount: contributionAmount,
      goalName: contributionGoalId.name,
    });
    setContributionGoalId(null);
    setContributionAmount(0);
  }

  return (
    <div>
      <PageHeader
        title="Metas Financeiras"
        description="Acompanhe o progresso das suas metas"
        action={<Button onClick={() => setOpen(true)}>+ Nova meta</Button>}
      />

      {/* Summary */}
      <div className="mb-6 grid grid-cols-3 gap-3">
        {[
          { label: 'Metas ativas', value: String(activeGoals.length), color: '#2b1a10' },
          { label: 'Total acumulado', value: formatCurrency(totalSaved), color: '#4a6741' },
          { label: 'Total alvo', value: formatCurrency(totalTarget), color: '#2b1a10' },
        ].map((s) => (
          <div
            key={s.label}
            style={{
              borderRadius: 10,
              background: '#ffffff',
              border: '1px solid #ede4d5',
              padding: '14px 18px',
              boxShadow: '0 1px 4px rgba(43,26,16,0.05)',
            }}
          >
            <p style={{ margin: 0, fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.07em', color: '#9b7b5c' }}>
              {s.label}
            </p>
            <p style={{ margin: '6px 0 0', fontSize: 20, fontWeight: 700, fontFamily: 'Georgia, serif', color: s.color }}>
              {s.value}
            </p>
          </div>
        ))}
      </div>

      {isLoading ? (
        <div className="flex justify-center py-16">
          <div className="h-7 w-7 animate-spin rounded-full border-2" style={{ borderColor: '#e0d3c0', borderTopColor: '#c9a435' }} />
        </div>
      ) : goals.length === 0 ? (
        <EmptyState
          title="Nenhuma meta criada"
          description="Defina metas financeiras e acompanhe seu progresso."
          action={<Button onClick={() => setOpen(true)}>+ Nova meta</Button>}
        />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {goals.map((goal) => {
            const progress = computeGoalProgress(goal);
            return (
              <div
                key={goal.id}
                style={{
                  borderRadius: 12,
                  background: '#ffffff',
                  border: '1px solid #ede4d5',
                  borderTop: goal.color ? `3px solid ${goal.color}` : '2px solid #c9a435',
                  padding: 20,
                  boxShadow: '0 1px 4px rgba(43,26,16,0.05)',
                }}
              >
                <div className="flex items-start justify-between gap-2 mb-3">
                  <h3 style={{ margin: 0, fontFamily: 'Georgia, serif', fontSize: 15, fontWeight: 700, color: '#2b1a10' }}>
                    {goal.name}
                  </h3>
                  <Badge variant={STATUS_VARIANTS[goal.status]}>{STATUS_LABELS[goal.status]}</Badge>
                </div>

                <div>
                  <div className="flex justify-between text-xs mb-1" style={{ color: '#9b7b5c' }}>
                    <span>{formatCurrency(goal.current_amount)}</span>
                    <span>{formatCurrency(goal.target_amount)}</span>
                  </div>
                  <div className="progress-track">
                    <div
                      className="progress-fill"
                      style={{ width: `${progress.percentage}%`, background: '#c9a435' }}
                    />
                  </div>
                  <p style={{ margin: '4px 0 0', textAlign: 'right', fontSize: 11, color: '#c9a435', fontWeight: 700 }}>
                    {formatPercentage(progress.percentage)}
                  </p>
                </div>

                <div className="mt-3 grid grid-cols-2 gap-2 text-xs" style={{ color: '#9b7b5c' }}>
                  <div>
                    <p style={{ margin: 0, color: '#ceb99f' }}>Faltam</p>
                    <p style={{ margin: '2px 0 0', color: '#5e4a3c', fontWeight: 600 }}>{formatCurrency(progress.remaining)}</p>
                  </div>
                  <div>
                    <p style={{ margin: 0, color: '#ceb99f' }}>Prazo</p>
                    <p style={{ margin: '2px 0 0', color: '#5e4a3c', fontWeight: 600 }}>
                      {new Date(goal.target_date + 'T12:00:00').toLocaleDateString('pt-BR', { month: 'short', year: 'numeric' })}
                    </p>
                  </div>
                </div>

                <div className="mt-4 flex gap-2">
                  <Button
                    size="sm"
                    variant="secondary"
                    className="flex-1"
                    onClick={() => setContributionGoalId({ id: goal.id, name: goal.name })}
                    disabled={goal.status !== GoalStatus.ACTIVE}
                  >
                    Aportar
                  </Button>
                  <button
                    onClick={() => void deleteGoal.mutateAsync(goal.id)}
                    style={{
                      background: 'none', border: 'none', cursor: 'pointer',
                      color: '#ceb99f', fontSize: 12, padding: '0 8px', transition: 'color 0.15s',
                    }}
                    onMouseEnter={(e) => ((e.currentTarget as HTMLButtonElement).style.color = '#c0392b')}
                    onMouseLeave={(e) => ((e.currentTarget as HTMLButtonElement).style.color = '#ceb99f')}
                  >
                    ✕
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Create Goal Modal */}
      <Modal open={open} onClose={() => setOpen(false)} title="Nova Meta">
        <form onSubmit={(e) => void handleSubmit(e)} className="space-y-4">
          <FormField label="Nome da meta" required>
            <Input
              value={form.name}
              onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
              placeholder="Ex: Reserva de emergência"
              required
            />
          </FormField>

          <div className="grid grid-cols-2 gap-3">
            <FormField label="Valor alvo (R$)" required>
              <Input
                type="number" min="0.01" step="0.01"
                value={form.target_amount || ''}
                onChange={(e) => setForm((f) => ({ ...f, target_amount: parseFloat(e.target.value) || 0 }))}
                placeholder="0,00"
                required
              />
            </FormField>
            <FormField label="Data alvo" required>
              <Input type="date" value={form.target_date} onChange={(e) => setForm((f) => ({ ...f, target_date: e.target.value }))} required />
            </FormField>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <FormField label="Pessoa">
              <Select value={form.person_type} onChange={(e) => setForm((f) => ({ ...f, person_type: e.target.value as PersonType }))}>
                <option value={PersonType.PF}>PF</option>
                <option value={PersonType.PJ}>PJ</option>
              </Select>
            </FormField>
            <FormField label="Aporte mensal (R$)">
              <Input
                type="number" min="0" step="0.01"
                value={form.monthly_contribution || ''}
                onChange={(e) => setForm((f) => ({ ...f, monthly_contribution: parseFloat(e.target.value) || 0 }))}
                placeholder="0,00"
              />
            </FormField>
          </div>

          <FormField label="Descrição">
            <Textarea
              value={form.description ?? ''}
              onChange={(e) => setForm((f) => ({ ...f, description: e.target.value || null }))}
              placeholder="Opcional"
            />
          </FormField>

          {formError && <p style={{ fontSize: 12, color: '#c0392b' }}>{formError}</p>}
          <div className="flex justify-end gap-3 pt-2">
            <Button type="button" variant="secondary" onClick={() => setOpen(false)}>Cancelar</Button>
            <Button type="submit" loading={createGoal.isPending}>Salvar</Button>
          </div>
        </form>
      </Modal>

      {/* Contribution Modal */}
      <Modal
        open={contributionGoalId !== null}
        onClose={() => setContributionGoalId(null)}
        title={`Aportar em "${contributionGoalId?.name ?? ''}"`}
        maxWidth="sm"
      >
        <form onSubmit={(e) => void handleContribution(e)} className="space-y-4">
          <FormField label="Valor do aporte (R$)" required>
            <Input
              type="number" min="0.01" step="0.01"
              value={contributionAmount || ''}
              onChange={(e) => setContributionAmount(parseFloat(e.target.value) || 0)}
              placeholder="0,00"
              autoFocus
              required
            />
          </FormField>
          <div className="flex justify-end gap-3">
            <Button type="button" variant="secondary" onClick={() => setContributionGoalId(null)}>Cancelar</Button>
            <Button type="submit" loading={addContribution.isPending}>Confirmar</Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
