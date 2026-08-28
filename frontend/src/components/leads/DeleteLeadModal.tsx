import { ModalPortal } from '../ModalPortal';
import React from 'react';
import { Lead } from '../../types/lead';
import { AlertTriangle, X } from 'lucide-react';

interface DeleteLeadModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => Promise<void>;
  lead: Lead | null;
  loading: boolean;
}

export const DeleteLeadModal: React.FC<DeleteLeadModalProps> = ({
  isOpen,
  onClose,
  onConfirm,
  lead,
  loading
}) => {
  if (!isOpen || !lead) return null;

  return (
    <ModalPortal>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-fade-in">
      <div className="bg-slate-900 border border-rose-500/20 rounded-2xl w-full max-w-md overflow-hidden shadow-2xl animate-scale-up">
        <div className="p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="w-12 h-12 rounded-2xl bg-rose-500/10 border border-rose-500/20 flex items-center justify-center text-rose-500">
              <AlertTriangle className="w-6 h-6" />
            </div>
            <button
              onClick={onClose}
              className="text-slate-400 hover:text-slate-200 p-1.5 rounded-lg hover:bg-slate-800 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <h3 className="text-lg font-bold text-slate-100 mb-2">
            Delete Lead?
          </h3>
          <p className="text-sm text-slate-400 leading-relaxed mb-6">
            Are you sure you want to delete lead <span className="font-semibold text-slate-200">{lead.fullName}</span> from <span className="font-semibold text-slate-200">{lead.company || 'CRM'}</span>? This action cannot be undone.
          </p>

          <div className="flex items-center justify-end space-x-3">
            <button
              type="button"
              onClick={onClose}
              disabled={loading}
              className="px-4 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 text-sm font-medium rounded-xl transition-colors"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={onConfirm}
              disabled={loading}
              className="px-5 py-2.5 bg-rose-600 hover:bg-rose-500 text-white text-sm font-semibold rounded-xl shadow-lg shadow-rose-600/20 transition-all disabled:opacity-50"
            >
              {loading ? 'Deleting...' : 'Yes, Delete'}
            </button>
          </div>
        </div>
      </div>
    </div>
    </ModalPortal>
  );
};
