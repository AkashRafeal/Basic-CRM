import { ModalPortal } from '../ModalPortal';
import React, { useState } from 'react';
import { Contact, RelinkContactRequest } from '../../types/contact';
import { Customer } from '../../types/customer';
import { Link2, X, AlertCircle } from 'lucide-react';

interface RelinkContactModalProps {
  isOpen: boolean;
  onClose: () => void;
  onRelink: (contactId: number, data: RelinkContactRequest) => Promise<void>;
  contact: Contact | null;
  allowedCustomers: Customer[];
  userRoleLabel: string;
}

export const RelinkContactModal: React.FC<RelinkContactModalProps> = ({
  isOpen,
  onClose,
  onRelink,
  contact,
  allowedCustomers,
  userRoleLabel,
}) => {
  const [selectedCustomerId, setSelectedCustomerId] = useState<number | ''>(contact?.customerId || '');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen || !contact) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedCustomerId) return;

    const chosenCust = allowedCustomers.find((c) => c.id === Number(selectedCustomerId));

    try {
      setLoading(true);
      setError(null);
      await onRelink(contact.id, {
        customerId: Number(selectedCustomerId),
        customerName: chosenCust ? chosenCust.name : undefined,
      });
      onClose();
    } catch (err: any) {
      setError(err?.response?.data?.message || err.message || 'Failed to re-link contact');
    } finally {
      setLoading(false);
    }
  };

  return (
    <ModalPortal>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-fadeIn">
      <div className="bg-slate-900 border border-slate-800 w-full max-w-md rounded-2xl shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="p-6 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-cyan-500/10 border border-cyan-500/20 text-cyan-400 flex items-center justify-center">
              <Link2 className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-white">Re-link Contact to Account</h2>
              <p className="text-xs text-slate-400">{userRoleLabel} Scoped Accounts</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 text-slate-400 hover:text-slate-200 rounded-xl hover:bg-slate-800 transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {error && (
            <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-400 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5">
              Contact Person
            </label>
            <div className="p-3 bg-slate-950/60 border border-slate-800 rounded-xl text-xs text-slate-200">
              <div className="font-bold text-slate-100">{contact.fullName}</div>
              <div className="text-slate-400">{contact.email}</div>
              <div className="text-slate-500 text-[11px] mt-1">Currently Linked To: <strong className="text-slate-300">{contact.customerName || 'None'}</strong></div>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5">
              Target Customer Account
            </label>
            <select
              value={selectedCustomerId}
              onChange={(e) => setSelectedCustomerId(e.target.value ? Number(e.target.value) : '')}
              className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-slate-200 text-sm focus:outline-none focus:border-cyan-500"
              required
            >
              <option value="">-- Choose Target Account --</option>
              {allowedCustomers.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name} ({c.industryDisplayName || 'General'})
                </option>
              ))}
            </select>
          </div>

          <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-800">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl text-xs font-semibold transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading || !selectedCustomerId}
              className="px-4 py-2 bg-cyan-600 hover:bg-cyan-500 text-white rounded-xl text-xs font-semibold shadow-lg shadow-cyan-600/30 transition-all flex items-center gap-1.5 disabled:opacity-50"
            >
              <Link2 className="w-4 h-4" /> Re-link Account
            </button>
          </div>
        </form>
      </div>
    </div>
    </ModalPortal>
  );
};
