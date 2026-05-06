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
  const { sidebarOpen, toggleSidebar } = useAppStore();

  return (
    <div className="flex h-screen overflow-hidden" style={{ background: '#f4efe4' }}>
      <AlertWatcher />

      {/* Mobile overlay — closes sidebar when tapping outside */}
      {sidebarOpen && (
        <div
          className="sidebar-overlay md:hidden"
          onClick={toggleSidebar}
          aria-hidden="true"
        />
      )}

      <Sidebar />

      <main
        className={[
          'flex-1 overflow-y-auto transition-all duration-300',
          sidebarOpen ? 'md:ml-60' : 'md:ml-[60px]',
          'ml-[60px]',
        ].join(' ')}
      >
        {/* Mobile top bar with hamburger */}
        <div
          className="flex items-center gap-3 px-5 py-3 md:hidden"
          style={{ borderBottom: '1px solid #e0d3c0', background: '#ffffff' }}
        >
          <button className="hamburger-btn" onClick={toggleSidebar} aria-label="Abrir menu">
            ☰
          </button>
          <span
            style={{
              fontFamily: 'Georgia, serif',
              fontSize: 14,
              fontWeight: 700,
              color: '#2b1a10',
            }}
          >
            Rainha das Finanças
          </span>
        </div>

        <div className="min-h-full p-5 md:p-7">
          <Outlet />
        </div>
      </main>
      <Toaster />
    </div>
  );
}
