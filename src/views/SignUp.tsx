import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { signUpSchema } from '../lib/validations';
import { parseSupabaseError } from '../lib/errors';

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
      <div className="flex min-h-screen items-center justify-center bg-neutral-950 px-4">
        <div className="w-full max-w-sm text-center">
          <div className="mb-4 flex justify-center">
            <div className="flex h-14 w-14 items-center justify-center rounded-full bg-green-900/40 text-2xl text-green-400">✓</div>
          </div>
          <h2 className="text-xl font-semibold text-neutral-100">Verifique seu e-mail</h2>
          <p className="mt-2 text-sm text-neutral-500">
            Enviamos um link de confirmação para <strong className="text-neutral-300">{form.email}</strong>.
            Clique no link para ativar sua conta.
          </p>
          <button
            onClick={() => navigate('/login')}
            className="mt-6 text-sm text-brand-400 hover:underline"
          >
            Ir para o login
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-neutral-950 px-4">
      <div className="w-full max-w-sm">
        <div className="mb-8 text-center">
          <h1 className="text-2xl font-semibold text-neutral-100">Rainha das Finanças</h1>
          <p className="mt-1 text-sm text-neutral-500">Crie sua conta gratuitamente</p>
        </div>

        <form onSubmit={(e) => void handleSubmit(e)} className="space-y-4">
          <div>
            <label htmlFor="full_name" className="block text-xs font-medium text-neutral-400 mb-1">
              Nome completo
            </label>
            <input
              id="full_name"
              type="text"
              autoComplete="name"
              value={form.full_name}
              onChange={(e) => setForm((f) => ({ ...f, full_name: e.target.value }))}
              className="block w-full rounded-lg border border-neutral-700 bg-neutral-800 px-4 py-2.5 text-sm text-neutral-100 placeholder-neutral-600 focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500"
              placeholder="Juliana Moreira"
              required
            />
          </div>

          <div>
            <label htmlFor="email" className="block text-xs font-medium text-neutral-400 mb-1">
              E-mail
            </label>
            <input
              id="email"
              type="email"
              autoComplete="email"
              value={form.email}
              onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
              className="block w-full rounded-lg border border-neutral-700 bg-neutral-800 px-4 py-2.5 text-sm text-neutral-100 placeholder-neutral-600 focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500"
              placeholder="voce@exemplo.com"
              required
            />
          </div>

          <div>
            <label htmlFor="password" className="block text-xs font-medium text-neutral-400 mb-1">
              Senha
            </label>
            <input
              id="password"
              type="password"
              autoComplete="new-password"
              value={form.password}
              onChange={(e) => setForm((f) => ({ ...f, password: e.target.value }))}
              className="block w-full rounded-lg border border-neutral-700 bg-neutral-800 px-4 py-2.5 text-sm text-neutral-100 placeholder-neutral-600 focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500"
              placeholder="Mínimo 8 caracteres"
              required
            />
          </div>

          <div>
            <label htmlFor="confirm_password" className="block text-xs font-medium text-neutral-400 mb-1">
              Confirmar senha
            </label>
            <input
              id="confirm_password"
              type="password"
              autoComplete="new-password"
              value={form.confirm_password}
              onChange={(e) => setForm((f) => ({ ...f, confirm_password: e.target.value }))}
              className="block w-full rounded-lg border border-neutral-700 bg-neutral-800 px-4 py-2.5 text-sm text-neutral-100 placeholder-neutral-600 focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500"
              placeholder="Repita a senha"
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
            {loading ? 'Criando conta...' : 'Criar conta'}
          </button>
        </form>

        <p className="mt-6 text-center text-sm text-neutral-600">
          Já tem conta?{' '}
          <Link to="/login" className="text-brand-400 hover:underline">
            Entrar
          </Link>
        </p>
      </div>
    </div>
  );
}
