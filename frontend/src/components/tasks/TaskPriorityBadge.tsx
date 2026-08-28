import React from 'react';
import { TaskPriority } from '../../types/task';
import { AlertCircle, Flame, ArrowUp, ArrowDown } from 'lucide-react';

interface TaskPriorityBadgeProps {
  priority: TaskPriority;
}

export const TaskPriorityBadge: React.FC<TaskPriorityBadgeProps> = ({ priority }) => {
  switch (priority) {
    case 'URGENT':
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-rose-500/10 text-rose-400 border border-rose-500/30 animate-pulse">
          <Flame className="w-3 h-3 text-rose-400" />
          Urgent
        </span>
      );
    case 'HIGH':
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-amber-500/10 text-amber-400 border border-amber-500/30">
          <ArrowUp className="w-3 h-3 text-amber-400" />
          High
        </span>
      );
    case 'MEDIUM':
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-indigo-500/10 text-indigo-300 border border-indigo-500/30">
          <AlertCircle className="w-3 h-3 text-indigo-400" />
          Medium
        </span>
      );
    case 'LOW':
    default:
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-slate-500/10 text-slate-300 border border-slate-500/30">
          <ArrowDown className="w-3 h-3 text-slate-400" />
          Low
        </span>
      );
  }
};
