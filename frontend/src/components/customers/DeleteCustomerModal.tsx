import { ModalPortal } from '../ModalPortal';
import React, { useState } from 'react';
import { Customer } from '../../types/customer';
import { Trash2, Archive, X, FileText } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

interface DeleteCustomerModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (permanent: boolean, reason?: string) => Promise<void>;
  customer: Customer | null;
  loading: boolean;
  isPermanent?: boolean;
}

export const DeleteCustomerModal: React.FC<DeleteCustomerModalProps> = ({
  isOpen,
  onClose,
  onConfirm,
  customer,
  loading,
  isPermanent = false,
}) => {
  const { user } = useAuth();
  const [deleteReason, setDeleteReason] = useState('');
  const [forcePermanent, setForcePermanent] = useState(isPermanent);

  if (!isOpen || !customer) return null;

  const isAdmin = user?.role === 'ROLE_ADMIN';
  const isManager = user?.role === 'ROLE_MANAGER';

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const shouldHardDelete = Boolean(isAdmin && (forcePermanent || isPermanent || customer.isDeleted));
    await onConfirm(shouldHardDelete, deleteReason);
  };

  return (
    <ModalPortal>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-fade-in">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-md overflow-hidden shadow-2xl animate-scale-up">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-slate-900/50">
          <div className="flex items-center space-x-2 text-rose-400">
            {isAdmin && (forcePermanent || isPermanent || customer.isDeleted) ? (
              <Trash2 className="w-5 h-5" />
            ) : (
              <Archive className="w-5 h-5 text-amber-400" />
            )}
            <h3 className="text-base font-bold text-slate-100">
              {isAdmin && (forcePermanent || isPermanent || customer.isDeleted)
                ? 'Permanently Delete Customer'
                : isManager
                ? 'Request Customer Deletion'
                : 'Soft Delete / Move to Trash'}
            </h3>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-200 p-1.5 rounded-lg hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <p className="text-sm text-slate-300">
            {isAdmin && (forcePermanent || isPermanent || customer.isDeleted) ? (
              <>
                Are you sure you want to <span className="text-rose-400 font-bold">permanently delete</span> the customer account for{' '}
                <strong className="text-slate-100">{customer.name}</strong> ({customer.company || customer.email})?
              </>
            ) : isManager ? (
              <>
                Submit a deletion request for <strong className="text-slate-100">{customer.name}</strong>. This account will be moved to soft-deleted status and flagged for Admin review.
              </>
            ) : (
              <>
                Move <strong className="text-slate-100">{customer.name}</strong> to the soft-deleted trash pool. It can be restored later by an Admin.
              </>
            )}
          </p>

          {isManager && (
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5 flex items-center gap-1.5">
                <FileText className="w-3.5 h-3.5 text-slate-400" />
                Reason for Deletion Request
              </label>
              <textarea
                rows={2}
                value={deleteReason}
                onChange={(e) => setDeleteReason(e.target.value)}
                placeholder="e.g., Client requested termination, duplicate account, inactive..."
                className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-slate-200 text-xs focus:outline-none focus:border-amber-500"
              />
            </div>
          )}

          {isAdmin && !customer.isDeleted && !isPermanent && (
            <div className="flex items-center space-x-2.5 p-3 bg-slate-950/60 border border-slate-800 rounded-xl">
              <input
                type="checkbox"
                id="forcePermanent"
                checked={forcePermanent}
                onChange={(e) => setForcePermanent(e.target.checked)}
                className="w-4 h-4 rounded text-rose-600 bg-slate-900 border-slate-700 focus:ring-rose-500"
              />
              <label htmlFor="forcePermanent" className="text-xs text-slate-300 cursor-pointer">
                Permanently delete from database (cannot be restored)
              </label>
            </div>
          )}

          <p className="text-xs text-amber-400/90 bg-amber-500/10 border border-amber-500/20 p-3 rounded-xl">
            {isAdmin && (forcePermanent || isPermanent || customer.isDeleted)
              ? '⚠️ Warning: Permanent deletion will completely remove all records and ARR history from the database.'
              : 'ℹ️ Soft deletion archives the customer and excludes it from active pipelines while preserving historical audit logs.'}
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
              type="submit"
              disabled={loading}
              className={`px-5 py-2 text-white text-sm font-semibold rounded-xl shadow-lg transition-all disabled:opacity-50 ${
                isAdmin && (forcePermanent || isPermanent || customer.isDeleted)
                  ? 'bg-rose-600 hover:bg-rose-500 shadow-rose-600/20'
                  : 'bg-amber-600 hover:bg-amber-500 shadow-amber-600/20'
              }`}
            >
              {loading
                ? 'Processing...'
                : isAdmin && (forcePermanent || isPermanent || customer.isDeleted)
                ? 'Permanently Delete'
                : isManager
                ? 'Request Deletion'
                : 'Move to Trash'}
            </button>
          </div>
        </form>
      </div>
    </div>
    </ModalPortal>
  );
};
