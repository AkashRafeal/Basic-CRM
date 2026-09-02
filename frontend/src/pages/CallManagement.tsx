import React, { useEffect, useState } from 'react';
import { callApi } from '../api/callApi';
import { customerApi } from '../api/customerApi';
import { leadApi } from '../api/leadApi';
import { contactApi } from '../api/contactApi';
import { userApi } from '../api/userApi';
import {
  CallLog,
  CallStats,
  CallType,
  CallStatus,
  CallPurpose,
  CallOutcome,
  CreateCallRequest,
  UpdateCallRequest,
  LogCallOutcomeRequest,
} from '../types/call';
import { Customer } from '../types/customer';
import { Lead } from '../types/lead';
import { Contact } from '../types/contact';
import { User } from '../types/auth';
import { CallStatusBadge } from '../components/calls/CallStatusBadge';
import { CallTypeBadge } from '../components/calls/CallTypeBadge';
import { CallPurposeBadge } from '../components/calls/CallPurposeBadge';
import { CallOutcomeBadge } from '../components/calls/CallOutcomeBadge';
import { CreateCallModal } from '../components/calls/CreateCallModal';
import { EditCallModal } from '../components/calls/EditCallModal';
import { LogOutcomeModal } from '../components/calls/LogOutcomeModal';
import { CallDetailsModal } from '../components/calls/CallDetailsModal';
import { DeleteCallModal } from '../components/calls/DeleteCallModal';
import { ActiveDialerModal } from '../components/calls/ActiveDialerModal';
import { CallerIdSettingsModal } from '../components/calls/CallerIdSettingsModal';
import {
  PhoneCall,
  PhoneOutgoing,
  PhoneIncoming,
  Clock,
  CheckCircle2,
  PhoneMissed,
  Trophy,
  Radio,
  Search,
  Plus,
  Grid,
  List,
  Calendar,
  User as UserIcon,
  Building2,
  FileSpreadsheet,
  Edit2,
  Trash2,
  Eye,
  CheckSquare,
  RefreshCw,
} from 'lucide-react';
import { triggerRefreshBlink } from '../components/common/RefreshFeedbackOverlay';

