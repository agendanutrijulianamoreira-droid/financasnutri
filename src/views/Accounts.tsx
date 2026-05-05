import { useState } from 'react';
import { useAccounts, useCreateAccount, useDeactivateAccount } from '../hooks/useAccounts';
import { Modal } from '../components/ui/Modal';
import { Button } from '../components/ui/Button';
import { Badge } from '../components/ui/Badge';
import { EmptyState } from '../components/ui/EmptyState';
import { PageHeader } from '../components/ui/PageHeader';
import { FormField, Input, Select } from '../components/ui/FormField';
import { formatCurrency } from '../services/financialCalculations';
import { PersonType, AccountType } from '../types';
import type { CreateAccountInput } from '../lib/validations';

const ACCOUNT_TYPE_LABELS: Record<AccountType, string> = {
  CHECKING: 'Conta Corrente',
  SAVINGS: 'Poupança',
  INVESTMENT: 'Investimento',
  CREDIT_CARD: 'Cartão de Crédito',
  CASH: 'Dinheiro',
};

const defaultForm = (): CreateAccountInput => ({
  name: '',
  bank_name: '',
  type: AccountType.CHECKING,
  person_type: PersonType.PF,
  currency: 'BRL',
  initial_balance: 0,
  color: null,
  icon: null,
});

export function Accounts() {
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState<CreateAccountInput>(defaultForm());
  const [formError, setFormError] = useState('');

  const { data: accounts = [], isLoading } = useAccounts();
  const createAccount = useCreateAccount();
  const deactivate = useDeactivateAccount();

  const pfAccounts = accounts.filter((a) => a.person_type === PersonType.PF);
  const pjAccounts = accounts.filter((a) => a.person_type === PersonType.PJ);
  const totalPF = pfAccounts.reduce((s, a) => s + a.balance, 0);
  const totalPJ = pjAccounts.reduce((s, a) => s + a.balance, 0);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setFormError('');
    try {
      await createAccount.mutateAsync(form);
      setOpen(false);
      setForm(defaultForm());
    } catch (err) {
      setFormError(err instanceof Error ? err.message : 'Erro ao salvar');
    }
  }

  return (
    <div>
      <PageHeader
        title="Contas"
        description="Suas contas bancárias e carteiras"
        action={<Button onClick={() => setOpen(true)}>+ Nova conta</Button>}
      />

      {/* Summary */}
      <div className="mb-6 grid grid-cols-3 gap-3">
        <div className="rounded-xl border border-neutral-800 bg-neutral-900 p-4">
          <p className="text-xs text-neutral-500">Total Geral</p>
          <p className="mt-1 text-xl font-semibold text-neutral-100">{formatCurrency(totalPF + totalPJ)}</p>
        </div>
        <div className="rounded-xl border border-neutral-800 bg-neutral-900 p-4">
          <p className="text-xs text-neutral-500">PF</p>
          <p className="mt-1 text-xl font-semibold text-neutral-100">{formatCurrency(totalPF)}</p>
        </div>
        <div className="rounded-xl border border-neutral-800 bg-neutral-900 p-4">
          <p className="text-xs text-neutral-500">PJ</p>
          <p className="mt-1 text-xl font-semibold text-brand-400">{formatCurrency(totalPJ)}</p>
        </div>
      </div>

      {isLoading ? (
        <div className="flex justify-center py-16">
          <div className="h-7 w-7 animate-spin rounded-full border-2 border-neutral-700 border-t-brand-500" />
        </div>
      ) : accounts.length === 0 ? (
        <EmptyState
          title="Nenhuma conta cadastrada"
          description="Adicione suas contas para começar a registrar lançamentos."
          action={<Button onClick={() => setOpen(true)}>+ Nova conta</Button>}
        />
      ) : (
        <div className="space-y-6">
          {[
            { label: 'Pessoa Física (PF)', items: pfAccounts },
            { label: 'Pessoa Jurídica (PJ)', items: pjAccounts },
          ].map(({ label, items }) =>
            items.length === 0 ? null : (
              <div key={label}>
                <h3 className="mb-3 text-xs font-semibold uppercase tracking-wider text-neutral-500">{label}</h3>
                <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                  {items.map((account) => (
                    <div
                      key={account.id}
                      className="rounded-xl border border-neutral-800 bg-neutral-900 p-4"
                      style={account.color ? { borderLeftColor: account.color, borderLeftWidth: 3 } : undefined}
                    >
                      <div className="flex items-start justify-between">
                        <div>
                          <p className="font-medium text-neutral-200">{account.name}</p>
                          <p className="mt-0.5 text-xs text-neutral-500">{account.bank_name}</p>
                        </div>
                        <Badge variant={account.person_type === PersonType.PJ ? 'brand' : 'default'}>
                          {ACCOUNT_TYPE_LABELS[account.type]}
                        </Badge>
                      </div>
                      <p className="mt-3 text-2xl font-semibold text-neutral-100">
                        {formatCurrency(account.balance)}
                      </p>
                      <div className="mt-3 flex justify-end">
                        <button
                          onClick={() => void deactivate.mutateAsync(account.id)}
                          className="text-xs text-neutral-600 hover:text-red-400"
                        >
                          Arquivar
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ),
          )}
        </div>
      )}

      <Modal open={open} onClose={() => setOpen(false)} title="Nova Conta">
        <form onSubmit={(e) => void handleSubmit(e)} className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <FormField label="Nome da conta" required>
              <Input
                value={form.name}
                onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                placeholder="Ex: Nubank"
                required
              />
            </FormField>
            <FormField label="Banco / Instituição" required>
              <Input
                value={form.bank_name}
                onChange={(e) => setForm((f) => ({ ...f, bank_name: e.target.value }))}
                placeholder="Ex: Nubank"
                required
              />
            </FormField>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <FormField label="Tipo" required>
              <Select value={form.type} onChange={(e) => setForm((f) => ({ ...f, type: e.target.value as AccountType }))}>
                {Object.entries(ACCOUNT_TYPE_LABELS).map(([k, v]) => (
                  <option key={k} value={k}>{v}</option>
                ))}
              </Select>
            </FormField>
            <FormField label="Pessoa" required>
              <Select value={form.person_type} onChange={(e) => setForm((f) => ({ ...f, person_type: e.target.value as PersonType }))}>
                <option value={PersonType.PF}>Pessoa Física (PF)</option>
                <option value={PersonType.PJ}>Pessoa Jurídica (PJ)</option>
              </Select>
            </FormField>
          </div>

          <FormField label="Saldo inicial (R$)">
            <Input
              type="number"
              step="0.01"
              value={form.initial_balance ?? 0}
              onChange={(e) => setForm((f) => ({ ...f, initial_balance: parseFloat(e.target.value) || 0 }))}
              placeholder="0,00"
            />
          </FormField>

          <FormField label="Cor (opcional)">
            <Input
              type="color"
              value={form.color ?? '#7c3aed'}
              onChange={(e) => setForm((f) => ({ ...f, color: e.target.value }))}
              className="h-10 cursor-pointer"
            />
          </FormField>

          {formError && <p className="text-xs text-red-400">{formError}</p>}

          <div className="flex justify-end gap-3 pt-2">
            <Button type="button" variant="secondary" onClick={() => setOpen(false)}>Cancelar</Button>
            <Button type="submit" loading={createAccount.isPending}>Salvar</Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
