import React from 'react';
import { CustomerStatus } from '../../types/customer';

interface CustomerStatusBadgeProps {
  status: CustomerStatus;
}

const statusConfig: Record<CustomerStatus, { label: string; bg: string; text: string; border: string; dot: string }> = {
  ACTIVE: {
    label: 'Active',
    bg: 'bg-emerald-500/10',
    text: 'text-emerald-400',
    border: 'border-emerald-500/30',
    dot: 'bg-emerald-400',
  },
  ONBOARDING: {
    label: 'Onboarding',
    bg: 'bg-blue-500/10',
    text: 'text-blue-400',
    border: 'border-blue-500/30',
    dot: 'bg-blue-400',
  },
  AT_RISK: {
    label: 'At Risk',
    bg: 'bg-rose-500/10',
    text: 'text-rose-400',
    border: 'border-rose-500/30',
    dot: 'bg-rose-400',
  },
  CHURNED: {
    label: 'Churned',
    bg: 'bg-slate-500/10',
    text: 'text-slate-400',
    border: 'border-slate-500/30',
    dot: 'bg-slate-500',
  },
  INACTIVE: {
    label: 'Inactive',
    bg: 'bg-amber-500/10',
    text: 'text-amber-400',
    border: 'border-amber-500/30',
    dot: 'bg-amber-400',
  },
};

export const CustomerStatusBadge: React.FC<CustomerStatusBadgeProps> = ({ status }) => {
  const config = statusConfig[status] || statusConfig.ACTIVE;

  return (
    <span
      className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold border ${config.bg} ${config.text} ${config.border}`}
    >
      <span className={`w-1.5 h-1.5 rounded-full ${config.dot}`} />
      {config.label}
    </span>
  );
};