export const CallManagement: React.FC = () => {
  const [calls, setCalls] = useState<CallLog[]>([]);
  const [stats, setStats] = useState<CallStats | null>(null);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [leads, setLeads] = useState<Lead[]>([]);
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [teamMembers, setTeamMembers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Filters & State
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedType, setSelectedType] = useState<CallType | ''>('');
  const [selectedStatus, setSelectedStatus] = useState<CallStatus | ''>('');
  const [selectedPurpose, setSelectedPurpose] = useState<CallPurpose | ''>('');
  const [selectedOutcome, setSelectedOutcome] = useState<CallOutcome | ''>('');
  const [activeTab, setActiveTab] = useState<
    'ALL' | 'TODAY_SCHEDULED' | 'COMPLETED' | 'OUTBOUND' | 'INBOUND' | 'MISSED'
  >('ALL');
  const [viewMode, setViewMode] = useState<'grid' | 'table'>('grid');
  const [currentPage, setCurrentPage] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [totalItems, setTotalItems] = useState(0);

  // Modals
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isDetailsOpen, setIsDetailsOpen] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [isLogOutcomeOpen, setIsLogOutcomeOpen] = useState(false);
  const [isDialerOpen, setIsDialerOpen] = useState(false);
  const [isCallerIdModalOpen, setIsCallerIdModalOpen] = useState(false);
  const [callerIdNumber, setCallerIdNumber] = useState(
    localStorage.getItem('crm_outbound_caller_id') || '+91 98765 43210'
  );

  useEffect(() => {
    const handleCallerIdUpdate = () => {
      const saved = localStorage.getItem('crm_outbound_caller_id');
      if (saved) setCallerIdNumber(saved);
    };
    window.addEventListener('crm_caller_id_updated', handleCallerIdUpdate);
    return () => window.removeEventListener('crm_caller_id_updated', handleCallerIdUpdate);
  }, []);

  // Selected Target for Modals
  const [selectedCall, setSelectedCall] = useState<CallLog | null>(null);
  const [dialerPhone, setDialerPhone] = useState('');
  const [dialerName, setDialerName] = useState('');

  // Toast feedback
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 4000);
  };

  const loadData = async () => {
    try {
      setLoading(true);

      let statusParam: CallStatus | undefined = selectedStatus ? (selectedStatus as CallStatus) : undefined;
      let typeParam: CallType | undefined = selectedType ? (selectedType as CallType) : undefined;

      if (activeTab === 'TODAY_SCHEDULED') {
        statusParam = 'SCHEDULED';
      } else if (activeTab === 'COMPLETED') {
        statusParam = 'COMPLETED';
      } else if (activeTab === 'OUTBOUND') {
        typeParam = 'OUTBOUND';
      } else if (activeTab === 'INBOUND') {
        typeParam = 'INBOUND';
      } else if (activeTab === 'MISSED') {
        statusParam = 'MISSED';
      }

      const [callsRes, statsRes, custRes, leadRes, contactRes, teamRes] = await Promise.all([
        callApi.getCalls({
          search: searchTerm || undefined,
          callType: typeParam,
          status: statusParam,
          purpose: selectedPurpose ? (selectedPurpose as CallPurpose) : undefined,
          outcome: selectedOutcome ? (selectedOutcome as CallOutcome) : undefined,
          page: currentPage,
          size: 18,
          sortBy: 'createdAt',
          sortDir: 'desc',
        }),
        callApi.getStats().catch(() => null),
        customerApi.getCustomers({}).catch(() => ({ data: [] })),
        leadApi.getLeads({}).catch(() => ({ data: [] })),
        contactApi.getContacts({ size: 100 }).catch(() => ({ data: [] })),
        userApi.getAllUsers().catch(() => []),
      ]);

      setCalls(callsRes.data || []);
      setTotalPages(callsRes.totalPages || 1);
      setTotalItems(callsRes.totalItems || 0);
      if (statsRes) setStats(statsRes);
      if (custRes?.data) setCustomers(custRes.data);
      if (leadRes?.data) setLeads(leadRes.data);
      if (contactRes?.data) setContacts(contactRes.data);
      if (teamRes) setTeamMembers(teamRes);
    } catch (err) {
      console.error('Failed to load call management data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [
    searchTerm,
    selectedType,
    selectedStatus,
    selectedPurpose,
    selectedOutcome,
    activeTab,
    currentPage,
  ]);

  const handleCreate = async (data: CreateCallRequest) => {
    await callApi.createCall(data);
    showToast('Call recorded / scheduled successfully.');
    loadData();
  };

  const handleUpdate = async (id: number, data: UpdateCallRequest) => {
    await callApi.updateCall(id, data);
    showToast('Call details updated.');
    loadData();
  };

  const handleLogOutcome = async (id: number, data: LogCallOutcomeRequest) => {
    await callApi.logOutcome(id, data);
    showToast('Call outcome & completion recorded.');
    loadData();
  };

  const handleDelete = async (id: number) => {
    await callApi.deleteCall(id);
    showToast('Call log removed.');
    loadData();
  };

  const handleQuickDial = (phone: string, name: string) => {
    setDialerPhone(phone);
    setDialerName(name);
    setIsDialerOpen(true);
  };

  const exportCallsCsv = () => {
    if (calls.length === 0) return;
    const headers = [
      'ID',
      'Subject',
      'Type',
      'Status',
      'Purpose',
      'Outcome',
      'Contact',
      'Phone',
      'Related To',
      'Duration (min)',
      'Scheduled Time',
      'Agent',
      'Created At',
    ];
    const rows = calls.map((c) => [
      c.id,
      `"${c.title}"`,
      c.callType,
      c.status,
      c.purpose,
      c.outcome || '',
      `"${c.contactName || ''}"`,
      c.contactPhone || '',
      `"${c.relatedToName || ''}"`,
      c.durationMinutes || 0,
      c.scheduledStartTime || '',
      `"${c.assignedToUserName || ''}"`,
      c.createdAt,
    ]);

    const csvContent =
      'data:text/csv;charset=utf-8,' +
      [headers.join(','), ...rows.map((e) => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `CRM_Calls_Export_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-8 animate-fade-in pb-12">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 flex items-center gap-2.5 px-4 py-3 rounded-2xl bg-slate-900 border border-emerald-500/30 text-emerald-300 text-xs font-semibold shadow-2xl shadow-emerald-500/10">
          <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Header Banner */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 text-xs font-semibold uppercase tracking-wider mb-2">
            <PhoneCall className="w-3.5 h-3.5" />
            Telephony & Outbound Hub
          </div>
          <h1 className="text-3xl font-extrabold text-slate-100 tracking-tight">
            Call Management & Logs
          </h1>
          <p className="text-sm text-slate-400 mt-1">
            Schedule prospect calls, log telephony interactions, capture notes, and analyze call outcomes
          </p>
        </div>

        <div className="flex items-center flex-wrap gap-2.5">
          <button
            onClick={() => {
              setIsRefreshing(true);
              triggerRefreshBlink('Calls refreshed');
              loadData();
              setTimeout(() => setIsRefreshing(false), 600);
            }}
            title="Refresh Calls"
            className="flex items-center gap-1.5 px-3 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-300 text-xs font-semibold transition-all active:scale-95"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isRefreshing ? 'animate-spin text-indigo-400' : ''}`} />
            <span>Refresh</span>
          </button>

          <button
            onClick={() => setIsCallerIdModalOpen(true)}
            className="px-3.5 py-2.5 rounded-xl bg-indigo-950/40 hover:bg-indigo-900/50 border border-indigo-500/30 text-indigo-300 text-xs font-semibold flex items-center gap-2 transition-all shadow-sm group"
            title="Configure phone number given by you for outbound calling"
          >
            <Radio className="w-3.5 h-3.5 text-emerald-400 animate-pulse" />
            <span>Caller ID: <strong className="font-mono text-white">{callerIdNumber}</strong></span>
            <span className="text-[10px] uppercase font-bold px-1.5 py-0.5 rounded bg-indigo-600/40 text-indigo-200">
              Change
            </span>
          </button>

          <button
            onClick={() => {
              setDialerPhone('');
              setDialerName('');
              setIsDialerOpen(true);
            }}
            className="px-3.5 py-2.5 rounded-xl bg-sky-500/15 hover:bg-sky-500/25 border border-sky-500/30 text-sky-300 text-xs font-semibold flex items-center gap-2 transition-all shadow-sm"
          >
            <PhoneOutgoing className="w-4 h-4 text-sky-400" />
            <span>Open Softphone</span>
          </button>

          <button
            onClick={exportCallsCsv}
            className="px-3 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-300 text-xs font-semibold flex items-center gap-2 transition-all"
            title="Export CSV"
          >
            <FileSpreadsheet className="w-4 h-4 text-emerald-400" />
            <span>Export</span>
          </button>

          <button
            onClick={() => setIsCreateOpen(true)}
            className="px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold flex items-center gap-2 shadow-lg shadow-indigo-600/30 transition-all active:scale-95"
          >
            <Plus className="w-4 h-4" />
            <span>Schedule / Log Call</span>
          </button>
        </div>
      </div>

      {/* KPI Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3.5">
        <div className="p-4 rounded-2xl bg-slate-900/60 border border-slate-800/80 backdrop-blur-sm">
          <div className="flex items-center justify-between text-slate-400 text-xs mb-1">
            <span>Total Calls</span>
            <PhoneCall className="w-4 h-4 text-indigo-400" />
          </div>
          <div className="text-2xl font-bold text-slate-100">{stats?.totalCalls || 0}</div>
          <div className="text-[11px] text-slate-500 mt-1">Logged in CRM</div>
        </div>

        <div className="p-4 rounded-2xl bg-slate-900/60 border border-slate-800/80 backdrop-blur-sm">
          <div className="flex items-center justify-between text-slate-400 text-xs mb-1">
            <span>Today's Calls</span>
            <Clock className="w-4 h-4 text-amber-400" />
          </div>
          <div className="text-2xl font-bold text-amber-400">
            {stats?.todayScheduledCalls || 0}
          </div>
          <div className="text-[11px] text-slate-500 mt-1">Scheduled for today</div>
        </div>

        <div className="p-4 rounded-2xl bg-slate-900/60 border border-slate-800/80 backdrop-blur-sm">
          <div className="flex items-center justify-between text-slate-400 text-xs mb-1">
            <span>Completed</span>
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="text-2xl font-bold text-emerald-400">
            {stats?.completedCalls || 0}
          </div>
          <div className="text-[11px] text-slate-500 mt-1">
            {stats?.totalDurationMinutes || 0} total mins
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-slate-900/60 border border-slate-800/80 backdrop-blur-sm">
          <div className="flex items-center justify-between text-slate-400 text-xs mb-1">
            <span>Win Rate</span>
            <Trophy className="w-4 h-4 text-amber-400" />
          </div>
          <div className="text-2xl font-bold text-slate-100">
            {stats?.positiveOutcomeRate || 0}%
          </div>
          <div className="text-[11px] text-slate-500 mt-1">Positive outcomes</div>
        </div>

        <div className="p-4 rounded-2xl bg-slate-900/60 border border-slate-800/80 backdrop-blur-sm">
          <div className="flex items-center justify-between text-slate-400 text-xs mb-1">
            <span>Avg Duration</span>
            <Clock className="w-4 h-4 text-cyan-400" />
          </div>
          <div className="text-2xl font-bold text-slate-100">
            {stats?.avgDurationMinutes || 0}m
          </div>
          <div className="text-[11px] text-slate-500 mt-1">Per completed call</div>
        </div>

        <div className="p-4 rounded-2xl bg-slate-900/60 border border-slate-800/80 backdrop-blur-sm">
          <div className="flex items-center justify-between text-slate-400 text-xs mb-1">
            <span>Missed / Action</span>
            <PhoneMissed className="w-4 h-4 text-rose-400" />
          </div>
          <div className="text-2xl font-bold text-rose-400">{stats?.missedCalls || 0}</div>
          <div className="text-[11px] text-slate-500 mt-1">Pending callback</div>
        </div>
      </div>

      {/* Tabs & View Modes */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 border-b border-slate-800/80 pb-3">
        <div className="flex items-center gap-1.5 overflow-x-auto pb-2 sm:pb-0">
          {[
            { id: 'ALL', label: 'All Calls', icon: PhoneCall },
            { id: 'TODAY_SCHEDULED', label: 'Scheduled Today', icon: Clock },
            { id: 'COMPLETED', label: 'Completed', icon: CheckCircle2 },
            { id: 'OUTBOUND', label: 'Outbound', icon: PhoneOutgoing },
            { id: 'INBOUND', label: 'Inbound', icon: PhoneIncoming },
            { id: 'MISSED', label: 'Missed & Follow-up', icon: PhoneMissed },
          ].map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => {
                  setActiveTab(tab.id as any);
                  setCurrentPage(0);
                }}
                className={`px-3.5 py-2 rounded-xl text-xs font-semibold flex items-center gap-2 whitespace-nowrap transition-all ${
                  isActive
                    ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/30'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>

        <div className="flex items-center gap-1 bg-slate-900 p-1 rounded-xl border border-slate-800 shrink-0 self-end sm:self-auto">
          <button
            onClick={() => setViewMode('grid')}
            className={`p-1.5 rounded-lg text-xs transition-colors ${
              viewMode === 'grid'
                ? 'bg-indigo-600/20 text-indigo-400 font-semibold'
                : 'text-slate-400 hover:text-slate-200'
            }`}
            title="Grid Cards"
          >
            <Grid className="w-4 h-4" />
          </button>
          <button
            onClick={() => setViewMode('table')}
            className={`p-1.5 rounded-lg text-xs transition-colors ${
              viewMode === 'table'
                ? 'bg-indigo-600/20 text-indigo-400 font-semibold'
                : 'text-slate-400 hover:text-slate-200'
            }`}
            title="Table View"
          >
            <List className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Search and Filters Bar */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-6 gap-3 p-4 rounded-2xl bg-slate-900/60 border border-slate-800/80">
        <div className="relative lg:col-span-2">
          <Search className="w-4 h-4 text-slate-500 absolute left-3.5 top-3" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search by call title, contact, phone, company..."
            className="w-full pl-9 pr-4 py-2 rounded-xl bg-slate-950/80 border border-slate-800 text-xs text-slate-200 placeholder-slate-500 focus:border-indigo-500"
          />
        </div>

        <div>
          <select
            value={selectedType}
            onChange={(e) => {
              setSelectedType(e.target.value as CallType);
              setCurrentPage(0);
            }}
            className="w-full px-3 py-2 rounded-xl bg-slate-950/80 border border-slate-800 text-xs text-slate-200"
          >
            <option value="">All Call Types</option>
            <option value="OUTBOUND">Outbound</option>
            <option value="INBOUND">Inbound</option>
          </select>
        </div>

        <div>
          <select
            value={selectedStatus}
            onChange={(e) => {
              setSelectedStatus(e.target.value as CallStatus);
              setCurrentPage(0);
            }}
            className="w-full px-3 py-2 rounded-xl bg-slate-950/80 border border-slate-800 text-xs text-slate-200"
          >
            <option value="">All Statuses</option>
            <option value="SCHEDULED">Scheduled</option>
            <option value="IN_PROGRESS">In Progress</option>
            <option value="COMPLETED">Completed</option>
            <option value="MISSED">Missed</option>
            <option value="BUSY">Line Busy</option>
            <option value="NO_ANSWER">No Answer</option>
            <option value="CANCELLED">Cancelled</option>
          </select>
        </div>

        <div>
          <select
            value={selectedPurpose}
            onChange={(e) => {
              setSelectedPurpose(e.target.value as CallPurpose);
              setCurrentPage(0);
            }}
            className="w-full px-3 py-2 rounded-xl bg-slate-950/80 border border-slate-800 text-xs text-slate-200"
          >
            <option value="">All Purposes</option>
            <option value="DISCOVERY">Discovery</option>
            <option value="PRODUCT_DEMO">Product Demo</option>
            <option value="PROSPECTING">Prospecting</option>
            <option value="FOLLOW_UP">Follow-Up</option>
            <option value="NEGOTIATION">Negotiation</option>
            <option value="SUPPORT">Support</option>
            <option value="ONBOARDING">Onboarding</option>
            <option value="CHECK_IN">Check-In</option>
            <option value="CLOSING">Closing</option>
          </select>
        </div>

        <div>
          <select
            value={selectedOutcome}
            onChange={(e) => {
              setSelectedOutcome(e.target.value as CallOutcome);
              setCurrentPage(0);
            }}
            className="w-full px-3 py-2 rounded-xl bg-slate-950/80 border border-slate-800 text-xs text-slate-200"
          >
            <option value="">All Outcomes</option>
            <option value="INTERESTED">Interested</option>
            <option value="MEETING_BOOKED">Meeting Booked</option>
            <option value="QUOTE_REQUESTED">Quote Requested</option>
            <option value="DEAL_CLOSED">Deal Closed</option>
            <option value="ISSUE_RESOLVED">Issue Resolved</option>
            <option value="CALLBACK_REQUESTED">Callback</option>
            <option value="LEFT_VOICEMAIL">Voicemail</option>
            <option value="NOT_INTERESTED">Not Interested</option>
          </select>
        </div>
      </div>

      {/* Main Content Area */}
      {loading ? (
        <div className="py-20 flex flex-col items-center justify-center gap-3">
          <div className="w-8 h-8 rounded-full border-2 border-indigo-500 border-t-transparent animate-spin" />
          <p className="text-xs text-slate-400">Loading call records & logs...</p>
        </div>
      ) : calls.length === 0 ? (
        <div className="py-16 text-center rounded-3xl bg-slate-900/30 border border-slate-800/60 p-8">
          <div className="w-14 h-14 mx-auto rounded-2xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400 mb-3">
            <PhoneCall className="w-7 h-7" />
          </div>
          <h3 className="text-base font-bold text-slate-200">No Call Logs Found</h3>
          <p className="text-xs text-slate-500 max-w-sm mx-auto mt-1">
            There are no calls matching your selected filter or search keyword. Schedule a new call or open the softphone.
          </p>
          <button
            onClick={() => setIsCreateOpen(true)}
            className="mt-4 px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold inline-flex items-center gap-1.5 shadow-lg shadow-indigo-600/30 transition-all"
          >
            <Plus className="w-3.5 h-3.5" />
            Schedule / Log First Call
          </button>
        </div>
      ) : viewMode === 'grid' ? (
        /* GRID CARDS VIEW */
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {calls.map((call) => (
            <div
              key={call.id}
              className="group p-5 rounded-2xl bg-slate-900/60 hover:bg-slate-900 border border-slate-800/80 hover:border-indigo-500/40 transition-all duration-200 shadow-sm flex flex-col justify-between"
            >
              <div>
                {/* Badges Top Bar */}
                <div className="flex items-center justify-between gap-2 mb-3">
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <CallStatusBadge status={call.status} />
                    <CallTypeBadge type={call.callType} />
                  </div>
                  <span className="text-[11px] font-mono text-slate-500">#{call.id}</span>
                </div>

                {/* Title */}
                <h3
                  onClick={() => {
                    setSelectedCall(call);
                    setIsDetailsOpen(true);
                  }}
                  className="text-sm font-bold text-slate-100 group-hover:text-indigo-300 transition-colors cursor-pointer line-clamp-1"
                  title={call.title}
                >
                  {call.title}
                </h3>

                {/* Purpose & Outcome */}
                <div className="flex items-center gap-2 mt-2 flex-wrap">
                  <CallPurposeBadge purpose={call.purpose} />
                  {call.outcome && <CallOutcomeBadge outcome={call.outcome} />}
                </div>

                {/* Contact & Account info */}
                <div className="mt-4 space-y-1.5 p-3 rounded-xl bg-slate-950/50 border border-slate-800/60 text-xs">
                  {call.contactName && (
                    <div className="flex items-center gap-2 text-slate-200">
                      <UserIcon className="w-3.5 h-3.5 text-slate-500" />
                      <span className="font-medium">{call.contactName}</span>
                    </div>
                  )}

                  {call.relatedToName && (
                    <div className="flex items-center gap-2 text-slate-400">
                      <Building2 className="w-3.5 h-3.5 text-slate-500" />
                      <span className="truncate">{call.relatedToName}</span>
                    </div>
                  )}

                  {/* Phone routing details */}
                  <div className="pt-1.5 border-t border-slate-800/40 space-y-1">
                    <div className="flex items-center justify-between text-[11px]">
                      <span className="text-slate-400">To:</span>
                      <span className="font-mono text-emerald-400 font-medium">
                        {call.contactPhone || 'No number'}
                      </span>
                    </div>
                    <div className="flex items-center justify-between text-[11px]">
                      <span className="text-slate-400">From (Your ID):</span>
                      <span className="font-mono text-indigo-300 font-medium">
                        {call.callerPhone || '+91 98765 43210'}
                      </span>
                    </div>
                    {call.contactPhone && (
                      <div className="pt-1 flex justify-end">
                        <button
                          onClick={() => handleQuickDial(call.contactPhone!, call.contactName || call.title)}
                          className="px-2.5 py-1 rounded-lg bg-sky-500/10 hover:bg-sky-500/20 text-sky-400 text-[11px] font-semibold flex items-center gap-1.5 transition-colors"
                        >
                          <PhoneOutgoing className="w-3 h-3" />
                          Direct Call
                        </button>
                      </div>
                    )}
                  </div>
                </div>

                {/* Notes Preview */}
                {call.notes && (
                  <p className="mt-3 text-xs text-slate-400 line-clamp-2 italic">
                    "{call.notes}"
                  </p>
                )}

                {/* Action Items */}
                {call.actionItems && (
                  <div className="mt-2.5 flex items-start gap-1.5 text-[11px] text-amber-300/90 bg-amber-500/5 p-2 rounded-lg border border-amber-500/15">
                    <CheckSquare className="w-3.5 h-3.5 text-amber-400 shrink-0 mt-0.5" />
                    <span className="line-clamp-1">{call.actionItems}</span>
                  </div>
                )}
              </div>

              {/* Bottom Footer Details & Actions */}
              <div className="mt-4 pt-3 border-t border-slate-800/60 flex items-center justify-between text-xs">
                <div className="text-[11px] text-slate-500 flex items-center gap-1">
                  <Calendar className="w-3.5 h-3.5 text-slate-500" />
                  <span>
                    {call.scheduledStartTime
                      ? new Date(call.scheduledStartTime).toLocaleDateString()
                      : new Date(call.createdAt).toLocaleDateString()}
                  </span>
                  {call.durationMinutes ? (
                    <span className="text-indigo-400 font-medium ml-1">
                      &bull; {call.durationMinutes}m
                    </span>
                  ) : null}
                </div>

                <div className="flex items-center gap-1.5">
                  {call.status !== 'COMPLETED' && (
                    <button
                      onClick={() => {
                        setSelectedCall(call);
                        setIsLogOutcomeOpen(true);
                      }}
                      className="px-2 py-1 rounded-lg bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 text-xs font-semibold transition-colors"
                    >
                      Outcome
                    </button>
                  )}
                  <button
                    onClick={() => {
                      setSelectedCall(call);
                      setIsDetailsOpen(true);
                    }}
                    className="p-1.5 rounded-lg text-slate-400 hover:text-slate-200 hover:bg-slate-800 transition-colors"
                    title="View Details"
                  >
                    <Eye className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => {
                      setSelectedCall(call);
                      setIsEditOpen(true);
                    }}
                    className="p-1.5 rounded-lg text-slate-400 hover:text-indigo-400 hover:bg-indigo-500/10 transition-colors"
                    title="Edit Call"
                  >
                    <Edit2 className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => {
                      setSelectedCall(call);
                      setIsDeleteOpen(true);
                    }}
                    className="p-1.5 rounded-lg text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 transition-colors"
                    title="Delete Call"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        /* TABLE VIEW */
        <div className="overflow-x-auto rounded-2xl bg-slate-900/60 border border-slate-800/80">
          <table className="w-full text-left text-xs text-slate-300">
            <thead className="bg-slate-950/80 text-slate-400 font-semibold uppercase tracking-wider border-b border-slate-800 text-[11px]">
              <tr>
                <th className="py-3.5 px-4">Subject & Direction</th>
                <th className="py-3.5 px-4">Contact & Account</th>
                <th className="py-3.5 px-4">Status & Outcome</th>
                <th className="py-3.5 px-4">Purpose</th>
                <th className="py-3.5 px-4">Date & Duration</th>
                <th className="py-3.5 px-4">Agent</th>
                <th className="py-3.5 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {calls.map((call) => (
                <tr key={call.id} className="hover:bg-slate-800/40 transition-colors">
                  <td className="py-3.5 px-4">
                    <div className="font-semibold text-slate-100 flex items-center gap-2">
                      <span>{call.title}</span>
                    </div>
                    <div className="mt-1">
                      <CallTypeBadge type={call.callType} />
                    </div>
                  </td>
                  <td className="py-3.5 px-4">
                    <div className="font-medium text-slate-200">{call.contactName || '-'}</div>
                    <div className="text-[11px] text-slate-500">
                      {call.relatedToName || call.relatedToType}
                    </div>
                    <div className="mt-1 space-y-0.5 font-mono text-[11px]">
                      {call.contactPhone && (
                        <div className="text-emerald-400">
                          <span className="text-slate-500 text-[10px]">To:</span> {call.contactPhone}
                        </div>
                      )}
                      <div className="text-indigo-300">
                        <span className="text-slate-500 text-[10px]">From:</span> {call.callerPhone || '+91 98765 43210'}
                      </div>
                    </div>
                  </td>
                  <td className="py-3.5 px-4">
                    <div className="space-y-1">
                      <CallStatusBadge status={call.status} />
                      {call.outcome && (
                        <div>
                          <CallOutcomeBadge outcome={call.outcome} />
                        </div>
                      )}
                    </div>
                  </td>
                  <td className="py-3.5 px-4">
                    <CallPurposeBadge purpose={call.purpose} />
                  </td>
                  <td className="py-3.5 px-4">
                    <div className="text-slate-200">
                      {call.scheduledStartTime
                        ? new Date(call.scheduledStartTime).toLocaleString()
                        : new Date(call.createdAt).toLocaleDateString()}
                    </div>
                    <div className="text-slate-500 text-[11px]">
                      {call.durationMinutes ? `${call.durationMinutes} mins` : '0 min'}
                    </div>
                  </td>
                  <td className="py-3.5 px-4 text-slate-300">
                    {call.assignedToUserName || 'Unassigned'}
                  </td>
                  <td className="py-3.5 px-4 text-right">
                    <div className="flex items-center justify-end gap-1.5">
                      {call.contactPhone && (
                        <button
                          onClick={() => handleQuickDial(call.contactPhone!, call.contactName || call.title)}
                          className="p-1.5 rounded-lg text-sky-400 hover:bg-sky-500/10 transition-colors"
                          title="Dial Call"
                        >
                          <PhoneOutgoing className="w-4 h-4" />
                        </button>
                      )}
                      {call.status !== 'COMPLETED' && (
                        <button
                          onClick={() => {
                            setSelectedCall(call);
                            setIsLogOutcomeOpen(true);
                          }}
                          className="p-1.5 rounded-lg text-emerald-400 hover:bg-emerald-500/10 transition-colors"
                          title="Log Outcome"
                        >
                          <CheckCircle2 className="w-4 h-4" />
                        </button>
                      )}
                      <button
                        onClick={() => {
                          setSelectedCall(call);
                          setIsDetailsOpen(true);
                        }}
                        className="p-1.5 rounded-lg text-slate-400 hover:text-slate-200 hover:bg-slate-800 transition-colors"
                        title="Details"
                      >
                        <Eye className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => {
                          setSelectedCall(call);
                          setIsEditOpen(true);
                        }}
                        className="p-1.5 rounded-lg text-slate-400 hover:text-indigo-400 hover:bg-indigo-500/10 transition-colors"
                        title="Edit"
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => {
                          setSelectedCall(call);
                          setIsDeleteOpen(true);
                        }}
                        className="p-1.5 rounded-lg text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 transition-colors"
                        title="Delete"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Pagination Controls */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between pt-4 border-t border-slate-800 text-xs text-slate-400">
          <div>
            Showing Page <strong className="text-slate-200">{currentPage + 1}</strong> of{' '}
            <strong className="text-slate-200">{totalPages}</strong> ({totalItems} total calls)
          </div>
          <div className="flex items-center gap-2">
            <button
              disabled={currentPage === 0}
              onClick={() => setCurrentPage((p) => Math.max(0, p - 1))}
              className="px-3 py-1.5 rounded-xl bg-slate-900 border border-slate-800 disabled:opacity-40 hover:bg-slate-800 text-slate-300 transition-colors"
            >
              Previous
            </button>
            <button
              disabled={currentPage >= totalPages - 1}
              onClick={() => setCurrentPage((p) => p + 1)}
              className="px-3 py-1.5 rounded-xl bg-slate-900 border border-slate-800 disabled:opacity-40 hover:bg-slate-800 text-slate-300 transition-colors"
            >
              Next
            </button>
          </div>
        </div>
      )}

      {/* Modals */}
      <CreateCallModal
        isOpen={isCreateOpen}
        onClose={() => setIsCreateOpen(false)}
        onSubmit={handleCreate}
        customers={customers}
        leads={leads}
        contacts={contacts}
        teamMembers={teamMembers}
      />

      <EditCallModal
        isOpen={isEditOpen}
        onClose={() => setIsEditOpen(false)}
        onSubmit={handleUpdate}
        call={selectedCall}
        customers={customers}
        leads={leads}
        contacts={contacts}
        teamMembers={teamMembers}
      />

      <LogOutcomeModal
        isOpen={isLogOutcomeOpen}
        onClose={() => setIsLogOutcomeOpen(false)}
        onSubmit={handleLogOutcome}
        call={selectedCall}
      />

      <CallDetailsModal
        isOpen={isDetailsOpen}
        onClose={() => setIsDetailsOpen(false)}
        call={selectedCall}
        onEdit={(call) => {
          setSelectedCall(call);
          setIsEditOpen(true);
        }}
        onDelete={(call) => {
          setSelectedCall(call);
          setIsDeleteOpen(true);
        }}
        onLogOutcome={(call) => {
          setSelectedCall(call);
          setIsLogOutcomeOpen(true);
        }}
        onDial={handleQuickDial}
      />

      <DeleteCallModal
        isOpen={isDeleteOpen}
        onClose={() => setIsDeleteOpen(false)}
        onConfirm={handleDelete}
        call={selectedCall}
      />

      <ActiveDialerModal
        isOpen={isDialerOpen}
        onClose={() => setIsDialerOpen(false)}
        initialPhone={dialerPhone}
        initialName={dialerName}
        customers={customers}
        leads={leads}
        contacts={contacts}
        onCallEnded={handleCreate}
      />

      <CallerIdSettingsModal
        isOpen={isCallerIdModalOpen}
        onClose={() => setIsCallerIdModalOpen(false)}
        onSaved={(newNum) => setCallerIdNumber(newNum)}
      />
    </div>
  );
};
