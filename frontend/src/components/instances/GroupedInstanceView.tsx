import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Server, ChevronDown, ChevronRight,
  Play, Square, AlertOctagon, Clock, Edit2, ExternalLink,
  Layers, Database
} from 'lucide-react';
import { StatusBadge } from '../common/StatusBadge';
import { EditInstanceModal } from './EditInstanceModal';
import type { NifiInstance } from '../../types';

function formatBytes(bytes: number): string {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${(bytes / Math.pow(k, i)).toFixed(1)} ${sizes[i]}`;
}


interface Props {
  instances: NifiInstance[];
}

const ENV_ORDER = ['production', 'uat', 'development'];

const ENV_LABELS: Record<string, string> = {
  production: 'Production',
  uat: 'UAT',
  development: 'Development',
};

const ENV_BADGE_COLORS: Record<string, string> = {
  production: 'bg-purple-100 text-purple-800 dark:bg-purple-900/40 dark:text-purple-300 border-purple-200 dark:border-purple-800',
  uat: 'bg-teal-100 text-teal-800 dark:bg-teal-900/40 dark:text-teal-300 border-teal-200 dark:border-teal-800',
  development: 'bg-green-100 text-green-800 dark:bg-green-900/40 dark:text-green-300 border-green-200 dark:border-green-800',
};


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

// Function to extract Project / System Group (e.g., "HMG", "Core", "Billing")
function getSystemPrefix(name: string): string {
  const parts = name.trim().split(/\s+|_|-/);
  return parts[0].toUpperCase();
}

export function GroupedInstanceView({ instances }: Props) {
  const navigate = useNavigate();
  const [editingInstance, setEditingInstance] = useState<NifiInstance | null>(null);
  const [collapsedGroups, setCollapsedGroups] = useState<Record<string, boolean>>({});

  // Group by System (e.g. HMG)
  const systemGroups: Record<string, NifiInstance[]> = {};
  instances.forEach((inst) => {
    const sys = getSystemPrefix(inst.name);
    if (!systemGroups[sys]) systemGroups[sys] = [];
    systemGroups[sys].push(inst);
  });

  const toggleGroup = (groupKey: string) => {
    setCollapsedGroups((prev) => ({ ...prev, [groupKey]: !prev[groupKey] }));
  };

  if (instances.length === 0) {
    return (
      <div className="rounded-xl border border-dashed border-gray-300 dark:border-gray-700 p-12 text-center text-gray-500">
        No NiFi instances match your current filters.
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <EditInstanceModal
        instance={editingInstance}
        isOpen={editingInstance !== null}
        onClose={() => setEditingInstance(null)}
      />

      {Object.entries(systemGroups).map(([systemName, sysInstances]) => {
        const isSysCollapsed = collapsedGroups[`sys_${systemName}`];

        // Summary counts for this system box
        const healthyCount = sysInstances.filter((i) => i.status === 'healthy').length;
        const warnCount = sysInstances.filter((i) => i.status === 'warning').length;
        const critCount = sysInstances.filter((i) => i.status === 'critical').length;
        const totalRunning = sysInstances.reduce((acc, i) => acc + (i.process_groups_running || 0), 0);
        const totalStopped = sysInstances.reduce((acc, i) => acc + (i.process_groups_stopped || 0), 0);

        // Sort instances by environment order, then by name
        const sortedInstances = [...sysInstances].sort((a, b) => {
          const envA = ENV_ORDER.indexOf(a.environment.toLowerCase());
          const envB = ENV_ORDER.indexOf(b.environment.toLowerCase());
          const envDiff = (envA === -1 ? 99 : envA) - (envB === -1 ? 99 : envB);
          if (envDiff !== 0) return envDiff;
          return a.name.localeCompare(b.name);
        });

        return (
          <div
            key={systemName}
            className="rounded-2xl border border-gray-200 dark:border-gray-700/80 bg-white dark:bg-gray-800 shadow-sm overflow-hidden"
          >
            {/* System Box Header */}
            <div
              onClick={() => toggleGroup(`sys_${systemName}`)}
              className="flex flex-wrap items-center justify-between gap-4 px-6 py-4 bg-gray-50/80 dark:bg-gray-800/80 border-b border-gray-200 dark:border-gray-700 cursor-pointer hover:bg-gray-100/60 dark:hover:bg-gray-700/40 transition-colors"
            >
              <div className="flex items-center gap-3">
                <button className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200">
                  {isSysCollapsed ? <ChevronRight className="h-5 w-5" /> : <ChevronDown className="h-5 w-5" />}
                </button>
                <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-brand-600/10 text-brand-600 dark:bg-brand-500/20 dark:text-brand-400">
                  <Server className="h-5 w-5" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h2 className="text-lg font-bold text-gray-900 dark:text-white tracking-tight">
                      {systemName} Clusters
                    </h2>
                    <span className="rounded-full bg-gray-200 dark:bg-gray-700 px-2.5 py-0.5 text-xs font-semibold text-gray-700 dark:text-gray-300">
                      {sysInstances.length} {sysInstances.length === 1 ? 'instance' : 'instances'}
                    </span>
                  </div>
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    Aggregated: {totalRunning} Running PGs &middot; {totalStopped} Stopped PGs
                  </p>
                </div>
              </div>

              {/* Status Chips */}
              <div className="flex items-center gap-2 text-xs">
                {healthyCount > 0 && (
                  <span className="px-2.5 py-1 rounded-md bg-emerald-100 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 font-medium">
                    {healthyCount} Healthy
                  </span>
                )}
                {warnCount > 0 && (
                  <span className="px-2.5 py-1 rounded-md bg-amber-100 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300 font-medium">
                    {warnCount} Warning
                  </span>
                )}
                {critCount > 0 && (
                  <span className="px-2.5 py-1 rounded-md bg-red-100 dark:bg-red-950/60 text-red-800 dark:text-red-300 font-medium">
                    {critCount} Critical
                  </span>
                )}
              </div>
            </div>

            {/* System Box Content — Row by Row list of NiFis */}
            {!isSysCollapsed && (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-gray-200 dark:border-gray-700 bg-gray-50/50 dark:bg-gray-800/40 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      <th className="px-5 py-3">Instance Name</th>
                      <th className="px-4 py-3">Environment</th>
                      <th className="px-4 py-3">Hostname</th>
                      <th className="px-4 py-3">Version</th>
                      <th className="px-4 py-3">Status</th>
                      <th className="px-4 py-3 text-center">Queued Files</th>
                      <th className="px-4 py-3 text-center">Queued Size</th>
                      <th className="px-4 py-3 text-center">Running PGs</th>
                      <th className="px-4 py-3 text-center">Stopped PGs</th>
                      <th className="px-4 py-3 text-center">Invalid</th>
                      <th className="px-4 py-3">Response Time</th>
                      <th className="px-4 py-3">Last Checked</th>
                      <th className="px-4 py-3 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100 dark:divide-gray-700/60">
                    {sortedInstances.map((inst) => {
                      const envKey = inst.environment.toLowerCase();
                      const envBadge = ENV_BADGE_COLORS[envKey] || 'bg-gray-100 text-gray-700';

                      return (
                        <tr
                          key={inst.id}
                          onClick={() => navigate(`/instances/${inst.id}`)}
                          className="cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700/40 transition-colors"
                        >
                          {/* Name */}
                          <td className="px-5 py-3.5 font-medium text-gray-900 dark:text-white whitespace-nowrap">
                            <span className="flex items-center gap-2">
                              <span className="hover:text-brand-500 transition-colors">{inst.name}</span>
                              <ExternalLink className="h-3 w-3 text-gray-300 dark:text-gray-600" />
                            </span>
                          </td>

                          {/* Environment Layer Tag */}
                          <td className="px-4 py-3.5 whitespace-nowrap">
                            <span className={`inline-flex items-center rounded-md px-2 py-0.5 text-xs font-semibold border ${envBadge}`}>
                              {ENV_LABELS[envKey] || inst.environment}
                            </span>
                          </td>

                          {/* Hostname */}
                          <td className="px-4 py-3.5 text-gray-500 dark:text-gray-400 font-mono text-xs whitespace-nowrap">
                            {inst.hostname}:{inst.port}
                          </td>

                          {/* Version */}
                          <td className="px-4 py-3.5 text-gray-500 dark:text-gray-400 whitespace-nowrap font-mono text-xs">
                            v{inst.nifi_version}
                          </td>

                          {/* Status */}
                          <td className="px-4 py-3.5 whitespace-nowrap">
                            <StatusBadge status={inst.status} />
                          </td>

                          {/* Queued Files */}
                          <td className="px-4 py-3.5 text-center whitespace-nowrap">
                            <span className={`inline-flex items-center gap-1 font-semibold text-xs ${
                              inst.queued_flowfiles > 100
                                ? 'text-red-600 dark:text-red-400 font-bold'
                                : inst.queued_flowfiles > 20
                                ? 'text-amber-600 dark:text-amber-400 font-medium'
                                : 'text-blue-600 dark:text-blue-400'
                            }`}>
                              <Layers className="h-3 w-3" />
                              {inst.queued_flowfiles.toLocaleString()}
                            </span>
                          </td>

                          {/* Queued Size */}
                          <td className="px-4 py-3.5 text-center whitespace-nowrap">
                            <span className={`inline-flex items-center gap-1 font-semibold text-xs ${
                              inst.bytes_queued > 500 * 1024 * 1024
                                ? 'text-red-600 dark:text-red-400 font-bold'
                                : inst.bytes_queued > 200 * 1024 * 1024
                                ? 'text-amber-600 dark:text-amber-400 font-medium'
                                : 'text-purple-600 dark:text-purple-400'
                            }`}>
                              <Database className="h-3 w-3" />
                              {formatBytes(inst.bytes_queued)}
                            </span>
                          </td>


                          {/* Running PGs */}
                          <td className="px-4 py-3.5 text-center whitespace-nowrap">
                            <span className="inline-flex items-center gap-1 font-semibold text-emerald-600 dark:text-emerald-400">
                              <Play className="h-3 w-3" />
                              {inst.process_groups_running}
                            </span>
                          </td>

                          {/* Stopped PGs */}
                          <td className="px-4 py-3.5 text-center whitespace-nowrap">
                            <span className={`inline-flex items-center gap-1 font-semibold ${
                              inst.process_groups_stopped > 0 ? 'text-amber-600 dark:text-amber-400' : 'text-gray-400'
                            }`}>
                              <Square className="h-3 w-3" />
                              {inst.process_groups_stopped}
                            </span>
                          </td>

                          {/* Invalid Components */}
                          <td className="px-4 py-3.5 text-center whitespace-nowrap">
                            <span className={`inline-flex items-center gap-1 font-semibold ${
                              inst.invalid_components > 0 ? 'text-red-600 dark:text-red-400' : 'text-gray-400'
                            }`}>
                              <AlertOctagon className="h-3 w-3" />
                              {inst.invalid_components}
                            </span>
                          </td>

                          {/* Response Time */}
                          <td className="px-4 py-3.5 whitespace-nowrap">
                            <span className={`font-mono text-xs ${
                              inst.response_time_ms === null ? 'text-gray-400' :
                              inst.response_time_ms > 2000 ? 'text-red-500 font-semibold' :
                              inst.response_time_ms > 500 ? 'text-amber-500' :
                              'text-emerald-500'
                            }`}>
                              {formatResponseTime(inst.response_time_ms)}
                            </span>
                          </td>

                          {/* Last Checked */}
                          <td className="px-4 py-3.5 text-gray-400 dark:text-gray-500 text-xs whitespace-nowrap">
                            <span className="inline-flex items-center gap-1">
                              <Clock className="h-3 w-3" />
                              {formatLastChecked(inst.last_checked)}
                            </span>
                          </td>

                          {/* Actions */}
                          <td className="px-4 py-3.5 text-right whitespace-nowrap">
                            <div className="flex items-center justify-end gap-2" onClick={(e) => e.stopPropagation()}>
                              <button
                                onClick={() => setEditingInstance(inst)}
                                className="p-1.5 rounded-md text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                                title="Edit instance"
                              >
                                <Edit2 className="h-3.5 w-3.5" />
                              </button>
                              <a
                                href={`http://${inst.hostname}:${inst.port}/nifi/`}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="p-1.5 rounded-md text-gray-400 hover:text-brand-500 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                                title="Open in NiFi Web UI"
                              >
                                <ExternalLink className="h-3.5 w-3.5" />
                              </a>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
