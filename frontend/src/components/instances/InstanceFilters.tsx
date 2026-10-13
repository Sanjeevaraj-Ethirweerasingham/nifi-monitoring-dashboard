import { Search, X } from 'lucide-react';
import type { InstanceFilters } from '../../types';

const ENVIRONMENTS = [
  { value: 'production', label: 'Production' },
  { value: 'uat', label: 'UAT' },
  { value: 'development', label: 'Development' },
];
const STATUSES = ['', 'healthy', 'warning', 'critical', 'unreachable'];


interface Props {
  filters: Partial<InstanceFilters>;
  onChange: (f: Partial<InstanceFilters>) => void;
}

export function InstanceFiltersBar({ filters, onChange }: Props) {
  const hasFilters = filters.search || filters.environment || filters.status;

  return (
    <div className="flex flex-wrap gap-3 items-center">
      {/* Search */}
      <div className="relative flex-1 min-w-[200px] max-w-sm">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
        <input
          type="text"
          placeholder="Search instances..."
          value={filters.search ?? ''}
          onChange={(e) => onChange({ ...filters, search: e.target.value })}
          className="w-full pl-9 pr-3 py-2 text-sm rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-brand-500"
        />
      </div>

      {/* Environment */}
      <select
        value={filters.environment ?? ''}
        onChange={(e) => onChange({ ...filters, environment: e.target.value })}
        className="py-2 px-3 text-sm rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-brand-500"
      >
        <option value="">All Environments</option>
        {ENVIRONMENTS.map((env) => (
          <option key={env.value} value={env.value}>{env.label}</option>
        ))}
      </select>


      {/* Status */}
      <select
        value={filters.status ?? ''}
        onChange={(e) => onChange({ ...filters, status: e.target.value })}
        className="py-2 px-3 text-sm rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-brand-500"
      >
        <option value="">All Statuses</option>
        {STATUSES.filter(Boolean).map((s) => (
          <option key={s} value={s}>{s.charAt(0).toUpperCase() + s.slice(1)}</option>
        ))}
      </select>

      {/* Clear */}
      {hasFilters && (
        <button
          onClick={() => onChange({ search: '', environment: '', status: '', sort_by: filters.sort_by, sort_dir: filters.sort_dir })}
          className="flex items-center gap-1.5 text-sm text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 transition-colors"
        >
          <X className="h-4 w-4" /> Clear filters
        </button>
      )}
    </div>
  );
}
