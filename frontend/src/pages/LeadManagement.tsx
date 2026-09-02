import React, { useEffect, useState } from 'react';
import { leadApi } from '../api/leadApi';
import { userApi } from '../api/userApi';
import { Lead, LeadStatus, LeadSource, LeadStats, CreateLeadRequest, UpdateLeadRequest } from '../types/lead';
import { User } from '../types/auth';
import { LeadStatusBadge } from '../components/leads/LeadStatusBadge';
import { CreateLeadModal } from '../components/leads/CreateLeadModal';
import { EditLeadModal } from '../components/leads/EditLeadModal';
import { LeadDetailsModal } from '../components/leads/LeadDetailsModal';
import { DeleteLeadModal } from '../components/leads/DeleteLeadModal';
import {
  TrendingUp,
  IndianRupee,
  Users,
  Target,
  Plus,
  Search,
  LayoutGrid,
  List as ListIcon,
  Eye,
  Edit2,
  Trash2,
  CheckCircle2,
  Building,
  AlertTriangle,
  ExternalLink,
  Zap,
  RefreshCw,
} from 'lucide-react';
import { triggerRefreshBlink } from '../components/common/RefreshFeedbackOverlay';

const KANBAN_STAGES: { status: LeadStatus; label: string; color: string; borderDrop: string }[] = [
  { status: 'NEW', label: 'New Inquiries', color: 'border-blue-500/40 text-blue-400', borderDrop: 'border-blue-500 bg-blue-950/20' },
  { status: 'CONTACTED', label: 'Contacted', color: 'border-amber-500/40 text-amber-400', borderDrop: 'border-amber-500 bg-amber-950/20' },
  { status: 'QUALIFIED', label: 'Qualified', color: 'border-emerald-500/40 text-emerald-400', borderDrop: 'border-emerald-500 bg-emerald-950/20' },
  { status: 'PROPOSAL_SENT', label: 'Proposal Sent', color: 'border-indigo-500/40 text-indigo-400', borderDrop: 'border-indigo-500 bg-indigo-950/20' },
  { status: 'NEGOTIATING', label: 'Negotiating', color: 'border-purple-500/40 text-purple-400', borderDrop: 'border-purple-500 bg-purple-950/20' },
  { status: 'CONVERTED', label: 'Converted', color: 'border-teal-500/40 text-teal-400', borderDrop: 'border-teal-500 bg-teal-950/30 ring-2 ring-teal-500/30' }
];

import { useAuth } from '../context/AuthContext';

