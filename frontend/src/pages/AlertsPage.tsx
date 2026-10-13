import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Bell, Activity, CheckCheck } from 'lucide-react';
import { StatusBadge } from '../components/common/StatusBadge';
import { PageLoader } from '../components/common/LoadingSpinner';
import { useAlerts, useAcknowledgeAlert, useEvents } from '../hooks/useInstances';

function formatDate(ts: string): string {
  return new Date(ts).toLocaleString();
}

const EVENT_ICON_COLORS: Record<string, string> = {
  health_check: 'text-blue-500',
  alert_triggered: 'text-red-500',
  connection_lost: 'text-orange-500',
  config_change: 'text-purple-500',
};

type Tab = 'alerts' | 'events';

export function AlertsPage() {
  const [tab, setTab] = useState<Tab>('alerts');
  const [severityFilter, setSeverityFilter] = useState('');
  const [acknowledgedFilter, setAcknowledgedFilter] = useState<'' | 'true' | 'false'>('');

  const alertParams = {
    severity: severityFilter || undefined,
    acknowledged: acknowledgedFilter === '' ? undefined : acknowledgedFilter === 'true',
  };

  const { data: alerts, isLoading: alertsLoading } = useAlerts(alertParams);
  const { data: events, isLoading: eventsLoading } = useEvents();
  const acknowledge = useAcknowledgeAlert();
  const navigate = useNavigate();

  const unacked = alerts?.filter(a => !a.acknowledged).length ?? 0;

  return (
    <div className="flex flex-col gap-6 p-6">
      {/* Tabs */}
      <div className="flex items-center gap-1 border-b border-gray-200 dark:border-gray-700">
        <button
          onClick={() => setTab('alerts')}
          className={`flex items-center gap-2 px-4 py-2.5 text-sm font-medium border-b-2 transition-colors ${
            tab === 'alerts'
              ? 'border-brand-500 text-brand-600 dark:text-brand-400'
              : 'border-transparent text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200'
          }`}
        >
          <Bell className="h-4 w-4" />
          Alerts
          {unacked > 0 && (
            <span className="bg-red-500 text-white text-xs rounded-full px-1.5 py-0.5">{unacked}</span>
          )}
        </button>
        <button
          onClick={() => setTab('events')}
          className={`flex items-center gap-2 px-4 py-2.5 text-sm font-medium border-b-2 transition-colors ${
            tab === 'events'
              ? 'border-brand-500 text-brand-600 dark:text-brand-400'
              : 'border-transparent text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200'
          }`}
        >
          <Activity className="h-4 w-4" />
          Monitoring Events
        </button>
      </div>

      {tab === 'alerts' && (
        <div className="flex flex-col gap-4">
          {/* Filters */}
          <div className="flex flex-wrap gap-3 items-center">
            <select
              value={severityFilter}
              onChange={(e) => setSeverityFilter(e.target.value)}
              className="py-2 px-3 text-sm rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-brand-500"
            >
              <option value="">All Severities</option>
              <option value="critical">Critical</option>
              <option value="warning">Warning</option>
              <option value="info">Info</option>
            </select>
            <select
              value={acknowledgedFilter}
              onChange={(e) => setAcknowledgedFilter(e.target.value as '' | 'true' | 'false')}
              className="py-2 px-3 text-sm rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-brand-500"
            >
              <option value="">All States</option>
              <option value="false">Unacknowledged</option>
              <option value="true">Acknowledged</option>
            </select>
          </div>

          {/* Alert List */}
          {alertsLoading ? <PageLoader /> : (
            <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 divide-y divide-gray-100 dark:divide-gray-700/50">
              {(!alerts || alerts.length === 0) ? (
                <p className="px-5 py-12 text-center text-gray-400">No alerts match your filters.</p>
              ) : alerts.map((alert) => (
                <div key={alert.id} className={`px-5 py-4 flex items-start gap-4 ${alert.acknowledged ? 'opacity-60' : ''}`}>
                  <StatusBadge status={alert.severity} />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className="font-medium text-sm text-gray-900 dark:text-white">{alert.title}</p>
                      <button
                        onClick={() => navigate(`/instances/${alert.instance_id}`)}
                        className="text-xs text-brand-500 hover:underline"
                      >
                        View instance →
                      </button>
                    </div>
                    <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">{alert.message}</p>
                    <p className="text-xs text-gray-400 mt-1">{formatDate(alert.created_at)}</p>
                  </div>
                  {!alert.acknowledged ? (
                    <button
                      onClick={() => acknowledge.mutate(alert.id)}
                      disabled={acknowledge.isPending}
                      className="flex-shrink-0 flex items-center gap-1.5 text-xs text-brand-600 hover:text-brand-800 dark:text-brand-400 border border-brand-300 dark:border-brand-700 rounded-md px-2 py-1 disabled:opacity-50"
                    >
                      <CheckCheck className="h-3.5 w-3.5" /> Acknowledge
                    </button>
                  ) : (
                    <span className="flex-shrink-0 text-xs text-gray-400">✓ Acknowledged</span>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {tab === 'events' && (
        <div>
          {eventsLoading ? <PageLoader /> : (
            <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 divide-y divide-gray-100 dark:divide-gray-700/50">
              {(!events || events.length === 0) ? (
                <p className="px-5 py-12 text-center text-gray-400">No monitoring events recorded.</p>
              ) : events.map((event) => (
                <div key={event.id} className="px-5 py-3 flex items-start gap-3">
                  <Activity className={`h-4 w-4 mt-0.5 flex-shrink-0 ${EVENT_ICON_COLORS[event.event_type] ?? 'text-gray-400'}`} />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-3 flex-wrap">
                      <span className="text-xs font-semibold uppercase text-gray-500 dark:text-gray-400">{event.event_type.replace(/_/g, ' ')}</span>
                      <button onClick={() => navigate(`/instances/${event.instance_id}`)} className="text-xs text-brand-500 hover:underline">
                        View instance →
                      </button>
                      <span className="text-xs text-gray-400">{formatDate(event.created_at)}</span>
                    </div>
                    <p className="text-sm text-gray-700 dark:text-gray-300 mt-0.5">{event.details}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
