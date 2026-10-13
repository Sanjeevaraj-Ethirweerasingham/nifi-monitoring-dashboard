import { useState } from 'react';
import { X, Plus, Server } from 'lucide-react';
import { useCreateInstance } from '../../hooks/useInstances';
import type { InstanceCreateInput } from '../../types';

interface Props {
  isOpen: boolean;
  onClose: () => void;
}

export function AddInstanceModal({ isOpen, onClose }: Props) {
  const [formData, setFormData] = useState<InstanceCreateInput>({
    name: '',
    environment: 'production',
    hostname: '',
    port: 8443,
    nifi_version: '1.28.1',
    notes: '',
  });
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const createMutation = useCreateInstance();

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    if (!formData.name.trim() || !formData.hostname.trim()) {
      setErrorMsg('Name and Hostname are required.');
      return;
    }

    try {
      await createMutation.mutateAsync({
        ...formData,
        port: Number(formData.port),
      });
      onClose();
    } catch (err: any) {
      setErrorMsg(err.response?.data?.detail || 'Failed to add instance. Check connectivity.');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div className="relative w-full max-w-md bg-white dark:bg-gray-800 rounded-xl shadow-2xl border border-gray-200 dark:border-gray-700 overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center gap-2">
            <Server className="h-5 w-5 text-brand-600 dark:text-brand-400" />
            <h3 className="text-base font-semibold text-gray-900 dark:text-white">Add NiFi Instance</h3>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 p-1 rounded-md"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {errorMsg && (
            <div className="rounded-md bg-red-50 dark:bg-red-950/40 p-3 text-xs text-red-600 dark:text-red-400 border border-red-200 dark:border-red-800">
              {errorMsg}
            </div>
          )}

          <div>
            <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
              Instance Name *
            </label>
            <input
              type="text"
              required
              placeholder="e.g. HMG Production NiFi"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="w-full px-3 py-2 text-sm rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-brand-500"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                Environment
              </label>
              <select
                value={formData.environment}
                onChange={(e) => setFormData({ ...formData, environment: e.target.value })}
                className="w-full px-3 py-2 text-sm rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-brand-500"
              >
                <option value="production">Production</option>
                <option value="uat">UAT</option>
                <option value="development">Development</option>
              </select>

            </div>

            <div>
              <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                Port *
              </label>
              <input
                type="number"
                required
                value={formData.port}
                onChange={(e) => setFormData({ ...formData, port: Number(e.target.value) })}
                className="w-full px-3 py-2 text-sm rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-brand-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
              Hostname / IP Address *
            </label>
            <input
              type="text"
              required
              placeholder="e.g. 10.201.216.172 or nifi.corp.local"
              value={formData.hostname}
              onChange={(e) => setFormData({ ...formData, hostname: e.target.value })}
              className="w-full px-3 py-2 text-sm rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-brand-500"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
              NiFi Version (Optional)
            </label>
            <input
              type="text"
              placeholder="1.28.1"
              value={formData.nifi_version}
              onChange={(e) => setFormData({ ...formData, nifi_version: e.target.value })}
              className="w-full px-3 py-2 text-sm rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-brand-500"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
              Notes (Optional)
            </label>
            <textarea
              rows={2}
              placeholder="Internal description, cluster role, etc."
              value={formData.notes ?? ''}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              className="w-full px-3 py-2 text-sm rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-brand-500"
            />
          </div>

          <div className="flex justify-end gap-3 pt-3 border-t border-gray-200 dark:border-gray-700">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-medium text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={createMutation.isPending}
              className="flex items-center gap-1.5 px-4 py-2 text-xs font-medium text-white bg-brand-600 hover:bg-brand-700 rounded-lg disabled:opacity-50 transition-colors"
            >
              <Plus className="h-4 w-4" />
              {createMutation.isPending ? 'Registering...' : 'Add Instance'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
