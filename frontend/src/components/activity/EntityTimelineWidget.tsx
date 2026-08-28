import React, { useState, useEffect } from 'react';
import {
  Clock,
  Pin,
  Plus,
  FileText,
  Calendar,
  Phone,
  Mail,
  CheckCircle,
  MessageSquare,
  Sparkles,
  Lock,
  Users,
  Shield,
  Trash2,
  Edit2,
} from 'lucide-react';
import { activityApi } from '../../api/activityApi';
import { useAuth } from '../../context/AuthContext';
import { Note, ActivityLog, EntityType, UpdateNotePayload } from '../../types/activity';
import { CreateNoteModal } from './CreateNoteModal';
import { EditNoteModal } from './EditNoteModal';
import { LogActivityModal } from './LogActivityModal';

interface EntityTimelineWidgetProps {
  entityType: EntityType;
  entityId: number;
  entityTitle: string;
}

export const EntityTimelineWidget: React.FC<EntityTimelineWidgetProps> = ({
  entityType,
  entityId,
  entityTitle,
}) => {
  const { user, isAdmin, isManager } = useAuth();
  const [activeTab, setActiveTab] = useState<'timeline' | 'notes'>('timeline');
  const [timeline, setTimeline] = useState<ActivityLog[]>([]);
  const [notes, setNotes] = useState<Note[]>([]);
  const [loading, setLoading] = useState(true);
  const [isNoteModalOpen, setIsNoteModalOpen] = useState(false);
  const [isEditNoteModalOpen, setIsEditNoteModalOpen] = useState(false);
  const [selectedEditNote, setSelectedEditNote] = useState<Note | null>(null);
  const [isActivityModalOpen, setIsActivityModalOpen] = useState(false);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [timelineData, notesData] = await Promise.all([
        activityApi.getEntityTimeline(entityType, entityId),
        activityApi.getNotes({ entityType, entityId }),
      ]);
      setTimeline(timelineData);
      setNotes(notesData);
    } catch (err) {
      console.error('Failed to load entity timeline/notes:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [entityType, entityId]);

  const handleCreateNote = async (payload: any) => {
    await activityApi.createNote(payload);
    await fetchData();
  };

  const handleUpdateNote = async (id: number, payload: UpdateNotePayload) => {
    await activityApi.updateNote(id, payload);
    await fetchData();
  };

  const handleLogActivity = async (payload: any) => {
    await activityApi.logActivity(payload);
    await fetchData();
  };

  const handleTogglePin = async (noteId: number) => {
    await activityApi.togglePin(noteId);
    await fetchData();
  };

  const handleDeleteNote = async (noteId: number) => {
    if (window.confirm('Are you sure you want to delete this note?')) {
      await activityApi.deleteNote(noteId);
      await fetchData();
    }
  };

  const getActivityIcon = (type: string) => {
    switch (type) {
      case 'NOTE_CREATED':
      case 'NOTE_UPDATED':
        return <FileText className="w-4 h-4 text-indigo-400" />;
      case 'CALL_LOGGED':
        return <Phone className="w-4 h-4 text-emerald-400" />;
      case 'EMAIL_SENT':
        return <Mail className="w-4 h-4 text-blue-400" />;
      case 'SMS_SENT':
        return <MessageSquare className="w-4 h-4 text-amber-400" />;
      case 'MEETING_SCHEDULED':
        return <Calendar className="w-4 h-4 text-purple-400" />;
      case 'STAGE_CHANGED':
      case 'STATUS_CHANGED':
        return <Clock className="w-4 h-4 text-cyan-400" />;
      case 'TASK_COMPLETED':
      case 'DEAL_WON':
      case 'LEAD_CONVERTED':
        return <CheckCircle className="w-4 h-4 text-emerald-400" />;
      default:
        return <Sparkles className="w-4 h-4 text-slate-400" />;
    }
  };

  const getColorClass = (colorTag: string) => {
    switch (colorTag) {
      case 'green':
        return 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300';
      case 'purple':
        return 'bg-purple-500/10 border-purple-500/30 text-purple-300';
      case 'amber':
        return 'bg-amber-500/10 border-amber-500/30 text-amber-300';
      case 'rose':
        return 'bg-rose-500/10 border-rose-500/30 text-rose-300';
      case 'indigo':
        return 'bg-indigo-500/10 border-indigo-500/30 text-indigo-300';
      case 'blue':
      default:
        return 'bg-blue-500/10 border-blue-500/30 text-blue-300';
    }
  };

  return (
    <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-5 backdrop-blur-xl">
      {/* Header with Switcher and Quick Action Buttons */}
      <div className="flex flex-wrap items-center justify-between gap-3 pb-4 border-b border-slate-800">
        <div className="flex items-center space-x-2 bg-slate-800/80 p-1 rounded-xl border border-slate-700/60">
          <button
            onClick={() => setActiveTab('timeline')}
            className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
              activeTab === 'timeline'
                ? 'bg-gradient-to-r from-indigo-500 to-purple-600 text-white shadow-md'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Clock className="w-3.5 h-3.5" />
            <span>Activity Timeline ({timeline.length})</span>
          </button>
          <button
            onClick={() => setActiveTab('notes')}
            className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
              activeTab === 'notes'
                ? 'bg-gradient-to-r from-indigo-500 to-purple-600 text-white shadow-md'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <FileText className="w-3.5 h-3.5" />
            <span>Notes ({notes.length})</span>
          </button>
        </div>

        <div className="flex items-center space-x-2">
          <button
            onClick={() => setIsActivityModalOpen(true)}
            className="flex items-center space-x-1 px-2.5 py-1.5 bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-300 hover:text-white text-xs font-medium rounded-xl transition-colors"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Log Activity</span>
          </button>
          <button
            onClick={() => setIsNoteModalOpen(true)}
            className="flex items-center space-x-1 px-3 py-1.5 bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 text-white text-xs font-medium rounded-xl shadow-md transition-all"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Add Note</span>
          </button>
        </div>
      </div>

      {/* Content */}
      <div className="mt-4">
        {loading ? (
          <div className="flex items-center justify-center py-8 text-slate-500 text-sm animate-pulse">
            Loading {activeTab === 'timeline' ? 'activity timeline' : 'notes'}...
          </div>
        ) : activeTab === 'timeline' ? (
          timeline.length === 0 ? (
            <div className="text-center py-8 text-slate-500 text-xs">
              No recorded activities yet for this record.
            </div>
          ) : (
            <div className="relative pl-6 space-y-4 before:absolute before:left-2.5 before:top-2 before:bottom-2 before:w-0.5 before:bg-slate-800">
              {timeline.map((act) => (
                <div key={act.id} className="relative group">
                  <div className="absolute -left-6 top-1 p-1 bg-slate-900 border border-slate-700 rounded-full shadow">
                    {getActivityIcon(act.activityType)}
                  </div>
                  <div className="p-3 bg-slate-800/40 hover:bg-slate-800/80 border border-slate-800 hover:border-slate-700/80 rounded-xl transition-all">
                    <div className="flex items-start justify-between">
                      <h4 className="text-xs font-semibold text-white">{act.title}</h4>
                      <span className="text-[10px] text-slate-500 whitespace-nowrap ml-2">
                        {new Date(act.createdAt).toLocaleDateString()} {new Date(act.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>
                    {act.description && (
                      <p className="text-xs text-slate-300 mt-1 leading-relaxed">{act.description}</p>
                    )}
                    <div className="flex items-center justify-between mt-2 pt-2 border-t border-slate-800/60 text-[10px] text-slate-500">
                      <span>By {act.actorName} ({act.actorRole.replace('ROLE_', '')})</span>
                      <span className="px-1.5 py-0.5 bg-slate-800 rounded text-slate-400 border border-slate-700/50">
                        {act.activityType.replace('_', ' ')}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )
        ) : notes.length === 0 ? (
          <div className="text-center py-8 text-slate-500 text-xs">
            No notes added yet. Click &quot;Add Note&quot; to pin key remarks or decisions.
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {notes.map((note) => (
              <div
                key={note.id}
                className={`p-4 rounded-xl border transition-all ${getColorClass(note.colorTag)} ${
                  note.isPinned ? 'ring-1 ring-amber-400/50 shadow-lg' : ''
                }`}
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-center space-x-1.5">
                    {note.isPinned && <Pin className="w-3.5 h-3.5 text-amber-400 fill-amber-400 rotate-45" />}
                    <h4 className="text-xs font-bold text-white line-clamp-1">{note.title}</h4>
                  </div>
                  <div className="flex items-center space-x-1">
                    {(isAdmin || isManager || note.authorId === user?.id) && (
                      <button
                        onClick={() => {
                          setSelectedEditNote(note);
                          setIsEditNoteModalOpen(true);
                        }}
                        className="p-1 text-slate-400 hover:text-indigo-400 rounded transition-colors"
                        title="Edit Note"
                      >
                        <Edit2 className="w-3 h-3" />
                      </button>
                    )}
                    {(isAdmin || isManager || note.authorId === user?.id) && (
                      <button
                        onClick={() => handleTogglePin(note.id)}
                        className="p-1 text-slate-400 hover:text-amber-400 rounded transition-colors"
                        title={note.isPinned ? 'Unpin Note' : 'Pin to Top'}
                      >
                        <Pin className={`w-3 h-3 ${note.isPinned ? 'text-amber-400 fill-amber-400' : ''}`} />
                      </button>
                    )}
                    {isAdmin && (
                      <button
                        onClick={() => handleDeleteNote(note.id)}
                        className="p-1 text-slate-400 hover:text-red-400 rounded transition-colors"
                        title="Delete Note (Admin Only)"
                      >
                        <Trash2 className="w-3 h-3" />
                      </button>
                    )}
                  </div>
                </div>

                <p className="text-xs text-slate-300 mt-2 line-clamp-3 leading-relaxed whitespace-pre-line">
                  {note.content}
                </p>

                {note.tags && (
                  <div className="flex flex-wrap gap-1 mt-2.5">
                    {note.tags.split(',').map((t, idx) => (
                      <span
                        key={idx}
                        className="px-1.5 py-0.5 bg-slate-900/60 border border-slate-700/60 rounded text-[10px] text-slate-300"
                      >
                        #{t.trim()}
                      </span>
                    ))}
                  </div>
                )}

                <div className="flex items-center justify-between mt-3 pt-2 border-t border-slate-800/60 text-[10px] text-slate-400">
                  <span className="flex items-center space-x-1">
                    {note.visibility === 'PRIVATE_OWNER' ? (
                      <Lock className="w-2.5 h-2.5 text-rose-400" />
                    ) : note.visibility === 'MANAGERS_ONLY' ? (
                      <Shield className="w-2.5 h-2.5 text-purple-400" />
                    ) : (
                      <Users className="w-2.5 h-2.5 text-indigo-400" />
                    )}
                    <span>{note.authorName}</span>
                  </span>
                  <span>{new Date(note.createdAt).toLocaleDateString()}</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Modals */}
      <CreateNoteModal
        isOpen={isNoteModalOpen}
        onClose={() => setIsNoteModalOpen(false)}
        onSubmit={handleCreateNote}
        defaultEntityType={entityType}
        defaultEntityId={entityId}
        defaultEntityTitle={entityTitle}
      />

      <EditNoteModal
        isOpen={isEditNoteModalOpen}
        onClose={() => {
          setIsEditNoteModalOpen(false);
          setSelectedEditNote(null);
        }}
        onSubmit={handleUpdateNote}
        note={selectedEditNote}
      />

      <LogActivityModal
        isOpen={isActivityModalOpen}
        onClose={() => setIsActivityModalOpen(false)}
        onSubmit={handleLogActivity}
        defaultEntityType={entityType}
        defaultEntityId={entityId}
        defaultEntityTitle={entityTitle}
      />
    </div>
  );
};
