import { ModalPortal } from '../ModalPortal';
import React, { useState } from 'react';
import {
  X,
  Calendar,
  Clock,
  Video,
  MapPin,
  User,
  Phone,
  Building,
  Bell,
} from 'lucide-react';
import {
  CreateAppointmentPayload,
  EntityType,
  MeetingMode,
  MeetingType,
} from '../../types/appointment';

import { useAuth } from '../../context/AuthContext';

interface ScheduleAppointmentModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (payload: CreateAppointmentPayload) => Promise<void>;
  defaultEntityType?: EntityType;
  defaultEntityId?: number;
  defaultEntityTitle?: string;
  defaultAttendeeName?: string;
  defaultAttendeeEmail?: string;
  defaultAttendeePhone?: string;
}

const MEETING_TYPE_OPTIONS: { id: MeetingType; label: string }[] = [
  { id: 'PRODUCT_DEMO', label: 'Product Demo & Presentation' },
  { id: 'DISCOVERY_CALL', label: 'Initial Discovery & Qualification' },
  { id: 'PROPOSAL_REVIEW', label: 'Proposal & Commercials Review' },
  { id: 'NEGOTIATION', label: 'Final Pricing & Contract Negotiation' },
  { id: 'EXECUTIVE_SPONSOR', label: 'Executive Sponsor Alignment' },
  { id: 'ONBOARDING', label: 'Customer Onboarding & Kickoff' },
  { id: 'ACCOUNT_REVIEW', label: 'Quarterly Business Review (QBR)' },
  { id: 'CUSTOM', label: 'Custom Strategic Meeting' },
];

const MEETING_MODE_OPTIONS: { id: MeetingMode; label: string; icon: any }[] = [
  { id: 'VIRTUAL_GOOGLE_MEET', label: 'Google Meet', icon: Video },
  { id: 'VIRTUAL_ZOOM', label: 'Zoom Video Call', icon: Video },
  { id: 'VIRTUAL_MS_TEAMS', label: 'Microsoft Teams', icon: Video },
  { id: 'IN_PERSON_OFFICE', label: 'Our Head Office', icon: Building },
  { id: 'CLIENT_SITE', label: 'Client Location', icon: MapPin },
  { id: 'PHONE_CALL', label: 'Phone Discussion', icon: Phone },
];

