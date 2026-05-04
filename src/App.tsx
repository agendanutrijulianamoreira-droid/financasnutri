import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { AppLayout } from './layouts/AppLayout';
import { PrivateRoute } from './components/PrivateRoute';
import { Login } from './views/Login';
import { Dashboard } from './views/Dashboard';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
});

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<Login />} />

          <Route element={<PrivateRoute />}>
            <Route element={<AppLayout />}>
              <Route index element={<Navigate to="/dashboard" replace />} />
              <Route path="/dashboard" element={<Dashboard />} />
              {/* Remaining views – to be implemented in Phase 2 */}
              <Route path="/transactions" element={<ComingSoon title="Lançamentos" />} />
              <Route path="/accounts" element={<ComingSoon title="Contas" />} />
              <Route path="/budgets" element={<ComingSoon title="Orçamentos" />} />
              <Route path="/goals" element={<ComingSoon title="Metas" />} />
              <Route path="/assets" element={<ComingSoon title="Patrimônio" />} />
              <Route path="/insurance" element={<ComingSoon title="Seguros" />} />
              <Route path="/reports" element={<ComingSoon title="Relatórios" />} />
            </Route>
          </Route>

          <Route path="*" element={<Navigate to="/dashboard" replace />} />
        </Routes>
      </BrowserRouter>
    </QueryClientProvider>
  );
}

function ComingSoon({ title }: { title: string }) {
  return (
    <div className="flex h-64 flex-col items-center justify-center gap-2">
      <h2 className="text-xl font-semibold text-neutral-200">{title}</h2>
      <p className="text-sm text-neutral-500">Em desenvolvimento — Fase 2</p>
    </div>
  );
}
