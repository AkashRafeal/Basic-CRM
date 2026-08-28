import React, { useState } from 'react';
import { createPortal } from 'react-dom';
import { CommunicationLog } from '../../types/communication';
import { X, AlertTriangle, Trash2 } from 'lucide-react';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (id: number) => Promise<void>;
  message: CommunicationLog | null;
}

export const DeleteMessageModal: React.FC<Props> = ({
  isOpen,
  onClose,
  onConfirm,
  message,
}) => {
  const [deleting, setDeleting] = useState(false);

  if (!isOpen || !message) return null;

  const handleDelete = async () => {
    try {
      setDeleting(true);
      await onConfirm(message.id);
      onClose();
    } catch (err) {
      console.error('Failed to delete message:', err);
    } finally {
      setDeleting(false);
    }
  };

  return createPortal(
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/50 backdrop-blur-sm animate-fadeIn">
      <div className="bg-slate-900 border border-slate-800 w-full max-w-md rounded-2xl shadow-2xl p-6 space-y-5">
        <div className="flex items-center justify-between">
          <div className="w-12 h-12 rounded-2xl bg-rose-500/10 border border-rose-500/20 flex items-center justify-center text-rose-400">
            <AlertTriangle className="w-6 h-6" />
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-200 hover:bg-slate-800 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div>
          <h3 className="text-base font-bold text-slate-100">Delete Communication Log</h3>
          <p className="text-xs text-slate-400 mt-1.5 leading-relaxed">
            Are you sure you want to delete message log{' '}
            <strong className="text-slate-200">"{message.subject}"</strong>? This will permanently remove the record and thread tracking from the CRM.
          </p>
        </div>

        <div className="flex items-center justify-end gap-3 pt-2">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-xl text-xs font-medium text-slate-300 hover:bg-slate-800 transition-colors"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleDelete}
            disabled={deleting}
            className="px-5 py-2 rounded-xl bg-rose-600 hover:bg-rose-500 disabled:opacity-50 text-xs font-semibold text-white shadow-lg shadow-rose-600/30 flex items-center gap-1.5 transition-all"
          >
            <Trash2 className="w-3.5 h-3.5" />
            {deleting ? 'Deleting...' : 'Delete Log'}
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
};
