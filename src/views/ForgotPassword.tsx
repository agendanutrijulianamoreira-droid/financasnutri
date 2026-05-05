import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { parseSupabaseError } from '../lib/errors';

const inputStyle: React.CSSProperties = {
  display: 'block', width: '100%', borderRadius: 8,
  border: '1px solid #e0d3c0', background: '#f9f6f0',
  padding: '10px 14px', fontSize: 14, color: '#2b1a10',
  outline: 'none', fontFamily: 'Inter, system-ui, sans-serif', boxSizing: 'border-box',
};

export function ForgotPassword() {
  const { resetPassword } = useAuth();
  const [email, setEmail] = useState('');
  const [error, setError] = useState('');
  const [sent, setSent] = useState(false);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    if (!email) return;
    setLoading(true);
    try {
      await resetPassword(email);
      setSent(true);
    } catch (err) {
      setError(parseSupabaseError(err).message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center px-4" style={{ background: '#f4efe4' }}>
      <div className="w-full max-w-sm">
        <div className="mb-10 text-center">
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full" style={{ background: '#2b1a10' }}>
            <span style={{ color: '#c9a435', fontSize: 24 }}>♛</span>
          </div>
          <h1 style={{ fontFamily: 'Georgia, serif', fontSize: 20, fontWeight: 700, color: '#2b1a10', margin: 0 }}>
            Recuperar senha
          </h1>
          <p className="mt-1.5 text-sm" style={{ color: '#9b7b5c' }}>
            Informe seu e-mail e enviaremos um link de redefinição.
          </p>
        </div>

        <div className="rounded-2xl p-8" style={{ background: '#ffffff', border: '1px solid #ede4d5', boxShadow: '0 4px 24px rgba(43,26,16,0.08)' }}>
          {sent ? (
            <div className="text-center py-4">
              <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full" style={{ background: '#e8f0e5', color: '#4a6741', fontSize: 20 }}>
                ✓
              </div>
              <p style={{ fontFamily: 'Georgia, serif', fontSize: 15, fontWeight: 700, color: '#2b1a10', margin: 0 }}>E-mail enviado!</p>
              <p className="mt-2 text-sm" style={{ color: '#7d6250' }}>
                Verifique sua caixa de entrada e siga o link para redefinir sua senha.
              </p>
            </div>
          ) : (
            <form onSubmit={(e) => void handleSubmit(e)} className="space-y-5">
              <div>
                <label style={{ display: 'block', marginBottom: 6, fontSize: 11, fontWeight: 700, letterSpacing: '0.07em', textTransform: 'uppercase', color: '#7d6250' }}>
                  E-mail cadastrado
                </label>
                <input
                  id="email"
                  type="email"
                  autoComplete="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="voce@exemplo.com"
                  required
                  style={inputStyle}
                  onFocus={(e) => { e.currentTarget.style.borderColor = '#c9a435'; e.currentTarget.style.boxShadow = '0 0 0 3px rgba(201,164,53,0.12)'; }}
                  onBlur={(e) => { e.currentTarget.style.borderColor = '#e0d3c0'; e.currentTarget.style.boxShadow = 'none'; }}
                />
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
                {loading ? 'Enviando...' : 'Enviar link'}
              </button>
            </form>
          )}
        </div>

        <p className="mt-6 text-center text-sm" style={{ color: '#9b7b5c' }}>
          <Link
            to="/login"
            style={{ color: '#c9a435', fontWeight: 600, textDecoration: 'none' }}
            onMouseEnter={(e) => ((e.currentTarget as HTMLAnchorElement).style.textDecoration = 'underline')}
            onMouseLeave={(e) => ((e.currentTarget as HTMLAnchorElement).style.textDecoration = 'none')}
          >
            ← Voltar para o login
          </Link>
        </p>
      </div>
    </div>
  );
}
