import React, { useState, useEffect } from 'react';
import { ModalPortal } from '../ModalPortal';
import { productApi } from '../../api/productApi';
import { CategoryItem } from '../../types/product';
import { X, Layers, Plus, Tag } from 'lucide-react';

interface CreateCategoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCategoryCreated: (category: CategoryItem) => void;
}

export const CreateCategoryModal: React.FC<CreateCategoryModalProps> = ({
  isOpen,
  onClose,
  onCategoryCreated,
}) => {
  const [name, setName] = useState('');
  const [code, setCode] = useState('');
  const [description, setDescription] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Clear all inputs every time the modal is opened
  useEffect(() => {
    if (isOpen) {
      setName('');
      setCode('');
      setDescription('');
      setError(null);
      setLoading(false);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleClose = () => {
    setName('');
    setCode('');
    setDescription('');
    setError(null);
    onClose();
  };

  const handleNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setName(val);
    // Auto-generate code from name
    const autoCode = val.trim().toUpperCase().replace(/[^A-Z0-9]/g, '_');
    setCode(autoCode);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setError('Category name is required.');
      return;
    }

    try {
      setLoading(true);
      setError(null);
      const newCat = await productApi.createCategory({
        name: name.trim(),
        code: code.trim() || undefined,
        description: description.trim() || undefined,
      });
      onCategoryCreated(newCat);
      setName('');
      setCode('');
      setDescription('');
      onClose();
    } catch (err: any) {
      console.error('Failed to create category:', err);
      setError(err?.response?.data?.message || err.message || 'Failed to create category');
    } finally {
      setLoading(false);
    }
  };

  return (
    <ModalPortal>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/50 backdrop-blur-sm animate-fade-in">
        <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-lg overflow-hidden shadow-2xl animate-scale-up flex flex-col">
          {/* Header */}
          <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-slate-900/60">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 rounded-xl bg-indigo-600/15 border border-indigo-500/30 flex items-center justify-center text-indigo-400 font-bold">
                <Layers className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-100 flex items-center gap-2">
                  Add Product Category
                  <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                    Admin
                  </span>
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  Define new catalog category for pricing, quotes, and product classification
                </p>
              </div>
            </div>
            <button
              onClick={handleClose}
              className="text-slate-400 hover:text-slate-200 p-1.5 rounded-lg hover:bg-slate-800 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="p-6 space-y-4">
            {error && (
              <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs">
                {error}
              </div>
            )}

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                Category Name <span className="text-rose-400">*</span>
              </label>
              <div className="relative">
                <Tag className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  required
                  placeholder="e.g. AI Software & Copilots, Hardware Servers..."
                  value={name}
                  onChange={handleNameChange}
                  className="w-full bg-slate-950/80 border border-slate-800 rounded-xl pl-10 pr-4 py-2.5 text-xs text-slate-100 placeholder:text-slate-500 focus:outline-none focus:border-indigo-500 transition-colors"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                Category Code (Internal Key)
              </label>
              <input
                type="text"
                placeholder="e.g. AI_SOFTWARE_COPILOTS"
                value={code}
                onChange={(e) => setCode(e.target.value.toUpperCase())}
                className="w-full bg-slate-950/80 border border-slate-800 rounded-xl px-3.5 py-2.5 text-xs text-slate-300 font-mono focus:outline-none focus:border-indigo-500 transition-colors"
              />
              <p className="text-[11px] text-slate-500 mt-1">
                Unique identifier used for pipeline deal quoting and product grouping.
              </p>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                Description (Optional)
              </label>
              <textarea
                rows={2}
                placeholder="Short summary of products covered under this category..."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="w-full bg-slate-950/80 border border-slate-800 rounded-xl px-3.5 py-2 text-xs text-slate-100 placeholder:text-slate-500 focus:outline-none focus:border-indigo-500 transition-colors"
              />
            </div>

            {/* Footer Buttons */}
            <div className="flex items-center justify-end space-x-3 pt-4 border-t border-slate-800">
              <button
                type="button"
                onClick={handleClose}
                className="px-4 py-2 text-xs font-semibold text-slate-400 hover:text-white hover:bg-slate-800 rounded-xl transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={loading}
                className="flex items-center space-x-1.5 px-5 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold rounded-xl shadow-lg shadow-indigo-600/30 transition-all disabled:opacity-50"
              >
                <Plus className="w-4 h-4" />
                <span>{loading ? 'Creating Category...' : 'Save Category'}</span>
              </button>
            </div>
          </form>
        </div>
      </div>
    </ModalPortal>
  );
};
