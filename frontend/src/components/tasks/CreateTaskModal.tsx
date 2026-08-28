import { ModalPortal } from '../ModalPortal';
import React, { useState, useEffect } from 'react';
import { CreateTaskRequest, TaskStatus, TaskPriority, TaskType, RelatedEntityType } from '../../types/task';
import { Product } from '../../types/product';
import { productApi } from '../../api/productApi';
import { User } from '../../types/auth';
import { X, CheckSquare, Calendar, User as UserIcon, Link2, FileText, Package } from 'lucide-react';

interface CreateTaskModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: CreateTaskRequest) => Promise<void>;
  users: User[];
}

export const CreateTaskModal: React.FC<CreateTaskModalProps> = ({
  isOpen,
  onClose,
  onSubmit,
  users,
}) => {
  const [formData, setFormData] = useState<CreateTaskRequest>({
    title: '',
    description: '',
    taskType: 'FOLLOW_UP',
    priority: 'MEDIUM',
    status: 'TODO',
    dueDate: new Date(Date.now() + 86400000 * 2).toISOString().split('T')[0], // 2 days from now
    assignedToUserId: undefined,
    assignedToUserName: '',
    relatedEntityType: 'GENERAL',
    relatedEntityId: undefined,
    relatedEntityName: '',
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
        description: '',
        taskType: 'FOLLOW_UP',
        priority: 'MEDIUM',
        status: 'TODO',
        dueDate: new Date(Date.now() + 86400000 * 2).toISOString().split('T')[0],
        assignedToUserId: undefined,
        assignedToUserName: '',
        relatedEntityType: 'GENERAL',
        relatedEntityId: undefined,
        relatedEntityName: '',
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
      setError('Task title is required.');
      return;
    }

    try {
      setLoading(true);
      setError(null);
      await onSubmit(formData);
      onClose();
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to create task.');
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
              <CheckSquare className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-100">Create New Activity / Task</h3>
              <p className="text-xs text-slate-400 mt-0.5">Assign sales follow-ups, milestone deadlines, and client meetings</p>
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
              Task Title / Subject *
            </label>
            <input
              type="text"
              required
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              placeholder="e.g. Schedule Q3 Security Audit Presentation"
              className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-slate-200 text-sm focus:outline-none focus:border-indigo-500"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                Task Type
              </label>
              <select
                value={formData.taskType}
                onChange={(e) => setFormData({ ...formData, taskType: e.target.value as TaskType })}
                className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-slate-200 text-sm focus:outline-none focus:border-indigo-500"
              >
                <option value="FOLLOW_UP">Follow-up</option>
                <option value="CALL">Phone Call</option>
                <option value="MEETING">Client Meeting</option>
                <option value="EMAIL">Email Outreach</option>
                <option value="PROPOSAL">Prepare Proposal</option>
                <option value="ONBOARDING">Client Onboarding</option>
                <option value="OTHER">General Task</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                Priority
              </label>
              <select
                value={formData.priority}
                onChange={(e) => setFormData({ ...formData, priority: e.target.value as TaskPriority })}
                className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-slate-200 text-sm focus:outline-none focus:border-indigo-500"
              >
                <option value="LOW">Low</option>
                <option value="MEDIUM">Medium</option>
                <option value="HIGH">High</option>
                <option value="URGENT">Urgent (P0)</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                Status
              </label>
              <select
                value={formData.status}
                onChange={(e) => setFormData({ ...formData, status: e.target.value as TaskStatus })}
                className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-slate-200 text-sm focus:outline-none focus:border-indigo-500"
              >
                <option value="TODO">To Do</option>
                <option value="IN_PROGRESS">In Progress</option>
                <option value="COMPLETED">Completed</option>
                <option value="CANCELLED">Cancelled</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                Due Date
              </label>
              <div className="relative">
                <Calendar className="w-4 h-4 text-slate-500 absolute left-3 top-3" />
                <input
                  type="date"
                  value={formData.dueDate || ''}
                  onChange={(e) => setFormData({ ...formData, dueDate: e.target.value })}
                  className="w-full pl-9 pr-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-slate-200 text-sm focus:outline-none focus:border-indigo-500"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                Assignee
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
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                Link to Related Entity
              </label>
              <div className="relative">
                <Link2 className="w-4 h-4 text-slate-500 absolute left-3 top-3" />
                <select
                  value={formData.relatedEntityType}
                  onChange={(e) => setFormData({ ...formData, relatedEntityType: e.target.value as RelatedEntityType })}
                  className="w-full pl-9 pr-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-slate-200 text-sm focus:outline-none focus:border-indigo-500"
                >
                  <option value="GENERAL">General Activity</option>
                  <option value="LEAD">Sales Lead</option>
                  <option value="CUSTOMER">Customer Account</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                Related Entity Name / Account
              </label>
              <input
                type="text"
                value={formData.relatedEntityName || ''}
                onChange={(e) => setFormData({ ...formData, relatedEntityName: e.target.value })}
                placeholder="e.g. Wayne Enterprises / Bruce Wayne"
                className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-slate-200 text-sm focus:outline-none focus:border-indigo-500"
              />
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
                <option value="">-- No Specific Product / General Task --</option>
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
              Task Notes & Instructions
            </label>
            <div className="relative">
              <FileText className="w-4 h-4 text-slate-500 absolute left-3 top-3" />
              <textarea
                rows={3}
                value={formData.description || ''}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Details, talking points, meeting agenda, or follow-up notes..."
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
              {loading ? 'Creating...' : 'Create Task'}
            </button>
          </div>
        </form>
      </div>
    </div>
    </ModalPortal>
  );
};
