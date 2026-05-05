import { useState, useEffect } from 'react';
import { useProfile, useUpdateProfile, useUpsertPF, useUpsertPJ } from '../hooks/useProfile';
import { PageHeader } from '../components/ui/PageHeader';
import { Button } from '../components/ui/Button';
import { FormField, Input, Select } from '../components/ui/FormField';

type Tab = 'personal' | 'pf' | 'pj' | 'goals';

const TAB_LABELS: Record<Tab, string> = {
  personal: 'Perfil',
  pf: 'Pessoa Física',
  pj: 'Pessoa Jurídica',
  goals: 'Metas Pessoais',
};

function SectionCard({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div
      style={{
        borderRadius: 12, background: '#ffffff', border: '1px solid #ede4d5',
        padding: 24, boxShadow: '0 1px 4px rgba(43,26,16,0.05)',
      }}
    >
      <h3
        style={{ margin: '0 0 20px', fontFamily: 'Georgia, serif', fontSize: 15, fontWeight: 700, color: '#2b1a10' }}
      >
        {title}
      </h3>
      {children}
    </div>
  );
}

export function Settings() {
  const [activeTab, setActiveTab] = useState<Tab>('personal');
  const [saved, setSaved] = useState(false);

  const { data: profile, isLoading } = useProfile();
  const updateProfile = useUpdateProfile();
  const upsertPF = useUpsertPF();
  const upsertPJ = useUpsertPJ();

  const [personal, setPersonal] = useState({ full_name: '', profession: '', phone: '' });
  const [pf, setPf] = useState({ cpf: '', tax_bracket: '' });
  const [pj, setPj] = useState({ cnpj: '', company_name: '', tax_regime: 'SIMPLES', pro_labore: '' });
  const [goals, setGoals] = useState({
    monthly_income_target: '',
    emergency_fund_months: '6',
    financial_independence_target: '',
  });

  useEffect(() => {
    if (!profile) return;
    setPersonal({ full_name: profile.full_name ?? '', profession: profile.profession ?? '', phone: profile.phone ?? '' });
    setPf({ cpf: profile.pf_profile?.cpf ?? '', tax_bracket: profile.pf_profile?.tax_bracket?.toString() ?? '' });
    setPj({
      cnpj: profile.pj_profile?.cnpj ?? '',
      company_name: profile.pj_profile?.company_name ?? '',
      tax_regime: profile.pj_profile?.tax_regime ?? 'SIMPLES',
      pro_labore: profile.pj_profile?.pro_labore?.toString() ?? '',
    });
    setGoals({
      monthly_income_target: profile.monthly_income_target?.toString() ?? '',
      emergency_fund_months: profile.emergency_fund_months?.toString() ?? '6',
      financial_independence_target: profile.financial_independence_target?.toString() ?? '',
    });
  }, [profile]);

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();

    if (activeTab === 'personal') {
      await updateProfile.mutateAsync({
        full_name: personal.full_name,
        profession: personal.profession || null,
        phone: personal.phone || null,
      });
    }
    if (activeTab === 'pf') {
      await upsertPF.mutateAsync({
        cpf: pf.cpf || null,
        tax_bracket: pf.tax_bracket ? parseFloat(pf.tax_bracket) : null,
      });
    }
    if (activeTab === 'pj') {
      if (!pj.cnpj || !pj.company_name) return;
      await upsertPJ.mutateAsync({
        cnpj: pj.cnpj, company_name: pj.company_name,
        tax_regime: pj.tax_regime as 'SIMPLES' | 'LUCRO_PRESUMIDO' | 'LUCRO_REAL',
        pro_labore: pj.pro_labore ? parseFloat(pj.pro_labore) : null,
      });
    }
    if (activeTab === 'goals') {
      await updateProfile.mutateAsync({
        monthly_income_target: goals.monthly_income_target ? parseFloat(goals.monthly_income_target) : null,
        emergency_fund_months: parseInt(goals.emergency_fund_months) || 6,
        financial_independence_target: goals.financial_independence_target ? parseFloat(goals.financial_independence_target) : null,
      });
    }

    setSaved(true);
    setTimeout(() => setSaved(false), 2500);
  }

  const isSaving = updateProfile.isPending || upsertPF.isPending || upsertPJ.isPending;

  if (isLoading) {
    return (
      <div className="flex justify-center py-16">
        <div className="h-7 w-7 animate-spin rounded-full border-2" style={{ borderColor: '#e0d3c0', borderTopColor: '#c9a435' }} />
      </div>
    );
  }

  return (
    <div className="max-w-2xl">
      <PageHeader title="Configurações" description="Gerencie seu perfil e preferências" />

      {/* Tabs */}
      <div style={{ display: 'flex', gap: 4, marginBottom: 24, borderRadius: 10, background: '#f9f6f0', border: '1px solid #e0d3c0', padding: 4 }}>
        {(Object.keys(TAB_LABELS) as Tab[]).map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            style={{
              flex: 1, borderRadius: 7, padding: '8px 12px', fontSize: 12, fontWeight: 700,
              border: 'none', cursor: 'pointer', transition: 'background 0.15s, color 0.15s',
              background: activeTab === tab ? '#2b1a10' : 'transparent',
              color: activeTab === tab ? '#ffffff' : '#9b7b5c',
              fontFamily: 'Inter, system-ui, sans-serif',
              letterSpacing: '0.04em',
            }}
          >
            {TAB_LABELS[tab]}
          </button>
        ))}
      </div>

      <form onSubmit={(e) => void handleSave(e)}>
        {activeTab === 'personal' && (
          <SectionCard title="Dados pessoais">
            <div className="space-y-4">
              <FormField label="Nome completo" required>
                <Input value={personal.full_name} onChange={(e) => setPersonal((f) => ({ ...f, full_name: e.target.value }))} placeholder="Seu nome completo" required />
              </FormField>
              <FormField label="Profissão">
                <Input value={personal.profession} onChange={(e) => setPersonal((f) => ({ ...f, profession: e.target.value }))} placeholder="Ex: Nutricionista" />
              </FormField>
              <FormField label="Telefone">
                <Input value={personal.phone} onChange={(e) => setPersonal((f) => ({ ...f, phone: e.target.value }))} placeholder="(11) 99999-9999" />
              </FormField>
            </div>
          </SectionCard>
        )}

        {activeTab === 'pf' && (
          <SectionCard title="Pessoa Física">
            <div className="space-y-4">
              <FormField label="CPF">
                <Input value={pf.cpf} onChange={(e) => setPf((f) => ({ ...f, cpf: e.target.value }))} placeholder="000.000.000-00" />
              </FormField>
              <FormField label="Alíquota IRPF (%)">
                <Select value={pf.tax_bracket} onChange={(e) => setPf((f) => ({ ...f, tax_bracket: e.target.value }))}>
                  <option value="">Não informado</option>
                  <option value="0">Isento (0%)</option>
                  <option value="7.5">7,5%</option>
                  <option value="15">15%</option>
                  <option value="22.5">22,5%</option>
                  <option value="27.5">27,5%</option>
                </Select>
              </FormField>
            </div>
          </SectionCard>
        )}

        {activeTab === 'pj' && (
          <SectionCard title="Pessoa Jurídica">
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <FormField label="CNPJ" required={activeTab === 'pj'}>
                  <Input value={pj.cnpj} onChange={(e) => setPj((f) => ({ ...f, cnpj: e.target.value }))} placeholder="00.000.000/0001-00" />
                </FormField>
                <FormField label="Razão Social" required={activeTab === 'pj'}>
                  <Input value={pj.company_name} onChange={(e) => setPj((f) => ({ ...f, company_name: e.target.value }))} placeholder="Nome da empresa" />
                </FormField>
              </div>
              <FormField label="Regime Tributário">
                <Select value={pj.tax_regime} onChange={(e) => setPj((f) => ({ ...f, tax_regime: e.target.value }))}>
                  <option value="SIMPLES">Simples Nacional</option>
                  <option value="LUCRO_PRESUMIDO">Lucro Presumido</option>
                  <option value="LUCRO_REAL">Lucro Real</option>
                </Select>
              </FormField>
              <FormField label="Pró-Labore Mensal (R$)">
                <Input type="number" min="0" step="0.01" value={pj.pro_labore} onChange={(e) => setPj((f) => ({ ...f, pro_labore: e.target.value }))} placeholder="Ex: 5000,00" />
              </FormField>
            </div>
          </SectionCard>
        )}

        {activeTab === 'goals' && (
          <SectionCard title="Metas Pessoais">
            <div className="space-y-4">
              <FormField label="Meta de receita mensal (R$)">
                <Input type="number" min="0" step="0.01" value={goals.monthly_income_target} onChange={(e) => setGoals((f) => ({ ...f, monthly_income_target: e.target.value }))} placeholder="Ex: 15000,00" />
              </FormField>
              <FormField label="Meses de reserva de emergência">
                <Select value={goals.emergency_fund_months} onChange={(e) => setGoals((f) => ({ ...f, emergency_fund_months: e.target.value }))}>
                  {[3, 6, 9, 12, 18, 24].map((m) => <option key={m} value={m}>{m} meses</option>)}
                </Select>
              </FormField>
              <FormField label="Patrimônio alvo para independência financeira (R$)">
                <Input type="number" min="0" step="1000" value={goals.financial_independence_target} onChange={(e) => setGoals((f) => ({ ...f, financial_independence_target: e.target.value }))} placeholder="Ex: 3000000,00" />
              </FormField>
            </div>
          </SectionCard>
        )}

        <div className="mt-5 flex items-center justify-end gap-4">
          {saved && (
            <span style={{ fontSize: 13, color: '#4a6741', fontWeight: 600 }}>
              ✓ Salvo com sucesso
            </span>
          )}
          <Button type="submit" loading={isSaving}>Salvar alterações</Button>
        </div>
      </form>
    </div>
  );
}
