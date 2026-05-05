import { useState } from 'react';
import { useBudgets, useCreateBudget, useDeleteBudget } from '../hooks/useBudgets';
import { useAppStore } from '../store/useAppStore';
import { Modal } from '../components/ui/Modal';
import { Button } from '../components/ui/Button';
import { Badge } from '../components/ui/Badge';
import { EmptyState } from '../components/ui/EmptyState';
import { PageHeader } from '../components/ui/PageHeader';
import { FormField, Input, Select } from '../components/ui/FormField';
import { formatCurrency, formatPercentage } from '../services/financialCalculations';
import { PersonType, TransactionCategory, BudgetPeriod } from '../types';
import type { CreateBudgetInput } from '../lib/validations';

const MONTHS = ['Jan','Fev','Mar','Abr','Mai','Jun','Jul','Ago','Set','Out','Nov','Dez'];

const CATEGORY_LABELS: Record<string, string> = {
  HOUSING: 'Moradia', FOOD: 'Alimentação', HEALTH: 'Saúde', EDUCATION: 'Educação',
  TRANSPORTATION: 'Transporte', LEISURE: 'Lazer', INSURANCE: 'Seguro',
  TAXES: 'Impostos', OPERATIONAL: 'Operacional', OTHER_EXPENSE: 'Outra Despesa',
};

const EXPENSE_CATEGORIES = [
  TransactionCategory.HOUSING, TransactionCategory.FOOD, TransactionCategory.HEALTH,
  TransactionCategory.EDUCATION, TransactionCategory.TRANSPORTATION,
  TransactionCategory.LEISURE, TransactionCategory.INSURANCE,
  TransactionCategory.TAXES, TransactionCategory.OPERATIONAL, TransactionCategory.OTHER_EXPENSE,
];

const now = new Date();
const defaultForm = (): CreateBudgetInput => ({
  person_type: PersonType.PF,
  category: TransactionCategory.FOOD,
  period: BudgetPeriod.MONTHLY,
  amount: 0,
  month: now.getMonth() + 1,
  year: now.getFullYear(),
});

export function Budgets() {
  const { activeMonth, activeYear, setActivePeriod } = useAppStore();
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState<CreateBudgetInput>(defaultForm());
  const [formError, setFormError] = useState('');

  const { data: budgets = [], isLoading } = useBudgets(activeMonth, activeYear);
  const createBudget = useCreateBudget();
  const deleteBudget = useDeleteBudget();

  const totalBudgeted = budgets.reduce((s, b) => s + b.amount, 0);
  const totalSpent = budgets.reduce((s, b) => s + b.spent, 0);

  function barColor(pct: number) {
    if (pct >= 100) return 'bg-red-500';
    if (pct >= 80) return 'bg-amber-500';
    return 'bg-brand-500';
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setFormError('');
    if (form.amount <= 0) { setFormError('O valor deve ser maior que zero'); return; }
    try {
      await createBudget.mutateAsync({ ...form, month: activeMonth, year: activeYear });
      setOpen(false);
      setForm(defaultForm());
    } catch (err) {
      setFormError(err instanceof Error ? err.message : 'Erro ao salvar');
    }
  }

  return (
    <div>
      <PageHeader
        title="Orçamentos"
        description="Controle de gastos por categoria"
        action={<Button onClick={() => setOpen(true)}>+ Novo orçamento</Button>}
      />

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

      <div className="mb-6 grid grid-cols-3 gap-3">
        {[
          { label: 'Orçado', value: formatCurrency(totalBudgeted) },
          { label: 'Gasto', value: formatCurrency(totalSpent) },
          { label: 'Disponível', value: formatCurrency(totalBudgeted - totalSpent) },
        ].map((s) => (
          <div key={s.label} className="rounded-xl border border-neutral-800 bg-neutral-900 p-4">
            <p className="text-xs text-neutral-500">{s.label}</p>
            <p className="mt-1 text-xl font-semibold text-neutral-100">{s.value}</p>
          </div>
        ))}
      </div>

      {isLoading ? (
        <div className="flex justify-center py-16">
          <div className="h-7 w-7 animate-spin rounded-full border-2 border-neutral-700 border-t-brand-500" />
        </div>
      ) : budgets.length === 0 ? (
        <EmptyState
          title="Nenhum orçamento definido"
          description="Defina limites por categoria para controlar seus gastos."
          action={<Button onClick={() => setOpen(true)}>+ Novo orçamento</Button>}
        />
      ) : (
        <div className="space-y-3">
          {budgets.map((b) => (
            <div key={b.id} className="rounded-xl border border-neutral-800 bg-neutral-900 p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <span className="font-medium text-neutral-200">
                    {CATEGORY_LABELS[b.category] ?? b.category}
                  </span>
                  <Badge variant={b.person_type === PersonType.PJ ? 'brand' : 'default'}>
                    {b.person_type}
                  </Badge>
                </div>
                <div className="flex items-center gap-4">
                  <span className="text-sm text-neutral-400">
                    {formatCurrency(b.spent)} / {formatCurrency(b.amount)}
                  </span>
                  <Badge variant={b.percentage_used >= 100 ? 'danger' : b.percentage_used >= 80 ? 'warning' : 'success'}>
                    {formatPercentage(b.percentage_used)}
                  </Badge>
                  <button onClick={() => void deleteBudget.mutateAsync(b.id)} className="text-neutral-600 hover:text-red-400">✕</button>
                </div>
              </div>
              <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-neutral-800">
                <div
                  className={`h-full rounded-full transition-all ${barColor(b.percentage_used)}`}
                  style={{ width: `${Math.min(100, b.percentage_used)}%` }}
                />
              </div>
            </div>
          ))}
        </div>
      )}

      <Modal open={open} onClose={() => setOpen(false)} title="Novo Orçamento">
        <form onSubmit={(e) => void handleSubmit(e)} className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <FormField label="Pessoa" required>
              <Select value={form.person_type} onChange={(e) => setForm((f) => ({ ...f, person_type: e.target.value as PersonType }))}>
                <option value={PersonType.PF}>Pessoa Física (PF)</option>
                <option value={PersonType.PJ}>Pessoa Jurídica (PJ)</option>
              </Select>
            </FormField>
            <FormField label="Categoria" required>
              <Select value={form.category} onChange={(e) => setForm((f) => ({ ...f, category: e.target.value as TransactionCategory }))}>
                {EXPENSE_CATEGORIES.map((c) => <option key={c} value={c}>{CATEGORY_LABELS[c]}</option>)}
              </Select>
            </FormField>
          </div>

          <FormField label="Limite mensal (R$)" required>
            <Input
              type="number"
              min="0.01"
              step="0.01"
              value={form.amount || ''}
              onChange={(e) => setForm((f) => ({ ...f, amount: parseFloat(e.target.value) || 0 }))}
              placeholder="0,00"
              required
            />
          </FormField>

          {formError && <p className="text-xs text-red-400">{formError}</p>}

          <div className="flex justify-end gap-3 pt-2">
            <Button type="button" variant="secondary" onClick={() => setOpen(false)}>Cancelar</Button>
            <Button type="submit" loading={createBudget.isPending}>Salvar</Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
