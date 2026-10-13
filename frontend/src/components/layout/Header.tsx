import { Sun, Moon, PanelLeftClose, PanelLeftOpen, RefreshCw } from 'lucide-react';
import { useQueryClient } from '@tanstack/react-query';

interface Props {
  theme: 'light' | 'dark';
  onThemeToggle: () => void;
  sidebarCollapsed: boolean;
  onSidebarToggle: () => void;
  title: string;
}

export function Header({ theme, onThemeToggle, sidebarCollapsed, onSidebarToggle, title }: Props) {
  const qc = useQueryClient();

  const handleRefresh = () => {
    qc.invalidateQueries();
  };

  return (
    <header className="flex h-16 items-center gap-4 border-b border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 px-6">
      <button
        onClick={onSidebarToggle}
        className="rounded-md p-1.5 text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 hover:text-gray-600 dark:hover:text-gray-200 transition-colors"
        title={sidebarCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
      >
        {sidebarCollapsed ? <PanelLeftOpen className="h-5 w-5" /> : <PanelLeftClose className="h-5 w-5" />}
      </button>

      <h1 className="flex-1 text-lg font-semibold text-gray-900 dark:text-white">{title}</h1>

      <button
        onClick={handleRefresh}
        className="rounded-md p-1.5 text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 hover:text-gray-600 dark:hover:text-gray-200 transition-colors"
        title="Refresh data"
      >
        <RefreshCw className="h-5 w-5" />
      </button>

      <button
        onClick={onThemeToggle}
        className="rounded-md p-1.5 text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 hover:text-gray-600 dark:hover:text-gray-200 transition-colors"
        title={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
      >
        {theme === 'dark' ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
      </button>
    </header>
  );
}
