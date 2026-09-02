import React, { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { dealApi } from '../api/dealApi';
import { customerApi } from '../api/customerApi';
import { leadApi } from '../api/leadApi';
import { taskApi } from '../api/taskApi';
import { followupApi } from '../api/followupApi';
import { userApi } from '../api/userApi';
import { DealStats, Deal } from '../types/deal';
import { CustomerStats } from '../types/customer';
import { LeadStats } from '../types/lead';
import { TaskStats, Task } from '../types/task';
import { FollowUpStats, FollowUp } from '../types/followup';
import { User } from '../types/auth';
import { DealStageBadge } from '../components/deals/DealStageBadge';
import { TaskPriorityBadge } from '../components/tasks/TaskPriorityBadge';
import { FollowUpChannelBadge } from '../components/followups/FollowUpChannelBadge';
import { RoleBadge } from '../components/RoleBadge';
import {
  TrendingUp,
  IndianRupee,
  Building2,
  Target,
  CheckSquare,
  PhoneCall,
  Users,
  Trophy,
  ArrowUpRight,
  AlertTriangle,
  Sparkles,
  RefreshCw,
  Server,
  Activity,
  CheckCircle2,
  Clock,
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { triggerRefreshBlink } from '../components/common/RefreshFeedbackOverlay';

export const Dashboard: React.FC = () => {
  const { user, isAdmin } = useAuth();

  // Microservices Stats States
  const [dealStats, setDealStats] = useState<DealStats | null>(null);
  const [customerStats, setCustomerStats] = useState<CustomerStats | null>(null);
  const [leadStats, setLeadStats] = useState<LeadStats | null>(null);
  const [taskStats, setTaskStats] = useState<TaskStats | null>(null);
  const [followupStats, setFollowupStats] = useState<FollowUpStats | null>(null);
  const [users, setUsers] = useState<User[]>([]);

  // Feeds
  const [recentDeals, setRecentDeals] = useState<Deal[]>([]);
  const [urgentTasks, setUrgentTasks] = useState<Task[]>([]);
  const [todayFollowUps, setTodayFollowUps] = useState<FollowUp[]>([]);

  const [loading, setLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const handleRefresh = () => {
    setIsRefreshing(true);
    triggerRefreshBlink('Dashboard refreshed');
    fetchDashboardData();
    setTimeout(() => setIsRefreshing(false), 600);
  };

  const fetchDashboardData = async () => {
    try {

      const isManager = user?.role === 'ROLE_MANAGER';
      const isEmployee = user?.role === 'ROLE_EMPLOYEE';
      const userPromise = isManager 
        ? userApi.getTeamMembers().catch(() => []) 
        : (isAdmin ? userApi.getAllUsers().catch(() => []) : Promise.resolve([]));

      const [
        dealStatsRes,
        dealsRes,
        customerStatsRes,
        leadStatsRes,
        taskStatsRes,
        tasksRes,
        followupStatsRes,
        followupsRes,
        usersRes,
      ] = await Promise.allSettled([
        dealApi.getStats(),
        dealApi.getDeals(),
        customerApi.getStats(),
        leadApi.getStats(),
        taskApi.getStats(),
        taskApi.getTasks({ status: 'TODO' }),
        followupApi.getStats(),
        followupApi.getFollowUps(),
        userPromise,
      ]);

      const teamMembers = usersRes.status === 'fulfilled' ? usersRes.value || [] : [];
      const teamMemberIds = user ? new Set([user.id, ...teamMembers.map((u: any) => u.id)]) : new Set<number>();

      if (dealStatsRes.status === 'fulfilled' && dealStatsRes.value.success) {
        setDealStats(dealStatsRes.value.data || null);
      }
      if (dealsRes.status === 'fulfilled' && dealsRes.value.success) {
        let loadedDeals = dealsRes.value.data || [];
        if (isManager) {
          loadedDeals = loadedDeals.filter((d) => !d.assignedToUserId || teamMemberIds.has(d.assignedToUserId));
        } else if (isEmployee && user) {
          loadedDeals = loadedDeals.filter((d) => !d.assignedToUserId || d.assignedToUserId === user.id);
        }
        setRecentDeals(loadedDeals.slice(0, 5));
      }
      if (customerStatsRes.status === 'fulfilled' && customerStatsRes.value.success) {
        setCustomerStats(customerStatsRes.value.data || null);
      }
      if (leadStatsRes.status === 'fulfilled' && leadStatsRes.value.success) {
        setLeadStats(leadStatsRes.value.data || null);
      }
      if (taskStatsRes.status === 'fulfilled' && taskStatsRes.value.success) {
        setTaskStats(taskStatsRes.value.data || null);
      }
      if (tasksRes.status === 'fulfilled' && tasksRes.value.success) {
        let activeTasks = tasksRes.value.data || [];
        if (isManager && user) {
          activeTasks = activeTasks.filter(
            (t) => !t.assignedToUserId || teamMemberIds.has(t.assignedToUserId) || t.createdByUserId === user.id
          );
        } else if (isEmployee && user) {
          activeTasks = activeTasks.filter(
            (t) => !t.assignedToUserId || t.assignedToUserId === user.id
          );
        }
        setUrgentTasks(
          activeTasks
            .filter((t) => t.isOverdue || t.priority === 'URGENT' || t.priority === 'HIGH')
            .slice(0, 5)
        );
      }
      if (followupStatsRes.status === 'fulfilled' && followupStatsRes.value.success) {
        setFollowupStats(followupStatsRes.value.data || null);
      }
      if (followupsRes.status === 'fulfilled' && followupsRes.value.success) {
        const todayStr = new Date().toISOString().split('T')[0];
        let allFollowUps = followupsRes.value.data || [];
        if (isManager && user) {
          allFollowUps = allFollowUps.filter(
            (f) => !f.assignedToUserId || teamMemberIds.has(f.assignedToUserId) || f.createdByUserId === user.id
          );
        } else if (isEmployee && user) {
          allFollowUps = allFollowUps.filter(
            (f) => !f.assignedToUserId || f.assignedToUserId === user.id
          );
        }
        setTodayFollowUps(
          allFollowUps
            .filter((f) => (f.scheduledAt && f.scheduledAt.startsWith(todayStr)) || f.status === 'MISSED')
            .slice(0, 5)
        );
      }
      if (usersRes.status === 'fulfilled' && isAdmin) {
        setUsers(usersRes.value || []);
      }
    } catch (err) {
      console.error('Error loading dashboard data:', err);
    } finally {
      setLoading(false);
    }
  };

  const ROLE_HIERARCHY_RANK: Record<string, number> = {
    ROLE_ADMIN: 1,
    ROLE_MANAGER: 2,
    ROLE_EMPLOYEE: 3,
  };

  const sortedUsers = [...users].sort((a, b) => {
    // 1. Role hierarchy rank: Admin (1) -> Manager (2) -> Employee (3)
    const rankA = ROLE_HIERARCHY_RANK[a.role] || 99;
    const rankB = ROLE_HIERARCHY_RANK[b.role] || 99;
    if (rankA !== rankB) return rankA - rankB;
    // 2. Department name
    const deptA = a.department || '';
    const deptB = b.department || '';
    const deptCompare = deptA.localeCompare(deptB);
    if (deptCompare !== 0) return deptCompare;
    // 3. Name
    return a.name.localeCompare(b.name);
  });

  useEffect(() => {
    fetchDashboardData();
  }, []);

  return (
    <div className="space-y-8 animate-fade-in pb-12">
      {/* Executive Welcome & Controls */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-indigo-950/70 via-slate-900 to-slate-900 border border-indigo-500/20 p-6 sm:p-8 shadow-2xl">
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-indigo-400" />
                {isAdmin
                  ? '👑 Global CRM Executive Center'
                  : user?.role === 'ROLE_MANAGER'
                  ? `👨‍💼 ${user.teamName || 'Sales Team'} Operations Hub`
                  : '👤 Personal Sales & Task Workspace'}
              </span>
              <span className="text-xs text-slate-400">
                {isAdmin ? 'All Company Microservices Active' : user?.role === 'ROLE_MANAGER' ? 'Team Scope Active' : 'My Assigned Work'}
              </span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight flex items-center gap-2">
              Welcome back, {user?.name}!
            </h1>
            <p className="text-sm text-slate-300 max-w-2xl leading-relaxed">
              {isAdmin
                ? 'Full organizational oversight across ARR revenue, enterprise customer accounts, team performance, and multi-service operations.'
                : user?.role === 'ROLE_MANAGER'
                ? `Real-time management for ${user.teamName || 'your team'}: pipeline velocity, customer accounts, task execution, and cadence cadences.`
                : 'Your daily sales command center: manage your assigned leads, deals in progress, urgent action items, and client follow-ups.'}
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <button
              onClick={handleRefresh}
              title="Refresh Dashboard"
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold text-slate-300 bg-slate-800/80 hover:bg-slate-700/80 border border-slate-700 transition active:scale-95"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isRefreshing ? 'animate-spin text-indigo-400' : ''}`} />
              <span>Refresh</span>
            </button>
            <Link
              to="/pipeline"
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-500 shadow-lg shadow-indigo-600/30 transition hover:shadow-indigo-600/50"
            >
              <TrendingUp className="w-4 h-4" />
              <span>Open Sales Pipeline</span>
              <ArrowUpRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
      </div>

      {/* Top 4 Executive KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* KPI 1: Active Pipeline & Expected Revenue */}
        <Link
          to="/pipeline"
          className="bg-slate-900/80 border border-slate-800 hover:border-indigo-500/50 p-5 rounded-2xl relative overflow-hidden group transition-all shadow-lg hover:shadow-indigo-500/10 block"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
              Total Active Pipeline
            </span>
            <div className="w-10 h-10 rounded-xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400 group-hover:scale-110 transition-transform">
              <IndianRupee className="w-5 h-5" />
            </div>
          </div>
          <div className="text-2xl font-black text-slate-100 mt-2">
            ₹{dealStats?.totalPipelineValue ? dealStats.totalPipelineValue.toLocaleString() : (loading ? '...' : 0)}
          </div>
          <div className="flex items-center justify-between text-xs text-indigo-400 mt-2 pt-2 border-t border-slate-800/80">
            <span>Forecast: ₹{dealStats?.weightedForecastValue ? dealStats.weightedForecastValue.toLocaleString() : 0}</span>
            <span className="font-bold">{dealStats?.activeDeals ?? 0} deals</span>
          </div>
        </Link>

        {/* KPI 2: Customer Annual ARR */}
        <Link
          to="/customers"
          className="bg-slate-900/80 border border-slate-800 hover:border-emerald-500/50 p-5 rounded-2xl relative overflow-hidden group transition-all shadow-lg hover:shadow-emerald-500/10 block"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
              Recognized Annual ARR
            </span>
            <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400 group-hover:scale-110 transition-transform">
              <Building2 className="w-5 h-5" />
            </div>
          </div>
          <div className="text-2xl font-black text-emerald-400 mt-2">
            ₹{customerStats?.totalAnnualRevenue ? customerStats.totalAnnualRevenue.toLocaleString() : (loading ? '...' : 0)}
          </div>
          <div className="flex items-center justify-between text-xs text-emerald-400/80 mt-2 pt-2 border-t border-slate-800/80">
            <span>Active Clients: {customerStats?.activeCustomers ?? 0}</span>
            <span className="font-bold">{customerStats?.totalCustomers ?? 0} accounts</span>
          </div>
        </Link>

        {/* KPI 3: Lead Pipeline & Velocity */}
        <Link
          to="/leads"
          className="bg-slate-900/80 border border-slate-800 hover:border-amber-500/50 p-5 rounded-2xl relative overflow-hidden group transition-all shadow-lg hover:shadow-amber-500/10 block"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
              Prospect Pipeline Value
            </span>
            <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400 group-hover:scale-110 transition-transform">
              <Target className="w-5 h-5" />
            </div>
          </div>
          <div className="text-2xl font-black text-amber-400 mt-2">
            ₹{leadStats?.totalPipelineValue ? leadStats.totalPipelineValue.toLocaleString() : (loading ? '...' : 0)}
          </div>
          <div className="flex items-center justify-between text-xs text-amber-400/80 mt-2 pt-2 border-t border-slate-800/80">
            <span>Conversion: {leadStats?.conversionRate ?? 0}%</span>
            <span className="font-bold">{leadStats?.totalLeads ?? 0} leads</span>
          </div>
        </Link>

        {/* KPI 4: Cadence & Execution Velocity */}
        <Link
          to="/followups"
          className="bg-slate-900/80 border border-slate-800 hover:border-purple-500/50 p-5 rounded-2xl relative overflow-hidden group transition-all shadow-lg hover:shadow-purple-500/10 block"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
              Follow-Ups & Cadences
            </span>
            <div className="w-10 h-10 rounded-xl bg-purple-500/10 border border-purple-500/20 flex items-center justify-center text-purple-400 group-hover:scale-110 transition-transform">
              <PhoneCall className="w-5 h-5" />
            </div>
          </div>
          <div className="text-2xl font-black text-purple-300 mt-2">
            {followupStats?.scheduledToday ?? 0} Today
          </div>
          <div className="flex items-center justify-between text-xs text-purple-400 mt-2 pt-2 border-t border-slate-800/80">
            <span>Success Rate: {followupStats?.successRate ?? 0}%</span>
            <span className="font-bold">{followupStats?.totalFollowUps ?? 0} total</span>
          </div>
        </Link>
      </div>

      {/* Analytics & Funnel Breakdown Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Sales Pipeline Funnel Stage Distribution (2 cols) */}
        <div className="lg:col-span-2 bg-slate-900/80 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-5">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2.5">
              <div className="w-8 h-8 rounded-xl bg-indigo-600/20 border border-indigo-500/30 flex items-center justify-center text-indigo-400">
                <TrendingUp className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-100">Sales Pipeline Funnel Distribution</h3>
                <p className="text-xs text-slate-400">Stage-by-stage opportunity volume & dollar value</p>
              </div>
            </div>
            <Link
              to="/pipeline"
              className="text-xs text-indigo-400 hover:text-indigo-300 font-semibold flex items-center gap-1"
            >
              <span>View Kanban</span>
              <ArrowUpRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          {/* Funnel Stage Horizontal Bars */}
          <div className="space-y-3.5">
            {[
              { stage: 'QUALIFICATION', label: 'Qualification', prob: '10%', color: 'from-slate-600 to-slate-500', text: 'text-slate-300' },
              { stage: 'DISCOVERY', label: 'Discovery & Demo', prob: '30%', color: 'from-blue-600 to-blue-500', text: 'text-blue-400' },
              { stage: 'PROPOSAL', label: 'Proposal / Quote', prob: '60%', color: 'from-indigo-600 to-indigo-500', text: 'text-indigo-400' },
              { stage: 'NEGOTIATION', label: 'Negotiation', prob: '80%', color: 'from-amber-600 to-amber-500', text: 'text-amber-400' },
              { stage: 'CLOSED_WON', label: 'Closed Won', prob: '100%', color: 'from-emerald-600 to-emerald-500', text: 'text-emerald-400' },
              { stage: 'CLOSED_LOST', label: 'Closed Lost', prob: '0%', color: 'from-rose-600 to-rose-500', text: 'text-rose-400' },
            ].map((st) => {
              const count = dealStats?.dealsByStage ? (dealStats.dealsByStage[st.stage] || 0) : 0;
              const val = dealStats?.valueByStage ? (dealStats.valueByStage[st.stage] || 0) : 0;
              const maxVal = dealStats?.totalPipelineValue || 1;
              const pct = Math.min(Math.round((val / maxVal) * 100), 100);

              return (
                <div key={st.stage} className="space-y-1.5">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-semibold text-slate-300 flex items-center gap-2">
                      <span className={`font-bold ${st.text}`}>{st.label}</span>
                      <span className="text-[10px] text-slate-500">({st.prob})</span>
                    </span>
                    <div className="flex items-center space-x-3">
                      <span className="text-slate-400 font-medium">{count} deals</span>
                      <span className="font-bold text-slate-200">₹{val.toLocaleString()}</span>
                    </div>
                  </div>
                  <div className="w-full bg-slate-950 h-2 rounded-full overflow-hidden border border-slate-800">
                    <div
                      className={`h-full rounded-full bg-gradient-to-r ${st.color} transition-all duration-500`}
                      style={{ width: `${Math.max(pct, count > 0 ? 8 : 0)}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Customer Tiers & Task Velocity Summary (1 col) */}
        <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-6 flex flex-col justify-between">
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <Building2 className="w-4 h-4 text-emerald-400" />
                <h3 className="text-sm font-bold text-slate-100">Customer Portfolio Tiers</h3>
              </div>
              <Link to="/customers" className="text-xs text-indigo-400 hover:text-indigo-300 font-semibold">
                Accounts
              </Link>
            </div>

            <div className="space-y-2.5">
              {[
                { tier: 'TIER_1_ENTERPRISE', label: 'Tier 1 Enterprise', badge: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30' },
                { tier: 'STRATEGIC', label: 'Strategic Accounts', badge: 'bg-indigo-500/10 text-indigo-300 border-indigo-500/30' },
                { tier: 'TIER_2_MID_MARKET', label: 'Tier 2 Mid Market', badge: 'bg-blue-500/10 text-blue-400 border-blue-500/30' },
                { tier: 'TIER_3_SMB', label: 'Tier 3 SMB', badge: 'bg-slate-500/10 text-slate-300 border-slate-500/30' },
              ].map((t) => {
                const count = customerStats?.customersByTier ? (customerStats.customersByTier[t.tier] || 0) : 0;
                return (
                  <div
                    key={t.tier}
                    className="flex items-center justify-between p-2.5 rounded-xl bg-slate-950/60 border border-slate-800/80 text-xs"
                  >
                    <span className="font-semibold text-slate-300">{t.label}</span>
                    <span className={`px-2 py-0.5 rounded-md font-bold text-[11px] border ${t.badge}`}>
                      {count} clients
                    </span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Task Execution Pulse */}
          <div className="p-4 rounded-xl bg-slate-950/80 border border-slate-800 space-y-2.5">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-300 flex items-center gap-1.5">
                <CheckSquare className="w-4 h-4 text-indigo-400" />
                Task Completion Pulse
              </span>
              <span className="text-xs font-black text-indigo-400">
                {taskStats?.completionRate ?? 0}%
              </span>
            </div>
            <div className="w-full bg-slate-900 h-2 rounded-full overflow-hidden">
              <div
                className="bg-gradient-to-r from-indigo-500 to-emerald-400 h-full rounded-full"
                style={{ width: `${taskStats?.completionRate ?? 0}%` }}
              />
            </div>
            <div className="flex items-center justify-between text-[11px] text-slate-400">
              <span>Completed: {taskStats?.completedTasks ?? 0}</span>
              <span className="text-rose-400 font-semibold">Overdue: {taskStats?.overdueTasks ?? 0}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Operational Feeds: Top Deals, Today's Cadences, Urgent Tasks */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* 1. High-Value Opportunities Feed */}
        <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-5 shadow-xl space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Trophy className="w-4 h-4 text-amber-400" />
              <h3 className="text-sm font-bold text-slate-100">Top Sales Deals</h3>
            </div>
            <Link to="/pipeline" className="text-xs text-indigo-400 hover:text-indigo-300 font-semibold">
              All Deals
            </Link>
          </div>

          <div className="space-y-2.5">
            {recentDeals.length === 0 ? (
              <p className="text-xs text-slate-500 text-center py-6">No active opportunities.</p>
            ) : (
              recentDeals.map((d) => (
                <Link
                  key={d.id}
                  to="/pipeline"
                  className="block p-3 rounded-xl bg-slate-950/60 border border-slate-800/80 hover:border-indigo-500/40 transition-all space-y-1.5"
                >
                  <div className="flex items-start justify-between gap-2">
                    <h4 className="text-xs font-bold text-slate-200 line-clamp-1">{d.dealName}</h4>
                    <span className="text-xs font-black text-emerald-400 shrink-0">
                      ₹{d.amount?.toLocaleString()}
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-[11px] text-slate-400">
                    <DealStageBadge stage={d.stage} />
                    <span>{d.customerName || 'Prospect'}</span>
                  </div>
                </Link>
              ))
            )}
          </div>
        </div>

        {/* 2. Today's Cadence & Follow-Up Feed */}
        <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-5 shadow-xl space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <PhoneCall className="w-4 h-4 text-purple-400" />
              <h3 className="text-sm font-bold text-slate-100">Today's Touchpoints</h3>
            </div>
            <Link to="/followups" className="text-xs text-indigo-400 hover:text-indigo-300 font-semibold">
              View Cadence
            </Link>
          </div>

          <div className="space-y-2.5">
            {todayFollowUps.length === 0 ? (
              <p className="text-xs text-slate-500 text-center py-6">No follow-ups scheduled for today.</p>
            ) : (
              todayFollowUps.map((f) => (
                <Link
                  key={f.id}
                  to="/followups"
                  className="block p-3 rounded-xl bg-slate-950/60 border border-slate-800/80 hover:border-purple-500/40 transition-all space-y-1.5"
                >
                  <div className="flex items-start justify-between gap-2">
                    <h4 className="text-xs font-bold text-slate-200 line-clamp-1">{f.title}</h4>
                    <FollowUpChannelBadge channel={f.channel} />
                  </div>
                  <div className="flex items-center justify-between text-[11px] text-slate-400">
                    <span>{f.targetName || 'Prospect Contact'}</span>
                    <span className="flex items-center gap-1 text-slate-500">
                      <Clock className="w-3 h-3" />
                      {f.scheduledAt ? f.scheduledAt.slice(11, 16) : 'All Day'}
                    </span>
                  </div>
                </Link>
              ))
            )}
          </div>
        </div>

        {/* 3. Urgent & Overdue Task Action Center */}
        <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-5 shadow-xl space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <AlertTriangle className="w-4 h-4 text-rose-400" />
              <h3 className="text-sm font-bold text-slate-100">Urgent & Overdue Tasks</h3>
            </div>
            <Link to="/tasks" className="text-xs text-indigo-400 hover:text-indigo-300 font-semibold">
              Task Board
            </Link>
          </div>

          <div className="space-y-2.5">
            {urgentTasks.length === 0 ? (
              <div className="p-6 text-center text-slate-500 text-xs">
                <CheckCircle2 className="w-6 h-6 text-emerald-400 mx-auto mb-1.5 opacity-80" />
                All urgent activities completed!
              </div>
            ) : (
              urgentTasks.map((t) => (
                <Link
                  key={t.id}
                  to="/tasks"
                  className={`block p-3 rounded-xl bg-slate-950/60 border transition-all space-y-1.5 ${
                    t.isOverdue ? 'border-rose-500/40 hover:border-rose-500' : 'border-slate-800/80 hover:border-indigo-500/40'
                  }`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <h4 className="text-xs font-bold text-slate-200 line-clamp-1">{t.title}</h4>
                    <TaskPriorityBadge priority={t.priority} />
                  </div>
                  <div className="flex items-center justify-between text-[11px] text-slate-400">
                    <span className="truncate max-w-[120px]">{t.assignedToUserName || 'Unassigned'}</span>
                    {t.isOverdue ? (
                      <span className="text-rose-400 font-bold">Overdue: {t.dueDate}</span>
                    ) : (
                      <span className="text-slate-500">Due: {t.dueDate || 'No date'}</span>
                    )}
                  </div>
                </Link>
              ))
            )}
          </div>
        </div>
      </div>

      {/* Cluster Infrastructure Health & Active Team Directory (Admin Only) */}
      {isAdmin && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Microservices Cluster Health */}
          <div className="lg:col-span-2 bg-slate-900/70 border border-slate-800 rounded-2xl p-5 shadow-xl space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <Server className="w-4 h-4 text-indigo-400" />
                <h3 className="text-sm font-bold text-slate-100">Microservices Ecosystem Cluster Health</h3>
              </div>
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                <Activity className="w-3 h-3 animate-pulse text-emerald-400" />
                All 16 Services UP
              </span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2.5 text-xs">
              {[
                { name: 'Discovery Registry', port: '8761' },
                { name: 'API Gateway', port: '8080' },
                { name: 'Auth Service', port: '8081' },
                { name: 'User Management', port: '8082' },
                { name: 'Lead Pipeline', port: '8083' },
                { name: 'Customer Accounts', port: '8084' },
                { name: 'Task Activities', port: '8085' },
                { name: 'Follow-Up Cadence', port: '8086' },
                { name: 'Sales & Deals Pipeline', port: '8087' },
                { name: 'Reports & Analytics', port: '8088' },
                { name: 'Contact Management', port: '8089' },
                { name: 'Call Center & Dialer', port: '8090' },
                { name: 'Omnichannel Comm', port: '8091' },
                { name: 'Product & Catalog', port: '8092' },
                { name: 'Activity & Audit Log', port: '8093' },
                { name: 'Appointments & Meet', port: '8094' },
              ].map((svc) => (
                <div
                  key={svc.name}
                  className="p-2.5 rounded-xl bg-slate-950/60 border border-slate-800/80 flex items-center justify-between"
                >
                  <div className="min-w-0 pr-2">
                    <p className="font-semibold text-slate-200 text-[11px] truncate">{svc.name}</p>
                    <p className="text-[10px] text-slate-500 font-mono">Port {svc.port}</p>
                  </div>
                  <span className="w-2 h-2 rounded-full bg-emerald-400 shadow shadow-emerald-400/50 shrink-0" />
                </div>
              ))}
            </div>
          </div>

          {/* Active Team Directory Quick Glance */}
          <div className="lg:col-span-1 bg-slate-900/70 border border-slate-800 rounded-2xl p-5 shadow-xl space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <Users className="w-4 h-4 text-indigo-400" />
                <h3 className="text-sm font-bold text-slate-100">Team Directory ({users.length})</h3>
              </div>
              <Link to="/users" className="text-xs text-indigo-400 hover:text-indigo-300 font-semibold">
                Manage
              </Link>
            </div>

            <div className="space-y-2">
              {sortedUsers.slice(0, 5).map((u) => (
                <div
                  key={u.id}
                  className="flex items-center justify-between p-2 rounded-xl bg-slate-950/40 border border-slate-800/60 text-xs"
                >
                  <div className="min-w-0 pr-2">
                    <div className="flex items-center gap-1.5">
                      <p className="font-semibold text-slate-200 truncate">{u.name}</p>
                      {u.role !== 'ROLE_ADMIN' && u.department && (
                        <span className="text-[9px] px-1.5 py-0.2 rounded bg-slate-800 text-indigo-300 border border-slate-700 shrink-0">
                          {u.department}
                        </span>
                      )}
                    </div>
                    <p className="text-[10px] text-slate-500 truncate">{u.email}</p>
                  </div>
                  <div className="shrink-0">
                    <RoleBadge role={u.role} />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
