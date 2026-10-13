import type { InstanceStatus, AlertSeverity } from '../../types';

type Status = InstanceStatus | AlertSeverity | string;

const configs: Record<string, { label: string; dot: string; badge: string }> = {
  healthy: { label: 'Healthy', dot: 'bg-emerald-500', badge: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-300' },
  warning: { label: 'Warning', dot: 'bg-amber-500', badge: 'bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-300' },
  critical: { label: 'Critical', dot: 'bg-red-500 animate-pulse', badge: 'bg-red-100 text-red-800 dark:bg-red-900/40 dark:text-red-300' },
  unreachable: { label: 'Unreachable', dot: 'bg-gray-400', badge: 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-400' },
  info: { label: 'Info', dot: 'bg-blue-500', badge: 'bg-blue-100 text-blue-800 dark:bg-blue-900/40 dark:text-blue-300' },
};

interface Props {
  status: Status;
  showDot?: boolean;
  size?: 'sm' | 'md';
}

export function StatusBadge({ status, showDot = true, size = 'md' }: Props) {
  const cfg = configs[status] ?? { label: status, dot: 'bg-gray-400', badge: 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-400' };
  const textSize = size === 'sm' ? 'text-xs px-1.5 py-0.5' : 'text-xs px-2.5 py-1';
  return (
    <span className={`inline-flex items-center gap-1.5 rounded-full font-medium ${textSize} ${cfg.badge}`}>
      {showDot && <span className={`h-1.5 w-1.5 rounded-full ${cfg.dot}`} />}
      {cfg.label}
    </span>
  );
}
