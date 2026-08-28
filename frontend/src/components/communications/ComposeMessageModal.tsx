import React, { useState } from 'react';
import { createPortal } from 'react-dom';
import {
  CommunicationChannel,
  PriorityLevel,
  RelatedEntityType,
  SendMessageRequest,
} from '../../types/communication';
import { Customer } from '../../types/customer';
import { Lead } from '../../types/lead';
import { Contact } from '../../types/contact';
import { User } from '../../types/auth';
import {
  X,
  Mail,
  MessageSquare,
  Send,
  Layers,
  Sparkles,
  Paperclip,
} from 'lucide-react';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onSend: (data: SendMessageRequest) => Promise<void>;
  customers?: Customer[];
  leads?: Lead[];
  contacts?: Contact[];
  teamMembers?: User[];
  defaultChannel?: CommunicationChannel;
  defaultRecipientAddress?: string;
  defaultRecipientName?: string;
  defaultRelatedType?: RelatedEntityType;
  defaultRelatedId?: number;
  defaultRelatedName?: string;
  defaultThreadId?: string;
}

export const ComposeMessageModal: React.FC<Props> = ({
  isOpen,
  onClose,
  onSend,
  customers = [],
  leads = [],
  contacts = [],
  teamMembers = [],
  defaultChannel = 'EMAIL',
  defaultRecipientAddress = '',
  defaultRecipientName = '',
  defaultRelatedType = 'GENERAL',
  defaultRelatedId,
  defaultRelatedName = '',
  defaultThreadId,
}) => {
  const [channel, setChannel] = useState<CommunicationChannel>(defaultChannel);
  const [subject, setSubject] = useState('');
  const [body, setBody] = useState('');
  const [priority, setPriority] = useState<PriorityLevel>('NORMAL');

  // Recipient & Entity
  const [relatedToType, setRelatedToType] = useState<RelatedEntityType>(defaultRelatedType);
  const [relatedToId, setRelatedToId] = useState<number | ''>(defaultRelatedId || '');
  const [relatedToName, setRelatedToName] = useState(defaultRelatedName);
  const [recipientName, setRecipientName] = useState(defaultRecipientName);
  const [recipientAddress, setRecipientAddress] = useState(defaultRecipientAddress);

  // Assignee
  const [assignedToUserId, setAssignedToUserId] = useState<number | ''>('');
  const [assignedToUserName, setAssignedToUserName] = useState('');

  const [attachmentNames, setAttachmentNames] = useState('');
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleRelatedTypeChange = (type: RelatedEntityType) => {
    setRelatedToType(type);
    setRelatedToId('');
    setRelatedToName('');
  };

  const handleEntitySelection = (idStr: string) => {
    if (!idStr) {
      setRelatedToId('');
      setRelatedToName('');
      return;
    }
    const id = Number(idStr);
    setRelatedToId(id);

    if (relatedToType === 'LEAD') {
      const lead = leads.find((l) => l.id === id);
      if (lead) {
        setRelatedToName(`${lead.firstName} ${lead.lastName} (${lead.company || 'Lead'})`);
        setRecipientName(`${lead.firstName} ${lead.lastName}`);
        setRecipientAddress(channel === 'EMAIL' ? (lead.email || '') : (lead.phone || ''));
      }
    } else if (relatedToType === 'CUSTOMER') {
      const cust = customers.find((c) => c.id === id);
      if (cust) {
        setRelatedToName(cust.name);
        setRecipientName(cust.contactPerson || cust.name);
        setRecipientAddress(channel === 'EMAIL' ? (cust.email || '') : (cust.phone || ''));
      }
    } else if (relatedToType === 'CONTACT') {
      const ct = contacts.find((c) => c.id === id);
      if (ct) {
        setRelatedToName(ct.customerName ? `${ct.fullName} (${ct.customerName})` : ct.fullName);
        setRecipientName(ct.fullName);
        setRecipientAddress(
          channel === 'EMAIL'
            ? (ct.email || '')
            : (ct.phone || ct.mobile || '')
        );
      }
    }
  };

  const applyTemplate = (templateType: string) => {
    if (templateType === 'WELCOME') {
      setSubject('Welcome to our CRM Platform');
      setBody(
        `Hi ${recipientName || 'there'},\n\nThank you for connecting with us! We're excited to support your team. Please let us know if you have any questions or if you would like to schedule an onboarding walkthrough.\n\nBest regards,\nCRM Team`
      );
    } else if (templateType === 'DEMO_FOLLOWUP') {
      setSubject('Follow-up: Product Demonstration & Next Steps');
      setBody(
        `Hi ${recipientName || 'there'},\n\nThank you for your time during our demonstration today. As discussed, attached is the summary of features, architecture overview, and commercial proposal.\n\nLooking forward to your feedback.\n\nBest regards,\nCRM Team`
      );
    } else if (templateType === 'WHATSAPP_CHECKIN') {
      setSubject('WhatsApp Check-In');
      setBody(
        `Hello ${recipientName || 'there'}! Just checking in to see if you had a chance to review our latest proposal. Let us know if you need any clarification!`
      );
    }
  };

  const handleAgentChange = (userIdStr: string) => {
    if (!userIdStr) {
      setAssignedToUserId('');
      setAssignedToUserName('');
      return;
    }
    const uid = Number(userIdStr);
    setAssignedToUserId(uid);
    const agent = teamMembers.find((m) => m.id === uid);
    if (agent) {
      setAssignedToUserName(agent.name);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    const cleanAddr = recipientAddress.trim();
    if (!cleanAddr) {
      setError(
        channel === 'EMAIL'
          ? 'Please enter a recipient email address'
          : 'Please enter a recipient phone number'
      );
      return;
    }
    if (channel === 'EMAIL' && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(cleanAddr)) {
      setError('Please provide a valid email address (e.g. name@company.com)');
      return;
    }
    if (!subject.trim()) {
      setError('Please provide a subject line for your message');
      return;
    }
    if (!body.trim()) {
      setError('Please provide a message body');
      return;
    }

    try {
      setSending(true);
      setError(null);

      const payload: SendMessageRequest = {
        channel,
        recipientAddress: cleanAddr,
        recipientName: recipientName.trim() || undefined,
        subject: subject.trim(),
        body: body.trim(),
        priority,
        relatedToType,
        relatedToId: relatedToId ? Number(relatedToId) : undefined,
        relatedToName: relatedToName ? relatedToName.trim() : undefined,
        assignedToUserId: assignedToUserId ? Number(assignedToUserId) : undefined,
        assignedToUserName: assignedToUserName ? assignedToUserName.trim() : undefined,
        threadId: defaultThreadId,
        attachmentNames: attachmentNames.trim() || undefined,
      };

      await onSend(payload);
      onClose();
    } catch (err: any) {
      console.error('Compose submit error:', err);
      setError(err?.response?.data?.message || err.message || 'Failed to dispatch communication');
    } finally {
      setSending(false);
    }
  };

  return createPortal(
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/50 backdrop-blur-sm">
      <div className="bg-slate-900 border border-slate-800 w-full max-w-2xl rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-slate-950/40 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400">
              <Mail className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-white">Compose Omnichannel Message</h2>
              <p className="text-xs text-slate-400">
                Send direct Email, SMS, WhatsApp, or InMail messages
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-200 hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scrollable Form Body */}
        <form onSubmit={handleSubmit} id="compose-msg-form" className="flex-1 overflow-y-auto p-6 space-y-4">
          {/* Channel Selector Pills */}
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5">
              Select Delivery Channel <span className="text-rose-400">*</span>
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {[
                { ch: 'EMAIL', label: 'Email', icon: Mail },
                { ch: 'SMS', label: 'SMS Text', icon: MessageSquare },
                { ch: 'WHATSAPP', label: 'WhatsApp', icon: Send },
                { ch: 'LINKEDIN', label: 'LinkedIn InMail', icon: MessageSquare },
              ].map((item) => {
                const Icon = item.icon;
                const isSelected = channel === item.ch;
                return (
                  <button
                    key={item.ch}
                    type="button"
                    onClick={() => setChannel(item.ch as CommunicationChannel)}
                    className={`flex items-center justify-center gap-1.5 py-2 px-3 rounded-xl border text-xs font-semibold transition-all ${
                      isSelected
                        ? 'bg-indigo-600 border-indigo-500 text-white shadow-lg shadow-indigo-600/30'
                        : 'bg-slate-950/60 border-slate-800 text-slate-400 hover:text-slate-200 hover:bg-slate-800/40'
                    }`}
                  >
                    <Icon className="w-3.5 h-3.5" />
                    <span>{item.label}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {error && (
            <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-xs text-rose-300">
              {error}
            </div>
          )}

          {/* Related Entity CRM Link */}
          <div className="p-4 rounded-xl bg-slate-950/40 border border-slate-800/80 space-y-3">
            <div className="text-xs font-semibold text-indigo-400 flex items-center gap-1.5">
              <Layers className="w-3.5 h-3.5" />
              Recipient CRM Association
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-[11px] font-medium text-slate-400 mb-1">Entity Type</label>
                <select
                  value={relatedToType}
                  onChange={(e) => handleRelatedTypeChange(e.target.value as RelatedEntityType)}
                  className="w-full px-3 py-2 rounded-lg bg-slate-900 border border-slate-800 text-xs text-slate-200"
                >
                  <option value="GENERAL">General / Standalone</option>
                  <option value="LEAD">Lead / Prospect</option>
                  <option value="CUSTOMER">Customer Account</option>
                  <option value="CONTACT">Contact / Stakeholder</option>
                  <option value="DEAL">Deal / Opportunity</option>
                </select>
              </div>

              <div>
                <label className="block text-[11px] font-medium text-slate-400 mb-1">Select Record</label>
                {relatedToType === 'LEAD' ? (
                  <select
                    value={relatedToId}
                    onChange={(e) => handleEntitySelection(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg bg-slate-900 border border-slate-800 text-xs text-slate-200"
                  >
                    <option value="">-- Choose Lead --</option>
                    {leads.map((l) => (
                      <option key={l.id} value={l.id}>
                        {l.firstName} {l.lastName} ({l.company || 'Lead'})
                      </option>
                    ))}
                  </select>
                ) : relatedToType === 'CUSTOMER' ? (
                  <select
                    value={relatedToId}
                    onChange={(e) => handleEntitySelection(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg bg-slate-900 border border-slate-800 text-xs text-slate-200"
                  >
                    <option value="">-- Choose Customer --</option>
                    {customers.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name}
                      </option>
                    ))}
                  </select>
                ) : relatedToType === 'CONTACT' ? (
                  <select
                    value={relatedToId}
                    onChange={(e) => handleEntitySelection(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg bg-slate-900 border border-slate-800 text-xs text-slate-200"
                  >
                    <option value="">-- Choose Contact --</option>
                    {contacts.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.fullName} {c.customerName ? `(${c.customerName})` : ''}
                      </option>
                    ))}
                  </select>
                ) : (
                  <input
                    type="text"
                    value={relatedToName}
                    onChange={(e) => setRelatedToName(e.target.value)}
                    placeholder="Recipient or account"
                    className="w-full px-3 py-2 rounded-lg bg-slate-900 border border-slate-800 text-xs text-slate-200"
                  />
                )}
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
              <div>
                <label className="block text-[11px] font-medium text-slate-400 mb-1">
                  Recipient Name
                </label>
                <input
                  type="text"
                  value={recipientName}
                  onChange={(e) => setRecipientName(e.target.value)}
                  placeholder="e.g. John Doe"
                  className="w-full px-3 py-2 rounded-lg bg-slate-900 border border-slate-800 text-xs text-slate-200"
                />
              </div>

              <div>
                <label className="block text-[11px] font-medium text-slate-400 mb-1">
                  {channel === 'EMAIL' ? 'Email Address *' : 'Phone / Mobile *'}
                </label>
                <input
                  type={channel === 'EMAIL' ? 'email' : 'tel'}
                  required
                  value={recipientAddress}
                  onChange={(e) => setRecipientAddress(e.target.value)}
                  placeholder={channel === 'EMAIL' ? 'john@acme.com' : '+1 (555) 000-1122'}
                  className="w-full px-3 py-2 rounded-lg bg-slate-900 border border-slate-800 text-xs text-slate-200 font-mono"
                />
              </div>
            </div>
          </div>

          {/* Quick Template Chips */}
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-[11px] font-semibold text-slate-500 flex items-center gap-1">
              <Sparkles className="w-3 h-3 text-indigo-400" />
              Templates:
            </span>
            <button
              type="button"
              onClick={() => applyTemplate('WELCOME')}
              className="px-2.5 py-1 rounded-lg bg-slate-950 border border-slate-800 text-[11px] text-slate-300 hover:bg-slate-800 transition-colors"
            >
              Welcome / Intro
            </button>
            <button
              type="button"
              onClick={() => applyTemplate('DEMO_FOLLOWUP')}
              className="px-2.5 py-1 rounded-lg bg-slate-950 border border-slate-800 text-[11px] text-slate-300 hover:bg-slate-800 transition-colors"
            >
              Demo Follow-Up
            </button>
            <button
              type="button"
              onClick={() => applyTemplate('WHATSAPP_CHECKIN')}
              className="px-2.5 py-1 rounded-lg bg-slate-950 border border-slate-800 text-[11px] text-slate-300 hover:bg-slate-800 transition-colors"
            >
              Quick WhatsApp Ping
            </button>
          </div>

          {/* Subject & Priority */}
          <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
            <div className="sm:col-span-3">
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                Subject / Message Title <span className="text-rose-400">*</span>
              </label>
              <input
                type="text"
                required
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                placeholder="e.g. Contract review & Q3 implementation schedule"
                className="w-full px-3.5 py-2 rounded-xl bg-slate-950/60 border border-slate-800 focus:border-indigo-500 text-xs text-slate-100 placeholder-slate-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">Priority</label>
              <select
                value={priority}
                onChange={(e) => setPriority(e.target.value as PriorityLevel)}
                className="w-full px-3 py-2 rounded-xl bg-slate-950/60 border border-slate-800 text-xs text-slate-200"
              >
                <option value="LOW">Low</option>
                <option value="NORMAL">Normal</option>
                <option value="HIGH">High</option>
                <option value="URGENT">Urgent</option>
              </select>
            </div>
          </div>

          {/* Body */}
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5">
              Message Body <span className="text-rose-400">*</span>
            </label>
            <textarea
              rows={5}
              required
              value={body}
              onChange={(e) => setBody(e.target.value)}
              placeholder="Write your email, SMS text, or WhatsApp template..."
              className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950/60 border border-slate-800 focus:border-indigo-500 text-xs text-slate-200 placeholder-slate-600 resize-none font-sans"
            />
          </div>

          {/* Assignee & Attachments */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">Sender Agent</label>
              <select
                value={assignedToUserId}
                onChange={(e) => handleAgentChange(e.target.value)}
                className="w-full px-3 py-2 rounded-xl bg-slate-950/60 border border-slate-800 text-xs text-slate-200"
              >
                <option value="">-- Default Agent / System --</option>
                {teamMembers.map((u) => (
                  <option key={u.id} value={u.id}>
                    {u.name} ({u.role})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5 flex items-center gap-1">
                <Paperclip className="w-3 h-3 text-slate-400" />
                Attachments (Optional)
              </label>
              <input
                type="text"
                value={attachmentNames}
                onChange={(e) => setAttachmentNames(e.target.value)}
                placeholder="e.g. proposal_v2.pdf, spec_sheet.docx"
                className="w-full px-3 py-2 rounded-xl bg-slate-950/60 border border-slate-800 text-xs text-slate-200 placeholder-slate-600"
              />
            </div>
          </div>
        </form>

        {/* Fixed Footer */}
        <div className="px-6 py-4 border-t border-slate-800 bg-slate-950/40 flex items-center justify-end gap-3 shrink-0">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-xl text-xs font-medium text-slate-300 hover:bg-slate-800 transition-colors"
          >
            Cancel
          </button>
          <button
            type="submit"
            form="compose-msg-form"
            disabled={sending}
            className="px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-xs font-semibold text-white shadow-lg shadow-indigo-600/30 flex items-center gap-1.5 transition-all"
          >
            <Send className="w-3.5 h-3.5" />
            {sending ? 'Sending...' : 'Send Message'}
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
};
