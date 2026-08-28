import { ModalPortal } from '../ModalPortal';
import React, { useState } from 'react';
import { X, Activity, Calendar, Clock, FileText, Phone, Mail, MessageSquare, CheckCircle } from 'lucide-react';
import { CreateActivityPayload, ActivityType, EntityType } from '../../types/activity';

interface LogActivityModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (payload: CreateActivityPayload) => Promise<void>;
  defaultEntityType?: EntityType;
  defaultEntityId?: number;
  defaultEntityTitle?: string;
}

const ACTIVITY_TYPE_OPTIONS: { id: ActivityType; label: string; icon: any; color: string }[] = [
  { id: 'MEETING_SCHEDULED', label: 'Client Meeting / Discussion', icon: Calendar, color: 'text-indigo-400' },
  { id: 'CALL_LOGGED', label: 'Phone Call Interaction', icon: Phone, color: 'text-emerald-400' },
  { id: 'EMAIL_SENT', label: 'Email Communication', icon: Mail, color: 'text-blue-400' },
  { id: 'SMS_SENT', label: 'SMS / Instant Message', icon: MessageSquare, color: 'text-amber-400' },
  { id: 'STAGE_CHANGED', label: 'Pipeline Stage Progress', icon: Clock, color: 'text-purple-400' },
  { id: 'TASK_COMPLETED', label: 'Task Milestone Completed', icon: CheckCircle, color: 'text-teal-400' },
  { id: 'CUSTOM_ACTIVITY', label: 'Custom Business Touchpoint', icon: FileText, color: 'text-rose-400' },
];

export const LogActivityModal: React.FC<LogActivityModalProps> = ({
  isOpen,
  onClose,
  onSubmit,
  defaultEntityType = 'GENERAL',
  defaultEntityId,
  defaultEntityTitle = '',
}) => {
  const [activityType, setActivityType] = useState<ActivityType>('MEETING_SCHEDULED');
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [entityType, setEntityType] = useState<EntityType>(defaultEntityType);
  const [entityId, setEntityId] = useState<number | undefined>(defaultEntityId);
  const [entityTitle, setEntityTitle] = useState(defaultEntityTitle);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  React.useEffect(() => {
    if (isOpen) {
      setActivityType('MEETING_SCHEDULED');
      setTitle('');
      setDescription('');
      setEntityType(defaultEntityType);
      setEntityId(defaultEntityId);
      setEntityTitle(defaultEntityTitle || '');
      setError(null);
    }
  }, [isOpen, defaultEntityType, defaultEntityId, defaultEntityTitle]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) {
      setError('Activity title is required');
      return;
    }

    try {
      setLoading(true);
      setError(null);
      await onSubmit({
        activityType,
        title: title.trim(),
        description: description.trim() || undefined,
        entityType,
        entityId: entityId || undefined,
        entityTitle: entityTitle.trim() || undefined,
      });
      setTitle('');
      setDescription('');
      onClose();
    } catch (err: any) {
      setError(err?.response?.data?.message || err?.message || 'Failed to log activity');
    } finally {
      setLoading(false);
    }
  };

  return (
    <ModalPortal>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-fade-in">
      <div className="relative w-full max-w-xl bg-slate-900/95 border border-slate-700/80 rounded-2xl shadow-2xl overflow-hidden backdrop-blur-xl">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-slate-800/40">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-gradient-to-tr from-emerald-500 to-teal-500 rounded-xl shadow-lg">
              <Activity className="w-5 h-5 text-white" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-white">Log Activity Touchpoint</h2>
              <p className="text-xs text-slate-400">Record client interaction, meeting or event to the audit timeline</p>
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

          {/* Activity Type Selector */}
          <div>
            <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2">
              Select Activity Classification
            </label>
            <div className="grid grid-cols-2 gap-2">
              {ACTIVITY_TYPE_OPTIONS.map((opt) => {
                const Icon = opt.icon;
                const isSelected = activityType === opt.id;
                return (
                  <button
                    key={opt.id}
                    type="button"
                    onClick={() => setActivityType(opt.id)}
                    className={`flex items-center space-x-2.5 p-2.5 rounded-xl border text-left text-xs transition-all ${
                      isSelected
                        ? 'bg-emerald-500/15 border-emerald-500/60 text-white shadow-md'
                        : 'bg-slate-800/50 border-slate-800 text-slate-400 hover:text-white hover:bg-slate-800'
                    }`}
                  >
                    <Icon className={`w-4 h-4 ${opt.color}`} />
                    <span className="truncate">{opt.label}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Title */}
          <div>
            <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
              Activity Summary / Headline *
            </label>
            <input
              type="text"
              required
              placeholder="e.g. In-Person Contract Review Meeting"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full px-4 py-2.5 bg-slate-800/80 border border-slate-700 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/50"
            />
          </div>

          {/* Description */}
          <div>
            <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
              Key Details & Outcomes
            </label>
            <textarea
              rows={3}
              placeholder="Record takeaways, attendees, decisions made, or follow-up action items..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full px-4 py-2 bg-slate-800/80 border border-slate-700 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/50 resize-y"
            />
          </div>

          {/* Entity Linkage */}
          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="block text-xs font-medium text-slate-400 mb-1">Entity Type</label>
              <select
                value={entityType}
                onChange={(e) => setEntityType(e.target.value as EntityType)}
                className="w-full px-3 py-2 bg-slate-800/80 border border-slate-700 rounded-xl text-white text-xs focus:outline-none focus:ring-2 focus:ring-emerald-500/50"
              >
                <option value="GENERAL">General</option>
                <option value="CUSTOMER">Customer</option>
                <option value="DEAL">Deal</option>
                <option value="LEAD">Lead</option>
                <option value="CONTACT">Contact</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-400 mb-1">Entity ID</label>
              <input
                type="number"
                placeholder="e.g. 1"
                value={entityId || ''}
                onChange={(e) => setEntityId(e.target.value ? parseInt(e.target.value) : undefined)}
                className="w-full px-3 py-2 bg-slate-800/80 border border-slate-700 rounded-xl text-white text-xs focus:outline-none focus:ring-2 focus:ring-emerald-500/50"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-400 mb-1">Entity Title</label>
              <input
                type="text"
                placeholder="e.g. Acme Corp"
                value={entityTitle}
                onChange={(e) => setEntityTitle(e.target.value)}
                className="w-full px-3 py-2 bg-slate-800/80 border border-slate-700 rounded-xl text-white text-xs focus:outline-none focus:ring-2 focus:ring-emerald-500/50"
              />
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
              disabled={loading}
              className="px-6 py-2.5 bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white text-sm font-semibold rounded-xl shadow-lg shadow-emerald-500/25 transition-all disabled:opacity-50"
            >
              {loading ? 'Logging Activity...' : 'Log Activity'}
            </button>
          </div>
        </form>
      </div>
    </div>
    </ModalPortal>
  );
};
