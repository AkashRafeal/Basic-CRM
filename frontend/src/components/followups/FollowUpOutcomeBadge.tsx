import React from 'react';
import { FollowUpOutcome } from '../../types/followup';
import { CheckCircle2, Sparkles, PhoneForwarded, Calendar, HelpCircle, XCircle, Trophy } from 'lucide-react';

interface FollowUpOutcomeBadgeProps {
  outcome: FollowUpOutcome;
}

export const FollowUpOutcomeBadge: React.FC<FollowUpOutcomeBadgeProps> = ({ outcome }) => {
  switch (outcome) {
    case 'INTERESTED':
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">
          <Sparkles className="w-3 h-3 text-emerald-400" />
          Interested
        </span>
      );
    case 'PROPOSAL_REQUESTED':
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-indigo-500/10 text-indigo-300 border border-indigo-500/30">
          <CheckCircle2 className="w-3 h-3 text-indigo-400" />
          Proposal Requested
        </span>
      );
    case 'MEETING_BOOKED':
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-purple-500/10 text-purple-300 border border-purple-500/30">
          <Calendar className="w-3 h-3 text-purple-400" />
          Meeting Booked
        </span>
      );
    case 'CALLBACK_REQUESTED':
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-cyan-500/10 text-cyan-300 border border-cyan-500/30">
          <PhoneForwarded className="w-3 h-3 text-cyan-400" />
          Callback Requested
        </span>
      );
    case 'DEAL_WON':
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-amber-500/10 text-amber-300 border border-amber-500/30 animate-pulse">
          <Trophy className="w-3 h-3 text-amber-400" />
          Deal Won
        </span>
      );
    case 'NOT_INTERESTED':
    case 'DEAL_LOST':
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-rose-500/10 text-rose-400 border border-rose-500/30">
          <XCircle className="w-3 h-3 text-rose-400" />
          {outcome === 'DEAL_LOST' ? 'Deal Lost' : 'Not Interested'}
        </span>
      );
    case 'NO_ANSWER':
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-slate-500/10 text-slate-400 border border-slate-500/30">
          <HelpCircle className="w-3 h-3 text-slate-400" />
          No Answer
        </span>
      );
    case 'PENDING':
    default:
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-slate-800 text-slate-400 border border-slate-700">
          Pending Log
        </span>
      );
  }
};