export const LeadManagement: React.FC = () => {
  const { user } = useAuth();
  const [leads, setLeads] = useState<Lead[]>([]);
  const [stats, setStats] = useState<LeadStats | null>(null);
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);

  // Filters & Search
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<LeadStatus | ''>('');
  const [sourceFilter, setSourceFilter] = useState<LeadSource | ''>('');
  const [viewMode, setViewMode] = useState<'kanban' | 'table'>('kanban');

  // Drag and Drop state
  const [draggedLeadId, setDraggedLeadId] = useState<number | null>(null);
  const [dragOverColumn, setDragOverColumn] = useState<LeadStatus | null>(null);

  // Modals state
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isDetailsOpen, setIsDetailsOpen] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [selectedLead, setSelectedLead] = useState<Lead | null>(null);
  const [deleteLoading, setDeleteLoading] = useState(false);

  // Toast Notification state
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'warning' | 'error' } | null>(null);

  const showToast = (message: string, type: 'success' | 'warning' | 'error' = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 5000);
  };

  const fetchLeadsAndStats = async () => {
    try {
      setLoading(true);
      const isEmployee = user?.role === 'ROLE_EMPLOYEE';
      const isManager = user?.role === 'ROLE_MANAGER';

      const [leadsRes, statsRes, usersRes] = await Promise.all([
        leadApi.getLeads({
          search: search || undefined,
          status: statusFilter ? (statusFilter as LeadStatus) : undefined,
          source: sourceFilter ? (sourceFilter as LeadSource) : undefined,
        }),
        leadApi.getStats(),
        isManager ? userApi.getTeamMembers() : (isEmployee && user ? Promise.resolve([user]) : userApi.getAllUsers()),
      ]);

      let loadedLeads = leadsRes.success && leadsRes.data ? leadsRes.data : [];
      let availableAssignees: User[] = [];

      if (isManager && user) {
        const teamMembers = usersRes || [];
        const teamMemberIds = new Set([user.id, ...teamMembers.map((u: User) => u.id)]);

        // Manager can only see: their assigned leads, their team's leads, and UNASSIGNED leads
        loadedLeads = loadedLeads.filter(
          (l) => !l.assignedToUserId || teamMemberIds.has(l.assignedToUserId)
        );
        availableAssignees = [user, ...teamMembers];
      } else if (isEmployee && user) {
        // Employee can only see their assigned leads and unassigned leads
        loadedLeads = loadedLeads.filter(
          (l) => !l.assignedToUserId || l.assignedToUserId === user.id
        );
        availableAssignees = [user];
      } else {
        availableAssignees = usersRes || [];
      }

      setLeads(loadedLeads);
      setUsers(availableAssignees);

      // Scoped KPI calculation for Manager / Employee
      if (isManager || isEmployee) {
        const totalLeads = loadedLeads.length;
        const newLeads = loadedLeads.filter((l) => l.leadStatus === 'NEW').length;
        const qualifiedLeads = loadedLeads.filter((l) => l.leadStatus === 'QUALIFIED').length;
        const convertedLeads = loadedLeads.filter((l) => l.leadStatus === 'CONVERTED').length;
        const lostLeads = loadedLeads.filter((l) => l.leadStatus === 'LOST').length;
        const totalPipelineValue = loadedLeads
          .filter((l) => l.leadStatus !== 'LOST')
          .reduce((sum, l) => sum + (Number(l.estimatedValue) || 0), 0);
        const conversionRate = totalLeads > 0 ? Number(((convertedLeads / totalLeads) * 100).toFixed(1)) : 0;

        setStats({
          totalLeads,
          newLeads,
          qualifiedLeads,
          convertedLeads,
          lostLeads,
          totalPipelineValue,
          conversionRate,
          statusBreakdown: {} as any,
          sourceBreakdown: {} as any,
        });
      } else if (statsRes.success && statsRes.data) {
        setStats(statsRes.data);
      }
    } catch (err) {
      console.error('Failed to load leads data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLeadsAndStats();
  }, [search, statusFilter, sourceFilter]);

  // Handlers
  const handleCreateLead = async (data: CreateLeadRequest) => {
    const res = await leadApi.createLead(data);
    if (res.success) {
      showToast('New lead captured successfully!');
      fetchLeadsAndStats();
    }
  };

  const handleUpdateLead = async (id: number, data: UpdateLeadRequest) => {
    const res = await leadApi.updateLead(id, data);
    if (res.success) {
      if (data.leadStatus === 'CONVERTED') {
        showToast('Lead converted — Opportunity added to Sales Pipeline.');
      } else {
        showToast('Lead details updated successfully.');
      }
      fetchLeadsAndStats();
    }
  };

  const handleStatusChange = async (id: number, newStatus: LeadStatus) => {
    try {
      const res = await leadApi.updateLeadStatus(id, newStatus);
      if (res.success) {
        if (newStatus === 'CONVERTED') {
          showToast('Lead converted into Sales Deal! Opportunity added to Sales Pipeline.');
        } else {
          showToast(`Lead moved to ${newStatus.replace('_', ' ')}.`);
        }
        fetchLeadsAndStats();
        if (selectedLead && selectedLead.id === id) {
          setSelectedLead(res.data || null);
        }
      }
    } catch (err: any) {
      const errMsg = err?.response?.data?.message || err.message || 'Failed to update lead status';
      showToast(errMsg, 'error');
    }
  };

  const handleConvertLead = async (id: number) => {
    try {
      const res = await leadApi.convertLead(id);
      if (res.success) {
        showToast('Lead converted into Sales Deal! Opportunity added to Sales Pipeline.');
        fetchLeadsAndStats();
        if (selectedLead && selectedLead.id === id) {
          setSelectedLead(res.data || null);
        }
      }
    } catch (err: any) {
      const errMsg = err?.response?.data?.message || err.message || 'Failed to convert lead';
      showToast(errMsg, 'error');
    }
  };

  const handleDeleteLead = async () => {
    if (!selectedLead) return;
    try {
      setDeleteLoading(true);
      const res = await leadApi.deleteLead(selectedLead.id);
      if (res.success) {
        setIsDeleteOpen(false);
        setSelectedLead(null);
        showToast('Lead deleted from pipeline.');
        fetchLeadsAndStats();
      }
    } catch (err) {
      console.error('Failed to delete lead:', err);
    } finally {
      setDeleteLoading(false);
    }
  };

  const formatCurrency = (val?: number) => {
    return '₹' + (val || 0).toLocaleString('en-IN', { maximumFractionDigits: 0 });
  };

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Toast Notification Banner */}
      {toast && (
        <div
          className={`fixed top-5 right-5 z-50 p-4 rounded-xl shadow-2xl backdrop-blur-md flex items-center gap-3 text-sm font-medium border animate-bounce ${
            toast.type === 'success'
              ? 'bg-emerald-500/90 text-white border-emerald-400/30'
              : toast.type === 'warning'
              ? 'bg-amber-500/90 text-white border-amber-400/30'
              : 'bg-rose-500/90 text-white border-rose-400/30'
          }`}
        >
          {toast.type === 'success' ? (
            <CheckCircle2 className="w-5 h-5 text-white shrink-0" />
          ) : (
            <AlertTriangle className="w-5 h-5 text-white shrink-0" />
          )}
          <span>{toast.message}</span>
        </div>
      )}

      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2">
            <h1 className="text-2xl font-bold text-slate-100">Sales Pipeline & Leads</h1>
            <span className="px-2.5 py-0.5 rounded-full bg-indigo-500/10 text-indigo-400 border border-indigo-500/30 text-xs font-semibold flex items-center gap-1">
              <Zap className="w-3 h-3" /> Auto-Conversion Active
            </span>
          </div>
          <p className="text-sm text-slate-400 mt-1">
            Drag and drop prospects through pipeline stages — moving to <strong>Converted</strong> instantly creates a Customer Account
          </p>
        </div>

        <div className="flex items-center space-x-3">
          {/* View toggle */}
          <div className="flex items-center bg-slate-900 border border-slate-800 rounded-xl p-1">
            <button
              onClick={() => setViewMode('kanban')}
              className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                viewMode === 'kanban'
                  ? 'bg-indigo-600 text-white shadow-sm'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <LayoutGrid className="w-4 h-4" />
              <span className="hidden sm:inline">Kanban Board</span>
            </button>
            <button
              onClick={() => setViewMode('table')}
              className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                viewMode === 'table'
                  ? 'bg-indigo-600 text-white shadow-sm'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <ListIcon className="w-4 h-4" />
              <span className="hidden sm:inline">Table List</span>
            </button>
          </div>

          <button
            onClick={() => {
              fetchLeadsAndStats();
              triggerRefreshBlink('Leads refreshed');
            }}
            disabled={loading}
            title="Refresh Leads"
            className="flex items-center space-x-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold text-slate-300 bg-slate-900 hover:bg-slate-800 border border-slate-700 transition disabled:opacity-50"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin text-indigo-400' : ''}`} />
            <span className="hidden sm:inline">Refresh</span>
          </button>

          <button
            onClick={() => setIsCreateOpen(true)}
            className="flex items-center space-x-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-semibold rounded-xl shadow-lg shadow-indigo-600/20 hover:shadow-indigo-600/40 transition-all"
          >
            <Plus className="w-4 h-4" />
            <span>Add Lead</span>
          </button>
        </div>
      </div>

      {/* KPI Stats Bar */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Prospects */}
        <div className="bg-slate-900/60 border border-slate-800/80 p-5 rounded-2xl flex items-center justify-between backdrop-blur-sm group hover:border-slate-700 transition-all">
          <div>
            <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
              Total Prospects
            </p>
            <h3 className="text-2xl font-bold text-slate-100 mt-1">
              {stats?.totalLeads || 0}
            </h3>
            <p className="text-xs text-slate-500 mt-1">
              Active in sales funnel
            </p>
          </div>
          <div className="w-12 h-12 rounded-xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-blue-400">
            <Users className="w-6 h-6" />
          </div>
        </div>

        {/* Qualified Leads */}
        <div className="bg-slate-900/60 border border-slate-800/80 p-5 rounded-2xl flex items-center justify-between backdrop-blur-sm group hover:border-slate-700 transition-all">
          <div>
            <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
              Qualified Deals
            </p>
            <h3 className="text-2xl font-bold text-slate-100 mt-1">
              {stats?.qualifiedLeads || 0}
            </h3>
            <p className="text-xs text-emerald-400 mt-1">
              High intent prospects
            </p>
          </div>
          <div className="w-12 h-12 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
            <Target className="w-6 h-6" />
          </div>
        </div>

        {/* Pipeline Value */}
        <div className="bg-slate-900/60 border border-slate-800/80 p-5 rounded-2xl flex items-center justify-between backdrop-blur-sm group hover:border-slate-700 transition-all">
          <div>
            <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
              Total Pipeline Value
            </p>
            <h3 className="text-2xl font-bold text-slate-100 mt-1">
              {formatCurrency(stats?.totalPipelineValue)}
            </h3>
            <p className="text-xs text-slate-500 mt-1">
              Weighted deal value
            </p>
          </div>
          <div className="w-12 h-12 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400">
            <IndianRupee className="w-6 h-6" />
          </div>
        </div>

        {/* Conversion Rate */}
        <div className="bg-slate-900/60 border border-slate-800/80 p-5 rounded-2xl flex items-center justify-between backdrop-blur-sm group hover:border-slate-700 transition-all">
          <div>
            <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
              Conversion Rate
            </p>
            <h3 className="text-2xl font-bold text-slate-100 mt-1">
              {stats?.conversionRate || 0}%
            </h3>
            <p className="text-xs text-teal-400 mt-1">
              {stats?.convertedLeads || 0} Won Accounts
            </p>
          </div>
          <div className="w-12 h-12 rounded-xl bg-teal-500/10 border border-teal-500/20 flex items-center justify-center text-teal-400">
            <TrendingUp className="w-6 h-6" />
          </div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-slate-900 border border-slate-800 p-4 rounded-2xl flex flex-col md:flex-row gap-3 items-center justify-between">
        <div className="relative w-full md:w-80">
          <Search className="w-4 h-4 text-slate-500 absolute left-3 top-3" />
          <input
            type="text"
            placeholder="Search leads by name, email, company..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2 bg-slate-950 border border-slate-800 rounded-xl text-slate-200 text-sm focus:outline-none focus:border-indigo-500 transition-colors"
          />
        </div>

        <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
          {/* Status Filter */}
          <div className="relative flex-1 md:flex-initial">
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as LeadStatus | '')}
              className="w-full md:w-40 px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-slate-200 text-sm focus:outline-none focus:border-indigo-500"
            >
              <option value="">All Stages</option>
              <option value="NEW">New Inquiries</option>
              <option value="CONTACTED">Contacted</option>
              <option value="QUALIFIED">Qualified</option>
              <option value="PROPOSAL_SENT">Proposal Sent</option>
              <option value="NEGOTIATING">Negotiating</option>
              <option value="CONVERTED">Converted</option>
              <option value="LOST">Lost</option>
            </select>
          </div>

          {/* Source Filter */}
          <div className="relative flex-1 md:flex-initial">
            <select
              value={sourceFilter}
              onChange={(e) => setSourceFilter(e.target.value as LeadSource | '')}
              className="w-full md:w-40 px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-slate-200 text-sm focus:outline-none focus:border-indigo-500"
            >
              <option value="">All Sources</option>
              <option value="WEBSITE">Website</option>
              <option value="REFERRAL">Referral</option>
              <option value="COLD_CALL">Cold Call</option>
              <option value="EMAIL_CAMPAIGN">Email Campaign</option>
              <option value="SOCIAL_MEDIA">Social Media</option>
              <option value="EVENT">Event</option>
              <option value="OTHER">Other</option>
            </select>
          </div>
        </div>
      </div>

      {/* Main View: Kanban Pipeline vs Table */}
      {loading ? (
        <div className="py-20 flex flex-col items-center justify-center text-slate-400">
          <div className="w-8 h-8 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin mb-3" />
          <p className="text-sm">Loading sales pipeline and prospects...</p>
        </div>
      ) : viewMode === 'kanban' ? (
        /* KANBAN PIPELINE VIEW WITH NATIVE DRAG AND DROP */
        <div className="flex gap-4 items-start overflow-x-auto pb-6 pt-1 px-1">
          {KANBAN_STAGES.map((stage) => {
            const columnLeads = leads.filter((l) => l.leadStatus === stage.status);
            const columnTotalValue = columnLeads.reduce((acc, l) => acc + (l.estimatedValue || 0), 0);
            const isDropTarget = dragOverColumn === stage.status;

            return (
              <div
                key={stage.status}
                onDragOver={(e) => {
                  e.preventDefault();
                  e.dataTransfer.dropEffect = 'move';
                  if (dragOverColumn !== stage.status) {
                    setDragOverColumn(stage.status);
                  }
                }}
                onDragLeave={() => {
                  if (dragOverColumn === stage.status) {
                    setDragOverColumn(null);
                  }
                }}
                onDrop={async (e) => {
                  e.preventDefault();
                  setDragOverColumn(null);
                  const leadIdStr = e.dataTransfer.getData('text/plain') || draggedLeadId?.toString();
                  if (leadIdStr) {
                    const leadId = Number(leadIdStr);
                    setDraggedLeadId(null);
                    await handleStatusChange(leadId, stage.status);
                  }
                }}
                className={`border rounded-2xl p-3 flex flex-col w-[260px] min-w-[260px] shrink-0 transition-all ${
                  isDropTarget
                    ? `${stage.borderDrop} shadow-lg scale-[1.01]`
                    : 'bg-slate-900/70 border-slate-800/80'
                }`}
              >
                {/* Column Header */}
                <div className="flex items-center justify-between pb-2 mb-3 border-b border-slate-800">
                  <div className="flex items-center space-x-1.5">
                    <span className={`w-2 h-2 rounded-full ${stage.color.replace('border-', 'bg-').split(' ')[0]}`} />
                    <h3 className="text-xs font-bold text-slate-200 uppercase tracking-wider truncate">
                      {stage.label}
                    </h3>
                  </div>
                  <span className="text-xs px-2 py-0.5 rounded-full bg-slate-800 text-slate-400 font-semibold">
                    {columnLeads.length}
                  </span>
                </div>

                <div className="text-[11px] text-slate-500 font-medium mb-3 px-1">
                  {formatCurrency(columnTotalValue)}
                </div>

                {/* Cards Container */}
                <div className="space-y-3 min-h-[300px]">
                  {columnLeads.length === 0 ? (
                    <div
                      className={`h-24 border border-dashed rounded-xl flex flex-col items-center justify-center text-xs transition-colors ${
                        isDropTarget
                          ? 'border-indigo-500/80 bg-indigo-500/10 text-indigo-300'
                          : 'border-slate-800 text-slate-600'
                      }`}
                    >
                      <span>{isDropTarget ? 'Drop to move here' : 'No leads'}</span>
                    </div>
                  ) : (
                    columnLeads.map((lead) => {
                      const isConverted = lead.leadStatus === 'CONVERTED';
                      return (
                        <div
                          key={lead.id}
                          draggable={true}
                          onDragStart={(e) => {
                            e.dataTransfer.setData('text/plain', lead.id.toString());
                            setDraggedLeadId(lead.id);
                          }}
                          onDragEnd={() => {
                            setDraggedLeadId(null);
                            setDragOverColumn(null);
                          }}
                          className={`bg-slate-950 border rounded-xl p-3.5 shadow-md transition-all cursor-grab active:cursor-grabbing group space-y-2.5 ${
                            isConverted
                              ? 'border-teal-500/40 bg-teal-950/10 hover:border-teal-400'
                              : 'border-slate-800 hover:border-indigo-500/50 hover:shadow-indigo-500/10'
                          }`}
                          onClick={() => {
                            setSelectedLead(lead);
                            setIsDetailsOpen(true);
                          }}
                        >
                          <div className="flex items-start justify-between">
                            <div>
                              <h4 className="text-sm font-bold text-slate-100 group-hover:text-indigo-400 transition-colors">
                                {lead.fullName}
                              </h4>
                              <p className="text-xs text-slate-400 flex items-center space-x-1 mt-0.5">
                                <Building className="w-3 h-3 text-slate-500" />
                                <span className="truncate max-w-[140px]">{lead.company || 'Private'}</span>
                              </p>
                            </div>
                            {lead.score && (
                              <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-amber-500/10 text-amber-400 border border-amber-500/20">
                                {lead.score}
                              </span>
                            )}
                          </div>

                          {/* Converted Deal Tag */}
                          {isConverted && (
                            <div className="px-2 py-1 rounded bg-teal-500/10 border border-teal-500/20 text-[10px] font-semibold text-teal-300 flex items-center justify-between">
                              <span className="flex items-center gap-1">
                                <CheckCircle2 className="w-3 h-3 text-teal-400" />
                                Sales Deal
                              </span>
                              {lead.convertedDealId && (
                                <span className="text-teal-400 font-bold">Deal #{lead.convertedDealId}</span>
                              )}
                            </div>
                          )}

                          {/* Interested Products Badges */}
                          {lead.interestedProducts && lead.interestedProducts.length > 0 && (
                            <div className="flex flex-wrap gap-1">
                              {lead.interestedProducts.slice(0, 2).map(p => (
                                <span key={p.productId} className="px-1.5 py-0.5 rounded bg-indigo-500/10 text-indigo-400 text-[10px] font-medium border border-indigo-500/20 truncate max-w-[130px]">
                                  {p.name}
                                </span>
                              ))}
                              {lead.interestedProducts.length > 2 && (
                                <span className="text-[10px] text-slate-500 font-medium self-center">+{lead.interestedProducts.length - 2}</span>
                              )}
                            </div>
                          )}

                          <div className="flex items-center justify-between pt-2 border-t border-slate-900 text-xs">
                            <span className="font-bold text-emerald-400">
                              {formatCurrency(lead.estimatedValue)}
                            </span>
                            <span className="text-[11px] text-slate-400 truncate max-w-[90px]">
                              {lead.assignedToUserName?.split(' ')[0] || 'Unassigned'}
                            </span>
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        /* TABLE VIEW */
        <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-800 bg-slate-900/80 text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                  <th className="px-6 py-4">Lead Name & Company</th>
                  <th className="px-6 py-4">Stage</th>
                  <th className="px-6 py-4">Value</th>
                  <th className="px-6 py-4">Score</th>
                  <th className="px-6 py-4">Source</th>
                  <th className="px-6 py-4">Assigned Rep</th>
                  <th className="px-6 py-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 text-sm">
                {leads.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="px-6 py-12 text-center text-slate-500 text-sm">
                      No leads match your filter criteria.
                    </td>
                  </tr>
                ) : (
                  leads.map((lead) => (
                    <tr key={lead.id} className="hover:bg-slate-800/30 transition-colors">
                      <td className="px-6 py-4">
                        <div className="flex items-center space-x-3">
                          <div className="w-9 h-9 rounded-xl bg-indigo-600/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400 font-bold text-xs">
                            {lead.firstName?.[0] || 'L'}{lead.lastName?.[0] || ''}
                          </div>
                          <div>
                            <div className="font-semibold text-slate-100 flex items-center gap-1.5">
                              {lead.fullName}
                              {lead.leadStatus === 'CONVERTED' && (
                                <span className="px-1.5 py-0.2 rounded text-[10px] font-bold bg-teal-500/15 text-teal-300 border border-teal-500/30">
                                  CONVERTED
                                </span>
                              )}
                            </div>
                            <div className="text-xs text-slate-400">{lead.email}</div>
                            {lead.company && (
                              <div className="text-xs text-slate-500">{lead.company}</div>
                            )}
                            {lead.interestedProducts && lead.interestedProducts.length > 0 && (
                              <div className="flex flex-wrap gap-1 mt-1">
                                {lead.interestedProducts.slice(0, 2).map(p => (
                                  <span key={p.productId} className="px-1.5 py-0.5 rounded bg-indigo-500/10 text-indigo-400 text-[10px] font-medium border border-indigo-500/20">
                                    {p.name}
                                  </span>
                                ))}
                                {lead.interestedProducts.length > 2 && (
                                  <span className="text-[10px] text-slate-500 font-medium">+{lead.interestedProducts.length - 2} more</span>
                                )}
                              </div>
                            )}
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <LeadStatusBadge status={lead.leadStatus} />
                      </td>
                      <td className="px-6 py-4 font-semibold text-emerald-400">
                        {formatCurrency(lead.estimatedValue)}
                      </td>
                      <td className="px-6 py-4">
                        <span className="px-2 py-0.5 rounded-md text-xs font-bold bg-amber-500/10 text-amber-400 border border-amber-500/20">
                          {lead.score || 0}/100
                        </span>
                      </td>
                      <td className="px-6 py-4 text-xs text-slate-300">
                        {lead.sourceDisplayName}
                      </td>
                      <td className="px-6 py-4 text-xs text-slate-300">
                        {lead.assignedToUserName || <span className="text-slate-500">Unassigned</span>}
                      </td>
                      <td className="px-6 py-4 text-right">
                        <div className="flex items-center justify-end space-x-2">
                          <button
                            onClick={() => {
                              setSelectedLead(lead);
                              setIsDetailsOpen(true);
                            }}
                            title="View Lead Profile"
                            className="p-1.5 text-slate-400 hover:text-indigo-400 rounded-lg hover:bg-slate-800 transition-colors"
                          >
                            <Eye className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => {
                              setSelectedLead(lead);
                              setIsEditOpen(true);
                            }}
                            title="Edit Lead"
                            className="p-1.5 text-slate-400 hover:text-amber-400 rounded-lg hover:bg-slate-800 transition-colors"
                          >
                            <Edit2 className="w-4 h-4" />
                          </button>
                          {lead.leadStatus !== 'CONVERTED' ? (
                            <button
                              onClick={() => handleConvertLead(lead.id)}
                              title="Convert to Sales Pipeline Deal"
                              className="p-1.5 text-slate-400 hover:text-emerald-400 rounded-lg hover:bg-slate-800 transition-colors"
                            >
                              <CheckCircle2 className="w-4 h-4" />
                            </button>
                          ) : (
                            <a
                              href="/customers"
                              title="View Linked Customer Account"
                              className="p-1.5 text-teal-400 hover:text-teal-300 rounded-lg hover:bg-teal-500/10 transition-colors"
                            >
                              <ExternalLink className="w-4 h-4" />
                            </a>
                          )}
                          <button
                            onClick={() => {
                              setSelectedLead(lead);
                              setIsDeleteOpen(true);
                            }}
                            title="Delete Lead"
                            className="p-1.5 text-slate-400 hover:text-rose-400 rounded-lg hover:bg-slate-800 transition-colors"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Modals */}
      <CreateLeadModal
        isOpen={isCreateOpen}
        onClose={() => setIsCreateOpen(false)}
        onSubmit={handleCreateLead}
        users={users}
      />

      <EditLeadModal
        isOpen={isEditOpen}
        onClose={() => {
          setIsEditOpen(false);
          setSelectedLead(null);
        }}
        onSubmit={handleUpdateLead}
        lead={selectedLead}
        users={users}
      />

      <LeadDetailsModal
        isOpen={isDetailsOpen}
        onClose={() => {
          setIsDetailsOpen(false);
          setSelectedLead(null);
        }}
        lead={selectedLead}
        onStatusChange={handleStatusChange}
        onConvert={handleConvertLead}
        onEdit={(lead: Lead) => {
          setSelectedLead(lead);
          setIsEditOpen(true);
        }}
      />

      <DeleteLeadModal
        isOpen={isDeleteOpen}
        onClose={() => {
          setIsDeleteOpen(false);
          setSelectedLead(null);
        }}
        onConfirm={handleDeleteLead}
        lead={selectedLead}
        loading={deleteLoading}
      />
    </div>
  );
};
