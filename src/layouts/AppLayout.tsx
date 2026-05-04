import { Outlet } from 'react-router-dom';
import { Sidebar } from './Sidebar';
import { useAppStore } from '../store/useAppStore';

export function AppLayout() {
  const sidebarOpen = useAppStore((s) => s.sidebarOpen);

  return (
    <div className="flex h-screen overflow-hidden bg-neutral-950">
      <Sidebar />
      <main
        className={[
          'flex-1 overflow-y-auto transition-all duration-300',
          sidebarOpen ? 'ml-64' : 'ml-16',
        ].join(' ')}
      >
        <div className="min-h-full p-6">
          <Outlet />
        </div>
      </main>
    </div>
  );
}
