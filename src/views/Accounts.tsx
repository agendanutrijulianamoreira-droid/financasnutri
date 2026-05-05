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
  name: '', bank_name: '', type: AccountType.CHECKING,
  person_type: PersonType.PF, currency: 'BRL', initial_balance: 0,
  color: null, icon: null,
});

const cardStyle: React.CSSProperties = {
  borderRadius: 10,
  background: '#ffffff',
  border: '1px solid #ede4d5',
  padding: '14px 18px',
  boxShadow: '0 1px 4px rgba(43,26,16,0.05)',
};

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
        {[
          { label: 'Total Geral', value: totalPF + totalPJ, color: '#2b1a10' },
          { label: 'Pessoa Física', value: totalPF, color: '#2b1a10' },
          { label: 'Pessoa Jurídica', value: totalPJ, color: '#c9a435' },
        ].map((s) => (
          <div key={s.label} style={cardStyle}>
            <p style={{ margin: 0, fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.07em', color: '#9b7b5c' }}>{s.label}</p>
            <p style={{ margin: '6px 0 0', fontSize: 20, fontWeight: 700, fontFamily: 'Georgia, serif', color: s.color }}>{formatCurrency(s.value)}</p>
          </div>
        ))}
      </div>

      {isLoading ? (
        <div className="flex justify-center py-16">
          <div className="h-7 w-7 animate-spin rounded-full border-2" style={{ borderColor: '#e0d3c0', borderTopColor: '#c9a435' }} />
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
                <h3 style={{ margin: '0 0 12px', fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: '#9b7b5c' }}>
                  {label}
                </h3>
                <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                  {items.map((account) => (
                    <div
                      key={account.id}
                      style={{
                        borderRadius: 12,
                        background: '#ffffff',
                        border: '1px solid #ede4d5',
                        borderLeft: account.color ? `3px solid ${account.color}` : '1px solid #ede4d5',
                        padding: 20,
                        boxShadow: '0 1px 4px rgba(43,26,16,0.05)',
                      }}
                    >
                      <div className="flex items-start justify-between mb-3">
                        <div>
                          <p style={{ margin: 0, fontWeight: 600, color: '#2b1a10', fontSize: 14 }}>{account.name}</p>
                          <p style={{ margin: '2px 0 0', fontSize: 11, color: '#9b7b5c' }}>{account.bank_name}</p>
                        </div>
                        <Badge variant={account.person_type === PersonType.PJ ? 'brand' : 'default'}>
                          {ACCOUNT_TYPE_LABELS[account.type]}
                        </Badge>
                      </div>
                      <p style={{ margin: 0, fontSize: 22, fontWeight: 700, fontFamily: 'Georgia, serif', color: '#2b1a10' }}>
                        {formatCurrency(account.balance)}
                      </p>
                      <div className="mt-4 flex justify-end">
                        <button
                          onClick={() => void deactivate.mutateAsync(account.id)}
                          style={{
                            background: 'none', border: 'none', cursor: 'pointer',
                            fontSize: 11, color: '#ceb99f', transition: 'color 0.15s',
                            fontFamily: 'Inter, system-ui, sans-serif',
                          }}
                          onMouseEnter={(e) => ((e.currentTarget as HTMLButtonElement).style.color = '#c0392b')}
                          onMouseLeave={(e) => ((e.currentTarget as HTMLButtonElement).style.color = '#ceb99f')}
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
              <Input value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} placeholder="Ex: Nubank" required />
            </FormField>
            <FormField label="Banco / Instituição" required>
              <Input value={form.bank_name} onChange={(e) => setForm((f) => ({ ...f, bank_name: e.target.value }))} placeholder="Ex: Nubank" required />
            </FormField>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <FormField label="Tipo" required>
              <Select value={form.type} onChange={(e) => setForm((f) => ({ ...f, type: e.target.value as AccountType }))}>
                {Object.entries(ACCOUNT_TYPE_LABELS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
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
            <Input type="number" step="0.01" value={form.initial_balance ?? 0} onChange={(e) => setForm((f) => ({ ...f, initial_balance: parseFloat(e.target.value) || 0 }))} placeholder="0,00" />
          </FormField>

          <FormField label="Cor de destaque (opcional)">
            <Input type="color" value={form.color ?? '#c9a435'} onChange={(e) => setForm((f) => ({ ...f, color: e.target.value }))} style={{ height: 40, cursor: 'pointer' }} />
          </FormField>

          {formError && <p style={{ fontSize: 12, color: '#c0392b' }}>{formError}</p>}

          <div className="flex justify-end gap-3 pt-2">
            <Button type="button" variant="secondary" onClick={() => setOpen(false)}>Cancelar</Button>
            <Button type="submit" loading={createAccount.isPending}>Salvar</Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
