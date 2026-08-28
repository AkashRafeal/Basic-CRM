import { ModalPortal } from '../ModalPortal';
import React, { useState } from 'react';
import { FollowUp, CompleteFollowUpRequest, FollowUpOutcome } from '../../types/followup';
import { X, CheckCircle2, Sparkles, Calendar, FileText } from 'lucide-react';

interface LogOutcomeModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (id: number, data: CompleteFollowUpRequest) => Promise<void>;
  followUp: FollowUp | null;
}

export const LogOutcomeModal: React.FC<LogOutcomeModalProps> = ({
  isOpen,
  onClose,
  onSubmit,
  followUp,
}) => {
  const [outcome, setOutcome] = useState<FollowUpOutcome>('INTERESTED');
  const [notes, setNotes] = useState('');
  const [scheduleNext, setScheduleNext] = useState(true);
  const [nextFollowUpDate, setNextFollowUpDate] = useState(
    new Date(Date.now() + 86400000 * 3).toISOString().slice(0, 16)
  );

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen || !followUp) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setLoading(true);
      setError(null);

      const requestData: CompleteFollowUpRequest = {
        outcome,
        notes: notes.trim() || undefined,
        nextFollowUpDate: scheduleNext && nextFollowUpDate
          ? (nextFollowUpDate.length === 16 ? `${nextFollowUpDate}:00` : nextFollowUpDate)
          : undefined,
      };

      await onSubmit(followUp.id, requestData);
      onClose();
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to log outcome.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <ModalPortal>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 modal-overlay-blur animate-fade-in">
      <div className="bg-slate-900/95 border border-slate-700/80 rounded-2xl w-full max-w-xl overflow-hidden shadow-2xl shadow-black/80 animate-scale-up max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-slate-900/50">
          <div className="flex items-center space-x-2.5">
            <div className="w-8 h-8 rounded-xl bg-emerald-600/20 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
              <CheckCircle2 className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-100">Log Interaction Outcome</h3>
              <p className="text-xs text-slate-400 mt-0.5">{followUp.title} ({followUp.targetName})</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-200 p-1.5 rounded-lg hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="overflow-y-auto p-6 space-y-4 flex-1">
          {error && (
            <div className="p-3 bg-rose-500/10 border border-rose-500/30 rounded-xl text-rose-400 text-xs">
              {error}
            </div>
          )}

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5">
              Select Interaction Outcome *
            </label>
            <select
              value={outcome}
              onChange={(e) => setOutcome(e.target.value as FollowUpOutcome)}
              className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-slate-200 text-sm focus:outline-none focus:border-indigo-500"
            >
              <option value="INTERESTED">✨ Client Interested / Proceeding</option>
              <option value="PROPOSAL_REQUESTED">📄 Formal Proposal Requested</option>
              <option value="MEETING_BOOKED">📅 Demo / Next Meeting Booked</option>
              <option value="CALLBACK_REQUESTED">📞 Requested Callback Later</option>
              <option value="DEAL_WON">🏆 Deal Won / Closed</option>
              <option value="NOT_INTERESTED">🚫 Not Interested / Bad Fit</option>
              <option value="NO_ANSWER">📵 No Answer / Left Voicemail</option>
              <option value="DEAL_LOST">❌ Deal Lost to Competitor</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5">
              Call / Discussion Notes & Key Takeaways
            </label>
            <div className="relative">
              <FileText className="w-4 h-4 text-slate-500 absolute left-3 top-3" />
              <textarea
                rows={3}
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="What was agreed upon? Client feedback, budget constraints, timeline..."
                className="w-full pl-9 pr-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-slate-200 text-sm focus:outline-none focus:border-indigo-500"
              />
            </div>
          </div>

          {/* Optional Next Follow-Up Auto-Scheduler */}
          <div className="p-4 rounded-xl bg-slate-950/60 border border-slate-800 space-y-3">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-slate-200 flex items-center gap-1.5 cursor-pointer">
                <Sparkles className="w-3.5 h-3.5 text-indigo-400" />
                Auto-Schedule Next Cadence Touchpoint
              </label>
              <input
                type="checkbox"
                checked={scheduleNext}
                onChange={(e) => setScheduleNext(e.target.checked)}
                className="rounded border-slate-800 text-indigo-600 focus:ring-0 w-4 h-4 cursor-pointer"
              />
            </div>

            {scheduleNext && (
              <div className="space-y-1.5 pt-1">
                <span className="text-[11px] text-slate-400 block">Next Interaction Date & Time</span>
                <div className="relative">
                  <Calendar className="w-4 h-4 text-slate-500 absolute left-3 top-3" />
                  <input
                    type="datetime-local"
                    value={nextFollowUpDate}
                    onChange={(e) => setNextFollowUpDate(e.target.value)}
                    className="w-full pl-9 pr-3 py-2 bg-slate-900 border border-slate-800 rounded-xl text-slate-200 text-xs focus:outline-none focus:border-indigo-500"
                  />
                </div>
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="flex items-center justify-end space-x-3 pt-4 border-t border-slate-800">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 text-sm font-medium rounded-xl transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-5 py-2 bg-emerald-600 hover:bg-emerald-500 text-white text-sm font-semibold rounded-xl shadow-lg shadow-emerald-500/20 transition-all disabled:opacity-50"
            >
              {loading ? 'Saving...' : 'Save & Complete Log'}
            </button>
          </div>
        </form>
      </div>
    </div>
    </ModalPortal>
  );
};
