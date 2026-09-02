import React, { useEffect, useState } from 'react';
import { dealApi } from '../api/dealApi';
import { userApi } from '../api/userApi';
import { customerApi } from '../api/customerApi';
import {
  Deal,
  DealStage,
  DealType,
  DealPriority,
  DealStats,
  PipelineSummary,
  CreateDealRequest,
  UpdateDealRequest,
  PipelineStageConfig,
} from '../types/deal';
import { User } from '../types/auth';
import { Customer } from '../types/customer';
import { useAuth } from '../context/AuthContext';
import { DealStageBadge } from '../components/deals/DealStageBadge';
import { CreateDealModal } from '../components/deals/CreateDealModal';
import { EditDealModal } from '../components/deals/EditDealModal';
import { DealDetailsModal } from '../components/deals/DealDetailsModal';
import { CloseDealWonModal } from '../components/deals/CloseDealWonModal';
import { CloseDealLostModal } from '../components/deals/CloseDealLostModal';
import { DeleteDealModal } from '../components/deals/DeleteDealModal';
import { ConfigurePipelineModal } from '../components/deals/ConfigurePipelineModal';
import {
  TrendingUp,
  IndianRupee,
  Trophy,
  PieChart,
  Plus,
  Search,
  LayoutGrid,
  List as ListIcon,
  Eye,
  Edit2,
  Trash2,
  Building2,
  Calendar,
  Sliders,
  GripVertical,
  ShieldCheck,
  Users,
  UserCheck,
  RefreshCw,
} from 'lucide-react';
import { triggerRefreshBlink } from '../components/common/RefreshFeedbackOverlay';

const KANBAN_STAGES: { stage: DealStage; label: string; dot: string; prob: string }[] = [
  { stage: 'QUALIFICATION', label: 'Qualification', dot: 'bg-slate-400', prob: '10%' },
  { stage: 'DISCOVERY', label: 'Discovery', dot: 'bg-blue-400', prob: '30%' },
  { stage: 'PROPOSAL', label: 'Proposal', dot: 'bg-indigo-400', prob: '60%' },
  { stage: 'NEGOTIATION', label: 'Negotiation', dot: 'bg-amber-400', prob: '80%' },
  { stage: 'CLOSED_WON', label: 'Closed Won', dot: 'bg-emerald-400', prob: '100%' },
  { stage: 'CLOSED_LOST', label: 'Closed Lost', dot: 'bg-rose-400', prob: '0%' },
];

