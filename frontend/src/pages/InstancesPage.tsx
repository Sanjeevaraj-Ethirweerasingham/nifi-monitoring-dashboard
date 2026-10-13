import { useState } from 'react';
import { Plus, LayoutGrid, Table2 } from 'lucide-react';
import { InstanceFiltersBar } from '../components/instances/InstanceFilters';
import { InstanceTable } from '../components/instances/InstanceTable';
import { GroupedInstanceView } from '../components/instances/GroupedInstanceView';
import { AddInstanceModal } from '../components/instances/AddInstanceModal';
import { PageLoader } from '../components/common/LoadingSpinner';
import { useInstances } from '../hooks/useInstances';
import type { InstanceFilters } from '../types';

export function InstancesPage() {
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [viewMode, setViewMode] = useState<'grouped' | 'table'>('grouped');
  const [filters, setFilters] = useState<Partial<InstanceFilters>>({
    search: '',
    environment: '',
    status: '',
    sort_by: 'name',
    sort_dir: 'asc',
  });

  const { data, isLoading } = useInstances(filters);

  const handleSortChange = (col: string) => {
    setFilters((prev) => ({
      ...prev,
      sort_by: col,
      sort_dir: prev.sort_by === col && prev.sort_dir === 'asc' ? 'desc' : 'asc',
    }));
  };

  return (
    <div className="flex flex-col gap-6 p-6">
      <AddInstanceModal isOpen={isAddModalOpen} onClose={() => setIsAddModalOpen(false)} />
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex-1 min-w-[280px]">
          <InstanceFiltersBar filters={filters} onChange={setFilters} />
        </div>
        <div className="flex items-center gap-2">
          <div className="flex items-center bg-gray-100 dark:bg-gray-800 p-0.5 rounded-lg border border-gray-200 dark:border-gray-700">
            <button
              onClick={() => setViewMode('grouped')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-colors ${
                viewMode === 'grouped'
                  ? 'bg-white dark:bg-gray-700 text-gray-900 dark:text-white shadow-xs'
                  : 'text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white'
              }`}
            >
              <LayoutGrid className="h-3.5 w-3.5" />
              Grouped
            </button>
            <button
              onClick={() => setViewMode('table')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-colors ${
                viewMode === 'table'
                  ? 'bg-white dark:bg-gray-700 text-gray-900 dark:text-white shadow-xs'
                  : 'text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white'
              }`}
            >
              <Table2 className="h-3.5 w-3.5" />
              Table
            </button>
          </div>
          <button
            onClick={() => setIsAddModalOpen(true)}
            className="flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-white bg-brand-600 hover:bg-brand-700 rounded-lg shadow-sm transition-colors"
          >
            <Plus className="h-4 w-4" /> Add Instance
          </button>
        </div>
      </div>
      {isLoading ? (
        <PageLoader />
      ) : data ? (
        viewMode === 'grouped' ? (
          <GroupedInstanceView instances={data.items} />
        ) : (
          <InstanceTable
            instances={data.items}
            total={data.total}
            filters={filters}
            onSortChange={handleSortChange}
          />
        )
      ) : null}
    </div>
  );
}
