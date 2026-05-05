import { useState } from 'react';
import { useAssets, useCreateAsset, useUpdateAssetValue, useDeleteAsset } from '../hooks/useAssets';
import { Modal } from '../components/ui/Modal';
import { Button } from '../components/ui/Button';
import { Badge } from '../components/ui/Badge';
import { EmptyState } from '../components/ui/EmptyState';
import { PageHeader } from '../components/ui/PageHeader';
import { FormField, Input, Select, Textarea } from '../components/ui/FormField';
import { formatCurrency, computeNetWorth } from '../services/financialCalculations';
import { PersonType, AssetType } from '../types';
import type { CreateAssetInput } from '../lib/validations';

const ASSET_TYPE_LABELS: Record<AssetType, string> = {
  FIXED_INCOME: 'Renda Fixa',
  VARIABLE_INCOME: 'Renda Variável',
  REAL_ESTATE: 'Imóvel',
  CRYPTO: 'Cripto',
  PENSION: 'Previdência',
  OTHER: 'Outro',
};

const defaultForm = (): CreateAssetInput => ({
  name: '',
  type: AssetType.FIXED_INCOME,
  person_type: PersonType.PF,
  institution: '',
  current_value: 0,
  purchase_value: null,
  purchase_date: null,
  annual_return_rate: null,
  is_liquid: false,
  notes: null,
});

