import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { AppLayout } from './layouts/AppLayout';
import { PrivateRoute } from './components/PrivateRoute';
import { Login } from './views/Login';
import { SignUp } from './views/SignUp';
import { ForgotPassword } from './views/ForgotPassword';
import { ResetPassword } from './views/ResetPassword';
import { Dashboard } from './views/Dashboard';
import { Transactions } from './views/Transactions';
import { Accounts } from './views/Accounts';
import { Budgets } from './views/Budgets';
import { Goals } from './views/Goals';
import { Assets } from './views/Assets';
import { Insurance } from './views/Insurance';
import { Reports } from './views/Reports';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: { retry: 1, refetchOnWindowFocus: false },
  },
});

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <Routes>
          {/* Public */}
          <Route path="/login" element={<Login />} />
          <Route path="/signup" element={<SignUp />} />
          <Route path="/forgot-password" element={<ForgotPassword />} />
          <Route path="/reset-password" element={<ResetPassword />} />

          {/* Protected */}
          <Route element={<PrivateRoute />}>
            <Route element={<AppLayout />}>
              <Route index element={<Navigate to="/dashboard" replace />} />
              <Route path="/dashboard" element={<Dashboard />} />
              <Route path="/transactions" element={<Transactions />} />
              <Route path="/accounts" element={<Accounts />} />
              <Route path="/budgets" element={<Budgets />} />
              <Route path="/goals" element={<Goals />} />
              <Route path="/assets" element={<Assets />} />
              <Route path="/insurance" element={<Insurance />} />
              <Route path="/reports" element={<Reports />} />
            </Route>
          </Route>

          <Route path="*" element={<Navigate to="/dashboard" replace />} />
        </Routes>
      </BrowserRouter>
    </QueryClientProvider>
  );
}
