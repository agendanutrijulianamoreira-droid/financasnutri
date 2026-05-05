import { useEffect, useRef } from 'react';
import { Outlet } from 'react-router-dom';
import { Sidebar } from './Sidebar';
import { Toaster } from '../components/ui/Toaster';
import { useAppStore } from '../store/useAppStore';
import { useFinancialStats } from '../hooks/useFinancialStats';
import { toast } from '../store/useToastStore';

function AlertWatcher() {
  const { activeMonth, activeYear } = useAppStore();
  const { data: stats } = useFinancialStats(activeMonth, activeYear);
  const alertedRef = useRef<Set<string>>(new Set());

  useEffect(() => {
    if (!stats) return;

    if (stats.pjBalanceBelowProLabore && !alertedRef.current.has('pj-low-balance')) {
      alertedRef.current.add('pj-low-balance');
      toast.warning(
        'Saldo PJ insuficiente',
        `O saldo PJ está abaixo do pró-labore de ${stats.proLabore.toLocaleString('pt-BR', {
          style: 'currency',
          currency: 'BRL',
        })}.`,
      );
    }

    if (
      !stats.runway.isAdequate &&
      stats.runway.monthsAnalyzed > 0 &&
      !alertedRef.current.has('emergency-low')
    ) {
      alertedRef.current.add('emergency-low');
      toast.warning(
        'Reserva de emergência incompleta',
        `${stats.runway.coverageMonths.toFixed(1)} de ${stats.runway.targetMonths} meses cobertos.`,
      );
    }
  }, [stats]);

  return null;
}

export function AppLayout() {
  const sidebarOpen = useAppStore((s) => s.sidebarOpen);

  return (
    <div className="flex h-screen overflow-hidden" style={{ background: '#f4efe4' }}>
      <AlertWatcher />
      <Sidebar />
      <main
        className={[
          'flex-1 overflow-y-auto transition-all duration-300',
          sidebarOpen ? 'ml-60' : 'ml-[60px]',
        ].join(' ')}
      >
        <div className="min-h-full p-7">
          <Outlet />
        </div>
      </main>
      <Toaster />
    </div>
  );
}