export function Assets() {
  const [open, setOpen] = useState(false);
  const [updateId, setUpdateId] = useState<string | null>(null);
  const [newValue, setNewValue] = useState(0);
  const [form, setForm] = useState<CreateAssetInput>(defaultForm());
  const [formError, setFormError] = useState('');

  const { data: assets = [], isLoading } = useAssets();
  const createAsset = useCreateAsset();
  const updateValue = useUpdateAssetValue();
  const deleteAsset = useDeleteAsset();

  const netWorth = computeNetWorth(assets);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setFormError('');
    if (form.current_value < 0) { setFormError('Valor não pode ser negativo'); return; }
    try {
      await createAsset.mutateAsync(form);
      setOpen(false);
      setForm(defaultForm());
    } catch (err) {
      setFormError(err instanceof Error ? err.message : 'Erro ao salvar');
    }
  }

  async function handleUpdateValue(e: React.FormEvent) {
    e.preventDefault();
    if (!updateId) return;
    await updateValue.mutateAsync({ id: updateId, value: newValue });
    setUpdateId(null);
    setNewValue(0);
  }

  const byType = Object.values(AssetType).map((type) => ({
    type,
    label: ASSET_TYPE_LABELS[type],
    items: assets.filter((a) => a.type === type),
    total: assets.filter((a) => a.type === type).reduce((s, a) => s + a.current_value, 0),
  })).filter((g) => g.items.length > 0);

  return (
    <div>
      <PageHeader
        title="Patrimônio"
        description="Seus ativos e investimentos"
        action={<Button onClick={() => setOpen(true)}>+ Novo ativo</Button>}
      />

      <div className="mb-6 grid grid-cols-2 gap-3 lg:grid-cols-4">
        {[
          { label: 'Patrimônio Total', value: netWorth.total },
          { label: 'PF', value: netWorth.pf },
          { label: 'PJ', value: netWorth.pj },
          { label: 'Ativos Líquidos', value: netWorth.liquid },
        ].map((s) => (
          <div key={s.label} className="rounded-xl border border-neutral-800 bg-neutral-900 p-4">
            <p className="text-xs text-neutral-500">{s.label}</p>
            <p className="mt-1 text-xl font-semibold text-neutral-100">{formatCurrency(s.value)}</p>
          </div>
        ))}
      </div>

      {isLoading ? (
        <div className="flex justify-center py-16">
          <div className="h-7 w-7 animate-spin rounded-full border-2 border-neutral-700 border-t-brand-500" />
        </div>
      ) : assets.length === 0 ? (
        <EmptyState
          title="Nenhum ativo cadastrado"
          description="Registre seus investimentos e patrimônio."
          action={<Button onClick={() => setOpen(true)}>+ Novo ativo</Button>}
        />
      ) : (
        <div className="space-y-6">
          {byType.map(({ type, label, items, total }) => (
            <div key={type}>
              <div className="mb-3 flex items-center justify-between">
                <h3 className="text-xs font-semibold uppercase tracking-wider text-neutral-500">{label}</h3>
                <span className="text-sm font-medium text-neutral-300">{formatCurrency(total)}</span>
              </div>
              <div className="overflow-hidden rounded-xl border border-neutral-800">
                <table className="w-full text-sm">
                  <tbody className="divide-y divide-neutral-800 bg-neutral-900">
                    {items.map((asset) => {
                      const gain = asset.purchase_value ? asset.current_value - asset.purchase_value : null;
                      const gainPct = gain !== null && asset.purchase_value ? (gain / asset.purchase_value) * 100 : null;
                      return (
                        <tr key={asset.id} className="hover:bg-neutral-800/50">
                          <td className="px-4 py-3">
                            <p className="font-medium text-neutral-200">{asset.name}</p>
                            <p className="text-xs text-neutral-500">{asset.institution}</p>
                          </td>
                          <td className="px-4 py-3">
                            <div className="flex gap-2">
                              <Badge variant={asset.person_type === PersonType.PJ ? 'brand' : 'default'}>{asset.person_type}</Badge>
                              {asset.is_liquid && <Badge variant="success">Líquido</Badge>}
                            </div>
                          </td>
                          <td className="px-4 py-3 text-right">
                            <p className="font-medium text-neutral-100">{formatCurrency(asset.current_value)}</p>
                            {gain !== null && gainPct !== null && (
                              <p className={`text-xs ${gain >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                                {gain >= 0 ? '+' : ''}{formatCurrency(gain)} ({gainPct >= 0 ? '+' : ''}{gainPct.toFixed(1)}%)
                              </p>
                            )}
                          </td>
                          <td className="px-4 py-3">
                            <div className="flex gap-2 justify-end">
                              <button
                                onClick={() => { setUpdateId(asset.id); setNewValue(asset.current_value); }}
                                className="text-xs text-neutral-500 hover:text-brand-400"
                              >
                                Atualizar
                              </button>
                              <button onClick={() => void deleteAsset.mutateAsync(asset.id)} className="text-neutral-600 hover:text-red-400">✕</button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Create Modal */}
      <Modal open={open} onClose={() => setOpen(false)} title="Novo Ativo">
        <form onSubmit={(e) => void handleSubmit(e)} className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <FormField label="Nome" required>
              <Input value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} placeholder="Ex: Tesouro IPCA+" required />
            </FormField>
            <FormField label="Instituição" required>
              <Input value={form.institution} onChange={(e) => setForm((f) => ({ ...f, institution: e.target.value }))} placeholder="Ex: XP Investimentos" required />
            </FormField>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <FormField label="Tipo" required>
              <Select value={form.type} onChange={(e) => setForm((f) => ({ ...f, type: e.target.value as AssetType }))}>
                {Object.entries(ASSET_TYPE_LABELS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
              </Select>
            </FormField>
            <FormField label="Pessoa" required>
              <Select value={form.person_type} onChange={(e) => setForm((f) => ({ ...f, person_type: e.target.value as PersonType }))}>
                <option value={PersonType.PF}>PF</option>
                <option value={PersonType.PJ}>PJ</option>
              </Select>
            </FormField>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <FormField label="Valor atual (R$)" required>
              <Input type="number" min="0" step="0.01" value={form.current_value || ''} onChange={(e) => setForm((f) => ({ ...f, current_value: parseFloat(e.target.value) || 0 }))} placeholder="0,00" required />
            </FormField>
            <FormField label="Valor de compra (R$)">
              <Input type="number" min="0" step="0.01" value={form.purchase_value ?? ''} onChange={(e) => setForm((f) => ({ ...f, purchase_value: e.target.value ? parseFloat(e.target.value) : null }))} placeholder="Opcional" />
            </FormField>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <FormField label="Rentab. anual (%)">
              <Input type="number" step="0.01" value={form.annual_return_rate ?? ''} onChange={(e) => setForm((f) => ({ ...f, annual_return_rate: e.target.value ? parseFloat(e.target.value) : null }))} placeholder="Ex: 12.5" />
            </FormField>
            <FormField label="Liquidez">
              <div className="flex items-center gap-3 py-2.5">
                <input
                  type="checkbox"
                  id="is_liquid"
                  checked={form.is_liquid}
                  onChange={(e) => setForm((f) => ({ ...f, is_liquid: e.target.checked }))}
                  className="h-4 w-4 rounded border-neutral-700 bg-neutral-800 accent-brand-500"
                />
                <label htmlFor="is_liquid" className="text-sm text-neutral-300">Ativo líquido</label>
              </div>
            </FormField>
          </div>

          <FormField label="Observações">
            <Textarea value={form.notes ?? ''} onChange={(e) => setForm((f) => ({ ...f, notes: e.target.value || null }))} placeholder="Opcional" />
          </FormField>

          {formError && <p className="text-xs text-red-400">{formError}</p>}
          <div className="flex justify-end gap-3 pt-2">
            <Button type="button" variant="secondary" onClick={() => setOpen(false)}>Cancelar</Button>
            <Button type="submit" loading={createAsset.isPending}>Salvar</Button>
          </div>
        </form>
      </Modal>

      {/* Update Value Modal */}
      <Modal open={updateId !== null} onClose={() => setUpdateId(null)} title="Atualizar Valor" maxWidth="sm">
        <form onSubmit={(e) => void handleUpdateValue(e)} className="space-y-4">
          <FormField label="Novo valor atual (R$)" required>
            <Input type="number" min="0" step="0.01" value={newValue || ''} onChange={(e) => setNewValue(parseFloat(e.target.value) || 0)} placeholder="0,00" autoFocus required />
          </FormField>
          <div className="flex justify-end gap-3">
            <Button type="button" variant="secondary" onClick={() => setUpdateId(null)}>Cancelar</Button>
            <Button type="submit" loading={updateValue.isPending}>Confirmar</Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
