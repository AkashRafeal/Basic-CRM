import { ModalPortal } from '../ModalPortal';
import React, { useState } from 'react';
import { Contact, MergeContactsRequest } from '../../types/contact';
import { GitMerge, X, AlertTriangle } from 'lucide-react';

interface MergeContactsModalProps {
  isOpen: boolean;
  onClose: () => void;
  onMerge: (data: MergeContactsRequest) => Promise<void>;
  contacts: Contact[];
  primaryContact: Contact | null;
}

export const MergeContactsModal: React.FC<MergeContactsModalProps> = ({
  isOpen,
  onClose,
  onMerge,
  contacts,
  primaryContact,
}) => {
  const [duplicateContactId, setDuplicateContactId] = useState<number | ''>('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen || !primaryContact) return null;

  const duplicateCandidate = contacts.find((c) => c.id === duplicateContactId);
  const availableDuplicates = contacts.filter((c) => c.id !== primaryContact.id && !c.isArchived);

  const handleMergeSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!duplicateContactId) return;

    try {
      setLoading(true);
      setError(null);
      await onMerge({
        primaryContactId: primaryContact.id,
        duplicateContactId: Number(duplicateContactId),
      });
      onClose();
    } catch (err: any) {
      setError(err?.response?.data?.message || err.message || 'Failed to merge contacts');
    } finally {
      setLoading(false);
    }
  };

  return (
    <ModalPortal>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-fadeIn">
      <div className="bg-slate-900 border border-slate-800 w-full max-w-lg rounded-2xl shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="p-6 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-400 flex items-center justify-center">
              <GitMerge className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-white">Merge Duplicate Contact</h2>
              <p className="text-xs text-slate-400">Consolidate stakeholder notes, phone, and history</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 text-slate-400 hover:text-slate-200 rounded-xl hover:bg-slate-800 transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <form onSubmit={handleMergeSubmit} className="p-6 space-y-4">
          {error && (
            <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-400 text-xs flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* Primary Target Banner */}
          <div className="p-4 bg-indigo-950/30 border border-indigo-500/30 rounded-xl">
            <span className="text-[10px] uppercase font-bold text-indigo-400 block tracking-wider">Primary Surviving Contact</span>
            <div className="text-sm font-bold text-slate-100 mt-1">{primaryContact.fullName} ({primaryContact.jobTitle || 'No Title'})</div>
            <div className="text-xs text-slate-400">{primaryContact.email} • {primaryContact.customerName || 'No Company'}</div>
          </div>

          {/* Duplicate Selector */}
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5">
              Select Duplicate Contact to Merge into Primary
            </label>
            <select
              value={duplicateContactId}
              onChange={(e) => setDuplicateContactId(e.target.value ? Number(e.target.value) : '')}
              className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-slate-200 text-sm focus:outline-none focus:border-indigo-500"
              required
            >
              <option value="">-- Choose duplicate contact --</option>
              {availableDuplicates.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.fullName} ({c.email}) - {c.customerName || 'No Company'}
                </option>
              ))}
            </select>
          </div>

          {duplicateCandidate && (
            <div className="p-3 bg-slate-950/60 border border-slate-800 rounded-xl text-xs text-slate-300 space-y-1">
              <p className="font-semibold text-amber-400 flex items-center gap-1.5">
                <AlertTriangle className="w-3.5 h-3.5" /> Notice:
              </p>
              <p className="text-slate-400">
                Contact <strong className="text-slate-200">{duplicateCandidate.fullName}</strong> will be merged and permanently deleted from active list. Notes, direct phone numbers, and LinkedIn handles will be copied to <strong className="text-slate-200">{primaryContact.fullName}</strong>.
              </p>
            </div>
          )}

          {/* Footer Buttons */}
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
              disabled={loading || !duplicateContactId}
              className="px-4 py-2 bg-amber-600 hover:bg-amber-500 text-white rounded-xl text-xs font-semibold shadow-lg shadow-amber-600/30 transition-all flex items-center gap-1.5 disabled:opacity-50"
            >
              <GitMerge className="w-4 h-4" /> Merge & Consolidate
            </button>
          </div>
        </form>
      </div>
    </div>
    </ModalPortal>
  );
};
