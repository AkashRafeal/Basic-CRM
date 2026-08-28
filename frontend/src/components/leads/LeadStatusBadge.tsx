import React from 'react';
import { LeadStatus } from '../../types/lead';

interface LeadStatusBadgeProps {
  status: LeadStatus;
}

export const LeadStatusBadge: React.FC<LeadStatusBadgeProps> = ({ status }) => {
  const getBadgeStyle = () => {
    switch (status) {
      case 'NEW':
        return 'bg-blue-500/10 text-blue-400 border-blue-500/30';
      case 'CONTACTED':
        return 'bg-amber-500/10 text-amber-400 border-amber-500/30';
      case 'QUALIFIED':
        return 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30';
      case 'PROPOSAL_SENT':
        return 'bg-indigo-500/10 text-indigo-400 border-indigo-500/30';
      case 'NEGOTIATING':
        return 'bg-purple-500/10 text-purple-400 border-purple-500/30';
      case 'CONVERTED':
        return 'bg-teal-500/10 text-teal-400 border-teal-500/30';
      case 'LOST':
        return 'bg-rose-500/10 text-rose-400 border-rose-500/30';
      default:
        return 'bg-slate-500/10 text-slate-400 border-slate-500/30';
    }
  };

  const getLabel = () => {
    return status.replace('_', ' ');
  };

  return (
    <span
      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold border ${getBadgeStyle()}`}
    >
      <span className="w-1.5 h-1.5 rounded-full mr-1.5 bg-current opacity-75"></span>
      {getLabel()}
    </span>
  );
};
