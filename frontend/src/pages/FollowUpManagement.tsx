import React, { useEffect, useState } from 'react';
import { followupApi } from '../api/followupApi';
import { userApi } from '../api/userApi';
import {
  FollowUp,
  FollowUpStatus,
  FollowUpChannel,
  FollowUpOutcome,
  FollowUpPriority,
  FollowUpStats,
  CreateFollowUpRequest,
  UpdateFollowUpRequest,
  CompleteFollowUpRequest,
} from '../types/followup';
import { User } from '../types/auth';
import { useAuth } from '../context/AuthContext';
import { FollowUpStatusBadge } from '../components/followups/FollowUpStatusBadge';
import { FollowUpOutcomeBadge } from '../components/followups/FollowUpOutcomeBadge';
import { FollowUpChannelBadge } from '../components/followups/FollowUpChannelBadge';
import { CreateFollowUpModal } from '../components/followups/CreateFollowUpModal';
import { LogOutcomeModal } from '../components/followups/LogOutcomeModal';
import { EditFollowUpModal } from '../components/followups/EditFollowUpModal';
import { FollowUpDetailsModal } from '../components/followups/FollowUpDetailsModal';
import { DeleteFollowUpModal } from '../components/followups/DeleteFollowUpModal';
import { ConfigureCadencesModal } from '../components/followups/ConfigureCadencesModal';
import {
  PhoneCall,
  Calendar,
  CheckCircle2,
  Clock,
  Plus,
  Search,
  LayoutGrid,
  List as ListIcon,
  Eye,
  Edit2,
  Trash2,
  Sliders,
  UserCheck,
  Users,
  Shield,
  Link2,
  Award,
  AlertCircle,
  RefreshCw,
} from 'lucide-react';
import { triggerRefreshBlink } from '../components/common/RefreshFeedbackOverlay';

