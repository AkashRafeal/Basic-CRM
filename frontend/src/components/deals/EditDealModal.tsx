import { ModalPortal } from '../ModalPortal';
import React, { useState, useEffect } from 'react';
import { Deal, UpdateDealRequest, DealStage, DealType, DealPriority, PipelineStageConfig, DealItem } from '../../types/deal';
import { Product } from '../../types/product';
import { productApi } from '../../api/productApi';
import { dealApi } from '../../api/dealApi';
import { User } from '../../types/auth';
import { Customer } from '../../types/customer';
import { useAuth } from '../../context/AuthContext';
import { X, TrendingUp, IndianRupee, Calendar, User as UserIcon, Building2, FileText, Percent, Lock, Package, Plus, Trash2 } from 'lucide-react';

interface EditDealModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (id: number, data: UpdateDealRequest) => Promise<void>;
  deal: Deal | null;
  users: User[];
  customers: Customer[];
  stageConfigs?: PipelineStageConfig[];
}

export const EditDealModal: React.FC<EditDealModalProps> = ({
  isOpen,
  onClose,
  onSubmit,
  deal,
  users,
  customers,
  stageConfigs,
}) => {
  const { user } = useAuth();
  const isEmployee = user?.role === 'ROLE_EMPLOYEE';

  const [formData, setFormData] = useState<UpdateDealRequest>({
    dealName: '',
    stage: 'QUALIFICATION',
    amount: 0,
    probability: 10,
    expectedCloseDate: '',
    dealType: 'NEW_BUSINESS',
    priority: 'MEDIUM',
    customerId: undefined,
    customerName: '',
    assignedToUserId: undefined,
    assignedToUserName: '',
    description: '',
    lossReason: '',
    items: [],
  });

  const [products, setProducts] = useState<Product[]>([]);
  const [dealItems, setDealItems] = useState<DealItem[]>([]);
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
    if (deal) {
      setFormData({
        dealName: deal.dealName || '',
        stage: deal.stage,
        amount: deal.amount,
        probability: deal.probability,
        expectedCloseDate: deal.expectedCloseDate || '',
        dealType: deal.dealType,
        priority: deal.priority,
        customerId: deal.customerId,
        customerName: deal.customerName || '',
        assignedToUserId: deal.assignedToUserId,
        assignedToUserName: deal.assignedToUserName || '',
        description: deal.description || '',
        lossReason: deal.lossReason || '',
        items: deal.items || [],
      });
      setDealItems(deal.items || []);
      setError(null);

      // Fetch items if not directly present
      if (!deal.items || deal.items.length === 0) {
        dealApi.getDealProducts(deal.id)
          .then(res => {
            if (res.data && res.data.length > 0) {
              setDealItems(res.data);
              setFormData(prev => ({ ...prev, items: res.data }));
            }
          })
          .catch(err => console.error('Failed to fetch deal products:', err));
      }
    }
  }, [deal]);

  const calculateTotalFromItems = (items: DealItem[]) => {
    return items.reduce((sum, item) => sum + (item.totalPrice || 0), 0);
  };

  const addItemRow = () => {
    if (products.length === 0) return;
    const defaultProd = products[0];
    const newItem: DealItem = {
      productId: defaultProd.id,
      productName: defaultProd.name,
      quantity: 1,
      unitPrice: defaultProd.unitPrice || 0,
      discountPercentage: 0,
      discountAmount: 0,
      totalPrice: defaultProd.unitPrice || 0,
    };
    const updated = [...dealItems, newItem];
    setDealItems(updated);
    const newTotal = calculateTotalFromItems(updated);
    setFormData(prev => ({ ...prev, amount: newTotal, items: updated }));
  };

  const updateItemRow = (index: number, updates: Partial<DealItem>) => {
    const updated = [...dealItems];
    const current = { ...updated[index], ...updates };

    if (updates.productId && updates.productId !== updated[index].productId) {
      const prod = products.find(p => p.id === updates.productId);
      if (prod) {
        current.productName = prod.name;
        current.unitPrice = prod.unitPrice || 0;
      }
    }

    const qty = current.quantity > 0 ? current.quantity : 1;
    const price = current.unitPrice >= 0 ? current.unitPrice : 0;
    const discPct = current.discountPercentage || 0;
    const sub = price * qty;
    const discAmt = discPct > 0 ? (sub * discPct) / 100 : (current.discountAmount || 0);
    current.totalPrice = Math.max(0, sub - discAmt);

    updated[index] = current;
    setDealItems(updated);
    const newTotal = calculateTotalFromItems(updated);
    setFormData(prev => ({ ...prev, amount: newTotal, items: updated }));
  };

  const removeItemRow = (index: number) => {
    const updated = dealItems.filter((_, i) => i !== index);
    setDealItems(updated);
    const newTotal = calculateTotalFromItems(updated);
    setFormData(prev => ({ ...prev, amount: newTotal, items: updated }));
  };

  if (!isOpen || !deal) return null;

  const handleStageChange = (newStage: DealStage) => {
    const configuredProb = stageConfigs?.find(c => c.stage === newStage)?.probability;
    const stageProbabilities: Record<DealStage, number> = {
      QUALIFICATION: 10,
      DISCOVERY: 30,
      PROPOSAL: 60,
      NEGOTIATION: 80,
      CLOSED_WON: 100,
      CLOSED_LOST: 0,
    };

    const prob = configuredProb !== undefined ? configuredProb : stageProbabilities[newStage];

    setFormData((prev) => ({
      ...prev,
      stage: newStage,
      probability: prob,
    }));
  };

  const handleCustomerSelect = (customerIdStr: string) => {
    if (!customerIdStr) {
      setFormData((prev) => ({
        ...prev,
        customerId: undefined,
        customerName: '',
      }));
      return;
    }
    const selected = customers.find((c) => c.id === Number(customerIdStr));
    setFormData((prev) => ({
      ...prev,
      customerId: selected ? selected.id : undefined,
      customerName: selected ? selected.name : '',
    }));
  };

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
    if (!formData.dealName.trim()) {
      setError('Deal name is required.');
      return;
    }
    if (!formData.amount || formData.amount <= 0) {
      setError('Deal value/amount must be greater than ₹0.');
      return;
    }

    try {
      setLoading(true);
      setError(null);
      await onSubmit(deal.id, formData);
      onClose();
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to update deal.');
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
          <div className="flex items-center space-x-2.5">
            <div className="w-8 h-8 rounded-xl bg-indigo-600/20 border border-indigo-500/30 flex items-center justify-center text-indigo-400">
              <TrendingUp className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-100">Edit Deal: {deal.dealName}</h3>
              <p className="text-xs text-slate-400 mt-0.5">Modify terms, opportunity stages, or close date</p>
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
              Deal Name / Opportunity Title *
            </label>
            <input
              type="text"
              required
              value={formData.dealName}
              onChange={(e) => setFormData({ ...formData, dealName: e.target.value })}
              className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-slate-200 text-sm focus:outline-none focus:border-indigo-500"
            />
          </div>

          {/* Product Line Items Builder */}
          <div className="space-y-3 p-4 bg-slate-950/60 border border-slate-800 rounded-xl">
            <div className="flex items-center justify-between">
              <div>
                <label className="block text-xs font-bold text-slate-200 flex items-center gap-1.5 uppercase tracking-wider">
                  <Package className="w-4 h-4 text-indigo-400" />
                  Deal Products & Line Items ({dealItems.length})
                </label>
                <p className="text-[11px] text-slate-400 mt-0.5">
                  Select catalog products to auto-calculate deal amount with quantities & discounts
                </p>
              </div>
              <button
                type="button"
                onClick={addItemRow}
                disabled={products.length === 0}
                className="flex items-center space-x-1.5 px-3 py-1.5 bg-indigo-600/20 hover:bg-indigo-600/30 text-indigo-300 border border-indigo-500/30 rounded-lg text-xs font-semibold transition-colors disabled:opacity-50"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Add Product</span>
              </button>
            </div>

            {dealItems.length > 0 ? (
              <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                {dealItems.map((item, idx) => (
                  <div
                    key={idx}
                    className="grid grid-cols-12 gap-2 p-2.5 bg-slate-900/90 border border-slate-800 rounded-xl items-center text-xs"
                  >
                    {/* Product Selector */}
                    <div className="col-span-5">
                      <select
                        value={item.productId}
                        onChange={(e) => updateItemRow(idx, { productId: Number(e.target.value) })}
                        className="w-full px-2.5 py-1.5 bg-slate-950 border border-slate-800 rounded-lg text-slate-200 text-xs focus:outline-none focus:border-indigo-500"
                      >
                        {products.map((p) => (
                          <option key={p.id} value={p.id}>
                            {p.name} (₹{p.unitPrice?.toLocaleString('en-IN')})
                          </option>
                        ))}
                      </select>
                    </div>

                    {/* Quantity */}
                    <div className="col-span-2">
                      <input
                        type="number"
                        min="1"
                        placeholder="Qty"
                        value={item.quantity}
                        onChange={(e) => updateItemRow(idx, { quantity: Math.max(1, Number(e.target.value)) })}
                        className="w-full px-2 py-1.5 bg-slate-950 border border-slate-800 rounded-lg text-slate-200 text-xs text-center focus:outline-none focus:border-indigo-500"
                      />
                    </div>

                    {/* Discount % */}
                    <div className="col-span-2">
                      <div className="relative">
                        <input
                          type="number"
                          min="0"
                          max="100"
                          placeholder="Disc %"
                          value={item.discountPercentage || 0}
                          onChange={(e) => updateItemRow(idx, { discountPercentage: Number(e.target.value) })}
                          className="w-full pl-2 pr-4 py-1.5 bg-slate-950 border border-slate-800 rounded-lg text-slate-200 text-xs text-center focus:outline-none focus:border-indigo-500"
                        />
                        <span className="absolute right-1.5 top-1.5 text-[10px] text-slate-500">%</span>
                      </div>
                    </div>

                    {/* Line Total */}
                    <div className="col-span-2 text-right font-bold text-emerald-400">
                      ₹{item.totalPrice.toLocaleString('en-IN')}
                    </div>

                    {/* Remove Action */}
                    <div className="col-span-1 flex justify-end">
                      <button
                        type="button"
                        onClick={() => removeItemRow(idx)}
                        className="p-1 text-slate-500 hover:text-rose-400 hover:bg-slate-800 rounded transition-colors"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-3 text-xs text-slate-500 bg-slate-900/40 rounded-xl border border-dashed border-slate-800">
                No products added yet. Click &ldquo;+ Add Product&rdquo; to attach catalog items.
              </div>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                Deal Amount (₹) *
              </label>
              <div className="relative">
                <IndianRupee className="w-4 h-4 text-slate-500 absolute left-3 top-3" />
                <input
                  type="number"
                  required
                  min="1"
                  step="1000"
                  value={formData.amount}
                  onChange={(e) => setFormData({ ...formData, amount: Number(e.target.value) })}
                  className="w-full pl-9 pr-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-slate-200 text-sm focus:outline-none focus:border-indigo-500"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                Pipeline Stage
              </label>
              <select
                value={formData.stage}
                onChange={(e) => handleStageChange(e.target.value as DealStage)}
                className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-slate-200 text-sm focus:outline-none focus:border-indigo-500"
              >
                <option value="QUALIFICATION">Qualification (10%)</option>
                <option value="DISCOVERY">Discovery & Demo (30%)</option>
                <option value="PROPOSAL">Proposal / Quote (60%)</option>
                <option value="NEGOTIATION">Negotiation (80%)</option>
                <option value="CLOSED_WON">Closed Won (100%)</option>
                <option value="CLOSED_LOST">Closed Lost (0%)</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                Probability (%)
              </label>
              <div className="relative">
                <Percent className="w-3.5 h-3.5 text-slate-500 absolute left-3 top-3" />
                <input
                  type="number"
                  min="0"
                  max="100"
                  value={formData.probability ?? 10}
                  onChange={(e) => setFormData({ ...formData, probability: Number(e.target.value) })}
                  className="w-full pl-9 pr-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-slate-200 text-sm focus:outline-none focus:border-indigo-500"
                />
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                Expected Close Date
              </label>
              <div className="relative">
                <Calendar className="w-4 h-4 text-slate-500 absolute left-3 top-3" />
                <input
                  type="date"
                  value={formData.expectedCloseDate || ''}
                  onChange={(e) => setFormData({ ...formData, expectedCloseDate: e.target.value })}
                  className="w-full pl-9 pr-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-slate-200 text-sm focus:outline-none focus:border-indigo-500"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                Deal Type
              </label>
              <select
                value={formData.dealType}
                onChange={(e) => setFormData({ ...formData, dealType: e.target.value as DealType })}
                className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-slate-200 text-sm focus:outline-none focus:border-indigo-500"
              >
                <option value="NEW_BUSINESS">New Business</option>
                <option value="EXISTING_BUSINESS">Existing Business</option>
                <option value="EXPANSION_UPSELL">Expansion / Upsell</option>
                <option value="RENEWAL">Renewal</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                Priority
              </label>
              <select
                value={formData.priority}
                onChange={(e) => setFormData({ ...formData, priority: e.target.value as DealPriority })}
                className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-slate-200 text-sm focus:outline-none focus:border-indigo-500"
              >
                <option value="LOW">Low</option>
                <option value="MEDIUM">Medium</option>
                <option value="HIGH">High</option>
                <option value="URGENT">Urgent (P0)</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                Customer Account
              </label>
              <div className="relative">
                <Building2 className="w-4 h-4 text-slate-500 absolute left-3 top-3" />
                <select
                  value={formData.customerId || ''}
                  onChange={(e) => handleCustomerSelect(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-slate-200 text-sm focus:outline-none focus:border-indigo-500"
                >
                  <option value="">-- Or custom account name --</option>
                  {customers.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                Account / Prospect Name
              </label>
              <input
                type="text"
                value={formData.customerName || ''}
                onChange={(e) => setFormData({ ...formData, customerName: e.target.value })}
                className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-slate-200 text-sm focus:outline-none focus:border-indigo-500"
              />
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="block text-xs font-semibold text-slate-300">
                Assigned Sales Executive
              </label>
              {isEmployee && (
                <span className="text-[10px] font-semibold text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded border border-amber-500/20">
                  Reassignment locked (Managers only)
                </span>
              )}
            </div>
            {isEmployee ? (
              <div className="relative">
                <Lock className="w-4 h-4 text-indigo-400 absolute left-3 top-3" />
                <input
                  type="text"
                  value={formData.assignedToUserName || 'Unassigned'}
                  disabled
                  className="w-full pl-9 pr-3 py-2 bg-slate-900/80 border border-slate-800 rounded-xl text-indigo-300 text-sm font-medium cursor-not-allowed"
                />
              </div>
            ) : (
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
            )}
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5">
              Deal Scope & Strategic Notes
            </label>
            <div className="relative">
              <FileText className="w-4 h-4 text-slate-500 absolute left-3 top-3" />
              <textarea
                rows={3}
                value={formData.description || ''}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                className="w-full pl-9 pr-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-slate-200 text-sm focus:outline-none focus:border-indigo-500"
              />
            </div>
          </div>

          {formData.stage === 'CLOSED_LOST' && (
            <div>
              <label className="block text-xs font-semibold text-rose-400 mb-1.5">
                Loss Reason
              </label>
              <input
                type="text"
                value={formData.lossReason || ''}
                onChange={(e) => setFormData({ ...formData, lossReason: e.target.value })}
                placeholder="Why was the deal lost?"
                className="w-full px-3 py-2 bg-slate-950 border border-rose-500/40 rounded-xl text-slate-200 text-sm focus:outline-none focus:border-rose-500"
              />
            </div>
          )}

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
              {loading ? 'Saving...' : 'Save Changes'}
            </button>
          </div>
        </form>
      </div>
    </div>
    </ModalPortal>
  );
};
