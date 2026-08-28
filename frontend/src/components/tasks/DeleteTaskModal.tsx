import { ModalPortal } from '../ModalPortal';
import React from 'react';
import { Task } from '../../types/task';
import { useAuth } from '../../context/AuthContext';
import { checkTaskDeletePermission } from '../../utils/taskPermissions';
import { AlertTriangle, ShieldAlert, Archive, Trash2, X } from 'lucide-react';

interface DeleteTaskModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (permanent?: boolean) => Promise<void>;
  task: Task | null;
  loading: boolean;
}

export const DeleteTaskModal: React.FC<DeleteTaskModalProps> = ({
  isOpen,
  onClose,
  onConfirm,
  task,
  loading,
}) => {
  const { user } = useAuth();

  if (!isOpen || !task) return null;

  const perm = checkTaskDeletePermission(task, user);
  const isManager = user?.role === 'ROLE_MANAGER';
  const isAdmin = user?.role === 'ROLE_ADMIN';

  return (
    <ModalPortal>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 modal-overlay-blur animate-fade-in">
      <div className="bg-slate-900/95 border border-slate-700/80 rounded-2xl w-full max-w-md overflow-hidden shadow-2xl shadow-black/80 animate-scale-up">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-slate-900/50">
          <div className="flex items-center space-x-2 text-rose-400">
            {perm.allowed ? <AlertTriangle className="w-5 h-5" /> : <ShieldAlert className="w-5 h-5 text-amber-400" />}
            <h3 className="text-base font-bold text-slate-100">
              {perm.allowed ? (isManager ? 'Archive Task' : 'Delete Task') : 'Permission Restricted'}
            </h3>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-200 p-1.5 rounded-lg hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 space-y-4">
          <p className="text-sm text-slate-300">
            Target task: <span className="font-bold text-slate-100">"{task.title}"</span>
          </p>

          {/* If NOT allowed due to Manager restriction */}
          {!perm.allowed ? (
            <div className="p-4 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-300 space-y-2">
              <div className="flex items-center gap-2 font-semibold text-xs text-amber-200">
                <ShieldAlert className="w-4 h-4 shrink-0" />
                <span>Manager Role Restriction</span>
              </div>
              <p className="text-xs text-slate-300 leading-relaxed">
                {perm.reason}
              </p>
              <div className="text-[11px] text-slate-400 pt-1 border-t border-amber-500/20">
                Contact a System Administrator if you need this task removed.
              </div>
            </div>
          ) : (
            <>
              {isManager && (
                <div className="p-3.5 rounded-xl bg-indigo-950/30 border border-indigo-500/30 text-xs text-indigo-200 space-y-1">
                  <div className="flex items-center gap-1.5 font-semibold text-indigo-300">
                    <Archive className="w-4 h-4 text-indigo-400" />
                    <span>Manager Soft Deletion Policy</span>
                  </div>
                  <p className="text-[11px] text-slate-300">
                    This task will be archived (Soft Deleted). Managers are restricted from permanently deleting CRM tasks.
                  </p>
                </div>
              )}

              {isAdmin && (
                <p className="text-xs text-rose-400/80 bg-rose-500/10 border border-rose-500/20 p-3 rounded-xl">
                  ⚠️ As an Administrator, you have full deletion rights.
                </p>
              )}
            </>
          )}

          <div className="flex items-center justify-end space-x-3 pt-2 border-t border-slate-800">
            <button
              type="button"
              onClick={onClose}
              disabled={loading}
              className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 text-sm font-medium rounded-xl transition-colors"
            >
              Cancel
            </button>
            {perm.allowed && (
              <button
                type="button"
                onClick={() => onConfirm(false)}
                disabled={loading}
                className="px-5 py-2 bg-rose-600 hover:bg-rose-500 text-white text-sm font-semibold rounded-xl shadow-lg shadow-rose-600/20 transition-all disabled:opacity-50 flex items-center gap-1.5"
              >
                <Trash2 className="w-4 h-4" />
                {loading ? 'Processing...' : (isManager ? 'Archive Task' : 'Delete Task')}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
    </ModalPortal>
  );
};
