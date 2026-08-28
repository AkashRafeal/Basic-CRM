import { ModalPortal } from '../ModalPortal';
import React, { useState, useEffect } from 'react';
import { CreateFollowUpRequest, FollowUpChannel, FollowUpPriority, TargetType } from '../../types/followup';
import { Product } from '../../types/product';
import { productApi } from '../../api/productApi';
import { User } from '../../types/auth';
import { X, PhoneCall, User as UserIcon, Link2, FileText, Package } from 'lucide-react';

interface CreateFollowUpModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: CreateFollowUpRequest) => Promise<void>;
  users: User[];
}

export const CreateFollowUpModal: React.FC<CreateFollowUpModalProps> = ({
  isOpen,
  onClose,
  onSubmit,
  users,
}) => {
  const getDefaultDateTime = () => {
    const d = new Date();
    d.setHours(d.getHours() + 2, 0, 0, 0);
    return d.toISOString().slice(0, 16);
  };

  const [formData, setFormData] = useState<CreateFollowUpRequest>({
    title: '',
    channel: 'PHONE_CALL',
    scheduledAt: getDefaultDateTime(),
    priority: 'MEDIUM',
    notes: '',
    assignedToUserId: undefined,
    assignedToUserName: '',
    targetType: 'LEAD',
    targetId: undefined,
    targetName: '',
    productId: undefined,
    productName: '',
  });

  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      setFormData({
        title: '',
        channel: 'PHONE_CALL',
        scheduledAt: getDefaultDateTime(),
        priority: 'MEDIUM',
        notes: '',
        assignedToUserId: undefined,
        assignedToUserName: '',
        targetType: 'LEAD',
        targetId: undefined,
        targetName: '',
        productId: undefined,
        productName: '',
      });
      setError(null);
      productApi.getProducts({ status: 'ACTIVE' })
        .then(res => {
          if (res.data) setProducts(res.data);
        })
        .catch(err => console.error('Failed to load products:', err));
    }
  }, [isOpen]);

  const handleProductSelect = (productIdStr: string) => {
    if (!productIdStr) {
      setFormData(prev => ({ ...prev, productId: undefined, productName: '' }));
      return;
    }
    const selected = products.find(p => p.id === Number(productIdStr));
    setFormData(prev => ({
      ...prev,
      productId: selected ? selected.id : undefined,
      productName: selected ? selected.name : '',
    }));
  };

  if (!isOpen) return null;

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
    if (!formData.title.trim()) {
      setError('Follow-up title/topic is required.');
      return;
    }
    if (!formData.scheduledAt) {
      setError('Scheduled date and time are required.');
      return;
    }

    try {
      setLoading(true);
      setError(null);
      // Format to ISO local string (YYYY-MM-DDTHH:mm:ss)
      const formatted = {
        ...formData,
        scheduledAt: formData.scheduledAt.length === 16 ? `${formData.scheduledAt}:00` : formData.scheduledAt,
      };
      await onSubmit(formatted);
      onClose();
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to schedule follow-up.');
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
              <h3 className="text-base font-bold text-slate-100">Schedule Follow-up Touchpoint</h3>
              <p className="text-xs text-slate-400 mt-0.5">Plan prospect calls, client meetings, or cadence emails</p>
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
              placeholder="e.g. Discuss Q3 Custom Enterprise Licensing & Security SLA"
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
              <div className="relative">
                <input
                  type="datetime-local"
                  required
                  value={formData.scheduledAt}
                  onChange={(e) => setFormData({ ...formData, scheduledAt: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-slate-200 text-sm focus:outline-none focus:border-indigo-500"
                />
              </div>
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
                placeholder="e.g. Tony Stark / Stark Industries"
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
              Related Product / Course (Optional)
            </label>
            <div className="relative">
              <Package className="w-4 h-4 text-indigo-400 absolute left-3 top-3" />
              <select
                value={formData.productId || ''}
                onChange={(e) => handleProductSelect(e.target.value)}
                className="w-full pl-9 pr-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-slate-200 text-sm focus:outline-none focus:border-indigo-500"
              >
                <option value="">-- No Specific Product / General Follow-up --</option>
                {products.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name} (₹{p.unitPrice?.toLocaleString('en-IN')})
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5">
              Talking Points & Preparation Notes
            </label>
            <div className="relative">
              <FileText className="w-4 h-4 text-slate-500 absolute left-3 top-3" />
              <textarea
                rows={3}
                value={formData.notes || ''}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                placeholder="Meeting agenda, client pain points, discount limits, key objectives..."
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
              {loading ? 'Scheduling...' : 'Schedule Follow-up'}
            </button>
          </div>
        </form>
      </div>
    </div>
    </ModalPortal>
  );
};
