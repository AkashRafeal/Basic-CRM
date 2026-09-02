import React, { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { analyticsApi } from '../api/analyticsApi';
import {
  ExecutiveSummaryReport,
  SalesPerformanceReport,
  TeamLeaderboardReport,
  LeadSourceReport,
  CustomerIndustryReport,
  ProductPerformanceReport,
} from '../types/analytics';
import {
  TrendingUp,
  IndianRupee,
  Trophy,
  Users,
  Building2,
  Target,
  FileSpreadsheet,
  RefreshCw,
  Crown,
  Medal,
  Award,
  Lock,
  Shield,
  ShieldAlert,
  UserCheck,
  Package,
} from 'lucide-react';
import { triggerRefreshBlink } from '../components/common/RefreshFeedbackOverlay';

export const ReportsAnalytics: React.FC = () => {
  const { user, isAdmin, isManager, isEmployee } = useAuth();
  const [activeTab, setActiveTab] = useState<'sales' | 'team' | 'leads' | 'customers' | 'products'>('sales');
  const [loading, setLoading] = useState(true);

  const [execSummary, setExecSummary] = useState<ExecutiveSummaryReport | null>(null);
  const [salesReport, setSalesReport] = useState<SalesPerformanceReport | null>(null);
  const [teamReport, setTeamReport] = useState<TeamLeaderboardReport | null>(null);
  const [leadReport, setLeadReport] = useState<LeadSourceReport | null>(null);
  const [customerReport, setCustomerReport] = useState<CustomerIndustryReport | null>(null);
  const [productReport, setProductReport] = useState<ProductPerformanceReport | null>(null);

  const fetchReports = async () => {
    try {
      setLoading(true);
      const promises: Promise<any>[] = [
        analyticsApi.getExecutiveSummary(),
        analyticsApi.getSalesPerformance(),
        analyticsApi.getTeamLeaderboard(),
        analyticsApi.getLeadSources(),
        analyticsApi.getProductPerformance(),
      ];

      // Only fetch customer industry report if Admin or Manager
      if (!isEmployee) {
        promises.push(analyticsApi.getCustomerIndustries());
      }

      const results = await Promise.allSettled(promises);

      if (results[0].status === 'fulfilled' && results[0].value.success) {
        setExecSummary(results[0].value.data);
      }
      if (results[1].status === 'fulfilled' && results[1].value.success) {
        setSalesReport(results[1].value.data);
      }
      if (results[2].status === 'fulfilled' && results[2].value.success) {
        setTeamReport(results[2].value.data);
      }
      if (results[3].status === 'fulfilled' && results[3].value.success) {
        setLeadReport(results[3].value.data);
      }
      if (results[4].status === 'fulfilled' && results[4].value.success) {
        setProductReport(results[4].value.data);
      }
      if (!isEmployee && results[5] && results[5].status === 'fulfilled' && results[5].value.success) {
        setCustomerReport(results[5].value.data);
      }
    } catch (err) {
      console.error('Failed to load reports:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReports();
  }, [user]);

  // Find current employee's scorecard in leaderboard
  const myScorecard = teamReport?.leaderboard?.find(
    (rep) => rep.userId === user?.id || rep.userEmail?.toLowerCase() === user?.email?.toLowerCase()
  );

  return (
    <div className="space-y-8 animate-fade-in pb-12">
      {/* Header & Role Scoping Toolbar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2.5">
            <h1 className="text-2xl font-bold text-slate-100">Reports & Business Intelligence</h1>
            {isAdmin && (
              <span className="px-2.5 py-0.5 rounded-full bg-indigo-500/10 text-indigo-400 border border-indigo-500/30 text-xs font-semibold flex items-center gap-1">
                <Shield className="w-3 h-3 text-indigo-400" />
                <span>Company-Wide Intelligence</span>
              </span>
            )}
            {isManager && (
              <span className="px-2.5 py-0.5 rounded-full bg-blue-500/10 text-blue-400 border border-blue-500/30 text-xs font-semibold flex items-center gap-1">
                <Users className="w-3 h-3 text-blue-400" />
                <span>Team Scoped Analytics</span>
              </span>
            )}
            {isEmployee && (
              <span className="px-2.5 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 text-xs font-semibold flex items-center gap-1">
                <UserCheck className="w-3 h-3 text-emerald-400" />
                <span>Personal Performance & Quota</span>
              </span>
            )}
          </div>
          <p className="text-sm text-slate-400 mt-1">
            {isAdmin && 'Executive revenue velocity, all-company scorecards, lead ROI, and full portfolio analytics.'}
            {isManager && 'Direct team ARR velocity, rep scorecards, channel conversion, and team dataset exports.'}
            {isEmployee && 'Your personal pipeline velocity, individual scorecard, lead sources, and quota attainment.'}
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <button
            onClick={() => {
              fetchReports();
              triggerRefreshBlink('Analytics refreshed');
            }}
            disabled={loading}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold text-slate-300 bg-slate-900 border border-slate-800 hover:bg-slate-800 transition disabled:opacity-50"
            title="Refresh Reports"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin text-indigo-400' : ''}`} />
            <span>Refresh</span>
          </button>

          {/* Export Action Buttons / Anti-Theft Indicators */}
          {isAdmin && (
            <>
              <button
                onClick={() => analyticsApi.downloadCsvReport('deals')}
                className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold text-slate-300 bg-slate-900 border border-slate-800 hover:bg-slate-800 hover:text-white transition"
              >
                <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-400" />
                <span>Deals CSV</span>
              </button>

              <button
                onClick={() => analyticsApi.downloadCsvReport('customers')}
                className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold text-slate-300 bg-slate-900 border border-slate-800 hover:bg-slate-800 hover:text-white transition"
              >
                <FileSpreadsheet className="w-3.5 h-3.5 text-indigo-400" />
                <span>Customers CSV</span>
              </button>

              <button
                onClick={() => analyticsApi.downloadCsvReport('leads')}
                className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold text-slate-300 bg-slate-900 border border-slate-800 hover:bg-slate-800 hover:text-white transition"
              >
                <FileSpreadsheet className="w-3.5 h-3.5 text-amber-400" />
                <span>Leads CSV</span>
              </button>
            </>
          )}

          {isManager && (
            <>
              <span className="text-[11px] font-bold text-blue-400 bg-blue-500/10 px-2 py-1 rounded-lg border border-blue-500/20">
                Team Exports:
              </span>
              <button
                onClick={() => analyticsApi.downloadCsvReport('deals')}
                className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold text-slate-300 bg-slate-900 border border-slate-800 hover:bg-slate-800 hover:text-white transition"
                title="Export deals assigned to your team"
              >
                <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-400" />
                <span>Team Deals</span>
              </button>

              <button
                onClick={() => analyticsApi.downloadCsvReport('customers')}
                className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold text-slate-300 bg-slate-900 border border-slate-800 hover:bg-slate-800 hover:text-white transition"
                title="Export customer accounts managed by your team"
              >
                <FileSpreadsheet className="w-3.5 h-3.5 text-indigo-400" />
                <span>Team Clients</span>
              </button>

              <button
                onClick={() => analyticsApi.downloadCsvReport('leads')}
                className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold text-slate-300 bg-slate-900 border border-slate-800 hover:bg-slate-800 hover:text-white transition"
                title="Export leads assigned to your team"
              >
                <FileSpreadsheet className="w-3.5 h-3.5 text-amber-400" />
                <span>Team Leads</span>
              </button>
            </>
          )}

          {isEmployee && (
            <div
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-slate-900 border border-slate-800 text-slate-400 text-xs font-medium"
              title="Bulk data export is restricted for sales representative accounts to prevent data exfiltration"
            >
              <Lock className="w-3.5 h-3.5 text-rose-400" />
              <span>Exports Restricted (Anti-Theft)</span>
            </div>
          )}
        </div>
      </div>

      {/* Top Scoped Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-slate-900/80 border border-slate-800 p-5 rounded-2xl">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
              {isAdmin ? 'Total Pipeline ARR' : isManager ? 'Team Pipeline Value' : 'Personal Pipeline Value'}
            </span>
            <div className="w-9 h-9 rounded-xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400">
              <IndianRupee className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-black text-slate-100 mt-2">
            ₹{execSummary?.totalPipelineValue ? execSummary.totalPipelineValue.toLocaleString() : (loading ? '...' : 0)}
          </div>
          <div className="text-xs text-indigo-400 mt-1">
            Weighted Forecast: ₹{execSummary?.weightedForecastValue ? execSummary.weightedForecastValue.toLocaleString() : 0}
          </div>
        </div>

        <div className="bg-slate-900/80 border border-slate-800 p-5 rounded-2xl">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
              {isAdmin ? 'Company Win Rate' : isManager ? 'Team Win Rate' : 'Personal Win Rate'}
            </span>
            <div className="w-9 h-9 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
              <Trophy className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-black text-emerald-400 mt-2">
            {execSummary?.winRate ?? 0}%
          </div>
          <div className="text-xs text-emerald-400/80 mt-1">
            {execSummary?.wonDeals ?? 0} won out of {execSummary?.totalDeals ?? 0} closed
          </div>
        </div>

        <div className="bg-slate-900/80 border border-slate-800 p-5 rounded-2xl">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
              {isAdmin ? 'Portfolio Client ARR' : isManager ? 'Team Client ARR' : 'Personal Closed Won ARR'}
            </span>
            <div className="w-9 h-9 rounded-xl bg-purple-500/10 border border-purple-500/20 flex items-center justify-center text-purple-400">
              <Building2 className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-black text-purple-300 mt-2">
            ₹{execSummary?.recognizedCustomerArr ? execSummary.recognizedCustomerArr.toLocaleString() : (loading ? '...' : 0)}
          </div>
          <div className="text-xs text-purple-400/80 mt-1">
            {execSummary?.activeCustomers ?? 0} active accounts
          </div>
        </div>

        <div className="bg-slate-900/80 border border-slate-800 p-5 rounded-2xl">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
              {isAdmin ? 'Lead Conversion ROI' : isManager ? 'Team Conversion Rate' : 'Personal Lead Conversion'}
            </span>
            <div className="w-9 h-9 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400">
              <Target className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-black text-amber-400 mt-2">
            {execSummary?.leadConversionRate ?? 0}%
          </div>
          <div className="text-xs text-amber-400/80 mt-1">
            ₹{execSummary?.totalProspectLeadValue ? execSummary.totalProspectLeadValue.toLocaleString() : 0} prospect volume
          </div>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="flex flex-wrap gap-2 border-b border-slate-800 pb-3">
        {[
          {
            id: 'sales',
            label: isEmployee ? 'Sales & Pipeline Velocity' : isManager ? 'Team Sales & Velocity' : 'Sales & Revenue Velocity',
            icon: TrendingUp,
          },
          {
            id: 'team',
            label: isEmployee ? 'Personal Rank & Scorecard' : isManager ? 'Direct Team Scorecard' : 'Team Leaderboard & Scorecards',
            icon: Users,
          },
          {
            id: 'leads',
            label: isEmployee ? 'Personal Lead Sources' : isManager ? 'Team Lead Acquisition ROI' : 'Lead Channel Acquisition ROI',
            icon: Target,
          },
          {
            id: 'customers',
            label: isEmployee ? 'Customer Portfolio (Restricted)' : 'Customer Industry & ARR Concentration',
            icon: Building2,
            restricted: isEmployee,
          },
          {
            id: 'products',
            label: 'Product & Catalog Performance',
            icon: Package,
          },
        ].map((tab) => {
          const Icon = tab.icon;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold transition-all ${
                activeTab === tab.id
                  ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/20'
                  : 'bg-slate-900 text-slate-400 hover:text-slate-200 border border-slate-800'
              }`}
            >
              <Icon className="w-4 h-4" />
              <span>{tab.label}</span>
              {tab.restricted && <Lock className="w-3 h-3 text-rose-400 ml-1" />}
            </button>
          );
        })}
      </div>

      {/* TAB 1: Sales & Revenue Velocity */}
      {activeTab === 'sales' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Stage Revenue Contribution */}
            <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-5">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-base font-bold text-slate-100">Revenue Contribution by Stage</h3>
                  <p className="text-xs text-slate-400">
                    {isEmployee ? 'Value locked in your assigned deals across pipeline stages' : 'Dollar volume across each pipeline milestone'}
                  </p>
                </div>
                <span className="text-xs text-indigo-400 font-bold">
                  Avg Deal: ₹{salesReport?.averageDealSize ? salesReport.averageDealSize.toLocaleString() : 0}
                </span>
              </div>

              <div className="space-y-3.5">
                {salesReport?.revenueByStage && Object.keys(salesReport.revenueByStage).length > 0 ? (
                  Object.entries(salesReport.revenueByStage).map(([stage, val]) => {
                    const count = salesReport.dealsByStage?.[stage] || 0;
                    const maxVal = salesReport.totalPipelineValue || 1;
                    const pct = Math.min(Math.round((val / maxVal) * 100), 100);

                    return (
                      <div key={stage} className="space-y-1.5">
                        <div className="flex items-center justify-between text-xs">
                          <span className="font-semibold text-slate-300">{stage.replace('_', ' ')}</span>
                          <div className="flex items-center space-x-3">
                            <span className="text-slate-500 font-medium">{count} deals</span>
                            <span className="font-bold text-emerald-400">₹{val.toLocaleString()}</span>
                          </div>
                        </div>
                        <div className="w-full bg-slate-950 h-2 rounded-full overflow-hidden border border-slate-800">
                          <div
                            className="h-full rounded-full bg-gradient-to-r from-indigo-500 to-emerald-400"
                            style={{ width: `${Math.max(pct, count > 0 ? 5 : 0)}%` }}
                          />
                        </div>
                      </div>
                    );
                  })
                ) : (
                  <p className="text-xs text-slate-500 text-center py-6">No stage revenue data for your current scope.</p>
                )}
              </div>
            </div>

            {/* Loss Reason Pareto & Deal Type Mix */}
            <div className="space-y-6">
              {/* Deal Type Mix */}
              <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-4">
                <h3 className="text-base font-bold text-slate-100">Deal Revenue by Contract Type</h3>
                <div className="grid grid-cols-2 gap-3">
                  {salesReport?.dealsByType && Object.keys(salesReport.dealsByType).length > 0 ? (
                    Object.entries(salesReport.dealsByType).map(([type, count]) => {
                      const rev = salesReport.revenueByType?.[type] || 0;
                      return (
                        <div key={type} className="p-3.5 rounded-xl bg-slate-950/60 border border-slate-800 space-y-1">
                          <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block">
                            {type.replace('_', ' ')}
                          </span>
                          <div className="text-lg font-black text-slate-200">₹{rev.toLocaleString()}</div>
                          <span className="text-xs text-indigo-400 font-semibold">{count} opportunities</span>
                        </div>
                      );
                    })
                  ) : (
                    <p className="text-xs text-slate-500 text-center col-span-2 py-4">No deals recorded.</p>
                  )}
                </div>
              </div>

              {/* Loss Reasons Pareto */}
              <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-4">
                <h3 className="text-base font-bold text-slate-100">Closed Lost Root Cause Pareto</h3>
                <div className="space-y-2.5">
                  {salesReport?.lossReasonsPareto && Object.keys(salesReport.lossReasonsPareto).length > 0 ? (
                    Object.entries(salesReport.lossReasonsPareto).map(([reason, count]) => (
                      <div
                        key={reason}
                        className="flex items-center justify-between p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-xs"
                      >
                        <span className="font-semibold text-rose-300">{reason}</span>
                        <span className="px-2 py-0.5 rounded font-bold bg-rose-500/20 text-rose-400 border border-rose-500/30">
                          {count} lost
                        </span>
                      </div>
                    ))
                  ) : (
                    <p className="text-xs text-slate-500 text-center py-4">No lost deals recorded.</p>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: Team Performance Leaderboard & Scorecards */}
      {activeTab === 'team' && (
        <div className="space-y-6">
          {/* Employee Spotlight Scorecard */}
          {isEmployee && myScorecard && (
            <div className="p-6 rounded-2xl bg-gradient-to-r from-indigo-900/40 via-purple-900/20 to-slate-900 border border-indigo-500/30 shadow-2xl space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="flex items-center space-x-3">
                  <div className="w-12 h-12 rounded-2xl bg-indigo-600 flex items-center justify-center text-white font-black text-lg shadow-lg">
                    #{myScorecard.rank}
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-white flex items-center gap-2">
                      <span>Your Sales Scorecard</span>
                      <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 text-xs font-semibold">
                        Rank #{myScorecard.rank}
                      </span>
                    </h3>
                    <p className="text-xs text-slate-300">Keep up the momentum to climb the company leaderboard!</p>
                  </div>
                </div>

                <div className="flex items-center gap-4">
                  <div className="text-right">
                    <span className="text-[11px] text-slate-400 block font-medium">Personal Closed Won</span>
                    <span className="text-xl font-black text-emerald-400">
                      ₹{myScorecard.closedWonRevenue?.toLocaleString()}
                    </span>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-3 border-t border-indigo-500/20">
                <div className="p-3 rounded-xl bg-slate-900/80 border border-slate-800">
                  <span className="text-[10px] uppercase tracking-wider text-slate-400 font-bold block">Active Pipeline</span>
                  <span className="text-sm font-black text-indigo-300">₹{myScorecard.activePipelineValue?.toLocaleString()}</span>
                </div>
                <div className="p-3 rounded-xl bg-slate-900/80 border border-slate-800">
                  <span className="text-[10px] uppercase tracking-wider text-slate-400 font-bold block">Deals Won</span>
                  <span className="text-sm font-black text-emerald-400">{myScorecard.dealsWon} contracts</span>
                </div>
                <div className="p-3 rounded-xl bg-slate-900/80 border border-slate-800">
                  <span className="text-[10px] uppercase tracking-wider text-slate-400 font-bold block">Client Touchpoints</span>
                  <span className="text-sm font-black text-amber-300">{myScorecard.touchpointsCompleted} logs</span>
                </div>
                <div className="p-3 rounded-xl bg-slate-900/80 border border-slate-800">
                  <span className="text-[10px] uppercase tracking-wider text-slate-400 font-bold block">Task Execution</span>
                  <span className="text-sm font-black text-purple-300">{myScorecard.taskCompletionRate}% completed</span>
                </div>
              </div>
            </div>
          )}

          {/* Leaderboard Table */}
          <div className="bg-slate-900/80 border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
            <div className="p-6 border-b border-slate-800 bg-slate-900/60 flex items-center justify-between">
              <div>
                <h3 className="text-base font-bold text-slate-100">
                  {isAdmin ? 'Company-Wide Sales Leaderboard' : isManager ? 'Direct Team Scorecard & Ranking' : 'Sales Representative Leaderboard'}
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  {isAdmin && 'Ranked across all company sales representatives by revenue and velocity'}
                  {isManager && 'Direct team performance ranking and activity metrics'}
                  {isEmployee && 'Comparative rankings across your sales group'}
                </p>
              </div>
              <div className="flex items-center space-x-3 text-xs">
                <span className="text-slate-400">{isManager ? 'Team Total ARR:' : 'Total Won ARR:'}</span>
                <span className="text-emerald-400 font-bold">
                  ₹{teamReport?.teamTotalRevenue ? teamReport.teamTotalRevenue.toLocaleString() : 0}
                </span>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-slate-800 bg-slate-900/80 text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                    <th className="px-6 py-4">Rank</th>
                    <th className="px-6 py-4">Representative</th>
                    <th className="px-6 py-4">Closed Won ARR</th>
                    <th className="px-6 py-4">Active Pipeline</th>
                    <th className="px-6 py-4">Deals Won</th>
                    <th className="px-6 py-4">Touchpoints</th>
                    <th className="px-6 py-4">Task Completion</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60 text-sm">
                  {teamReport?.leaderboard && teamReport.leaderboard.length > 0 ? (
                    teamReport.leaderboard.map((rep) => {
                      const isMe = rep.userId === user?.id || rep.userEmail?.toLowerCase() === user?.email?.toLowerCase();
                      const getRankIcon = (rank: number) => {
                        if (rank === 1) return <Crown className="w-4 h-4 text-amber-400 inline mr-1" />;
                        if (rank === 2) return <Medal className="w-4 h-4 text-slate-300 inline mr-1" />;
                        if (rank === 3) return <Award className="w-4 h-4 text-amber-600 inline mr-1" />;
                        return <span className="text-slate-500 font-bold ml-1">{rank}</span>;
                      };

                      return (
                        <tr
                          key={rep.userId}
                          className={`transition-colors ${
                            isMe ? 'bg-indigo-500/10 hover:bg-indigo-500/15 border-l-4 border-l-indigo-500' : 'hover:bg-slate-800/30'
                          }`}
                        >
                          <td className="px-6 py-4 font-bold text-slate-300">{getRankIcon(rep.rank)}</td>
                          <td className="px-6 py-4">
                            <div className="flex items-center gap-2">
                              <div>
                                <p className="font-semibold text-slate-100 flex items-center gap-1.5">
                                  <span>{rep.userName}</span>
                                  {isMe && (
                                    <span className="px-1.5 py-0.2 rounded bg-indigo-500 text-white text-[10px] font-bold">
                                      You
                                    </span>
                                  )}
                                </p>
                                <p className="text-xs text-slate-500">{rep.userEmail}</p>
                              </div>
                            </div>
                          </td>
                          <td className="px-6 py-4 font-bold text-emerald-400">
                            ₹{rep.closedWonRevenue?.toLocaleString()}
                          </td>
                          <td className="px-6 py-4 font-semibold text-indigo-300">
                            ₹{rep.activePipelineValue?.toLocaleString()}
                          </td>
                          <td className="px-6 py-4 text-xs font-semibold text-slate-300">{rep.dealsWon} won</td>
                          <td className="px-6 py-4 text-xs text-slate-300">{rep.touchpointsCompleted} logs</td>
                          <td className="px-6 py-4">
                            <div className="flex items-center space-x-2">
                              <span className="text-xs font-bold text-indigo-400">{rep.taskCompletionRate}%</span>
                              <div className="w-16 bg-slate-950 h-1.5 rounded-full overflow-hidden">
                                <div
                                  className="bg-indigo-500 h-full rounded-full"
                                  style={{ width: `${rep.taskCompletionRate}%` }}
                                />
                              </div>
                            </div>
                          </td>
                        </tr>
                      );
                    })
                  ) : (
                    <tr>
                      <td colSpan={7} className="px-6 py-8 text-center text-xs text-slate-500">
                        No team scorecards recorded.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* TAB 3: Lead Channel Acquisition ROI */}
      {activeTab === 'leads' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {leadReport?.sourceMetrics && leadReport.sourceMetrics.length > 0 ? (
              leadReport.sourceMetrics.map((source) => (
                <div key={source.source} className="bg-slate-900/80 border border-slate-800 p-5 rounded-2xl shadow-xl space-y-3">
                  <div className="flex items-center justify-between">
                    <h4 className="text-sm font-bold text-slate-100">{source.sourceDisplayName}</h4>
                    <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-amber-500/10 text-amber-400 border border-amber-500/30">
                      {source.conversionRate}% Conv
                    </span>
                  </div>

                  <div className="flex items-center justify-between text-xs pt-2 border-t border-slate-800">
                    <span className="text-slate-400">Total Leads:</span>
                    <span className="font-bold text-slate-200">{source.leadCount}</span>
                  </div>

                  <div className="flex items-center justify-between text-xs">
                    <span className="text-slate-400">Converted Clients:</span>
                    <span className="font-bold text-emerald-400">{source.convertedCount}</span>
                  </div>

                  <div className="flex items-center justify-between text-xs">
                    <span className="text-slate-400">Estimated Pipeline:</span>
                    <span className="font-bold text-indigo-300">₹{source.totalValue?.toLocaleString()}</span>
                  </div>

                  <div className="w-full bg-slate-950 h-1.5 rounded-full overflow-hidden">
                    <div
                      className="bg-gradient-to-r from-amber-500 to-emerald-400 h-full rounded-full"
                      style={{ width: `${source.conversionRate}%` }}
                    />
                  </div>
                </div>
              ))
            ) : (
              <div className="col-span-3 py-8 text-center text-xs text-slate-500 bg-slate-900/50 rounded-2xl border border-slate-800">
                No lead acquisition records for your current scope.
              </div>
            )}
          </div>
        </div>
      )}

      {/* TAB 4: Customer Industry & ARR Concentration */}
      {activeTab === 'customers' && (
        <div className="space-y-6">
          {isEmployee ? (
            <div className="p-8 rounded-2xl bg-slate-900/80 border border-slate-800 text-center space-y-4 max-w-xl mx-auto my-8 shadow-2xl">
              <div className="w-14 h-14 rounded-2xl bg-rose-500/10 border border-rose-500/30 flex items-center justify-center text-rose-400 mx-auto">
                <ShieldAlert className="w-7 h-7" />
              </div>
              <h3 className="text-lg font-bold text-slate-100">Customer Portfolio Analysis Restricted</h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                Organizational customer industry concentration, client tier distribution, and enterprise risk metrics are
                restricted to <strong>Managers 👔</strong> and <strong>Admins 🛡️</strong> in accordance with CRM data security policies.
              </p>
              <div className="pt-2">
                <span className="px-3 py-1 rounded-lg bg-slate-800 text-slate-400 text-xs font-semibold">
                  Role: Sales Representative (Employee)
                </span>
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Industry ARR Concentration */}
              <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-5">
                <div>
                  <h3 className="text-base font-bold text-slate-100">Industry ARR Concentration</h3>
                  <p className="text-xs text-slate-400">
                    {isAdmin ? 'Company annual recurring revenue distributed by client industry sector' : 'Team client ARR distributed by industry sector'}
                  </p>
                </div>

                <div className="space-y-4">
                  {customerReport?.industryMetrics && customerReport.industryMetrics.length > 0 ? (
                    customerReport.industryMetrics.map((ind) => (
                      <div key={ind.industry} className="space-y-1.5">
                        <div className="flex items-center justify-between text-xs">
                          <span className="font-semibold text-slate-300">{ind.industryDisplayName}</span>
                          <div className="flex items-center space-x-3">
                            <span className="text-slate-400">{ind.customerCount} accounts</span>
                            <span className="font-bold text-emerald-400">₹{ind.totalArr?.toLocaleString()}</span>
                            <span className="text-[11px] font-bold text-indigo-400">({ind.revenueSharePercent}%)</span>
                          </div>
                        </div>
                        <div className="w-full bg-slate-950 h-2 rounded-full overflow-hidden border border-slate-800">
                          <div
                            className="h-full rounded-full bg-gradient-to-r from-indigo-500 to-emerald-400"
                            style={{ width: `${ind.revenueSharePercent}%` }}
                          />
                        </div>
                      </div>
                    ))
                  ) : (
                    <p className="text-xs text-slate-500 text-center py-6">No customer industry records for current scope.</p>
                  )}
                </div>
              </div>

              {/* Client Tier Portfolio Breakdown */}
              <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-5">
                <div>
                  <h3 className="text-base font-bold text-slate-100">Customer Tier Portfolio Mix</h3>
                  <p className="text-xs text-slate-400">Concentration across Enterprise, Strategic, and Mid-Market</p>
                </div>

                <div className="space-y-3">
                  {customerReport?.tierBreakdown && Object.keys(customerReport.tierBreakdown).length > 0 ? (
                    Object.entries(customerReport.tierBreakdown).map(([tier, count]) => {
                      const arr = customerReport.tierRevenue?.[tier] || 0;
                      return (
                        <div
                          key={tier}
                          className="p-4 rounded-xl bg-slate-950/60 border border-slate-800 flex items-center justify-between"
                        >
                          <div>
                            <p className="font-semibold text-slate-200 text-xs">{tier.replace('_', ' ')}</p>
                            <p className="text-[11px] text-slate-500">{count} client accounts</p>
                          </div>
                          <div className="text-right">
                            <p className="font-bold text-emerald-400 text-sm">₹{arr.toLocaleString()}</p>
                            <p className="text-[10px] text-slate-500">Annual ARR</p>
                          </div>
                        </div>
                      );
                    })
                  ) : (
                    <p className="text-xs text-slate-500 text-center py-6">No customer tier records.</p>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* TAB 5: Product & Catalog Performance */}
      {activeTab === 'products' && (
        <div className="space-y-6">
          {/* Summary KPI Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-slate-900/80 border border-slate-800 p-5 rounded-2xl">
              <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
                Total Products & Courses
              </span>
              <div className="text-2xl font-black text-slate-100 mt-2">
                {productReport?.totalProducts ?? 0}
              </div>
              <div className="text-xs text-indigo-400 mt-1">
                {productReport?.activeProducts ?? 0} active in catalog
              </div>
            </div>

            <div className="bg-slate-900/80 border border-slate-800 p-5 rounded-2xl">
              <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
                Total Product Won Revenue
              </span>
              <div className="text-2xl font-black text-emerald-400 mt-2">
                ₹{productReport?.totalProductRevenue?.toLocaleString('en-IN') ?? 0}
              </div>
              <div className="text-xs text-emerald-400/80 mt-1">
                From recognized line item transactions
              </div>
            </div>

            <div className="bg-slate-900/80 border border-slate-800 p-5 rounded-2xl">
              <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
                Active Product Pipeline
              </span>
              <div className="text-2xl font-black text-indigo-400 mt-2">
                ₹{productReport?.totalProductPipelineValue?.toLocaleString('en-IN') ?? 0}
              </div>
              <div className="text-xs text-indigo-400/80 mt-1">
                Open deal opportunities in progress
              </div>
            </div>

            <div className="bg-slate-900/80 border border-slate-800 p-5 rounded-2xl">
              <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
                Active Customer Subscriptions
              </span>
              <div className="text-2xl font-black text-purple-300 mt-2">
                {productReport?.products?.reduce((acc, p) => acc + (p.activeCustomersCount || 0), 0) ?? 0}
              </div>
              <div className="text-xs text-purple-400/80 mt-1">
                Active client product entitlements
              </div>
            </div>
          </div>

          {/* Top Rankings Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Top Revenue Products */}
            <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-5">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-base font-bold text-slate-100 flex items-center gap-2">
                    <Crown className="w-5 h-5 text-amber-400" />
                    Top Revenue Generating Offerings
                  </h3>
                  <p className="text-xs text-slate-400">Ranked by recognized Closed-Won revenue</p>
                </div>
              </div>

              <div className="space-y-3">
                {productReport?.topRevenueProducts && productReport.topRevenueProducts.length > 0 ? (
                  productReport.topRevenueProducts.map((p, idx) => (
                    <div
                      key={p.productId}
                      className="p-3.5 rounded-xl bg-slate-950/60 border border-slate-800 flex items-center justify-between"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-7 h-7 rounded-lg bg-amber-500/10 text-amber-400 font-black text-xs flex items-center justify-center border border-amber-500/20">
                          #{idx + 1}
                        </div>
                        <div>
                          <p className="font-semibold text-slate-100 text-xs">{p.productName}</p>
                          <p className="text-[11px] text-slate-400">{p.wonDealsCount} won deals • Win rate {p.conversionRate}%</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="font-bold text-emerald-400 text-sm">₹{p.closedWonRevenue?.toLocaleString('en-IN')}</p>
                        <p className="text-[10px] text-slate-500">{p.category || 'Standard'}</p>
                      </div>
                    </div>
                  ))
                ) : (
                  <p className="text-xs text-slate-500 text-center py-6">No closed-won product transactions yet.</p>
                )}
              </div>
            </div>

            {/* Top In-Demand Lead Products */}
            <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-5">
              <div>
                <h3 className="text-base font-bold text-slate-100 flex items-center gap-2">
                  <Target className="w-5 h-5 text-indigo-400" />
                  Most In-Demand Lead Interests
                </h3>
                <p className="text-xs text-slate-400">Products with highest prospect interest and pipeline traction</p>
              </div>

              <div className="space-y-3">
                {productReport?.topInterestedProducts && productReport.topInterestedProducts.length > 0 ? (
                  productReport.topInterestedProducts.map((p, idx) => (
                    <div
                      key={p.productId}
                      className="p-3.5 rounded-xl bg-slate-950/60 border border-slate-800 flex items-center justify-between"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-7 h-7 rounded-lg bg-indigo-500/10 text-indigo-400 font-black text-xs flex items-center justify-center border border-indigo-500/20">
                          #{idx + 1}
                        </div>
                        <div>
                          <p className="font-semibold text-slate-100 text-xs">{p.productName}</p>
                          <p className="text-[11px] text-slate-400">{p.interestedLeadsCount} interested leads • {p.totalDealsCount} in pipeline</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="font-bold text-indigo-300 text-sm">₹{p.unitPrice?.toLocaleString('en-IN')}</p>
                        <p className="text-[10px] text-slate-500">{p.category || 'Standard'}</p>
                      </div>
                    </div>
                  ))
                ) : (
                  <p className="text-xs text-slate-500 text-center py-6">No lead product interest recorded yet.</p>
                )}
              </div>
            </div>
          </div>

          {/* Detailed Product Performance Table */}
          <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-4">
            <div>
              <h3 className="text-base font-bold text-slate-100">Full Catalog Performance Matrix</h3>
              <p className="text-xs text-slate-400">Complete breakdown across interest, pipeline, conversion, and won revenue</p>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="border-b border-slate-800 text-slate-400 uppercase tracking-wider text-[10px]">
                    <th className="py-3 px-3">Product Name</th>
                    <th className="py-3 px-3">Category</th>
                    <th className="py-3 px-3 text-right">Catalog Price</th>
                    <th className="py-3 px-3 text-center">Interested Leads</th>
                    <th className="py-3 px-3 text-center">Pipeline Deals</th>
                    <th className="py-3 px-3 text-center">Won Deals</th>
                    <th className="py-3 px-3 text-center">Win Rate</th>
                    <th className="py-3 px-3 text-right">Won Revenue</th>
                    <th className="py-3 px-3 text-center">Active Subscriptions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60 text-slate-200">
                  {productReport?.products && productReport.products.length > 0 ? (
                    productReport.products.map((item) => (
                      <tr key={item.productId} className="hover:bg-slate-800/30">
                        <td className="py-3 px-3 font-semibold text-slate-100">
                          {item.productName}
                          {item.sku && <span className="text-[10px] text-slate-500 block">SKU: {item.sku}</span>}
                        </td>
                        <td className="py-3 px-3">
                          <span className="px-2 py-0.5 rounded bg-indigo-500/10 text-indigo-300 text-[10px] border border-indigo-500/20">
                            {item.category || 'General'}
                          </span>
                        </td>
                        <td className="py-3 px-3 text-right font-medium text-slate-300">
                          ₹{item.unitPrice?.toLocaleString('en-IN')}
                        </td>
                        <td className="py-3 px-3 text-center font-bold text-amber-400">
                          {item.interestedLeadsCount}
                        </td>
                        <td className="py-3 px-3 text-center font-bold text-indigo-400">
                          {item.totalDealsCount}
                        </td>
                        <td className="py-3 px-3 text-center font-bold text-emerald-400">
                          {item.wonDealsCount}
                        </td>
                        <td className="py-3 px-3 text-center font-semibold text-slate-300">
                          {item.conversionRate}%
                        </td>
                        <td className="py-3 px-3 text-right font-bold text-emerald-400">
                          ₹{item.closedWonRevenue?.toLocaleString('en-IN')}
                        </td>
                        <td className="py-3 px-3 text-center font-bold text-purple-300">
                          {item.activeCustomersCount}
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={9} className="text-center py-6 text-slate-500 italic">
                        No product metrics recorded yet.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
