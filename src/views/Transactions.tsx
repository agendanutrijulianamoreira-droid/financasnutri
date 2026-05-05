import { useState } from 'react';
import { useTransactions, useCreateTransaction, useDeleteTransaction } from '../hooks/useTransactions';
import { useAccounts } from '../hooks/useAccounts';
import { useAppStore } from '../store/useAppStore';
import { Modal } from '../components/ui/Modal';
import { Button } from '../components/ui/Button';
import { Badge } from '../components/ui/Badge';
import { EmptyState } from '../components/ui/EmptyState';
import { PageHeader } from '../components/ui/PageHeader';
import { FormField, Input, Select, Textarea } from '../components/ui/FormField';
import { formatCurrency } from '../services/financialCalculations';
import { PersonType, TransactionType, TransactionCategory } from '../types';
import type { CreateTransactionInput } from '../lib/validations';

const MONTHS = ['Jan','Fev','Mar','Abr','Mai','Jun','Jul','Ago','Set','Out','Nov','Dez'];

const CATEGORY_LABELS: Record<string, string> = {
  SALARY: 'Salário', CONSULTING: 'Consultoria', INVESTMENT_RETURN: 'Rendimento',
  PROFIT_DISTRIBUTION: 'Distribuição de Lucros', OTHER_INCOME: 'Outra Receita',
  HOUSING: 'Moradia', FOOD: 'Alimentação', HEALTH: 'Saúde', EDUCATION: 'Educação',
  TRANSPORTATION: 'Transporte', LEISURE: 'Lazer', INSURANCE: 'Seguro',
  TAXES: 'Impostos', OPERATIONAL: 'Operacional', OTHER_EXPENSE: 'Outra Despesa',
};

const INCOME_CATEGORIES = [
  TransactionCategory.SALARY, TransactionCategory.CONSULTING,
  TransactionCategory.INVESTMENT_RETURN, TransactionCategory.PROFIT_DISTRIBUTION,
  TransactionCategory.OTHER_INCOME,
];

const EXPENSE_CATEGORIES = [
  TransactionCategory.HOUSING, TransactionCategory.FOOD, TransactionCategory.HEALTH,
  TransactionCategory.EDUCATION, TransactionCategory.TRANSPORTATION,
  TransactionCategory.LEISURE, TransactionCategory.INSURANCE,
  TransactionCategory.TAXES, TransactionCategory.OPERATIONAL, TransactionCategory.OTHER_EXPENSE,
];

const defaultForm = (): CreateTransactionInput => ({
  account_id: '',
  person_type: PersonType.PF,
  type: TransactionType.EXPENSE,
  category: TransactionCategory.OTHER_EXPENSE,
  amount: 0,
  description: '',
  date: new Date().toISOString().split('T')[0],
  is_recurring: false,
  tags: [],
  notes: null,
  is_confirmed: true,
});

