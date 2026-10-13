import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  ArrowLeft, Server, Globe, Tag, Clock, Activity,
  Play, Square, AlertOctagon, Layers, Cpu, Database, RefreshCw, ExternalLink, Edit2
} from 'lucide-react';
import { StatusBadge } from '../components/common/StatusBadge';
import { PageLoader } from '../components/common/LoadingSpinner';
import { EditInstanceModal } from '../components/instances/EditInstanceModal';
import { useInstance, useAcknowledgeAlert, usePollInstance } from '../hooks/useInstances';

function formatBytes(bytes: number): string {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${(bytes / Math.pow(k, i)).toFixed(1)} ${sizes[i]}`;
}

function formatDate(ts: string | null): string {
  if (!ts) return 'Never';
  return new Date(ts).toLocaleString();
}

const ENV_COLORS: Record<string, string> = {
  production: 'bg-purple-100 text-purple-800 dark:bg-purple-900/40 dark:text-purple-300',
  uat: 'bg-teal-100 text-teal-800 dark:bg-teal-900/40 dark:text-teal-300',
  development: 'bg-green-100 text-green-800 dark:bg-green-900/40 dark:text-green-300',
};


const EVENT_COLORS: Record<string, string> = {
  health_check: 'text-blue-500',
  alert_triggered: 'text-red-500',
  connection_lost: 'text-orange-500',
  config_change: 'text-purple-500',
};

export function InstanceDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const { data: instance, isLoading, error } = useInstance(id ? parseInt(id) : null);
  const acknowledge = useAcknowledgeAlert();
  const pollMutation = usePollInstance();

  if (isLoading) return <PageLoader />;
  if (error || !instance) return (
    <div className="p-6 text-center text-gray-500 dark:text-gray-400">
      Instance not found. <button onClick={() => navigate(-1)} className="text-brand-500 underline">Go back</button>
    </div>
  );

  const unackedAlerts = instance.alerts.filter(a => !a.acknowledged);

  return (
    <div className="flex flex-col gap-6 p-6">
      <EditInstanceModal
        instance={instance}
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
      />
      {/* Back + Header */}
      <div>
        <button
          onClick={() => navigate(-1)}
          className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 mb-4 transition-colors"
        >
          <ArrowLeft className="h-4 w-4" /> Back
        </button>

        <div className="flex flex-wrap items-start gap-4 justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-brand-100 dark:bg-brand-900/30">
              <Server className="h-6 w-6 text-brand-600" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl font-bold text-gray-900 dark:text-white">{instance.name}</h1>
                <a
                  href={`http://${instance.hostname}:${instance.port}/nifi/`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-1 text-xs font-semibold text-brand-600 dark:text-brand-400 hover:underline"
                >
                  Open in NiFi <ExternalLink className="h-3 w-3" />
                </a>
              </div>
              <div className="flex items-center gap-2 mt-1">
                <span className={`inline-flex rounded-md px-2 py-0.5 text-xs font-medium ${ENV_COLORS[instance.environment] ?? 'bg-gray-100 text-gray-700'}`}>
                  {instance.environment.toUpperCase()}
                </span>
                <StatusBadge status={instance.status} />
              </div>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={() => setIsEditModalOpen(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium border border-gray-300 dark:border-gray-600 hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-200 transition-colors"
            >
              <Edit2 className="h-3.5 w-3.5" />
              Edit
            </button>
            <button
              onClick={() => pollMutation.mutate(instance.id)}
              disabled={pollMutation.isPending}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-brand-600 hover:bg-brand-700 text-white disabled:opacity-50 transition-colors"
            >
              <RefreshCw className={`h-3.5 w-3.5 ${pollMutation.isPending ? 'animate-spin' : ''}`} />
              {pollMutation.isPending ? 'Polling NiFi...' : 'Poll Now'}
            </button>
            <div className="text-right text-sm text-gray-400">
              <p>Last checked</p>
              <p className="text-gray-600 dark:text-gray-300">{formatDate(instance.last_checked)}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Info Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {[
          { icon: Globe, label: 'Hostname', value: `${instance.hostname}:${instance.port}` },
          { icon: Tag, label: 'NiFi Version', value: `v${instance.nifi_version}` },
          { icon: Clock, label: 'Monitored Since', value: new Date(instance.created_at).toLocaleDateString() },
        ].map(({ icon: Icon, label, value }) => (
          <div key={label} className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-4 flex items-center gap-3">
            <div className="h-9 w-9 rounded-lg bg-gray-100 dark:bg-gray-700 flex items-center justify-center flex-shrink-0">
              <Icon className="h-4 w-4 text-gray-500" />
            </div>
            <div>
              <p className="text-xs text-gray-400">{label}</p>
              <p className="font-medium text-gray-900 dark:text-white font-mono text-sm">{value}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Metrics Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
        {[
          { icon: Play, label: 'Running PGs', value: instance.process_groups_running, color: 'text-emerald-600 dark:text-emerald-400' },
          { icon: Square, label: 'Stopped PGs', value: instance.process_groups_stopped, color: instance.process_groups_stopped > 0 ? 'text-amber-600 dark:text-amber-400' : 'text-gray-400' },
          { icon: AlertOctagon, label: 'Invalid', value: instance.invalid_components, color: instance.invalid_components > 0 ? 'text-red-600 dark:text-red-400' : 'text-gray-400' },
          { icon: Layers, label: 'Queued Files', value: instance.queued_flowfiles.toLocaleString(), color: 'text-blue-600 dark:text-blue-400' },
          { icon: Database, label: 'Queued Size', value: formatBytes(instance.bytes_queued), color: 'text-purple-600 dark:text-purple-400' },
          { icon: Cpu, label: 'Active Threads', value: instance.active_threads, color: 'text-orange-600 dark:text-orange-400' },
        ].map(({ icon: Icon, label, value, color }) => (
          <div key={label} className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-4 text-center">
            <Icon className={`h-5 w-5 mx-auto mb-2 ${color}`} />
            <p className={`text-xl font-bold ${color}`}>{value}</p>
            <p className="text-xs text-gray-400 mt-0.5">{label}</p>
          </div>
        ))}
      </div>

      {/* Alerts */}
      <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700">
        <div className="px-5 py-3.5 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between">
          <h2 className="font-semibold text-gray-900 dark:text-white">Alerts ({instance.alerts.length})</h2>
          {unackedAlerts.length > 0 && (
            <span className="text-xs bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300 px-2 py-0.5 rounded-full">
              {unackedAlerts.length} unacknowledged
            </span>
          )}
        </div>
        {instance.alerts.length === 0 ? (
          <p className="px-5 py-8 text-center text-sm text-gray-400">No alerts for this instance.</p>
        ) : (
          <div className="divide-y divide-gray-100 dark:divide-gray-700/50">
            {instance.alerts.map((alert) => (
              <div key={alert.id} className={`px-5 py-4 flex items-start gap-4 ${alert.acknowledged ? 'opacity-60' : ''}`}>
                <StatusBadge status={alert.severity} />
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-sm text-gray-900 dark:text-white">{alert.title}</p>
                  <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">{alert.message}</p>
                  <p className="text-xs text-gray-400 mt-1">{formatDate(alert.created_at)}</p>
                </div>
                {!alert.acknowledged && (
                  <button
                    onClick={() => acknowledge.mutate(alert.id)}
                    disabled={acknowledge.isPending}
                    className="flex-shrink-0 text-xs text-brand-600 hover:text-brand-800 dark:text-brand-400 hover:underline disabled:opacity-50"
                  >
                    Acknowledge
                  </button>
                )}
                {alert.acknowledged && (
                  <span className="flex-shrink-0 text-xs text-gray-400">Acknowledged</span>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Events */}
      <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700">
        <div className="px-5 py-3.5 border-b border-gray-200 dark:border-gray-700">
          <h2 className="font-semibold text-gray-900 dark:text-white">Monitoring Events ({instance.events.length})</h2>
        </div>
        {instance.events.length === 0 ? (
          <p className="px-5 py-8 text-center text-sm text-gray-400">No events recorded.</p>
        ) : (
          <div className="divide-y divide-gray-100 dark:divide-gray-700/50">
            {instance.events.map((event) => (
              <div key={event.id} className="px-5 py-3 flex items-start gap-3">
                <Activity className={`h-4 w-4 mt-0.5 flex-shrink-0 ${EVENT_COLORS[event.event_type] ?? 'text-gray-400'}`} />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">{event.event_type.replace('_', ' ')}</span>
                    <span className="text-xs text-gray-400">{formatDate(event.created_at)}</span>
                  </div>
                  <p className="text-sm text-gray-700 dark:text-gray-300 mt-0.5">{event.details}</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
