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

const filterSelectStyle: React.CSSProperties = {
  borderRadius: 8,
  border: '1px solid #e0d3c0',
  background: '#ffffff',
  padding: '7px 12px',
  fontSize: 13,
  color: '#2b1a10',
  outline: 'none',
  cursor: 'pointer',
  fontFamily: 'Inter, system-ui, sans-serif',
};

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

  const totalIncome  = transactions.filter((t) => t.type === TransactionType.INCOME).reduce((s, t) => s + t.amount, 0);
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
          style={filterSelectStyle}
        >
          {MONTHS.map((m, i) => <option key={i} value={i + 1}>{m}</option>)}
        </select>
        <select
          value={activeYear}
          onChange={(e) => setActivePeriod(activeMonth, Number(e.target.value))}
          style={filterSelectStyle}
        >
          {[2024, 2025, 2026, 2027].map((y) => <option key={y} value={y}>{y}</option>)}
        </select>
        {/* PF/PJ toggle */}
        <div
          style={{
            display: 'flex',
            overflow: 'hidden',
            borderRadius: 8,
            border: '1px solid #e0d3c0',
            background: '#ffffff',
          }}
        >
          {(['ALL', PersonType.PF, PersonType.PJ] as const).map((p) => (
            <button
              key={p}
              onClick={() => setPersonFilter(p)}
              style={{
                padding: '7px 14px',
                fontSize: 12,
                fontWeight: 600,
                border: 'none',
                cursor: 'pointer',
                transition: 'background 0.15s, color 0.15s',
                background: personFilter === p ? '#2b1a10' : 'transparent',
                color: personFilter === p ? '#ffffff' : '#9b7b5c',
                fontFamily: 'Inter, system-ui, sans-serif',
              }}
            >
              {p === 'ALL' ? 'Todos' : p}
            </button>
          ))}
        </div>
      </div>

      {/* Summary cards */}
      <div className="mb-6 grid grid-cols-3 gap-3">
        {[
          { label: 'Receitas', value: totalIncome, color: '#4a6741' },
          { label: 'Despesas', value: totalExpense, color: '#c0392b' },
          { label: 'Saldo', value: totalIncome - totalExpense, color: totalIncome - totalExpense >= 0 ? '#4a6741' : '#c0392b' },
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
            <p style={{ margin: '6px 0 0', fontSize: 19, fontWeight: 700, fontFamily: 'Georgia, serif', color: s.color }}>
              {formatCurrency(s.value)}
            </p>
          </div>
        ))}
      </div>

      {/* List */}
      {isLoading ? (
        <div className="flex justify-center py-16">
          <div
            className="h-7 w-7 animate-spin rounded-full border-2"
            style={{ borderColor: '#e0d3c0', borderTopColor: '#c9a435' }}
          />
        </div>
      ) : transactions.length === 0 ? (
        <EmptyState
          title="Nenhum lançamento encontrado"
          description="Registre receitas e despesas do período."
          action={<Button onClick={() => setOpen(true)}>+ Novo lançamento</Button>}
        />
      ) : (
        <div
          style={{
            overflow: 'hidden',
            borderRadius: 10,
            border: '1px solid #ede4d5',
            boxShadow: '0 1px 4px rgba(43,26,16,0.05)',
          }}
        >
          <table className="w-full text-sm" style={{ background: '#ffffff' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid #f4efe4', background: '#fdfbf8' }}>
                {['Data', 'Descrição', 'Categoria', 'Tipo', 'Valor', ''].map((h) => (
                  <th
                    key={h}
                    style={{
                      padding: '10px 16px',
                      textAlign: h === 'Valor' ? 'right' : 'left',
                      fontSize: 10,
                      fontWeight: 700,
                      letterSpacing: '0.07em',
                      textTransform: 'uppercase',
                      color: '#9b7b5c',
                    }}
                  >
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {transactions.map((tx, idx) => (
                <tr
                  key={tx.id}
                  style={{
                    borderTop: idx > 0 ? '1px solid #f9f6f0' : undefined,
                    transition: 'background 0.1s',
                  }}
                  onMouseEnter={(e) => ((e.currentTarget as HTMLTableRowElement).style.background = '#fdfbf8')}
                  onMouseLeave={(e) => ((e.currentTarget as HTMLTableRowElement).style.background = 'transparent')}
                >
                  <td style={{ padding: '11px 16px', color: '#9b7b5c', whiteSpace: 'nowrap', fontSize: 12 }}>
                    {new Date(tx.date + 'T12:00:00').toLocaleDateString('pt-BR')}
                  </td>
                  <td style={{ padding: '11px 16px', color: '#2b1a10', fontWeight: 500 }}>{tx.description}</td>
                  <td style={{ padding: '11px 16px' }}>
                    <Badge>{CATEGORY_LABELS[tx.category] ?? tx.category}</Badge>
                  </td>
                  <td style={{ padding: '11px 16px' }}>
                    <Badge variant={tx.person_type === PersonType.PJ ? 'brand' : 'default'}>
                      {tx.person_type}
                    </Badge>
                  </td>
                  <td
                    style={{
                      padding: '11px 16px',
                      textAlign: 'right',
                      fontWeight: 700,
                      fontFamily: 'Georgia, serif',
                      whiteSpace: 'nowrap',
                      color: tx.type === TransactionType.INCOME ? '#4a6741' : '#c0392b',
                    }}
                  >
                    {tx.type === TransactionType.INCOME ? '+' : '−'} {formatCurrency(tx.amount)}
                  </td>
                  <td style={{ padding: '11px 16px' }}>
                    <button
                      onClick={() => void deleteTx.mutateAsync(tx.id)}
                      title="Excluir"
                      style={{
                        background: 'none',
                        border: 'none',
                        cursor: 'pointer',
                        color: '#ceb99f',
                        fontSize: 12,
                        transition: 'color 0.15s',
                      }}
                      onMouseEnter={(e) => ((e.currentTarget as HTMLButtonElement).style.color = '#c0392b')}
                      onMouseLeave={(e) => ((e.currentTarget as HTMLButtonElement).style.color = '#ceb99f')}
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
          {/* Income / Expense toggle */}
          <div
            style={{
              display: 'flex',
              overflow: 'hidden',
              borderRadius: 8,
              border: '1px solid #e0d3c0',
            }}
          >
            {([TransactionType.EXPENSE, TransactionType.INCOME] as const).map((t) => (
              <button
                key={t}
                type="button"
                onClick={() => handleTypeChange(t)}
                style={{
                  flex: 1,
                  padding: '9px 12px',
                  fontSize: 12,
                  fontWeight: 700,
                  letterSpacing: '0.06em',
                  textTransform: 'uppercase',
                  border: 'none',
                  cursor: 'pointer',
                  transition: 'background 0.15s, color 0.15s',
                  background:
                    form.type === t
                      ? t === TransactionType.INCOME ? '#4a6741' : '#c0392b'
                      : '#f9f6f0',
                  color: form.type === t ? '#ffffff' : '#9b7b5c',
                  fontFamily: 'Inter, system-ui, sans-serif',
                }}
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
                type="number" min="0.01" step="0.01"
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

          {formError && <p style={{ fontSize: 12, color: '#c0392b' }}>{formError}</p>}

          <div className="flex justify-end gap-3 pt-2">
            <Button type="button" variant="secondary" onClick={() => setOpen(false)}>Cancelar</Button>
            <Button type="submit" loading={createTx.isPending}>Salvar</Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
