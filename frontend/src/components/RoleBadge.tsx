import React from 'react';
import { Role } from '../types/auth';
import { ShieldCheck, ShieldAlert, UserCheck } from 'lucide-react';

interface RoleBadgeProps {
  role: Role;
  showIcon?: boolean;
}

export const RoleBadge: React.FC<RoleBadgeProps> = ({ role, showIcon = true }) => {
  switch (role) {
    case 'ROLE_ADMIN':
      return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-rose-500/10 text-rose-400 border border-rose-500/20 shadow-sm shadow-rose-950">
          {showIcon && <ShieldAlert className="w-3.5 h-3.5 text-rose-400" />}
          Admin
        </span>
      );
    case 'ROLE_MANAGER':
      return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-amber-500/10 text-amber-400 border border-amber-500/20 shadow-sm shadow-amber-950">
          {showIcon && <ShieldCheck className="w-3.5 h-3.5 text-amber-400" />}
          Manager
        </span>
      );
    case 'ROLE_EMPLOYEE':
    default:
      return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 shadow-sm shadow-emerald-950">
          {showIcon && <UserCheck className="w-3.5 h-3.5 text-emerald-400" />}
          Employee
        </span>
      );
  }
};
