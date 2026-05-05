import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { parseSupabaseError } from '../lib/errors';

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
    <div className="flex min-h-screen items-center justify-center bg-neutral-950 px-4">
      <div className="w-full max-w-sm">
        <div className="mb-8 text-center">
          <h1 className="text-2xl font-semibold text-neutral-100">Recuperar senha</h1>
          <p className="mt-1 text-sm text-neutral-500">
            Informe seu e-mail e enviaremos um link de redefinição.
          </p>
        </div>

        {sent ? (
          <div className="rounded-xl border border-green-800 bg-green-950/40 p-5 text-center">
            <p className="text-sm font-medium text-green-400">E-mail enviado!</p>
            <p className="mt-1 text-sm text-neutral-500">
              Verifique sua caixa de entrada e siga o link para redefinir sua senha.
            </p>
          </div>
        ) : (
          <form onSubmit={(e) => void handleSubmit(e)} className="space-y-4">
            <div>
              <label htmlFor="email" className="block text-xs font-medium text-neutral-400 mb-1">
                E-mail cadastrado
              </label>
              <input
                id="email"
                type="email"
                autoComplete="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="block w-full rounded-lg border border-neutral-700 bg-neutral-800 px-4 py-2.5 text-sm text-neutral-100 placeholder-neutral-600 focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500"
                placeholder="voce@exemplo.com"
                required
              />
            </div>

            {error && (
              <p className="rounded-lg border border-red-800 bg-red-950 px-4 py-2 text-sm text-red-400">
                {error}
              </p>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full rounded-lg bg-brand-600 px-4 py-2.5 text-sm font-medium text-white transition hover:bg-brand-700 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {loading ? 'Enviando...' : 'Enviar link'}
            </button>
          </form>
        )}

        <p className="mt-6 text-center text-sm text-neutral-600">
          <Link to="/login" className="text-brand-400 hover:underline">
            ← Voltar para o login
          </Link>
        </p>
      </div>
    </div>
  );
}
