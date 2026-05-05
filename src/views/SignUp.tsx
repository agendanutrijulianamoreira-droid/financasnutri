import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { signUpSchema } from '../lib/validations';
import { parseSupabaseError } from '../lib/errors';

const inputStyle: React.CSSProperties = {
  display: 'block',
  width: '100%',
  borderRadius: 8,
  border: '1px solid #e0d3c0',
  background: '#f9f6f0',
  padding: '10px 14px',
  fontSize: 14,
  color: '#2b1a10',
  outline: 'none',
  fontFamily: 'Inter, system-ui, sans-serif',
  boxSizing: 'border-box',
};

const labelStyle: React.CSSProperties = {
  display: 'block',
  marginBottom: 6,
  fontSize: 11,
  fontWeight: 700,
  letterSpacing: '0.07em',
  textTransform: 'uppercase',
  color: '#7d6250',
};

function handleFocus(e: React.FocusEvent<HTMLInputElement>) {
  e.currentTarget.style.borderColor = '#c9a435';
  e.currentTarget.style.boxShadow = '0 0 0 3px rgba(201,164,53,0.12)';
}
function handleBlur(e: React.FocusEvent<HTMLInputElement>) {
  e.currentTarget.style.borderColor = '#e0d3c0';
  e.currentTarget.style.boxShadow = 'none';
}

export function SignUp() {
  const navigate = useNavigate();
  const { signUp } = useAuth();
  const [form, setForm] = useState({ full_name: '', email: '', password: '', confirm_password: '' });
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');

    const result = signUpSchema.safeParse(form);
    if (!result.success) {
      setError(result.error.errors[0].message);
      return;
    }

    setLoading(true);
    try {
      await signUp(result.data);
      setSuccess(true);
    } catch (err) {
      setError(parseSupabaseError(err).message);
    } finally {
      setLoading(false);
    }
  }

  if (success) {
    return (
      <div
        className="flex min-h-screen items-center justify-center px-4"
        style={{ background: '#f4efe4' }}
      >
        <div className="w-full max-w-sm text-center">
          <div
            className="mx-auto mb-5 flex h-14 w-14 items-center justify-center rounded-full text-2xl"
            style={{ background: '#e8f0e5', color: '#4a6741' }}
          >
            ✓
          </div>
          <h2
            style={{
              fontFamily: 'Georgia, serif',
              fontSize: 20,
              fontWeight: 700,
              color: '#2b1a10',
              margin: '0 0 8px',
            }}
          >
            Verifique seu e-mail
          </h2>
          <p className="text-sm" style={{ color: '#7d6250' }}>
            Enviamos um link de confirmação para{' '}
            <strong style={{ color: '#2b1a10' }}>{form.email}</strong>.
            Clique no link para ativar sua conta.
          </p>
          <button
            onClick={() => navigate('/login')}
            style={{
              marginTop: 24,
              fontSize: 13,
              color: '#c9a435',
              fontWeight: 600,
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              textDecoration: 'underline',
            }}
          >
            Ir para o login
          </button>
        </div>
      </div>
    );
  }

  return (
    <div
      className="flex min-h-screen items-center justify-center px-4"
      style={{ background: '#f4efe4' }}
    >
      <div className="w-full max-w-sm">
        {/* Brand */}
        <div className="mb-10 text-center">
          <div
            className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full"
            style={{ background: '#2b1a10' }}
          >
            <span style={{ color: '#c9a435', fontSize: 24 }}>♛</span>
          </div>
          <h1
            style={{
              fontFamily: 'Georgia, serif',
              fontSize: 22,
              fontWeight: 700,
              color: '#2b1a10',
              margin: 0,
            }}
          >
            Rainha das Finanças
          </h1>
          <p className="mt-1.5 text-sm" style={{ color: '#9b7b5c' }}>
            Crie sua conta gratuitamente
          </p>
        </div>

        {/* Card */}
        <div
          className="rounded-2xl p-8"
          style={{
            background: '#ffffff',
            border: '1px solid #ede4d5',
            boxShadow: '0 4px 24px rgba(43,26,16,0.08)',
          }}
        >
          <form onSubmit={(e) => void handleSubmit(e)} className="space-y-5">
            <div>
              <label htmlFor="full_name" style={labelStyle}>Nome completo</label>
              <input
                id="full_name"
                type="text"
                autoComplete="name"
                value={form.full_name}
                onChange={(e) => setForm((f) => ({ ...f, full_name: e.target.value }))}
                placeholder="Juliana Moreira"
                required
                style={inputStyle}
                onFocus={handleFocus}
                onBlur={handleBlur}
              />
            </div>

            <div>
              <label htmlFor="email" style={labelStyle}>E-mail</label>
              <input
                id="email"
                type="email"
                autoComplete="email"
                value={form.email}
                onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
                placeholder="voce@exemplo.com"
                required
                style={inputStyle}
                onFocus={handleFocus}
                onBlur={handleBlur}
              />
            </div>

            <div>
              <label htmlFor="password" style={labelStyle}>Senha</label>
              <input
                id="password"
                type="password"
                autoComplete="new-password"
                value={form.password}
                onChange={(e) => setForm((f) => ({ ...f, password: e.target.value }))}
                placeholder="Mínimo 8 caracteres"
                required
                style={inputStyle}
                onFocus={handleFocus}
                onBlur={handleBlur}
              />
            </div>

            <div>
              <label htmlFor="confirm_password" style={labelStyle}>Confirmar senha</label>
              <input
                id="confirm_password"
                type="password"
                autoComplete="new-password"
                value={form.confirm_password}
                onChange={(e) => setForm((f) => ({ ...f, confirm_password: e.target.value }))}
                placeholder="Repita a senha"
                required
                style={inputStyle}
                onFocus={handleFocus}
                onBlur={handleBlur}
              />
            </div>

            {error && (
              <div
                className="rounded-lg px-4 py-3 text-sm"
                style={{ background: '#fde8e5', border: '1px solid #c0392b', color: '#c0392b' }}
              >
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              style={{
                display: 'block',
                width: '100%',
                borderRadius: 8,
                background: loading ? '#5e4a3c' : '#2b1a10',
                color: '#ffffff',
                padding: '11px 16px',
                fontSize: 12,
                fontWeight: 700,
                letterSpacing: '0.1em',
                textTransform: 'uppercase',
                border: 'none',
                cursor: loading ? 'not-allowed' : 'pointer',
                fontFamily: 'Inter, system-ui, sans-serif',
              }}
            >
              {loading ? 'Criando conta...' : 'Criar conta'}
            </button>
          </form>
        </div>

        <p className="mt-6 text-center text-sm" style={{ color: '#9b7b5c' }}>
          Já tem conta?{' '}
          <Link
            to="/login"
            style={{ color: '#c9a435', fontWeight: 600, textDecoration: 'none' }}
            onMouseEnter={(e) => ((e.currentTarget as HTMLAnchorElement).style.textDecoration = 'underline')}
            onMouseLeave={(e) => ((e.currentTarget as HTMLAnchorElement).style.textDecoration = 'none')}
          >
            Entrar
          </Link>
        </p>
      </div>
    </div>
  );
}
