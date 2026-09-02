import React, { useState, useEffect, useRef } from 'react';
import {
  Calendar as CalendarIcon,
  Clock,
  Video,
  User,
  Plus,
  Search,
  Filter,
  CheckCircle,
  ChevronLeft,
  ChevronRight,
  TrendingUp,
  Settings,
  X,
  RotateCcw,
  CalendarDays,
  SlidersHorizontal,
  Download,
  UploadCloud,
  FileSpreadsheet,
  ChevronDown,
  RefreshCw,
} from 'lucide-react';
import { triggerRefreshBlink } from '../components/common/RefreshFeedbackOverlay';
import { appointmentApi } from '../api/appointmentApi';
import {
  Appointment,
  AppointmentStats,
} from '../types/appointment';
import { useAuth } from '../context/AuthContext';
import { ScheduleAppointmentModal } from '../components/appointment/ScheduleAppointmentModal';
import { AppointmentDetailsModal } from '../components/appointment/AppointmentDetailsModal';
import { IntegrationSettingsModal } from '../components/appointment/IntegrationSettingsModal';
import { ImportAppointmentsModal } from '../components/appointment/ImportAppointmentsModal';

export const AppointmentManagement: React.FC = () => {
  const { isAdmin, isManager } = useAuth();
  const [viewMode, setViewMode] = useState<'LIST' | 'CALENDAR'>('CALENDAR');
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [stats, setStats] = useState<AppointmentStats | null>(null);
  const [loading, setLoading] = useState(true);

  // Filters & Search
  const [search, setSearch] = useState('');
  const [selectedStatus, setSelectedStatus] = useState<string>('ALL');
  const [selectedType, setSelectedType] = useState<string>('ALL');
  const [selectedMode, setSelectedMode] = useState<string>('ALL');
  const [selectedEntity, setSelectedEntity] = useState<string>('ALL');
  const [dateRangePreset, setDateRangePreset] = useState<'ALL_TIME' | 'TODAY' | 'UPCOMING_7_DAYS' | 'THIS_MONTH' | 'CUSTOM'>('ALL_TIME');
  const [customStartDate, setCustomStartDate] = useState('');
  const [customEndDate, setCustomEndDate] = useState('');

  // Calendar State
  const [currentDate, setCurrentDate] = useState(new Date());

  // Modals & Popovers
  const [isScheduleModalOpen, setIsScheduleModalOpen] = useState(false);
  const [selectedAppointment, setSelectedAppointment] = useState<Appointment | null>(null);
  const [isDetailsModalOpen, setIsDetailsModalOpen] = useState(false);
  const [isIntegrationModalOpen, setIsIntegrationModalOpen] = useState(false);
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  const [isExportDropdownOpen, setIsExportDropdownOpen] = useState(false);
  const exportDropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (exportDropdownRef.current && !exportDropdownRef.current.contains(e.target as Node)) {
        setIsExportDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const getActiveFiltersCount = () => {
    let count = 0;
    if (search.trim()) count++;
    if (selectedStatus !== 'ALL') count++;
    if (selectedType !== 'ALL') count++;
    if (selectedMode !== 'ALL') count++;
    if (selectedEntity !== 'ALL') count++;
    if (dateRangePreset !== 'ALL_TIME') count++;
    if (customStartDate || customEndDate) count++;
    return count;
  };

  const handleResetFilters = () => {
    setSearch('');
    setSelectedStatus('ALL');
    setSelectedType('ALL');
    setSelectedMode('ALL');
    setSelectedEntity('ALL');
    setDateRangePreset('ALL_TIME');
    setCustomStartDate('');
    setCustomEndDate('');
  };

  const calculateDateRange = () => {
    const now = new Date();
    if (dateRangePreset === 'TODAY') {
      const start = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0);
      const end = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59);
      return { start: start.toISOString(), end: end.toISOString() };
    }
    if (dateRangePreset === 'UPCOMING_7_DAYS') {
      const start = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0);
      const end = new Date(now.getTime() + 7 * 86400000);
      return { start: start.toISOString(), end: end.toISOString() };
    }
    if (dateRangePreset === 'THIS_MONTH') {
      const start = new Date(now.getFullYear(), now.getMonth(), 1, 0, 0, 0);
      const end = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59);
      return { start: start.toISOString(), end: end.toISOString() };
    }
    if (dateRangePreset === 'CUSTOM') {
      return {
        start: customStartDate ? new Date(customStartDate).toISOString() : undefined,
        end: customEndDate ? new Date(customEndDate).toISOString() : undefined,
      };
    }
    return { start: undefined, end: undefined };
  };

  const fetchData = async () => {
    try {
      setLoading(true);
      const { start, end } = calculateDateRange();

      const [apptsRes, statsRes] = await Promise.all([
        appointmentApi.getAppointments({
          status: selectedStatus !== 'ALL' ? (selectedStatus as any) : undefined,
          meetingType: selectedType !== 'ALL' ? (selectedType as any) : undefined,
          meetingMode: selectedMode !== 'ALL' ? (selectedMode as any) : undefined,
          entityType: selectedEntity !== 'ALL' ? (selectedEntity as any) : undefined,
          startDate: start,
          endDate: end,
          search: search.trim() || undefined,
          size: 150,
        }),
        appointmentApi.getStats(),
      ]);

      setAppointments(apptsRes.data || []);
      setStats(statsRes);
    } catch (err) {
      console.error('Failed to load appointments:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [selectedStatus, selectedType, selectedMode, selectedEntity, dateRangePreset, customStartDate, customEndDate]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    fetchData();
  };

  const handleScheduleSubmit = async (payload: any) => {
    await appointmentApi.createAppointment(payload);
    await fetchData();
  };

  const handleReschedule = async (id: number, payload: any) => {
    await appointmentApi.rescheduleAppointment(id, payload);
    await fetchData();
  };

  const handleComplete = async (id: number, payload: any) => {
    await appointmentApi.completeAppointment(id, payload);
    await fetchData();
  };

  const handleCancel = async (id: number, reason: string) => {
    await appointmentApi.cancelAppointment(id, reason);
    await fetchData();
  };

  const handleExportCsv = async () => {
    try {
      const { start, end } = calculateDateRange();
      const csv = await appointmentApi.exportCsv({
        status: selectedStatus !== 'ALL' ? (selectedStatus as any) : undefined,
        meetingType: selectedType !== 'ALL' ? (selectedType as any) : undefined,
        meetingMode: selectedMode !== 'ALL' ? (selectedMode as any) : undefined,
        entityType: selectedEntity !== 'ALL' ? (selectedEntity as any) : undefined,
        startDate: start,
        endDate: end,
        search: search.trim() || undefined,
      });
      const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', 'crm_scheduled_appointments.csv');
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      setIsExportDropdownOpen(false);
    } catch (err: any) {
      console.error('Failed to export CSV:', err);
    }
  };

  const handleExportIcs = async () => {
    try {
      const { start, end } = calculateDateRange();
      const ics = await appointmentApi.exportIcs({
        status: selectedStatus !== 'ALL' ? (selectedStatus as any) : undefined,
        meetingType: selectedType !== 'ALL' ? (selectedType as any) : undefined,
        meetingMode: selectedMode !== 'ALL' ? (selectedMode as any) : undefined,
        entityType: selectedEntity !== 'ALL' ? (selectedEntity as any) : undefined,
        startDate: start,
        endDate: end,
        search: search.trim() || undefined,
      });
      const blob = new Blob([ics], { type: 'text/calendar;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', 'crm_calendar_feed.ics');
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      setIsExportDropdownOpen(false);
    } catch (err: any) {
      console.error('Failed to export iCal:', err);
    }
  };

  const handleExportJson = () => {
    const blob = new Blob([JSON.stringify(appointments, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', 'crm_appointments.json');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    setIsExportDropdownOpen(false);
  };

  const handleDelete = async (id: number) => {
    await appointmentApi.deleteAppointment(id);
    await fetchData();
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'COMPLETED':
        return 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40';
      case 'SCHEDULED':
      case 'CONFIRMED':
        return 'bg-indigo-500/20 text-indigo-300 border-indigo-500/40';
      case 'RESCHEDULED':
        return 'bg-amber-500/20 text-amber-300 border-amber-500/40';
      case 'CANCELLED':
        return 'bg-rose-500/20 text-rose-300 border-rose-500/40';
      case 'NO_SHOW':
        return 'bg-slate-700 text-slate-300 border-slate-600';
      default:
        return 'bg-slate-800 text-slate-400 border-slate-700';
    }
  };

  // Calendar Helpers
  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();
  const firstDay = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];

  const prevMonth = () => setCurrentDate(new Date(year, month - 1, 1));
  const nextMonth = () => setCurrentDate(new Date(year, month + 1, 1));

  const getAppointmentsForDay = (day: number) => {
    return appointments.filter((a) => {
      const d = new Date(a.startTime);
      return d.getFullYear() === year && d.getMonth() === month && d.getDate() === day;
    });
  };

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header & Main Actions */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white tracking-tight flex items-center space-x-2.5">
            <span className="p-2 bg-gradient-to-tr from-indigo-500 to-purple-600 rounded-xl shadow-lg">
              <CalendarIcon className="w-6 h-6 text-white" />
            </span>
            <span>Appointments & Meetings</span>
          </h1>
          <p className="text-sm text-slate-400 mt-1">
            Enterprise scheduling calendar, Google Meet / Zoom virtual rooms, and customer interactions
          </p>
        </div>

        <div className="flex items-center space-x-2.5 flex-wrap">
          {/* Refresh Button */}
          <button
            onClick={() => {
              fetchData();
              triggerRefreshBlink('Appointments refreshed');
            }}
            disabled={loading}
            title="Refresh Appointments"
            className="flex items-center space-x-1.5 px-3 py-2 bg-slate-800/80 hover:bg-slate-700 border border-slate-700/80 text-slate-300 hover:text-white rounded-xl text-xs font-semibold transition-all shadow-sm disabled:opacity-50"
          >
            <RefreshCw className={`w-3.5 h-3.5 text-indigo-400 ${loading ? 'animate-spin' : ''}`} />
            <span>Refresh</span>
          </button>

          {/* Export Dropdown */}
          <div className="relative" ref={exportDropdownRef}>
            <button
              onClick={() => setIsExportDropdownOpen(!isExportDropdownOpen)}
              className="flex items-center space-x-1.5 px-3 py-2 bg-slate-800/80 hover:bg-slate-700 border border-slate-700/80 text-slate-300 hover:text-white rounded-xl text-xs font-semibold transition-all shadow-sm"
              title="Export filtered appointments"
            >
              <Download className="w-4 h-4 text-emerald-400" />
              <span>Export</span>
              <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
            </button>

            {isExportDropdownOpen && (
              <div className="absolute left-0 mt-2 w-48 bg-slate-900 border border-slate-700/80 rounded-xl shadow-2xl z-50 p-1.5 space-y-1 animate-in fade-in zoom-in-95 duration-100">
                <button
                  onClick={handleExportCsv}
                  className="w-full flex items-center space-x-2 px-3 py-2 text-left text-xs text-slate-300 hover:text-white hover:bg-slate-800 rounded-lg transition"
                >
                  <FileSpreadsheet className="w-4 h-4 text-emerald-400" />
                  <span>Export as CSV</span>
                </button>
                <button
                  onClick={handleExportIcs}
                  className="w-full flex items-center space-x-2 px-3 py-2 text-left text-xs text-slate-300 hover:text-white hover:bg-slate-800 rounded-lg transition"
                >
                  <CalendarDays className="w-4 h-4 text-purple-400" />
                  <span>Export iCal (.ics)</span>
                </button>
                <button
                  onClick={handleExportJson}
                  className="w-full flex items-center space-x-2 px-3 py-2 text-left text-xs text-slate-300 hover:text-white hover:bg-slate-800 rounded-lg transition"
                >
                  <Download className="w-4 h-4 text-sky-400" />
                  <span>Export JSON</span>
                </button>
              </div>
            )}
          </div>

          {/* Import Button */}
          <button
            onClick={() => setIsImportModalOpen(true)}
            className="flex items-center space-x-1.5 px-3 py-2 bg-slate-800/80 hover:bg-slate-700 border border-slate-700/80 text-slate-300 hover:text-white rounded-xl text-xs font-semibold transition-all shadow-sm"
            title="Bulk import appointments from CSV"
          >
            <UploadCloud className="w-4 h-4 text-indigo-400" />
            <span>Import CSV</span>
          </button>

          {/* Video & APIs */}
          <button
            onClick={() => setIsIntegrationModalOpen(true)}
            className="flex items-center space-x-1.5 px-3 py-2 bg-slate-800/80 hover:bg-slate-700 border border-slate-700/80 text-slate-300 hover:text-white rounded-xl text-xs font-semibold transition-all shadow-sm"
            title="Configure Video Conferencing & Calendar APIs"
          >
            <Settings className="w-4 h-4 text-purple-400" />
            <span>Video & APIs</span>
          </button>

          {/* View Mode Toggle */}
          <div className="flex items-center space-x-1 bg-slate-800/80 p-1 rounded-xl border border-slate-700/60">
            <button
              onClick={() => setViewMode('CALENDAR')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                viewMode === 'CALENDAR'
                  ? 'bg-gradient-to-r from-indigo-500 to-purple-600 text-white shadow'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              Calendar Schedule
            </button>
            <button
              onClick={() => setViewMode('LIST')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                viewMode === 'LIST'
                  ? 'bg-gradient-to-r from-indigo-500 to-purple-600 text-white shadow'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              List View
            </button>
          </div>

          {/* Schedule Meeting Button */}
          <button
            onClick={() => setIsScheduleModalOpen(true)}
            className="flex items-center space-x-2 px-4 py-2.5 bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 text-white text-sm font-semibold rounded-xl shadow-lg shadow-indigo-500/25 transition-all"
          >
            <Plus className="w-4 h-4" />
            <span>Schedule Meeting</span>
          </button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-4 bg-slate-900/60 border border-slate-800 rounded-2xl backdrop-blur-xl flex items-center space-x-4">
          <div className="p-3 bg-indigo-500/10 border border-indigo-500/20 rounded-xl text-indigo-400">
            <CalendarIcon className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center space-x-1.5">
              <p className="text-xs font-medium text-slate-400 uppercase tracking-wider">Upcoming</p>
              <span className="text-[10px] text-indigo-400/80 font-medium">
                {isAdmin ? '🌐 Global' : isManager ? '👥 Team' : '👤 Personal'}
              </span>
            </div>
            <p className="text-2xl font-bold text-white mt-0.5">{stats?.scheduledUpcoming ?? '-'}</p>
          </div>
        </div>

        <div className="p-4 bg-slate-900/60 border border-slate-800 rounded-2xl backdrop-blur-xl flex items-center space-x-4">
          <div className="p-3 bg-emerald-500/10 border border-emerald-500/20 rounded-xl text-emerald-400">
            <CheckCircle className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center space-x-1.5">
              <p className="text-xs font-medium text-slate-400 uppercase tracking-wider">Completed</p>
              <span className="text-[10px] text-emerald-400/80 font-medium">
                {isAdmin ? '🌐 Global' : isManager ? '👥 Team' : '👤 Personal'}
              </span>
            </div>
            <p className="text-2xl font-bold text-white mt-0.5">{stats?.completedCount ?? '-'}</p>
          </div>
        </div>

        <div className="p-4 bg-slate-900/60 border border-slate-800 rounded-2xl backdrop-blur-xl flex items-center space-x-4">
          <div className="p-3 bg-purple-500/10 border border-purple-500/20 rounded-xl text-purple-400">
            <Clock className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center space-x-1.5">
              <p className="text-xs font-medium text-slate-400 uppercase tracking-wider">Today&apos;s Calls</p>
              <span className="text-[10px] text-purple-400/80 font-medium">
                {isAdmin ? '🌐 Global' : isManager ? '👥 Team' : '👤 Personal'}
              </span>
            </div>
            <p className="text-2xl font-bold text-white mt-0.5">{stats?.todayAppointments ?? '-'}</p>
          </div>
        </div>

        <div className="p-4 bg-slate-900/60 border border-slate-800 rounded-2xl backdrop-blur-xl flex items-center space-x-4">
          <div className="p-3 bg-amber-500/10 border border-amber-500/20 rounded-xl text-amber-400">
            <TrendingUp className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center space-x-1.5">
              <p className="text-xs font-medium text-slate-400 uppercase tracking-wider">Show-up Rate</p>
              <span className="text-[10px] text-amber-400/80 font-medium">
                {isAdmin ? '🌐 Global' : isManager ? '👥 Team' : '👤 Personal'}
              </span>
            </div>
            <p className="text-2xl font-bold text-white mt-0.5">
              {stats?.showUpRatePercent !== undefined ? `${stats.showUpRatePercent}%` : '-'}
            </p>
          </div>
        </div>
      </div>

      {/* Filter & Search Control Panel */}
      <div className="p-4 bg-slate-900/80 border border-slate-800 rounded-2xl backdrop-blur-xl space-y-3.5">
        {/* Row 1: Search + Quick Date Presets + Reset Button */}
        <div className="flex flex-wrap items-center justify-between gap-3">
          <form onSubmit={handleSearchSubmit} className="flex-1 min-w-[260px] max-w-lg">
            <div className="relative">
              <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                placeholder="Search meetings, attendees, email, phone, location, agenda..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-10 pr-10 py-2.5 bg-slate-800/80 border border-slate-700 rounded-xl text-white placeholder-slate-500 text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500/50"
              />
              {search && (
                <button
                  type="button"
                  onClick={() => setSearch('')}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white p-0.5 rounded-full hover:bg-slate-700"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          </form>

          {/* Date Range Presets */}
          <div className="flex items-center gap-1.5 flex-wrap text-xs">
            <span className="text-slate-400 font-medium flex items-center space-x-1 mr-1">
              <CalendarDays className="w-3.5 h-3.5 text-indigo-400" />
              <span className="hidden sm:inline">Timeline:</span>
            </span>
            {(['ALL_TIME', 'TODAY', 'UPCOMING_7_DAYS', 'THIS_MONTH', 'CUSTOM'] as const).map((preset) => (
              <button
                key={preset}
                onClick={() => setDateRangePreset(preset)}
                className={`px-2.5 py-1 rounded-lg border transition-all ${
                  dateRangePreset === preset
                    ? 'bg-indigo-600 border-indigo-500 text-white font-bold shadow-sm shadow-indigo-600/30'
                    : 'bg-slate-800/50 border-slate-700/60 text-slate-400 hover:text-white hover:bg-slate-800'
                }`}
              >
                {preset === 'ALL_TIME' && 'All Time'}
                {preset === 'TODAY' && 'Today'}
                {preset === 'UPCOMING_7_DAYS' && 'Next 7 Days'}
                {preset === 'THIS_MONTH' && 'This Month'}
                {preset === 'CUSTOM' && 'Custom Range 📅'}
              </button>
            ))}

            {/* Reset All Filters Button */}
            {getActiveFiltersCount() > 0 && (
              <button
                onClick={handleResetFilters}
                className="flex items-center space-x-1 px-3 py-1 bg-rose-500/10 hover:bg-rose-500/20 text-rose-300 border border-rose-500/30 rounded-lg text-xs font-semibold transition ml-auto"
                title="Reset all filters and search query"
              >
                <RotateCcw className="w-3 h-3" />
                <span>Reset ({getActiveFiltersCount()})</span>
              </button>
            )}
          </div>
        </div>

        {/* Row 2: Secondary Dropdown Filters + Custom Date Pickers */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-2.5 pt-2 border-t border-slate-800/60 text-xs">
          {/* Status Filter */}
          <div>
            <label className="block text-[11px] font-medium text-slate-400 mb-1 flex items-center space-x-1">
              <Filter className="w-3 h-3 text-indigo-400" />
              <span>Status</span>
            </label>
            <select
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
              className="w-full px-2.5 py-1.5 bg-slate-800 border border-slate-700 rounded-lg text-white text-xs focus:outline-none focus:ring-1 focus:ring-indigo-500"
            >
              <option value="ALL">All Statuses</option>
              <option value="SCHEDULED">Scheduled</option>
              <option value="CONFIRMED">Confirmed</option>
              <option value="COMPLETED">Completed</option>
              <option value="RESCHEDULED">Rescheduled</option>
              <option value="CANCELLED">Cancelled</option>
              <option value="NO_SHOW">No-Show</option>
            </select>
          </div>

          {/* Meeting Type Filter */}
          <div>
            <label className="block text-[11px] font-medium text-slate-400 mb-1 flex items-center space-x-1">
              <SlidersHorizontal className="w-3 h-3 text-purple-400" />
              <span>Meeting Purpose</span>
            </label>
            <select
              value={selectedType}
              onChange={(e) => setSelectedType(e.target.value)}
              className="w-full px-2.5 py-1.5 bg-slate-800 border border-slate-700 rounded-lg text-white text-xs focus:outline-none focus:ring-1 focus:ring-purple-500"
            >
              <option value="ALL">All Meeting Types</option>
              <option value="PRODUCT_DEMO">Product Demo</option>
              <option value="DISCOVERY_CALL">Discovery Call</option>
              <option value="PROPOSAL_REVIEW">Proposal Review</option>
              <option value="NEGOTIATION">Negotiation</option>
              <option value="EXECUTIVE_SPONSOR">Executive Sponsor</option>
              <option value="ONBOARDING">Customer Onboarding</option>
              <option value="ACCOUNT_REVIEW">Quarterly Review (QBR)</option>
            </select>
          </div>

          {/* Meeting Mode Filter */}
          <div>
            <label className="block text-[11px] font-medium text-slate-400 mb-1 flex items-center space-x-1">
              <Video className="w-3 h-3 text-sky-400" />
              <span>Meeting Channel</span>
            </label>
            <select
              value={selectedMode}
              onChange={(e) => setSelectedMode(e.target.value)}
              className="w-full px-2.5 py-1.5 bg-slate-800 border border-slate-700 rounded-lg text-white text-xs focus:outline-none focus:ring-1 focus:ring-sky-500"
            >
              <option value="ALL">All Channels</option>
              <option value="VIRTUAL_GOOGLE_MEET">Google Meet 📹</option>
              <option value="VIRTUAL_ZOOM">Zoom 📹</option>
              <option value="VIRTUAL_MS_TEAMS">MS Teams 📹</option>
              <option value="IN_PERSON_OFFICE">In-Person Office 🏢</option>
              <option value="CLIENT_SITE">Client Site 🚗</option>
              <option value="PHONE_CALL">Phone Call 📞</option>
            </select>
          </div>

          {/* Entity Linkage Filter */}
          <div>
            <label className="block text-[11px] font-medium text-slate-400 mb-1 flex items-center space-x-1">
              <User className="w-3 h-3 text-emerald-400" />
              <span>Attached Entity</span>
            </label>
            <select
              value={selectedEntity}
              onChange={(e) => setSelectedEntity(e.target.value)}
              className="w-full px-2.5 py-1.5 bg-slate-800 border border-slate-700 rounded-lg text-white text-xs focus:outline-none focus:ring-1 focus:ring-emerald-500"
            >
              <option value="ALL">All Entities</option>
              <option value="DEAL">Deals & Opportunities</option>
              <option value="LEAD">Leads & Prospects</option>
              <option value="CUSTOMER">Customer Accounts</option>
              <option value="GENERAL">General Meetings</option>
            </select>
          </div>
        </div>

        {/* Optional Custom Date Range Inputs */}
        {dateRangePreset === 'CUSTOM' && (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2 border-t border-slate-800/60 text-xs animate-in fade-in">
            <div>
              <label className="block text-[11px] font-medium text-slate-400 mb-1">Custom Start Date</label>
              <input
                type="date"
                value={customStartDate}
                onChange={(e) => setCustomStartDate(e.target.value)}
                className="w-full px-3 py-1.5 bg-slate-800 border border-slate-700 rounded-lg text-white text-xs focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-[11px] font-medium text-slate-400 mb-1">Custom End Date</label>
              <input
                type="date"
                value={customEndDate}
                onChange={(e) => setCustomEndDate(e.target.value)}
                className="w-full px-3 py-1.5 bg-slate-800 border border-slate-700 rounded-lg text-white text-xs focus:outline-none"
              />
            </div>
          </div>
        )}
      </div>

      {/* Calendar View */}
      {viewMode === 'CALENDAR' ? (
        <div className="p-6 bg-slate-900/70 border border-slate-800 rounded-2xl backdrop-blur-xl space-y-4">
          {/* Month Navigator */}
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-bold text-white flex items-center space-x-2">
              <span>{monthNames[month]} {year}</span>
            </h2>
            <div className="flex items-center space-x-1.5">
              <button
                onClick={prevMonth}
                className="p-2 bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-300 hover:text-white rounded-xl transition-colors"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <button
                onClick={() => setCurrentDate(new Date())}
                className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-300 text-xs font-semibold rounded-xl"
              >
                Today
              </button>
              <button
                onClick={nextMonth}
                className="p-2 bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-300 hover:text-white rounded-xl transition-colors"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Days Grid */}
          <div className="grid grid-cols-7 gap-2">
            {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((d) => (
              <div key={d} className="text-center text-xs font-semibold text-slate-400 py-2">
                {d}
              </div>
            ))}

            {/* Empty slots for starting offset */}
            {Array.from({ length: firstDay }).map((_, idx) => (
              <div key={`empty-${idx}`} className="min-h-[100px] p-2 bg-slate-900/30 rounded-xl border border-slate-800/40 opacity-40" />
            ))}

            {/* Days in Month */}
            {Array.from({ length: daysInMonth }).map((_, idx) => {
              const day = idx + 1;
              const dayAppts = getAppointmentsForDay(day);
              const isToday =
                new Date().getDate() === day &&
                new Date().getMonth() === month &&
                new Date().getFullYear() === year;

              return (
                <div
                  key={`day-${day}`}
                  className={`min-h-[105px] p-2 bg-slate-800/30 hover:bg-slate-800/60 border rounded-xl transition-all flex flex-col justify-between group ${
                    isToday ? 'border-indigo-500 bg-indigo-950/20' : 'border-slate-800/80'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span
                      className={`text-xs font-bold w-6 h-6 flex items-center justify-center rounded-full ${
                        isToday ? 'bg-indigo-600 text-white' : 'text-slate-400'
                      }`}
                    >
                      {day}
                    </span>
                    {dayAppts.length > 0 && (
                      <span className="text-[10px] text-slate-500 font-semibold">
                        {dayAppts.length} {dayAppts.length === 1 ? 'call' : 'calls'}
                      </span>
                    )}
                  </div>

                  {/* Appointments chips */}
                  <div className="space-y-1 mt-1 overflow-y-auto max-h-[80px]">
                    {dayAppts.map((appt) => (
                      <button
                        key={appt.id}
                        onClick={() => {
                          setSelectedAppointment(appt);
                          setIsDetailsModalOpen(true);
                        }}
                        className={`w-full text-left px-2 py-1 rounded-md text-[10px] font-medium border truncate transition-all ${getStatusBadge(
                          appt.status
                        )} hover:scale-[1.02] shadow-sm`}
                      >
                        <span className="font-bold mr-1">
                          {new Date(appt.startTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </span>
                        <span>{appt.title}</span>
                      </button>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      ) : (
        /* List View */
        <div className="space-y-3">
          {loading ? (
            <div className="py-16 text-center text-slate-500 text-sm animate-pulse">
              Loading appointments...
            </div>
          ) : appointments.length === 0 ? (
            <div className="p-12 text-center bg-slate-900/40 border border-slate-800/80 rounded-2xl">
              <CalendarIcon className="w-10 h-10 text-slate-600 mx-auto mb-3" />
              <h3 className="text-base font-semibold text-white">No Appointments Found</h3>
              <p className="text-xs text-slate-400 mt-1 max-w-sm mx-auto">
                Schedule your next client presentation, product demo, or executive review call.
              </p>
              <button
                onClick={() => setIsScheduleModalOpen(true)}
                className="mt-4 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold rounded-xl shadow transition-all"
              >
                + Schedule First Meeting
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {appointments.map((appt) => (
                <div
                  key={appt.id}
                  onClick={() => {
                    setSelectedAppointment(appt);
                    setIsDetailsModalOpen(true);
                  }}
                  className="p-5 bg-slate-900/60 hover:bg-slate-900/90 border border-slate-800 hover:border-slate-700/80 rounded-2xl backdrop-blur-xl transition-all cursor-pointer group shadow-sm flex flex-col justify-between space-y-4"
                >
                  <div>
                    <div className="flex items-start justify-between gap-2">
                      <span className={`px-2 py-0.5 rounded-md text-[10px] font-bold border ${getStatusBadge(appt.status)}`}>
                        {appt.status}
                      </span>
                      <span className="text-[11px] text-slate-400 font-medium">
                        {appt.meetingType.replace(/_/g, ' ')}
                      </span>
                    </div>

                    <h3 className="text-sm font-bold text-white mt-2 group-hover:text-indigo-400 transition-colors line-clamp-1">
                      {appt.title}
                    </h3>

                    <div className="mt-3 space-y-1.5 text-xs text-slate-300">
                      <p className="flex items-center space-x-2 text-slate-300">
                        <Clock className="w-3.5 h-3.5 text-indigo-400 shrink-0" />
                        <span>
                          {new Date(appt.startTime).toLocaleString([], {
                            dateStyle: 'medium',
                            timeStyle: 'short',
                          })}{' '}
                          ({appt.durationMinutes}m)
                        </span>
                      </p>

                      <p className="flex items-center space-x-2 text-slate-300">
                        <User className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                        <span className="font-semibold text-white truncate">{appt.attendeeName}</span>
                        <span className="text-[11px] text-slate-400 truncate">({appt.attendeeEmail})</span>
                      </p>

                      {appt.meetingLink && (
                        <p className="flex items-center space-x-2 text-indigo-300 truncate">
                          <Video className="w-3.5 h-3.5 text-purple-400 shrink-0" />
                          <span className="truncate">{appt.meetingMode.replace(/_/g, ' ')}</span>
                        </p>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center justify-between pt-3 border-t border-slate-800/80 text-[11px] text-slate-500">
                    <span>Host: {appt.organizerName}</span>
                    {appt.entityTitle && (
                      <span className="px-2 py-0.5 bg-slate-800 rounded text-slate-400 truncate max-w-[120px]">
                        {appt.entityTitle}
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Modals */}
      <ScheduleAppointmentModal
        isOpen={isScheduleModalOpen}
        onClose={() => setIsScheduleModalOpen(false)}
        onSubmit={handleScheduleSubmit}
      />

      <AppointmentDetailsModal
        isOpen={isDetailsModalOpen}
        appointment={selectedAppointment}
        onClose={() => {
          setIsDetailsModalOpen(false);
          setSelectedAppointment(null);
        }}
        onReschedule={handleReschedule}
        onComplete={handleComplete}
        onCancel={handleCancel}
        onDelete={handleDelete}
      />

      <IntegrationSettingsModal
        isOpen={isIntegrationModalOpen}
        onClose={() => setIsIntegrationModalOpen(false)}
      />

      <ImportAppointmentsModal
        isOpen={isImportModalOpen}
        onClose={() => setIsImportModalOpen(false)}
        onSuccess={fetchData}
      />
    </div>
  );
};
