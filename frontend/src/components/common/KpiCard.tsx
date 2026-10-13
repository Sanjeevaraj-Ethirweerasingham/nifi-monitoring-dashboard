import type { ReactNode } from 'react';

interface Props {
  title: string;
  value: number | string;
  icon: ReactNode;
  color: string; // Tailwind color classes for the icon bg
  subtitle?: string;
  onClick?: () => void;
}

export function KpiCard({ title, value, icon, color, subtitle, onClick }: Props) {
  return (
    <div
      className={`bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-5 shadow-sm flex items-center gap-4 ${
        onClick ? 'cursor-pointer hover:shadow-md hover:border-brand-300 dark:hover:border-brand-600 transition-all' : ''
      }`}
      onClick={onClick}
    >
      <div className={`flex-shrink-0 rounded-lg p-3 ${color}`}>{icon}</div>
      <div className="min-w-0">
        <p className="text-sm font-medium text-gray-500 dark:text-gray-400 truncate">{title}</p>
        <p className="text-2xl font-bold text-gray-900 dark:text-white mt-0.5">{value}</p>
        {subtitle && <p className="text-xs text-gray-400 dark:text-gray-500 mt-0.5">{subtitle}</p>}
      </div>
    </div>
  );
}
