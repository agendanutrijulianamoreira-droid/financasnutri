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
  FIXED_INCOME: 'Renda Fixa', VARIABLE_INCOME: 'Renda Variável',
  REAL_ESTATE: 'Imóvel', CRYPTO: 'Cripto', PENSION: 'Previdência', OTHER: 'Outro',
};

const defaultForm = (): CreateAssetInput => ({
  name: '', type: AssetType.FIXED_INCOME, person_type: PersonType.PF,
  institution: '', current_value: 0, purchase_value: null,
  purchase_date: null, annual_return_rate: null, is_liquid: false, notes: null,
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
    type, label: ASSET_TYPE_LABELS[type],
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

      {/* Summary */}
      <div className="mb-6 grid grid-cols-2 gap-3 lg:grid-cols-4">
        {[
          { label: 'Patrimônio Total', value: netWorth.total, color: '#2b1a10', featured: true },
          { label: 'PF', value: netWorth.pf, color: '#2b1a10', featured: false },
          { label: 'PJ', value: netWorth.pj, color: '#c9a435', featured: false },
          { label: 'Ativos Líquidos', value: netWorth.liquid, color: '#4a6741', featured: false },
        ].map((s) => (
          <div
            key={s.label}
            style={{
              borderRadius: 10,
              background: '#ffffff',
              border: '1px solid #ede4d5',
              borderTop: s.featured ? '2px solid #c9a435' : '1px solid #ede4d5',
              padding: '14px 18px',
              boxShadow: '0 1px 4px rgba(43,26,16,0.05)',
            }}
          >
            <p style={{ margin: 0, fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.07em', color: '#9b7b5c' }}>{s.label}</p>
            <p style={{ margin: '6px 0 0', fontSize: 20, fontWeight: 700, fontFamily: 'Georgia, serif', color: s.color }}>{formatCurrency(s.value)}</p>
          </div>
        ))}
      </div>

      {isLoading ? (
        <div className="flex justify-center py-16">
          <div className="h-7 w-7 animate-spin rounded-full border-2" style={{ borderColor: '#e0d3c0', borderTopColor: '#c9a435' }} />
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
                <h3 style={{ margin: 0, fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: '#9b7b5c' }}>{label}</h3>
                <span style={{ fontSize: 13, fontWeight: 700, color: '#2b1a10', fontFamily: 'Georgia, serif' }}>{formatCurrency(total)}</span>
              </div>
              <div style={{ overflow: 'hidden', borderRadius: 10, border: '1px solid #ede4d5', boxShadow: '0 1px 4px rgba(43,26,16,0.05)' }}>
                <table className="w-full text-sm" style={{ background: '#ffffff' }}>
                  <tbody>
                    {items.map((asset, idx) => {
                      const gain = asset.purchase_value ? asset.current_value - asset.purchase_value : null;
                      const gainPct = gain !== null && asset.purchase_value ? (gain / asset.purchase_value) * 100 : null;
                      return (
                        <tr
                          key={asset.id}
                          style={{ borderTop: idx > 0 ? '1px solid #f9f6f0' : undefined }}
                          onMouseEnter={(e) => ((e.currentTarget as HTMLTableRowElement).style.background = '#fdfbf8')}
                          onMouseLeave={(e) => ((e.currentTarget as HTMLTableRowElement).style.background = 'transparent')}
                        >
                          <td style={{ padding: '12px 16px' }}>
                            <p style={{ margin: 0, fontWeight: 600, color: '#2b1a10', fontSize: 13 }}>{asset.name}</p>
                            <p style={{ margin: '2px 0 0', fontSize: 11, color: '#9b7b5c' }}>{asset.institution}</p>
                          </td>
                          <td style={{ padding: '12px 16px' }}>
                            <div className="flex gap-2">
                              <Badge variant={asset.person_type === PersonType.PJ ? 'brand' : 'default'}>{asset.person_type}</Badge>
                              {asset.is_liquid && <Badge variant="success">Líquido</Badge>}
                            </div>
                          </td>
                          <td style={{ padding: '12px 16px', textAlign: 'right' }}>
                            <p style={{ margin: 0, fontWeight: 700, fontFamily: 'Georgia, serif', color: '#2b1a10', fontSize: 14 }}>{formatCurrency(asset.current_value)}</p>
                            {gain !== null && gainPct !== null && (
                              <p style={{ margin: '2px 0 0', fontSize: 11, color: gain >= 0 ? '#4a6741' : '#c0392b', fontWeight: 600 }}>
                                {gain >= 0 ? '+' : ''}{formatCurrency(gain)} ({gainPct >= 0 ? '+' : ''}{gainPct.toFixed(1)}%)
                              </p>
                            )}
                          </td>
                          <td style={{ padding: '12px 16px' }}>
                            <div className="flex gap-3 justify-end">
                              <button
                                onClick={() => { setUpdateId(asset.id); setNewValue(asset.current_value); }}
                                style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 11, color: '#c9a435', fontWeight: 600, fontFamily: 'Inter, system-ui, sans-serif' }}
                              >
                                Atualizar
                              </button>
                              <button
                                onClick={() => void deleteAsset.mutateAsync(asset.id)}
                                style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 12, color: '#ceb99f', transition: 'color 0.15s' }}
                                onMouseEnter={(e) => ((e.currentTarget as HTMLButtonElement).style.color = '#c0392b')}
                                onMouseLeave={(e) => ((e.currentTarget as HTMLButtonElement).style.color = '#ceb99f')}
                              >
                                ✕
                              </button>
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
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '9px 0' }}>
                <input
                  type="checkbox"
                  id="is_liquid"
                  checked={form.is_liquid}
                  onChange={(e) => setForm((f) => ({ ...f, is_liquid: e.target.checked }))}
                  style={{ width: 16, height: 16, accentColor: '#c9a435', cursor: 'pointer' }}
                />
                <label htmlFor="is_liquid" style={{ fontSize: 13, color: '#5e4a3c', cursor: 'pointer' }}>Ativo líquido</label>
              </div>
            </FormField>
          </div>

          <FormField label="Observações">
            <Textarea value={form.notes ?? ''} onChange={(e) => setForm((f) => ({ ...f, notes: e.target.value || null }))} placeholder="Opcional" />
          </FormField>

          {formError && <p style={{ fontSize: 12, color: '#c0392b' }}>{formError}</p>}
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
