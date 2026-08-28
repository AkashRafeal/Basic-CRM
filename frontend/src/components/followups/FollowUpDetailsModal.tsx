import { ModalPortal } from '../ModalPortal';
import React from 'react';
import { FollowUp } from '../../types/followup';
import { FollowUpStatusBadge } from './FollowUpStatusBadge';
import { FollowUpOutcomeBadge } from './FollowUpOutcomeBadge';
import { FollowUpChannelBadge } from './FollowUpChannelBadge';
import {
  X,
  PhoneCall,
  Calendar,
  User as UserIcon,
  Link2,
  FileText,
  Clock,
  Edit2,
  CheckCircle2,
} from 'lucide-react';

interface FollowUpDetailsModalProps {
  isOpen: boolean;
  onClose: () => void;
  followUp: FollowUp | null;
  onOpenLogOutcome: (followUp: FollowUp) => void;
  onEdit: (followUp: FollowUp) => void;
}

export const FollowUpDetailsModal: React.FC<FollowUpDetailsModalProps> = ({
  isOpen,
  onClose,
  followUp,
  onOpenLogOutcome,
  onEdit,
}) => {
  if (!isOpen || !followUp) return null;

  return (
    <ModalPortal>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 modal-overlay-blur animate-fade-in">
      <div className="bg-slate-900/95 border border-slate-700/80 rounded-2xl w-full max-w-2xl overflow-hidden shadow-2xl shadow-black/80 animate-scale-up max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-start justify-between px-6 py-5 border-b border-slate-800 bg-slate-900/60">
          <div className="flex items-start space-x-3.5">
            <div className="w-10 h-10 rounded-xl bg-indigo-600/15 border border-indigo-500/30 flex items-center justify-center text-indigo-400 font-bold">
              <PhoneCall className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <FollowUpChannelBadge channel={followUp.channel} />
                <FollowUpStatusBadge status={followUp.status} />
              </div>
              <h3 className="text-lg font-bold text-slate-100 mt-1">{followUp.title}</h3>
            </div>
          </div>
          <div className="flex items-center space-x-2">
            <button
              onClick={() => {
                onClose();
                onEdit(followUp);
              }}
              className="p-2 text-slate-400 hover:text-amber-400 rounded-xl hover:bg-slate-800 transition-colors"
              title="Edit Follow-up"
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
          {/* Quick Metrics Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="p-3.5 rounded-xl bg-slate-950/70 border border-slate-800">
              <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block">
                Outcome
              </span>
              <div className="mt-1">
                <FollowUpOutcomeBadge outcome={followUp.outcome} />
              </div>
            </div>

            <div className="p-3.5 rounded-xl bg-slate-950/70 border border-slate-800">
              <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block">
                Scheduled At
              </span>
              <div className="text-xs font-bold text-slate-200 mt-1 flex items-center gap-1.5">
                <Calendar className="w-3.5 h-3.5 text-slate-500" />
                <span>{new Date(followUp.scheduledAt).toLocaleString()}</span>
                {followUp.isOverdue && (
                  <span className="text-[10px] text-rose-400 bg-rose-500/10 border border-rose-500/20 px-1.5 py-0.5 rounded font-bold">
                    Overdue
                  </span>
                )}
              </div>
            </div>

            <div className="p-3.5 rounded-xl bg-slate-950/70 border border-slate-800">
              <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block">
                Assigned Rep
              </span>
              <div className="text-xs font-bold text-slate-200 mt-1 truncate flex items-center gap-1.5">
                <UserIcon className="w-3.5 h-3.5 text-slate-500" />
                <span>{followUp.assignedToUserName || 'Unassigned'}</span>
              </div>
            </div>
          </div>

          {/* Action Trigger for Outcome Logging */}
          {followUp.status !== 'COMPLETED' && (
            <div className="p-4 rounded-xl bg-indigo-950/30 border border-indigo-500/30 flex items-center justify-between">
              <div>
                <h4 className="text-xs font-bold text-indigo-200">Ready to complete this touchpoint?</h4>
                <p className="text-[11px] text-indigo-300/80 mt-0.5">Record customer outcome and auto-schedule next cadence</p>
              </div>
              <button
                onClick={() => {
                  onClose();
                  onOpenLogOutcome(followUp);
                }}
                className="flex items-center gap-1.5 px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold rounded-xl shadow transition-colors"
              >
                <CheckCircle2 className="w-3.5 h-3.5" />
                Log Outcome
              </button>
            </div>
          )}

          {/* Related Target Association */}
          <div className="p-3.5 rounded-xl bg-slate-950/50 border border-slate-800 space-y-1">
            <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider flex items-center gap-1">
              <Link2 className="w-3.5 h-3.5 text-indigo-400" />
              Target {followUp.targetTypeDisplayName}
            </span>
            <div className="text-sm font-bold text-slate-200">
              {followUp.targetName || `Target #${followUp.targetId}`}
            </div>
          </div>

          {/* Notes and logs */}
          <div className="p-4 rounded-xl bg-slate-950/50 border border-slate-800 space-y-2">
            <h4 className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
              <FileText className="w-4 h-4 text-amber-400" />
              Notes, Agenda & Conversation Logs
            </h4>
            <p className="text-xs text-slate-300 whitespace-pre-wrap leading-relaxed">
              {followUp.notes || 'No detailed discussion notes recorded.'}
            </p>
          </div>

          {/* Metadata Footer */}
          <div className="flex flex-wrap items-center justify-between gap-2 text-[11px] text-slate-500 pt-3 border-t border-slate-800/80">
            <span className="flex items-center gap-1">
              <Clock className="w-3.5 h-3.5" />
              Created: {new Date(followUp.createdAt).toLocaleDateString()}
              {followUp.createdByUserName && (
                <span className="text-slate-400">
                  {' '}by <strong className="text-slate-300">{followUp.createdByUserName}</strong>
                  {followUp.createdByRole && (
                    <span className="text-[10px] ml-1 px-1.5 py-0.2 rounded bg-slate-800 text-indigo-300 font-mono">
                      {followUp.createdByRole.replace('ROLE_', '')}
                    </span>
                  )}
                </span>
              )}
            </span>
            {followUp.completedAt && (
              <span className="text-emerald-400 flex items-center gap-1">
                <CheckCircle2 className="w-3.5 h-3.5" />
                Completed: {new Date(followUp.completedAt).toLocaleString()}
              </span>
            )}
          </div>
        </div>
      </div>
    </div>
    </ModalPortal>
  );
};
