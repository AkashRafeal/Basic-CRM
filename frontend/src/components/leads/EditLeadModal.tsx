import { ModalPortal } from '../ModalPortal';
import React, { useState, useEffect } from 'react';
import { Lead, UpdateLeadRequest, LeadStatus, LeadSource } from '../../types/lead';
import { User } from '../../types/auth';
import { Product } from '../../types/product';
import { productApi } from '../../api/productApi';
import { validatePhoneNumber } from '../../utils/validation';
import { X, IndianRupee, Award, Building, User as UserIcon, Mail, Phone, Briefcase, FileText, Package, Check } from 'lucide-react';

interface EditLeadModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (id: number, data: UpdateLeadRequest) => Promise<void>;
  lead: Lead | null;
  users: User[];
}

export const EditLeadModal: React.FC<EditLeadModalProps> = ({
  isOpen,
  onClose,
  onSubmit,
  lead,
  users
}) => {
  const [formData, setFormData] = useState<UpdateLeadRequest>({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    company: '',
    jobTitle: '',
    leadStatus: 'NEW',
    leadSource: 'WEBSITE',
    estimatedValue: 0,
    score: 50,
    notes: '',
    assignedToUserId: undefined,
    assignedToUserName: '',
    interestedProductIds: []
  });

  const [products, setProducts] = useState<Product[]>([]);
  const [productSearch, setProductSearch] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      productApi.getProducts({ status: 'ACTIVE' })
        .then(res => {
          if (res.data) setProducts(res.data);
        })
        .catch(err => console.error('Failed to load products:', err));
    }
  }, [isOpen]);

  useEffect(() => {
    if (lead) {
      const existingProductIds = lead.interestedProductIds || (lead.interestedProducts ? lead.interestedProducts.map(p => p.productId) : []);
      setFormData({
        firstName: lead.firstName || '',
        lastName: lead.lastName || '',
        email: lead.email || '',
        phone: lead.phone || '',
        company: lead.company || '',
        jobTitle: lead.jobTitle || '',
        leadStatus: lead.leadStatus,
        leadSource: lead.leadSource,
        estimatedValue: lead.estimatedValue || 0,
        score: lead.score || 50,
        notes: lead.notes || '',
        assignedToUserId: lead.assignedToUserId,
        assignedToUserName: lead.assignedToUserName || '',
        interestedProductIds: existingProductIds
      });
      setError(null);
    }
  }, [lead]);

  const toggleProduct = (prod: Product) => {
    const currentIds = formData.interestedProductIds || [];
    const exists = currentIds.includes(prod.id);
    let newIds: number[];
    if (exists) {
      newIds = currentIds.filter(id => id !== prod.id);
    } else {
      newIds = [...currentIds, prod.id];
    }
    
    // Auto-calculate estimated value from selected products
    const newEstimatedVal = products
      .filter(p => newIds.includes(p.id))
      .reduce((sum, p) => sum + (p.unitPrice || 0), 0);

    setFormData(prev => ({
      ...prev,
      interestedProductIds: newIds,
      estimatedValue: newEstimatedVal > 0 ? newEstimatedVal : prev.estimatedValue
    }));
  };

  if (!isOpen || !lead) return null;

  const handleUserSelect = (userIdStr: string) => {
    if (!userIdStr) {
      setFormData(prev => ({ ...prev, assignedToUserId: undefined, assignedToUserName: '' }));
      return;
    }
    const selected = users.find(u => u.id === Number(userIdStr));
    setFormData(prev => ({
      ...prev,
      assignedToUserId: selected ? selected.id : undefined,
      assignedToUserName: selected ? selected.name : ''
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (formData.phone && formData.phone.trim()) {
      const phoneCheck = validatePhoneNumber(formData.phone);
      if (!phoneCheck.isValid) {
        setError(phoneCheck.error || 'Phone number must be exactly 10 digits.');
        return;
      }
    }
    try {
      setLoading(true);
      setError(null);
      const cleanPhone = formData.phone && formData.phone.trim() ? validatePhoneNumber(formData.phone).cleanPhone : '';
      await onSubmit(lead.id, {
        ...formData,
        phone: cleanPhone
      });
      onClose();
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to update lead.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <ModalPortal>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-fade-in">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-2xl overflow-hidden shadow-2xl animate-scale-up max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-slate-900/50">
          <div>
            <h3 className="text-lg font-bold text-slate-100">Edit Lead: {lead.fullName}</h3>
            <p className="text-xs text-slate-400 mt-0.5">Update contact details, sales stage, and prospect notes</p>
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

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                First Name *
              </label>
              <div className="relative">
                <UserIcon className="w-4 h-4 text-slate-500 absolute left-3 top-3" />
                <input
                  type="text"
                  required
                  value={formData.firstName}
                  onChange={e => setFormData({ ...formData, firstName: e.target.value })}
                  className="w-full pl-9 pr-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-slate-200 text-sm focus:outline-none focus:border-indigo-500"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                Last Name
              </label>
              <div className="relative">
                <UserIcon className="w-4 h-4 text-slate-500 absolute left-3 top-3" />
                <input
                  type="text"
                  value={formData.lastName}
                  onChange={e => setFormData({ ...formData, lastName: e.target.value })}
                  placeholder="Optional"
                  className="w-full pl-9 pr-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-slate-200 text-sm focus:outline-none focus:border-indigo-500"
                />
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                Email Address *
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 text-slate-500 absolute left-3 top-3" />
                <input
                  type="email"
                  required
                  value={formData.email}
                  onChange={e => setFormData({ ...formData, email: e.target.value })}
                  className="w-full pl-9 pr-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-slate-200 text-sm focus:outline-none focus:border-indigo-500"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                Phone Number (10 Digits)
              </label>
              <div className="relative">
                <Phone className="w-4 h-4 text-slate-500 absolute left-3 top-3" />
                <input
                  type="tel"
                  maxLength={10}
                  value={formData.phone || ''}
                  onChange={e => setFormData({ ...formData, phone: e.target.value.replace(/\D/g, '') })}
                  placeholder="9876543210"
                  className="w-full pl-9 pr-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-slate-200 text-sm focus:outline-none focus:border-indigo-500 font-mono"
                />
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                Company
              </label>
              <div className="relative">
                <Building className="w-4 h-4 text-slate-500 absolute left-3 top-3" />
                <input
                  type="text"
                  value={formData.company || ''}
                  onChange={e => setFormData({ ...formData, company: e.target.value })}
                  className="w-full pl-9 pr-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-slate-200 text-sm focus:outline-none focus:border-indigo-500"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                Job Title
              </label>
              <div className="relative">
                <Briefcase className="w-4 h-4 text-slate-500 absolute left-3 top-3" />
                <input
                  type="text"
                  value={formData.jobTitle || ''}
                  onChange={e => setFormData({ ...formData, jobTitle: e.target.value })}
                  className="w-full pl-9 pr-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-slate-200 text-sm focus:outline-none focus:border-indigo-500"
                />
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                Pipeline Stage
              </label>
              <select
                value={formData.leadStatus}
                onChange={e => setFormData({ ...formData, leadStatus: e.target.value as LeadStatus })}
                className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-slate-200 text-sm focus:outline-none focus:border-indigo-500"
              >
                <option value="NEW">New Lead</option>
                <option value="CONTACTED">Contacted</option>
                <option value="QUALIFIED">Qualified</option>
                <option value="PROPOSAL_SENT">Proposal Sent</option>
                <option value="NEGOTIATING">Negotiating</option>
                <option value="CONVERTED">Converted</option>
                <option value="LOST">Lost</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                Lead Source
              </label>
              <select
                value={formData.leadSource}
                onChange={e => setFormData({ ...formData, leadSource: e.target.value as LeadSource })}
                className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-slate-200 text-sm focus:outline-none focus:border-indigo-500"
              >
                <option value="WEBSITE">Website Inbound</option>
                <option value="REFERRAL">Referral</option>
                <option value="COLD_CALL">Outbound / Cold Call</option>
                <option value="EMAIL_CAMPAIGN">Email Campaign</option>
                <option value="SOCIAL_MEDIA">Social Media</option>
                <option value="EVENT">Conference / Event</option>
                <option value="OTHER">Other</option>
              </select>
            </div>
          </div>

          {/* Interested Products / Courses */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="block text-xs font-semibold text-slate-300 flex items-center gap-1.5">
                <Package className="w-3.5 h-3.5 text-indigo-400" />
                Interested Products / Services
              </label>
              {formData.interestedProductIds && formData.interestedProductIds.length > 0 && (
                <span className="text-[11px] font-medium text-indigo-400 bg-indigo-500/10 px-2 py-0.5 rounded-full border border-indigo-500/20">
                  {formData.interestedProductIds.length} Selected
                </span>
              )}
            </div>

            {/* Search filter for products */}
            {products.length > 5 && (
              <input
                type="text"
                placeholder="Search products & courses..."
                value={productSearch}
                onChange={e => setProductSearch(e.target.value)}
                className="w-full px-3 py-1.5 bg-slate-950/60 border border-slate-800 rounded-lg text-slate-200 text-xs focus:outline-none focus:border-indigo-500 mb-2"
              />
            )}

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-36 overflow-y-auto pr-1">
              {products
                .filter(p => !productSearch || p.name.toLowerCase().includes(productSearch.toLowerCase()) || (p.category && p.category.toLowerCase().includes(productSearch.toLowerCase())))
                .map(prod => {
                  const isSelected = (formData.interestedProductIds || []).includes(prod.id);
                  return (
                    <div
                      key={prod.id}
                      onClick={() => toggleProduct(prod)}
                      className={`flex items-center justify-between p-2.5 rounded-xl border cursor-pointer transition-all ${
                        isSelected
                          ? 'bg-indigo-600/15 border-indigo-500/50 text-indigo-200 shadow-sm shadow-indigo-500/10'
                          : 'bg-slate-950/50 border-slate-800 text-slate-300 hover:border-slate-700 hover:bg-slate-800/40'
                      }`}
                    >
                      <div className="flex items-center space-x-2.5 overflow-hidden">
                        <div className={`w-4 h-4 rounded flex items-center justify-center border transition-colors ${
                          isSelected ? 'bg-indigo-600 border-indigo-500 text-white' : 'border-slate-700 bg-slate-900'
                        }`}>
                          {isSelected && <Check className="w-3 h-3 stroke-[3]" />}
                        </div>
                        <div className="truncate">
                          <p className="text-xs font-semibold truncate">{prod.name}</p>
                          <p className="text-[10px] text-slate-400 flex items-center gap-1">
                            <span className="text-indigo-400 font-medium">{prod.category || 'General'}</span>
                            <span>•</span>
                            <span className="text-emerald-400 font-medium">₹{prod.unitPrice?.toLocaleString('en-IN')}</span>
                          </p>
                        </div>
                      </div>
                    </div>
                  );
                })}
              {products.length === 0 && (
                <div className="col-span-2 text-center py-3 text-xs text-slate-500 bg-slate-950/40 rounded-xl border border-slate-800/60">
                  No active products available in catalog.
                </div>
              )}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                Estimated Value (₹)
              </label>
              <div className="relative">
                <IndianRupee className="w-4 h-4 text-emerald-400 absolute left-3 top-3" />
                <input
                  type="number"
                  min="0"
                  step="500"
                  value={formData.estimatedValue || ''}
                  onChange={e => setFormData({ ...formData, estimatedValue: Number(e.target.value) })}
                  className="w-full pl-9 pr-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-slate-200 text-sm focus:outline-none focus:border-indigo-500"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                Lead Score (0-100)
              </label>
              <div className="relative">
                <Award className="w-4 h-4 text-amber-400 absolute left-3 top-3" />
                <input
                  type="number"
                  min="0"
                  max="100"
                  value={formData.score || 50}
                  onChange={e => setFormData({ ...formData, score: Number(e.target.value) })}
                  className="w-full pl-9 pr-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-slate-200 text-sm focus:outline-none focus:border-indigo-500"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                Assign Representative
              </label>
              <select
                value={formData.assignedToUserId || ''}
                onChange={e => handleUserSelect(e.target.value)}
                className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-slate-200 text-sm focus:outline-none focus:border-indigo-500"
              >
                <option value="">-- Unassigned --</option>
                {users.map(u => (
                  <option key={u.id} value={u.id}>
                    {u.name} ({u.roleName})
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5">
              Prospect Notes & Details
            </label>
            <div className="relative">
              <FileText className="w-4 h-4 text-slate-500 absolute left-3 top-3" />
              <textarea
                rows={3}
                value={formData.notes || ''}
                onChange={e => setFormData({ ...formData, notes: e.target.value })}
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
