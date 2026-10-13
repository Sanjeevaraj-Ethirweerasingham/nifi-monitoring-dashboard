import { NavLink } from 'react-router-dom';
import { LayoutDashboard, Server, Bell, Activity } from 'lucide-react';

const navItems = [
  { to: '/', label: 'Dashboard', icon: LayoutDashboard, end: true },
  { to: '/instances', label: 'Instances', icon: Server, end: false },
  { to: '/alerts', label: 'Alerts & Events', icon: Bell, end: false },
];

interface Props {
  collapsed: boolean;
}

export function Sidebar({ collapsed }: Props) {
  return (
    <aside
      className={`flex flex-col bg-gray-900 dark:bg-gray-950 border-r border-gray-800 transition-all duration-300 ${
        collapsed ? 'w-16' : 'w-56'
      }`}
    >
      {/* Logo */}
      <div className="flex h-16 items-center gap-3 px-4 border-b border-gray-800">
        <div className="flex-shrink-0 flex h-8 w-8 items-center justify-center rounded-md bg-brand-600">
          <Activity className="h-5 w-5 text-white" />
        </div>
        {!collapsed && (
          <div className="min-w-0">
            <p className="text-sm font-semibold text-white truncate">NiFi Monitor</p>
            <p className="text-xs text-gray-500 truncate">v1.0.0 — Production</p>
          </div>
        )}
      </div>

      {/* Nav */}
      <nav className="flex-1 py-4 space-y-1 px-2">
        {navItems.map(({ to, label, icon: Icon, end }) => (
          <NavLink
            key={to}
            to={to}
            end={end}
            className={({ isActive }) =>
              `flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors ${
                isActive
                  ? 'bg-brand-600 text-white'
                  : 'text-gray-400 hover:bg-gray-800 hover:text-white'
              }`
            }
          >
            <Icon className="h-5 w-5 flex-shrink-0" />
            {!collapsed && <span>{label}</span>}
          </NavLink>
        ))}
      </nav>

      {/* Footer */}
      {!collapsed && (
        <div className="border-t border-gray-800 p-4">
          <p className="text-xs font-medium text-emerald-400 flex items-center gap-1.5">
            <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse"></span>
            Live Monitoring
          </p>
          <p className="text-[11px] text-gray-500 mt-0.5">Auto-polling active</p>
        </div>
      )}
    </aside>
  );
}
