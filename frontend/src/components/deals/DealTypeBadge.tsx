import React from 'react';
import { DealType } from '../../types/deal';
import { PlusCircle, Repeat, TrendingUp, RefreshCw } from 'lucide-react';

interface DealTypeBadgeProps {
  dealType: DealType;
}

export const DealTypeBadge: React.FC<DealTypeBadgeProps> = ({ dealType }) => {
  switch (dealType) {
    case 'NEW_BUSINESS':
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-lg text-xs font-semibold bg-emerald-500/10 text-emerald-300 border border-emerald-500/20">
          <PlusCircle className="w-3.5 h-3.5 text-emerald-400" />
          New Business
        </span>
      );
    case 'EXPANSION_UPSELL':
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-lg text-xs font-semibold bg-indigo-500/10 text-indigo-300 border border-indigo-500/20">
          <TrendingUp className="w-3.5 h-3.5 text-indigo-400" />
          Upsell / Expansion
        </span>
      );
    case 'RENEWAL':
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-lg text-xs font-semibold bg-purple-500/10 text-purple-300 border border-purple-500/20">
          <RefreshCw className="w-3.5 h-3.5 text-purple-400" />
          Renewal
        </span>
      );
    case 'EXISTING_BUSINESS':
    default:
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-lg text-xs font-semibold bg-slate-800 text-slate-300 border border-slate-700">
          <Repeat className="w-3.5 h-3.5 text-slate-400" />
          Existing Business
        </span>
      );
  }
};
