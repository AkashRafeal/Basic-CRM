import React, { useState } from 'react';
import { ModalPortal } from '../ModalPortal';
import { CategoryItem } from '../../types/product';
import { productApi } from '../../api/productApi';
import { useAuth } from '../../context/AuthContext';
import {
  X,
  Layers,
  Search,
  Plus,
  Trash2,
  CheckCircle2,
  Tag,
} from 'lucide-react';

interface CategoryDirectoryModalProps {
  isOpen: boolean;
  categories: CategoryItem[];
  onClose: () => void;
  onOpenAddCategory: () => void;
  onCategoryDeleted: (id: number) => void;
}

export const CategoryDirectoryModal: React.FC<CategoryDirectoryModalProps> = ({
  isOpen,
  categories,
  onClose,
  onOpenAddCategory,
  onCategoryDeleted,
}) => {
  const { isAdmin, isManager } = useAuth();
  const [searchTerm, setSearchTerm] = useState('');
  const [deletingId, setDeletingId] = useState<number | null>(null);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  if (!isOpen) return null;

  const filteredCategories = categories.filter(
    (c) =>
      c.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      c.code.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (c.description && c.description.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  const handleDelete = async (id: number, name: string) => {
    if (!isAdmin) {
      alert('Permission Denied: Only Administrators can delete product categories.');
      return;
    }

    if (!window.confirm(`Are you sure you want to delete the category "${name}"?`)) {
      return;
    }

    try {
      setDeletingId(id);
      setDeleteError(null);
      await productApi.deleteCategory(id);
      onCategoryDeleted(id);
    } catch (err: any) {
      console.error('Failed to delete category:', err);
      setDeleteError(err?.response?.data?.message || err.message || 'Failed to delete category');
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <ModalPortal>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-sm animate-fade-in">
        <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-5xl max-h-[88vh] flex flex-col shadow-2xl overflow-hidden animate-scale-up">
          {/* Header */}
          <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-slate-900/95 sticky top-0 z-10">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 rounded-xl bg-indigo-600/15 border border-indigo-500/30 flex items-center justify-center text-indigo-400 font-bold">
                <Layers className="w-5 h-5" />
              </div>
              <div>
                <div className="flex items-center gap-2.5">
                  <h3 className="text-lg font-bold text-white tracking-tight">
                    Product Categories Directory
                  </h3>
                  <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                    {categories.length} Categories
                  </span>
                </div>
                <p className="text-xs text-slate-400 mt-0.5">
                  Master list of catalog categories for quoting, deals, and product grouping
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2.5">
              {(isAdmin || isManager) && (
                <button
                  type="button"
                  onClick={() => {
                    onClose();
                    onOpenAddCategory();
                  }}
                  className="px-3.5 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl font-bold text-xs flex items-center gap-1.5 shadow-lg shadow-indigo-600/25 transition"
                >
                  <Plus className="w-3.5 h-3.5" />
                  Add Category
                </button>
              )}
              <button
                onClick={onClose}
                className="text-slate-400 hover:text-slate-200 p-1.5 rounded-lg hover:bg-slate-800 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Search & Stats Bar */}
          <div className="px-6 py-3 border-b border-slate-800/80 bg-slate-950/40 flex flex-col sm:flex-row items-center justify-between gap-3">
            <div className="relative w-full sm:w-80">
              <Search className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Search categories by name or code..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full bg-slate-900 border border-slate-800 rounded-xl pl-9 pr-4 py-2 text-xs text-slate-200 placeholder:text-slate-500 focus:outline-none focus:border-indigo-500 transition-colors"
              />
            </div>
            <div className="text-[11px] text-slate-400 flex items-center gap-2">
              <span>Showing <strong>{filteredCategories.length}</strong> of <strong>{categories.length}</strong> categories</span>
            </div>
          </div>

          {deleteError && (
            <div className="mx-6 mt-3 p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs flex items-center justify-between">
              <span>{deleteError}</span>
              <button onClick={() => setDeleteError(null)} className="text-rose-400 hover:text-rose-200 text-xs">
                Dismiss
              </button>
            </div>
          )}

          {/* Table Container with Horizontal Scroll and Roomy Padding */}
          <div className="flex-1 overflow-y-auto p-6">
            {filteredCategories.length === 0 ? (
              <div className="py-16 text-center text-slate-500 space-y-3">
                <Layers className="w-12 h-12 mx-auto text-slate-600 opacity-40" />
                <p className="text-sm font-semibold text-slate-300">No categories found</p>
                <p className="text-xs text-slate-500 max-w-sm mx-auto">
                  {searchTerm.trim()
                    ? `No categories match "${searchTerm}".`
                    : 'No product categories have been added yet. Click "+ Add Category" to create one.'}
                </p>
                {(isAdmin || isManager) && !searchTerm.trim() && (
                  <button
                    type="button"
                    onClick={() => {
                      onClose();
                      onOpenAddCategory();
                    }}
                    className="inline-flex items-center gap-1.5 px-4 py-2 bg-indigo-600/20 hover:bg-indigo-600/30 border border-indigo-500/30 text-indigo-300 rounded-xl text-xs font-semibold transition"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    Create First Category
                  </button>
                )}
              </div>
            ) : (
              <div className="border border-slate-800 rounded-xl overflow-x-auto bg-slate-950/40 shadow-inner">
                <table className="w-full min-w-[650px] text-left text-xs border-collapse">
                  <thead className="bg-slate-900/90 text-slate-400 font-bold uppercase text-[10px] tracking-wider border-b border-slate-800">
                    <tr>
                      <th className="py-3.5 px-5 min-w-[200px]">Category Name</th>
                      <th className="py-3.5 px-5 min-w-[160px]">Code Identifier</th>
                      <th className="py-3.5 px-5 min-w-[220px]">Description</th>
                      {isAdmin && <th className="py-3.5 px-5 text-right w-32 min-w-[130px]">Actions</th>}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/80">
                    {filteredCategories.map((c) => (
                      <tr key={c.id} className="hover:bg-slate-800/40 transition-colors">
                        <td className="py-3.5 px-5 font-semibold text-slate-100">
                          <div className="flex items-center gap-2.5">
                            <div className="w-7 h-7 rounded-lg bg-indigo-500/15 border border-indigo-500/30 flex items-center justify-center text-indigo-400 shrink-0">
                              <Tag className="w-3.5 h-3.5" />
                            </div>
                            <span className="font-semibold text-white">{c.name}</span>
                          </div>
                        </td>
                        <td className="py-3.5 px-5 font-mono text-[11px] text-indigo-300 font-medium">
                          <span className="px-2.5 py-1 rounded-md bg-slate-900 border border-slate-800 inline-block">
                            {c.code}
                          </span>
                        </td>
                        <td className="py-3.5 px-5 text-slate-400 max-w-sm">
                          {c.description ? (
                            <span className="line-clamp-2">{c.description}</span>
                          ) : (
                            <span className="text-slate-600 italic">No description</span>
                          )}
                        </td>
                        {isAdmin && (
                          <td className="py-3.5 px-5 text-right whitespace-nowrap">
                            <button
                              type="button"
                              disabled={deletingId === c.id}
                              onClick={() => handleDelete(c.id, c.name)}
                              className="px-3 py-1.5 text-rose-300 hover:text-white bg-rose-500/10 hover:bg-rose-600/80 border border-rose-500/25 hover:border-rose-500 rounded-lg transition-all inline-flex items-center gap-1.5 font-semibold text-xs shadow-sm disabled:opacity-50"
                              title="Delete Category (Admin only)"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                              <span>{deletingId === c.id ? 'Deleting...' : 'Delete'}</span>
                            </button>
                          </td>
                        )}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="flex items-center justify-between px-6 py-3.5 border-t border-slate-800 bg-slate-900/60 text-xs text-slate-400">
            <div className="flex items-center gap-1.5 text-[11px]">
              <CheckCircle2 className="w-3.5 h-3.5 text-indigo-400" />
              <span>All catalog categories are synchronized across CRM pipelines and proposals</span>
            </div>
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-1.5 text-xs font-semibold text-slate-300 hover:text-white hover:bg-slate-800 rounded-xl transition-colors"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </ModalPortal>
  );
};
