export type InstanceStatus = 'healthy' | 'warning' | 'critical' | 'unreachable';
export type AlertSeverity = 'info' | 'warning' | 'critical';
export type Environment = 'development' | 'uat' | 'production';

export interface NifiInstance {
  id: number;
  name: string;
  environment: string;
  hostname: string;
  port: number;
  nifi_version: string;
  status: InstanceStatus;
  process_groups_running: number;
  process_groups_stopped: number;
  invalid_components: number;
  queued_flowfiles: number;
  bytes_queued: number;
  active_threads: number;
  response_time_ms: number | null;
  last_checked: string | null;
  is_demo: boolean;
  created_at: string;
  notes?: string | null;
}

export interface InstanceCreateInput {
  name: string;
  environment: string;
  hostname: string;
  port: number;
  nifi_version?: string;
  notes?: string;
}

export interface InstanceUpdateInput {
  name?: string;
  environment?: string;
  hostname?: string;
  port?: number;
  nifi_version?: string;
  notes?: string;
}


export interface NifiInstanceDetail extends NifiInstance {
  alerts: Alert[];
  events: MonitoringEvent[];
}

export interface Alert {
  id: number;
  instance_id: number;
  severity: AlertSeverity;
  title: string;
  message: string;
  acknowledged: boolean;
  created_at: string;
}

export interface MonitoringEvent {
  id: number;
  instance_id: number;
  event_type: string;
  details: string;
  created_at: string;
}

export interface DashboardSummary {
  total: number;
  healthy: number;
  warning: number;
  critical: number;
  unreachable: number;
  total_alerts: number;
  unacknowledged_alerts: number;
  is_demo: boolean;
}

export interface PaginatedInstances {
  items: NifiInstance[];
  total: number;
  page: number;
  page_size: number;
}

export interface InstanceFilters {
  search: string;
  environment: string;
  status: string;
  sort_by: string;
  sort_dir: 'asc' | 'desc';
}
