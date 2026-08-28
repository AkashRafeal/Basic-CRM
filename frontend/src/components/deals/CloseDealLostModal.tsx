import { ModalPortal } from '../ModalPortal';
import React, { useState } from 'react';
import { Deal } from '../../types/deal';
import { useAuth } from '../../context/AuthContext';
import { XCircle, X, AlertCircle } from 'lucide-react';

interface CloseDealLostModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (lossReason: string) => Promise<void>;
  deal: Deal | null;
  loading: boolean;
}

export const CloseDealLostModal: React.FC<CloseDealLostModalProps> = ({
  isOpen,
  onClose,
  onConfirm,
  deal,
  loading,
}) => {
  const { user } = useAuth();
  const isEmployee = user?.role === 'ROLE_EMPLOYEE';
  const [lossReason, setLossReason] = useState('Competitor offered lower pricing');

  if (!isOpen || !deal) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onConfirm(lossReason);
  };

  return (
    <ModalPortal>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-fade-in">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-md overflow-hidden shadow-2xl animate-scale-up">
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-slate-900/50">
          <div className="flex items-center space-x-2 text-rose-400">
            <XCircle className="w-5 h-5" />
            <h3 className="text-base font-bold text-slate-100">Close Deal as LOST</h3>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-200 p-1.5 rounded-lg hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <p className="text-sm text-slate-300">
            Mark opportunity <span className="font-bold text-slate-100">"{deal.dealName}"</span> as{' '}
            <span className="text-rose-400 font-bold">CLOSED LOST</span>.
          </p>

          {isEmployee && (
            <div className="text-[11px] text-amber-300/90 bg-amber-500/10 border border-amber-500/20 p-2.5 rounded-xl flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-amber-400 shrink-0" />
              <span>Note: As a Sales Representative, this closure will be recorded for Manager review & sign-off.</span>
            </div>
          )}

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5">
              Primary Reason for Loss *
            </label>
            <select
              value={lossReason}
              onChange={(e) => setLossReason(e.target.value)}
              className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-slate-200 text-sm focus:outline-none focus:border-indigo-500"
            >
              <option value="Competitor offered lower pricing">Competitor offered lower pricing</option>
              <option value="Client budget freeze / cancelled initiative">Client budget freeze / cancelled initiative</option>
              <option value="Missing enterprise feature requirements">Missing enterprise feature requirements</option>
              <option value="Internal leadership restructuring">Internal leadership restructuring</option>
              <option value="Delayed timeline / No immediate urgency">Delayed timeline / No immediate urgency</option>
              <option value="Other">Other</option>
            </select>
          </div>

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
              type="submit"
              disabled={loading}
              className="px-5 py-2 bg-rose-600 hover:bg-rose-500 text-white text-sm font-semibold rounded-xl shadow-lg shadow-rose-600/20 transition-all disabled:opacity-50"
            >
              {loading ? 'Updating...' : 'Mark as Closed Lost'}
            </button>
          </div>
        </form>
      </div>
    </div>
    </ModalPortal>
  );
};
