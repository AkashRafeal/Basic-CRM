import { ModalPortal } from '../ModalPortal';
import React, { useState, useEffect } from 'react';
import { X, Pin, Sparkles, Edit3 } from 'lucide-react';
import { Note, UpdateNotePayload, NoteVisibility } from '../../types/activity';

interface EditNoteModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (id: number, payload: UpdateNotePayload) => Promise<void>;
  note: Note | null;
}

const COLOR_OPTIONS = [
  { id: 'blue', label: 'Sapphire Blue', bg: 'bg-blue-500/20 border-blue-500/40 text-blue-400' },
  { id: 'green', label: 'Emerald Green', bg: 'bg-emerald-500/20 border-emerald-500/40 text-emerald-400' },
  { id: 'purple', label: 'Amethyst Purple', bg: 'bg-purple-500/20 border-purple-500/40 text-purple-400' },
  { id: 'amber', label: 'Amber Gold', bg: 'bg-amber-500/20 border-amber-500/40 text-amber-400' },
  { id: 'rose', label: 'Rose Pink', bg: 'bg-rose-500/20 border-rose-500/40 text-rose-400' },
  { id: 'indigo', label: 'Indigo Violet', bg: 'bg-indigo-500/20 border-indigo-500/40 text-indigo-400' },
];

export const EditNoteModal: React.FC<EditNoteModalProps> = ({
  isOpen,
  onClose,
  onSubmit,
  note,
}) => {
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [isPinned, setIsPinned] = useState(false);
  const [colorTag, setColorTag] = useState('blue');
  const [visibility, setVisibility] = useState<NoteVisibility>('PUBLIC_TEAM');
  const [tags, setTags] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen && note) {
      setTitle(note.title || '');
      setContent(note.content || '');
      setIsPinned(Boolean(note.isPinned));
      setColorTag(note.colorTag || 'blue');
      setVisibility(note.visibility || 'PUBLIC_TEAM');
      setTags(note.tags || '');
      setError(null);
    } else if (!isOpen) {
      setTitle('');
      setContent('');
      setIsPinned(false);
      setColorTag('blue');
      setVisibility('PUBLIC_TEAM');
      setTags('');
      setError(null);
    }
  }, [isOpen, note]);

  if (!isOpen || !note) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !content.trim()) {
      setError('Title and content are required');
      return;
    }

    try {
      setLoading(true);
      setError(null);
      await onSubmit(note.id, {
        title: title.trim(),
        content: content.trim(),
        isPinned,
        colorTag,
        visibility,
        tags: tags.trim() || undefined,
      });
      onClose();
    } catch (err: any) {
      setError(err?.response?.data?.message || err?.message || 'Failed to update note');
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
                <Edit3 className="w-5 h-5 text-white" />
              </div>
              <div>
                <h2 className="text-lg font-semibold text-white">Edit Smart Note</h2>
                <p className="text-xs text-slate-400">
                  Update remarks, priority pinning, palette theme, and visibility scope
                </p>
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
              <div className="p-3.5 bg-rose-500/10 border border-rose-500/20 rounded-xl text-rose-400 text-sm">
                {error}
              </div>
            )}

            {/* Attached Entity Context Banner */}
            <div className="flex items-center space-x-2 p-2.5 bg-slate-800/60 border border-slate-700/60 rounded-xl text-xs text-slate-300">
              <span className="px-2 py-0.5 bg-indigo-500/20 border border-indigo-500/30 text-indigo-300 font-bold rounded">
                {note.entityType} {note.entityId ? `#${note.entityId}` : ''}
              </span>
              {note.entityTitle && <span className="text-slate-400 truncate">{note.entityTitle}</span>}
              <span className="text-slate-500 ml-auto">Author: {note.authorName}</span>
            </div>

            {/* Title */}
            <div>
              <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1">
                Note Title *
              </label>
              <input
                type="text"
                required
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g. Key Executive Decision / Requirements"
                className="w-full px-4 py-2.5 bg-slate-800/80 border border-slate-700 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500"
              />
            </div>

            {/* Content */}
            <div>
              <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1">
                Content & Remarks *
              </label>
              <textarea
                required
                rows={5}
                value={content}
                onChange={(e) => setContent(e.target.value)}
                placeholder="Write detailed notes, action items, meeting minutes, or client feedback..."
                className="w-full px-4 py-2.5 bg-slate-800/80 border border-slate-700 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500 resize-y"
              />
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
                      } ${
                        colorTag === c.id
                          ? 'scale-125 border-white shadow-lg'
                          : 'border-transparent opacity-60 hover:opacity-100'
                      }`}
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
                      ? 'bg-indigo-500/20 border-indigo-500/50 text-indigo-300 shadow'
                      : 'bg-slate-800/60 border-slate-700/60 text-slate-400 hover:text-white'
                  }`}
                >
                  <span>Entire Team</span>
                </button>
                <button
                  type="button"
                  onClick={() => setVisibility('MANAGERS_ONLY')}
                  className={`flex items-center justify-center space-x-1.5 p-2.5 rounded-xl border text-xs font-medium transition-all ${
                    visibility === 'MANAGERS_ONLY'
                      ? 'bg-purple-500/20 border-purple-500/50 text-purple-300 shadow'
                      : 'bg-slate-800/60 border-slate-700/60 text-slate-400 hover:text-white'
                  }`}
                >
                  <span>Managers Only</span>
                </button>
                <button
                  type="button"
                  onClick={() => setVisibility('PRIVATE_OWNER')}
                  className={`flex items-center justify-center space-x-1.5 p-2.5 rounded-xl border text-xs font-medium transition-all ${
                    visibility === 'PRIVATE_OWNER'
                      ? 'bg-rose-500/20 border-rose-500/50 text-rose-300 shadow'
                      : 'bg-slate-800/60 border-slate-700/60 text-slate-400 hover:text-white'
                  }`}
                >
                  <span>Private (Me Only)</span>
                </button>
              </div>
            </div>

            {/* Tags */}
            <div>
              <label className="block text-xs font-medium text-slate-400 mb-1">
                Comma Separated Tags
              </label>
              <input
                type="text"
                placeholder="e.g. Negotiation, SLA, Urgent, NextQuarter"
                value={tags}
                onChange={(e) => setTags(e.target.value)}
                className="w-full px-3.5 py-2 bg-slate-800/80 border border-slate-700 rounded-xl text-white text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/50"
              />
            </div>

            {/* Actions */}
            <div className="flex items-center justify-end space-x-3 pt-4 border-t border-slate-800">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 text-sm font-medium rounded-xl transition-all"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={loading}
                className="flex items-center space-x-2 px-5 py-2 bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 disabled:opacity-50 text-white text-sm font-semibold rounded-xl shadow-lg shadow-indigo-500/25 transition-all"
              >
                <Sparkles className="w-4 h-4" />
                <span>{loading ? 'Saving Changes...' : 'Update Smart Note'}</span>
              </button>
            </div>
          </form>
        </div>
      </div>
    </ModalPortal>
  );
};
