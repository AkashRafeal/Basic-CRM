import { ModalPortal } from '../ModalPortal';
import React, { useState } from 'react';
import { StakeholderTag, CreateTagRequest } from '../../types/contact';
import { Tag, Plus, Trash2, X, Shield, AlertCircle } from 'lucide-react';

interface ManageTagsModalProps {
  isOpen: boolean;
  onClose: () => void;
  tags: StakeholderTag[];
  onCreateTag: (data: CreateTagRequest) => Promise<void>;
  onDeleteTag: (id: number) => Promise<void>;
}

export const ManageTagsModal: React.FC<ManageTagsModalProps> = ({
  isOpen,
  onClose,
  tags,
  onCreateTag,
  onDeleteTag,
}) => {
  const [newTagName, setNewTagName] = useState('');
  const [newTagColor, setNewTagColor] = useState('indigo');
  const [newTagDesc, setNewTagDesc] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const colorOptions = [
    { label: 'Indigo', value: 'indigo', class: 'bg-indigo-500' },
    { label: 'Emerald', value: 'emerald', class: 'bg-emerald-500' },
    { label: 'Rose', value: 'rose', class: 'bg-rose-500' },
    { label: 'Amber', value: 'amber', class: 'bg-amber-500' },
    { label: 'Purple', value: 'purple', class: 'bg-purple-500' },
    { label: 'Blue', value: 'blue', class: 'bg-blue-500' },
    { label: 'Cyan', value: 'cyan', class: 'bg-cyan-500' },
  ];

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTagName.trim()) return;

    try {
      setLoading(true);
      setError(null);
      await onCreateTag({
        name: newTagName.trim(),
        color: newTagColor,
        description: newTagDesc.trim() || undefined,
      });
      setNewTagName('');
      setNewTagDesc('');
    } catch (err: any) {
      setError(err?.response?.data?.message || err.message || 'Failed to create tag');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: number) => {
    try {
      setLoading(true);
      await onDeleteTag(id);
    } catch (err: any) {
      setError(err?.response?.data?.message || err.message || 'Failed to delete tag');
    } finally {
      setLoading(false);
    }
  };

  return (
    <ModalPortal>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-fadeIn">
      <div className="bg-slate-900 border border-slate-800 w-full max-w-lg rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[85vh]">
        {/* Header */}
        <div className="p-6 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 flex items-center justify-center">
              <Tag className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg font-bold text-white">Customize Stakeholder Roles & Tags</h2>
                <span className="px-2 py-0.5 rounded-full bg-amber-500/10 border border-amber-500/30 text-amber-300 text-[10px] font-bold flex items-center gap-1">
                  <Shield className="w-3 h-3" /> Admin Only
                </span>
              </div>
              <p className="text-xs text-slate-400">Manage tags and custom stakeholder badges company-wide</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 text-slate-400 hover:text-slate-200 rounded-xl hover:bg-slate-800 transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto space-y-6 flex-1">
          {error && (
            <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-400 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* Create Form */}
          <form onSubmit={handleCreate} className="p-4 bg-slate-950/60 border border-slate-800/80 rounded-xl space-y-3">
            <h3 className="text-xs font-bold text-slate-300 uppercase tracking-wider">Add New Stakeholder Tag</h3>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-[11px] font-medium text-slate-400 mb-1">Tag Name</label>
                <input
                  type="text"
                  placeholder="e.g. Budget Approver"
                  value={newTagName}
                  onChange={(e) => setNewTagName(e.target.value)}
                  className="w-full px-3 py-1.5 bg-slate-900 border border-slate-800 rounded-lg text-slate-200 text-xs focus:outline-none focus:border-indigo-500"
                  required
                />
              </div>

              <div>
                <label className="block text-[11px] font-medium text-slate-400 mb-1">Badge Color</label>
                <select
                  value={newTagColor}
                  onChange={(e) => setNewTagColor(e.target.value)}
                  className="w-full px-3 py-1.5 bg-slate-900 border border-slate-800 rounded-lg text-slate-200 text-xs focus:outline-none focus:border-indigo-500"
                >
                  {colorOptions.map((c) => (
                    <option key={c.value} value={c.value}>
                      {c.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div>
              <label className="block text-[11px] font-medium text-slate-400 mb-1">Description (Optional)</label>
              <input
                type="text"
                placeholder="Description of this stakeholder influence..."
                value={newTagDesc}
                onChange={(e) => setNewTagDesc(e.target.value)}
                className="w-full px-3 py-1.5 bg-slate-900 border border-slate-800 rounded-lg text-slate-200 text-xs focus:outline-none focus:border-indigo-500"
              />
            </div>

            <button
              type="submit"
              disabled={loading || !newTagName.trim()}
              className="w-full py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-xs font-semibold shadow-lg shadow-indigo-600/30 transition-all flex items-center justify-center gap-1.5 disabled:opacity-50"
            >
              <Plus className="w-4 h-4" /> Add Stakeholder Tag
            </button>
          </form>

          {/* Existing Tags List */}
          <div>
            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3">Existing Stakeholder Badges ({tags.length})</h3>
            <div className="space-y-2">
              {tags.length === 0 ? (
                <div className="text-center py-6 text-xs text-slate-500">No custom tags defined yet.</div>
              ) : (
                tags.map((tag) => (
                  <div
                    key={tag.id}
                    className="p-3 bg-slate-950/40 border border-slate-800/80 rounded-xl flex items-center justify-between"
                  >
                    <div>
                      <div className="flex items-center gap-2">
                        <span className={`px-2 py-0.5 rounded-full text-xs font-bold text-white bg-${tag.color}-500/20 border border-${tag.color}-500/40 text-${tag.color}-300`}>
                          {tag.name}
                        </span>
                        <span className="text-[10px] text-slate-500">#{tag.id}</span>
                      </div>
                      {tag.description && <p className="text-[11px] text-slate-400 mt-1">{tag.description}</p>}
                    </div>

                    <button
                      onClick={() => handleDelete(tag.id)}
                      className="p-1.5 text-slate-500 hover:text-rose-400 rounded-lg hover:bg-slate-800 transition-colors"
                      title="Delete Tag"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-slate-800 bg-slate-950/40 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl text-xs font-semibold transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
    </ModalPortal>
  );
};
