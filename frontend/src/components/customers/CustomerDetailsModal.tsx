import { ModalPortal } from '../ModalPortal';
import React, { useEffect, useState } from 'react';
import { Customer, CustomerStatus, CustomerProduct } from '../../types/customer';
import { Product } from '../../types/product';
import { Contact } from '../../types/contact';
import { contactApi } from '../../api/contactApi';
import { customerApi } from '../../api/customerApi';
import { productApi } from '../../api/productApi';
import { CustomerStatusBadge } from './CustomerStatusBadge';
import { CustomerTierBadge } from './CustomerTierBadge';
import { ContactTypeBadge } from '../contacts/ContactTypeBadge';
import {
  X,
  Building2,
  User as UserIcon,
  Mail,
  Phone,
  Globe,
  IndianRupee,
  MapPin,
  FileText,
  Clock,
  Briefcase,
  Edit2,
  CheckCircle2,
  Users,
  Crown,
  Package,
  Plus,
  Trash2,
} from 'lucide-react';

import { useAuth } from '../../context/AuthContext';

interface CustomerDetailsModalProps {
  isOpen: boolean;
  onClose: () => void;
  customer: Customer | null;
  onStatusChange: (id: number, status: CustomerStatus) => Promise<void>;
  onEdit: (customer: Customer) => void;
}

