import { NavLink } from 'react-router-dom';
import { useAppStore } from '../store/useAppStore';
import { useAuth } from '../hooks/useAuth';

interface NavItem {
  to: string;
  label: string;
  icon: string;
}

const NAV_ITEMS: NavItem[] = [
  { to: '/dashboard',    label: 'Dashboard',      icon: '◈' },
  { to: '/transactions', label: 'Lançamentos',     icon: '↕' },
  { to: '/accounts',     label: 'Contas',          icon: '◫' },
  { to: '/budgets',      label: 'Orçamentos',      icon: '◎' },
  { to: '/goals',        label: 'Metas',           icon: '◆' },
  { to: '/assets',       label: 'Patrimônio',      icon: '◉' },
  { to: '/insurance',    label: 'Seguros',         icon: '⊛' },
  { to: '/reports',      label: 'Relatórios',      icon: '▤' },
  { to: '/tools',        label: 'Ferramentas',     icon: '⊕' },
  { to: '/settings',     label: 'Configurações',   icon: '◧' },
];

export function Sidebar() {
  const { sidebarOpen, toggleSidebar } = useAppStore();
  const { signOut, user } = useAuth();

  const initials = user?.email?.[0]?.toUpperCase() ?? 'R';

  return (
    <aside
      className={[
        'fixed left-0 top-0 z-40 flex h-screen flex-col transition-all duration-300',
        sidebarOpen ? 'w-60' : 'w-[60px]',
      ].join(' ')}
      style={{ background: '#2b1a10' }}
    >
      {/* Logo / brand */}
      <div
        className="flex h-16 items-center justify-between px-4"
        style={{ borderBottom: '1px solid rgba(201,164,53,0.15)' }}
      >
        {sidebarOpen && (
          <div className="flex items-center gap-2 overflow-hidden">
            <span style={{ color: '#c9a435', fontSize: 18, lineHeight: 1 }}>♛</span>
            <span
              style={{
                fontFamily: 'Georgia, serif',
                fontSize: 13,
                fontWeight: 700,
                color: '#e8c96a',
                letterSpacing: '0.04em',
                whiteSpace: 'nowrap',
              }}
            >
              Rainha das Finanças
            </span>
          </div>
        )}
        <button
          onClick={toggleSidebar}
          aria-label="Toggle sidebar"
          style={{
            marginLeft: sidebarOpen ? undefined : 'auto',
            padding: '6px 8px',
            borderRadius: 6,
            color: '#9b7b5c',
            background: 'transparent',
            border: 'none',
            cursor: 'pointer',
            fontSize: 14,
            transition: 'color 0.15s',
          }}
          onMouseEnter={(e) => ((e.currentTarget as HTMLButtonElement).style.color = '#c9a435')}
          onMouseLeave={(e) => ((e.currentTarget as HTMLButtonElement).style.color = '#9b7b5c')}
        >
          {sidebarOpen ? '←' : '→'}
        </button>
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto py-3">
        <ul className="space-y-0.5 px-2">
          {NAV_ITEMS.map((item) => (
            <li key={item.to}>
              <NavLink
                to={item.to}
                className={({ isActive }) => `nav-link${isActive ? ' active' : ''}`}
                title={!sidebarOpen ? item.label : undefined}
              >
                <span className="nav-icon">{item.icon}</span>
                {sidebarOpen && <span>{item.label}</span>}
              </NavLink>
            </li>
          ))}
        </ul>
      </nav>

      {/* User */}
      <div
        className="p-3"
        style={{ borderTop: '1px solid rgba(201,164,53,0.15)' }}
      >
        {sidebarOpen ? (
          <div className="flex items-center gap-3">
            <div
              className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full text-xs font-bold"
              style={{ background: 'rgba(201,164,53,0.2)', color: '#c9a435' }}
            >
              {initials}
            </div>
            <div className="flex-1 min-w-0">
              <p
                className="truncate text-xs font-medium"
                style={{ color: '#ceb99f' }}
              >
                {user?.email}
              </p>
            </div>
            <button
              onClick={() => void signOut()}
              title="Sair"
              style={{
                color: '#7d6250',
                background: 'none',
                border: 'none',
                cursor: 'pointer',
                fontSize: 14,
                padding: '2px 4px',
                borderRadius: 4,
                transition: 'color 0.15s',
              }}
              onMouseEnter={(e) => ((e.currentTarget as HTMLButtonElement).style.color = '#d44c3e')}
              onMouseLeave={(e) => ((e.currentTarget as HTMLButtonElement).style.color = '#7d6250')}
            >
              ⎋
            </button>
          </div>
        ) : (
          <div className="flex justify-center">
            <div
              className="flex h-8 w-8 items-center justify-center rounded-full text-xs font-bold"
              style={{ background: 'rgba(201,164,53,0.2)', color: '#c9a435' }}
            >
              {initials}
            </div>
          </div>
        )}
      </div>
    </aside>
  );
}
