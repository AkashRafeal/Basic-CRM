import React from 'react';
import { CallOutcome } from '../../types/call';
import {
  ThumbsUp,
  CalendarCheck,
  FileText,
  ThumbsDown,
  PhoneOff,
  Voicemail,
  PhoneForwarded,
  Trophy,
  CheckCircle2,
  HelpCircle,
} from 'lucide-react';

interface Props {
  outcome?: CallOutcome;
}

export const CallOutcomeBadge: React.FC<Props> = ({ outcome }) => {
  if (!outcome) {
    return (
      <span className="text-xs text-slate-500 italic">No outcome logged</span>
    );
  }

  const getOutcomeConfig = () => {
    switch (outcome) {
      case 'INTERESTED':
        return { label: 'Interested', icon: ThumbsUp, color: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/30' };
      case 'MEETING_BOOKED':
        return { label: 'Meeting Booked', icon: CalendarCheck, color: 'text-indigo-400 bg-indigo-500/10 border-indigo-500/30 font-semibold' };
      case 'QUOTE_REQUESTED':
        return { label: 'Quote Requested', icon: FileText, color: 'text-cyan-400 bg-cyan-500/10 border-cyan-500/30' };
      case 'DEAL_CLOSED':
        return { label: 'Deal Closed Won', icon: Trophy, color: 'text-amber-300 bg-amber-500/15 border-amber-400/30 font-bold' };
      case 'ISSUE_RESOLVED':
        return { label: 'Issue Resolved', icon: CheckCircle2, color: 'text-teal-400 bg-teal-500/10 border-teal-500/30' };
      case 'CALLBACK_REQUESTED':
        return { label: 'Callback Requested', icon: PhoneForwarded, color: 'text-blue-400 bg-blue-500/10 border-blue-500/30' };
      case 'LEFT_VOICEMAIL':
        return { label: 'Left Voicemail', icon: Voicemail, color: 'text-purple-400 bg-purple-500/10 border-purple-500/30' };
      case 'NOT_INTERESTED':
        return { label: 'Not Interested', icon: ThumbsDown, color: 'text-rose-400 bg-rose-500/10 border-rose-500/30' };
      case 'WRONG_NUMBER':
        return { label: 'Wrong Number', icon: PhoneOff, color: 'text-slate-400 bg-slate-700/30 border-slate-600/30' };
      case 'BUSY_NO_ANSWER':
        return { label: 'Busy / No Answer', icon: PhoneOff, color: 'text-orange-400 bg-orange-500/10 border-orange-500/30' };
      default:
        return { label: outcome, icon: HelpCircle, color: 'text-slate-400 bg-slate-700/20 border-slate-600/20' };
    }
  };

  const config = getOutcomeConfig();
  const Icon = config.icon;

  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-lg text-xs border ${config.color}`}>
      <Icon className="w-3.5 h-3.5" />
      <span>{config.label}</span>
    </span>
  );
};
