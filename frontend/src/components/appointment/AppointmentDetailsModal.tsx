import { ModalPortal } from '../ModalPortal';
import React, { useState } from 'react';
import {
  X,
  Calendar,
  Clock,
  Video,
  MapPin,
  User,
  Mail,
  Phone,
  CheckCircle,
  AlertTriangle,
  RotateCcw,
  ExternalLink,
  Trash2,
  Sparkles,
  Bell,
  Check,
  Download,
} from 'lucide-react';
import {
  Appointment,
  ReschedulePayload,
  CompletePayload,
} from '../../types/appointment';
import { useAuth } from '../../context/AuthContext';
import { notificationService } from '../../services/notificationService';
import { appointmentApi } from '../../api/appointmentApi';

interface AppointmentDetailsModalProps {
  isOpen: boolean;
  appointment: Appointment | null;
  onClose: () => void;
  onReschedule: (id: number, payload: ReschedulePayload) => Promise<void>;
  onComplete: (id: number, payload: CompletePayload) => Promise<void>;
  onCancel: (id: number, reason: string) => Promise<void>;
  onDelete: (id: number) => Promise<void>;
}

export const AppointmentDetailsModal: React.FC<AppointmentDetailsModalProps> = ({
  isOpen,
  appointment,
  onClose,
  onReschedule,
  onComplete,
  onCancel,
  onDelete,
}) => {
  const { user, isAdmin, isManager } = useAuth();
  const [viewMode, setViewMode] = useState<'DETAILS' | 'COMPLETE' | 'RESCHEDULE' | 'CANCEL'>('DETAILS');
  const [loading, setLoading] = useState(false);
  const [reminderLoading, setReminderLoading] = useState(false);
  const [reminderSuccess, setReminderSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const getLocalDatetimeString = (date: Date = new Date()) => {
    const pad = (n: number) => n.toString().padStart(2, '0');
    return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
  };

  const getMinDateTime = () => getLocalDatetimeString(new Date());

  // Complete Form State
  const [outcomeNotes, setOutcomeNotes] = useState('');
  const [actionItems, setActionItems] = useState('');
  const [recordingUrl, setRecordingUrl] = useState('');
  const [isNoShow, setIsNoShow] = useState(false);

  // Reschedule Form State
  const [newStartTime, setNewStartTime] = useState('');
  const [newDuration, setNewDuration] = useState(30);
  const [rescheduleReason, setRescheduleReason] = useState('');

  // Cancel Form State
  const [cancelReason, setCancelReason] = useState('');

  const handleSendInstantReminder = async () => {
    if (!appointment) return;
    setReminderLoading(true);
    setReminderSuccess(false);
    setError(null);
    try {
      await notificationService.triggerInstantReminder(appointment.id);
      setReminderSuccess(true);
      setTimeout(() => setReminderSuccess(false), 5000);
    } catch (err: any) {
      setError(err?.response?.data?.message || 'Failed to send instant reminder');
    } finally {
      setReminderLoading(false);
    }
  };

  const handleDownloadIcs = async () => {
    if (!appointment) return;
    try {
      const ics = await appointmentApi.exportSingleIcs(appointment.id);
      const blob = new Blob([ics], { type: 'text/calendar;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `meeting_${appointment.id}.ics`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (err: any) {
      setError(err?.response?.data?.message || 'Failed to download calendar invite');
    }
  };

  if (!isOpen || !appointment) return null;

  const canManage =
    isAdmin ||
    (isManager &&
      (appointment.organizerDepartmentId === user?.departmentId ||
        appointment.organizerId === user?.id)) ||
    appointment.organizerId === user?.id;

  const handleCompleteSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setLoading(true);
      setError(null);
      await onComplete(appointment.id, {
        outcomeNotes: outcomeNotes.trim() || undefined,
        actionItems: actionItems.trim() || undefined,
        recordingUrl: recordingUrl.trim() || undefined,
        isNoShow,
      });
      onClose();
    } catch (err: any) {
      setError(err?.response?.data?.message || 'Failed to complete appointment');
    } finally {
      setLoading(false);
    }
  };

  const handleRescheduleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newStartTime) {
      setError('Please pick a new start time');
      return;
    }
    const picked = new Date(newStartTime);
    const now = new Date();
    if (picked.getTime() < now.getTime()) {
      setError('Rescheduled meeting time cannot be in the past. Please select an upcoming future time slot.');
      return;
    }
    if (Number(newDuration) < 5 || Number(newDuration) > 480) {
      setError('Meeting duration must be between 5 minutes and 8 hours');
      return;
    }
    try {
      setLoading(true);
      setError(null);
      await onReschedule(appointment.id, {
        newStartTime: newStartTime.length === 16 ? newStartTime + ':00' : newStartTime,
        newDurationMinutes: Number(newDuration),
        reason: rescheduleReason.trim() || undefined,
      });
      onClose();
    } catch (err: any) {
      setError(err?.response?.data?.message || 'Failed to reschedule appointment');
    } finally {
      setLoading(false);
    }
  };

  const handleCancelSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setLoading(true);
      setError(null);
      await onCancel(appointment.id, cancelReason.trim() || 'Client requested cancellation');
      onClose();
    } catch (err: any) {
      setError(err?.response?.data?.message || 'Failed to cancel appointment');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (window.confirm('Are you sure you want to permanently delete this appointment record?')) {
      try {
        setLoading(true);
        await onDelete(appointment.id);
        onClose();
      } catch (err: any) {
        setError(err?.response?.data?.message || 'Failed to delete appointment');
      } finally {
        setLoading(false);
      }
    }
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

  return (
    <ModalPortal>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-fade-in">
      <div className="relative w-full max-w-2xl bg-slate-900/95 border border-slate-700/80 rounded-2xl shadow-2xl overflow-hidden backdrop-blur-xl">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-slate-800/40">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-gradient-to-tr from-indigo-500 to-purple-600 rounded-xl shadow-lg">
              <Calendar className="w-5 h-5 text-white" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h2 className="text-base font-bold text-white leading-tight line-clamp-1">
                  {appointment.title}
                </h2>
                <span
                  className={`px-2 py-0.5 rounded-md text-[10px] font-bold border ${getStatusBadge(
                    appointment.status
                  )}`}
                >
                  {appointment.status}
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                {appointment.meetingType.replace('_', ' ')} • {appointment.durationMinutes} Mins
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

        {error && (
          <div className="mx-6 mt-4 p-3 text-xs text-red-400 bg-red-500/10 border border-red-500/20 rounded-xl">
            {error}
          </div>
        )}

        {/* Dynamic Views */}
        {viewMode === 'DETAILS' && (
          <div className="p-6 space-y-5 max-h-[75vh] overflow-y-auto">
            {/* Virtual Meeting Join Banner */}
            {appointment.meetingLink && (
              <div className="p-4 bg-gradient-to-r from-indigo-950/80 to-purple-950/80 border border-indigo-500/30 rounded-xl flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className="p-2.5 bg-indigo-500/20 rounded-lg text-indigo-400">
                    <Video className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-white">
                      {appointment.meetingMode.replace(/_/g, ' ')}
                    </h4>
                    <p className="text-[11px] text-slate-300 truncate max-w-sm">
                      {appointment.meetingLink}
                    </p>
                  </div>
                </div>
                <a
                  href={appointment.meetingLink}
                  target="_blank"
                  rel="noreferrer"
                  className="flex items-center space-x-1.5 px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold rounded-xl shadow-lg shadow-indigo-500/25 transition-all"
                >
                  <span>Join Call</span>
                  <ExternalLink className="w-3.5 h-3.5" />
                </a>
              </div>
            )}

            {/* Timing & Location */}
            <div className="grid grid-cols-2 gap-3 p-3.5 bg-slate-800/40 rounded-xl border border-slate-800 text-xs">
              <div className="space-y-1">
                <span className="text-slate-400 flex items-center space-x-1">
                  <Clock className="w-3.5 h-3.5 text-indigo-400" />
                  <span>Scheduled Time:</span>
                </span>
                <p className="font-semibold text-white">
                  {new Date(appointment.startTime).toLocaleString([], {
                    dateStyle: 'medium',
                    timeStyle: 'short',
                  })}
                </p>
              </div>

              <div className="space-y-1">
                <span className="text-slate-400 flex items-center space-x-1">
                  <MapPin className="w-3.5 h-3.5 text-purple-400" />
                  <span>Channel / Location:</span>
                </span>
                <p className="font-semibold text-white">
                  {appointment.location || appointment.meetingMode.replace(/_/g, ' ')}
                </p>
              </div>
            </div>

            {/* People & Contact Info */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {/* Attendee */}
              <div className="p-3.5 bg-slate-800/40 rounded-xl border border-slate-800 space-y-2 text-xs">
                <div className="flex items-center space-x-1.5 text-slate-400 font-bold uppercase text-[10px]">
                  <User className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Client / Lead Attendee</span>
                </div>
                <p className="font-semibold text-white text-sm">{appointment.attendeeName}</p>
                <div className="space-y-1 text-slate-300">
                  <p className="flex items-center space-x-1.5">
                    <Mail className="w-3.5 h-3.5 text-slate-500" />
                    <span>{appointment.attendeeEmail}</span>
                  </p>
                  {appointment.attendeePhone && (
                    <p className="flex items-center space-x-1.5">
                      <Phone className="w-3.5 h-3.5 text-slate-500" />
                      <span className="font-mono">{appointment.attendeePhone}</span>
                    </p>
                  )}
                </div>
              </div>

              {/* Host / Organizer */}
              <div className="p-3.5 bg-slate-800/40 rounded-xl border border-slate-800 space-y-2 text-xs">
                <div className="flex items-center space-x-1.5 text-slate-400 font-bold uppercase text-[10px]">
                  <Sparkles className="w-3.5 h-3.5 text-indigo-400" />
                  <span>Organized By (Rep / Host)</span>
                </div>
                <p className="font-semibold text-white text-sm">{appointment.organizerName}</p>
                <p className="text-slate-400">{appointment.organizerRole.replace('ROLE_', '')}</p>
                {appointment.entityTitle && (
                  <p className="text-[11px] text-indigo-300 font-medium">
                    Attached to: {appointment.entityType} ({appointment.entityTitle})
                  </p>
                )}
              </div>
            </div>

            {/* Description / Agenda */}
            {appointment.description && (
              <div className="space-y-1.5">
                <h4 className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
                  Agenda & Notes
                </h4>
                <p className="p-3 bg-slate-800/30 rounded-xl border border-slate-800 text-xs text-slate-300 whitespace-pre-line leading-relaxed">
                  {appointment.description}
                </p>
              </div>
            )}

            {/* Outcomes & Action Items (if completed) */}
            {appointment.outcomeNotes && (
              <div className="space-y-1.5 p-3.5 bg-emerald-950/20 border border-emerald-500/20 rounded-xl">
                <h4 className="text-xs font-bold text-emerald-300 uppercase tracking-wider flex items-center space-x-1.5">
                  <CheckCircle className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Meeting Outcomes & Takeaways</span>
                </h4>
                <p className="text-xs text-slate-200 whitespace-pre-line mt-1">
                  {appointment.outcomeNotes}
                </p>
                {appointment.actionItems && (
                  <div className="mt-2 pt-2 border-t border-emerald-500/20">
                    <p className="text-[11px] font-semibold text-emerald-400">Action Items:</p>
                    <p className="text-xs text-slate-300">{appointment.actionItems}</p>
                  </div>
                )}
              </div>
            )}

            {reminderSuccess && (
              <div className="p-3 bg-emerald-500/10 border border-emerald-500/30 rounded-xl text-emerald-300 text-xs flex items-center gap-2 animate-in fade-in">
                <Check className="w-4 h-4 text-emerald-400" />
                <span>Instant Meeting Reminder sent successfully to Host & Attendees!</span>
              </div>
            )}

            {/* Action Buttons */}
            <div className="flex flex-wrap items-center justify-between gap-3 pt-4 border-t border-slate-800">
              <div className="flex items-center space-x-2">
                {isAdmin && (
                  <button
                    onClick={handleDelete}
                    disabled={loading}
                    className="p-2 text-slate-400 hover:text-red-400 hover:bg-red-500/10 rounded-xl border border-slate-700/60 transition-colors"
                    title="Delete Record (Admin Only)"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                )}

                {appointment.status !== 'COMPLETED' && appointment.status !== 'CANCELLED' && (
                  <button
                    onClick={handleSendInstantReminder}
                    disabled={reminderLoading}
                    className="px-3 py-2 bg-indigo-950/40 hover:bg-indigo-900/50 border border-indigo-500/30 hover:border-indigo-500/60 text-indigo-300 hover:text-white text-xs font-semibold rounded-xl flex items-center space-x-1.5 transition-all shadow-sm"
                    title="Send immediate reminder alert to all attendees"
                  >
                    <Bell className="w-3.5 h-3.5 text-indigo-400" />
                    <span>{reminderLoading ? 'Sending...' : 'Send Instant Reminder'}</span>
                  </button>
                )}

                <button
                  onClick={handleDownloadIcs}
                  className="px-3 py-2 bg-slate-800/80 hover:bg-slate-700 border border-slate-700 text-slate-300 hover:text-white text-xs font-semibold rounded-xl flex items-center space-x-1.5 transition-all shadow-sm"
                  title="Add to Google Calendar / Outlook / Apple Calendar (.ics)"
                >
                  <Download className="w-3.5 h-3.5 text-purple-400" />
                  <span>Add to Calendar</span>
                </button>
              </div>

              <div className="flex items-center space-x-2">
                {canManage && appointment.status !== 'COMPLETED' && appointment.status !== 'CANCELLED' && (
                  <>
                    {new Date(appointment.startTime) < new Date() && !isAdmin && !isManager ? (
                      <span className="text-[11px] text-slate-400 italic px-2 py-1 bg-slate-800/80 rounded-lg border border-slate-700">
                        Past meeting (Log outcomes only)
                      </span>
                    ) : (
                      <>
                        <button
                          onClick={() => setViewMode('CANCEL')}
                          className="px-3 py-2 bg-slate-800 hover:bg-slate-700 border border-slate-700 text-rose-300 text-xs font-medium rounded-xl transition-colors"
                        >
                          Cancel Meeting
                        </button>
                        <button
                          onClick={() => {
                            const apptStart = new Date(appointment.startTime);
                            const defaultTime = apptStart.getTime() > Date.now() ? apptStart : new Date(Date.now() + 15 * 60 * 1000);
                            setNewStartTime(getLocalDatetimeString(defaultTime));
                            setViewMode('RESCHEDULE');
                          }}
                          className="px-3 py-2 bg-slate-800 hover:bg-slate-700 border border-slate-700 text-amber-300 text-xs font-medium rounded-xl transition-colors"
                        >
                          Reschedule
                        </button>
                      </>
                    )}
                    <button
                      onClick={() => setViewMode('COMPLETE')}
                      className="px-4 py-2 bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white text-xs font-semibold rounded-xl shadow-lg transition-all"
                    >
                      Log Outcomes & Complete
                    </button>
                  </>
                )}
              </div>
            </div>
          </div>
        )}

        {/* View Mode: Complete & Outcome */}
        {viewMode === 'COMPLETE' && (
          <form onSubmit={handleCompleteSubmit} className="p-6 space-y-4">
            <h3 className="text-sm font-bold text-white flex items-center space-x-2">
              <CheckCircle className="w-4 h-4 text-emerald-400" />
              <span>Record Meeting Outcomes & Wrap-up</span>
            </h3>

            <div>
              <label className="block text-xs font-medium text-slate-400 mb-1">
                Outcomes & Summary Remarks *
              </label>
              <textarea
                rows={3}
                required
                placeholder="Key agreements reached, objections resolved, pricing discussed..."
                value={outcomeNotes}
                onChange={(e) => setOutcomeNotes(e.target.value)}
                className="w-full px-3.5 py-2 bg-slate-800 border border-slate-700 rounded-xl text-white text-xs focus:outline-none focus:ring-2 focus:ring-emerald-500/50"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-400 mb-1">Next Action Items</label>
              <input
                type="text"
                placeholder="e.g. Send revised MSA contract by Friday"
                value={actionItems}
                onChange={(e) => setActionItems(e.target.value)}
                className="w-full px-3.5 py-2 bg-slate-800 border border-slate-700 rounded-xl text-white text-xs focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-400 mb-1">Recording / Notes URL (Optional)</label>
              <input
                type="text"
                placeholder="e.g. https://drive.google.com/call-recording.mp4"
                value={recordingUrl}
                onChange={(e) => setRecordingUrl(e.target.value)}
                className="w-full px-3.5 py-2 bg-slate-800 border border-slate-700 rounded-xl text-white text-xs focus:outline-none"
              />
            </div>

            <div className="flex items-center space-x-2 pt-1">
              <input
                type="checkbox"
                id="noShowCheck"
                checked={isNoShow}
                onChange={(e) => setIsNoShow(e.target.checked)}
                className="rounded border-slate-700 bg-slate-800 text-indigo-600 focus:ring-0"
              />
              <label htmlFor="noShowCheck" className="text-xs text-slate-300">
                Mark as <strong>No-Show</strong> (Client did not attend)
              </label>
            </div>

            <div className="flex items-center justify-end space-x-2 pt-4 border-t border-slate-800">
              <button
                type="button"
                onClick={() => setViewMode('DETAILS')}
                className="px-3.5 py-2 text-xs text-slate-400 hover:text-white rounded-xl"
              >
                Back
              </button>
              <button
                type="submit"
                disabled={loading}
                className="px-5 py-2 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold rounded-xl shadow transition-all"
              >
                {loading ? 'Saving...' : 'Save & Mark Completed'}
              </button>
            </div>
          </form>
        )}

        {/* View Mode: Reschedule */}
        {viewMode === 'RESCHEDULE' && (
          <form onSubmit={handleRescheduleSubmit} className="p-6 space-y-4">
            <h3 className="text-sm font-bold text-white flex items-center space-x-2">
              <RotateCcw className="w-4 h-4 text-amber-400" />
              <span>Reschedule Meeting</span>
            </h3>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-slate-400 mb-1 flex items-center space-x-1">
                  <Clock className="w-3.5 h-3.5" />
                  <span>New Start Time *</span>
                </label>
                <input
                  type="datetime-local"
                  required
                  min={getMinDateTime()}
                  value={newStartTime}
                  onChange={(e) => {
                    setNewStartTime(e.target.value);
                    if (e.target.value && new Date(e.target.value).getTime() < Date.now()) {
                      setError('Rescheduled meeting time cannot be in the past. Please select an upcoming future time slot.');
                    } else {
                      setError(null);
                    }
                  }}
                  className={`w-full px-3 py-2 bg-slate-800 border rounded-xl text-white text-xs focus:outline-none focus:ring-2 focus:ring-amber-500/50 ${
                    newStartTime && new Date(newStartTime).getTime() < Date.now()
                      ? 'border-amber-500/80 bg-amber-500/10 text-amber-200'
                      : 'border-slate-700'
                  }`}
                />
                {newStartTime && new Date(newStartTime).getTime() < Date.now() && (
                  <p className="mt-1.5 text-[11px] text-amber-400 font-medium flex items-center gap-1.5">
                    <Clock className="w-3 h-3 text-amber-400 shrink-0" />
                    <span>Cannot reschedule to a past date or time.</span>
                  </p>
                )}
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-400 mb-1">Duration</label>
                <select
                  value={newDuration}
                  onChange={(e) => setNewDuration(Number(e.target.value))}
                  className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-xl text-white text-xs focus:outline-none"
                >
                  <option value={15}>15 Minutes</option>
                  <option value={30}>30 Minutes</option>
                  <option value={45}>45 Minutes</option>
                  <option value={60}>60 Minutes</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-400 mb-1">Reason for Rescheduling</label>
              <input
                type="text"
                placeholder="e.g. Client requested postponement due to team meeting"
                value={rescheduleReason}
                onChange={(e) => setRescheduleReason(e.target.value)}
                className="w-full px-3.5 py-2 bg-slate-800 border border-slate-700 rounded-xl text-white text-xs focus:outline-none"
              />
            </div>

            <div className="flex items-center justify-end space-x-2 pt-4 border-t border-slate-800">
              <button
                type="button"
                onClick={() => setViewMode('DETAILS')}
                className="px-3.5 py-2 text-xs text-slate-400 hover:text-white rounded-xl"
              >
                Back
              </button>
              <button
                type="submit"
                disabled={loading || Boolean(newStartTime && new Date(newStartTime).getTime() < Date.now())}
                className="px-5 py-2 bg-amber-600 hover:bg-amber-500 text-white text-xs font-semibold rounded-xl shadow transition-all disabled:opacity-50"
              >
                {loading ? 'Rescheduling...' : 'Confirm Reschedule'}
              </button>
            </div>
          </form>
        )}

        {/* View Mode: Cancel */}
        {viewMode === 'CANCEL' && (
          <form onSubmit={handleCancelSubmit} className="p-6 space-y-4">
            <h3 className="text-sm font-bold text-white flex items-center space-x-2">
              <AlertTriangle className="w-4 h-4 text-rose-400" />
              <span>Cancel Meeting</span>
            </h3>

            <div>
              <label className="block text-xs font-medium text-slate-400 mb-1">Cancellation Reason *</label>
              <textarea
                rows={2}
                required
                placeholder="Reason for cancellation..."
                value={cancelReason}
                onChange={(e) => setCancelReason(e.target.value)}
                className="w-full px-3.5 py-2 bg-slate-800 border border-slate-700 rounded-xl text-white text-xs focus:outline-none focus:ring-2 focus:ring-rose-500/50"
              />
            </div>

            <div className="flex items-center justify-end space-x-2 pt-4 border-t border-slate-800">
              <button
                type="button"
                onClick={() => setViewMode('DETAILS')}
                className="px-3.5 py-2 text-xs text-slate-400 hover:text-white rounded-xl"
              >
                Back
              </button>
              <button
                type="submit"
                disabled={loading}
                className="px-5 py-2 bg-rose-600 hover:bg-rose-500 text-white text-xs font-semibold rounded-xl shadow transition-all"
              >
                {loading ? 'Cancelling...' : 'Confirm Cancellation'}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
    </ModalPortal>
  );
};
