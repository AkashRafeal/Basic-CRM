import { ModalPortal } from '../ModalPortal';
import React, { useState } from 'react';
import { CallLog } from '../../types/call';
import { CallStatusBadge } from './CallStatusBadge';
import { CallTypeBadge } from './CallTypeBadge';
import { CallPurposeBadge } from './CallPurposeBadge';
import { CallOutcomeBadge } from './CallOutcomeBadge';
import {
  X,
  Calendar,
  Clock,
  User,
  Phone,
  Mail,
  Building2,
  FileText,
  CheckSquare,
  Play,
  Pause,
  Edit2,
  Trash2,
  PhoneOutgoing,
} from 'lucide-react';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  call: CallLog | null;
  onEdit: (call: CallLog) => void;
  onDelete: (call: CallLog) => void;
  onLogOutcome: (call: CallLog) => void;
  onDial: (phone: string, name: string) => void;
}

export const CallDetailsModal: React.FC<Props> = ({
  isOpen,
  onClose,
  call,
  onEdit,
  onDelete,
  onLogOutcome,
  onDial,
}) => {
  const [isPlayingAudio, setIsPlayingAudio] = useState(false);

  if (!isOpen || !call) return null;

  return (
    <ModalPortal>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
      <div className="bg-slate-900 border border-slate-800 w-full max-w-2xl rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="flex items-start justify-between px-6 py-4 border-b border-slate-800 bg-slate-950/40 shrink-0">
          <div className="space-y-1.5">
            <div className="flex items-center gap-2 flex-wrap">
              <CallStatusBadge status={call.status} />
              <CallTypeBadge type={call.callType} />
              <CallPurposeBadge purpose={call.purpose} />
            </div>
            <h2 className="text-lg font-bold text-slate-100 mt-1">{call.title}</h2>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-200 hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scrollable Content Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-4">
          {/* Outcome highlight banner if exists */}
          {call.outcome && (
            <div className="p-3.5 rounded-xl bg-slate-950/60 border border-slate-800 flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-400">Logged Outcome:</span>
              <CallOutcomeBadge outcome={call.outcome} />
            </div>
          )}

          {/* Participant & CRM Linking Card */}
          <div className="p-4 rounded-xl bg-slate-950/40 border border-slate-800/80 space-y-3">
            <div className="text-xs font-semibold text-indigo-400 uppercase tracking-wider">
              Participant & CRM Telephony Route
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
              <div className="flex items-center gap-2.5 text-slate-300">
                <User className="w-4 h-4 text-slate-500" />
                <span className="font-medium text-slate-200">
                  {call.contactName || 'No contact specified'}
                </span>
              </div>
              <div className="flex items-center gap-2.5 text-slate-300">
                <Building2 className="w-4 h-4 text-slate-500" />
                <span>
                  {call.relatedToType}:{' '}
                  <strong className="text-slate-200">{call.relatedToName || 'General'}</strong>
                </span>
              </div>
              <div className="flex items-center gap-2.5 text-slate-300">
                <Phone className="w-4 h-4 text-emerald-400" />
                <span className="text-slate-400">To (Customer): </span>
                {call.contactPhone ? (
                  <span className="text-emerald-300 font-mono font-medium">{call.contactPhone}</span>
                ) : (
                  <span className="text-slate-500 italic">No destination phone</span>
                )}
              </div>
              <div className="flex items-center gap-2.5 text-slate-300">
                <Phone className="w-4 h-4 text-indigo-400" />
                <span className="text-slate-400">From (Given Number): </span>
                {call.callerPhone ? (
                  <span className="text-indigo-300 font-mono font-medium">{call.callerPhone}</span>
                ) : (
                  <span className="text-slate-400 font-mono">+91 98765 43210</span>
                )}
              </div>
              <div className="flex items-center gap-2.5 text-slate-300">
                <Mail className="w-4 h-4 text-slate-500" />
                {call.contactEmail ? (
                  <span className="text-slate-300 truncate">{call.contactEmail}</span>
                ) : (
                  <span className="text-slate-500 italic">No email</span>
                )}
              </div>
              {call.callSessionId && (
                <div className="flex items-center gap-2.5 text-slate-400">
                  <span className="text-[10px] uppercase font-bold text-slate-500">Session:</span>
                  <span className="text-indigo-300 font-mono text-[11px]">{call.callSessionId}</span>
                </div>
              )}
            </div>
          </div>

          {/* Timing & Duration Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            <div className="p-3 rounded-xl bg-slate-950/60 border border-slate-800/60">
              <div className="text-[11px] text-slate-500 flex items-center gap-1.5 mb-1">
                <Calendar className="w-3.5 h-3.5 text-slate-400" />
                Scheduled Date
              </div>
              <div className="text-xs font-medium text-slate-200">
                {call.scheduledStartTime
                  ? new Date(call.scheduledStartTime).toLocaleString()
                  : 'Instant Log'}
              </div>
            </div>

            <div className="p-3 rounded-xl bg-slate-950/60 border border-slate-800/60">
              <div className="text-[11px] text-slate-500 flex items-center gap-1.5 mb-1">
                <Clock className="w-3.5 h-3.5 text-slate-400" />
                Call Duration
              </div>
              <div className="text-xs font-semibold text-indigo-400">
                {call.durationMinutes ? `${call.durationMinutes} minutes` : '0 min'}
              </div>
            </div>

            <div className="p-3 rounded-xl bg-slate-950/60 border border-slate-800/60 col-span-2 sm:col-span-1">
              <div className="text-[11px] text-slate-500 flex items-center gap-1.5 mb-1">
                <User className="w-3.5 h-3.5 text-slate-400" />
                Assigned Agent
              </div>
              <div className="text-xs font-medium text-slate-200 truncate">
                {call.assignedToUserName || 'Unassigned'}
              </div>
            </div>
          </div>

          {/* Agenda */}
          {call.agenda && (
            <div className="space-y-1.5">
              <div className="text-xs font-semibold text-slate-400 flex items-center gap-1.5">
                <FileText className="w-3.5 h-3.5 text-indigo-400" />
                Call Agenda
              </div>
              <div className="p-3 rounded-xl bg-slate-950/50 border border-slate-800 text-xs text-slate-300 whitespace-pre-wrap leading-relaxed">
                {call.agenda}
              </div>
            </div>
          )}

          {/* Notes & Summary */}
          {call.notes && (
            <div className="space-y-1.5">
              <div className="text-xs font-semibold text-slate-400 flex items-center gap-1.5">
                <FileText className="w-3.5 h-3.5 text-emerald-400" />
                Notes & Summary
              </div>
              <div className="p-3 rounded-xl bg-slate-950/50 border border-slate-800 text-xs text-slate-300 whitespace-pre-wrap leading-relaxed">
                {call.notes}
              </div>
            </div>
          )}

          {/* Action Items */}
          {call.actionItems && (
            <div className="space-y-1.5">
              <div className="text-xs font-semibold text-slate-400 flex items-center gap-1.5">
                <CheckSquare className="w-3.5 h-3.5 text-amber-400" />
                Next Steps & Action Items
              </div>
              <div className="p-3 rounded-xl bg-amber-500/5 border border-amber-500/20 text-xs text-amber-200">
                {call.actionItems}
              </div>
            </div>
          )}

          {/* Audio Recording Player Simulation */}
          <div className="p-3.5 rounded-xl bg-slate-950/80 border border-slate-800/80 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => setIsPlayingAudio(!isPlayingAudio)}
                className={`p-2.5 rounded-full ${
                  isPlayingAudio
                    ? 'bg-rose-600 text-white animate-pulse'
                    : 'bg-indigo-600 text-white hover:bg-indigo-500'
                } transition-all shadow-md shadow-indigo-600/30`}
              >
                {isPlayingAudio ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4 ml-0.5" />}
              </button>
              <div>
                <div className="text-xs font-medium text-slate-200">
                  {isPlayingAudio ? 'Playing Call Audio Stream...' : 'Call Audio Recording'}
                </div>
                <div className="text-[11px] text-slate-500">
                  {call.durationMinutes ? `${call.durationMinutes}:00 audio track` : '02:45 standard audio'} &bull; MP3 128kbps
                </div>
              </div>
            </div>
            <span className="text-[11px] px-2 py-0.5 rounded-md bg-slate-800 text-slate-400 border border-slate-700">
              VoIP HD
            </span>
          </div>
        </div>

        {/* Fixed Footer */}
        <div className="px-6 py-4 border-t border-slate-800 bg-slate-950/40 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2">
            <button
              onClick={() => {
                onClose();
                onDelete(call);
              }}
              className="p-2 rounded-xl text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 transition-colors"
              title="Delete Call"
            >
              <Trash2 className="w-4 h-4" />
            </button>
            <button
              onClick={() => {
                onClose();
                onEdit(call);
              }}
              className="p-2 rounded-xl text-slate-400 hover:text-indigo-400 hover:bg-indigo-500/10 transition-colors"
              title="Edit Call"
            >
              <Edit2 className="w-4 h-4" />
            </button>
          </div>

          <div className="flex items-center gap-2.5">
            {call.contactPhone && (
              <button
                onClick={() => {
                  onClose();
                  onDial(call.contactPhone!, call.contactName || call.title);
                }}
                className="px-3 py-2 rounded-xl bg-sky-500/10 hover:bg-sky-500/20 text-sky-400 border border-sky-500/20 text-xs font-semibold flex items-center gap-1.5 transition-all"
              >
                <PhoneOutgoing className="w-3.5 h-3.5" />
                Call Again
              </button>
            )}

            {call.status !== 'COMPLETED' && (
              <button
                onClick={() => {
                  onClose();
                  onLogOutcome(call);
                }}
                className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold shadow-lg shadow-emerald-600/30 transition-all"
              >
                Log Outcome
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
    </ModalPortal>
  );
};
