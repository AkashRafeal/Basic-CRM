import { ModalPortal } from '../ModalPortal';
import React from 'react';
import { Lead, LeadStatus } from '../../types/lead';
import { LeadStatusBadge } from './LeadStatusBadge';
import {
  X,
  Mail,
  Phone,
  Building,
  Briefcase,
  IndianRupee,
  Award,
  UserCheck,
  Calendar,
  CheckCircle2,
  FileText,
  Clock,
  Package
} from 'lucide-react';

interface LeadDetailsModalProps {
  isOpen: boolean;
  onClose: () => void;
  lead: Lead | null;
  onStatusChange: (id: number, status: LeadStatus) => Promise<void>;
  onConvert: (id: number) => Promise<void>;
  onEdit: (lead: Lead) => void;
}

const STAGES: LeadStatus[] = [
  'NEW',
  'CONTACTED',
  'QUALIFIED',
  'PROPOSAL_SENT',
  'NEGOTIATING',
  'CONVERTED'
];

export const LeadDetailsModal: React.FC<LeadDetailsModalProps> = ({
  isOpen,
  onClose,
  lead,
  onStatusChange,
  onConvert,
  onEdit
}) => {
  if (!isOpen || !lead) return null;

  const currentStageIndex = STAGES.indexOf(lead.leadStatus);

  return (
    <ModalPortal>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-fade-in">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-3xl overflow-hidden shadow-2xl animate-scale-up max-h-[90vh] flex flex-col">
        {/* Top bar */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-slate-900/60">
          <div className="flex items-center space-x-3">
            <div className="w-11 h-11 rounded-xl bg-indigo-600/20 border border-indigo-500/30 flex items-center justify-center text-indigo-400 font-bold text-lg">
              {lead.firstName?.[0] || 'L'}{lead.lastName?.[0] || ''}
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h2 className="text-lg font-bold text-slate-100">{lead.fullName}</h2>
                <LeadStatusBadge status={lead.leadStatus} />
              </div>
              <p className="text-xs text-slate-400">
                {lead.jobTitle ? `${lead.jobTitle} at ` : ''}{lead.company || 'Private Prospect'}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-200 p-1.5 rounded-lg hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content body */}
        <div className="overflow-y-auto p-6 space-y-6 flex-1">
          {/* Converted Deal / Opportunity Banner */}
          {lead.leadStatus === 'CONVERTED' && (
            <div className="p-4 bg-teal-500/10 border border-teal-500/30 rounded-xl flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="w-9 h-9 rounded-lg bg-teal-500/20 text-teal-400 flex items-center justify-center">
                  <CheckCircle2 className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="text-sm font-bold text-teal-300">Converted to Sales Pipeline Deal</h4>
                  <p className="text-xs text-teal-400/80">
                    Active Opportunity: <span className="font-semibold text-slate-100">{lead.company || lead.fullName} - Opportunity</span>
                    {lead.convertedDealId ? ` (Deal #${lead.convertedDealId})` : ''}
                  </p>
                  {lead.convertedCustomerId && (
                    <p className="text-[11px] text-emerald-400 font-medium mt-0.5">
                      ✓ Deal Closed Won → Active Customer Account #{lead.convertedCustomerId}
                    </p>
                  )}
                </div>
              </div>
              <div className="flex items-center gap-2">
                <a
                  href="/deals"
                  className="px-3.5 py-1.5 bg-teal-600 hover:bg-teal-500 text-white text-xs font-semibold rounded-lg shadow transition-colors flex items-center gap-1"
                >
                  <span>Open Pipeline Deal</span>
                  <Briefcase className="w-3.5 h-3.5" />
                </a>
                {lead.convertedCustomerId && (
                  <a
                    href="/customers"
                    className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold rounded-lg shadow transition-colors flex items-center gap-1"
                  >
                    <span>Customer</span>
                    <Building className="w-3.5 h-3.5" />
                  </a>
                )}
              </div>
            </div>
          )}

          {/* Visual Sales Pipeline Stage Bar */}
          <div className="bg-slate-950 p-4 rounded-xl border border-slate-800/80">
            <div className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3">
              Sales Pipeline Stage
            </div>
            <div className="grid grid-cols-6 gap-1.5">
              {STAGES.map((stage, idx) => {
                const isPassed = currentStageIndex >= idx;
                const isCurrent = lead.leadStatus === stage;
                return (
                  <button
                    key={stage}
                    onClick={() => onStatusChange(lead.id, stage)}
                    className={`py-2 px-1 rounded-lg text-xs font-medium text-center transition-all ${
                      isCurrent
                        ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30 ring-1 ring-indigo-400'
                        : isPassed
                        ? 'bg-indigo-950/60 text-indigo-300 hover:bg-indigo-900/50'
                        : 'bg-slate-900 text-slate-500 hover:bg-slate-800 hover:text-slate-300'
                    }`}
                  >
                    <div className="truncate">{stage.replace('_', ' ')}</div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Quick Metrics */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="bg-slate-950/70 p-3.5 rounded-xl border border-slate-800/60">
              <div className="flex items-center space-x-2 text-xs text-slate-400">
                <IndianRupee className="w-4 h-4 text-emerald-400" />
                <span>Estimated Value</span>
              </div>
              <div className="text-base font-bold text-emerald-400 mt-1">
                ₹{(lead.estimatedValue || 0).toLocaleString()}
              </div>
            </div>

            <div className="bg-slate-950/70 p-3.5 rounded-xl border border-slate-800/60">
              <div className="flex items-center space-x-2 text-xs text-slate-400">
                <Award className="w-4 h-4 text-amber-400" />
                <span>Quality Score</span>
              </div>
              <div className="text-base font-bold text-amber-400 mt-1">
                {lead.score || 0} / 100
              </div>
            </div>

            <div className="bg-slate-950/70 p-3.5 rounded-xl border border-slate-800/60">
              <div className="flex items-center space-x-2 text-xs text-slate-400">
                <UserCheck className="w-4 h-4 text-indigo-400" />
                <span>Assigned Rep</span>
              </div>
              <div className="text-xs font-semibold text-slate-200 mt-1 truncate">
                {lead.assignedToUserName || 'Unassigned'}
              </div>
            </div>

            <div className="bg-slate-950/70 p-3.5 rounded-xl border border-slate-800/60">
              <div className="flex items-center space-x-2 text-xs text-slate-400">
                <Calendar className="w-4 h-4 text-purple-400" />
                <span>Lead Source</span>
              </div>
              <div className="text-xs font-semibold text-slate-200 mt-1">
                {lead.sourceDisplayName}
              </div>
            </div>
          </div>

          {/* Details Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="bg-slate-950/50 p-4 rounded-xl border border-slate-800 space-y-3">
              <h4 className="text-xs font-bold text-slate-300 uppercase tracking-wider">
                Contact Information
              </h4>
              <div className="space-y-2 text-sm">
                <div className="flex items-center space-x-2.5 text-slate-300">
                  <Mail className="w-4 h-4 text-slate-500" />
                  <span>{lead.email}</span>
                </div>
                <div className="flex items-center space-x-2.5 text-slate-300">
                  <Phone className="w-4 h-4 text-slate-500" />
                  <span>{lead.phone || 'No phone provided'}</span>
                </div>
                <div className="flex items-center space-x-2.5 text-slate-300">
                  <Building className="w-4 h-4 text-slate-500" />
                  <span>{lead.company || 'N/A'}</span>
                </div>
                <div className="flex items-center space-x-2.5 text-slate-300">
                  <Briefcase className="w-4 h-4 text-slate-500" />
                  <span>{lead.jobTitle || 'N/A'}</span>
                </div>
              </div>
            </div>

            <div className="bg-slate-950/50 p-4 rounded-xl border border-slate-800 space-y-3">
              <h4 className="text-xs font-bold text-slate-300 uppercase tracking-wider">
                Timeline & Metadata
              </h4>
              <div className="space-y-2 text-sm text-slate-400">
                <div className="flex items-center space-x-2">
                  <Clock className="w-4 h-4 text-slate-500" />
                  <span>Created: {new Date(lead.createdAt).toLocaleString()}</span>
                </div>
                {lead.updatedAt && (
                  <div className="flex items-center space-x-2">
                    <Clock className="w-4 h-4 text-slate-500" />
                    <span>Last Updated: {new Date(lead.updatedAt).toLocaleString()}</span>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Interested Products / Courses */}
          {lead.interestedProducts && lead.interestedProducts.length > 0 && (
            <div className="bg-slate-950/50 p-4 rounded-xl border border-slate-800 space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2 text-xs font-bold text-slate-300 uppercase tracking-wider">
                  <Package className="w-4 h-4 text-indigo-400" />
                  <span>Interested Products & Services ({lead.interestedProducts.length})</span>
                </div>
                <span className="text-xs font-semibold text-emerald-400">
                  Total Catalog Value: ₹{lead.interestedProducts.reduce((sum, p) => sum + (p.unitPrice || 0), 0).toLocaleString('en-IN')}
                </span>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                {lead.interestedProducts.map(prod => (
                  <div
                    key={prod.productId}
                    className="p-3 bg-slate-900/80 border border-slate-800 rounded-xl flex items-center justify-between"
                  >
                    <div className="overflow-hidden mr-2">
                      <p className="text-xs font-bold text-slate-200 truncate">{prod.name}</p>
                      <div className="flex items-center gap-1.5 mt-0.5 text-[11px] text-slate-400">
                        <span className="px-1.5 py-0.5 bg-indigo-500/10 text-indigo-400 rounded border border-indigo-500/20 font-medium">
                          {prod.category || 'General'}
                        </span>
                        {prod.sku && <span>SKU: {prod.sku}</span>}
                      </div>
                    </div>
                    <span className="text-xs font-bold text-emerald-400 shrink-0">
                      ₹{prod.unitPrice?.toLocaleString('en-IN')}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Notes */}
          <div className="bg-slate-950/50 p-4 rounded-xl border border-slate-800 space-y-2">
            <div className="flex items-center space-x-2 text-xs font-bold text-slate-300 uppercase tracking-wider">
              <FileText className="w-4 h-4 text-indigo-400" />
              <span>Prospect Notes</span>
            </div>
            <p className="text-sm text-slate-300 whitespace-pre-wrap leading-relaxed">
              {lead.notes || 'No notes added for this lead.'}
            </p>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="flex items-center justify-between px-6 py-4 border-t border-slate-800 bg-slate-900/60">
          <button
            onClick={() => {
              onClose();
              onEdit(lead);
            }}
            className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 text-sm font-medium rounded-xl transition-colors"
          >
            Edit Details
          </button>

          <div className="flex items-center space-x-3">
            {lead.leadStatus !== 'CONVERTED' && (
              <button
                onClick={() => onConvert(lead.id)}
                className="flex items-center space-x-1.5 px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white text-sm font-semibold rounded-xl shadow-lg shadow-emerald-600/20 transition-all"
              >
                <CheckCircle2 className="w-4 h-4" />
                <span>Convert to Pipeline Deal</span>
              </button>
            )}
            <button
              onClick={onClose}
              className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-semibold rounded-xl transition-all"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
    </ModalPortal>
  );
};
