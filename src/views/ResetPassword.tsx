import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabaseClient';
import { parseSupabaseError } from '../lib/errors';

const inputStyle: React.CSSProperties = {
  display: 'block', width: '100%', borderRadius: 8,
  border: '1px solid #e0d3c0', background: '#f9f6f0',
  padding: '10px 14px', fontSize: 14, color: '#2b1a10',
  outline: 'none', fontFamily: 'Inter, system-ui, sans-serif', boxSizing: 'border-box',
};

const labelStyle: React.CSSProperties = {
  display: 'block', marginBottom: 6, fontSize: 11, fontWeight: 700,
  letterSpacing: '0.07em', textTransform: 'uppercase', color: '#7d6250',
};

function handleFocus(e: React.FocusEvent<HTMLInputElement>) {
  e.currentTarget.style.borderColor = '#c9a435';
  e.currentTarget.style.boxShadow = '0 0 0 3px rgba(201,164,53,0.12)';
}
function handleBlur(e: React.FocusEvent<HTMLInputElement>) {
  e.currentTarget.style.borderColor = '#e0d3c0';
  e.currentTarget.style.boxShadow = 'none';
}

export function ResetPassword() {
  const navigate = useNavigate();
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event) => {
      if (event === 'PASSWORD_RECOVERY') setReady(true);
    });
    return () => subscription.unsubscribe();
  }, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    if (password.length < 8) { setError('A senha deve ter pelo menos 8 caracteres.'); return; }
    if (password !== confirm) { setError('As senhas não coincidem.'); return; }

    setLoading(true);
    try {
      const { error: updateError } = await supabase.auth.updateUser({ password });
      if (updateError) throw updateError;
      navigate('/dashboard');
    } catch (err) {
      setError(parseSupabaseError(err).message);
    } finally {
      setLoading(false);
    }
  }

  if (!ready) {
    return (
      <div className="flex min-h-screen items-center justify-center" style={{ background: '#f4efe4' }}>
        <div className="text-center">
          <div className="h-8 w-8 mx-auto animate-spin rounded-full border-2" style={{ borderColor: '#e0d3c0', borderTopColor: '#c9a435' }} />
          <p className="mt-3 text-sm" style={{ color: '#9b7b5c' }}>Validando link de recuperação...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen items-center justify-center px-4" style={{ background: '#f4efe4' }}>
      <div className="w-full max-w-sm">
        <div className="mb-10 text-center">
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full" style={{ background: '#2b1a10' }}>
            <span style={{ color: '#c9a435', fontSize: 24 }}>♛</span>
          </div>
          <h1 style={{ fontFamily: 'Georgia, serif', fontSize: 20, fontWeight: 700, color: '#2b1a10', margin: 0 }}>
            Nova senha
          </h1>
          <p className="mt-1.5 text-sm" style={{ color: '#9b7b5c' }}>
            Escolha uma senha segura para sua conta.
          </p>
        </div>

        <div className="rounded-2xl p-8" style={{ background: '#ffffff', border: '1px solid #ede4d5', boxShadow: '0 4px 24px rgba(43,26,16,0.08)' }}>
          <form onSubmit={(e) => void handleSubmit(e)} className="space-y-5">
            <div>
              <label style={labelStyle}>Nova senha</label>
              <input type="password" autoComplete="new-password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Mínimo 8 caracteres" required style={inputStyle} onFocus={handleFocus} onBlur={handleBlur} />
            </div>
            <div>
              <label style={labelStyle}>Confirmar nova senha</label>
              <input type="password" autoComplete="new-password" value={confirm} onChange={(e) => setConfirm(e.target.value)} placeholder="Repita a senha" required style={inputStyle} onFocus={handleFocus} onBlur={handleBlur} />
            </div>

            {error && (
              <div className="rounded-lg px-4 py-3 text-sm" style={{ background: '#fde8e5', border: '1px solid #c0392b', color: '#c0392b' }}>
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              style={{
                display: 'block', width: '100%', borderRadius: 8,
                background: loading ? '#5e4a3c' : '#2b1a10', color: '#ffffff',
                padding: '11px 16px', fontSize: 12, fontWeight: 700, letterSpacing: '0.1em',
                textTransform: 'uppercase', border: 'none',
                cursor: loading ? 'not-allowed' : 'pointer', fontFamily: 'Inter, system-ui, sans-serif',
              }}
            >
              {loading ? 'Salvando...' : 'Salvar nova senha'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
