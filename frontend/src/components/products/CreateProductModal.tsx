import { ModalPortal } from '../ModalPortal';
import React, { useState } from 'react';
import { X, Package, Shield, IndianRupee, Layers, Percent } from 'lucide-react';
import { ProductCategory, BillingFrequency, ProductStatus, CreateProductDTO, CategoryItem } from '../../types/product';
import { productApi } from '../../api/productApi';

interface CreateProductModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  categories?: CategoryItem[];
}

const getInitialFormState = (defaultCategory = ''): CreateProductDTO => ({
  name: '',
  sku: '',
  category: defaultCategory,
  description: '',
  unitPrice: 0,
  costPrice: 0,
  taxRate: 18.0,
  billingFrequency: 'MONTHLY',
  status: 'ACTIVE',
  stockQuantity: undefined,
  lowStockThreshold: 10,
  minQuantity: 1,
  maxDiscountPercent: 20.0,
  isPhysical: false,
  currencyCode: 'INR',
});

export const CreateProductModal: React.FC<CreateProductModalProps> = ({ isOpen, onClose, onSuccess, categories: propCategories }) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [categories, setCategories] = useState<CategoryItem[]>(propCategories || []);
  const [formData, setFormData] = useState<CreateProductDTO>(getInitialFormState(propCategories?.[0]?.code || ''));

  const handleClose = () => {
    setError(null);
    setFormData(getInitialFormState(categories[0]?.code || ''));
    onClose();
  };

  React.useEffect(() => {
    if (isOpen) {
      setError(null);
      setLoading(false);
      if (propCategories && propCategories.length > 0) {
        setCategories(propCategories);
        setFormData(getInitialFormState(propCategories[0].code || propCategories[0].name));
      } else {
        productApi.getCategories().then((list) => {
          setCategories(list);
          setFormData(getInitialFormState(list[0]?.code || list[0]?.name || ''));
        }).catch(() => {
          setFormData(getInitialFormState(''));
        });
      }
    }
  }, [isOpen, propCategories]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim()) {
      setError('Product / Service name is required.');
      return;
    }
    if (!formData.sku.trim()) {
      setError('SKU identifier is required.');
      return;
    }
    if (formData.unitPrice < 0) {
      setError('Unit price cannot be negative.');
      return;
    }

    try {
      setLoading(true);
      setError(null);
      await productApi.createProduct(formData);
      onSuccess();
      setFormData(getInitialFormState(categories[0]?.code || ''));
      onClose();
    } catch (err: any) {
      console.error('Failed to create product:', err);
      const msg = err.response?.data?.message || err.response?.data?.data?.name || 'Failed to add product to catalog.';
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <ModalPortal>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-in fade-in duration-200">
      <div className="bg-slate-900 border border-slate-700/80 rounded-2xl w-full max-w-2xl max-h-[90vh] flex flex-col shadow-2xl overflow-hidden">
        {/* Sticky Header */}
        <div className="p-6 border-b border-slate-800 bg-slate-900/95 sticky top-0 z-10 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-indigo-500/10 border border-indigo-500/30 rounded-xl text-indigo-400">
              <Package className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-white flex items-center gap-2">
                Add Product / Service Item
                <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                  Catalog ₹
                </span>
              </h2>
              <p className="text-xs text-slate-400">Define pricing, GST rates, billing cycles, and inventory tracking</p>
            </div>
          </div>
          <button
            onClick={handleClose}
            className="text-slate-400 hover:text-white p-2 rounded-lg hover:bg-slate-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scrollable Body */}
        <form onSubmit={handleSubmit} className="overflow-y-auto p-6 space-y-6 flex-1 text-slate-200">
          {error && (
            <div className="p-4 bg-rose-500/10 border border-rose-500/30 rounded-xl text-rose-300 text-sm flex items-center gap-2 font-medium">
              <Shield className="w-4 h-4 shrink-0 text-rose-400" />
              <span>{error}</span>
            </div>
          )}

          {/* Section 1: General Info */}
          <div className="space-y-4">
            <h3 className="text-xs font-bold uppercase tracking-wider text-indigo-400 flex items-center gap-1.5">
              <Layers className="w-3.5 h-3.5" /> Item Identification
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                  Product / Service Name <span className="text-rose-400">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Enterprise Cloud CRM Suite"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3.5 py-2.5 text-sm text-white font-medium focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                  SKU Identifier <span className="text-rose-400">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. CRM-ENT-ANNUAL"
                  value={formData.sku}
                  onChange={(e) => setFormData({ ...formData, sku: e.target.value.toUpperCase() })}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3.5 py-2.5 text-sm text-white font-medium focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition uppercase"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                  Product Category <span className="text-rose-400">*</span>
                </label>
                <select
                  value={formData.category}
                  onChange={(e) => setFormData({ ...formData, category: e.target.value as ProductCategory })}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3.5 py-2.5 text-sm text-white font-medium focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition"
                >
                  {categories.length > 0 ? (
                    categories.map((c) => (
                      <option key={c.id} value={c.code || c.name}>
                        {c.name}
                      </option>
                    ))
                  ) : (
                    <option value="">No categories created yet — please create one first</option>
                  )}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                  Billing Frequency
                </label>
                <select
                  value={formData.billingFrequency}
                  onChange={(e) => setFormData({ ...formData, billingFrequency: e.target.value as BillingFrequency })}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3.5 py-2.5 text-sm text-white font-medium focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition"
                >
                  <option value="MONTHLY">Monthly Subscription</option>
                  <option value="ANNUALLY">Annual Contract</option>
                  <option value="QUARTERLY">Quarterly Billing</option>
                  <option value="ONE_TIME">One-Time Purchase</option>
                  <option value="USAGE_BASED">Usage / Consumption Based</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                Description & Specifications
              </label>
              <textarea
                rows={2}
                placeholder="Key capabilities, SLA inclusions, license terms..."
                value={formData.description || ''}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                className="w-full bg-slate-950 border border-slate-700 rounded-xl p-3 text-sm text-white focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition resize-none"
              />
            </div>
          </div>

          {/* Section 2: Pricing in ₹ & Taxes */}
          <div className="space-y-4 pt-4 border-t border-slate-800">
            <h3 className="text-xs font-bold uppercase tracking-wider text-emerald-400 flex items-center gap-1.5">
              <IndianRupee className="w-3.5 h-3.5" /> Pricing, Margins & Tax (₹ INR)
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                  Selling Price (₹) <span className="text-rose-400">*</span>
                </label>
                <div className="relative">
                  <span className="absolute left-3.5 top-2.5 text-slate-400 font-bold text-sm">₹</span>
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    required
                    placeholder="0.00"
                    value={formData.unitPrice || ''}
                    onChange={(e) => setFormData({ ...formData, unitPrice: parseFloat(e.target.value) || 0 })}
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl pl-8 pr-3.5 py-2.5 text-sm text-white font-bold focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none transition"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                  Cost / COGS (₹) <span className="text-slate-500 text-[10px]">(Admin Only)</span>
                </label>
                <div className="relative">
                  <span className="absolute left-3.5 top-2.5 text-slate-400 font-bold text-sm">₹</span>
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    placeholder="0.00"
                    value={formData.costPrice || ''}
                    onChange={(e) => setFormData({ ...formData, costPrice: parseFloat(e.target.value) || 0 })}
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl pl-8 pr-3.5 py-2.5 text-sm text-white font-medium focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none transition"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                  GST Tax Rate (%)
                </label>
                <div className="relative">
                  <input
                    type="number"
                    min="0"
                    max="100"
                    step="0.1"
                    value={formData.taxRate || 18}
                    onChange={(e) => setFormData({ ...formData, taxRate: parseFloat(e.target.value) || 0 })}
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3.5 py-2.5 text-sm text-white font-medium focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition"
                  />
                  <span className="absolute right-3.5 top-2.5 text-slate-400 font-bold text-xs">%</span>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                  Max Rep Discount Allowed (%)
                </label>
                <div className="relative">
                  <input
                    type="number"
                    min="0"
                    max="100"
                    value={formData.maxDiscountPercent || 20}
                    onChange={(e) => setFormData({ ...formData, maxDiscountPercent: parseFloat(e.target.value) || 0 })}
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3.5 py-2.5 text-sm text-white font-medium focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition"
                  />
                  <Percent className="w-3.5 h-3.5 absolute right-3.5 top-3 text-slate-400" />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                  Catalog Status
                </label>
                <select
                  value={formData.status}
                  onChange={(e) => setFormData({ ...formData, status: e.target.value as ProductStatus })}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3.5 py-2.5 text-sm text-white font-medium focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition"
                >
                  <option value="ACTIVE">Active & Sellable</option>
                  <option value="DRAFT">Draft / Under Review</option>
                  <option value="DISCONTINUED">Discontinued</option>
                </select>
              </div>
            </div>
          </div>

          {/* Section 3: Physical Goods & Inventory */}
          <div className="space-y-4 pt-4 border-t border-slate-800">
            <div
              onClick={() => setFormData((prev) => ({ ...prev, isPhysical: !prev.isPhysical }))}
              className="flex items-center justify-between p-3.5 bg-slate-950/60 hover:bg-slate-950/90 border border-slate-800 rounded-xl cursor-pointer transition select-none"
            >
              <div>
                <span className="text-sm font-semibold text-white">Physical Goods & Inventory Tracking</span>
                <p className="text-xs text-slate-400">Enable stock count, restock notifications, and warehouse levels</p>
              </div>
              <input
                type="checkbox"
                checked={formData.isPhysical}
                onChange={(e) => {
                  e.stopPropagation();
                  setFormData((prev) => ({ ...prev, isPhysical: e.target.checked }));
                }}
                className="w-5 h-5 rounded border-slate-700 bg-slate-900 text-indigo-600 focus:ring-indigo-500 cursor-pointer"
              />
            </div>

            {formData.isPhysical && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 animate-in fade-in duration-150">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                    Initial Stock Available
                  </label>
                  <input
                    type="number"
                    min="0"
                    placeholder="e.g. 50"
                    value={formData.stockQuantity || ''}
                    onChange={(e) => setFormData({ ...formData, stockQuantity: parseInt(e.target.value) || 0 })}
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3.5 py-2.5 text-sm text-white font-medium focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                    Low Stock Threshold Alert
                  </label>
                  <input
                    type="number"
                    min="1"
                    placeholder="e.g. 10"
                    value={formData.lowStockThreshold || 10}
                    onChange={(e) => setFormData({ ...formData, lowStockThreshold: parseInt(e.target.value) || 10 })}
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3.5 py-2.5 text-sm text-white font-medium focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition"
                  />
                </div>
              </div>
            )}
          </div>

          {/* Sticky Footer */}
          <div className="p-4 border-t border-slate-800 bg-slate-900/95 sticky bottom-0 z-10 flex items-center justify-end gap-3 -mx-6 -mb-6">
            <button
              type="button"
              onClick={handleClose}
              className="px-5 py-2.5 rounded-xl border border-slate-700 text-slate-300 font-semibold text-sm hover:bg-slate-800 transition"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-indigo-600 to-indigo-700 hover:from-indigo-500 hover:to-indigo-600 text-white font-bold text-sm shadow-lg shadow-indigo-500/25 transition disabled:opacity-50"
            >
              {loading ? 'Saving Item...' : 'Save Product to Catalog'}
            </button>
          </div>
        </form>
      </div>
    </div>
    </ModalPortal>
  );
};