export function Transactions() {
  const { activeMonth, activeYear, setActivePeriod } = useAppStore();
  const [personFilter, setPersonFilter] = useState<PersonType | 'ALL'>('ALL');
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState<CreateTransactionInput>(defaultForm());
  const [formError, setFormError] = useState('');

  const filters = {
    month: activeMonth,
    year: activeYear,
    ...(personFilter !== 'ALL' && { person_type: personFilter }),
  };

  const { data: transactions = [], isLoading } = useTransactions(filters);
  const { data: accounts = [] } = useAccounts();
  const createTx = useCreateTransaction();
  const deleteTx = useDeleteTransaction();

  const categories = form.type === TransactionType.INCOME ? INCOME_CATEGORIES : EXPENSE_CATEGORIES;

  function handleTypeChange(type: TransactionType) {
    const defaultCat = type === TransactionType.INCOME
      ? TransactionCategory.OTHER_INCOME
      : TransactionCategory.OTHER_EXPENSE;
    setForm((f) => ({ ...f, type, category: defaultCat }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setFormError('');
    if (!form.account_id) { setFormError('Selecione uma conta'); return; }
    if (form.amount <= 0) { setFormError('O valor deve ser maior que zero'); return; }

    try {
      await createTx.mutateAsync(form);
      setOpen(false);
      setForm(defaultForm());
    } catch (err) {
      setFormError(err instanceof Error ? err.message : 'Erro ao salvar');
    }
  }

  const totalIncome = transactions.filter((t) => t.type === TransactionType.INCOME).reduce((s, t) => s + t.amount, 0);
  const totalExpense = transactions.filter((t) => t.type === TransactionType.EXPENSE).reduce((s, t) => s + t.amount, 0);

  return (
    <div>
      <PageHeader
        title="Lançamentos"
        description="Receitas e despesas do período"
        action={<Button onClick={() => setOpen(true)}>+ Novo lançamento</Button>}
      />

      {/* Filters */}
      <div className="mb-6 flex flex-wrap items-center gap-3">
        <select
          value={activeMonth}
          onChange={(e) => setActivePeriod(Number(e.target.value), activeYear)}
          className="rounded-lg border border-neutral-700 bg-neutral-800 px-3 py-1.5 text-sm text-neutral-200 focus:border-brand-500 focus:outline-none"
        >
          {MONTHS.map((m, i) => <option key={i} value={i + 1}>{m}</option>)}
        </select>
        <select
          value={activeYear}
          onChange={(e) => setActivePeriod(activeMonth, Number(e.target.value))}
          className="rounded-lg border border-neutral-700 bg-neutral-800 px-3 py-1.5 text-sm text-neutral-200 focus:border-brand-500 focus:outline-none"
        >
          {[2024, 2025, 2026, 2027].map((y) => <option key={y} value={y}>{y}</option>)}
        </select>
        <div className="flex overflow-hidden rounded-lg border border-neutral-700">
          {(['ALL', PersonType.PF, PersonType.PJ] as const).map((p) => (
            <button
              key={p}
              onClick={() => setPersonFilter(p)}
              className={[
                'px-4 py-1.5 text-sm transition',
                personFilter === p
                  ? 'bg-brand-600 text-white'
                  : 'bg-neutral-800 text-neutral-400 hover:bg-neutral-700',
              ].join(' ')}
            >
              {p === 'ALL' ? 'Todos' : p}
            </button>
          ))}
        </div>
      </div>

      {/* Summary */}
      <div className="mb-6 grid grid-cols-3 gap-3">
        {[
          { label: 'Receitas', value: totalIncome, color: 'text-green-400' },
          { label: 'Despesas', value: totalExpense, color: 'text-red-400' },
          { label: 'Saldo', value: totalIncome - totalExpense, color: totalIncome - totalExpense >= 0 ? 'text-green-400' : 'text-red-400' },
        ].map((s) => (
          <div key={s.label} className="rounded-xl border border-neutral-800 bg-neutral-900 p-4">
            <p className="text-xs text-neutral-500">{s.label}</p>
            <p className={`mt-1 text-xl font-semibold ${s.color}`}>{formatCurrency(s.value)}</p>
          </div>
        ))}
      </div>

      {/* List */}
      {isLoading ? (
        <div className="flex justify-center py-16">
          <div className="h-7 w-7 animate-spin rounded-full border-2 border-neutral-700 border-t-brand-500" />
        </div>
      ) : transactions.length === 0 ? (
        <EmptyState
          title="Nenhum lançamento encontrado"
          description="Registre receitas e despesas do período."
          action={<Button onClick={() => setOpen(true)}>+ Novo lançamento</Button>}
        />
      ) : (
        <div className="overflow-hidden rounded-xl border border-neutral-800">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-neutral-800 bg-neutral-900/60">
                <th className="px-4 py-3 text-left text-xs font-medium text-neutral-500">Data</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-neutral-500">Descrição</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-neutral-500">Categoria</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-neutral-500">Tipo</th>
                <th className="px-4 py-3 text-right text-xs font-medium text-neutral-500">Valor</th>
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-800 bg-neutral-900">
              {transactions.map((tx) => (
                <tr key={tx.id} className="hover:bg-neutral-800/50">
                  <td className="whitespace-nowrap px-4 py-3 text-neutral-500">
                    {new Date(tx.date + 'T12:00:00').toLocaleDateString('pt-BR')}
                  </td>
                  <td className="px-4 py-3 text-neutral-200">{tx.description}</td>
                  <td className="px-4 py-3">
                    <Badge>{CATEGORY_LABELS[tx.category] ?? tx.category}</Badge>
                  </td>
                  <td className="px-4 py-3">
                    <Badge variant={tx.person_type === PersonType.PJ ? 'brand' : 'default'}>
                      {tx.person_type}
                    </Badge>
                  </td>
                  <td className={`whitespace-nowrap px-4 py-3 text-right font-medium ${
                    tx.type === TransactionType.INCOME ? 'text-green-400' : 'text-red-400'
                  }`}>
                    {tx.type === TransactionType.INCOME ? '+' : '-'} {formatCurrency(tx.amount)}
                  </td>
                  <td className="px-4 py-3">
                    <button
                      onClick={() => void deleteTx.mutateAsync(tx.id)}
                      className="text-neutral-600 hover:text-red-400"
                      title="Excluir"
                    >
                      ✕
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Create Modal */}
      <Modal open={open} onClose={() => setOpen(false)} title="Novo Lançamento">
        <form onSubmit={(e) => void handleSubmit(e)} className="space-y-4">
          <div className="flex overflow-hidden rounded-lg border border-neutral-700">
            {([TransactionType.EXPENSE, TransactionType.INCOME] as const).map((t) => (
              <button
                key={t}
                type="button"
                onClick={() => handleTypeChange(t)}
                className={[
                  'flex-1 py-2 text-sm font-medium transition',
                  form.type === t
                    ? t === TransactionType.INCOME ? 'bg-green-700 text-white' : 'bg-red-700 text-white'
                    : 'bg-neutral-800 text-neutral-400 hover:bg-neutral-700',
                ].join(' ')}
              >
                {t === TransactionType.INCOME ? 'Receita' : 'Despesa'}
              </button>
            ))}
          </div>

          <div className="grid grid-cols-2 gap-3">
            <FormField label="Tipo de pessoa" required>
              <Select value={form.person_type} onChange={(e) => setForm((f) => ({ ...f, person_type: e.target.value as PersonType }))}>
                <option value={PersonType.PF}>Pessoa Física (PF)</option>
                <option value={PersonType.PJ}>Pessoa Jurídica (PJ)</option>
              </Select>
            </FormField>
            <FormField label="Data" required>
              <Input type="date" value={form.date} onChange={(e) => setForm((f) => ({ ...f, date: e.target.value }))} required />
            </FormField>
          </div>

          <FormField label="Conta" required>
            <Select value={form.account_id} onChange={(e) => setForm((f) => ({ ...f, account_id: e.target.value }))}>
              <option value="">Selecione uma conta</option>
              {accounts.map((a) => (
                <option key={a.id} value={a.id}>{a.name} — {a.bank_name}</option>
              ))}
            </Select>
          </FormField>

          <FormField label="Categoria" required>
            <Select value={form.category} onChange={(e) => setForm((f) => ({ ...f, category: e.target.value as TransactionCategory }))}>
              {categories.map((c) => <option key={c} value={c}>{CATEGORY_LABELS[c]}</option>)}
            </Select>
          </FormField>

          <div className="grid grid-cols-2 gap-3">
            <FormField label="Valor (R$)" required>
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
            <FormField label="Descrição" required>
              <Input
                type="text"
                value={form.description}
                onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
                placeholder="Ex: Consulta médica"
                required
              />
            </FormField>
          </div>

          <FormField label="Observações">
            <Textarea
              value={form.notes ?? ''}
              onChange={(e) => setForm((f) => ({ ...f, notes: e.target.value || null }))}
              placeholder="Opcional"
            />
          </FormField>

          {formError && <p className="text-xs text-red-400">{formError}</p>}

          <div className="flex justify-end gap-3 pt-2">
            <Button type="button" variant="secondary" onClick={() => setOpen(false)}>Cancelar</Button>
            <Button type="submit" loading={createTx.isPending}>Salvar</Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
