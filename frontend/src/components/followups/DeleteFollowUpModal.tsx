import { ModalPortal } from '../ModalPortal';
import React from 'react';
import { FollowUp } from '../../types/followup';
import { useAuth } from '../../context/AuthContext';
import { checkFollowUpDeletePermission } from '../../utils/followUpPermissions';
import { AlertTriangle, ShieldAlert, ShieldCheck, X } from 'lucide-react';

interface DeleteFollowUpModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => Promise<void>;
  followUp: FollowUp | null;
  loading: boolean;
}

export const DeleteFollowUpModal: React.FC<DeleteFollowUpModalProps> = ({
  isOpen,
  onClose,
  onConfirm,
  followUp,
  loading,
}) => {
  const { user } = useAuth();

  if (!isOpen || !followUp) return null;

  const perm = checkFollowUpDeletePermission(followUp, user);
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
              {perm.allowed ? (isManager ? 'Archive Follow-Up' : 'Delete Follow-Up') : 'Permission Restricted'}
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
            {perm.allowed ? (
              isManager ? (
                <>Are you sure you want to remove follow-up <span className="font-bold text-slate-100">"{followUp.title}"</span>? This will archive the touchpoint from active schedules.</>
              ) : (
                <>Are you sure you want to delete follow-up <span className="font-bold text-slate-100">"{followUp.title}"</span>?</>
              )
            ) : (
              <span className="text-slate-300">You do not have permission to delete follow-up <span className="font-bold text-slate-100">"{followUp.title}"</span>.</span>
            )}
          </p>

          {/* Manager Soft Delete / Audit Banner */}
          {perm.allowed && isManager && (
            <div className="flex items-start space-x-2.5 p-3 rounded-xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-300 text-xs">
              <ShieldCheck className="w-4 h-4 mt-0.5 shrink-0 text-indigo-400" />
              <div>
                <span className="font-semibold text-indigo-200">Manager Archival (Soft Delete):</span>
                <p className="mt-0.5 text-indigo-300/90">This touchpoint will be archived from active schedules. Completed and Admin tasks remain protected.</p>
              </div>
            </div>
          )}

          {/* Admin Permanent Delete Warning */}
          {perm.allowed && isAdmin && (
            <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-xs text-rose-300/90">
              ⚠️ Administrator action: This touchpoint will be removed and archived from active CRM schedules.
            </div>
          )}

          {/* Permission Blocked Reason Alert */}
          {!perm.allowed && perm.reason && (
            <div className="flex items-start space-x-2.5 p-3.5 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-300 text-xs">
              <ShieldAlert className="w-4 h-4 mt-0.5 shrink-0 text-amber-400" />
              <div>
                <span className="font-bold text-amber-200">Manager Restriction Enforced:</span>
                <p className="mt-0.5 text-amber-300/90">{perm.reason}</p>
              </div>
            </div>
          )}

          <div className="flex items-center justify-end space-x-3 pt-2">
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
                onClick={onConfirm}
                disabled={loading}
                className={`px-5 py-2 text-white text-sm font-semibold rounded-xl shadow-lg transition-all disabled:opacity-50 ${
                  isManager 
                    ? 'bg-amber-600 hover:bg-amber-500 shadow-amber-600/20' 
                    : 'bg-rose-600 hover:bg-rose-500 shadow-rose-600/20'
                }`}
              >
                {loading ? 'Processing...' : isManager ? 'Archive Follow-Up' : 'Delete Follow-Up'}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
    </ModalPortal>
  );
};
