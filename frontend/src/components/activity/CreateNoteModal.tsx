import { ModalPortal } from '../ModalPortal';
import React, { useState } from 'react';
import { X, Pin, Tag, Lock, Users, Shield, Sparkles } from 'lucide-react';
import { CreateNotePayload, EntityType, NoteVisibility } from '../../types/activity';

interface CreateNoteModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (payload: CreateNotePayload) => Promise<void>;
  defaultEntityType?: EntityType;
  defaultEntityId?: number;
  defaultEntityTitle?: string;
}

const COLOR_OPTIONS = [
  { id: 'blue', label: 'Sapphire Blue', bg: 'bg-blue-500/20 border-blue-500/40 text-blue-400' },
  { id: 'green', label: 'Emerald Green', bg: 'bg-emerald-500/20 border-emerald-500/40 text-emerald-400' },
  { id: 'purple', label: 'Amethyst Purple', bg: 'bg-purple-500/20 border-purple-500/40 text-purple-400' },
  { id: 'amber', label: 'Amber Gold', bg: 'bg-amber-500/20 border-amber-500/40 text-amber-400' },
  { id: 'rose', label: 'Rose Pink', bg: 'bg-rose-500/20 border-rose-500/40 text-rose-400' },
  { id: 'indigo', label: 'Indigo Violet', bg: 'bg-indigo-500/20 border-indigo-500/40 text-indigo-400' },
];

