import React from 'react';
import { CustomerTier } from '../../types/customer';
import { Crown, Sparkles, Building2, ShieldCheck } from 'lucide-react';

interface CustomerTierBadgeProps {
  tier: CustomerTier;
}

export const CustomerTierBadge: React.FC<CustomerTierBadgeProps> = ({ tier }) => {
  switch (tier) {
    case 'TIER_1_ENTERPRISE':
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-amber-500/10 text-amber-300 border border-amber-500/30">
          <Crown className="w-3 h-3 text-amber-400" />
          Enterprise
        </span>
      );
    case 'STRATEGIC':
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-purple-500/10 text-purple-300 border border-purple-500/30">
          <Sparkles className="w-3 h-3 text-purple-400" />
          Strategic
        </span>
      );
    case 'TIER_2_MID_MARKET':
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-indigo-500/10 text-indigo-300 border border-indigo-500/30">
          <Building2 className="w-3 h-3 text-indigo-400" />
          Mid-Market
        </span>
      );
    case 'TIER_3_SMB':
    default:
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-slate-500/10 text-slate-300 border border-slate-500/30">
          <ShieldCheck className="w-3 h-3 text-slate-400" />
          SMB
        </span>
      );
  }
};
