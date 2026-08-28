import React from 'react';
import { CallStatus } from '../../types/call';
import { Clock, CheckCircle2, PhoneMissed, XCircle, PhoneCall, PhoneOff } from 'lucide-react';

interface Props {
  status: CallStatus;
}

export const CallStatusBadge: React.FC<Props> = ({ status }) => {
  const getBadgeConfig = () => {
    switch (status) {
      case 'SCHEDULED':
        return {
          label: 'Scheduled',
          icon: Clock,
          className: 'bg-indigo-500/10 text-indigo-400 border-indigo-500/30',
        };
      case 'IN_PROGRESS':
        return {
          label: 'In Progress',
          icon: PhoneCall,
          className: 'bg-amber-500/15 text-amber-400 border-amber-500/30 animate-pulse',
        };
      case 'COMPLETED':
        return {
          label: 'Completed',
          icon: CheckCircle2,
          className: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30',
        };
      case 'MISSED':
        return {
          label: 'Missed Call',
          icon: PhoneMissed,
          className: 'bg-rose-500/10 text-rose-400 border-rose-500/30',
        };
      case 'CANCELLED':
        return {
          label: 'Cancelled',
          icon: XCircle,
          className: 'bg-slate-700/30 text-slate-400 border-slate-600/30',
        };
      case 'BUSY':
        return {
          label: 'Line Busy',
          icon: PhoneOff,
          className: 'bg-orange-500/10 text-orange-400 border-orange-500/30',
        };
      case 'NO_ANSWER':
        return {
          label: 'No Answer',
          icon: PhoneOff,
          className: 'bg-yellow-500/10 text-yellow-400 border-yellow-500/30',
        };
      default:
        return {
          label: status,
          icon: Clock,
          className: 'bg-slate-700/30 text-slate-400 border-slate-600/30',
        };
    }
  };

  const config = getBadgeConfig();
  const Icon = config.icon;

  return (
    <span
      className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold border ${config.className}`}
    >
      <Icon className="w-3.5 h-3.5" />
      <span>{config.label}</span>
    </span>
  );
};