export const CreateNoteModal: React.FC<CreateNoteModalProps> = ({
  isOpen,
  onClose,
  onSubmit,
  defaultEntityType = 'GENERAL',
  defaultEntityId,
  defaultEntityTitle = '',
}) => {
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [entityType, setEntityType] = useState<EntityType>(defaultEntityType);
  const [entityId, setEntityId] = useState<number | undefined>(defaultEntityId);
  const [entityTitle, setEntityTitle] = useState(defaultEntityTitle);
  const [isPinned, setIsPinned] = useState(false);
  const [colorTag, setColorTag] = useState('blue');
  const [visibility, setVisibility] = useState<NoteVisibility>('PUBLIC_TEAM');
  const [tags, setTags] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  React.useEffect(() => {
    if (isOpen) {
      setTitle('');
      setContent('');
      setEntityType(defaultEntityType);
      setEntityId(defaultEntityId);
      setEntityTitle(defaultEntityTitle || '');
      setIsPinned(false);
      setColorTag('blue');
      setVisibility('PUBLIC_TEAM');
      setTags('');
      setError(null);
    }
  }, [isOpen, defaultEntityType, defaultEntityId, defaultEntityTitle]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !content.trim()) {
      setError('Title and content are required');
      return;
    }

    try {
      setLoading(true);
      setError(null);
      await onSubmit({
        title: title.trim(),
        content: content.trim(),
        entityType,
        entityId: entityId || undefined,
        entityTitle: entityTitle.trim() || undefined,
        isPinned,
        colorTag,
        visibility,
        tags: tags.trim() || undefined,
      });
      setTitle('');
      setContent('');
      setTags('');
      onClose();
    } catch (err: any) {
      setError(err?.response?.data?.message || err?.message || 'Failed to create note');
    } finally {
      setLoading(false);
    }
  };

  return (
    <ModalPortal>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-fade-in">
      <div className="relative w-full max-w-2xl bg-slate-900/95 border border-slate-700/80 rounded-2xl shadow-2xl overflow-hidden backdrop-blur-xl">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-slate-800/40">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-gradient-to-tr from-indigo-500 to-purple-500 rounded-xl shadow-lg">
              <Sparkles className="w-5 h-5 text-white" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-white">Create Smart Note</h2>
              <p className="text-xs text-slate-400">Add rich notes with tagging, pin priority, and privacy</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4 max-h-[80vh] overflow-y-auto">
          {error && (
            <div className="p-3 text-sm text-red-400 bg-red-500/10 border border-red-500/20 rounded-xl">
              {error}
            </div>
          )}

          {/* Title */}
          <div>
            <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
              Note Title *
            </label>
            <input
              type="text"
              required
              placeholder="e.g. Key Stakeholder Requirement / Pricing Consensus"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full px-4 py-2.5 bg-slate-800/80 border border-slate-700 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500"
            />
          </div>

          {/* Content */}
          <div>
            <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
              Content & Remarks *
            </label>
            <textarea
              required
              rows={4}
              placeholder="Type detailed note content, meeting summaries, or strategic observations..."
              value={content}
              onChange={(e) => setContent(e.target.value)}
              className="w-full px-4 py-2.5 bg-slate-800/80 border border-slate-700 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500 resize-y"
            />
          </div>

          {/* Entity Linkage */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <div>
              <label className="block text-xs font-medium text-slate-400 mb-1">Attached Entity Type</label>
              <select
                value={entityType}
                onChange={(e) => setEntityType(e.target.value as EntityType)}
                className="w-full px-3 py-2 bg-slate-800/80 border border-slate-700 rounded-xl text-white text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/50"
              >
                <option value="GENERAL">General Workspace</option>
                <option value="DEAL">Deal / Proposal</option>
                <option value="LEAD">Lead Record</option>
                <option value="CUSTOMER">Customer Account</option>
                <option value="CONTACT">Contact Person</option>
                <option value="PRODUCT">Product Item</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-400 mb-1">Entity ID (Optional)</label>
              <input
                type="number"
                placeholder="e.g. 12"
                value={entityId || ''}
                onChange={(e) => setEntityId(e.target.value ? parseInt(e.target.value) : undefined)}
                className="w-full px-3 py-2 bg-slate-800/80 border border-slate-700 rounded-xl text-white text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/50"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-400 mb-1">Entity Name / Title</label>
              <input
                type="text"
                placeholder="e.g. Reliance Digital"
                value={entityTitle}
                onChange={(e) => setEntityTitle(e.target.value)}
                className="w-full px-3 py-2 bg-slate-800/80 border border-slate-700 rounded-xl text-white text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/50"
              />
            </div>
          </div>

          {/* Color Tag & Pin Toggle */}
          <div className="flex flex-wrap items-center justify-between gap-4 p-3 bg-slate-800/40 rounded-xl border border-slate-800">
            <div>
              <label className="block text-xs font-medium text-slate-400 mb-1.5">Color Palette</label>
              <div className="flex items-center space-x-2">
                {COLOR_OPTIONS.map((c) => (
                  <button
                    key={c.id}
                    type="button"
                    onClick={() => setColorTag(c.id)}
                    className={`w-7 h-7 rounded-full border-2 transition-transform ${
                      c.id === 'blue'
                        ? 'bg-blue-500'
                        : c.id === 'green'
                        ? 'bg-emerald-500'
                        : c.id === 'purple'
                        ? 'bg-purple-500'
                        : c.id === 'amber'
                        ? 'bg-amber-500'
                        : c.id === 'rose'
                        ? 'bg-rose-500'
                        : 'bg-indigo-500'
                    } ${colorTag === c.id ? 'scale-125 border-white shadow-lg' : 'border-transparent opacity-60 hover:opacity-100'}`}
                    title={c.label}
                  />
                ))}
              </div>
            </div>

            <button
              type="button"
              onClick={() => setIsPinned(!isPinned)}
              className={`flex items-center space-x-2 px-3.5 py-2 rounded-xl border text-xs font-medium transition-all ${
                isPinned
                  ? 'bg-amber-500/20 border-amber-500/50 text-amber-300 shadow-md'
                  : 'bg-slate-800 border-slate-700 text-slate-400 hover:text-white'
              }`}
            >
              <Pin className={`w-4 h-4 ${isPinned ? 'rotate-45 fill-amber-400 text-amber-400' : ''}`} />
              <span>{isPinned ? 'Pinned to Top' : 'Pin to Top'}</span>
            </button>
          </div>

          {/* Privacy Visibility */}
          <div>
            <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
              Visibility & Privacy Scope
            </label>
            <div className="grid grid-cols-3 gap-2">
              <button
                type="button"
                onClick={() => setVisibility('PUBLIC_TEAM')}
                className={`flex items-center justify-center space-x-1.5 p-2.5 rounded-xl border text-xs font-medium transition-all ${
                  visibility === 'PUBLIC_TEAM'
                    ? 'bg-indigo-600/30 border-indigo-500 text-indigo-300'
                    : 'bg-slate-800/60 border-slate-700 text-slate-400 hover:text-white'
                }`}
              >
                <Users className="w-3.5 h-3.5" />
                <span>Entire Team</span>
              </button>

              <button
                type="button"
                onClick={() => setVisibility('MANAGERS_ONLY')}
                className={`flex items-center justify-center space-x-1.5 p-2.5 rounded-xl border text-xs font-medium transition-all ${
                  visibility === 'MANAGERS_ONLY'
                    ? 'bg-purple-600/30 border-purple-500 text-purple-300'
                    : 'bg-slate-800/60 border-slate-700 text-slate-400 hover:text-white'
                }`}
              >
                <Shield className="w-3.5 h-3.5" />
                <span>Managers Only</span>
              </button>

              <button
                type="button"
                onClick={() => setVisibility('PRIVATE_OWNER')}
                className={`flex items-center justify-center space-x-1.5 p-2.5 rounded-xl border text-xs font-medium transition-all ${
                  visibility === 'PRIVATE_OWNER'
                    ? 'bg-rose-600/30 border-rose-500 text-rose-300'
                    : 'bg-slate-800/60 border-slate-700 text-slate-400 hover:text-white'
                }`}
              >
                <Lock className="w-3.5 h-3.5" />
                <span>Private (Me Only)</span>
              </button>
            </div>
          </div>

          {/* Tags */}
          <div>
            <label className="block text-xs font-medium text-slate-400 mb-1 flex items-center space-x-1">
              <Tag className="w-3.5 h-3.5" />
              <span>Comma Separated Tags</span>
            </label>
            <input
              type="text"
              placeholder="e.g. Negotiation, SLA, Urgent, NextQuarter"
              value={tags}
              onChange={(e) => setTags(e.target.value)}
              className="w-full px-4 py-2 bg-slate-800/80 border border-slate-700 rounded-xl text-white placeholder-slate-500 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/50"
            />
          </div>

          {/* Actions */}
          <div className="flex items-center justify-end space-x-3 pt-4 border-t border-slate-800">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm text-slate-400 hover:text-white hover:bg-slate-800 rounded-xl transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-6 py-2.5 bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 text-white text-sm font-semibold rounded-xl shadow-lg shadow-indigo-500/25 transition-all disabled:opacity-50"
            >
              {loading ? 'Saving Note...' : 'Save Smart Note'}
            </button>
          </div>
        </form>
      </div>
    </div>
    </ModalPortal>
  );
};
