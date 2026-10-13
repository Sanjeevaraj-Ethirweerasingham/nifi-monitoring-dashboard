import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Server, CheckCircle2, AlertTriangle, XCircle, WifiOff, Bell, Plus, LayoutGrid, Table2, Send } from 'lucide-react';
import { KpiCard } from '../components/common/KpiCard';
import { PageLoader } from '../components/common/LoadingSpinner';
import { InstanceFiltersBar } from '../components/instances/InstanceFilters';
import { InstanceTable } from '../components/instances/InstanceTable';
import { GroupedInstanceView } from '../components/instances/GroupedInstanceView';
import { AddInstanceModal } from '../components/instances/AddInstanceModal';
import { useSummary, useInstances, useNotifyTeams } from '../hooks/useInstances';
import type { InstanceFilters } from '../types';

export function DashboardPage() {
  const navigate = useNavigate();
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [viewMode, setViewMode] = useState<'grouped' | 'table'>('grouped');
  const [teamsFeedback, setTeamsFeedback] = useState<string | null>(null);
  const [filters, setFilters] = useState<Partial<InstanceFilters>>({
    search: '',
    environment: '',
    status: '',
    sort_by: 'name',
    sort_dir: 'asc',
  });

  const { data: summary, isLoading: summaryLoading } = useSummary();
  const { data: paginatedData, isLoading: instancesLoading } = useInstances(filters);
  const notifyTeamsMutation = useNotifyTeams();

  const handleSendTeams = async () => {
    try {
      const res = await notifyTeamsMutation.mutateAsync();
      setTeamsFeedback(`Status sent to Teams! (${res.count} clusters)`);
      setTimeout(() => setTeamsFeedback(null), 4000);
    } catch {
      setTeamsFeedback('Failed to post status to Teams. Verify Webhook URL.');
      setTimeout(() => setTeamsFeedback(null), 4000);
    }
  };

  const handleSortChange = (col: string) => {
    setFilters((prev) => ({
      ...prev,
      sort_by: col,
      sort_dir: prev.sort_by === col && prev.sort_dir === 'asc' ? 'desc' : 'asc',
    }));
  };

  const handleKpiClick = (status: string) => {
    setFilters((prev) => ({ ...prev, status: prev.status === status ? '' : status }));
  };

  return (
    <div className="flex flex-col gap-6 p-6">
      <AddInstanceModal isOpen={isAddModalOpen} onClose={() => setIsAddModalOpen(false)} />

      {teamsFeedback && (
        <div className={`rounded-xl px-4 py-3 text-xs font-semibold border flex items-center justify-between transition-all ${
          teamsFeedback.includes('Failed')
            ? 'bg-red-50 dark:bg-red-950/40 text-red-700 dark:text-red-300 border-red-200 dark:border-red-800'
            : 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-800 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800'
        }`}>
          <span>🔔 {teamsFeedback}</span>
          <button onClick={() => setTeamsFeedback(null)} className="text-gray-400 hover:text-gray-600">×</button>
        </div>
      )}

      {/* KPI Cards */}
      {summaryLoading ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="h-24 bg-gray-100 dark:bg-gray-800 rounded-xl animate-pulse" />
          ))}
        </div>
      ) : summary ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
          <KpiCard
            title="Total Instances"
            value={summary.total}
            icon={<Server className="h-5 w-5 text-blue-600" />}
            color="bg-blue-50 dark:bg-blue-950/50"
            subtitle="monitored"
          />
          <KpiCard
            title="Healthy"
            value={summary.healthy}
            icon={<CheckCircle2 className="h-5 w-5 text-emerald-600" />}
            color="bg-emerald-50 dark:bg-emerald-950/50"
            onClick={() => handleKpiClick('healthy')}
          />
          <KpiCard
            title="Warning"
            value={summary.warning}
            icon={<AlertTriangle className="h-5 w-5 text-amber-600" />}
            color="bg-amber-50 dark:bg-amber-950/50"
            onClick={() => handleKpiClick('warning')}
          />
          <KpiCard
            title="Critical"
            value={summary.critical}
            icon={<XCircle className="h-5 w-5 text-red-600" />}
            color="bg-red-50 dark:bg-red-950/50"
            onClick={() => handleKpiClick('critical')}
          />
          <KpiCard
            title="Unreachable"
            value={summary.unreachable}
            icon={<WifiOff className="h-5 w-5 text-gray-500" />}
            color="bg-gray-100 dark:bg-gray-800"
            onClick={() => handleKpiClick('unreachable')}
          />
          <KpiCard
            title="Open Alerts"
            value={summary.unacknowledged_alerts}
            icon={<Bell className="h-5 w-5 text-orange-600" />}
            color="bg-orange-50 dark:bg-orange-950/50"
            subtitle="unacknowledged"
            onClick={() => navigate('/alerts')}
          />
        </div>
      ) : null}

      {/* Filters + Action Bar */}
      <div className="flex flex-col gap-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex-1 min-w-[280px]">
            <InstanceFiltersBar filters={filters} onChange={setFilters} />
          </div>

          <div className="flex items-center gap-2">
            {/* View Mode Toggle */}
            <div className="flex items-center bg-gray-100 dark:bg-gray-800 p-0.5 rounded-lg border border-gray-200 dark:border-gray-700">
              <button
                onClick={() => setViewMode('grouped')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-colors ${
                  viewMode === 'grouped'
                    ? 'bg-white dark:bg-gray-700 text-gray-900 dark:text-white shadow-xs'
                    : 'text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white'
                }`}
                title="Grouped by System & Environment"
              >
                <LayoutGrid className="h-3.5 w-3.5" />
                Grouped View
              </button>
              <button
                onClick={() => setViewMode('table')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-colors ${
                  viewMode === 'table'
                    ? 'bg-white dark:bg-gray-700 text-gray-900 dark:text-white shadow-xs'
                    : 'text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white'
                }`}
                title="Compact Data Table"
              >
                <Table2 className="h-3.5 w-3.5" />
                Table View
              </button>
            </div>

            <button
              onClick={handleSendTeams}
              disabled={notifyTeamsMutation.isPending}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-indigo-700 dark:text-indigo-300 bg-indigo-50 dark:bg-indigo-950/60 border border-indigo-200 dark:border-indigo-800 hover:bg-indigo-100 dark:hover:bg-indigo-900/60 rounded-lg shadow-xs transition-colors disabled:opacity-50"
              title="Post immediate NiFi status update to Microsoft Teams channel"
            >
              <Send className={`h-3.5 w-3.5 ${notifyTeamsMutation.isPending ? 'animate-pulse' : ''}`} />
              {notifyTeamsMutation.isPending ? 'Sending...' : 'Send to Teams'}
            </button>

            <button
              onClick={() => setIsAddModalOpen(true)}
              className="flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-white bg-brand-600 hover:bg-brand-700 rounded-lg shadow-sm transition-colors"
            >
              <Plus className="h-4 w-4" /> Add Instance
            </button>
          </div>
        </div>

        {instancesLoading ? (
          <PageLoader />
        ) : paginatedData ? (
          viewMode === 'grouped' ? (
            <GroupedInstanceView instances={paginatedData.items} />
          ) : (
            <InstanceTable
              instances={paginatedData.items}
              total={paginatedData.total}
              filters={filters}
              onSortChange={handleSortChange}
            />
          )
        ) : null}
      </div>
    </div>
  );
}
