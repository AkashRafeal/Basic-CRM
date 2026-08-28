import React from 'react';
import { DealStage } from '../../types/deal';

interface DealStageBadgeProps {
  stage: DealStage;
}

const stageConfig: Record<DealStage, { label: string; bg: string; text: string; border: string; dot: string }> = {
  QUALIFICATION: {
    label: 'Qualification',
    bg: 'bg-slate-500/10',
    text: 'text-slate-300',
    border: 'border-slate-500/30',
    dot: 'bg-slate-400',
  },
  DISCOVERY: {
    label: 'Discovery & Demo',
    bg: 'bg-blue-500/10',
    text: 'text-blue-400',
    border: 'border-blue-500/30',
    dot: 'bg-blue-400',
  },
  PROPOSAL: {
    label: 'Proposal / Quote',
    bg: 'bg-indigo-500/10',
    text: 'text-indigo-400',
    border: 'border-indigo-500/30',
    dot: 'bg-indigo-400',
  },
  NEGOTIATION: {
    label: 'Negotiation',
    bg: 'bg-amber-500/10',
    text: 'text-amber-400',
    border: 'border-amber-500/30',
    dot: 'bg-amber-400',
  },
  CLOSED_WON: {
    label: 'Closed Won',
    bg: 'bg-emerald-500/10',
    text: 'text-emerald-400',
    border: 'border-emerald-500/30',
    dot: 'bg-emerald-400',
  },
  CLOSED_LOST: {
    label: 'Closed Lost',
    bg: 'bg-rose-500/10',
    text: 'text-rose-400',
    border: 'border-rose-500/30',
    dot: 'bg-rose-400',
  },
};

export const DealStageBadge: React.FC<DealStageBadgeProps> = ({ stage }) => {
  const config = stageConfig[stage] || stageConfig.QUALIFICATION;

  return (
    <span
      className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold border ${config.bg} ${config.text} ${config.border}`}
    >
      <span className={`w-1.5 h-1.5 rounded-full ${config.dot}`} />
      {config.label}
    </span>
  );
};
