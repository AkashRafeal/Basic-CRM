import { ModalPortal } from '../ModalPortal';
import React, { useState, useEffect } from 'react';
import { CreateCustomerRequest, CustomerStatus, CustomerTier, Industry } from '../../types/customer';
import { User } from '../../types/auth';
import { useAuth } from '../../context/AuthContext';
import { validatePhoneNumber } from '../../utils/validation';
import { X, Building2, User as UserIcon, Mail, Phone, Globe, IndianRupee, MapPin, FileText, Lock } from 'lucide-react';

interface CreateCustomerModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: CreateCustomerRequest) => Promise<void>;
  users: User[];
}

export const CreateCustomerModal: React.FC<CreateCustomerModalProps> = ({
  isOpen,
  onClose,
  onSubmit,
  users,
}) => {
  const { user } = useAuth();
  const isEmployee = user?.role === 'ROLE_EMPLOYEE';

  const [formData, setFormData] = useState<CreateCustomerRequest>({
    name: '',
    contactPerson: '',
    email: '',
    phone: '',
    company: '',
    website: '',
    industry: 'TECHNOLOGY',
    customerTier: 'TIER_3_SMB',
    customerStatus: 'ACTIVE',
    annualRevenue: 50000,
    billingAddress: '',
    notes: '',
    assignedAccountManagerId: isEmployee && user ? user.id : undefined,
    assignedAccountManagerName: isEmployee && user ? user.name : '',
    createdByUserId: user?.id,
    createdByUserName: user?.name,
    createdByRole: user?.role,
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen && user) {
      setFormData(prev => ({
        ...prev,
        assignedAccountManagerId: isEmployee ? user.id : prev.assignedAccountManagerId,
        assignedAccountManagerName: isEmployee ? user.name : prev.assignedAccountManagerName,
        createdByUserId: user.id,
        createdByUserName: user.name,
        createdByRole: user.role,
      }));
    }
  }, [isOpen, user, isEmployee]);

  if (!isOpen) return null;

  const handleManagerSelect = (userIdStr: string) => {
    if (isEmployee) return; // Employees cannot change assignment
    if (!userIdStr) {
      setFormData((prev) => ({
        ...prev,
        assignedAccountManagerId: undefined,
        assignedAccountManagerName: '',
      }));
      return;
    }
    const selected = users.find((u) => u.id === Number(userIdStr));
    setFormData((prev) => ({
      ...prev,
      assignedAccountManagerId: selected ? selected.id : undefined,
      assignedAccountManagerName: selected ? selected.name : '',
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim() || !formData.email.trim()) {
      setError('Customer Name and Email are required.');
      return;
    }

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
      await onSubmit({
        ...formData,
        phone: cleanPhone
      });
      onClose();
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to create customer account.');
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
            <h3 className="text-lg font-bold text-slate-100">Add New Customer Account</h3>
            <p className="text-xs text-slate-400 mt-0.5">Register a new client organisation and set contract revenue</p>
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
                Account / Customer Name *
              </label>
              <div className="relative">
                <Building2 className="w-4 h-4 text-slate-500 absolute left-3 top-3" />
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="e.g. Wayne Enterprises"
                  className="w-full pl-9 pr-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-slate-200 text-sm focus:outline-none focus:border-indigo-500"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                Primary Contact Person
              </label>
              <div className="relative">
                <UserIcon className="w-4 h-4 text-slate-500 absolute left-3 top-3" />
                <input
                  type="text"
                  value={formData.contactPerson || ''}
                  onChange={(e) => setFormData({ ...formData, contactPerson: e.target.value })}
                  placeholder="e.g. Bruce Wayne"
                  className="w-full pl-9 pr-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-slate-200 text-sm focus:outline-none focus:border-indigo-500"
                />
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                Business Email *
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 text-slate-500 absolute left-3 top-3" />
                <input
                  type="email"
                  required
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  placeholder="contact@company.com"
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
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value.replace(/\D/g, '') })}
                  placeholder="9876543210"
                  className="w-full pl-9 pr-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-slate-200 text-sm focus:outline-none focus:border-indigo-500 font-mono"
                />
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                Company Legal Name
              </label>
              <div className="relative">
                <Building2 className="w-4 h-4 text-slate-500 absolute left-3 top-3" />
                <input
                  type="text"
                  value={formData.company || ''}
                  onChange={(e) => setFormData({ ...formData, company: e.target.value })}
                  placeholder="Wayne Enterprises Inc."
                  className="w-full pl-9 pr-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-slate-200 text-sm focus:outline-none focus:border-indigo-500"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                Website
              </label>
              <div className="relative">
                <Globe className="w-4 h-4 text-slate-500 absolute left-3 top-3" />
                <input
                  type="text"
                  value={formData.website || ''}
                  onChange={(e) => setFormData({ ...formData, website: e.target.value })}
                  placeholder="https://wayneenterprises.com"
                  className="w-full pl-9 pr-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-slate-200 text-sm focus:outline-none focus:border-indigo-500"
                />
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                Customer Tier
              </label>
              <select
                value={formData.customerTier}
                onChange={(e) => setFormData({ ...formData, customerTier: e.target.value as CustomerTier })}
                className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-slate-200 text-sm focus:outline-none focus:border-indigo-500"
              >
                <option value="TIER_1_ENTERPRISE">Tier 1 - Enterprise</option>
                <option value="STRATEGIC">Strategic Partner</option>
                <option value="TIER_2_MID_MARKET">Tier 2 - Mid Market</option>
                <option value="TIER_3_SMB">Tier 3 - SMB</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                Account Health / Status
              </label>
              <select
                value={formData.customerStatus}
                onChange={(e) => setFormData({ ...formData, customerStatus: e.target.value as CustomerStatus })}
                className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-slate-200 text-sm focus:outline-none focus:border-indigo-500"
              >
                <option value="ACTIVE">Active Account</option>
                <option value="ONBOARDING">Onboarding</option>
                <option value="AT_RISK">At Risk</option>
                <option value="INACTIVE">Inactive</option>
                <option value="CHURNED">Churned</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                Industry
              </label>
              <select
                value={formData.industry}
                onChange={(e) => setFormData({ ...formData, industry: e.target.value as Industry })}
                className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-slate-200 text-sm focus:outline-none focus:border-indigo-500"
              >
                <option value="TECHNOLOGY">Technology</option>
                <option value="FINANCE">Financial Services</option>
                <option value="HEALTHCARE">Healthcare</option>
                <option value="MANUFACTURING">Manufacturing</option>
                <option value="RETAIL">Retail & E-Commerce</option>
                <option value="EDUCATION">Education</option>
                <option value="SERVICES">Professional Services</option>
                <option value="OTHER">Other</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                Annual Recurring Revenue (₹ ARR)
              </label>
              <div className="relative">
                <IndianRupee className="w-4 h-4 text-emerald-400 absolute left-3 top-3" />
                <input
                  type="number"
                  min="0"
                  step="1000"
                  value={formData.annualRevenue || ''}
                  onChange={(e) => setFormData({ ...formData, annualRevenue: Number(e.target.value) })}
                  className="w-full pl-9 pr-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-slate-200 text-sm focus:outline-none focus:border-indigo-500"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5 flex items-center justify-between">
                <span>Assign Account Manager</span>
                {isEmployee && (
                  <span className="text-[10px] text-amber-400/90 font-normal flex items-center gap-1">
                    <Lock className="w-3 h-3" /> Auto-assigned to you
                  </span>
                )}
              </label>
              <select
                value={formData.assignedAccountManagerId || ''}
                onChange={(e) => handleManagerSelect(e.target.value)}
                disabled={isEmployee}
                className={`w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-slate-200 text-sm focus:outline-none focus:border-indigo-500 ${
                  isEmployee ? 'opacity-70 cursor-not-allowed bg-slate-950/80' : ''
                }`}
              >
                {!isEmployee && <option value="">-- Unassigned --</option>}
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
              Billing Address
            </label>
            <div className="relative">
              <MapPin className="w-4 h-4 text-slate-500 absolute left-3 top-3" />
              <input
                type="text"
                value={formData.billingAddress || ''}
                onChange={(e) => setFormData({ ...formData, billingAddress: e.target.value })}
                placeholder="1007 Mountain Drive, Gotham City, NJ 07001"
                className="w-full pl-9 pr-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-slate-200 text-sm focus:outline-none focus:border-indigo-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5">
              Customer Relationship Notes
            </label>
            <div className="relative">
              <FileText className="w-4 h-4 text-slate-500 absolute left-3 top-3" />
              <textarea
                rows={3}
                value={formData.notes || ''}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                placeholder="Account history, contract terms, primary stakeholders, SLA requirements..."
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
              {loading ? 'Creating...' : 'Create Account'}
            </button>
          </div>
        </form>
      </div>
    </div>
    </ModalPortal>
  );
};
