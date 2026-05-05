import { NavLink } from 'react-router-dom';
import { useAppStore } from '../store/useAppStore';
import { useAuth } from '../hooks/useAuth';

interface NavItem {
  to: string;
  label: string;
  icon: string;
}

const NAV_ITEMS: NavItem[] = [
  { to: '/dashboard', label: 'Dashboard', icon: '⬡' },
  { to: '/transactions', label: 'Lançamentos', icon: '↕' },
  { to: '/accounts', label: 'Contas', icon: '◫' },
  { to: '/budgets', label: 'Orçamentos', icon: '◎' },
  { to: '/goals', label: 'Metas', icon: '◈' },
  { to: '/assets', label: 'Patrimônio', icon: '◆' },
  { to: '/insurance', label: 'Seguros', icon: '◉' },
  { to: '/reports', label: 'Relatórios', icon: '▤' },
  { to: '/tools', label: 'Ferramentas', icon: '⊕' },
  { to: '/settings', label: 'Configurações', icon: '◧' },
];

export function Sidebar() {
  const { sidebarOpen, toggleSidebar } = useAppStore();
  const { signOut, user } = useAuth();

  return (
    <aside
      className={[
        'fixed left-0 top-0 z-40 flex h-screen flex-col border-r border-neutral-800 bg-neutral-900 transition-all duration-300',
        sidebarOpen ? 'w-64' : 'w-16',
      ].join(' ')}
    >
      {/* Logo */}
      <div className="flex h-16 items-center justify-between border-b border-neutral-800 px-4">
        {sidebarOpen && (
          <span className="text-sm font-semibold tracking-wide text-brand-400">
            Rainha das Finanças
          </span>
        )}
        <button
          onClick={toggleSidebar}
          className="ml-auto rounded p-1.5 text-neutral-400 hover:bg-neutral-800 hover:text-neutral-100"
          aria-label="Toggle sidebar"
        >
          {sidebarOpen ? '←' : '→'}
        </button>
      </div>

      {/* Nav */}
      <nav className="flex-1 overflow-y-auto py-4">
        <ul className="space-y-1 px-2">
          {NAV_ITEMS.map((item) => (
            <li key={item.to}>
              <NavLink
                to={item.to}
                className={({ isActive }) =>
                  [
                    'flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm transition-colors',
                    isActive
                      ? 'bg-brand-600/20 text-brand-400'
                      : 'text-neutral-400 hover:bg-neutral-800 hover:text-neutral-100',
                  ].join(' ')
                }
              >
                <span className="text-base">{item.icon}</span>
                {sidebarOpen && <span>{item.label}</span>}
              </NavLink>
            </li>
          ))}
        </ul>
      </nav>

      {/* User */}
      <div className="border-t border-neutral-800 p-3">
        {sidebarOpen ? (
          <div className="flex items-center gap-3">
            <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-brand-700 text-xs font-bold text-white">
              {user?.email?.[0]?.toUpperCase() ?? 'U'}
            </div>
            <div className="flex-1 overflow-hidden">
              <p className="truncate text-xs font-medium text-neutral-200">{user?.email}</p>
            </div>
            <button
              onClick={() => void signOut()}
              className="text-xs text-neutral-500 hover:text-neutral-300"
              title="Sair"
            >
              ⎋
            </button>
          </div>
        ) : (
          <button
            onClick={() => void signOut()}
            className="flex w-full justify-center rounded p-2 text-neutral-500 hover:bg-neutral-800 hover:text-neutral-300"
            title="Sair"
          >
            ⎋
          </button>
        )}
      </div>
    </aside>
  );
}