export const SalesPipeline: React.FC = () => {
  const { user } = useAuth();
  const isAdmin = user?.role === 'ROLE_ADMIN';
  const isManager = user?.role === 'ROLE_MANAGER';
  const isEmployee = user?.role === 'ROLE_EMPLOYEE';

  const [deals, setDeals] = useState<Deal[]>([]);
  const [pipelineSummaries, setPipelineSummaries] = useState<PipelineSummary[]>([]);
  const [stats, setStats] = useState<DealStats | null>(null);
  const [stageConfigs, setStageConfigs] = useState<PipelineStageConfig[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);

  // Filters & View
  const [search, setSearch] = useState('');
  const [activeTab, setActiveTab] = useState<'all' | 'active' | 'won' | 'high_prob'>('all');
  const [stageFilter, setStageFilter] = useState<DealStage | ''>('');
  const [typeFilter, setTypeFilter] = useState<DealType | ''>('');
  const [priorityFilter, setPriorityFilter] = useState<DealPriority | ''>('');
  const [viewMode, setViewMode] = useState<'kanban' | 'table'>('kanban');

  // Drag & Drop State
  const [draggedDealId, setDraggedDealId] = useState<number | null>(null);
  const [dragOverStage, setDragOverStage] = useState<DealStage | null>(null);

  // Modals state
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isDetailsOpen, setIsDetailsOpen] = useState(false);
  const [isWonOpen, setIsWonOpen] = useState(false);
  const [isLostOpen, setIsLostOpen] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [isConfigOpen, setIsConfigOpen] = useState(false);
  const [selectedDeal, setSelectedDeal] = useState<Deal | null>(null);
  const [actionLoading, setActionLoading] = useState(false);

  // RBAC Permission Helpers
  const canMoveDeal = (d: Deal): boolean => {
    if (isAdmin) return true;
    if (isManager) {
      if (!d.assignedToUserId) return true;
      if (d.assignedToUserId === user?.id) return true;
      return users.some((u) => u.id === d.assignedToUserId);
    }
    if (isEmployee) {
      return d.assignedToUserId === user?.id;
    }
    return false;
  };

  const canEditDeal = (d: Deal): boolean => {
    if (isAdmin) return true;
    if (isManager) {
      if (!d.assignedToUserId) return true;
      if (d.assignedToUserId === user?.id) return true;
      return users.some((u) => u.id === d.assignedToUserId);
    }
    if (isEmployee) {
      return d.assignedToUserId === user?.id;
    }
    return false;
  };

  const canDeleteDeal = (_d: Deal): boolean => {
    return isAdmin;
  };

  const fetchDealsAndStats = async () => {
    try {
      const [dealsRes, summaryRes, statsRes, configsRes, usersRes, customersRes] = await Promise.all([
        dealApi.getDeals({
          search: search || undefined,
          stage: stageFilter ? (stageFilter as DealStage) : undefined,
          dealType: typeFilter ? (typeFilter as DealType) : undefined,
          priority: priorityFilter ? (priorityFilter as DealPriority) : undefined,
        }),
        dealApi.getPipelineSummary(),
        dealApi.getStats(),
        dealApi.getStageConfigs().catch(() => ({ success: false, data: [] as PipelineStageConfig[] })),
        isManager ? userApi.getTeamMembers() : (isEmployee && user ? Promise.resolve([user]) : userApi.getAllUsers()),
        customerApi.getCustomers({}),
      ]);

      if (configsRes.success && configsRes.data) {
        setStageConfigs(configsRes.data);
      }

      let loadedDeals = dealsRes.success && dealsRes.data ? dealsRes.data : [];
      let availableAssignees: User[] = [];

      if (isManager && user) {
        const teamMembers = usersRes || [];
        const teamMemberIds = new Set([user.id, ...teamMembers.map((u: User) => u.id)]);

        // Manager can see: their assigned deals, direct team deals, and unassigned deals
        loadedDeals = loadedDeals.filter(
          (d) => !d.assignedToUserId || teamMemberIds.has(d.assignedToUserId)
        );
        availableAssignees = [user, ...teamMembers];
      } else if (isEmployee && user) {
        // Employee sees own assigned deals only
        loadedDeals = loadedDeals.filter(
          (d) => d.assignedToUserId === user.id
        );
        availableAssignees = [user];
      } else {
        availableAssignees = usersRes || [];
      }

      if (activeTab === 'active') {
        loadedDeals = loadedDeals.filter((d) => d.stage !== 'CLOSED_WON' && d.stage !== 'CLOSED_LOST');
      } else if (activeTab === 'won') {
        loadedDeals = loadedDeals.filter((d) => d.stage === 'CLOSED_WON');
      } else if (activeTab === 'high_prob') {
        loadedDeals = loadedDeals.filter((d) => d.probability >= 50 && d.stage !== 'CLOSED_LOST');
      }

      setDeals(loadedDeals);
      setUsers(availableAssignees);

      if (summaryRes.success && summaryRes.data) {
        if (isManager || isEmployee) {
          const scopedSummaries = summaryRes.data.map((stageSum) => {
            const stageDeals = loadedDeals.filter((d) => d.stage === stageSum.stage);
            const totalVal = stageDeals.reduce((sum, d) => sum + (d.amount || 0), 0);
            const weightedVal = stageDeals.reduce(
              (sum, d) => sum + ((d.amount || 0) * (d.probability || 0)) / 100,
              0
            );
            return {
              ...stageSum,
              count: stageDeals.length,
              totalValue: totalVal,
              weightedValue: weightedVal,
              deals: stageDeals,
            };
          });
          setPipelineSummaries(scopedSummaries);
        } else {
          setPipelineSummaries(summaryRes.data);
        }
      }

      // Scoped KPI calculation for Manager / Employee
      if (isManager || isEmployee) {
        const totalDeals = loadedDeals.length;
        const wonDeals = loadedDeals.filter((d) => d.stage === 'CLOSED_WON').length;
        const lostDeals = loadedDeals.filter((d) => d.stage === 'CLOSED_LOST').length;
        const activeDeals = loadedDeals.filter(
          (d) => d.stage !== 'CLOSED_WON' && d.stage !== 'CLOSED_LOST'
        ).length;
        const totalPipelineValue = loadedDeals
          .filter((d) => d.stage !== 'CLOSED_LOST')
          .reduce((sum, d) => sum + (d.amount || 0), 0);
        const weightedForecastValue = loadedDeals
          .filter((d) => d.stage !== 'CLOSED_LOST')
          .reduce((sum, d) => sum + ((d.amount || 0) * (d.probability || 0)) / 100, 0);
        const closedWonRevenue = loadedDeals
          .filter((d) => d.stage === 'CLOSED_WON')
          .reduce((sum, d) => sum + (d.amount || 0), 0);
        const closedTotal = wonDeals + lostDeals;
        const winRate = closedTotal > 0 ? Number(((wonDeals / closedTotal) * 100).toFixed(1)) : 0;
        const averageDealSize = totalDeals > 0 ? Number((totalPipelineValue / totalDeals).toFixed(0)) : 0;

        setStats({
          totalDeals,
          activeDeals,
          wonDeals,
          lostDeals,
          totalPipelineValue,
          weightedForecastValue,
          closedWonRevenue,
          winRate,
          averageDealSize,
          dealsByStage: {} as any,
          valueByStage: {} as any,
          dealsByType: {} as any,
        });
      } else if (statsRes.success && statsRes.data) {
        setStats(statsRes.data);
      }

      if (customersRes.success && customersRes.data) {
        setCustomers(customersRes.data);
      }
    } catch (err) {
      console.error('Failed to load deals data:', err);
    }
  };

  useEffect(() => {
    fetchDealsAndStats();
  }, [search, activeTab, stageFilter, typeFilter, priorityFilter]);

  // Deal Mutations
  const handleCreate = async (data: CreateDealRequest) => {
    try {
      const res = await dealApi.createDeal(data);
      if (res.success) {
        setIsCreateOpen(false);
        await fetchDealsAndStats();
      }
    } catch (err) {
      console.error('Failed to create deal:', err);
    }
  };

  const handleUpdate = async (id: number, data: UpdateDealRequest) => {
    try {
      const res = await dealApi.updateDeal(id, data);
      if (res.success) {
        setIsEditOpen(false);
        setSelectedDeal(null);
        await fetchDealsAndStats();
      }
    } catch (err) {
      console.error('Failed to update deal:', err);
    }
  };

  const handleStageChange = async (id: number, stage: DealStage) => {
    try {
      const configuredProb = stageConfigs.find((c) => c.stage === stage)?.probability;
      const res = await dealApi.updateDealStage(id, stage, configuredProb);
      if (res.success) {
        await fetchDealsAndStats();
      }
    } catch (err) {
      console.error('Failed to update stage:', err);
    }
  };

  const handleConfirmWon = async () => {
    if (!selectedDeal) return;
    try {
      setActionLoading(true);
      const res = await dealApi.closeDealWon(selectedDeal.id);
      if (res.success) {
        setIsWonOpen(false);
        setSelectedDeal(null);
        await fetchDealsAndStats();
      }
    } catch (err) {
      console.error('Failed to mark deal won:', err);
    } finally {
      setActionLoading(false);
    }
  };

  const handleConfirmLost = async (reason: string) => {
    if (!selectedDeal) return;
    try {
      setActionLoading(true);
      const res = await dealApi.closeDealLost(selectedDeal.id, reason);
      if (res.success) {
        setIsLostOpen(false);
        setSelectedDeal(null);
        await fetchDealsAndStats();
      }
    } catch (err) {
      console.error('Failed to mark deal lost:', err);
    } finally {
      setActionLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!selectedDeal) return;
    try {
      setActionLoading(true);
      const res = await dealApi.deleteDeal(selectedDeal.id);
      if (res.success) {
        setIsDeleteOpen(false);
        setSelectedDeal(null);
        await fetchDealsAndStats();
      }
    } catch (err) {
      console.error('Failed to delete deal:', err);
    } finally {
      setActionLoading(false);
    }
  };

  // Helper to format currency
  const formatCurrency = (val: number | undefined) => {
    if (val === undefined || isNaN(val)) return '₹0';
    return `₹${val.toLocaleString()}`;
  };

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2">
            <h1 className="text-2xl font-bold text-slate-100">Sales Pipeline & Deals</h1>
            <span className="px-2.5 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 text-xs font-semibold">
              Revenue Forecast
            </span>
            {isAdmin && (
              <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 flex items-center gap-1">
                <ShieldCheck className="w-3 h-3" /> Company View
              </span>
            )}
            {isManager && (
              <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30 flex items-center gap-1">
                <Users className="w-3 h-3" /> Team View
              </span>
            )}
            {isEmployee && (
              <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-blue-500/20 text-blue-300 border border-blue-500/30 flex items-center gap-1">
                <UserCheck className="w-3 h-3" /> My Deals
              </span>
            )}
          </div>
          <p className="text-sm text-slate-400 mt-1">
            Track multi-stage deal opportunities, forecast weighted revenue, and monitor sales velocity
          </p>
        </div>

        <div className="flex items-center space-x-3">
          {/* Configure Stages (Admin only) */}
          {isAdmin && (
            <button
              onClick={() => setIsConfigOpen(true)}
              className="flex items-center space-x-2 px-3.5 py-2 bg-slate-900 hover:bg-slate-800 text-slate-300 hover:text-white text-sm font-semibold rounded-xl border border-slate-800 transition-all"
              title="Configure pipeline stage probabilities and names"
            >
              <Sliders className="w-4 h-4 text-indigo-400" />
              <span>Configure Stages</span>
            </button>
          )}

          {/* View toggle */}
          <div className="flex items-center bg-slate-900 border border-slate-800 rounded-xl p-1">
            <button
              onClick={() => setViewMode('kanban')}
              className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
                viewMode === 'kanban'
                  ? 'bg-indigo-600 text-white shadow'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <LayoutGrid className="w-3.5 h-3.5" />
              <span>Pipeline</span>
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
              fetchDealsAndStats();
              triggerRefreshBlink('Pipeline refreshed');
            }}
            title="Refresh Pipeline"
            className="flex items-center space-x-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold text-slate-300 bg-slate-900 hover:bg-slate-800 border border-slate-700 transition"
          >
            <RefreshCw className="w-3.5 h-3.5 text-indigo-400" />
            <span className="hidden sm:inline">Refresh</span>
          </button>

          <button
            onClick={() => setIsCreateOpen(true)}
            className="flex items-center space-x-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-semibold rounded-xl shadow-lg shadow-indigo-600/20 transition-all hover:shadow-indigo-600/40"
          >
            <Plus className="w-4 h-4" />
            <span>Create Deal</span>
          </button>
        </div>
      </div>

      {/* Top Metric Cards (Scoped ARR, Forecast, Win Rate) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-slate-900 border border-slate-800 p-5 rounded-2xl relative overflow-hidden group hover:border-slate-700 transition-all">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
              {isAdmin ? 'Total Active Pipeline' : isManager ? 'Team Active Pipeline' : 'My Active Pipeline'}
            </span>
            <div className="w-9 h-9 rounded-xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400">
              <IndianRupee className="w-5 h-5" />
            </div>
          </div>
          <div className="text-2xl font-black text-slate-100 mt-2">
            {formatCurrency(stats?.totalPipelineValue)}
          </div>
          <div className="text-xs text-slate-400 mt-1 flex items-center gap-1.5">
            <span className="text-emerald-400 font-semibold">{stats?.activeDeals || 0}</span> open active deals
          </div>
        </div>

        <div className="bg-slate-900 border border-slate-800 p-5 rounded-2xl relative overflow-hidden group hover:border-slate-700 transition-all">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
              {isAdmin ? 'Company Forecast ARR' : isManager ? 'Team Weighted Forecast' : 'My Weighted Forecast'}
            </span>
            <div className="w-9 h-9 rounded-xl bg-purple-500/10 border border-purple-500/20 flex items-center justify-center text-purple-400">
              <TrendingUp className="w-5 h-5" />
            </div>
          </div>
          <div className="text-2xl font-black text-purple-300 mt-2">
            {formatCurrency(stats?.weightedForecastValue)}
          </div>
          <div className="text-xs text-slate-400 mt-1">
            Stage probability-weighted pipeline
          </div>
        </div>

        <div className="bg-slate-900 border border-slate-800 p-5 rounded-2xl relative overflow-hidden group hover:border-slate-700 transition-all">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
              {isAdmin ? 'Closed Won Revenue' : isManager ? 'Team Won Revenue' : 'My Won Revenue'}
            </span>
            <div className="w-9 h-9 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
              <Trophy className="w-5 h-5" />
            </div>
          </div>
          <div className="text-2xl font-black text-emerald-400 mt-2">
            {formatCurrency(stats?.closedWonRevenue)}
          </div>
          <div className="text-xs text-slate-400 mt-1 flex items-center gap-1.5">
            <span className="text-emerald-400 font-semibold">{stats?.wonDeals || 0}</span> deals won
          </div>
        </div>

        <div className="bg-slate-900 border border-slate-800 p-5 rounded-2xl relative overflow-hidden group hover:border-slate-700 transition-all">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
              {isAdmin ? 'Company Win Rate' : isManager ? 'Team Win Rate' : 'My Win Rate'}
            </span>
            <div className="w-9 h-9 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400">
              <PieChart className="w-5 h-5" />
            </div>
          </div>
          <div className="text-2xl font-black text-amber-400 mt-2">
            {stats?.winRate ? `${stats.winRate}%` : '0%'}
          </div>
          <div className="text-xs text-slate-400 mt-1">
            Avg deal size: <span className="text-slate-200 font-semibold">{formatCurrency(stats?.averageDealSize)}</span>
          </div>
        </div>
      </div>

      {/* Control Filters & Tabs */}
      <div className="bg-slate-900/90 border border-slate-800 p-4 rounded-2xl space-y-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          {/* Quick tab filters */}
          <div className="flex items-center space-x-1.5 bg-slate-950/60 p-1 rounded-xl border border-slate-800 self-start">
            <button
              onClick={() => setActiveTab('all')}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                activeTab === 'all'
                  ? 'bg-slate-800 text-white shadow-sm'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              All Deals ({deals.length})
            </button>
            <button
              onClick={() => setActiveTab('active')}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                activeTab === 'active'
                  ? 'bg-slate-800 text-white shadow-sm'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Active Funnel
            </button>
            <button
              onClick={() => setActiveTab('won')}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                activeTab === 'won'
                  ? 'bg-slate-800 text-white shadow-sm'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Closed Won 🏆
            </button>
            <button
              onClick={() => setActiveTab('high_prob')}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                activeTab === 'high_prob'
                  ? 'bg-slate-800 text-white shadow-sm'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              High Probability (≥50%)
            </button>
          </div>

          {/* Search Bar */}
          <div className="relative flex-1 max-w-md">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search deals by name, client, or notes..."
              className="w-full pl-10 pr-4 py-2 bg-slate-950/80 border border-slate-800 rounded-xl text-slate-200 text-xs focus:outline-none focus:border-indigo-500 transition-colors"
            />
          </div>
        </div>

        {/* Dropdown Filters */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2 border-t border-slate-800/60">
          <div>
            <select
              value={stageFilter}
              onChange={(e) => setStageFilter(e.target.value as DealStage | '')}
              className="w-full px-3 py-1.5 bg-slate-950/60 border border-slate-800 rounded-xl text-slate-300 text-xs focus:outline-none focus:border-indigo-500"
            >
              <option value="">All Pipeline Stages</option>
              {KANBAN_STAGES.map((s) => (
                <option key={s.stage} value={s.stage}>
                  {s.label}
                </option>
              ))}
            </select>
          </div>

          <div>
            <select
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value as DealType | '')}
              className="w-full px-3 py-1.5 bg-slate-950/60 border border-slate-800 rounded-xl text-slate-300 text-xs focus:outline-none focus:border-indigo-500"
            >
              <option value="">All Deal Types</option>
              <option value="NEW_BUSINESS">New Business</option>
              <option value="EXISTING_BUSINESS">Existing Business</option>
              <option value="EXPANSION_UPSELL">Expansion / Upsell</option>
              <option value="RENEWAL">Renewal</option>
            </select>
          </div>

          <div>
            <select
              value={priorityFilter}
              onChange={(e) => setPriorityFilter(e.target.value as DealPriority | '')}
              className="w-full px-3 py-1.5 bg-slate-950/60 border border-slate-800 rounded-xl text-slate-300 text-xs focus:outline-none focus:border-indigo-500"
            >
              <option value="">All Priorities</option>
              <option value="LOW">Low</option>
              <option value="MEDIUM">Medium</option>
              <option value="HIGH">High</option>
              <option value="URGENT">Urgent</option>
            </select>
          </div>
        </div>
      </div>

      {/* Main Content View */}
      {viewMode === 'kanban' ? (
        /* Kanban Board View with HTML5 Drag & Drop */
        <div className="flex gap-4 items-start overflow-x-auto pb-6 pt-1 px-1">
          {KANBAN_STAGES.map((stageItem) => {
            const stageConfig = stageConfigs.find((c) => c.stage === stageItem.stage);
            const stageDisplayName = stageConfig?.displayName || stageItem.label;
            const stageProb = stageConfig ? `${stageConfig.probability}%` : stageItem.prob;

            const stageSummary = pipelineSummaries.find((s) => s.stage === stageItem.stage);
            const stageDeals = stageSummary ? stageSummary.deals : deals.filter((d) => d.stage === stageItem.stage);
            const stageTotalVal = stageSummary
              ? stageSummary.totalValue
              : stageDeals.reduce((sum, d) => sum + (d.amount || 0), 0);

            const isDropTarget = dragOverStage === stageItem.stage;

            return (
              <div
                key={stageItem.stage}
                onDragOver={(e) => {
                  e.preventDefault();
                  e.dataTransfer.dropEffect = 'move';
                  if (dragOverStage !== stageItem.stage) {
                    setDragOverStage(stageItem.stage);
                  }
                }}
                onDragLeave={(e) => {
                  // Only clear if leaving the container
                  if (!e.currentTarget.contains(e.relatedTarget as Node)) {
                    setDragOverStage(null);
                  }
                }}
                onDrop={(e) => {
                  e.preventDefault();
                  setDragOverStage(null);
                  const dealIdStr = e.dataTransfer.getData('text/plain');
                  if (dealIdStr) {
                    const dealId = Number(dealIdStr);
                    const dropped = deals.find((x) => x.id === dealId);
                    if (dropped && canMoveDeal(dropped) && dropped.stage !== stageItem.stage) {
                      if (stageItem.stage === 'CLOSED_WON') {
                        setSelectedDeal(dropped);
                        setIsWonOpen(true);
                      } else if (stageItem.stage === 'CLOSED_LOST') {
                        setSelectedDeal(dropped);
                        setIsLostOpen(true);
                      } else {
                        handleStageChange(dealId, stageItem.stage);
                      }
                    }
                  }
                  setDraggedDealId(null);
                }}
                className={`bg-slate-900/60 border rounded-2xl p-3.5 flex flex-col w-[260px] min-w-[260px] shrink-0 min-h-[580px] transition-all duration-200 ${
                  isDropTarget
                    ? 'border-indigo-500 bg-indigo-950/20 shadow-lg shadow-indigo-500/10 ring-2 ring-indigo-500/30'
                    : 'border-slate-800/80 hover:border-slate-800'
                }`}
              >
                {/* Column Header */}
                <div className="pb-3 border-b border-slate-800/80 mb-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <span className={`w-2.5 h-2.5 rounded-full ${stageItem.dot}`} />
                      <h3 className="font-bold text-xs text-slate-200 tracking-wide uppercase">
                        {stageDisplayName}
                      </h3>
                    </div>
                    <span className="text-[10px] font-bold text-indigo-400 bg-indigo-500/10 px-2 py-0.5 rounded-full border border-indigo-500/20">
                      {stageProb}
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-[11px] text-slate-400 mt-2 font-medium">
                    <span>{stageDeals.length} deals</span>
                    <span className="text-slate-200 font-semibold">{formatCurrency(stageTotalVal)}</span>
                  </div>
                </div>

                {/* Cards Container */}
                <div className="space-y-3 flex-1 overflow-y-auto pr-0.5">
                  {stageDeals.length === 0 ? (
                    <div
                      className={`h-32 border-2 border-dashed rounded-xl flex items-center justify-center text-center p-3 transition-colors ${
                        isDropTarget
                          ? 'border-indigo-500 bg-indigo-500/10 text-indigo-300'
                          : 'border-slate-800/60 text-slate-600'
                      }`}
                    >
                      <span className="text-[11px] font-medium">
                        {isDropTarget ? 'Drop opportunity here' : 'No deals in this stage'}
                      </span>
                    </div>
                  ) : (
                    stageDeals.map((deal) => {
                      const userCanMove = canMoveDeal(deal);
                      const userCanEdit = canEditDeal(deal);
                      const userCanDelete = canDeleteDeal(deal);
                      const isBeingDragged = draggedDealId === deal.id;

                      return (
                        <div
                          key={deal.id}
                          draggable={userCanMove}
                          onDragStart={(e) => {
                            if (!userCanMove) {
                              e.preventDefault();
                              return;
                            }
                            setDraggedDealId(deal.id);
                            e.dataTransfer.setData('text/plain', String(deal.id));
                            e.dataTransfer.effectAllowed = 'move';
                          }}
                          onDragEnd={() => {
                            setDraggedDealId(null);
                            setDragOverStage(null);
                          }}
                          className={`bg-slate-900 border rounded-xl p-3.5 space-y-2.5 transition-all shadow-md group relative ${
                            isBeingDragged
                              ? 'opacity-40 border-indigo-500 scale-95'
                              : 'border-slate-800 hover:border-slate-700 hover:shadow-indigo-500/5'
                          } ${userCanMove ? 'cursor-grab active:cursor-grabbing' : 'cursor-pointer'}`}
                          onClick={() => {
                            setSelectedDeal(deal);
                            setIsDetailsOpen(true);
                          }}
                        >
                          {/* Top Row: Deal Name & Drag Handle */}
                          <div className="flex items-start justify-between gap-1">
                            <h4 className="font-bold text-xs text-slate-100 line-clamp-1 group-hover:text-indigo-400 transition-colors">
                              {deal.dealName}
                            </h4>
                            {userCanMove && (
                              <GripVertical className="w-3.5 h-3.5 text-slate-600 group-hover:text-slate-400 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity" />
                            )}
                          </div>

                          {/* Customer Name */}
                          {deal.customerName && (
                            <div className="flex items-center gap-1 text-[11px] text-slate-400 font-medium">
                              <Building2 className="w-3 h-3 text-slate-500 shrink-0" />
                              <span className="truncate">{deal.customerName}</span>
                            </div>
                          )}

                          {/* Amount & Expected Close */}
                          <div className="flex items-center justify-between pt-1 border-t border-slate-800/60">
                            <span className="text-xs font-black text-emerald-400">
                              {formatCurrency(deal.amount)}
                            </span>
                            {deal.expectedCloseDate && (
                              <span className="text-[10px] text-slate-500 flex items-center gap-1">
                                <Calendar className="w-3 h-3" />
                                {new Date(deal.expectedCloseDate).toLocaleDateString(undefined, {
                                  month: 'short',
                                  day: 'numeric',
                                })}
                              </span>
                            )}
                          </div>

                          {/* Footer Tag & Assigned Rep */}
                          <div className="flex items-center justify-between text-[10px] pt-1">
                            <span className="px-1.5 py-0.5 rounded bg-slate-800 text-slate-400 font-medium truncate max-w-[90px]">
                              {deal.dealTypeDisplayName || deal.dealType}
                            </span>
                            <span className="text-slate-400 font-medium truncate max-w-[85px] text-right">
                              {deal.assignedToUserName || 'Unassigned'}
                            </span>
                          </div>

                          {/* Hover quick actions */}
                          <div
                            className="flex items-center justify-end space-x-1 pt-1 opacity-0 group-hover:opacity-100 transition-opacity"
                            onClick={(e) => e.stopPropagation()}
                          >
                            {userCanEdit && (
                              <button
                                onClick={() => {
                                  setSelectedDeal(deal);
                                  setIsEditOpen(true);
                                }}
                                className="p-1 text-slate-400 hover:text-amber-400 rounded hover:bg-slate-800"
                                title="Edit Deal"
                              >
                                <Edit2 className="w-3 h-3" />
                              </button>
                            )}
                            {userCanDelete && (
                              <button
                                onClick={() => {
                                  setSelectedDeal(deal);
                                  setIsDeleteOpen(true);
                                }}
                                className="p-1 text-slate-400 hover:text-rose-400 rounded hover:bg-slate-800"
                                title="Delete Deal (Admin only)"
                              >
                                <Trash2 className="w-3 h-3" />
                              </button>
                            )}
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
        /* Table View */
        <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-950/60 border-b border-slate-800 text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                  <th className="px-6 py-4">Deal Details</th>
                  <th className="px-6 py-4">Pipeline Stage</th>
                  <th className="px-6 py-4">Contract Value (₹)</th>
                  <th className="px-6 py-4">Probability</th>
                  <th className="px-6 py-4">Expected Close</th>
                  <th className="px-6 py-4">Assigned Rep</th>
                  <th className="px-6 py-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800 text-xs">
                {deals.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="px-6 py-12 text-center text-slate-500">
                      No deals found matching your criteria.
                    </td>
                  </tr>
                ) : (
                  deals.map((deal) => {
                    const userCanEdit = canEditDeal(deal);
                    const userCanDelete = canDeleteDeal(deal);

                    return (
                      <tr
                        key={deal.id}
                        className="hover:bg-slate-800/40 transition-colors group cursor-pointer"
                        onClick={() => {
                          setSelectedDeal(deal);
                          setIsDetailsOpen(true);
                        }}
                      >
                        <td className="px-6 py-4">
                          <div className="font-bold text-slate-200 group-hover:text-indigo-400 transition-colors">
                            {deal.dealName}
                          </div>
                          {deal.customerName && (
                            <div className="text-[11px] text-slate-400 flex items-center gap-1 mt-0.5">
                              <Building2 className="w-3 h-3 text-slate-500" />
                              {deal.customerName}
                            </div>
                          )}
                        </td>
                        <td className="px-6 py-4">
                          <DealStageBadge stage={deal.stage} />
                        </td>
                        <td className="px-6 py-4 font-bold text-emerald-400 text-sm">
                          {formatCurrency(deal.amount)}
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex items-center space-x-2">
                            <div className="w-16 bg-slate-800 rounded-full h-1.5 overflow-hidden">
                              <div
                                className="bg-indigo-500 h-1.5 rounded-full"
                                style={{ width: `${deal.probability}%` }}
                              />
                            </div>
                            <span className="text-[11px] font-semibold text-slate-300">
                              {deal.probability}%
                            </span>
                          </div>
                        </td>
                        <td className="px-6 py-4 text-slate-400">
                          {deal.expectedCloseDate
                            ? new Date(deal.expectedCloseDate).toLocaleDateString()
                            : '--'}
                        </td>
                        <td className="px-6 py-4 text-slate-300 font-medium">
                          {deal.assignedToUserName || (
                            <span className="text-slate-500 italic">Unassigned</span>
                          )}
                        </td>
                        <td className="px-6 py-4 text-right" onClick={(e) => e.stopPropagation()}>
                          <div className="flex items-center justify-end space-x-2">
                            <button
                              onClick={() => {
                                setSelectedDeal(deal);
                                setIsDetailsOpen(true);
                              }}
                              className="p-1.5 text-slate-400 hover:text-indigo-400 rounded-lg hover:bg-slate-800 transition-colors"
                              title="View Details"
                            >
                              <Eye className="w-4 h-4" />
                            </button>
                            {userCanEdit && (
                              <button
                                onClick={() => {
                                  setSelectedDeal(deal);
                                  setIsEditOpen(true);
                                }}
                                className="p-1.5 text-slate-400 hover:text-amber-400 rounded-lg hover:bg-slate-800 transition-colors"
                                title="Edit Deal"
                              >
                                <Edit2 className="w-4 h-4" />
                              </button>
                            )}
                            {userCanDelete && (
                              <button
                                onClick={() => {
                                  setSelectedDeal(deal);
                                  setIsDeleteOpen(true);
                                }}
                                className="p-1.5 text-slate-400 hover:text-rose-400 rounded-lg hover:bg-slate-800 transition-colors"
                                title="Delete Deal (Admin only)"
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
      <CreateDealModal
        isOpen={isCreateOpen}
        onClose={() => setIsCreateOpen(false)}
        onSubmit={handleCreate}
        users={users}
        customers={customers}
        stageConfigs={stageConfigs}
      />

      <EditDealModal
        isOpen={isEditOpen}
        onClose={() => {
          setIsEditOpen(false);
          setSelectedDeal(null);
        }}
        onSubmit={handleUpdate}
        deal={selectedDeal}
        users={users}
        customers={customers}
        stageConfigs={stageConfigs}
      />

      <DealDetailsModal
        isOpen={isDetailsOpen}
        onClose={() => {
          setIsDetailsOpen(false);
          setSelectedDeal(null);
        }}
        deal={selectedDeal}
        onStageChange={handleStageChange}
        onOpenWonModal={(d: Deal) => {
          setSelectedDeal(d);
          setIsWonOpen(true);
        }}
        onOpenLostModal={(d: Deal) => {
          setSelectedDeal(d);
          setIsLostOpen(true);
        }}
        onEdit={(d: Deal) => {
          setSelectedDeal(d);
          setIsEditOpen(true);
        }}
        canEdit={selectedDeal ? canEditDeal(selectedDeal) : true}
      />

      <CloseDealWonModal
        isOpen={isWonOpen}
        onClose={() => {
          setIsWonOpen(false);
          setSelectedDeal(null);
        }}
        onConfirm={handleConfirmWon}
        deal={selectedDeal}
        loading={actionLoading}
      />

      <CloseDealLostModal
        isOpen={isLostOpen}
        onClose={() => {
          setIsLostOpen(false);
          setSelectedDeal(null);
        }}
        onConfirm={handleConfirmLost}
        deal={selectedDeal}
        loading={actionLoading}
      />

      <DeleteDealModal
        isOpen={isDeleteOpen}
        onClose={() => {
          setIsDeleteOpen(false);
          setSelectedDeal(null);
        }}
        onConfirm={handleDelete}
        deal={selectedDeal}
        loading={actionLoading}
      />

      {isAdmin && (
        <ConfigurePipelineModal
          isOpen={isConfigOpen}
          onClose={() => setIsConfigOpen(false)}
          onConfigSaved={fetchDealsAndStats}
          currentConfigs={stageConfigs}
        />
      )}
    </div>
  );
};
