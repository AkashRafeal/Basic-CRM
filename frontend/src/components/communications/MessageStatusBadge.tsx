import React from 'react';
import { MessageStatus } from '../../types/communication';
import { Check, CheckCheck, Clock, AlertCircle, Inbox, Archive, FileEdit } from 'lucide-react';

interface Props {
  status: MessageStatus;
}

export const MessageStatusBadge: React.FC<Props> = ({ status }) => {
  const getStatusConfig = () => {
    switch (status) {
      case 'DRAFT':
        return {
          label: 'Draft',
          icon: FileEdit,
          className: 'bg-slate-500/10 text-slate-400 border-slate-500/20',
        };
      case 'SCHEDULED':
        return {
          label: 'Scheduled',
          icon: Clock,
          className: 'bg-amber-500/10 text-amber-400 border-amber-500/20',
        };
      case 'SENT':
        return {
          label: 'Sent',
          icon: Check,
          className: 'bg-sky-500/10 text-sky-400 border-sky-500/20',
        };
      case 'DELIVERED':
        return {
          label: 'Delivered',
          icon: CheckCheck,
          className: 'bg-indigo-500/10 text-indigo-400 border-indigo-500/20',
        };
      case 'READ':
        return {
          label: 'Read / Opened',
          icon: CheckCheck,
          className: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
        };
      case 'RECEIVED':
        return {
          label: 'Received',
          icon: Inbox,
          className: 'bg-teal-500/10 text-teal-400 border-teal-500/20',
        };
      case 'FAILED':
        return {
          label: 'Failed',
          icon: AlertCircle,
          className: 'bg-rose-500/10 text-rose-400 border-rose-500/20',
        };
      case 'ARCHIVED':
        return {
          label: 'Archived',
          icon: Archive,
          className: 'bg-slate-800 text-slate-400 border-slate-700',
        };
      default:
        return {
          label: status,
          icon: Check,
          className: 'bg-slate-500/10 text-slate-400 border-slate-500/20',
        };
    }
  };

  const config = getStatusConfig();
  const Icon = config.icon;

  return (
    <span
      className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-medium border ${config.className}`}
    >
      <Icon className="w-3 h-3" />
      <span>{config.label}</span>
    </span>
  );
};
