import { ModalPortal } from '../ModalPortal';
import React, { useState } from 'react';
import { CallLog, CallOutcome, CallStatus, LogCallOutcomeRequest } from '../../types/call';
import { X, CheckCircle2, Trophy, ThumbsUp, CalendarCheck, FileText, PhoneOff, Voicemail } from 'lucide-react';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (id: number, data: LogCallOutcomeRequest) => Promise<void>;
  call: CallLog | null;
}

export const LogOutcomeModal: React.FC<Props> = ({ isOpen, onClose, onSubmit, call }) => {
  const [outcome, setOutcome] = useState<CallOutcome>('INTERESTED');
  const [status, setStatus] = useState<CallStatus>('COMPLETED');
  const [durationMinutes, setDurationMinutes] = useState<number>(call?.durationMinutes || 10);
  const [notes, setNotes] = useState(call?.notes || '');
  const [actionItems, setActionItems] = useState(call?.actionItems || '');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen || !call) return null;

  const outcomePresets: { outcome: CallOutcome; label: string; icon: any; color: string }[] = [
    { outcome: 'INTERESTED', label: 'Interested & Engaged', icon: ThumbsUp, color: 'hover:border-emerald-500' },
    { outcome: 'MEETING_BOOKED', label: 'Meeting Booked', icon: CalendarCheck, color: 'hover:border-indigo-500' },
    { outcome: 'QUOTE_REQUESTED', label: 'Quote Requested', icon: FileText, color: 'hover:border-cyan-500' },
    { outcome: 'DEAL_CLOSED', label: 'Deal Closed Won', icon: Trophy, color: 'hover:border-amber-500' },
    { outcome: 'LEFT_VOICEMAIL', label: 'Left Voicemail', icon: Voicemail, color: 'hover:border-purple-500' },
    { outcome: 'CALLBACK_REQUESTED', label: 'Callback Requested', icon: CheckCircle2, color: 'hover:border-blue-500' },
    { outcome: 'BUSY_NO_ANSWER', label: 'No Answer / Busy', icon: PhoneOff, color: 'hover:border-orange-500' },
  ];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setSubmitting(true);
      setError(null);

      const payload: LogCallOutcomeRequest = {
        outcome,
        status,
        durationMinutes: Number(durationMinutes),
        notes: notes || undefined,
        actionItems: actionItems || undefined,
        callEndTime: new Date().toISOString(),
      };

      await onSubmit(call.id, payload);
      onClose();
    } catch (err: any) {
      setError(err?.response?.data?.message || err.message || 'Failed to log call outcome');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <ModalPortal>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
      <div className="bg-slate-900 border border-slate-800 w-full max-w-lg rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-slate-950/40 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
              <CheckCircle2 className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-white">Log Call Outcome</h2>
              <p className="text-xs text-slate-400">Wrap up call #{call.id}: {call.title}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-200 hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scrollable Form Body */}
        <form onSubmit={handleSubmit} id="log-outcome-form" className="flex-1 overflow-y-auto p-6 space-y-4">
          {error && (
            <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-xs text-rose-300">
              {error}
            </div>
          )}

          {/* Quick Outcome Preset Chips */}
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-2">
              Select Call Outcome <span className="text-rose-400">*</span>
            </label>
            <div className="grid grid-cols-2 gap-2">
              {outcomePresets.map((preset) => {
                const Icon = preset.icon;
                const isSelected = outcome === preset.outcome;
                return (
                  <button
                    key={preset.outcome}
                    type="button"
                    onClick={() => {
                      setOutcome(preset.outcome);
                      if (preset.outcome === 'BUSY_NO_ANSWER') {
                        setStatus('NO_ANSWER');
                      } else {
                        setStatus('COMPLETED');
                      }
                    }}
                    className={`flex items-center gap-2 p-2.5 rounded-xl border text-xs font-medium transition-all text-left ${
                      isSelected
                        ? 'bg-indigo-600/20 border-indigo-500 text-indigo-300 font-semibold shadow-md shadow-indigo-500/10'
                        : 'bg-slate-950/40 border-slate-800 text-slate-300 hover:bg-slate-800/40'
                    }`}
                  >
                    <Icon className={`w-4 h-4 ${isSelected ? 'text-indigo-400' : 'text-slate-400'}`} />
                    <span className="truncate">{preset.label}</span>
                  </button>
                );
              })}
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">Final Status</label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value as CallStatus)}
                className="w-full px-3 py-2 rounded-xl bg-slate-950/60 border border-slate-800 text-xs text-slate-200"
              >
                <option value="COMPLETED">Completed</option>
                <option value="MISSED">Missed</option>
                <option value="BUSY">Line Busy</option>
                <option value="NO_ANSWER">No Answer</option>
                <option value="CANCELLED">Cancelled</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                Actual Duration (Minutes)
              </label>
              <input
                type="number"
                min="0"
                value={durationMinutes}
                onChange={(e) => setDurationMinutes(Number(e.target.value))}
                className="w-full px-3 py-2 rounded-xl bg-slate-950/60 border border-slate-800 text-xs text-slate-200"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5">
              Call Summary & Notes
            </label>
            <textarea
              rows={3}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="What was discussed? How did the client respond?..."
              className="w-full px-3.5 py-2 rounded-xl bg-slate-950/60 border border-slate-800 focus:border-indigo-500 text-xs text-slate-200 resize-none"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5">
              Action Items / Next Follow-up
            </label>
            <input
              type="text"
              value={actionItems}
              onChange={(e) => setActionItems(e.target.value)}
              placeholder="e.g. Schedule demo for Tuesday, send proposal..."
              className="w-full px-3.5 py-2 rounded-xl bg-slate-950/60 border border-slate-800 focus:border-indigo-500 text-xs text-slate-200"
            />
          </div>
        </form>

        {/* Fixed Footer */}
        <div className="px-6 py-4 border-t border-slate-800 bg-slate-950/40 flex items-center justify-end gap-3 shrink-0">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-xl text-xs font-medium text-slate-300 hover:bg-slate-800 transition-colors"
          >
            Cancel
          </button>
          <button
            type="submit"
            form="log-outcome-form"
            disabled={submitting}
            className="px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-xs font-semibold text-white shadow-lg shadow-emerald-600/30 transition-all"
          >
            {submitting ? 'Saving Outcome...' : 'Complete & Save'}
          </button>
        </div>
      </div>
    </div>
    </ModalPortal>
  );
};
