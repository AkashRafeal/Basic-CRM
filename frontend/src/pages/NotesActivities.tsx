import React, { useState, useEffect } from 'react';
import {
  FileText,
  Activity,
  Plus,
  Search,
  Filter,
  Pin,
  Clock,
  Lock,
  Users,
  Shield,
  Trash2,
  Sparkles,
  CheckCircle,
  Phone,
  Mail,
  Calendar,
  MessageSquare,
  TrendingUp,
  Edit2,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { activityApi } from '../api/activityApi';
import { Note, ActivityLog, ActivityStats, EntityType, ActivityType, UpdateNotePayload } from '../types/activity';
import { CreateNoteModal } from '../components/activity/CreateNoteModal';
import { EditNoteModal } from '../components/activity/EditNoteModal';
import { LogActivityModal } from '../components/activity/LogActivityModal';

export const NotesActivities: React.FC = () => {
  const { user, isAdmin, isManager } = useAuth();
  const [activeTab, setActiveTab] = useState<'notes' | 'activities'>('notes');
  const [notes, setNotes] = useState<Note[]>([]);
  const [activities, setActivities] = useState<ActivityLog[]>([]);
  const [stats, setStats] = useState<ActivityStats | null>(null);
  const [loading, setLoading] = useState(true);

  // Filters
  const [search, setSearch] = useState('');
  const [selectedEntityType, setSelectedEntityType] = useState<string>('ALL');
  const [selectedActivityType, setSelectedActivityType] = useState<string>('ALL');
  const [pinnedOnly, setPinnedOnly] = useState(false);

  // Modals
  const [isNoteModalOpen, setIsNoteModalOpen] = useState(false);
  const [isEditNoteModalOpen, setIsEditNoteModalOpen] = useState(false);
  const [selectedEditNote, setSelectedEditNote] = useState<Note | null>(null);
  const [isActivityModalOpen, setIsActivityModalOpen] = useState(false);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [notesRes, activitiesRes, statsRes] = await Promise.all([
        activityApi.getNotes({
          entityType: selectedEntityType !== 'ALL' ? (selectedEntityType as EntityType) : undefined,
          pinnedOnly: pinnedOnly || undefined,
          search: search || undefined,
        }),
        activityApi.getActivities({
          entityType: selectedEntityType !== 'ALL' ? (selectedEntityType as EntityType) : undefined,
          activityType: selectedActivityType !== 'ALL' ? (selectedActivityType as ActivityType) : undefined,
          search: search || undefined,
          size: 50,
        }),
        activityApi.getStats(),
      ]);

      setNotes(notesRes);
      setActivities(activitiesRes.data || []);
      setStats(statsRes);
    } catch (err) {
      console.error('Failed to load notes & activities:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [selectedEntityType, selectedActivityType, pinnedOnly]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    fetchData();
  };

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

  const handleTogglePin = async (id: number) => {
    await activityApi.togglePin(id);
    await fetchData();
  };

  const handleDeleteNote = async (id: number) => {
    if (window.confirm('Are you sure you want to delete this note?')) {
      await activityApi.deleteNote(id);
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
        return 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300 hover:border-emerald-500/50';
      case 'purple':
        return 'bg-purple-500/10 border-purple-500/30 text-purple-300 hover:border-purple-500/50';
      case 'amber':
        return 'bg-amber-500/10 border-amber-500/30 text-amber-300 hover:border-amber-500/50';
      case 'rose':
        return 'bg-rose-500/10 border-rose-500/30 text-rose-300 hover:border-rose-500/50';
      case 'indigo':
        return 'bg-indigo-500/10 border-indigo-500/30 text-indigo-300 hover:border-indigo-500/50';
      case 'blue':
      default:
        return 'bg-blue-500/10 border-blue-500/30 text-blue-300 hover:border-blue-500/50';
    }
  };

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header & Main Actions */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white tracking-tight flex items-center space-x-2.5">
            <span className="p-2 bg-gradient-to-tr from-indigo-500 to-purple-600 rounded-xl shadow-lg">
              <FileText className="w-6 h-6 text-white" />
            </span>
            <span>Notes & Activity History</span>
          </h1>
          <p className="text-sm text-slate-400 mt-1">
            Centralized intelligent workspace for remarks, meeting summaries, and enterprise audit timelines
          </p>
        </div>

        <div className="flex items-center space-x-3">
          <button
            onClick={() => setIsActivityModalOpen(true)}
            className="flex items-center space-x-2 px-4 py-2.5 bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-200 text-sm font-medium rounded-xl transition-all shadow"
          >
            <Activity className="w-4 h-4 text-emerald-400" />
            <span>Log Activity</span>
          </button>
          <button
            onClick={() => setIsNoteModalOpen(true)}
            className="flex items-center space-x-2 px-5 py-2.5 bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 text-white text-sm font-semibold rounded-xl shadow-lg shadow-indigo-500/25 transition-all"
          >
            <Plus className="w-4 h-4" />
            <span>Add Smart Note</span>
          </button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-4 bg-slate-900/60 border border-slate-800 rounded-2xl backdrop-blur-xl flex items-center space-x-4">
          <div className="p-3 bg-indigo-500/10 border border-indigo-500/20 rounded-xl text-indigo-400">
            <FileText className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center space-x-1.5">
              <p className="text-xs font-medium text-slate-400 uppercase tracking-wider">Smart Notes</p>
              <span className="text-[10px] text-indigo-400/80 font-medium">
                {isAdmin ? '🌐 Global' : isManager ? '👥 Team' : '👤 Personal'}
              </span>
            </div>
            <p className="text-2xl font-bold text-white mt-0.5">{stats?.totalNotes ?? '-'}</p>
          </div>
        </div>

        <div className="p-4 bg-slate-900/60 border border-slate-800 rounded-2xl backdrop-blur-xl flex items-center space-x-4">
          <div className="p-3 bg-amber-500/10 border border-amber-500/20 rounded-xl text-amber-400">
            <Pin className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center space-x-1.5">
              <p className="text-xs font-medium text-slate-400 uppercase tracking-wider">Pinned Notes</p>
              <span className="text-[10px] text-amber-400/80 font-medium">
                {isAdmin ? '🌐 Global' : isManager ? '👥 Team' : '👤 Personal'}
              </span>
            </div>
            <p className="text-2xl font-bold text-white mt-0.5">{stats?.pinnedNotes ?? '-'}</p>
          </div>
        </div>

        <div className="p-4 bg-slate-900/60 border border-slate-800 rounded-2xl backdrop-blur-xl flex items-center space-x-4">
          <div className="p-3 bg-emerald-500/10 border border-emerald-500/20 rounded-xl text-emerald-400">
            <Activity className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center space-x-1.5">
              <p className="text-xs font-medium text-slate-400 uppercase tracking-wider">Audit Trail</p>
              <span className="text-[10px] text-emerald-400/80 font-medium">
                {isAdmin ? '🌐 Global' : isManager ? '👥 Team' : '👤 Personal'}
              </span>
            </div>
            <p className="text-2xl font-bold text-white mt-0.5">{stats?.totalActivities ?? '-'}</p>
          </div>
        </div>

        <div className="p-4 bg-slate-900/60 border border-slate-800 rounded-2xl backdrop-blur-xl flex items-center space-x-4">
          <div className="p-3 bg-purple-500/10 border border-purple-500/20 rounded-xl text-purple-400">
            <TrendingUp className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center space-x-1.5">
              <p className="text-xs font-medium text-slate-400 uppercase tracking-wider">Today&apos;s Events</p>
              <span className="text-[10px] text-purple-400/80 font-medium">
                {isAdmin ? '🌐 Global' : isManager ? '👥 Team' : '👤 Personal'}
              </span>
            </div>
            <p className="text-2xl font-bold text-white mt-0.5">{stats?.todayActivities ?? '-'}</p>
          </div>
        </div>
      </div>

      {/* Tabs & Search Filter Bar */}
      <div className="p-4 bg-slate-900/80 border border-slate-800 rounded-2xl backdrop-blur-xl space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-4">
          {/* Main Tab Switcher */}
          <div className="flex items-center space-x-2 bg-slate-800/90 p-1.5 rounded-xl border border-slate-700/60">
            <button
              onClick={() => setActiveTab('notes')}
              className={`flex items-center space-x-2 px-4 py-2 rounded-lg text-sm font-semibold transition-all ${
                activeTab === 'notes'
                  ? 'bg-gradient-to-r from-indigo-500 to-purple-600 text-white shadow-md'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <FileText className="w-4 h-4" />
              <span>Notes Board ({notes.length})</span>
            </button>
            <button
              onClick={() => setActiveTab('activities')}
              className={`flex items-center space-x-2 px-4 py-2 rounded-lg text-sm font-semibold transition-all ${
                activeTab === 'activities'
                  ? 'bg-gradient-to-r from-indigo-500 to-purple-600 text-white shadow-md'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <Activity className="w-4 h-4" />
              <span>Audit Timeline ({activities.length})</span>
            </button>
          </div>

          {/* Search Form */}
          <form onSubmit={handleSearchSubmit} className="flex-1 max-w-md">
            <div className="relative">
              <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                placeholder="Search notes, remarks, attendees, or entities..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-10 pr-4 py-2 bg-slate-800/80 border border-slate-700 rounded-xl text-white placeholder-slate-500 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/50"
              />
            </div>
          </form>
        </div>

        {/* Sub-Filters */}
        <div className="flex flex-wrap items-center gap-3 pt-3 border-t border-slate-800/80 text-xs">
          <div className="flex items-center space-x-1.5 text-slate-400 font-medium">
            <Filter className="w-3.5 h-3.5" />
            <span>Entity Scope:</span>
          </div>
          {['ALL', 'DEAL', 'CUSTOMER', 'LEAD', 'CONTACT', 'PRODUCT', 'GENERAL'].map((type) => (
            <button
              key={type}
              onClick={() => setSelectedEntityType(type)}
              className={`px-3 py-1.5 rounded-lg border transition-all ${
                selectedEntityType === type
                  ? 'bg-indigo-500/20 border-indigo-500 text-indigo-300 font-semibold'
                  : 'bg-slate-800/50 border-slate-700/60 text-slate-400 hover:text-white'
              }`}
            >
              {type === 'ALL' ? 'All Entities' : type}
            </button>
          ))}

          {activeTab === 'notes' && (
            <button
              onClick={() => setPinnedOnly(!pinnedOnly)}
              className={`ml-auto flex items-center space-x-1 px-3 py-1.5 rounded-lg border transition-all ${
                pinnedOnly
                  ? 'bg-amber-500/20 border-amber-500 text-amber-300 font-semibold'
                  : 'bg-slate-800/50 border-slate-700/60 text-slate-400 hover:text-white'
              }`}
            >
              <Pin className="w-3.5 h-3.5" />
              <span>Pinned Only</span>
            </button>
          )}

          {activeTab === 'activities' && (
            <div className="ml-auto flex items-center space-x-2">
              <span className="text-slate-400">Activity Type:</span>
              <select
                value={selectedActivityType}
                onChange={(e) => setSelectedActivityType(e.target.value)}
                className="px-3 py-1.5 bg-slate-800 border border-slate-700 rounded-lg text-white text-xs focus:outline-none"
              >
                <option value="ALL">All Activity Types</option>
                <option value="MEETING_SCHEDULED">Meetings & Discussions</option>
                <option value="CALL_LOGGED">Calls</option>
                <option value="EMAIL_SENT">Emails</option>
                <option value="NOTE_CREATED">Notes Added</option>
                <option value="STAGE_CHANGED">Stage Changes</option>
                <option value="TASK_COMPLETED">Tasks Completed</option>
              </select>
            </div>
          )}
        </div>
      </div>

      {/* Main Content Area */}
      {loading ? (
        <div className="flex items-center justify-center py-16 text-slate-500 text-sm animate-pulse">
          Loading {activeTab === 'notes' ? 'smart notes board' : 'audit timeline stream'}...
        </div>
      ) : activeTab === 'notes' ? (
        notes.length === 0 ? (
          <div className="p-12 text-center bg-slate-900/40 border border-slate-800/80 rounded-2xl">
            <FileText className="w-10 h-10 text-slate-600 mx-auto mb-3" />
            <h3 className="text-base font-semibold text-white">No Notes Found</h3>
            <p className="text-xs text-slate-400 mt-1 max-w-sm mx-auto">
              Get started by adding rich notes with pinned priorities, tags, and entity attachments.
            </p>
            <button
              onClick={() => setIsNoteModalOpen(true)}
              className="mt-4 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold rounded-xl shadow transition-all"
            >
              + Create First Note
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {notes.map((note) => (
              <div
                key={note.id}
                className={`p-5 rounded-2xl border transition-all flex flex-col justify-between group ${getColorClass(
                  note.colorTag
                )} ${note.isPinned ? 'ring-2 ring-amber-400/60 shadow-xl' : 'shadow-md'}`}
              >
                <div>
                  {/* Top Bar: Entity Badge & Pin */}
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex flex-wrap items-center gap-1.5">
                      <span className="px-2 py-0.5 bg-slate-900/80 border border-slate-700/80 rounded-md text-[10px] font-bold text-indigo-300">
                        {note.entityType} {note.entityId ? `#${note.entityId}` : ''}
                      </span>
                      {note.entityTitle && (
                        <span className="text-[11px] font-medium text-slate-300 truncate max-w-[140px]">
                          {note.entityTitle}
                        </span>
                      )}
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
                          <Edit2 className="w-4 h-4" />
                        </button>
                      )}
                      {(isAdmin || isManager || note.authorId === user?.id) && (
                        <button
                          onClick={() => handleTogglePin(note.id)}
                          className={`p-1 rounded transition-colors ${
                            note.isPinned
                              ? 'text-amber-400 hover:text-amber-300'
                              : 'text-slate-400 hover:text-amber-400'
                          }`}
                          title={note.isPinned ? 'Unpin from Top' : 'Pin to Top'}
                        >
                          <Pin className={`w-4 h-4 ${note.isPinned ? 'fill-amber-400 rotate-45' : ''}`} />
                        </button>
                      )}
                      {isAdmin && (
                        <button
                          onClick={() => handleDeleteNote(note.id)}
                          className="p-1 text-slate-400 hover:text-rose-400 rounded transition-colors opacity-0 group-hover:opacity-100"
                          title="Delete Note (Admin Only)"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Title & Body */}
                  <h3 className="text-sm font-bold text-white mt-3 leading-snug">{note.title}</h3>
                  <p className="text-xs text-slate-300 mt-2 whitespace-pre-line leading-relaxed line-clamp-6">
                    {note.content}
                  </p>

                  {/* Tags */}
                  {note.tags && (
                    <div className="flex flex-wrap gap-1.5 mt-3">
                      {note.tags.split(',').map((t, idx) => (
                        <span
                          key={idx}
                          className="px-2 py-0.5 bg-slate-900/70 border border-slate-700/60 rounded-md text-[10px] font-medium text-slate-300"
                        >
                          #{t.trim()}
                        </span>
                      ))}
                    </div>
                  )}
                </div>

                {/* Footer Metadata */}
                <div className="flex items-center justify-between mt-4 pt-3 border-t border-slate-800/80 text-[11px] text-slate-400">
                  <div className="flex items-center space-x-1.5">
                    {note.visibility === 'PRIVATE_OWNER' ? (
                      <span className="flex items-center space-x-1 text-rose-400" title="Private note">
                        <Lock className="w-3 h-3" />
                        <span>Private</span>
                      </span>
                    ) : note.visibility === 'MANAGERS_ONLY' ? (
                      <span className="flex items-center space-x-1 text-purple-400" title="Managers only">
                        <Shield className="w-3 h-3" />
                        <span>Managers</span>
                      </span>
                    ) : (
                      <span className="flex items-center space-x-1 text-slate-400" title="Team visibility">
                        <Users className="w-3 h-3" />
                        <span>{note.authorName}</span>
                      </span>
                    )}
                  </div>
                  <span>{new Date(note.createdAt).toLocaleDateString()}</span>
                </div>
              </div>
            ))}
          </div>
        )
      ) : activities.length === 0 ? (
        <div className="p-12 text-center bg-slate-900/40 border border-slate-800/80 rounded-2xl">
          <Activity className="w-10 h-10 text-slate-600 mx-auto mb-3" />
          <h3 className="text-base font-semibold text-white">No Activities Recorded</h3>
          <p className="text-xs text-slate-400 mt-1 max-w-sm mx-auto">
            Audit interactions, stage conversions, and events will appear here in chronological order.
          </p>
          <button
            onClick={() => setIsActivityModalOpen(true)}
            className="mt-4 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold rounded-xl shadow transition-all"
          >
            + Log Activity
          </button>
        </div>
      ) : (
        <div className="p-6 bg-slate-900/60 border border-slate-800 rounded-2xl backdrop-blur-xl">
          <div className="relative pl-8 space-y-6 before:absolute before:left-3.5 before:top-3 before:bottom-3 before:w-0.5 before:bg-slate-800">
            {activities.map((act) => (
              <div key={act.id} className="relative group">
                <div className="absolute -left-8 top-1.5 p-1.5 bg-slate-900 border border-slate-700 rounded-full shadow-lg">
                  {getActivityIcon(act.activityType)}
                </div>

                <div className="p-4 bg-slate-800/40 hover:bg-slate-800/80 border border-slate-800 hover:border-slate-700/80 rounded-2xl transition-all shadow-sm">
                  <div className="flex flex-wrap items-start justify-between gap-2">
                    <div className="flex items-center space-x-2">
                      <h4 className="text-sm font-semibold text-white">{act.title}</h4>
                      {act.entityType && (
                        <span className="px-2 py-0.5 bg-indigo-500/20 border border-indigo-500/40 rounded text-[10px] font-bold text-indigo-300">
                          {act.entityType} {act.entityId ? `#${act.entityId}` : ''}
                        </span>
                      )}
                      {act.entityTitle && (
                        <span className="text-xs text-slate-400">({act.entityTitle})</span>
                      )}
                    </div>
                    <span className="text-xs text-slate-500 whitespace-nowrap">
                      {new Date(act.createdAt).toLocaleDateString()} at{' '}
                      {new Date(act.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>

                  {act.description && (
                    <p className="text-xs text-slate-300 mt-2 leading-relaxed whitespace-pre-line">
                      {act.description}
                    </p>
                  )}

                  <div className="flex items-center justify-between mt-3 pt-2.5 border-t border-slate-800/80 text-[11px] text-slate-500">
                    <span>
                      Logged by <strong className="text-slate-300 font-medium">{act.actorName}</strong> ({act.actorRole.replace('ROLE_', '')})
                    </span>
                    <span className="px-2 py-0.5 bg-slate-800 rounded-md border border-slate-700/60 text-slate-400 text-[10px]">
                      {act.activityType.replace(/_/g, ' ')}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Modals */}
      <CreateNoteModal
        isOpen={isNoteModalOpen}
        onClose={() => setIsNoteModalOpen(false)}
        onSubmit={handleCreateNote}
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
      />
    </div>
  );
};