export const CustomerDetailsModal: React.FC<CustomerDetailsModalProps> = ({
  isOpen,
  onClose,
  customer,
  onStatusChange,
  onEdit,
}) => {
  const { user } = useAuth();
  const [affiliatedContacts, setAffiliatedContacts] = useState<Contact[]>([]);
  const [contactsLoading, setContactsLoading] = useState(false);

  const [customerProducts, setCustomerProducts] = useState<CustomerProduct[]>([]);
  const [productsLoading, setProductsLoading] = useState(false);
  const [availableProducts, setAvailableProducts] = useState<Product[]>([]);
  const [showAddProductModal, setShowAddProductModal] = useState(false);
  const [selectedProdId, setSelectedProdId] = useState<number | ''>('');
  const [assignQty, setAssignQty] = useState(1);
  const [assigning, setAssigning] = useState(false);

  const isAdmin = user?.role === 'ROLE_ADMIN';
  const isManager = user?.role === 'ROLE_MANAGER';
  const isEmployee = user?.role === 'ROLE_EMPLOYEE';

  const canEdit = isAdmin || isManager || (isEmployee && customer?.assignedAccountManagerId === user?.id);

  const loadCustomerProducts = (customerId: number) => {
    setProductsLoading(true);
    customerApi
      .getCustomerProducts(customerId)
      .then((res) => {
        if (res.data) setCustomerProducts(res.data);
      })
      .catch(() => setCustomerProducts([]))
      .finally(() => setProductsLoading(false));
  };

  useEffect(() => {
    if (isOpen && customer?.id) {
      setContactsLoading(true);
      contactApi
        .getContactsByCustomer(customer.id)
        .then((res) => setAffiliatedContacts(res || []))
        .catch(() => setAffiliatedContacts([]))
        .finally(() => setContactsLoading(false));

      loadCustomerProducts(customer.id);
      productApi.getProducts({ status: 'ACTIVE' })
        .then(res => {
          if (res.data) {
            setAvailableProducts(res.data);
            if (res.data.length > 0) setSelectedProdId(res.data[0].id);
          }
        })
        .catch(err => console.error('Failed to load active products:', err));
    } else {
      setAffiliatedContacts([]);
      setCustomerProducts([]);
      setShowAddProductModal(false);
    }
  }, [isOpen, customer?.id]);

  const handleAssignProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!customer?.id || !selectedProdId) return;
    try {
      setAssigning(true);
      const prod = availableProducts.find(p => p.id === Number(selectedProdId));
      await customerApi.assignCustomerProduct(customer.id, {
        productId: Number(selectedProdId),
        productName: prod?.name,
        quantity: assignQty,
        unitPrice: prod?.unitPrice || 0,
        billingFrequency: prod?.billingFrequency || 'ONE_TIME',
      });
      loadCustomerProducts(customer.id);
      setShowAddProductModal(false);
    } catch (err: any) {
      console.error('Failed to assign product to customer:', err);
    } finally {
      setAssigning(false);
    }
  };

  const handleDeleteProduct = async (customerProductId: number) => {
    if (!customer?.id) return;
    try {
      await customerApi.deleteCustomerProduct(customer.id, customerProductId);
      loadCustomerProducts(customer.id);
    } catch (err: any) {
      console.error('Failed to remove product subscription:', err);
    }
  };

  if (!isOpen || !customer) return null;

  const formatCurrency = (val?: number) => {
    return '₹' + (val || 0).toLocaleString('en-IN', { maximumFractionDigits: 0 });
  };

  return (
    <ModalPortal>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-fade-in">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-3xl overflow-hidden shadow-2xl animate-scale-up max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-start justify-between px-6 py-5 border-b border-slate-800 bg-slate-900/60">
          <div className="flex items-start space-x-3.5">
            <div className="w-12 h-12 rounded-2xl bg-indigo-600/15 border border-indigo-500/30 flex items-center justify-center text-indigo-400 font-bold text-lg">
              <Building2 className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center space-x-2.5">
                <h3 className="text-xl font-bold text-slate-100">{customer.name}</h3>
                <CustomerTierBadge tier={customer.customerTier} />
                {customer.isDeleted && (
                  <span className="px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-rose-500/20 text-rose-300 border border-rose-500/30">
                    Trash / Deleted
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-400 mt-1 flex items-center space-x-3">
                <span>Industry: <strong className="text-slate-300">{customer.industryDisplayName}</strong></span>
                {customer.website && (
                  <a
                    href={customer.website}
                    target="_blank"
                    rel="noreferrer"
                    className="text-indigo-400 hover:underline flex items-center gap-1"
                  >
                    <Globe className="w-3 h-3" />
                    <span>{customer.website.replace('https://', '').replace('http://', '')}</span>
                  </a>
                )}
              </p>
            </div>
          </div>
          <div className="flex items-center space-x-2">
            {canEdit && (
              <button
                onClick={() => {
                  onClose();
                  onEdit(customer);
                }}
                className="p-2 text-slate-400 hover:text-amber-400 rounded-xl hover:bg-slate-800 transition-colors"
                title="Edit Customer"
              >
                <Edit2 className="w-4 h-4" />
              </button>
            )}
            <button
              onClick={onClose}
              className="p-2 text-slate-400 hover:text-slate-200 rounded-xl hover:bg-slate-800 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Modal Body */}
        <div className="overflow-y-auto p-6 space-y-6 flex-1">
          {/* Deletion / Archive Banner */}
          {customer.isDeleted && (
            <div className="p-4 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-300 text-xs space-y-1">
              <div className="font-semibold flex items-center gap-1.5">
                <span>⚠️ Soft-Deleted / Archived Account</span>
              </div>
              <div>
                Deleted By: {customer.deletedByUserName || 'Manager/Admin'} ({customer.deletedByRole || 'ROLE_MANAGER'})
              </div>
              {customer.deleteRequestReason && (
                <div>Reason: "{customer.deleteRequestReason}"</div>
              )}
            </div>
          )}
          {/* Quick Stats Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="p-4 rounded-xl bg-slate-950/70 border border-slate-800">
              <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider flex items-center gap-1">
                <IndianRupee className="w-3.5 h-3.5 text-emerald-400" />
                Annual ARR Value
              </span>
              <div className="text-xl font-bold text-emerald-400 mt-1">
                {formatCurrency(customer.annualRevenue)}
              </div>
            </div>

            <div className="p-4 rounded-xl bg-slate-950/70 border border-slate-800">
              <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider flex items-center gap-1">
                <UserIcon className="w-3.5 h-3.5 text-indigo-400" />
                Account Manager
              </span>
              <div className="text-sm font-bold text-slate-200 mt-1 truncate">
                {customer.assignedAccountManagerName || 'Unassigned'}
              </div>
            </div>

            <div className="p-4 rounded-xl bg-slate-950/70 border border-slate-800">
              <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider flex items-center gap-1">
                <CheckCircle2 className="w-3.5 h-3.5 text-blue-400" />
                Account Health
              </span>
              <div className="mt-1">
                <CustomerStatusBadge status={customer.customerStatus} />
              </div>
            </div>
          </div>

          {/* Health Status Quick Action Buttons */}
          <div className="space-y-2">
            <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider">
              Update Relationship Status
            </label>
            <div className="flex flex-wrap gap-2">
              {(['ACTIVE', 'ONBOARDING', 'AT_RISK', 'INACTIVE', 'CHURNED'] as CustomerStatus[]).map((st) => (
                <button
                  key={st}
                  onClick={() => onStatusChange(customer.id, st)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-semibold border transition-all ${
                    customer.customerStatus === st
                      ? 'bg-indigo-600/20 text-indigo-300 border-indigo-500 font-bold shadow-md shadow-indigo-500/10'
                      : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-slate-200 hover:border-slate-700'
                  }`}
                >
                  {st.replace('_', ' ')}
                </button>
              ))}
            </div>
          </div>

          {/* Details Sections */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Primary Contact Info */}
            <div className="p-4 rounded-xl bg-slate-950/50 border border-slate-800 space-y-3">
              <h4 className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
                <Briefcase className="w-4 h-4 text-indigo-400" />
                Primary Contact Details
              </h4>
              <div className="space-y-2 text-xs text-slate-300">
                <div className="flex items-center gap-2">
                  <UserIcon className="w-3.5 h-3.5 text-slate-500" />
                  <span>{customer.contactPerson || 'No contact person listed'}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Mail className="w-3.5 h-3.5 text-slate-500" />
                  <a href={`mailto:${customer.email}`} className="text-indigo-400 hover:underline">
                    {customer.email}
                  </a>
                </div>
                <div className="flex items-center gap-2">
                  <Phone className="w-3.5 h-3.5 text-slate-500" />
                  <span>{customer.phone || 'No phone listed'}</span>
                </div>
              </div>
            </div>

            {/* Location & Billing */}
            <div className="p-4 rounded-xl bg-slate-950/50 border border-slate-800 space-y-3">
              <h4 className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
                <MapPin className="w-4 h-4 text-rose-400" />
                Billing & Legal Address
              </h4>
              <p className="text-xs text-slate-300 leading-relaxed">
                {customer.billingAddress || 'No billing address specified.'}
              </p>
              {customer.convertedFromLeadId && (
                <div className="pt-2 border-t border-slate-800/80 text-[11px] text-teal-400 flex items-center gap-1">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>Converted from Sales Lead #{customer.convertedFromLeadId}</span>
                </div>
              )}
            </div>
          </div>

          {/* Purchased Products & Subscriptions */}
          <div className="p-4 rounded-xl bg-slate-950/50 border border-slate-800 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <Package className="w-4 h-4 text-indigo-400" />
                <h4 className="text-xs font-bold text-slate-300 uppercase tracking-wider">
                  Purchased Products & Subscriptions ({customerProducts.length})
                </h4>
              </div>
              {canEdit && (
                <button
                  onClick={() => setShowAddProductModal(true)}
                  className="flex items-center gap-1 px-2.5 py-1 bg-indigo-600/20 hover:bg-indigo-600/30 text-indigo-300 border border-indigo-500/30 rounded-lg text-xs font-semibold transition-colors"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Assign Product</span>
                </button>
              )}
            </div>

            {productsLoading ? (
              <div className="py-4 text-center text-xs text-slate-500">Loading products & subscriptions...</div>
            ) : customerProducts.length === 0 ? (
              <p className="text-xs text-slate-500 italic">
                No products or active subscriptions currently linked to this customer.
              </p>
            ) : (
              <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                {customerProducts.map((cp) => (
                  <div
                    key={cp.id}
                    className="p-3 rounded-xl bg-slate-900 border border-slate-800 flex items-center justify-between text-xs"
                  >
                    <div className="overflow-hidden mr-2">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-slate-100 truncate">{cp.productName}</span>
                        <span className={`px-1.5 py-0.2 text-[10px] font-bold rounded ${
                          cp.status === 'ACTIVE'
                            ? 'bg-emerald-500/15 text-emerald-300 border border-emerald-500/30'
                            : 'bg-slate-800 text-slate-400'
                        }`}>
                          {cp.status}
                        </span>
                        {cp.billingFrequency && cp.billingFrequency !== 'ONE_TIME' && (
                          <span className="text-[10px] text-indigo-400 bg-indigo-500/10 px-1.5 py-0.2 rounded border border-indigo-500/20">
                            {cp.billingFrequency}
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-2 mt-1 text-[11px] text-slate-400">
                        <span>Qty: <strong>{cp.quantity}</strong></span>
                        <span>•</span>
                        <span>Purchased: {new Date(cp.purchaseDate).toLocaleDateString()}</span>
                        {cp.expiryDate && (
                          <>
                            <span>•</span>
                            <span className="text-amber-400/90">Renews: {new Date(cp.expiryDate).toLocaleDateString()}</span>
                          </>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center space-x-3 shrink-0">
                      <span className="font-bold text-emerald-400 text-xs">
                        ₹{cp.totalAmount?.toLocaleString('en-IN')}
                      </span>
                      {canEdit && (
                        <button
                          onClick={() => handleDeleteProduct(cp.id)}
                          title="Remove Subscription"
                          className="p-1 text-slate-500 hover:text-rose-400 rounded hover:bg-slate-800 transition-colors"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Affiliated Contacts & Stakeholders */}
          <div className="p-4 rounded-xl bg-slate-950/50 border border-slate-800 space-y-3">
            <div className="flex items-center justify-between">
              <h4 className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
                <Users className="w-4 h-4 text-indigo-400" />
                Affiliated Contacts & Stakeholders ({affiliatedContacts.length})
              </h4>
            </div>

            {contactsLoading ? (
              <div className="py-4 text-center text-xs text-slate-500">Loading contacts...</div>
            ) : affiliatedContacts.length === 0 ? (
              <p className="text-xs text-slate-500 italic">
                No individual stakeholder contacts linked yet. Add contacts under Contact Management.
              </p>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                {affiliatedContacts.map((ct) => (
                  <div
                    key={ct.id}
                    className="p-2.5 rounded-lg bg-slate-900 border border-slate-800 flex items-center justify-between"
                  >
                    <div className="flex items-center gap-2">
                      <div className="w-7 h-7 rounded-lg bg-indigo-600/20 text-indigo-300 font-bold text-xs flex items-center justify-center">
                        {ct.firstName.charAt(0)}
                        {ct.lastName.charAt(0)}
                      </div>
                      <div>
                        <div className="text-xs font-bold text-slate-200 flex items-center gap-1">
                          {ct.fullName}
                          {ct.isPrimaryContact && (
                            <span title="Primary Contact">
                              <Crown className="w-3 h-3 text-amber-400" />
                            </span>
                          )}
                        </div>
                        <div className="text-[11px] text-slate-400">{ct.jobTitle || 'Stakeholder'}</div>
                      </div>
                    </div>
                    <ContactTypeBadge type={ct.contactType} />
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Account History / Notes */}
          <div className="p-4 rounded-xl bg-slate-950/50 border border-slate-800 space-y-2">
            <h4 className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
              <FileText className="w-4 h-4 text-amber-400" />
              Account Notes & Relationship Record
            </h4>
            <p className="text-xs text-slate-300 whitespace-pre-wrap leading-relaxed">
              {customer.notes || 'No relationship notes or contract details added yet.'}
            </p>
          </div>

          {/* Metadata Footer */}
          <div className="flex items-center justify-between text-[11px] text-slate-500 pt-3 border-t border-slate-800/80">
            <span className="flex items-center gap-1">
              <Clock className="w-3.5 h-3.5" />
              Created: {new Date(customer.createdAt).toLocaleDateString()}
            </span>
            {customer.updatedAt && (
              <span>Last Updated: {new Date(customer.updatedAt).toLocaleDateString()}</span>
            )}
          </div>
        </div>
      </div>
    </div>

    {/* Assign Product Sub-Modal */}
    {showAddProductModal && (
      <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-fade-in">
        <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-md overflow-hidden shadow-2xl p-6 space-y-4">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <h4 className="text-sm font-bold text-slate-100 flex items-center gap-2">
              <Package className="w-4 h-4 text-indigo-400" />
              Assign Product to Customer
            </h4>
            <button
              onClick={() => setShowAddProductModal(false)}
              className="text-slate-400 hover:text-slate-200 p-1 rounded-lg hover:bg-slate-800"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <form onSubmit={handleAssignProduct} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Select Product / Service *
              </label>
              <select
                value={selectedProdId}
                onChange={(e) => setSelectedProdId(Number(e.target.value))}
                className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-slate-200 text-xs focus:outline-none focus:border-indigo-500"
                required
              >
                {availableProducts.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name} — ₹{p.unitPrice?.toLocaleString('en-IN')} ({p.billingFrequency || 'ONE_TIME'})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Quantity / Licenses
              </label>
              <input
                type="number"
                min="1"
                value={assignQty}
                onChange={(e) => setAssignQty(Math.max(1, Number(e.target.value)))}
                className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-slate-200 text-xs focus:outline-none focus:border-indigo-500"
              />
            </div>

            <div className="flex items-center justify-end space-x-2 pt-2 border-t border-slate-800">
              <button
                type="button"
                onClick={() => setShowAddProductModal(false)}
                className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs rounded-xl transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={assigning}
                className="px-4 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold rounded-xl shadow transition-colors disabled:opacity-50"
              >
                {assigning ? 'Assigning...' : 'Assign Product'}
              </button>
            </div>
          </form>
        </div>
      </div>
    )}
    </ModalPortal>
  );
};