export const ScheduleAppointmentModal: React.FC<ScheduleAppointmentModalProps> = ({
  isOpen,
  onClose,
  onSubmit,
  defaultEntityType = 'GENERAL',
  defaultEntityId,
  defaultEntityTitle = '',
  defaultAttendeeName = '',
  defaultAttendeeEmail = '',
  defaultAttendeePhone = '',
}) => {
  const { user, isAdmin, isManager } = useAuth();
  const getLocalDatetimeString = (date: Date = new Date()) => {
    const pad = (n: number) => n.toString().padStart(2, '0');
    return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
  };

  const getNextUpcomingSlot = () => {
    const now = new Date();
    // Add 15 minutes from now so it is safely in the upcoming future
    now.setMinutes(now.getMinutes() + 15);
    return getLocalDatetimeString(now);
  };

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [meetingType, setMeetingType] = useState<MeetingType>('PRODUCT_DEMO');
  const [meetingMode, setMeetingMode] = useState<MeetingMode>('VIRTUAL_GOOGLE_MEET');
  const [meetingLink, setMeetingLink] = useState('');
  const [location, setLocation] = useState('');
  const [startTime, setStartTime] = useState(getNextUpcomingSlot());
  const [durationMinutes, setDurationMinutes] = useState(30);
  const [reminderMinutes, setReminderMinutes] = useState<number>(15);
  const [sendInstantAlert, setSendInstantAlert] = useState<boolean>(true);
  const [organizerId, setOrganizerId] = useState<number | undefined>(user?.id);
  const [entityType, setEntityType] = useState<EntityType>(defaultEntityType);
  const [entityId, setEntityId] = useState<number | undefined>(defaultEntityId);
  const [entityTitle, setEntityTitle] = useState(defaultEntityTitle);

  const [attendeeName, setAttendeeName] = useState(defaultAttendeeName);
  const [attendeeEmail, setAttendeeEmail] = useState(defaultAttendeeEmail);
  const [attendeePhone, setAttendeePhone] = useState(defaultAttendeePhone);
  const [externalGuests, setExternalGuests] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const getMinDateTime = () => {
    const now = new Date();
    const pad = (n: number) => n.toString().padStart(2, '0');
    return `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}T${pad(now.getHours())}:${pad(now.getMinutes())}`;
  };

  const isPastTime = Boolean(
    startTime && new Date(startTime).getTime() < Date.now()
  );

  React.useEffect(() => {
    if (isOpen) {
      setStartTime(getNextUpcomingSlot());
      setError(null);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !attendeeName.trim() || !attendeeEmail.trim() || !startTime) {
      setError('Title, Attendee Name, Attendee Email, and Start Time are required');
      return;
    }

    const pickedDate = new Date(startTime);
    const now = new Date();
    // Timing Rule: Cannot schedule for past date or past time
    if (pickedDate.getTime() < now.getTime()) {
      setError('Meetings cannot be scheduled for past dates or past times. Please choose a future time slot.');
      return;
    }

    if (durationMinutes < 5 || durationMinutes > 480) {
      setError('Meeting duration must be between 5 minutes and 8 hours');
      return;
    }

    if (attendeePhone && !/^\d{10}$/.test(attendeePhone.trim())) {
      setError('Attendee phone number must be exactly 10 digits (e.g. 9876543210)');
      return;
    }

    try {
      setLoading(true);
      setError(null);
      await onSubmit({
        title: title.trim(),
        description: description.trim() || undefined,
        meetingType,
        meetingMode,
        meetingLink: meetingLink.trim() || undefined,
        location: location.trim() || undefined,
        startTime: startTime.length === 16 ? startTime + ':00' : startTime,
        durationMinutes: Number(durationMinutes),
        entityType,
        entityId: entityId || undefined,
        entityTitle: entityTitle.trim() || undefined,
        organizerId: organizerId || undefined,
        attendeeName: attendeeName.trim(),
        attendeeEmail: attendeeEmail.trim(),
        attendeePhone: attendeePhone.trim() || undefined,
        externalGuests: externalGuests.trim() || undefined,
      });
      onClose();
    } catch (err: any) {
      setError(err?.response?.data?.message || 'Failed to schedule appointment');
    } finally {
      setLoading(false);
    }
  };

  return (
    <ModalPortal>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-fade-in">
      <div className="relative w-full max-w-2xl bg-slate-900/95 border border-slate-700/80 rounded-2xl shadow-2xl overflow-hidden backdrop-blur-xl">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-slate-800/40">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-gradient-to-tr from-indigo-500 to-purple-600 rounded-xl shadow-lg">
              <Calendar className="w-5 h-5 text-white" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-white">Schedule Meeting / Appointment</h2>
              <p className="text-xs text-slate-400">Book client calls, demos, and reviews with virtual link generation</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4 max-h-[80vh] overflow-y-auto">
          {error && (
            <div className="p-3 text-sm text-red-400 bg-red-500/10 border border-red-500/20 rounded-xl">
              {error}
            </div>
          )}

          {/* Title */}
          <div>
            <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
              Meeting Title *
            </label>
            <input
              type="text"
              required
              placeholder="e.g. Enterprise Cloud Architecture Demo & Commercials"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full px-4 py-2.5 bg-slate-800/80 border border-slate-700 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/50"
            />
          </div>

          {/* Type & Mode */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-slate-400 mb-1">Meeting Purpose / Type *</label>
              <select
                value={meetingType}
                onChange={(e) => setMeetingType(e.target.value as MeetingType)}
                className="w-full px-3 py-2 bg-slate-800/80 border border-slate-700 rounded-xl text-white text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500/50"
              >
                {MEETING_TYPE_OPTIONS.map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.label}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-400 mb-1">Meeting Mode / Channel *</label>
              <select
                value={meetingMode}
                onChange={(e) => setMeetingMode(e.target.value as MeetingMode)}
                className="w-full px-3 py-2 bg-slate-800/80 border border-slate-700 rounded-xl text-white text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500/50"
              >
                {MEETING_MODE_OPTIONS.map((m) => (
                  <option key={m.id} value={m.id}>
                    {m.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Schedule Date & Duration */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-slate-400 mb-1 flex items-center space-x-1">
                <Clock className="w-3.5 h-3.5" />
                <span>Date & Start Time *</span>
              </label>
              <input
                type="datetime-local"
                required
                min={getMinDateTime()}
                value={startTime}
                onChange={(e) => {
                  setStartTime(e.target.value);
                  if (e.target.value && new Date(e.target.value).getTime() < Date.now()) {
                    setError('Meetings cannot be scheduled for past dates or past times. Please choose a future time slot.');
                  } else {
                    setError(null);
                  }
                }}
                className={`w-full px-3 py-2 bg-slate-800/80 border rounded-xl text-white text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500/50 ${
                  isPastTime ? 'border-amber-500/80 bg-amber-500/10 text-amber-200' : 'border-slate-700'
                }`}
              />
              {isPastTime && (
                <p className="mt-1.5 text-[11px] text-amber-400 font-medium flex items-center gap-1.5">
                  <Clock className="w-3 h-3 text-amber-400 shrink-0" />
                  <span>Cannot schedule for past date or past time. Please choose a future time slot.</span>
                </p>
              )}
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-400 mb-1">Duration</label>
              <select
                value={durationMinutes}
                onChange={(e) => setDurationMinutes(Number(e.target.value))}
                className="w-full px-3 py-2 bg-slate-800/80 border border-slate-700 rounded-xl text-white text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500/50"
              >
                <option value={15}>15 Minutes (Quick Sync)</option>
                <option value={30}>30 Minutes (Standard)</option>
                <option value={45}>45 Minutes (Detailed Demo)</option>
                <option value={60}>60 Minutes (Strategy Session)</option>
                <option value={90}>90 Minutes (Deep Dive / QBR)</option>
              </select>
            </div>
          </div>

          {/* Custom Link / Location Override */}
          {meetingMode.startsWith('VIRTUAL') ? (
            <div>
              <label className="block text-xs font-medium text-slate-400 mb-1">
                Meeting Link (Leave empty to auto-generate)
              </label>
              <input
                type="text"
                placeholder="Auto-generated URL or paste custom Zoom/Meet link..."
                value={meetingLink}
                onChange={(e) => setMeetingLink(e.target.value)}
                className="w-full px-3.5 py-2 bg-slate-800/80 border border-slate-700 rounded-xl text-white placeholder-slate-500 text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500/50"
              />
            </div>
          ) : (
            <div>
              <label className="block text-xs font-medium text-slate-400 mb-1">Physical Location Address</label>
              <input
                type="text"
                placeholder="e.g. Conference Room A, Level 4, Tech Park Bangalore"
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                className="w-full px-3.5 py-2 bg-slate-800/80 border border-slate-700 rounded-xl text-white placeholder-slate-500 text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500/50"
              />
            </div>
          )}

          {/* Attendee Details */}
          <div className="p-3.5 bg-slate-800/40 rounded-xl border border-slate-800 space-y-3">
            <h4 className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center space-x-1.5">
              <User className="w-3.5 h-3.5 text-indigo-400" />
              <span>Primary Attendee Details</span>
            </h4>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-2.5">
              <div>
                <label className="block text-[11px] font-medium text-slate-400 mb-1">Name *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Rajesh Sharma"
                  value={attendeeName}
                  onChange={(e) => setAttendeeName(e.target.value)}
                  className="w-full px-3 py-1.5 bg-slate-800 border border-slate-700 rounded-lg text-white text-xs focus:outline-none focus:ring-1 focus:ring-indigo-500"
                />
              </div>

              <div>
                <label className="block text-[11px] font-medium text-slate-400 mb-1">Email *</label>
                <input
                  type="email"
                  required
                  placeholder="rajesh@reliance.com"
                  value={attendeeEmail}
                  onChange={(e) => setAttendeeEmail(e.target.value)}
                  className="w-full px-3 py-1.5 bg-slate-800 border border-slate-700 rounded-lg text-white text-xs focus:outline-none focus:ring-1 focus:ring-indigo-500"
                />
              </div>

              <div>
                <label className="block text-[11px] font-medium text-slate-400 mb-1">Phone (10 Digits)</label>
                <input
                  type="tel"
                  placeholder="9876543210"
                  value={attendeePhone}
                  onChange={(e) => setAttendeePhone(e.target.value)}
                  maxLength={10}
                  className="w-full px-3 py-1.5 bg-slate-800 border border-slate-700 rounded-lg text-white text-xs focus:outline-none focus:ring-1 focus:ring-indigo-500 font-mono"
                />
              </div>
            </div>

            <div>
              <label className="block text-[11px] font-medium text-slate-400 mb-1">
                Additional Invitees / Guest Emails (Comma-separated)
              </label>
              <input
                type="text"
                placeholder="e.g. cto@client.com, pm@client.com"
                value={externalGuests}
                onChange={(e) => setExternalGuests(e.target.value)}
                className="w-full px-3 py-1.5 bg-slate-800 border border-slate-700 rounded-lg text-white text-xs focus:outline-none focus:ring-1 focus:ring-indigo-500"
              />
            </div>
          </div>

          {/* Entity Linkage */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <div>
              <label className="block text-xs font-medium text-slate-400 mb-1">Link to Entity</label>
              <select
                value={entityType}
                onChange={(e) => setEntityType(e.target.value as EntityType)}
                className="w-full px-3 py-2 bg-slate-800/80 border border-slate-700 rounded-xl text-white text-xs focus:outline-none"
              >
                <option value="GENERAL">General Portfolio</option>
                <option value="DEAL">Deal / Proposal</option>
                <option value="CUSTOMER">Customer Account</option>
                <option value="LEAD">Lead Record</option>
                <option value="CONTACT">Contact Person</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-400 mb-1">Entity ID</label>
              <input
                type="number"
                placeholder="e.g. 1"
                value={entityId || ''}
                onChange={(e) => setEntityId(e.target.value ? parseInt(e.target.value) : undefined)}
                className="w-full px-3 py-2 bg-slate-800/80 border border-slate-700 rounded-xl text-white text-xs focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-400 mb-1">Entity Title</label>
              <input
                type="text"
                placeholder="e.g. Reliance Digital"
                value={entityTitle}
                onChange={(e) => setEntityTitle(e.target.value)}
                className="w-full px-3 py-2 bg-slate-800/80 border border-slate-700 rounded-xl text-white text-xs focus:outline-none"
              />
            </div>
          </div>

          {/* Host Assignment Section */}
          <div className="p-3 bg-slate-800/40 rounded-xl border border-slate-800 flex items-center justify-between">
            <div>
              <span className="text-xs font-semibold text-slate-300 flex items-center space-x-1.5">
                <User className="w-3.5 h-3.5 text-indigo-400" />
                <span>Assigned Meeting Host / Organizer</span>
              </span>
              <p className="text-[11px] text-slate-400 mt-0.5">
                {isAdmin
                  ? '🌐 Admin Mode: Schedule for any rep, executive, or self'
                  : isManager
                  ? '👥 Manager Mode: Schedule for team members or self'
                  : '👤 Sales Rep: Host is locked to your account'}
              </p>
            </div>
            {isAdmin || isManager ? (
              <div className="flex items-center space-x-2">
                <label className="text-xs text-slate-400 font-medium">Rep ID:</label>
                <input
                  type="number"
                  value={organizerId || ''}
                  onChange={(e) => setOrganizerId(e.target.value ? Number(e.target.value) : undefined)}
                  placeholder={String(user?.id || 1)}
                  className="w-20 px-2.5 py-1 bg-slate-800 border border-slate-700 rounded-lg text-white text-xs focus:outline-none"
                />
              </div>
            ) : (
              <span className="px-2.5 py-1 bg-slate-800 border border-slate-700 rounded-lg text-xs font-semibold text-indigo-300">
                {user?.name} (You)
              </span>
            )}
          </div>

          {/* Agenda Description */}
          <div>
            <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1">
              Agenda & Notes
            </label>
            <textarea
              rows={2}
              placeholder="Outline objectives, demo agenda, or preparation remarks..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full px-3.5 py-2 bg-slate-800/80 border border-slate-700 rounded-xl text-white placeholder-slate-500 text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500/50 resize-y"
            />
          </div>

          {/* Automated Reminders & Alerts */}
          <div className="p-3.5 bg-slate-800/40 rounded-xl border border-slate-800 space-y-2.5">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-300 flex items-center space-x-1.5">
                <Bell className="w-3.5 h-3.5 text-amber-400" />
                <span>Automated Meeting Reminders</span>
              </span>
              <span className="text-[10px] px-2 py-0.5 rounded bg-amber-500/10 text-amber-300 border border-amber-500/20 font-medium">
                Live Countdown & Alerts
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-1">
              <div>
                <label className="block text-[11px] font-medium text-slate-400 mb-1">Reminder Cadence</label>
                <select
                  value={reminderMinutes}
                  onChange={(e) => setReminderMinutes(Number(e.target.value))}
                  className="w-full px-3 py-1.5 bg-slate-800 border border-slate-700 rounded-lg text-white text-xs focus:outline-none focus:ring-1 focus:ring-amber-500"
                >
                  <option value={15}>15 Minutes Before (Recommended)</option>
                  <option value={30}>30 Minutes Before</option>
                  <option value={60}>1 Hour Before</option>
                  <option value={1440}>1 Day Before</option>
                  <option value={0}>No Pre-Alert</option>
                </select>
              </div>

              <div className="flex items-center space-x-2 pt-4 md:pt-5">
                <input
                  type="checkbox"
                  id="sendInstantAlert"
                  checked={sendInstantAlert}
                  onChange={(e) => setSendInstantAlert(e.target.checked)}
                  className="w-4 h-4 rounded text-indigo-600 bg-slate-800 border-slate-700 focus:ring-indigo-500"
                />
                <label htmlFor="sendInstantAlert" className="text-xs text-slate-300 cursor-pointer">
                  Send instant notification to host & attendee
                </label>
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center justify-end space-x-3 pt-4 border-t border-slate-800">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm text-slate-400 hover:text-white hover:bg-slate-800 rounded-xl transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading || isPastTime}
              className="px-6 py-2.5 bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 text-white text-sm font-semibold rounded-xl shadow-lg shadow-indigo-500/25 transition-all disabled:opacity-50"
            >
              {loading ? 'Scheduling...' : 'Schedule Appointment'}
            </button>
          </div>
        </form>
      </div>
    </div>
    </ModalPortal>
  );
};
