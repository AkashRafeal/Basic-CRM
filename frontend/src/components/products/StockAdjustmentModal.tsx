import { ModalPortal } from '../ModalPortal';
import React, { useState } from 'react';
import { X, Boxes, Plus, Minus, Shield } from 'lucide-react';
import { Product } from '../../types/product';
import { productApi } from '../../api/productApi';

interface StockAdjustmentModalProps {
  isOpen: boolean;
  product: Product | null;
  onClose: () => void;
  onSuccess: () => void;
}

export const StockAdjustmentModal: React.FC<StockAdjustmentModalProps> = ({
  isOpen,
  product,
  onClose,
  onSuccess,
}) => {
  const [adjustmentType, setAdjustmentType] = useState<'RESTOCK' | 'DEDUCT'>('RESTOCK');
  const [quantity, setQuantity] = useState<number>(10);
  const [reason, setReason] = useState<string>('Warehouse shipment receipt');
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen || !product) return null;

  const currentStock = product.stockQuantity || 0;
  const changeValue = adjustmentType === 'RESTOCK' ? quantity : -quantity;
  const resultantStock = currentStock + changeValue;

  const handleAdjust = async (e: React.FormEvent) => {
    e.preventDefault();
    if (quantity <= 0) {
      setError('Adjustment quantity must be greater than zero.');
      return;
    }
    if (resultantStock < 0) {
      setError(`Cannot deduct ${quantity} units. Available inventory is only ${currentStock}.`);
      return;
    }

    try {
      setLoading(true);
      setError(null);
      await productApi.adjustStock(product.id, {
        quantityChange: changeValue,
        reason: reason.trim() || 'Inventory level adjustment',
      });
      onSuccess();
      onClose();
    } catch (err: any) {
      console.error('Failed to adjust stock:', err);
      setError(err.response?.data?.message || 'Failed to update inventory level.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <ModalPortal>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-in fade-in duration-200">
      <div className="bg-slate-900 border border-slate-700/80 rounded-2xl w-full max-w-lg shadow-2xl overflow-hidden text-slate-200">
        {/* Header */}
        <div className="p-6 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-amber-500/10 border border-amber-500/30 rounded-xl text-amber-400">
              <Boxes className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-white">Adjust Stock Level</h2>
              <p className="text-xs text-slate-400">
                {product.name} <span className="text-slate-500 font-mono">({product.sku})</span>
              </p>
            </div>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-white p-2 rounded-lg hover:bg-slate-800 transition">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleAdjust} className="p-6 space-y-5">
          {error && (
            <div className="p-3.5 bg-rose-500/10 border border-rose-500/30 rounded-xl text-rose-300 text-xs flex items-center gap-2 font-medium">
              <Shield className="w-4 h-4 shrink-0 text-rose-400" />
              <span>{error}</span>
            </div>
          )}

          {/* Current vs New Stock Preview */}
          <div className="grid grid-cols-3 gap-3 p-4 bg-slate-950 border border-slate-800 rounded-xl text-center">
            <div>
              <span className="text-[11px] font-semibold text-slate-400 block">Current Stock</span>
              <span className="text-lg font-bold text-slate-200">{currentStock}</span>
            </div>
            <div>
              <span className="text-[11px] font-semibold text-slate-400 block">Adjustment</span>
              <span className={`text-lg font-bold ${adjustmentType === 'RESTOCK' ? 'text-emerald-400' : 'text-rose-400'}`}>
                {adjustmentType === 'RESTOCK' ? `+${quantity}` : `-${quantity}`}
              </span>
            </div>
            <div>
              <span className="text-[11px] font-semibold text-slate-400 block">New Level</span>
              <span className={`text-lg font-bold ${resultantStock < 0 ? 'text-rose-400' : 'text-indigo-400'}`}>
                {resultantStock}
              </span>
            </div>
          </div>

          {/* Restock vs Deduct Toggle */}
          <div className="grid grid-cols-2 gap-3">
            <button
              type="button"
              onClick={() => setAdjustmentType('RESTOCK')}
              className={`p-3 rounded-xl border flex items-center justify-center gap-2 font-bold text-sm transition ${
                adjustmentType === 'RESTOCK'
                  ? 'bg-emerald-500/15 border-emerald-500/40 text-emerald-400 shadow-md shadow-emerald-500/10'
                  : 'bg-slate-950/60 border-slate-800 text-slate-400 hover:text-white'
              }`}
            >
              <Plus className="w-4 h-4" /> Restock (+)
            </button>
            <button
              type="button"
              onClick={() => setAdjustmentType('DEDUCT')}
              className={`p-3 rounded-xl border flex items-center justify-center gap-2 font-bold text-sm transition ${
                adjustmentType === 'DEDUCT'
                  ? 'bg-rose-500/15 border-rose-500/40 text-rose-400 shadow-md shadow-rose-500/10'
                  : 'bg-slate-950/60 border-slate-800 text-slate-400 hover:text-white'
              }`}
            >
              <Minus className="w-4 h-4" /> Deduct (-)
            </button>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5">Units to {adjustmentType === 'RESTOCK' ? 'Add' : 'Deduct'}</label>
            <input
              type="number"
              min="1"
              required
              value={quantity}
              onChange={(e) => setQuantity(Math.max(1, parseInt(e.target.value) || 0))}
              className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3.5 py-2.5 text-sm text-white font-bold focus:ring-2 focus:ring-amber-500 focus:border-amber-500 outline-none transition"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5">Audit Reason / Note</label>
            <input
              type="text"
              required
              placeholder="e.g. PO-8821 Arrival, Defect write-off..."
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3.5 py-2.5 text-sm text-white font-medium focus:ring-2 focus:ring-amber-500 focus:border-amber-500 outline-none transition"
            />
          </div>

          <div className="pt-3 border-t border-slate-800 flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl border border-slate-700 text-slate-300 font-semibold text-sm hover:bg-slate-800 transition"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading || resultantStock < 0}
              className="px-5 py-2 rounded-xl bg-gradient-to-r from-amber-600 to-amber-700 hover:from-amber-500 hover:to-amber-600 text-white font-bold text-sm shadow-lg shadow-amber-500/25 transition disabled:opacity-50"
            >
              {loading ? 'Updating...' : 'Save Stock Adjustment'}
            </button>
          </div>
        </form>
      </div>
    </div>
    </ModalPortal>
  );
};
