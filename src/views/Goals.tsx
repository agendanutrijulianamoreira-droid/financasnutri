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
  ACTIVE: 'Ativa',
  COMPLETED: 'Concluída',
  PAUSED: 'Pausada',
  CANCELLED: 'Cancelada',
};

const STATUS_VARIANTS: Record<GoalStatus, 'success' | 'brand' | 'warning' | 'danger'> = {
  ACTIVE: 'brand',
  COMPLETED: 'success',
  PAUSED: 'warning',
  CANCELLED: 'danger',
};

const defaultForm = (): CreateGoalInput => ({
  name: '',
  description: null,
  target_amount: 0,
  target_date: '',
  person_type: PersonType.PF,
  monthly_contribution: 0,
  color: null,
  icon: null,
});

export function Goals() {
  const [open, setOpen] = useState(false);
  const [contributionGoalId, setContributionGoalId] = useState<string | null>(null);
  const [contributionAmount, setContributionAmount] = useState(0);
  const [form, setForm] = useState<CreateGoalInput>(defaultForm());
  const [formError, setFormError] = useState('');

  const { data: goals = [], isLoading } = useGoals();
  const createGoal = useCreateGoal();
  const addContribution = useAddGoalContribution();
  const deleteGoal = useDeleteGoal();

  const activeGoals = goals.filter((g) => g.status === GoalStatus.ACTIVE);
  const totalTarget = activeGoals.reduce((s, g) => s + g.target_amount, 0);
  const totalSaved = activeGoals.reduce((s, g) => s + g.current_amount, 0);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setFormError('');
    if (form.target_amount <= 0) { setFormError('O valor alvo deve ser maior que zero'); return; }
    if (!form.target_date) { setFormError('Defina a data alvo'); return; }
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
    await addContribution.mutateAsync({ id: contributionGoalId, amount: contributionAmount });
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

      <div className="mb-6 grid grid-cols-3 gap-3">
        <div className="rounded-xl border border-neutral-800 bg-neutral-900 p-4">
          <p className="text-xs text-neutral-500">Metas ativas</p>
          <p className="mt-1 text-xl font-semibold text-neutral-100">{activeGoals.length}</p>
        </div>
        <div className="rounded-xl border border-neutral-800 bg-neutral-900 p-4">
          <p className="text-xs text-neutral-500">Total acumulado</p>
          <p className="mt-1 text-xl font-semibold text-green-400">{formatCurrency(totalSaved)}</p>
        </div>
        <div className="rounded-xl border border-neutral-800 bg-neutral-900 p-4">
          <p className="text-xs text-neutral-500">Total alvo</p>
          <p className="mt-1 text-xl font-semibold text-neutral-100">{formatCurrency(totalTarget)}</p>
        </div>
      </div>

      {isLoading ? (
        <div className="flex justify-center py-16">
          <div className="h-7 w-7 animate-spin rounded-full border-2 border-neutral-700 border-t-brand-500" />
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
                className="rounded-xl border border-neutral-800 bg-neutral-900 p-5"
                style={goal.color ? { borderTopColor: goal.color, borderTopWidth: 3 } : undefined}
              >
                <div className="flex items-start justify-between gap-2">
                  <h3 className="font-semibold text-neutral-100">{goal.name}</h3>
                  <Badge variant={STATUS_VARIANTS[goal.status]}>{STATUS_LABELS[goal.status]}</Badge>
                </div>

                <div className="mt-3">
                  <div className="flex justify-between text-xs text-neutral-500">
                    <span>{formatCurrency(goal.current_amount)}</span>
                    <span>{formatCurrency(goal.target_amount)}</span>
                  </div>
                  <div className="mt-1.5 h-2 overflow-hidden rounded-full bg-neutral-800">
                    <div
                      className="h-full rounded-full bg-brand-500 transition-all"
                      style={{ width: `${progress.percentage}%` }}
                    />
                  </div>
                  <p className="mt-1 text-right text-xs text-neutral-500">
                    {formatPercentage(progress.percentage)}
                  </p>
                </div>

                <div className="mt-3 grid grid-cols-2 gap-2 text-xs">
                  <div>
                    <p className="text-neutral-600">Faltam</p>
                    <p className="text-neutral-300">{formatCurrency(progress.remaining)}</p>
                  </div>
                  <div>
                    <p className="text-neutral-600">Prazo</p>
                    <p className="text-neutral-300">
                      {new Date(goal.target_date + 'T12:00:00').toLocaleDateString('pt-BR', { month: 'short', year: 'numeric' })}
                    </p>
                  </div>
                </div>

                <div className="mt-4 flex gap-2">
                  <Button
                    size="sm"
                    variant="secondary"
                    className="flex-1"
                    onClick={() => setContributionGoalId(goal.id)}
                    disabled={goal.status !== GoalStatus.ACTIVE}
                  >
                    Aportar
                  </Button>
                  <button onClick={() => void deleteGoal.mutateAsync(goal.id)} className="text-neutral-600 hover:text-red-400 px-2">✕</button>
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
                type="number"
                min="0.01"
                step="0.01"
                value={form.target_amount || ''}
                onChange={(e) => setForm((f) => ({ ...f, target_amount: parseFloat(e.target.value) || 0 }))}
                placeholder="0,00"
                required
              />
            </FormField>
            <FormField label="Data alvo" required>
              <Input
                type="date"
                value={form.target_date}
                onChange={(e) => setForm((f) => ({ ...f, target_date: e.target.value }))}
                required
              />
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
                type="number"
                min="0"
                step="0.01"
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

          {formError && <p className="text-xs text-red-400">{formError}</p>}
          <div className="flex justify-end gap-3 pt-2">
            <Button type="button" variant="secondary" onClick={() => setOpen(false)}>Cancelar</Button>
            <Button type="submit" loading={createGoal.isPending}>Salvar</Button>
          </div>
        </form>
      </Modal>

      {/* Contribution Modal */}
      <Modal open={contributionGoalId !== null} onClose={() => setContributionGoalId(null)} title="Registrar Aporte" maxWidth="sm">
        <form onSubmit={(e) => void handleContribution(e)} className="space-y-4">
          <FormField label="Valor do aporte (R$)" required>
            <Input
              type="number"
              min="0.01"
              step="0.01"
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
