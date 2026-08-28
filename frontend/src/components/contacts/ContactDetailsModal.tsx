import { ModalPortal } from '../ModalPortal';
import { Contact } from '../../types/contact';
import { isPrimaryLead } from '../../utils/contactSelectors';
import { ContactTypeBadge } from './ContactTypeBadge';
import { ContactStatusBadge } from './ContactStatusBadge';
import {
  X,
  User as UserIcon,
  Mail,
  Phone,
  Building2,
  Briefcase,
  MapPin,
  Linkedin,
  Clock,
  Crown,
  Sparkles,
  FileText,
  Edit2,
  ExternalLink,
} from 'lucide-react';

interface ContactDetailsModalProps {
  isOpen: boolean;
  onClose: () => void;
  contact: Contact | null;
  onEdit: (contact: Contact) => void;
  onTogglePrimary?: (id: number, isPrimary: boolean) => Promise<void>;
}

export const ContactDetailsModal: React.FC<ContactDetailsModalProps> = ({
  isOpen,
  onClose,
  contact,
  onEdit,
  onTogglePrimary,
}) => {
  if (!isOpen || !contact) return null;

  return (
    <ModalPortal>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-fadeIn">
      <div className="bg-slate-900 border border-slate-800 w-full max-w-2xl rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header Banner */}
        <div className="p-6 bg-gradient-to-r from-indigo-900/40 via-slate-900 to-slate-900 border-b border-slate-800 flex items-start justify-between">
          <div className="flex items-start gap-4">
            <div className="w-14 h-14 rounded-2xl bg-indigo-600/20 border border-indigo-500/30 flex items-center justify-center text-indigo-400 font-bold text-xl shadow-inner">
              {contact.firstName.charAt(0)}
              {contact.lastName.charAt(0)}
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h2 className="text-xl font-bold text-white">{contact.fullName}</h2>
                {isPrimaryLead(contact) && (
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-bold bg-purple-500/15 text-purple-300 border border-purple-500/30">
                    <Sparkles className="w-3 h-3 text-purple-400" />
                    PRIMARY LEAD
                  </span>
                )}
              </div>
              <p className="text-sm text-slate-300 font-medium mt-0.5">
                {contact.jobTitle ? `${contact.jobTitle}` : 'Key Stakeholder'}
                {contact.customerName ? ` • ${contact.customerName}` : ''}
              </p>
              <div className="flex items-center gap-2 mt-2">
                <ContactTypeBadge type={contact.contactType} />
                <ContactStatusBadge status={contact.status} />
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => {
                onClose();
                onEdit(contact);
              }}
              className="p-2 text-indigo-400 hover:text-indigo-300 hover:bg-indigo-500/10 rounded-xl transition-colors border border-indigo-500/20"
              title="Edit Contact"
            >
              <Edit2 className="w-4 h-4" />
            </button>
            <button
              onClick={onClose}
              className="p-2 text-slate-400 hover:text-slate-200 hover:bg-slate-800 rounded-xl transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Modal Content */}
        <div className="overflow-y-auto p-6 space-y-6 flex-1">
          {/* Quick Contact Bar */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="p-3.5 rounded-xl bg-slate-950/70 border border-slate-800 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-indigo-500/10 flex items-center justify-center text-indigo-400">
                  <Mail className="w-4 h-4" />
                </div>
                <div>
                  <div className="text-[10px] uppercase font-bold text-slate-400">Email</div>
                  <a
                    href={`mailto:${contact.email}`}
                    className="text-sm font-medium text-slate-200 hover:text-indigo-400 transition-colors"
                  >
                    {contact.email}
                  </a>
                </div>
              </div>
              {contact.doNotEmail && (
                <span className="text-[10px] text-rose-400 bg-rose-500/10 px-2 py-0.5 rounded border border-rose-500/20">
                  Do Not Email
                </span>
              )}
            </div>

            <div className="p-3.5 rounded-xl bg-slate-950/70 border border-slate-800 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-emerald-500/10 flex items-center justify-center text-emerald-400">
                  <Phone className="w-4 h-4" />
                </div>
                <div>
                  <div className="text-[10px] uppercase font-bold text-slate-400">Phone / Mobile</div>
                  <div className="text-sm font-medium text-slate-200">
                    {contact.phone || contact.mobile || 'Not provided'}
                  </div>
                </div>
              </div>
              {contact.doNotCall && (
                <span className="text-[10px] text-rose-400 bg-rose-500/10 px-2 py-0.5 rounded border border-rose-500/20">
                  Do Not Call
                </span>
              )}
            </div>
          </div>

          {/* Details Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="p-4 rounded-xl bg-slate-950/40 border border-slate-800/80 space-y-3">
              <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                Organization & Hierarchy
              </h3>

              <div className="space-y-2 text-xs">
                <div className="flex items-center justify-between">
                  <span className="text-slate-400 flex items-center gap-1.5">
                    <Building2 className="w-3.5 h-3.5 text-slate-500" />
                    Customer Account:
                  </span>
                  <span className="font-semibold text-slate-200">
                    {contact.customerName || 'None'}
                  </span>
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-slate-400 flex items-center gap-1.5">
                    <Briefcase className="w-3.5 h-3.5 text-slate-500" />
                    Department:
                  </span>
                  <span className="font-semibold text-slate-200">
                    {contact.department || 'Not specified'}
                  </span>
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-slate-400 flex items-center gap-1.5">
                    <UserIcon className="w-3.5 h-3.5 text-slate-500" />
                    CRM Owner:
                  </span>
                  <span className="font-semibold text-indigo-300">
                    {contact.assignedToUserName || 'Unassigned'}
                  </span>
                </div>
              </div>
            </div>

            <div className="p-4 rounded-xl bg-slate-950/40 border border-slate-800/80 space-y-3">
              <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                Location & Social
              </h3>

              <div className="space-y-2 text-xs">
                <div className="flex items-center justify-between">
                  <span className="text-slate-400 flex items-center gap-1.5">
                    <MapPin className="w-3.5 h-3.5 text-slate-500" />
                    Location:
                  </span>
                  <span className="font-semibold text-slate-200">
                    {[contact.city, contact.state, contact.country].filter(Boolean).join(', ') ||
                      'Not provided'}
                  </span>
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-slate-400 flex items-center gap-1.5">
                    <Linkedin className="w-3.5 h-3.5 text-slate-500" />
                    LinkedIn:
                  </span>
                  {contact.linkedinUrl ? (
                    <a
                      href={contact.linkedinUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="font-semibold text-indigo-400 hover:underline flex items-center gap-1"
                    >
                      Profile <ExternalLink className="w-3 h-3" />
                    </a>
                  ) : (
                    <span className="text-slate-500">Not linked</span>
                  )}
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-slate-400 flex items-center gap-1.5">
                    <Clock className="w-3.5 h-3.5 text-slate-500" />
                    Added to CRM:
                  </span>
                  <span className="text-slate-300">
                    {new Date(contact.createdAt).toLocaleDateString('en-IN', {
                      day: 'numeric',
                      month: 'short',
                      year: 'numeric',
                    })}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Notes */}
          {contact.notes && (
            <div className="p-4 rounded-xl bg-slate-950/50 border border-slate-800 space-y-1.5">
              <div className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                <FileText className="w-3.5 h-3.5 text-slate-400" />
                Stakeholder Intelligence & Notes
              </div>
              <p className="text-sm text-slate-300 whitespace-pre-wrap leading-relaxed">
                {contact.notes}
              </p>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-slate-800 bg-slate-950/40 flex items-center justify-between">
          <div>
            {onTogglePrimary && contact.customerId && (
              <button
                onClick={() => onTogglePrimary(contact.id, !contact.isPrimaryContact)}
                className={`text-xs font-medium px-3 py-1.5 rounded-lg border transition-colors flex items-center gap-1.5 ${
                  contact.isPrimaryContact
                    ? 'bg-amber-500/10 text-amber-400 border-amber-500/20 hover:bg-amber-500/20'
                    : 'bg-slate-800 text-slate-300 border-slate-700 hover:bg-slate-700'
                }`}
              >
                <Crown className="w-3.5 h-3.5" />
                {contact.isPrimaryContact ? 'Primary Contact' : 'Set as Primary'}
              </button>
            )}
          </div>
          <button
            onClick={onClose}
            className="px-5 py-2 text-sm font-medium text-slate-300 hover:text-white bg-slate-800 hover:bg-slate-700 rounded-xl transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
    </ModalPortal>
  );
};
