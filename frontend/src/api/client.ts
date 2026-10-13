import axios from 'axios';
import type { DashboardSummary, PaginatedInstances, NifiInstance, NifiInstanceDetail, Alert, MonitoringEvent, InstanceFilters } from '../types';

const api = axios.create({
  baseURL: '/api',
  headers: { 'Content-Type': 'application/json' },
});

export const instancesApi = {
  getSummary: async (): Promise<DashboardSummary> => {
    const { data } = await api.get('/instances/summary');
    return data;
  },

  getInstances: async (filters: Partial<InstanceFilters> & { page?: number; page_size?: number }): Promise<PaginatedInstances> => {
    const params: Record<string, string | number> = {};
    if (filters.search) params.search = filters.search;
    if (filters.environment) params.environment = filters.environment;
    if (filters.status) params.status = filters.status;
    if (filters.sort_by) params.sort_by = filters.sort_by;
    if (filters.sort_dir) params.sort_dir = filters.sort_dir;
    if (filters.page) params.page = filters.page;
    if (filters.page_size) params.page_size = filters.page_size;
    const { data } = await api.get('/instances', { params });
    return data;
  },

  getInstance: async (id: number): Promise<NifiInstanceDetail> => {
    const { data } = await api.get(`/instances/${id}`);
    return data;
  },

  pollInstance: async (id: number): Promise<NifiInstanceDetail> => {
    const { data } = await api.post(`/instances/${id}/poll`);
    return data;
  },

  createInstance: async (payload: import('../types').InstanceCreateInput): Promise<NifiInstanceDetail> => {
    const { data } = await api.post('/instances', payload);
    return data;
  },

  updateInstance: async (id: number, payload: import('../types').InstanceUpdateInput): Promise<NifiInstance> => {
    const { data } = await api.put(`/instances/${id}`, payload);
    return data;
  },

  deleteInstance: async (id: number): Promise<{ message: string; id: number }> => {
    const { data } = await api.delete(`/instances/${id}`);
    return data;
  },

  notifyTeams: async (): Promise<{ status: string; message: string; count: number }> => {
    const { data } = await api.post('/instances/notify-teams');
    return data;
  },
};

export const alertsApi = {
  getAlerts: async (params?: { instance_id?: number; severity?: string; acknowledged?: boolean; limit?: number }): Promise<Alert[]> => {
    const { data } = await api.get('/alerts', { params });
    return data;
  },

  acknowledgeAlert: async (alertId: number): Promise<Alert> => {
    const { data } = await api.patch(`/alerts/${alertId}/acknowledge`, { acknowledged: true });
    return data;
  },
};

export const eventsApi = {
  getEvents: async (params?: { instance_id?: number; event_type?: string; limit?: number }): Promise<MonitoringEvent[]> => {
    const { data } = await api.get('/events', { params });
    return data;
  },
};

export default api;
