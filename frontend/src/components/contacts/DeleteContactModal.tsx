import { ModalPortal } from '../ModalPortal';
import React, { useState } from 'react';
import { Contact } from '../../types/contact';
import { AlertTriangle, Trash2 } from 'lucide-react';

interface DeleteContactModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (id: number) => Promise<void>;
  contact: Contact | null;
}

export const DeleteContactModal: React.FC<DeleteContactModalProps> = ({
  isOpen,
  onClose,
  onConfirm,
  contact,
}) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen || !contact) return null;

  const handleDelete = async () => {
    try {
      setLoading(true);
      setError(null);
      await onConfirm(contact.id);
      onClose();
    } catch (err: any) {
      setError(err?.response?.data?.message || err.message || 'Failed to delete contact');
    } finally {
      setLoading(false);
    }
  };

  return (
    <ModalPortal>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-fadeIn">
      <div className="bg-slate-900 border border-slate-800 w-full max-w-md rounded-2xl shadow-2xl overflow-hidden">
        <div className="p-6">
          <div className="w-12 h-12 rounded-2xl bg-rose-500/10 border border-rose-500/20 text-rose-400 flex items-center justify-center mb-4">
            <AlertTriangle className="w-6 h-6" />
          </div>

          <h2 className="text-lg font-bold text-white mb-1">Delete Stakeholder Contact</h2>
          <p className="text-sm text-slate-400 mb-4">
            Are you sure you want to permanently delete{' '}
            <strong className="text-slate-200">{contact.fullName}</strong>
            {contact.customerName ? ` from ${contact.customerName}` : ''}? This action cannot be undone.
          </p>

          {error && (
            <div className="mb-4 p-3 rounded-lg bg-rose-500/10 border border-rose-500/20 text-rose-400 text-xs">
              {error}
            </div>
          )}

          <div className="flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium text-slate-400 hover:text-slate-200 bg-slate-800/60 hover:bg-slate-800 rounded-xl transition-colors"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleDelete}
              disabled={loading}
              className="px-4 py-2 text-sm font-medium text-white bg-rose-600 hover:bg-rose-500 rounded-xl shadow-lg shadow-rose-600/30 transition-all disabled:opacity-50 flex items-center gap-2"
            >
              {loading ? (
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                <Trash2 className="w-4 h-4" />
              )}
              Delete Contact
            </button>
          </div>
        </div>
      </div>
    </div>
    </ModalPortal>
  );
};
