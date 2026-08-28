import { ModalPortal } from '../ModalPortal';
import React from 'react';
import { Task, TaskStatus } from '../../types/task';
import { TaskStatusBadge } from './TaskStatusBadge';
import { TaskPriorityBadge } from './TaskPriorityBadge';
import {
  X,
  CheckSquare,
  Calendar,
  User as UserIcon,
  Link2,
  FileText,
  Clock,
  Edit2,
  CheckCircle2,
} from 'lucide-react';

interface TaskDetailsModalProps {
  isOpen: boolean;
  onClose: () => void;
  task: Task | null;
  onStatusChange: (id: number, status: TaskStatus) => Promise<void>;
  onEdit: (task: Task) => void;
}

export const TaskDetailsModal: React.FC<TaskDetailsModalProps> = ({
  isOpen,
  onClose,
  task,
  onStatusChange,
  onEdit,
}) => {
  if (!isOpen || !task) return null;

  return (
    <ModalPortal>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 modal-overlay-blur animate-fade-in">
      <div className="bg-slate-900/95 border border-slate-700/80 rounded-2xl w-full max-w-2xl overflow-hidden shadow-2xl shadow-black/80 animate-scale-up max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-start justify-between px-6 py-5 border-b border-slate-800 bg-slate-900/60">
          <div className="flex items-start space-x-3.5">
            <div className="w-10 h-10 rounded-xl bg-indigo-600/15 border border-indigo-500/30 flex items-center justify-center text-indigo-400 font-bold">
              <CheckSquare className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <TaskPriorityBadge priority={task.priority} />
                <span className="text-xs px-2 py-0.5 rounded-md bg-slate-950 text-slate-400 border border-slate-800">
                  {task.taskTypeDisplayName}
                </span>
              </div>
              <h3 className="text-lg font-bold text-slate-100 mt-1">{task.title}</h3>
            </div>
          </div>
          <div className="flex items-center space-x-2">
            <button
              onClick={() => {
                onClose();
                onEdit(task);
              }}
              className="p-2 text-slate-400 hover:text-amber-400 rounded-xl hover:bg-slate-800 transition-colors"
              title="Edit Task"
            >
              <Edit2 className="w-4 h-4" />
            </button>
            <button
              onClick={onClose}
              className="p-2 text-slate-400 hover:text-slate-200 rounded-xl hover:bg-slate-800 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Modal Body */}
        <div className="overflow-y-auto p-6 space-y-5 flex-1">
          {/* Quick Metrics */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="p-3.5 rounded-xl bg-slate-950/70 border border-slate-800">
              <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block">
                Status
              </span>
              <div className="mt-1">
                <TaskStatusBadge status={task.status} />
              </div>
            </div>

            <div className="p-3.5 rounded-xl bg-slate-950/70 border border-slate-800">
              <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block">
                Due Date
              </span>
              <div className="text-xs font-bold text-slate-200 mt-1 flex items-center gap-1.5">
                <Calendar className="w-3.5 h-3.5 text-slate-500" />
                <span>{task.dueDate || 'No due date'}</span>
                {task.isOverdue && (
                  <span className="text-[10px] text-rose-400 bg-rose-500/10 border border-rose-500/20 px-1.5 py-0.5 rounded font-bold">
                    Overdue
                  </span>
                )}
              </div>
            </div>

            <div className="p-3.5 rounded-xl bg-slate-950/70 border border-slate-800">
              <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block">
                Assigned To
              </span>
              <div className="text-xs font-bold text-slate-200 mt-1 truncate flex items-center gap-1.5">
                <UserIcon className="w-3.5 h-3.5 text-slate-500" />
                <span>{task.assignedToUserName || 'Unassigned'}</span>
              </div>
            </div>
          </div>

          {/* Quick Status Toggle */}
          <div className="space-y-2">
            <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider">
              Update Activity Status
            </label>
            <div className="flex flex-wrap gap-2">
              {(['TODO', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED'] as TaskStatus[]).map((st) => (
                <button
                  key={st}
                  onClick={() => onStatusChange(task.id, st)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-semibold border transition-all ${
                    task.status === st
                      ? 'bg-indigo-600/20 text-indigo-300 border-indigo-500 font-bold shadow-md shadow-indigo-500/10'
                      : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-slate-200 hover:border-slate-700'
                  }`}
                >
                  {st === 'TODO' ? 'To Do' : st === 'IN_PROGRESS' ? 'In Progress' : st === 'COMPLETED' ? 'Completed' : 'Cancelled'}
                </button>
              ))}
            </div>
          </div>

          {/* Related Entity Association */}
          {task.relatedEntityType !== 'GENERAL' && (
            <div className="p-3.5 rounded-xl bg-slate-950/50 border border-slate-800 space-y-1">
              <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider flex items-center gap-1">
                <Link2 className="w-3.5 h-3.5 text-indigo-400" />
                Associated {task.relatedEntityDisplayName}
              </span>
              <div className="text-sm font-bold text-slate-200">
                {task.relatedEntityName || `Entity #${task.relatedEntityId}`}
              </div>
            </div>
          )}

          {/* Task Instructions */}
          <div className="p-4 rounded-xl bg-slate-950/50 border border-slate-800 space-y-2">
            <h4 className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
              <FileText className="w-4 h-4 text-amber-400" />
              Notes & Action Items
            </h4>
            <p className="text-xs text-slate-300 whitespace-pre-wrap leading-relaxed">
              {task.description || 'No detailed instructions provided.'}
            </p>
          </div>

          {/* Metadata Footer */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between text-[11px] text-slate-500 pt-3 border-t border-slate-800/80 gap-2">
            <span className="flex items-center gap-1.5">
              <Clock className="w-3.5 h-3.5" />
              <span>Created: {new Date(task.createdAt).toLocaleDateString()}</span>
              {task.createdByUserName && (
                <span className="text-slate-400">
                  by <strong className="text-slate-300">{task.createdByUserName}</strong>
                  {task.createdByRole && (
                    <span className="ml-1 text-[10px] uppercase px-1.5 py-0.2 rounded bg-slate-800 text-slate-400 border border-slate-700">
                      {task.createdByRole.replace('ROLE_', '')}
                    </span>
                  )}
                </span>
              )}
            </span>
            {task.completedAt && (
              <span className="text-emerald-400 flex items-center gap-1">
                <CheckCircle2 className="w-3.5 h-3.5" />
                Completed: {new Date(task.completedAt).toLocaleDateString()}
              </span>
            )}
          </div>
        </div>
      </div>
    </div>
    </ModalPortal>
  );
};
