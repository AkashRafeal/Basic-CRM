import { ModalPortal } from '../ModalPortal';
import React from 'react';
import { X, Package, ShieldCheck } from 'lucide-react';
import { Product } from '../../types/product';
import { useAuth } from '../../context/AuthContext';

interface ProductDetailModalProps {
  isOpen: boolean;
  product: Product | null;
  onClose: () => void;
  onEdit?: (product: Product) => void;
}

export const ProductDetailModal: React.FC<ProductDetailModalProps> = ({
  isOpen,
  product,
  onClose,
  onEdit,
}) => {
  const { isAdmin, isManager } = useAuth();

  if (!isOpen || !product) return null;

  const canViewMargins = isAdmin || isManager;

  return (
    <ModalPortal>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-in fade-in duration-200">
      <div className="bg-slate-900 border border-slate-700/80 rounded-2xl w-full max-w-2xl max-h-[90vh] flex flex-col shadow-2xl overflow-hidden text-slate-200">
        {/* Header */}
        <div className="p-6 border-b border-slate-800 flex items-center justify-between bg-slate-900/95 sticky top-0 z-10">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-indigo-500/10 border border-indigo-500/30 rounded-xl text-indigo-400">
              <Package className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-xl font-bold text-white">{product.name}</h2>
                <span className="font-mono text-xs px-2 py-0.5 rounded-md bg-slate-800 border border-slate-700 text-indigo-300 font-bold">
                  {product.sku}
                </span>
              </div>
              <p className="text-xs text-slate-400">{product.categoryDisplayName}</p>
            </div>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-white p-2 rounded-lg hover:bg-slate-800 transition">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="overflow-y-auto p-6 space-y-6">
          {/* Key Value Bar */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="p-3.5 bg-slate-950/70 border border-slate-800 rounded-xl">
              <span className="text-[11px] font-semibold text-slate-400 block mb-1">Unit Price</span>
              <span className="text-lg font-bold text-emerald-400 flex items-center">
                ₹{product.unitPrice?.toLocaleString('en-IN')}
              </span>
            </div>

            <div className="p-3.5 bg-slate-950/70 border border-slate-800 rounded-xl">
              <span className="text-[11px] font-semibold text-slate-400 block mb-1">Billing Cycle</span>
              <span className="text-sm font-bold text-white">{product.billingFrequencyDisplayName}</span>
            </div>

            <div className="p-3.5 bg-slate-950/70 border border-slate-800 rounded-xl">
              <span className="text-[11px] font-semibold text-slate-400 block mb-1">Status</span>
              <span className={`text-xs font-bold px-2 py-1 rounded-md inline-block ${
                product.status === 'ACTIVE'
                  ? 'bg-emerald-500/15 border border-emerald-500/30 text-emerald-400'
                  : product.status === 'OUT_OF_STOCK'
                  ? 'bg-rose-500/15 border border-rose-500/30 text-rose-400'
                  : 'bg-slate-800 border border-slate-700 text-slate-300'
              }`}>
                {product.statusDisplayName}
              </span>
            </div>

            <div className="p-3.5 bg-slate-950/70 border border-slate-800 rounded-xl">
              <span className="text-[11px] font-semibold text-slate-400 block mb-1">Tax Rate (GST)</span>
              <span className="text-sm font-bold text-slate-200">{product.taxRate || 18}%</span>
            </div>
          </div>

          {/* Description */}
          {product.description && (
            <div className="p-4 bg-slate-950/40 border border-slate-800/80 rounded-xl space-y-1.5">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-400 block">Product Overview</span>
              <p className="text-sm text-slate-300 leading-relaxed">{product.description}</p>
            </div>
          )}

          {/* Cost & Gross Margin (Admin/Manager Only) */}
          {canViewMargins && product.costPrice !== null && product.costPrice !== undefined && (
            <div className="p-4 bg-indigo-950/20 border border-indigo-500/30 rounded-xl space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold uppercase tracking-wider text-indigo-400 flex items-center gap-1.5">
                  <ShieldCheck className="w-4 h-4" /> Internal Profitability & Margin (Admin / Manager)
                </span>
              </div>
              <div className="grid grid-cols-3 gap-3 text-center">
                <div className="p-2.5 bg-slate-950/80 border border-slate-800 rounded-lg">
                  <span className="text-[10px] text-slate-400 block">COGS / Unit Cost</span>
                  <span className="text-sm font-bold text-slate-200">₹{product.costPrice?.toLocaleString('en-IN')}</span>
                </div>
                <div className="p-2.5 bg-slate-950/80 border border-slate-800 rounded-lg">
                  <span className="text-[10px] text-slate-400 block">Gross Profit per Unit</span>
                  <span className="text-sm font-bold text-emerald-400">
                    ₹{(product.marginAmount || 0).toLocaleString('en-IN')}
                  </span>
                </div>
                <div className="p-2.5 bg-slate-950/80 border border-slate-800 rounded-lg">
                  <span className="text-[10px] text-slate-400 block">Gross Margin %</span>
                  <span className="text-sm font-bold text-indigo-300">
                    {product.marginPercent ? `${product.marginPercent}%` : 'N/A'}
                  </span>
                </div>
              </div>
            </div>
          )}

          {/* Physical Inventory & Stock */}
          {product.isPhysical && (
            <div className="p-4 bg-slate-950/60 border border-slate-800 rounded-xl space-y-3">
              <span className="text-xs font-bold uppercase tracking-wider text-amber-400 block">
                Warehouse & Stock Levels
              </span>
              <div className="grid grid-cols-3 gap-3">
                <div>
                  <span className="text-[11px] text-slate-400 block">Available Units</span>
                  <span className="text-base font-bold text-white">{product.stockQuantity || 0} Units</span>
                </div>
                <div>
                  <span className="text-[11px] text-slate-400 block">Low Stock Alert Level</span>
                  <span className="text-base font-bold text-amber-400">{product.lowStockThreshold || 10} Units</span>
                </div>
                <div>
                  <span className="text-[11px] text-slate-400 block">Inventory Status</span>
                  <span className={`text-xs font-bold px-2 py-0.5 rounded-full inline-block mt-0.5 ${
                    product.isLowStock
                      ? 'bg-rose-500/20 text-rose-400 border border-rose-500/30'
                      : 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                  }`}>
                    {product.isLowStock ? 'Low Stock Warning' : 'Healthy Inventory'}
                  </span>
                </div>
              </div>
            </div>
          )}

          {/* Audit Info */}
          <div className="pt-4 border-t border-slate-800 grid grid-cols-2 gap-4 text-xs text-slate-500">
            <div>
              <span>Created by: </span>
              <span className="text-slate-300 font-semibold">{product.createdByUserName || 'System'}</span>
            </div>
            <div>
              <span>Created at: </span>
              <span className="text-slate-300 font-semibold">
                {product.createdAt ? new Date(product.createdAt).toLocaleString() : 'N/A'}
              </span>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-slate-800 bg-slate-900/95 sticky bottom-0 z-10 flex items-center justify-between">
          <span className="text-xs text-slate-500 font-mono">ID: {product.id}</span>
          <div className="flex items-center gap-3">
            <button
              onClick={onClose}
              className="px-5 py-2 rounded-xl border border-slate-700 text-slate-300 font-semibold text-sm hover:bg-slate-800 transition"
            >
              Close
            </button>
            {onEdit && isAdmin && (
              <button
                onClick={() => {
                  onClose();
                  onEdit(product);
                }}
                className="px-5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-sm shadow-lg shadow-indigo-500/25 transition"
              >
                Edit Item
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
    </ModalPortal>
  );
};
