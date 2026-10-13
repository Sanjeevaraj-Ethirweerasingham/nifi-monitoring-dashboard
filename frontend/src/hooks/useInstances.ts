import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { instancesApi, alertsApi, eventsApi } from '../api/client';
import type { InstanceFilters } from '../types';

export const useSummary = () =>
  useQuery({
    queryKey: ['summary'],
    queryFn: instancesApi.getSummary,
    refetchInterval: 30_000,
  });

export const useInstances = (filters: Partial<InstanceFilters> & { page?: number }) =>
  useQuery({
    queryKey: ['instances', filters],
    queryFn: () => instancesApi.getInstances(filters),
    refetchInterval: 30_000,
  });

export const useInstance = (id: number | null) =>
  useQuery({
    queryKey: ['instance', id],
    queryFn: () => instancesApi.getInstance(id!),
    enabled: id !== null,
  });

export const usePollInstance = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => instancesApi.pollInstance(id),
    onSuccess: (data) => {
      qc.invalidateQueries({ queryKey: ['instance', data.id] });
      qc.invalidateQueries({ queryKey: ['instances'] });
      qc.invalidateQueries({ queryKey: ['summary'] });
    },
  });
};

export const useCreateInstance = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: instancesApi.createInstance,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['instances'] });
      qc.invalidateQueries({ queryKey: ['summary'] });
    },
  });
};

export const useUpdateInstance = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, payload }: { id: number; payload: import('../types').InstanceUpdateInput }) =>
      instancesApi.updateInstance(id, payload),
    onSuccess: (data) => {
      qc.invalidateQueries({ queryKey: ['instance', data.id] });
      qc.invalidateQueries({ queryKey: ['instances'] });
      qc.invalidateQueries({ queryKey: ['summary'] });
    },
  });
};

export const useDeleteInstance = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: instancesApi.deleteInstance,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['instances'] });
      qc.invalidateQueries({ queryKey: ['summary'] });
    },
  });
};

export const useNotifyTeams = () => {
  return useMutation({
    mutationFn: instancesApi.notifyTeams,
  });
};

export const useAlerts = (params?: { instance_id?: number; severity?: string; acknowledged?: boolean }) =>
  useQuery({
    queryKey: ['alerts', params],
    queryFn: () => alertsApi.getAlerts(params),
    refetchInterval: 30_000,
  });

export const useAcknowledgeAlert = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: alertsApi.acknowledgeAlert,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['alerts'] });
      qc.invalidateQueries({ queryKey: ['summary'] });
    },
  });
};

export const useEvents = (params?: { instance_id?: number; event_type?: string }) =>
  useQuery({
    queryKey: ['events', params],
    queryFn: () => eventsApi.getEvents(params),
    refetchInterval: 30_000,
  });
