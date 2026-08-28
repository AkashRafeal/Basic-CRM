import { ModalPortal } from '../ModalPortal';
import React from 'react';
import { Deal } from '../../types/deal';
import { AlertTriangle, X } from 'lucide-react';

interface DeleteDealModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => Promise<void>;
  deal: Deal | null;
  loading: boolean;
}

export const DeleteDealModal: React.FC<DeleteDealModalProps> = ({
  isOpen,
  onClose,
  onConfirm,
  deal,
  loading,
}) => {
  if (!isOpen || !deal) return null;

  return (
    <ModalPortal>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-fade-in">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-md overflow-hidden shadow-2xl animate-scale-up">
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-slate-900/50">
          <div className="flex items-center space-x-2 text-rose-400">
            <AlertTriangle className="w-5 h-5" />
            <h3 className="text-base font-bold text-slate-100">Delete Deal</h3>
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
            Are you sure you want to permanently delete the deal{' '}
            <span className="font-bold text-slate-100">"{deal.dealName}"</span> worth{' '}
            <span className="text-indigo-400 font-bold">₹{deal.amount?.toLocaleString()}</span>?
          </p>
          <p className="text-xs text-rose-400/80 bg-rose-500/10 border border-rose-500/20 p-3 rounded-xl">
            ⚠️ This will remove this opportunity from your active pipeline value and historical forecast analytics.
          </p>

          <div className="flex items-center justify-end space-x-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              disabled={loading}
              className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 text-sm font-medium rounded-xl transition-colors"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={onConfirm}
              disabled={loading}
              className="px-5 py-2 bg-rose-600 hover:bg-rose-500 text-white text-sm font-semibold rounded-xl shadow-lg shadow-rose-600/20 transition-all disabled:opacity-50"
            >
              {loading ? 'Deleting...' : 'Delete Deal'}
            </button>
          </div>
        </div>
      </div>
    </div>
    </ModalPortal>
  );
};
