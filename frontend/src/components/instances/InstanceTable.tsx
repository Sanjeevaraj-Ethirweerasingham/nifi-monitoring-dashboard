import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowUpDown, ArrowUp, ArrowDown, ExternalLink, Edit2 } from 'lucide-react';
import { StatusBadge } from '../common/StatusBadge';
import { EditInstanceModal } from './EditInstanceModal';
import type { NifiInstance, InstanceFilters } from '../../types';

function formatBytes(bytes: number): string {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${(bytes / Math.pow(k, i)).toFixed(1)} ${sizes[i]}`;
}

function formatResponseTime(ms: number | null): string {
  if (ms === null) return '—';
  if (ms < 1000) return `${ms.toFixed(0)}ms`;
  return `${(ms / 1000).toFixed(1)}s`;
}

function formatLastChecked(ts: string | null): string {
  if (!ts) return 'Never';
  const d = new Date(ts);
  const now = new Date();
  const diffMs = now.getTime() - d.getTime();
  const diffMin = Math.floor(diffMs / 60000);
  if (diffMin < 1) return 'Just now';
  if (diffMin < 60) return `${diffMin}m ago`;
  const diffHr = Math.floor(diffMin / 60);
  if (diffHr < 24) return `${diffHr}h ago`;
  return `${Math.floor(diffHr / 24)}d ago`;
}

const ENV_LABELS: Record<string, string> = {
  production: 'Production',
  uat: 'UAT',
  development: 'Development',
};

const ENV_COLORS: Record<string, string> = {
  production: 'bg-purple-100 text-purple-800 dark:bg-purple-900/40 dark:text-purple-300',
  uat: 'bg-teal-100 text-teal-800 dark:bg-teal-900/40 dark:text-teal-300',
  development: 'bg-green-100 text-green-800 dark:bg-green-900/40 dark:text-green-300',
};


interface Column {
  key: string;
  label: string;
  sortable?: boolean;
}

const COLUMNS: Column[] = [
  { key: 'name', label: 'Instance Name', sortable: true },
  { key: 'environment', label: 'Environment', sortable: true },
  { key: 'hostname', label: 'Hostname', sortable: false },
  { key: 'nifi_version', label: 'Version', sortable: true },
  { key: 'status', label: 'Status', sortable: true },
  { key: 'process_groups_running', label: 'Running PGs', sortable: true },
  { key: 'process_groups_stopped', label: 'Stopped PGs', sortable: true },
  { key: 'invalid_components', label: 'Invalid', sortable: true },
  { key: 'response_time_ms', label: 'Response Time', sortable: true },
  { key: 'last_checked', label: 'Last Checked', sortable: false },
];

interface Props {
  instances: NifiInstance[];
  total: number;
  filters: Partial<InstanceFilters>;
  onSortChange: (col: string) => void;
}

export function InstanceTable({ instances, total, filters, onSortChange }: Props) {
  const navigate = useNavigate();
  const [editingInstance, setEditingInstance] = useState<NifiInstance | null>(null);

  const SortIcon = ({ col }: { col: string }) => {
    if (!filters.sort_by || filters.sort_by !== col) return <ArrowUpDown className="h-3.5 w-3.5 text-gray-400" />;
    return filters.sort_dir === 'asc' ? <ArrowUp className="h-3.5 w-3.5 text-brand-500" /> : <ArrowDown className="h-3.5 w-3.5 text-brand-500" />;
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm overflow-hidden">
      <EditInstanceModal
        instance={editingInstance}
        isOpen={editingInstance !== null}
        onClose={() => setEditingInstance(null)}
      />
      <div className="px-5 py-3.5 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between">
        <p className="text-sm font-medium text-gray-700 dark:text-gray-300">
          {total} instance{total !== 1 ? 's' : ''}
        </p>
        <p className="text-xs text-gray-400">Click any row for details</p>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900/50">
              {COLUMNS.map((col) => (
                <th
                  key={col.key}
                  className={`px-4 py-3 text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider whitespace-nowrap ${
                    col.sortable ? 'cursor-pointer hover:text-gray-700 dark:hover:text-gray-200 select-none' : ''
                  }`}
                  onClick={() => col.sortable && onSortChange(col.key)}
                >
                  <span className="flex items-center gap-1.5">
                    {col.label}
                    {col.sortable && <SortIcon col={col.key} />}
                  </span>
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100 dark:divide-gray-700/50">
            {instances.length === 0 ? (
              <tr>
                <td colSpan={COLUMNS.length} className="px-4 py-12 text-center text-gray-400">
                  No instances found matching your filters.
                </td>
              </tr>
            ) : (
              instances.map((inst) => (
                <tr
                  key={inst.id}
                  onClick={() => navigate(`/instances/${inst.id}`)}
                  className="cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors"
                >
                  <td className="px-4 py-3 font-medium text-gray-900 dark:text-white whitespace-nowrap">
                    <span className="flex items-center gap-2">
                      <span className="hover:text-brand-500 transition-colors">{inst.name}</span>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setEditingInstance(inst);
                        }}
                        className="p-1 rounded text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700"
                        title="Edit instance"
                      >
                        <Edit2 className="h-3 w-3" />
                      </button>
                      <ExternalLink className="h-3 w-3 text-gray-300 dark:text-gray-600" />
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <span className={`inline-flex rounded-md px-2 py-0.5 text-xs font-medium ${ENV_COLORS[inst.environment] ?? 'bg-gray-100 text-gray-700'}`}>
                      {ENV_LABELS[inst.environment] ?? inst.environment}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-gray-500 dark:text-gray-400 font-mono text-xs whitespace-nowrap">{inst.hostname}</td>
                  <td className="px-4 py-3 text-gray-500 dark:text-gray-400 whitespace-nowrap">v{inst.nifi_version}</td>
                  <td className="px-4 py-3"><StatusBadge status={inst.status} /></td>
                  <td className="px-4 py-3 text-center">
                    <span className="font-medium text-emerald-600 dark:text-emerald-400">{inst.process_groups_running}</span>
                  </td>
                  <td className="px-4 py-3 text-center">
                    <span className={`font-medium ${inst.process_groups_stopped > 0 ? 'text-amber-600 dark:text-amber-400' : 'text-gray-400'}`}>
                      {inst.process_groups_stopped}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-center">
                    <span className={`font-medium ${inst.invalid_components > 0 ? 'text-red-600 dark:text-red-400' : 'text-gray-400'}`}>
                      {inst.invalid_components}
                    </span>
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap">
                    <span className={`font-mono text-xs ${
                      inst.response_time_ms === null ? 'text-gray-400' :
                      inst.response_time_ms > 2000 ? 'text-red-500 font-semibold' :
                      inst.response_time_ms > 500 ? 'text-amber-500' :
                      'text-emerald-500'
                    }`}>
                      {formatResponseTime(inst.response_time_ms)}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-gray-400 dark:text-gray-500 text-xs whitespace-nowrap">
                    {formatLastChecked(inst.last_checked)}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
