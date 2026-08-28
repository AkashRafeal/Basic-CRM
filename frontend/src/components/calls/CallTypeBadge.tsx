import React from 'react';
import { CallType } from '../../types/call';
import { PhoneIncoming, PhoneOutgoing } from 'lucide-react';

interface Props {
  type: CallType;
}

export const CallTypeBadge: React.FC<Props> = ({ type }) => {
  const isOutbound = type === 'OUTBOUND';
  const Icon = isOutbound ? PhoneOutgoing : PhoneIncoming;

  return (
    <span
      className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-lg text-xs font-medium border ${
        isOutbound
          ? 'bg-sky-500/10 text-sky-400 border-sky-500/20'
          : 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
      }`}
    >
      <Icon className="w-3.5 h-3.5" />
      <span>{isOutbound ? 'Outbound' : 'Inbound'}</span>
    </span>
  );
};
