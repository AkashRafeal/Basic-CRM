import React from 'react';
import { ContactStatus } from '../../types/contact';

interface ContactStatusBadgeProps {
  status: ContactStatus;
}

export const ContactStatusBadge: React.FC<ContactStatusBadgeProps> = ({ status }) => {
  switch (status) {
    case 'ACTIVE':
      return (
        <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
          ● Active
        </span>
      );
    case 'PROSPECT':
      return (
        <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-blue-500/10 text-blue-400 border border-blue-500/20">
          ● Prospect
        </span>
      );
    case 'INACTIVE':
      return (
        <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-slate-800 text-slate-400 border border-slate-700">
          ● Inactive
        </span>
      );
    case 'FORMER_EMPLOYEE':
      return (
        <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-rose-500/10 text-rose-400 border border-rose-500/20">
          ● Former
        </span>
      );
    default:
      return null;
  }
};
