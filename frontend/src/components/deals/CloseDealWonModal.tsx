import { ModalPortal } from '../ModalPortal';
import React from 'react';
import { Deal } from '../../types/deal';
import { useAuth } from '../../context/AuthContext';
import { Trophy, X, AlertCircle } from 'lucide-react';

interface CloseDealWonModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => Promise<void>;
  deal: Deal | null;
  loading: boolean;
}

export const CloseDealWonModal: React.FC<CloseDealWonModalProps> = ({
  isOpen,
  onClose,
  onConfirm,
  deal,
  loading,
}) => {
  const { user } = useAuth();
  const isEmployee = user?.role === 'ROLE_EMPLOYEE';

  if (!isOpen || !deal) return null;

  return (
    <ModalPortal>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-fade-in">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-md overflow-hidden shadow-2xl animate-scale-up">
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-slate-900/50">
          <div className="flex items-center space-x-2 text-amber-400">
            <Trophy className="w-5 h-5" />
            <h3 className="text-base font-bold text-slate-100">Celebrate & Close Deal WON</h3>
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
            Mark <span className="font-bold text-slate-100">"{deal.dealName}"</span> as{' '}
            <span className="text-emerald-400 font-bold">CLOSED WON</span> with a contract value of{' '}
            <span className="text-emerald-400 font-bold">₹{deal.amount?.toLocaleString()}</span>?
          </p>
          <p className="text-xs text-emerald-400/90 bg-emerald-500/10 border border-emerald-500/20 p-3 rounded-xl space-y-1">
            <span className="font-bold block">🎉 Automated Customer Account Provisioning:</span>
            <span className="block">
              Marking this deal Closed Won automatically creates or upgrades the active account in <strong>Customer Accounts</strong> with recognized ARR of <strong>₹{deal.amount?.toLocaleString()}</strong>, syncs purchased product subscriptions, converts any linked sales lead, and schedules onboarding tasks.
            </span>
          </p>
          {isEmployee && (
            <div className="text-[11px] text-amber-300/90 bg-amber-500/10 border border-amber-500/20 p-2.5 rounded-xl flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-amber-400 shrink-0" />
              <span>Note: As a Sales Representative, this closure will be recorded for Manager review & sign-off.</span>
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
            <button
              type="button"
              onClick={onConfirm}
              disabled={loading}
              className="px-5 py-2 bg-emerald-600 hover:bg-emerald-500 text-white text-sm font-semibold rounded-xl shadow-lg shadow-emerald-500/20 transition-all disabled:opacity-50"
            >
              {loading ? 'Closing Deal...' : 'Confirm Closed Won'}
            </button>
          </div>
        </div>
      </div>
    </div>
    </ModalPortal>
  );
};
