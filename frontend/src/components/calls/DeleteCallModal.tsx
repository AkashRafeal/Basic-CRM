import { ModalPortal } from '../ModalPortal';
import React, { useState } from 'react';
import { CallLog } from '../../types/call';
import { Trash2, X, AlertTriangle } from 'lucide-react';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (id: number) => Promise<void>;
  call: CallLog | null;
}

export const DeleteCallModal: React.FC<Props> = ({ isOpen, onClose, onConfirm, call }) => {
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen || !call) return null;

  const handleDelete = async () => {
    try {
      setSubmitting(true);
      setError(null);
      await onConfirm(call.id);
      onClose();
    } catch (err: any) {
      setError(err?.response?.data?.message || err.message || 'Failed to delete call log');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <ModalPortal>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
      <div className="relative w-full max-w-md rounded-2xl bg-slate-900 border border-slate-800 shadow-2xl p-6">
        <div className="flex items-center justify-between pb-3 border-b border-slate-800">
          <div className="flex items-center gap-2.5 text-rose-400">
            <AlertTriangle className="w-5 h-5" />
            <h3 className="text-base font-bold text-slate-100">Delete Call Record</h3>
          </div>
          <button onClick={onClose} className="p-1 text-slate-400 hover:text-slate-200">
            <X className="w-4 h-4" />
          </button>
        </div>

        {error && (
          <div className="mt-3 p-2.5 rounded-lg bg-rose-500/10 border border-rose-500/30 text-xs text-rose-300">
            {error}
          </div>
        )}

        <div className="mt-4 space-y-2 text-xs text-slate-300">
          <p>
            Are you sure you want to delete call log:
          </p>
          <div className="p-3 rounded-xl bg-slate-950/60 border border-slate-800">
            <p className="font-semibold text-slate-100">{call.title}</p>
            <p className="text-slate-400 mt-0.5">
              {call.contactName ? `${call.contactName} • ` : ''}
              {call.callType} • {call.status}
            </p>
          </div>
          <p className="text-slate-500 text-[11px]">This action cannot be undone.</p>
        </div>

        <div className="flex items-center justify-end gap-3 mt-6 pt-4 border-t border-slate-800">
          <button
            type="button"
            onClick={onClose}
            className="px-3.5 py-2 rounded-xl text-xs font-medium text-slate-300 hover:bg-slate-800 transition-colors"
          >
            Cancel
          </button>
          <button
            type="button"
            disabled={submitting}
            onClick={handleDelete}
            className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-500 disabled:opacity-50 text-xs font-semibold text-white shadow-lg shadow-rose-600/30 transition-all flex items-center gap-1.5"
          >
            <Trash2 className="w-3.5 h-3.5" />
            {submitting ? 'Deleting...' : 'Delete Call Log'}
          </button>
        </div>
      </div>
    </div>
    </ModalPortal>
  );
};
