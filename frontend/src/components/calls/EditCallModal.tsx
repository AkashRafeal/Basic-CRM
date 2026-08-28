import { ModalPortal } from '../ModalPortal';
import React, { useState, useEffect } from 'react';
import {
  CallLog,
  UpdateCallRequest,
  CallType,
  CallStatus,
  CallPurpose,
  CallOutcome,
  RelatedEntityType,
} from '../../types/call';
import { Customer } from '../../types/customer';
import { Lead } from '../../types/lead';
import { Contact } from '../../types/contact';
import { User } from '../../types/auth';
import { X, PhoneCall, Layers } from 'lucide-react';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (id: number, data: UpdateCallRequest) => Promise<void>;
  call: CallLog | null;
  customers?: Customer[];
  leads?: Lead[];
  contacts?: Contact[];
  teamMembers?: User[];
}

export const EditCallModal: React.FC<Props> = ({
  isOpen,
  onClose,
  onSubmit,
  call,
  customers = [],
  leads = [],
  contacts = [],
  teamMembers = [],
}) => {
  const [title, setTitle] = useState('');
  const [callType, setCallType] = useState<CallType>('OUTBOUND');
  const [purpose, setPurpose] = useState<CallPurpose>('DISCOVERY');
  const [status, setStatus] = useState<CallStatus>('SCHEDULED');
  const [outcome, setOutcome] = useState<CallOutcome | ''>('');

  // Related Entity
  const [relatedToType, setRelatedToType] = useState<RelatedEntityType>('GENERAL');
  const [relatedToId, setRelatedToId] = useState<number | ''>('');
  const [relatedToName, setRelatedToName] = useState('');
  const [contactName, setContactName] = useState('');
  const [contactPhone, setContactPhone] = useState('');
  const [callerPhone, setCallerPhone] = useState('');
  const [contactEmail, setContactEmail] = useState('');

  // Assigned Agent
  const [assignedToUserId, setAssignedToUserId] = useState<number | ''>('');
  const [assignedToUserName, setAssignedToUserName] = useState('');

  // Timing
  const [scheduledStartTime, setScheduledStartTime] = useState('');
  const [durationMinutes, setDurationMinutes] = useState<number | ''>(15);

  // Content
  const [agenda, setAgenda] = useState('');
  const [notes, setNotes] = useState('');
  const [actionItems, setActionItems] = useState('');

  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (call) {
      setTitle(call.title || '');
      setCallType(call.callType || 'OUTBOUND');
      setPurpose(call.purpose || 'DISCOVERY');
      setStatus(call.status || 'SCHEDULED');
      setOutcome(call.outcome || '');
      setRelatedToType(call.relatedToType || 'GENERAL');
      setRelatedToId(call.relatedToId || '');
      setRelatedToName(call.relatedToName || '');
      setContactName(call.contactName || '');
      setContactPhone(call.contactPhone || '');
      setCallerPhone(call.callerPhone || localStorage.getItem('crm_outbound_caller_id') || '+91 98765 43210');
      setContactEmail(call.contactEmail || '');
      setAssignedToUserId(call.assignedToUserId || '');
      setAssignedToUserName(call.assignedToUserName || '');
      setScheduledStartTime(
        call.scheduledStartTime ? call.scheduledStartTime.substring(0, 16) : ''
      );
      setDurationMinutes(call.durationMinutes !== undefined ? call.durationMinutes : 15);
      setAgenda(call.agenda || '');
      setNotes(call.notes || '');
      setActionItems(call.actionItems || '');
    }
  }, [call]);

  if (!isOpen || !call) return null;

  const handleEntitySelection = (idStr: string) => {
    if (!idStr) {
      setRelatedToId('');
      setRelatedToName('');
      return;
    }
    const id = Number(idStr);
    setRelatedToId(id);

    if (relatedToType === 'LEAD') {
      const lead = leads.find((l) => l.id === id);
      if (lead) {
        setRelatedToName(`${lead.firstName} ${lead.lastName} (${lead.company || 'Lead'})`);
        setContactName(`${lead.firstName} ${lead.lastName}`);
        setContactPhone(lead.phone || '');
        setContactEmail(lead.email || '');
      }
    } else if (relatedToType === 'CUSTOMER') {
      const cust = customers.find((c) => c.id === id);
      if (cust) {
        setRelatedToName(cust.name);
        setContactName(cust.contactPerson || '');
        setContactPhone(cust.phone || '');
        setContactEmail(cust.email || '');
      }
    } else if (relatedToType === 'CONTACT') {
      const ct = contacts.find((c) => c.id === id);
      if (ct) {
        setRelatedToName(ct.customerName ? `${ct.fullName} (${ct.customerName})` : ct.fullName);
        setContactName(ct.fullName);
        setContactPhone(ct.phone || ct.mobile || '');
        setContactEmail(ct.email || '');
      }
    }
  };

  const handleAgentChange = (userIdStr: string) => {
    if (!userIdStr) {
      setAssignedToUserId('');
      setAssignedToUserName('');
      return;
    }
    const uid = Number(userIdStr);
    setAssignedToUserId(uid);
    const agent = teamMembers.find((m) => m.id === uid);
    if (agent) {
      setAssignedToUserName(agent.name);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) {
      setError('Please provide a call title or subject');
      return;
    }

    try {
      setSubmitting(true);
      setError(null);

      const payload: UpdateCallRequest = {
        title: title.trim(),
        callType,
        status,
        purpose,
        outcome: outcome ? (outcome as CallOutcome) : undefined,
        relatedToType,
        relatedToId: relatedToId ? Number(relatedToId) : undefined,
        relatedToName: relatedToName || undefined,
        contactName: contactName || undefined,
        contactPhone: contactPhone || undefined,
        callerPhone: callerPhone || undefined,
        contactEmail: contactEmail || undefined,
        assignedToUserId: assignedToUserId ? Number(assignedToUserId) : undefined,
        assignedToUserName: assignedToUserName || undefined,
        scheduledStartTime: scheduledStartTime ? new Date(scheduledStartTime).toISOString() : undefined,
        durationMinutes: durationMinutes ? Number(durationMinutes) : undefined,
        agenda: agenda || undefined,
        notes: notes || undefined,
        actionItems: actionItems || undefined,
      };

      await onSubmit(call.id, payload);
      onClose();
    } catch (err: any) {
      setError(err?.response?.data?.message || err.message || 'Failed to update call log');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <ModalPortal>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
      <div className="bg-slate-900 border border-slate-800 w-full max-w-2xl rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-slate-950/40 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400">
              <PhoneCall className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-white">Edit Call #{call.id}</h2>
              <p className="text-xs text-slate-400">Modify call details, status, outcome, or scheduling</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-200 hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scrollable Form Body */}
        <form onSubmit={handleSubmit} id="edit-call-form" className="flex-1 overflow-y-auto p-6 space-y-4">
          {error && (
            <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-xs text-rose-300">
              {error}
            </div>
          )}

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5">
              Call Subject / Title <span className="text-rose-400">*</span>
            </label>
            <input
              type="text"
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full px-3.5 py-2 rounded-xl bg-slate-950/60 border border-slate-800 focus:border-indigo-500 text-xs text-slate-100 placeholder-slate-500"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">Call Type</label>
              <select
                value={callType}
                onChange={(e) => setCallType(e.target.value as CallType)}
                className="w-full px-3 py-2 rounded-xl bg-slate-950/60 border border-slate-800 text-xs text-slate-200"
              >
                <option value="OUTBOUND">Outbound</option>
                <option value="INBOUND">Inbound</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">Status</label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value as CallStatus)}
                className="w-full px-3 py-2 rounded-xl bg-slate-950/60 border border-slate-800 text-xs text-slate-200"
              >
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
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">Purpose</label>
              <select
                value={purpose}
                onChange={(e) => setPurpose(e.target.value as CallPurpose)}
                className="w-full px-3 py-2 rounded-xl bg-slate-950/60 border border-slate-800 text-xs text-slate-200"
              >
                <option value="DISCOVERY">Discovery</option>
                <option value="PRODUCT_DEMO">Product Demo</option>
                <option value="PROSPECTING">Prospecting</option>
                <option value="FOLLOW_UP">Follow-Up</option>
                <option value="NEGOTIATION">Negotiation</option>
                <option value="SUPPORT">Support</option>
                <option value="ONBOARDING">Onboarding</option>
                <option value="CHECK_IN">Check-In</option>
                <option value="CLOSING">Closing</option>
                <option value="OTHER">Other</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">Call Outcome</label>
              <select
                value={outcome}
                onChange={(e) => setOutcome(e.target.value as CallOutcome)}
                className="w-full px-3 py-2 rounded-xl bg-slate-950/60 border border-slate-800 text-xs text-slate-200"
              >
                <option value="">-- No Outcome Logged --</option>
                <option value="INTERESTED">Interested & Engaged</option>
                <option value="MEETING_BOOKED">Meeting Booked</option>
                <option value="QUOTE_REQUESTED">Quote Requested</option>
                <option value="DEAL_CLOSED">Deal Closed Won</option>
                <option value="ISSUE_RESOLVED">Issue Resolved</option>
                <option value="CALLBACK_REQUESTED">Callback Requested</option>
                <option value="LEFT_VOICEMAIL">Left Voicemail</option>
                <option value="NOT_INTERESTED">Not Interested</option>
                <option value="BUSY_NO_ANSWER">Busy / No Answer</option>
                <option value="WRONG_NUMBER">Wrong Number</option>
                <option value="OTHER">Other</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">Duration (Minutes)</label>
              <input
                type="number"
                min="0"
                value={durationMinutes}
                onChange={(e) => setDurationMinutes(e.target.value ? Number(e.target.value) : '')}
                className="w-full px-3 py-2 rounded-xl bg-slate-950/60 border border-slate-800 text-xs text-slate-200"
              />
            </div>
          </div>

          {/* Related Entity Block */}
          <div className="p-4 rounded-xl bg-slate-950/40 border border-slate-800/80 space-y-3">
            <div className="text-xs font-semibold text-indigo-400 flex items-center gap-1.5">
              <Layers className="w-3.5 h-3.5" />
              Related CRM Entity & Participant
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-[11px] font-medium text-slate-400 mb-1">Entity Type</label>
                <select
                  value={relatedToType}
                  onChange={(e) => setRelatedToType(e.target.value as RelatedEntityType)}
                  className="w-full px-3 py-2 rounded-lg bg-slate-900 border border-slate-800 text-xs text-slate-200"
                >
                  <option value="GENERAL">General</option>
                  <option value="LEAD">Lead</option>
                  <option value="CUSTOMER">Customer</option>
                  <option value="CONTACT">Contact</option>
                  <option value="DEAL">Deal</option>
                </select>
              </div>

              <div>
                <label className="block text-[11px] font-medium text-slate-400 mb-1">Select Record</label>
                {relatedToType === 'LEAD' ? (
                  <select
                    value={relatedToId}
                    onChange={(e) => handleEntitySelection(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg bg-slate-900 border border-slate-800 text-xs text-slate-200"
                  >
                    <option value="">-- Choose Lead --</option>
                    {leads.map((l) => (
                      <option key={l.id} value={l.id}>
                        {l.firstName} {l.lastName} ({l.company || 'Lead'})
                      </option>
                    ))}
                  </select>
                ) : relatedToType === 'CUSTOMER' ? (
                  <select
                    value={relatedToId}
                    onChange={(e) => handleEntitySelection(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg bg-slate-900 border border-slate-800 text-xs text-slate-200"
                  >
                    <option value="">-- Choose Customer --</option>
                    {customers.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name}
                      </option>
                    ))}
                  </select>
                ) : relatedToType === 'CONTACT' ? (
                  <select
                    value={relatedToId}
                    onChange={(e) => handleEntitySelection(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg bg-slate-900 border border-slate-800 text-xs text-slate-200"
                  >
                    <option value="">-- Choose Contact --</option>
                    {contacts.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.fullName} {c.customerName ? `(${c.customerName})` : ''}
                      </option>
                    ))}
                  </select>
                ) : (
                  <input
                    type="text"
                    value={relatedToName}
                    onChange={(e) => setRelatedToName(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg bg-slate-900 border border-slate-800 text-xs text-slate-200"
                  />
                )}
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 pt-1">
              <div>
                <label className="block text-[11px] font-medium text-slate-400 mb-1">Contact Name</label>
                <input
                  type="text"
                  value={contactName}
                  onChange={(e) => setContactName(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg bg-slate-900 border border-slate-800 text-xs text-slate-200"
                />
              </div>
              <div>
                <label className="block text-[11px] font-medium text-slate-400 mb-1">Destination Phone (To)</label>
                <input
                  type="tel"
                  value={contactPhone}
                  onChange={(e) => setContactPhone(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg bg-slate-900 border border-slate-800 text-xs text-slate-200"
                />
              </div>
              <div>
                <label className="block text-[11px] font-medium text-indigo-400 mb-1">Call From (Your Number)</label>
                <input
                  type="tel"
                  value={callerPhone}
                  onChange={(e) => setCallerPhone(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg bg-slate-900 border border-indigo-500/40 text-xs text-indigo-200"
                />
              </div>
              <div>
                <label className="block text-[11px] font-medium text-slate-400 mb-1">Assigned Agent</label>
                <select
                  value={assignedToUserId}
                  onChange={(e) => handleAgentChange(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg bg-slate-900 border border-slate-800 text-xs text-slate-200"
                >
                  <option value="">-- Assign to Agent --</option>
                  {teamMembers.map((u) => (
                    <option key={u.id} value={u.id}>
                      {u.name} ({u.role})
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">Scheduled Time</label>
              <input
                type="datetime-local"
                value={scheduledStartTime}
                onChange={(e) => setScheduledStartTime(e.target.value)}
                className="w-full px-3 py-2 rounded-xl bg-slate-950/60 border border-slate-800 text-xs text-slate-200"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">Action Items / Next Steps</label>
              <input
                type="text"
                value={actionItems}
                onChange={(e) => setActionItems(e.target.value)}
                className="w-full px-3 py-2 rounded-xl bg-slate-950/60 border border-slate-800 text-xs text-slate-200"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5">Notes & Call Summary</label>
            <textarea
              rows={3}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="w-full px-3.5 py-2 rounded-xl bg-slate-950/60 border border-slate-800 text-xs text-slate-200 resize-none"
            />
          </div>
        </form>

        {/* Fixed Footer */}
        <div className="px-6 py-4 border-t border-slate-800 bg-slate-950/40 flex items-center justify-end gap-3 shrink-0">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-xl text-xs font-medium text-slate-300 hover:bg-slate-800 transition-colors"
          >
            Cancel
          </button>
          <button
            type="submit"
            form="edit-call-form"
            disabled={submitting}
            className="px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-xs font-semibold text-white shadow-lg shadow-indigo-600/30 transition-all"
          >
            {submitting ? 'Updating...' : 'Update Call Log'}
          </button>
        </div>
      </div>
    </div>
    </ModalPortal>
  );
};
