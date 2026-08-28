import React from 'react';
import { FollowUpStatus } from '../../types/followup';

interface FollowUpStatusBadgeProps {
  status: FollowUpStatus;
}

const statusConfig: Record<FollowUpStatus, { label: string; bg: string; text: string; border: string; dot: string }> = {
  SCHEDULED: {
    label: 'Scheduled',
    bg: 'bg-blue-500/10',
    text: 'text-blue-400',
    border: 'border-blue-500/30',
    dot: 'bg-blue-400',
  },
  COMPLETED: {
    label: 'Completed',
    bg: 'bg-emerald-500/10',
    text: 'text-emerald-400',
    border: 'border-emerald-500/30',
    dot: 'bg-emerald-400',
  },
  MISSED: {
    label: 'Missed / Overdue',
    bg: 'bg-rose-500/10',
    text: 'text-rose-400',
    border: 'border-rose-500/30',
    dot: 'bg-rose-400',
  },
  RESCHEDULED: {
    label: 'Rescheduled',
    bg: 'bg-amber-500/10',
    text: 'text-amber-400',
    border: 'border-amber-500/30',
    dot: 'bg-amber-400',
  },
  CANCELLED: {
    label: 'Cancelled',
    bg: 'bg-slate-500/10',
    text: 'text-slate-400',
    border: 'border-slate-500/30',
    dot: 'bg-slate-500',
  },
};

export const FollowUpStatusBadge: React.FC<FollowUpStatusBadgeProps> = ({ status }) => {
  const config = statusConfig[status] || statusConfig.SCHEDULED;

  return (
    <span
      className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold border ${config.bg} ${config.text} ${config.border}`}
    >
      <span className={`w-1.5 h-1.5 rounded-full ${config.dot}`} />
      {config.label}
    </span>
  );
};