export const FollowUpManagement: React.FC = () => {
  const { user } = useAuth();
  const isAdmin = user?.role === 'ROLE_ADMIN';
  const isManager = user?.role === 'ROLE_MANAGER';
  const isEmployee = !isAdmin && !isManager;

  const [followUps, setFollowUps] = useState<FollowUp[]>([]);
  const [stats, setStats] = useState<FollowUpStats | null>(null);
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [claimLoadingId, setClaimLoadingId] = useState<number | null>(null);

  // Filters & View: default tab for Employee is "today"
  const [search, setSearch] = useState('');
  const [activeTab, setActiveTab] = useState<'all' | 'unassigned' | 'today' | 'my' | 'completed' | 'missed' | 'cancelled'>(
    isEmployee ? 'today' : 'all'
  );
  const [statusFilter, setStatusFilter] = useState<FollowUpStatus | ''>('');
  const [channelFilter, setChannelFilter] = useState<FollowUpChannel | ''>('');
  const [outcomeFilter, setOutcomeFilter] = useState<FollowUpOutcome | ''>('');
  const [priorityFilter, setPriorityFilter] = useState<FollowUpPriority | ''>('');
  const [viewMode, setViewMode] = useState<'cards' | 'table'>('cards');
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Modals state
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isLogOutcomeOpen, setIsLogOutcomeOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isDetailsOpen, setIsDetailsOpen] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [isCadenceOpen, setIsCadenceOpen] = useState(false);
  const [selectedFollowUp, setSelectedFollowUp] = useState<FollowUp | null>(null);
  const [deleteLoading, setDeleteLoading] = useState(false);

  const fetchFollowUpsAndStats = async () => {
    try {
      setLoading(true);

      // 1. Fetch Follow-ups based on role
      let loaded: FollowUp[] = [];
      if (isEmployee) {
        if (activeTab === 'unassigned') {
          const unassignedRes = await followupApi.getUnassignedFollowUps();
          loaded = unassignedRes.success && unassignedRes.data ? unassignedRes.data : [];
        } else {
          const schedRes = await followupApi.getMySchedule();
          loaded = schedRes.success && schedRes.data ? schedRes.data : [];
        }
      } else {
        const followUpsRes = await followupApi.getFollowUps({
          search: search || undefined,
          status: statusFilter ? (statusFilter as FollowUpStatus) : undefined,
          channel: channelFilter ? (channelFilter as FollowUpChannel) : undefined,
          outcome: outcomeFilter ? (outcomeFilter as FollowUpOutcome) : undefined,
          priority: priorityFilter ? (priorityFilter as FollowUpPriority) : undefined,
        });
        loaded = followUpsRes.success && followUpsRes.data ? followUpsRes.data : [];
      }

      // 2. Fetch Users
      let availableAssignees: User[] = [];
      if (isManager) {
        const teamMembers = await userApi.getTeamMembers();
        availableAssignees = user ? [user, ...(teamMembers || [])] : teamMembers || [];
      } else if (isEmployee && user) {
        availableAssignees = [user];
      } else {
        availableAssignees = (await userApi.getAllUsers()) || [];
      }

      // 3. Fetch Stats
      const statsRes = await followupApi.getStats();
      if (statsRes.success && statsRes.data) {
        setStats(statsRes.data);
      }

      // 4. Tab filtering (client-side refinement)
      if (activeTab === 'unassigned') {
        loaded = loaded.filter((f) => !f.assignedToUserId);
      } else if (activeTab === 'my' && user) {
        loaded = loaded.filter((f) => f.assignedToUserId === user.id);
      } else if (activeTab === 'today') {
        const todayStr = new Date().toISOString().slice(0, 10);
        loaded = loaded.filter((f) => f.scheduledAt?.startsWith(todayStr));
      } else if (activeTab === 'completed') {
        loaded = loaded.filter((f) => f.status === 'COMPLETED');
      } else if (activeTab === 'missed') {
        loaded = loaded.filter((f) => f.isOverdue && f.status === 'SCHEDULED');
      } else if (activeTab === 'cancelled') {
        loaded = loaded.filter((f) => f.status === 'CANCELLED');
      }

      // Client search filter if employee
      if (isEmployee && search.trim()) {
        const q = search.toLowerCase();
        loaded = loaded.filter(
          (f) =>
            f.title?.toLowerCase().includes(q) ||
            f.notes?.toLowerCase().includes(q) ||
            f.targetName?.toLowerCase().includes(q)
        );
      }

      setFollowUps(loaded);
      setUsers(availableAssignees);
    } catch (err) {
      console.error('Failed to load follow-ups:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchFollowUpsAndStats();
  }, [search, activeTab, statusFilter, channelFilter, outcomeFilter, priorityFilter]);

  // Actions
  const handleCreate = async (data: CreateFollowUpRequest) => {
    const res = await followupApi.createFollowUp(data);
    if (res.success) {
      fetchFollowUpsAndStats();
    }
  };

  const handleUpdate = async (id: number, data: UpdateFollowUpRequest) => {
    const res = await followupApi.updateFollowUp(id, data);
    if (res.success) {
      fetchFollowUpsAndStats();
    }
  };

  const handleCompleteWithOutcome = async (id: number, data: CompleteFollowUpRequest) => {
    const res = await followupApi.completeFollowUp(id, data);
    if (res.success) {
      fetchFollowUpsAndStats();
    }
  };

  const handleClaim = async (id: number) => {
    try {
      setClaimLoadingId(id);
      const res = await followupApi.claimFollowUp(id);
      if (res.success) {
        fetchFollowUpsAndStats();
      }
    } catch (err) {
      console.error('Failed to claim follow-up:', err);
    } finally {
      setClaimLoadingId(null);
    }
  };

  const handleDelete = async () => {
    if (!selectedFollowUp) return;
    try {
      setDeleteLoading(true);
      const res = await followupApi.deleteFollowUp(selectedFollowUp.id, true);
      if (res.success) {
        setIsDeleteOpen(false);
        setSelectedFollowUp(null);
        fetchFollowUpsAndStats();
      }
    } catch (err) {
      console.error('Failed to delete follow-up:', err);
    } finally {
      setDeleteLoading(false);
    }
  };

  // Build Tab List based on Role
  const availableTabs = [
    ...(isAdmin || isManager ? [{ id: 'all', label: isManager ? 'Team & Unassigned' : 'All Follow-Ups' }] : []),
    { id: 'today', label: "Today's Schedule" },
    { id: 'my', label: 'My Follow-Ups' },
    { id: 'unassigned', label: 'Unassigned Pool' },
    { id: 'completed', label: 'Completed Logs' },
    { id: 'missed', label: 'Missed / Overdue' },
    { id: 'cancelled', label: 'Cancelled' },
  ];

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Header & Role Scope Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2.5">
            <h1 className="text-2xl font-bold text-slate-100">Follow-Up & Cadence Management</h1>
            {isAdmin ? (
              <span className="px-2.5 py-0.5 rounded-full bg-indigo-500/10 text-indigo-400 border border-indigo-500/30 text-xs font-semibold flex items-center gap-1">
                <Shield className="w-3 h-3" /> 🌐 Organization-Wide
              </span>
            ) : isManager ? (
              <span className="px-2.5 py-0.5 rounded-full bg-blue-500/10 text-blue-400 border border-blue-500/30 text-xs font-semibold flex items-center gap-1">
                <Users className="w-3 h-3" /> 👥 Team Scope & Unassigned
              </span>
            ) : (
              <span className="px-2.5 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 text-xs font-semibold flex items-center gap-1">
                <UserCheck className="w-3 h-3" /> 👤 Personal Agenda & Schedule
              </span>
            )}
          </div>
          <p className="text-sm text-slate-400 mt-1">
            {isAdmin
              ? 'Organization-wide omnichannel touchpoint tracking, cadence sequences, and rep performance analytics'
              : isManager
              ? 'Team touchpoint adherence, assigned client interactions, unassigned lead routing, and outcome logs'
              : 'Your scheduled calls, meetings, unassigned lead claiming, and interaction outcome records'}
          </p>
        </div>

        <div className="flex items-center space-x-3">
          {/* Admin Cadence Configuration Button */}
          {isAdmin && (
            <button
              onClick={() => setIsCadenceOpen(true)}
              className="flex items-center space-x-1.5 px-3.5 py-2 bg-slate-900 hover:bg-slate-800 text-slate-200 border border-slate-700/80 rounded-xl text-xs font-semibold transition-all shadow-sm"
              title="Configure Cadence Intervals & Sequence Automation"
            >
              <Sliders className="w-3.5 h-3.5 text-indigo-400" />
              <span>Cadence Settings</span>
            </button>
          )}

          {/* View toggle */}
          <div className="flex items-center bg-slate-900 border border-slate-800 rounded-xl p-1">
            <button
              onClick={() => setViewMode('cards')}
              className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
                viewMode === 'cards'
                  ? 'bg-indigo-600 text-white shadow'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <LayoutGrid className="w-3.5 h-3.5" />
              <span>Cards</span>
            </button>
            <button
              onClick={() => setViewMode('table')}
              className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
                viewMode === 'table'
                  ? 'bg-indigo-600 text-white shadow'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <ListIcon className="w-3.5 h-3.5" />
              <span>Table</span>
            </button>
          </div>

          <button
            onClick={() => {
              setIsRefreshing(true);
              triggerRefreshBlink('Follow-ups refreshed');
              fetchFollowUpsAndStats();
              setTimeout(() => setIsRefreshing(false), 600);
            }}
            title="Refresh Follow-ups"
            className="flex items-center space-x-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold text-slate-300 bg-slate-900 hover:bg-slate-800 border border-slate-700 transition active:scale-95"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isRefreshing ? 'animate-spin text-indigo-400' : ''}`} />
            <span className="hidden sm:inline">Refresh</span>
          </button>

          <button
            onClick={() => setIsCreateOpen(true)}
            className="flex items-center space-x-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-semibold rounded-xl shadow-lg shadow-indigo-600/20 transition-all hover:shadow-indigo-600/40"
          >
            <Plus className="w-4 h-4" />
            <span>Schedule Follow-Up</span>
          </button>
        </div>
      </div>

      {/* Top Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-slate-900 border border-slate-800 p-5 rounded-2xl relative overflow-hidden group hover:border-slate-700 transition-all">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
              Scheduled Today
            </span>
            <div className="w-9 h-9 rounded-xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-blue-400">
              <Calendar className="w-5 h-5" />
            </div>
          </div>
          <div className="text-2xl font-bold text-slate-100 mt-2">
            {stats?.scheduledToday ?? (loading ? '...' : 0)}
          </div>
          <div className="text-xs text-blue-400 mt-1">
            {isEmployee ? 'Your calls & meetings today' : 'Active calls & meetings today'}
          </div>
        </div>

        <div className="bg-slate-900 border border-slate-800 p-5 rounded-2xl relative overflow-hidden group hover:border-slate-700 transition-all">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
              {isEmployee ? 'My Touchpoints' : isManager ? 'Team Touchpoints' : 'Total Touchpoints'}
            </span>
            <div className="w-9 h-9 rounded-xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400">
              <PhoneCall className="w-5 h-5" />
            </div>
          </div>
          <div className="text-2xl font-bold text-indigo-300 mt-2">
            {stats?.totalFollowUps ?? (loading ? '...' : 0)}
          </div>
          <div className="text-xs text-slate-400 mt-1">
            {stats?.totalScheduled ?? 0} pending schedule
          </div>
        </div>

        <div className="bg-slate-900 border border-slate-800 p-5 rounded-2xl relative overflow-hidden group hover:border-slate-700 transition-all">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
              Completed Logs
            </span>
            <div className="w-9 h-9 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
              <CheckCircle2 className="w-5 h-5" />
            </div>
          </div>
          <div className="text-2xl font-bold text-emerald-400 mt-2">
            {stats?.totalCompleted ?? (loading ? '...' : 0)}
          </div>
          <div className="text-xs text-emerald-400/80 mt-1">
            Interaction notes saved
          </div>
        </div>

        <div className="bg-slate-900 border border-slate-800 p-5 rounded-2xl relative overflow-hidden group hover:border-slate-700 transition-all">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
              {isEmployee ? 'My Success Rate' : isManager ? 'Team Success Rate' : 'Outcome Success Rate'}
            </span>
            <div className="w-9 h-9 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400">
              <Award className="w-5 h-5" />
            </div>
          </div>
          <div className="text-2xl font-bold text-amber-400 mt-2">
            {stats?.successRate ?? 0}%
          </div>
          <div className="text-xs text-amber-400/80 mt-1">
            {stats?.positiveOutcomes ?? 0} positive deals / proposals
          </div>
        </div>
      </div>

      {/* Quick Filter Tabs */}
      <div className="flex flex-wrap gap-2 border-b border-slate-800 pb-3">
        {availableTabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as any)}
            className={`px-4 py-2 rounded-xl text-xs font-semibold transition-all ${
              activeTab === tab.id
                ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/20'
                : 'bg-slate-900 text-slate-400 hover:text-slate-200 border border-slate-800'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Search and Filters */}
      <div className="bg-slate-900 border border-slate-800 p-4 rounded-2xl flex flex-col md:flex-row gap-3 items-center justify-between">
        <div className="relative w-full md:w-80">
          <Search className="w-4 h-4 text-slate-500 absolute left-3 top-3" />
          <input
            type="text"
            placeholder="Search follow-ups by subject, target, notes..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2 bg-slate-950 border border-slate-800 rounded-xl text-slate-200 text-sm focus:outline-none focus:border-indigo-500 transition-colors"
          />
        </div>

        <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
          <select
            value={channelFilter}
            onChange={(e) => setChannelFilter(e.target.value as FollowUpChannel | '')}
            className="px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-slate-200 text-sm focus:outline-none focus:border-indigo-500"
          >
            <option value="">All Channels</option>
            <option value="PHONE_CALL">Phone Call</option>
            <option value="VIDEO_CONFERENCE">Video Conference</option>
            <option value="EMAIL">Email Outreach</option>
            <option value="IN_PERSON_MEETING">In-Person Meeting</option>
            <option value="WHATSAPP_SMS">WhatsApp / SMS</option>
            <option value="LINKEDIN_MESSAGE">LinkedIn Message</option>
          </select>

          <select
            value={outcomeFilter}
            onChange={(e) => setOutcomeFilter(e.target.value as FollowUpOutcome | '')}
            className="px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-slate-200 text-sm focus:outline-none focus:border-indigo-500"
          >
            <option value="">All Outcomes</option>
            <option value="INTERESTED">Interested</option>
            <option value="PROPOSAL_REQUESTED">Proposal Requested</option>
            <option value="MEETING_BOOKED">Meeting Booked</option>
            <option value="CALLBACK_REQUESTED">Callback Requested</option>
            <option value="DEAL_WON">Deal Won</option>
            <option value="NOT_INTERESTED">Not Interested</option>
            <option value="NO_ANSWER">No Answer</option>
          </select>

          <select
            value={priorityFilter}
            onChange={(e) => setPriorityFilter(e.target.value as FollowUpPriority | '')}
            className="px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-slate-200 text-sm focus:outline-none focus:border-indigo-500"
          >
            <option value="">All Priorities</option>
            <option value="URGENT">Urgent (P0)</option>
            <option value="HIGH">High</option>
            <option value="MEDIUM">Medium</option>
            <option value="LOW">Low</option>
          </select>

          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as FollowUpStatus | '')}
            className="px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-slate-200 text-sm focus:outline-none focus:border-indigo-500"
          >
            <option value="">All Statuses</option>
            <option value="SCHEDULED">Scheduled</option>
            <option value="COMPLETED">Completed</option>
            <option value="MISSED">Missed</option>
            <option value="RESCHEDULED">Rescheduled</option>
          </select>
        </div>
      </div>

      {/* Main View: Cards Grid vs Data Table */}
      {viewMode === 'cards' ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {followUps.length === 0 ? (
            <div className="col-span-full py-16 text-center border border-dashed border-slate-800 rounded-2xl text-slate-500 text-sm">
              No follow-up touchpoints match your criteria.
            </div>
          ) : (
            followUps.map((f) => {
              const canLogOutcome = !isEmployee || f.assignedToUserId === user?.id;
              const isUnassigned = !f.assignedToUserId;

              return (
                <div
                  key={f.id}
                  className="bg-slate-900 border border-slate-800 hover:border-indigo-500/50 rounded-2xl p-5 shadow-lg hover:shadow-indigo-500/10 transition-all flex flex-col justify-between group"
                >
                  <div className="space-y-3.5">
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <FollowUpChannelBadge channel={f.channel} />
                        <FollowUpStatusBadge status={f.status} />
                      </div>
                      {f.isOverdue && (
                        <span className="text-[10px] bg-rose-500/10 text-rose-400 border border-rose-500/30 px-1.5 py-0.5 rounded font-bold">
                          Overdue
                        </span>
                      )}
                    </div>

                    <div>
                      <h3
                        onClick={() => {
                          setSelectedFollowUp(f);
                          setIsDetailsOpen(true);
                        }}
                        className="text-base font-bold text-slate-100 group-hover:text-indigo-300 transition-colors cursor-pointer leading-snug"
                      >
                        {f.title}
                      </h3>
                      {f.targetName && (
                        <div className="flex items-center gap-1.5 text-xs text-slate-400 mt-1">
                          <Link2 className="w-3.5 h-3.5 text-slate-500 shrink-0" />
                          <span className="font-medium text-slate-300">{f.targetName}</span>
                        </div>
                      )}
                    </div>

                    <div className="p-2.5 rounded-xl bg-slate-950/70 border border-slate-800/80 text-xs space-y-1.5">
                      <div className="flex items-center justify-between text-slate-400 text-[11px]">
                        <span className="flex items-center gap-1">
                          <Clock className="w-3 h-3 text-slate-500" />
                          {new Date(f.scheduledAt).toLocaleString()}
                        </span>
                        <span className={isUnassigned ? 'text-amber-400 font-semibold' : ''}>
                          {f.assignedToUserName?.split(' ')[0] || 'Unassigned Pool'}
                        </span>
                      </div>
                      {f.outcome !== 'PENDING' && (
                        <div className="pt-1 flex items-center gap-1.5">
                          <span className="text-[10px] text-slate-500 uppercase">Outcome:</span>
                          <FollowUpOutcomeBadge outcome={f.outcome} />
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Card Actions */}
                  <div className="pt-4 mt-4 border-t border-slate-800/80 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      {isUnassigned && (
                        <button
                          onClick={() => handleClaim(f.id)}
                          disabled={claimLoadingId === f.id}
                          className="flex items-center gap-1.5 px-3 py-1.5 bg-indigo-600/20 hover:bg-indigo-600/30 text-indigo-300 border border-indigo-500/30 rounded-xl text-xs font-bold transition-all disabled:opacity-50"
                        >
                          <UserCheck className="w-3.5 h-3.5" />
                          <span>{claimLoadingId === f.id ? 'Claiming...' : 'Claim Lead'}</span>
                        </button>
                      )}

                      {f.status !== 'COMPLETED' ? (
                        canLogOutcome ? (
                          <button
                            onClick={() => {
                              setSelectedFollowUp(f);
                              setIsLogOutcomeOpen(true);
                            }}
                            className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-600/15 hover:bg-emerald-600/25 text-emerald-400 border border-emerald-500/30 rounded-xl text-xs font-bold transition-all"
                          >
                            <CheckCircle2 className="w-3.5 h-3.5" />
                            Log Outcome
                          </button>
                        ) : (
                          <span
                            className="text-xs text-slate-500 italic flex items-center gap-1 cursor-not-allowed"
                            title="You can only log outcomes for your own assigned touchpoints"
                          >
                            <AlertCircle className="w-3.5 h-3.5" /> Assigned to other
                          </span>
                        )
                      ) : (
                        <span className="text-xs text-emerald-400 font-semibold flex items-center gap-1">
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          Completed
                        </span>
                      )}
                    </div>

                    <div className="flex items-center space-x-1">
                      <button
                        onClick={() => {
                          setSelectedFollowUp(f);
                          setIsDetailsOpen(true);
                        }}
                        className="p-1.5 text-slate-400 hover:text-indigo-400 rounded-lg hover:bg-slate-800 transition-colors"
                        title="View Details"
                      >
                        <Eye className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => {
                          setSelectedFollowUp(f);
                          setIsEditOpen(true);
                        }}
                        className="p-1.5 text-slate-400 hover:text-amber-400 rounded-lg hover:bg-slate-800 transition-colors"
                        title="Edit Follow-up"
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>
                      {isAdmin && (
                        <button
                          onClick={() => {
                            setSelectedFollowUp(f);
                            setIsDeleteOpen(true);
                          }}
                          className="p-1.5 rounded-lg text-slate-400 hover:text-rose-400 hover:bg-slate-800 transition-colors"
                          title="Delete Follow-Up Record"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      ) : (
        /* TABLE VIEW */
        <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-800 bg-slate-900/80 text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                  <th className="px-6 py-4">Subject / Target</th>
                  <th className="px-6 py-4">Channel</th>
                  <th className="px-6 py-4">Scheduled At</th>
                  <th className="px-6 py-4">Status</th>
                  <th className="px-6 py-4">Outcome</th>
                  <th className="px-6 py-4">Rep</th>
                  <th className="px-6 py-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 text-sm">
                {followUps.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="px-6 py-12 text-center text-slate-500 text-sm">
                      No follow-up touchpoints found.
                    </td>
                  </tr>
                ) : (
                  followUps.map((f) => {
                    const canLogOutcome = !isEmployee || f.assignedToUserId === user?.id;
                    const isUnassigned = !f.assignedToUserId;

                    return (
                      <tr key={f.id} className="hover:bg-slate-800/30 transition-colors">
                        <td className="px-6 py-4">
                          <div>
                            <div className="font-semibold text-slate-100">{f.title}</div>
                            {f.targetName && (
                              <div className="text-xs text-slate-400 flex items-center gap-1 mt-0.5">
                                <Link2 className="w-3 h-3 text-slate-500" />
                                <span>{f.targetName}</span>
                              </div>
                            )}
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <FollowUpChannelBadge channel={f.channel} />
                        </td>
                        <td className="px-6 py-4 text-xs">
                          <span className={f.isOverdue ? 'text-rose-400 font-bold' : 'text-slate-300'}>
                            {new Date(f.scheduledAt).toLocaleString()}
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          <FollowUpStatusBadge status={f.status} />
                        </td>
                        <td className="px-6 py-4">
                          <FollowUpOutcomeBadge outcome={f.outcome} />
                        </td>
                        <td className="px-6 py-4 text-xs text-slate-300">
                          {f.assignedToUserName || <span className="text-amber-400 font-semibold">Unassigned</span>}
                        </td>
                        <td className="px-6 py-4 text-right">
                          <div className="flex items-center justify-end space-x-2">
                            {isUnassigned && (
                              <button
                                onClick={() => handleClaim(f.id)}
                                disabled={claimLoadingId === f.id}
                                className="px-2.5 py-1 bg-indigo-600/20 text-indigo-300 border border-indigo-500/30 rounded-lg text-xs font-semibold hover:bg-indigo-600/30 transition-colors disabled:opacity-50"
                              >
                                {claimLoadingId === f.id ? 'Claiming...' : 'Claim'}
                              </button>
                            )}
                            {f.status !== 'COMPLETED' && canLogOutcome && (
                              <button
                                onClick={() => {
                                  setSelectedFollowUp(f);
                                  setIsLogOutcomeOpen(true);
                                }}
                                className="px-2.5 py-1 bg-emerald-600/20 text-emerald-400 border border-emerald-500/30 rounded-lg text-xs font-semibold hover:bg-emerald-600/30 transition-colors"
                              >
                                Log
                              </button>
                            )}
                            <button
                              onClick={() => {
                                setSelectedFollowUp(f);
                                setIsDetailsOpen(true);
                              }}
                              className="p-1.5 text-slate-400 hover:text-indigo-400 rounded-lg hover:bg-slate-800 transition-colors"
                            >
                              <Eye className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => {
                                setSelectedFollowUp(f);
                                setIsEditOpen(true);
                              }}
                              className="p-1.5 text-slate-400 hover:text-amber-400 rounded-lg hover:bg-slate-800 transition-colors"
                              title="Edit Follow-up"
                            >
                              <Edit2 className="w-4 h-4" />
                            </button>
                            {isAdmin && (
                              <button
                                onClick={() => {
                                  setSelectedFollowUp(f);
                                  setIsDeleteOpen(true);
                                }}
                                className="p-1.5 rounded-lg text-slate-400 hover:text-rose-400 hover:bg-slate-800 transition-colors"
                                title="Delete Follow-Up"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Modals */}
      <CreateFollowUpModal
        isOpen={isCreateOpen}
        onClose={() => setIsCreateOpen(false)}
        onSubmit={handleCreate}
        users={users}
      />

      <LogOutcomeModal
        isOpen={isLogOutcomeOpen}
        onClose={() => {
          setIsLogOutcomeOpen(false);
          setSelectedFollowUp(null);
        }}
        onSubmit={handleCompleteWithOutcome}
        followUp={selectedFollowUp}
      />

      <EditFollowUpModal
        isOpen={isEditOpen}
        onClose={() => {
          setIsEditOpen(false);
          setSelectedFollowUp(null);
        }}
        onSubmit={handleUpdate}
        followUp={selectedFollowUp}
        users={users}
      />

      <FollowUpDetailsModal
        isOpen={isDetailsOpen}
        onClose={() => {
          setIsDetailsOpen(false);
          setSelectedFollowUp(null);
        }}
        followUp={selectedFollowUp}
        onOpenLogOutcome={(f: FollowUp) => {
          setSelectedFollowUp(f);
          setIsLogOutcomeOpen(true);
        }}
        onEdit={(f: FollowUp) => {
          setSelectedFollowUp(f);
          setIsEditOpen(true);
        }}
      />

      {isAdmin && (
        <DeleteFollowUpModal
          isOpen={isDeleteOpen}
          onClose={() => {
            setIsDeleteOpen(false);
            setSelectedFollowUp(null);
          }}
          onConfirm={handleDelete}
          followUp={selectedFollowUp}
          loading={deleteLoading}
        />
      )}

      {isAdmin && (
        <ConfigureCadencesModal
          isOpen={isCadenceOpen}
          onClose={() => setIsCadenceOpen(false)}
          onSuccess={() => {
            fetchFollowUpsAndStats();
          }}
        />
      )}
    </div>
  );
};
