import { ModalPortal } from '../ModalPortal';
import React, { useState, useEffect } from 'react';
import {
  FollowUp,
  UpdateFollowUpRequest,
  FollowUpChannel,
  FollowUpStatus,
  FollowUpOutcome,
  FollowUpPriority,
  TargetType,
} from '../../types/followup';
import { User } from '../../types/auth';
import { X, PhoneCall, User as UserIcon, Link2, FileText } from 'lucide-react';

interface EditFollowUpModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (id: number, data: UpdateFollowUpRequest) => Promise<void>;
  followUp: FollowUp | null;
  users: User[];
}

export const EditFollowUpModal: React.FC<EditFollowUpModalProps> = ({
  isOpen,
  onClose,
  onSubmit,
  followUp,
  users,
}) => {
  const [formData, setFormData] = useState<UpdateFollowUpRequest>({
    title: '',
    channel: 'PHONE_CALL',
    scheduledAt: '',
    status: 'SCHEDULED',
    outcome: 'PENDING',
    priority: 'MEDIUM',
    notes: '',
    nextFollowUpDate: '',
    assignedToUserId: undefined,
    assignedToUserName: '',
    targetType: 'LEAD',
    targetId: undefined,
    targetName: '',
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (followUp) {
      setFormData({
        title: followUp.title || '',
        channel: followUp.channel,
        scheduledAt: followUp.scheduledAt ? followUp.scheduledAt.slice(0, 16) : '',
        status: followUp.status,
        outcome: followUp.outcome,
        priority: followUp.priority,
        notes: followUp.notes || '',
        nextFollowUpDate: followUp.nextFollowUpDate ? followUp.nextFollowUpDate.slice(0, 16) : '',
        assignedToUserId: followUp.assignedToUserId,
        assignedToUserName: followUp.assignedToUserName || '',
        targetType: followUp.targetType,
        targetId: followUp.targetId,
        targetName: followUp.targetName || '',
      });
      setError(null);
    }
  }, [followUp]);

  if (!isOpen || !followUp) return null;

  const handleUserSelect = (userIdStr: string) => {
    if (!userIdStr) {
      setFormData((prev) => ({
        ...prev,
        assignedToUserId: undefined,
        assignedToUserName: '',
      }));
      return;
    }
    const selected = users.find((u) => u.id === Number(userIdStr));
    setFormData((prev) => ({
      ...prev,
      assignedToUserId: selected ? selected.id : undefined,
      assignedToUserName: selected ? selected.name : '',
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setLoading(true);
      setError(null);
      const formatted = {
        ...formData,
        scheduledAt: formData.scheduledAt && formData.scheduledAt.length === 16 ? `${formData.scheduledAt}:00` : formData.scheduledAt,
        nextFollowUpDate: formData.nextFollowUpDate && formData.nextFollowUpDate.length === 16 ? `${formData.nextFollowUpDate}:00` : (formData.nextFollowUpDate || undefined),
      };
      await onSubmit(followUp.id, formatted);
      onClose();
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to update follow-up.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <ModalPortal>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 modal-overlay-blur animate-fade-in">
      <div className="bg-slate-900/95 border border-slate-700/80 rounded-2xl w-full max-w-2xl overflow-hidden shadow-2xl shadow-black/80 animate-scale-up max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-slate-900/50">
          <div className="flex items-center space-x-2.5">
            <div className="w-8 h-8 rounded-xl bg-indigo-600/20 border border-indigo-500/30 flex items-center justify-center text-indigo-400">
              <PhoneCall className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-100">Edit Follow-up Touchpoint</h3>
              <p className="text-xs text-slate-400 mt-0.5">Modify schedule date, channel, or rep assignment</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-200 p-1.5 rounded-lg hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="overflow-y-auto p-6 space-y-4 flex-1">
          {error && (
            <div className="p-3 bg-rose-500/10 border border-rose-500/30 rounded-xl text-rose-400 text-xs">
              {error}
            </div>
          )}

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5">
              Subject / Interaction Goal *
            </label>
            <input
              type="text"
              required
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-slate-200 text-sm focus:outline-none focus:border-indigo-500"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                Channel
              </label>
              <select
                value={formData.channel}
                onChange={(e) => setFormData({ ...formData, channel: e.target.value as FollowUpChannel })}
                className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-slate-200 text-sm focus:outline-none focus:border-indigo-500"
              >
                <option value="PHONE_CALL">Phone Call</option>
                <option value="VIDEO_CONFERENCE">Video Conference</option>
                <option value="EMAIL">Email Outreach</option>
                <option value="IN_PERSON_MEETING">In-Person Meeting</option>
                <option value="WHATSAPP_SMS">WhatsApp / SMS</option>
                <option value="LINKEDIN_MESSAGE">LinkedIn Message</option>
                <option value="OTHER">Other</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                Scheduled Date & Time *
              </label>
              <input
                type="datetime-local"
                required
                value={formData.scheduledAt}
                onChange={(e) => setFormData({ ...formData, scheduledAt: e.target.value })}
                className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-slate-200 text-sm focus:outline-none focus:border-indigo-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                Priority
              </label>
              <select
                value={formData.priority}
                onChange={(e) => setFormData({ ...formData, priority: e.target.value as FollowUpPriority })}
                className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-slate-200 text-sm focus:outline-none focus:border-indigo-500"
              >
                <option value="LOW">Low</option>
                <option value="MEDIUM">Medium</option>
                <option value="HIGH">High</option>
                <option value="URGENT">Urgent</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                Status
              </label>
              <select
                value={formData.status}
                onChange={(e) => setFormData({ ...formData, status: e.target.value as FollowUpStatus })}
                className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-slate-200 text-sm focus:outline-none focus:border-indigo-500"
              >
                <option value="SCHEDULED">Scheduled</option>
                <option value="COMPLETED">Completed</option>
                <option value="MISSED">Missed / Overdue</option>
                <option value="RESCHEDULED">Rescheduled</option>
                <option value="CANCELLED">Cancelled</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                Outcome
              </label>
              <select
                value={formData.outcome}
                onChange={(e) => setFormData({ ...formData, outcome: e.target.value as FollowUpOutcome })}
                className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-slate-200 text-sm focus:outline-none focus:border-indigo-500"
              >
                <option value="PENDING">Pending</option>
                <option value="INTERESTED">Interested</option>
                <option value="PROPOSAL_REQUESTED">Proposal Requested</option>
                <option value="MEETING_BOOKED">Meeting Booked</option>
                <option value="CALLBACK_REQUESTED">Callback Requested</option>
                <option value="DEAL_WON">Deal Won</option>
                <option value="NOT_INTERESTED">Not Interested</option>
                <option value="NO_ANSWER">No Answer</option>
                <option value="DEAL_LOST">Deal Lost</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                Target Entity Type
              </label>
              <div className="relative">
                <Link2 className="w-4 h-4 text-slate-500 absolute left-3 top-3" />
                <select
                  value={formData.targetType}
                  onChange={(e) => setFormData({ ...formData, targetType: e.target.value as TargetType })}
                  className="w-full pl-9 pr-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-slate-200 text-sm focus:outline-none focus:border-indigo-500"
                >
                  <option value="LEAD">Sales Lead</option>
                  <option value="CUSTOMER">Customer Account</option>
                  <option value="CONTACT">Individual Contact</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                Target Name / Account
              </label>
              <input
                type="text"
                value={formData.targetName || ''}
                onChange={(e) => setFormData({ ...formData, targetName: e.target.value })}
                className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-slate-200 text-sm focus:outline-none focus:border-indigo-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5">
              Assigned Sales Rep
            </label>
            <div className="relative">
              <UserIcon className="w-4 h-4 text-slate-500 absolute left-3 top-3" />
              <select
                value={formData.assignedToUserId || ''}
                onChange={(e) => handleUserSelect(e.target.value)}
                className="w-full pl-9 pr-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-slate-200 text-sm focus:outline-none focus:border-indigo-500"
              >
                <option value="">-- Unassigned --</option>
                {users.map((u) => (
                  <option key={u.id} value={u.id}>
                    {u.name} ({u.roleName})
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5">
              Notes & Discussion Logs
            </label>
            <div className="relative">
              <FileText className="w-4 h-4 text-slate-500 absolute left-3 top-3" />
              <textarea
                rows={3}
                value={formData.notes || ''}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                className="w-full pl-9 pr-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-slate-200 text-sm focus:outline-none focus:border-indigo-500"
              />
            </div>
          </div>

          {/* Footer */}
          <div className="flex items-center justify-end space-x-3 pt-4 border-t border-slate-800">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 text-sm font-medium rounded-xl transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-5 py-2 bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-semibold rounded-xl shadow-lg shadow-indigo-500/20 transition-all disabled:opacity-50"
            >
              {loading ? 'Saving Changes...' : 'Save Changes'}
            </button>
          </div>
        </form>
      </div>
    </div>
    </ModalPortal>
  );
};
