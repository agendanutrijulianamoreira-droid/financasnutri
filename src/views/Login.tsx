import { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { loginSchema } from '../lib/validations';
import { parseSupabaseError } from '../lib/errors';

export function Login() {
  const navigate = useNavigate();
  const location = useLocation();
  const { signIn } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const from = (location.state as { from?: { pathname: string } })?.from?.pathname ?? '/dashboard';

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');

    const result = loginSchema.safeParse({ email, password });
    if (!result.success) {
      setError(result.error.errors[0].message);
      return;
    }

    setLoading(true);
    try {
      await signIn(result.data);
      navigate(from, { replace: true });
    } catch (err) {
      setError(parseSupabaseError(err).message);
    } finally {
      setLoading(false);
    }
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
            Entre na sua conta
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
            {/* Email */}
            <div>
              <label
                htmlFor="email"
                style={{
                  display: 'block',
                  marginBottom: 6,
                  fontSize: 11,
                  fontWeight: 700,
                  letterSpacing: '0.07em',
                  textTransform: 'uppercase',
                  color: '#7d6250',
                }}
              >
                E-mail
              </label>
              <input
                id="email"
                type="email"
                autoComplete="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="voce@exemplo.com"
                style={{
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
                }}
                onFocus={(e) => {
                  e.currentTarget.style.borderColor = '#c9a435';
                  e.currentTarget.style.boxShadow = '0 0 0 3px rgba(201,164,53,0.12)';
                }}
                onBlur={(e) => {
                  e.currentTarget.style.borderColor = '#e0d3c0';
                  e.currentTarget.style.boxShadow = 'none';
                }}
              />
            </div>

            {/* Password */}
            <div>
              <div className="mb-1.5 flex items-center justify-between">
                <label
                  htmlFor="password"
                  style={{
                    fontSize: 11,
                    fontWeight: 700,
                    letterSpacing: '0.07em',
                    textTransform: 'uppercase',
                    color: '#7d6250',
                  }}
                >
                  Senha
                </label>
                <Link
                  to="/forgot-password"
                  style={{ fontSize: 12, color: '#c9a435', textDecoration: 'none' }}
                  onMouseEnter={(e) => ((e.currentTarget as HTMLAnchorElement).style.textDecoration = 'underline')}
                  onMouseLeave={(e) => ((e.currentTarget as HTMLAnchorElement).style.textDecoration = 'none')}
                >
                  Esqueci a senha
                </Link>
              </div>
              <input
                id="password"
                type="password"
                autoComplete="current-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                style={{
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
                }}
                onFocus={(e) => {
                  e.currentTarget.style.borderColor = '#c9a435';
                  e.currentTarget.style.boxShadow = '0 0 0 3px rgba(201,164,53,0.12)';
                }}
                onBlur={(e) => {
                  e.currentTarget.style.borderColor = '#e0d3c0';
                  e.currentTarget.style.boxShadow = 'none';
                }}
              />
            </div>

            {/* Error */}
            {error && (
              <div
                className="rounded-lg px-4 py-3 text-sm"
                style={{
                  background: '#fde8e5',
                  border: '1px solid #c0392b',
                  color: '#c0392b',
                }}
              >
                {error}
              </div>
            )}

            {/* Submit */}
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
                transition: 'background 0.15s',
                fontFamily: 'Inter, system-ui, sans-serif',
              }}
              onMouseEnter={(e) => {
                if (!loading) (e.currentTarget as HTMLButtonElement).style.background = '#3d2e22';
              }}
              onMouseLeave={(e) => {
                if (!loading) (e.currentTarget as HTMLButtonElement).style.background = '#2b1a10';
              }}
            >
              {loading ? 'Entrando...' : 'Entrar'}
            </button>
          </form>
        </div>

        <p className="mt-6 text-center text-sm" style={{ color: '#9b7b5c' }}>
          Não tem conta?{' '}
          <Link
            to="/signup"
            style={{ color: '#c9a435', fontWeight: 600, textDecoration: 'none' }}
            onMouseEnter={(e) => ((e.currentTarget as HTMLAnchorElement).style.textDecoration = 'underline')}
            onMouseLeave={(e) => ((e.currentTarget as HTMLAnchorElement).style.textDecoration = 'none')}
          >
            Criar conta
          </Link>
        </p>
      </div>
    </div>
  );
}
