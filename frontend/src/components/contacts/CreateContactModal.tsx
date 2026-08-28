import { ModalPortal } from '../ModalPortal';
import React, { useState } from 'react';
import { CreateContactRequest, ContactType, ContactStatus } from '../../types/contact';
import { User } from '../../types/auth';
import { Customer } from '../../types/customer';
import { validatePhoneNumber } from '../../utils/validation';
import {
  X,
  User as UserIcon,
  Mail,
  Phone,
  Smartphone,
  Briefcase,
  MapPin,
  Linkedin,
  Crown,
  ShieldCheck,
  PhoneOff,
  MailWarning,
} from 'lucide-react';

interface CreateContactModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: CreateContactRequest) => Promise<void>;
  teamMembers: User[];
  customers: Customer[];
  initialCustomerId?: number;
  isEmployee?: boolean;
  currentUser?: User | null;
  customTags?: { id: number; name: string; color: string }[];
}

export const CreateContactModal: React.FC<CreateContactModalProps> = ({
  isOpen,
  onClose,
  onSubmit,
  teamMembers,
  customers,
  initialCustomerId,
  isEmployee,
  currentUser,
  customTags = [],
}) => {
  const initialCustomer = customers.find((c) => c.id === initialCustomerId);

  const [formData, setFormData] = useState<CreateContactRequest>({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    mobile: '',
    jobTitle: '',
    department: '',
    customerId: initialCustomerId,
    customerName: initialCustomer?.name || '',
    contactType: 'DECISION_MAKER',
    status: 'ACTIVE',
    isPrimaryContact: false,
    doNotCall: false,
    doNotEmail: false,
    address: '',
    city: '',
    state: '',
    country: 'India',
    postalCode: '',
    linkedinUrl: '',
    twitterHandle: '',
    assignedToUserId: isEmployee && currentUser ? currentUser.id : undefined,
    assignedToUserName: isEmployee && currentUser ? currentUser.name : '',
    tags: '',
    notes: '',
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleCustomerChange = (customerIdStr: string) => {
    if (!customerIdStr) {
      setFormData({ ...formData, customerId: undefined, customerName: '' });
      return;
    }
    const cId = Number(customerIdStr);
    const found = customers.find((c) => c.id === cId);
    setFormData({
      ...formData,
      customerId: cId,
      customerName: found ? found.name : '',
    });
  };

  const handleAssigneeChange = (userIdStr: string) => {
    if (!userIdStr) {
      setFormData({ ...formData, assignedToUserId: undefined, assignedToUserName: '' });
      return;
    }
    const uId = Number(userIdStr);
    const found = teamMembers.find((u) => u.id === uId);
    setFormData({
      ...formData,
      assignedToUserId: uId,
      assignedToUserName: found ? found.name : '',
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.firstName.trim() || !formData.lastName.trim() || !formData.email.trim()) {
      setError('Please provide first name, last name, and valid email address.');
      return;
    }

    if (formData.phone && formData.phone.trim()) {
      const phoneCheck = validatePhoneNumber(formData.phone);
      if (!phoneCheck.isValid) {
        setError(`Work Phone: ${phoneCheck.error || 'Must be exactly 10 digits.'}`);
        return;
      }
    }

    if (formData.mobile && formData.mobile.trim()) {
      const mobileCheck = validatePhoneNumber(formData.mobile);
      if (!mobileCheck.isValid) {
        setError(`Mobile Phone: ${mobileCheck.error || 'Must be exactly 10 digits.'}`);
        return;
      }
    }

    try {
      setLoading(true);
      setError(null);
      const cleanPhone = formData.phone && formData.phone.trim() ? validatePhoneNumber(formData.phone).cleanPhone : '';
      const cleanMobile = formData.mobile && formData.mobile.trim() ? validatePhoneNumber(formData.mobile).cleanPhone : '';

      await onSubmit({
        ...formData,
        phone: cleanPhone,
        mobile: cleanMobile,
      });
      onClose();
    } catch (err: any) {
      setError(err?.response?.data?.message || err.message || 'Failed to create contact');
    } finally {
      setLoading(false);
    }
  };

  return (
    <ModalPortal>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-fadeIn">
      <div className="bg-slate-900 border border-slate-800 w-full max-w-2xl rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-slate-950/40">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400">
              <UserIcon className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-white">Create New Contact</h2>
              <p className="text-xs text-slate-400">Add a key stakeholder, champion, or decision-maker</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-200 hover:bg-slate-800 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Error Alert */}
        {error && (
          <div className="mx-6 mt-4 p-3 rounded-lg bg-rose-500/10 border border-rose-500/20 text-rose-400 text-xs flex items-center justify-between">
            <span>{error}</span>
            <button onClick={() => setError(null)}>
              <X className="w-4 h-4" />
            </button>
          </div>
        )}

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-5">
          {/* Basic Identity */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                First Name *
              </label>
              <input
                type="text"
                required
                placeholder="e.g. Tony"
                value={formData.firstName}
                onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                className="w-full px-3.5 py-2 rounded-xl bg-slate-950 border border-slate-800 text-slate-200 text-sm focus:outline-none focus:border-indigo-500 transition-colors placeholder:text-slate-600"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                Last Name *
              </label>
              <input
                type="text"
                required
                placeholder="e.g. Stark"
                value={formData.lastName}
                onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                className="w-full px-3.5 py-2 rounded-xl bg-slate-950 border border-slate-800 text-slate-200 text-sm focus:outline-none focus:border-indigo-500 transition-colors placeholder:text-slate-600"
              />
            </div>
          </div>

          {/* Email & Phones */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                Email Address *
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 text-slate-500 absolute left-3 top-3" />
                <input
                  type="email"
                  required
                  placeholder="tony@stark.com"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  className="w-full pl-9 pr-3.5 py-2 rounded-xl bg-slate-950 border border-slate-800 text-slate-200 text-sm focus:outline-none focus:border-indigo-500 transition-colors placeholder:text-slate-600"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                Work Phone (10 Digits)
              </label>
              <div className="relative">
                <Phone className="w-4 h-4 text-slate-500 absolute left-3 top-3" />
                <input
                  type="tel"
                  maxLength={10}
                  placeholder="9876543210"
                  value={formData.phone || ''}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value.replace(/\D/g, '') })}
                  className="w-full pl-9 pr-3.5 py-2 rounded-xl bg-slate-950 border border-slate-800 text-slate-200 text-sm focus:outline-none focus:border-indigo-500 transition-colors placeholder:text-slate-600 font-mono"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                Mobile (10 Digits)
              </label>
              <div className="relative">
                <Smartphone className="w-4 h-4 text-slate-500 absolute left-3 top-3" />
                <input
                  type="tel"
                  maxLength={10}
                  placeholder="9876543210"
                  value={formData.mobile || ''}
                  onChange={(e) => setFormData({ ...formData, mobile: e.target.value.replace(/\D/g, '') })}
                  className="w-full pl-9 pr-3.5 py-2 rounded-xl bg-slate-950 border border-slate-800 text-slate-200 text-sm focus:outline-none focus:border-indigo-500 transition-colors placeholder:text-slate-600 font-mono"
                />
              </div>
            </div>
          </div>

          {/* Title & Department */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                Job Title
              </label>
              <div className="relative">
                <Briefcase className="w-4 h-4 text-slate-500 absolute left-3 top-3" />
                <input
                  type="text"
                  placeholder="e.g. Chief Technology Officer"
                  value={formData.jobTitle || ''}
                  onChange={(e) => setFormData({ ...formData, jobTitle: e.target.value })}
                  className="w-full pl-9 pr-3.5 py-2 rounded-xl bg-slate-950 border border-slate-800 text-slate-200 text-sm focus:outline-none focus:border-indigo-500 transition-colors placeholder:text-slate-600"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                Department
              </label>
              <input
                type="text"
                placeholder="e.g. Information Technology"
                value={formData.department || ''}
                onChange={(e) => setFormData({ ...formData, department: e.target.value })}
                className="w-full px-3.5 py-2 rounded-xl bg-slate-950 border border-slate-800 text-slate-200 text-sm focus:outline-none focus:border-indigo-500 transition-colors placeholder:text-slate-600"
              />
            </div>
          </div>

          {/* Account Affiliation & Type */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                Associated Customer Account
              </label>
              <select
                value={formData.customerId || ''}
                onChange={(e) => handleCustomerChange(e.target.value)}
                className="w-full px-3.5 py-2 rounded-xl bg-slate-950 border border-slate-800 text-slate-200 text-sm focus:outline-none focus:border-indigo-500 transition-colors"
              >
                <option value="">No Affiliated Account</option>
                {customers.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                Stakeholder Role
              </label>
              <select
                value={formData.contactType}
                onChange={(e) => setFormData({ ...formData, contactType: e.target.value as ContactType })}
                className="w-full px-3.5 py-2 rounded-xl bg-slate-950 border border-slate-800 text-slate-200 text-sm focus:outline-none focus:border-indigo-500 transition-colors"
              >
                <option value="DECISION_MAKER">Decision Maker (Key Sign-off)</option>
                <option value="CHAMPION">Internal Champion</option>
                <option value="EXECUTIVE_SPONSOR">Executive Sponsor</option>
                <option value="TECHNICAL_EVALUATOR">Technical Evaluator</option>
                <option value="INFLUENCER">Influencer</option>
                <option value="BILLING_CONTACT">Billing & Finance</option>
                <option value="END_USER">End User</option>
                <option value="OTHER">General Stakeholder</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                Contact Status
              </label>
              <select
                value={formData.status}
                onChange={(e) => setFormData({ ...formData, status: e.target.value as ContactStatus })}
                className="w-full px-3.5 py-2 rounded-xl bg-slate-950 border border-slate-800 text-slate-200 text-sm focus:outline-none focus:border-indigo-500 transition-colors"
              >
                <option value="ACTIVE">Active Contact</option>
                <option value="PROSPECT">Prospect</option>
                <option value="INACTIVE">Inactive</option>
                <option value="FORMER_EMPLOYEE">Former Employee</option>
              </select>
            </div>
          </div>

          {/* Assigned Rep, Social Links, and Stakeholder Tags */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5 flex items-center justify-between">
                <span>Assigned CRM Owner</span>
                {isEmployee && (
                  <span className="text-[10px] text-amber-400 font-normal">Auto-assigned</span>
                )}
              </label>
              <select
                value={formData.assignedToUserId || ''}
                onChange={(e) => handleAssigneeChange(e.target.value)}
                disabled={isEmployee}
                className={`w-full px-3.5 py-2 rounded-xl bg-slate-950 border border-slate-800 text-slate-200 text-sm focus:outline-none focus:border-indigo-500 transition-colors ${
                  isEmployee ? 'opacity-70 cursor-not-allowed' : ''
                }`}
              >
                <option value="">Unassigned</option>
                {teamMembers.map((m) => (
                  <option key={m.id} value={m.id}>
                    {m.name} ({m.role.replace('ROLE_', '')})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                Stakeholder Tags / Badges
              </label>
              <input
                type="text"
                placeholder="e.g. Budget Holder, Champion"
                value={formData.tags || ''}
                onChange={(e) => setFormData({ ...formData, tags: e.target.value })}
                className="w-full px-3.5 py-2 rounded-xl bg-slate-950 border border-slate-800 text-slate-200 text-sm focus:outline-none focus:border-indigo-500 transition-colors placeholder:text-slate-600"
              />
              {customTags.length > 0 && (
                <div className="flex flex-wrap gap-1 mt-1.5">
                  {customTags.map((t) => (
                    <button
                      key={t.id}
                      type="button"
                      onClick={() => {
                        const current = formData.tags ? formData.tags.split(',').map((x) => x.trim()) : [];
                        if (!current.includes(t.name)) {
                          setFormData({ ...formData, tags: [...current, t.name].join(', ') });
                        }
                      }}
                      className="text-[10px] px-1.5 py-0.5 rounded bg-slate-900 border border-slate-800 text-slate-400 hover:text-indigo-300 hover:border-indigo-500/30 transition-colors"
                    >
                      +{t.name}
                    </button>
                  ))}
                </div>
              )}
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                LinkedIn Profile URL
              </label>
              <div className="relative">
                <Linkedin className="w-4 h-4 text-slate-500 absolute left-3 top-3" />
                <input
                  type="url"
                  placeholder="https://linkedin.com/in/username"
                  value={formData.linkedinUrl || ''}
                  onChange={(e) => setFormData({ ...formData, linkedinUrl: e.target.value })}
                  className="w-full pl-9 pr-3.5 py-2 rounded-xl bg-slate-950 border border-slate-800 text-slate-200 text-sm focus:outline-none focus:border-indigo-500 transition-colors placeholder:text-slate-600"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                City / Location
              </label>
              <div className="relative">
                <MapPin className="w-4 h-4 text-slate-500 absolute left-3 top-3" />
                <input
                  type="text"
                  placeholder="e.g. Mumbai, Bengaluru"
                  value={formData.city || ''}
                  onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                  className="w-full pl-9 pr-3.5 py-2 rounded-xl bg-slate-950 border border-slate-800 text-slate-200 text-sm focus:outline-none focus:border-indigo-500 transition-colors placeholder:text-slate-600"
                />
              </div>
            </div>
          </div>

          {/* Toggles */}
          <div className="p-4 rounded-xl bg-slate-950/60 border border-slate-800 space-y-3">
            <label className="flex items-center gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={formData.isPrimaryContact}
                onChange={(e) => setFormData({ ...formData, isPrimaryContact: e.target.checked })}
                className="w-4 h-4 rounded border-slate-700 bg-slate-900 text-indigo-500 focus:ring-indigo-500"
              />
              <div className="flex items-center gap-2">
                <Crown className="w-4 h-4 text-amber-400" />
                <span className="text-xs font-semibold text-slate-200">
                  Designate as Primary Contact for this Account
                </span>
              </div>
            </label>

            <div className="flex flex-wrap gap-6 pt-2 border-t border-slate-800/80">
              <label className="flex items-center gap-2 cursor-pointer text-xs text-slate-300">
                <input
                  type="checkbox"
                  checked={formData.doNotCall}
                  onChange={(e) => setFormData({ ...formData, doNotCall: e.target.checked })}
                  className="w-3.5 h-3.5 rounded border-slate-700 bg-slate-900 text-rose-500 focus:ring-rose-500"
                />
                <PhoneOff className="w-3.5 h-3.5 text-rose-400" />
                Do Not Call
              </label>

              <label className="flex items-center gap-2 cursor-pointer text-xs text-slate-300">
                <input
                  type="checkbox"
                  checked={formData.doNotEmail}
                  onChange={(e) => setFormData({ ...formData, doNotEmail: e.target.checked })}
                  className="w-3.5 h-3.5 rounded border-slate-700 bg-slate-900 text-rose-500 focus:ring-rose-500"
                />
                <MailWarning className="w-3.5 h-3.5 text-rose-400" />
                Do Not Email
              </label>
            </div>
          </div>

          {/* Notes */}
          <div>
            <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
              Stakeholder Notes & Background
            </label>
            <textarea
              rows={3}
              placeholder="Add key insights, preferred communication cadence, or project interests..."
              value={formData.notes || ''}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              className="w-full px-3.5 py-2 rounded-xl bg-slate-950 border border-slate-800 text-slate-200 text-sm focus:outline-none focus:border-indigo-500 transition-colors placeholder:text-slate-600 resize-none"
            />
          </div>

          {/* Footer Buttons */}
          <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-800">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium text-slate-400 hover:text-slate-200 bg-slate-800/60 hover:bg-slate-800 rounded-xl transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-5 py-2 text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-500 rounded-xl shadow-lg shadow-indigo-600/30 transition-all disabled:opacity-50 flex items-center gap-2"
            >
              {loading ? (
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                <ShieldCheck className="w-4 h-4" />
              )}
              Create Contact
            </button>
          </div>
        </form>
      </div>
    </div>
    </ModalPortal>
  );
};
