import { ModalPortal } from '../ModalPortal';
import React from 'react';
import { Deal, DealStage } from '../../types/deal';
import { DealStageBadge } from './DealStageBadge';
import { DealPriorityBadge } from './DealPriorityBadge';
import { DealTypeBadge } from './DealTypeBadge';
import {
  X,
  TrendingUp,
  Calendar,
  User as UserIcon,
  Building2,
  FileText,
  Clock,
  Edit2,
  Trophy,
  XCircle,
  Package,
} from 'lucide-react';

interface DealDetailsModalProps {
  isOpen: boolean;
  onClose: () => void;
  deal: Deal | null;
  onStageChange: (id: number, stage: DealStage) => Promise<void>;
  onOpenWonModal: (deal: Deal) => void;
  onOpenLostModal: (deal: Deal) => void;
  onEdit: (deal: Deal) => void;
  canEdit?: boolean;
}

const STAGES: DealStage[] = [
  'QUALIFICATION',
  'DISCOVERY',
  'PROPOSAL',
  'NEGOTIATION',
  'CLOSED_WON',
  'CLOSED_LOST',
];

export const DealDetailsModal: React.FC<DealDetailsModalProps> = ({
  isOpen,
  onClose,
  deal,
  onStageChange,
  onOpenWonModal,
  onOpenLostModal,
  onEdit,
  canEdit = true,
}) => {
  if (!isOpen || !deal) return null;

  return (
    <ModalPortal>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-fade-in">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-3xl overflow-hidden shadow-2xl animate-scale-up max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-start justify-between px-6 py-5 border-b border-slate-800 bg-slate-900/60">
          <div className="flex items-start space-x-3.5">
            <div className="w-10 h-10 rounded-xl bg-indigo-600/15 border border-indigo-500/30 flex items-center justify-center text-indigo-400 font-bold">
              <TrendingUp className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <DealStageBadge stage={deal.stage} />
                <DealPriorityBadge priority={deal.priority} />
                <DealTypeBadge dealType={deal.dealType} />
              </div>
              <h3 className="text-xl font-bold text-slate-100 mt-1">{deal.dealName}</h3>
              {deal.customerName && (
                <span className="text-xs text-slate-400 flex items-center gap-1 mt-0.5">
                  <Building2 className="w-3.5 h-3.5 text-slate-500" />
                  {deal.customerName}
                </span>
              )}
            </div>
          </div>
          <div className="flex items-center space-x-2">
            {canEdit && (
              <button
                onClick={() => {
                  onClose();
                  onEdit(deal);
                }}
                className="p-2 text-slate-400 hover:text-amber-400 rounded-xl hover:bg-slate-800 transition-colors"
                title="Edit Deal"
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
          {/* Closed Won Customer Account Card */}
          {(deal.stage === 'CLOSED_WON' || deal.customerId) && (
            <div className="p-4 rounded-2xl bg-emerald-950/40 border border-emerald-500/30 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-lg">
              <div className="flex items-center space-x-3.5">
                <div className="p-2.5 bg-emerald-500/20 border border-emerald-500/30 rounded-xl text-emerald-400">
                  <Building2 className="w-5 h-5" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 bg-emerald-500/20 text-emerald-300 rounded border border-emerald-500/30">
                      Active Customer Account
                    </span>
                    {deal.customerId && (
                      <span className="text-[11px] text-slate-400">Account ID: #{deal.customerId}</span>
                    )}
                  </div>
                  <h4 className="text-sm font-bold text-white mt-1">
                    {deal.customerName || 'Converted Customer'}
                  </h4>
                  <p className="text-[11px] text-slate-400 mt-0.5">
                    Recognized ARR: <span className="text-emerald-400 font-bold">₹{deal.amount?.toLocaleString()}</span> • Entitlements & subscriptions synchronized
                  </p>
                </div>
              </div>
              <a
                href="/customers"
                className="inline-flex items-center justify-center gap-1.5 px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold rounded-xl transition-all shadow-md shrink-0"
              >
                <span>Open in Customer Accounts</span>
                <span>↗</span>
              </a>
            </div>
          )}

          {/* Revenue & Forecast Highlight Banner */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="p-4 rounded-2xl bg-indigo-950/40 border border-indigo-500/20">
              <span className="text-[11px] font-semibold text-indigo-300 uppercase tracking-wider block">
                Total Deal Value
              </span>
              <div className="text-2xl font-black text-indigo-300 mt-1">
                ₹{deal.amount?.toLocaleString()}
              </div>
            </div>

            <div className="p-4 rounded-2xl bg-emerald-950/40 border border-emerald-500/20">
              <span className="text-[11px] font-semibold text-emerald-300 uppercase tracking-wider block">
                Weighted Revenue ({deal.probability}%)
              </span>
              <div className="text-2xl font-black text-emerald-400 mt-1">
                ₹{deal.expectedRevenue?.toLocaleString()}
              </div>
            </div>

            <div className="p-4 rounded-2xl bg-slate-950/70 border border-slate-800">
              <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block">
                Expected Close
              </span>
              <div className="text-sm font-bold text-slate-200 mt-2 flex items-center gap-1.5">
                <Calendar className="w-4 h-4 text-slate-500" />
                <span>{deal.expectedCloseDate || 'Not specified'}</span>
              </div>
            </div>
          </div>

          {/* Pipeline Stage Progression Stepper */}
          <div className="space-y-2.5">
            <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider">
              Pipeline Stage Progression
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-6 gap-2">
              {STAGES.map((st) => {
                const isCurrent = deal.stage === st;
                return (
                  <button
                    key={st}
                    onClick={() => onStageChange(deal.id, st)}
                    className={`px-2.5 py-2 rounded-xl text-xs font-bold border transition-all text-center ${
                      isCurrent
                        ? 'bg-indigo-600/30 text-indigo-200 border-indigo-500 shadow-md shadow-indigo-500/20'
                        : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-slate-200 hover:border-slate-700'
                    }`}
                  >
                    {st === 'QUALIFICATION' ? 'Qual (10%)'
                      : st === 'DISCOVERY' ? 'Demo (30%)'
                      : st === 'PROPOSAL' ? 'Quote (60%)'
                      : st === 'NEGOTIATION' ? 'Negot (80%)'
                      : st === 'CLOSED_WON' ? 'Won (100%)'
                      : 'Lost (0%)'}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Product Line Items Breakdown */}
          {deal.items && deal.items.length > 0 && (
            <div className="space-y-3 p-4 rounded-2xl bg-slate-950/80 border border-slate-800">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2 text-xs font-bold text-slate-300 uppercase tracking-wider">
                  <Package className="w-4 h-4 text-indigo-400" />
                  <span>Purchased / Proposed Line Items ({deal.items.length})</span>
                </div>
                <span className="text-xs font-bold text-emerald-400">
                  Total Value: ₹{deal.amount?.toLocaleString('en-IN')}
                </span>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="border-b border-slate-800 text-slate-400 uppercase tracking-wider text-[10px]">
                      <th className="py-2 px-3">Product Name</th>
                      <th className="py-2 px-3 text-center">Qty</th>
                      <th className="py-2 px-3 text-right">Unit Price</th>
                      <th className="py-2 px-3 text-right">Discount</th>
                      <th className="py-2 px-3 text-right">Subtotal</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/50 text-slate-200">
                    {deal.items.map((item, idx) => (
                      <tr key={idx} className="hover:bg-slate-900/40">
                        <td className="py-2.5 px-3 font-semibold text-slate-100">{item.productName || `Product #${item.productId}`}</td>
                        <td className="py-2.5 px-3 text-center">{item.quantity}</td>
                        <td className="py-2.5 px-3 text-right">₹{item.unitPrice?.toLocaleString('en-IN')}</td>
                        <td className="py-2.5 px-3 text-right text-amber-400">
                          {item.discountPercentage ? `${item.discountPercentage}%` : item.discountAmount ? `₹${item.discountAmount}` : '0%'}
                        </td>
                        <td className="py-2.5 px-3 text-right font-bold text-emerald-400">
                          ₹{item.totalPrice?.toLocaleString('en-IN')}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Fast Won / Lost Action Banner */}
          {!deal.isWon && !deal.isLost && (
            <div className="p-4 rounded-2xl bg-slate-950/80 border border-slate-800 flex items-center justify-between">
              <div>
                <h4 className="text-xs font-bold text-slate-200">Close this Opportunity</h4>
                <p className="text-[11px] text-slate-400 mt-0.5">Finalize revenue recognition or log reason for lost deal</p>
              </div>
              <div className="flex items-center space-x-2">
                <button
                  onClick={() => {
                    onClose();
                    onOpenWonModal(deal);
                  }}
                  className="flex items-center gap-1.5 px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold rounded-xl shadow transition-colors"
                >
                  <Trophy className="w-3.5 h-3.5" />
                  Close Won
                </button>
                <button
                  onClick={() => {
                    onClose();
                    onOpenLostModal(deal);
                  }}
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-rose-600/20 text-rose-400 border border-rose-500/30 hover:bg-rose-600/30 text-xs font-bold rounded-xl transition-colors"
                >
                  <XCircle className="w-3.5 h-3.5" />
                  Close Lost
                </button>
              </div>
            </div>
          )}

          {/* Loss reason if closed lost */}
          {deal.isLost && deal.lossReason && (
            <div className="p-4 rounded-2xl bg-rose-500/10 border border-rose-500/20 text-xs space-y-1">
              <span className="font-bold text-rose-400 uppercase tracking-wider block">Loss Reason:</span>
              <p className="text-slate-300">{deal.lossReason}</p>
            </div>
          )}

          {/* Description & Scope */}
          <div className="p-4 rounded-2xl bg-slate-950/50 border border-slate-800 space-y-2">
            <h4 className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
              <FileText className="w-4 h-4 text-amber-400" />
              Strategic Notes & Scope
            </h4>
            <p className="text-xs text-slate-300 whitespace-pre-wrap leading-relaxed">
              {deal.description || 'No detailed scope notes provided.'}
            </p>
          </div>

          {/* Metadata Footer */}
          <div className="flex items-center justify-between text-[11px] text-slate-500 pt-3 border-t border-slate-800/80">
            <span className="flex items-center gap-1">
              <UserIcon className="w-3.5 h-3.5" />
              Assigned: {deal.assignedToUserName || 'Unassigned'}
            </span>
            <span className="flex items-center gap-1">
              <Clock className="w-3.5 h-3.5" />
              Created: {new Date(deal.createdAt).toLocaleDateString()}
            </span>
          </div>
        </div>
      </div>
    </div>
    </ModalPortal>
  );
};
