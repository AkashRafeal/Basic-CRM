import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { CommunicationLog, SendMessageRequest } from '../../types/communication';
import { ChannelBadge } from './ChannelBadge';
import { MessageStatusBadge } from './MessageStatusBadge';
import {
  X,
  User,
  Building2,
  Calendar,
  Star,
  Trash2,
  Send,
  Eye,
  Paperclip,
} from 'lucide-react';
import { communicationApi } from '../../api/communicationApi';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  message: CommunicationLog | null;
  onDelete?: (message: CommunicationLog) => void;
  onToggleStar: (message: CommunicationLog) => void;
  onReplySent: () => void;
}

export const MessageDetailsModal: React.FC<Props> = ({
  isOpen,
  onClose,
  message,
  onDelete,
  onToggleStar,
  onReplySent,
}) => {
  const [threadMessages, setThreadMessages] = useState<CommunicationLog[]>([]);
  const [loadingThread, setLoadingThread] = useState(false);
  const [replyText, setReplyText] = useState('');
  const [sendingReply, setSendingReply] = useState(false);

  useEffect(() => {
    if (message && message.threadId) {
      loadThread(message.threadId);
      if (!message.isRead) {
        communicationApi.markRead(message.id, true).catch(() => {});
      }
    }
  }, [message]);

  const loadThread = async (threadId: string) => {
    try {
      setLoadingThread(true);
      const res = await communicationApi.getThreadMessages(threadId);
      if (res.success && res.data) {
        setThreadMessages(res.data);
      }
    } catch (err) {
      console.error('Failed to load thread messages:', err);
    } finally {
      setLoadingThread(false);
    }
  };

  const handleSendReply = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!message || !replyText.trim()) return;

    try {
      setSendingReply(true);
      const payload: SendMessageRequest = {
        channel: message.channel,
        recipientAddress: message.recipientAddress || 'unknown@recipient.internal',
        recipientName: message.recipientName,
        subject: message.subject.startsWith('Re: ') ? message.subject : `Re: ${message.subject}`,
        body: replyText.trim(),
        relatedToType: message.relatedToType,
        relatedToId: message.relatedToId,
        relatedToName: message.relatedToName,
        assignedToUserId: message.assignedToUserId,
        assignedToUserName: message.assignedToUserName,
        threadId: message.threadId,
      };

      await communicationApi.sendMessage(payload);
      setReplyText('');
      if (message.threadId) {
        await loadThread(message.threadId);
      }
      onReplySent();
    } catch (err) {
      console.error('Failed to send reply:', err);
    } finally {
      setSendingReply(false);
    }
  };

  if (!isOpen || !message) return null;

  const displayList = threadMessages.length > 0 ? threadMessages : [message];

  return createPortal(
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/50 backdrop-blur-sm animate-fade-in">
      <div className="bg-slate-900 border border-slate-800 w-full max-w-4xl rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="flex items-start justify-between px-6 py-4 border-b border-slate-800 bg-slate-950/40 shrink-0">
          <div className="space-y-1.5">
            <div className="flex items-center gap-2 flex-wrap">
              <ChannelBadge channel={message.channel} size="md" />
              <MessageStatusBadge status={message.status} />
              {message.priority === 'URGENT' && (
                <span className="px-2 py-0.5 rounded-full text-[11px] font-bold bg-rose-500/20 text-rose-300 border border-rose-500/30">
                  URGENT
                </span>
              )}
            </div>
            <h2 className="text-base font-bold text-slate-100 mt-1">{message.subject}</h2>
          </div>
          <div className="flex items-center gap-1">
            <button
              type="button"
              onClick={() => onToggleStar(message)}
              className={`p-1.5 rounded-lg transition-colors ${
                message.isStarred
                  ? 'text-amber-400 bg-amber-500/10'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
              }`}
              title={message.isStarred ? 'Unstar' : 'Star message'}
            >
              <Star className={`w-4 h-4 ${message.isStarred ? 'fill-amber-400' : ''}`} />
            </button>
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg text-slate-400 hover:text-slate-200 hover:bg-slate-800 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Scrollable Conversation Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-4">
          {/* Metadata Card */}
          <div className="p-4 rounded-xl bg-slate-950/50 border border-slate-800/80 grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
            <div className="flex items-center gap-2 text-slate-300">
              <User className="w-4 h-4 text-slate-500" />
              <span>
                To:{' '}
                <strong className="text-slate-100">
                  {message.recipientName || message.recipientAddress}
                </strong>
                {message.recipientAddress && (
                  <span className="text-slate-400 font-mono ml-1">({message.recipientAddress})</span>
                )}
              </span>
            </div>
            <div className="flex items-center gap-2 text-slate-300">
              <Building2 className="w-4 h-4 text-slate-500" />
              <span>
                Account:{' '}
                <strong className="text-slate-100">
                  {message.relatedToName || message.relatedToType}
                </strong>
              </span>
            </div>
            <div className="flex items-center gap-2 text-slate-300">
              <Calendar className="w-4 h-4 text-slate-500" />
              <span>{new Date(message.createdAt).toLocaleString()}</span>
            </div>
            <div className="flex items-center gap-2 text-slate-300">
              <Eye className="w-4 h-4 text-slate-500" />
              <span>
                Opened: <strong className="text-indigo-400">{message.openCount || 0} times</strong>
              </span>
            </div>
          </div>

          {/* Conversation Messages Stream */}
          <div className="space-y-3">
            <div className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
              Message Thread ({displayList.length})
            </div>

            {loadingThread ? (
              <div className="py-4 text-center text-xs text-slate-500 animate-pulse">
                Loading thread conversation...
              </div>
            ) : (
              displayList.map((item) => {
                const isOutgoing = item.direction === 'OUTGOING';
                return (
                  <div
                    key={item.id}
                    className={`p-4 rounded-2xl border ${
                      isOutgoing
                        ? 'bg-slate-900 border-indigo-500/30 ml-4'
                        : 'bg-slate-950/60 border-slate-800 mr-4'
                    }`}
                  >
                    <div className="flex items-center justify-between pb-2 mb-2 border-b border-slate-800/60 text-[11px]">
                      <span className="font-semibold text-indigo-300">
                        {isOutgoing ? `Agent: ${item.senderName || 'CRM Representative'}` : item.recipientName || 'Client / Prospect'}
                      </span>
                      <span className="text-slate-500">{new Date(item.createdAt).toLocaleTimeString()}</span>
                    </div>

                    <p className="text-xs text-slate-200 whitespace-pre-wrap leading-relaxed">
                      {item.body}
                    </p>

                    {item.attachmentNames && (
                      <div className="mt-3 pt-2 border-t border-slate-800/60 flex items-center gap-1.5 text-[11px] text-slate-400">
                        <Paperclip className="w-3.5 h-3.5 text-indigo-400" />
                        <span>Attachments: {item.attachmentNames}</span>
                      </div>
                    )}
                  </div>
                );
              })
            )}
          </div>

          {/* Quick Reply Form */}
          <form onSubmit={handleSendReply} className="pt-2">
            <label className="block text-xs font-semibold text-slate-300 mb-1.5">
              Quick Reply ({message.channel})
            </label>
            <div className="flex items-end gap-2">
              <textarea
                rows={2}
                value={replyText}
                onChange={(e) => setReplyText(e.target.value)}
                placeholder="Type your follow-up reply..."
                className="flex-1 px-3.5 py-2 rounded-xl bg-slate-950/60 border border-slate-800 focus:border-indigo-500 text-xs text-slate-200 placeholder-slate-600 resize-none"
              />
              <button
                type="submit"
                disabled={sendingReply || !replyText.trim()}
                className="px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 disabled:opacity-40 text-xs font-semibold text-white shadow-md shadow-indigo-600/30 flex items-center gap-1.5 transition-all shrink-0"
              >
                <Send className="w-3.5 h-3.5" />
                {sendingReply ? 'Sending...' : 'Reply'}
              </button>
            </div>
          </form>
        </div>

        {/* Fixed Footer */}
        <div className="px-6 py-4 border-t border-slate-800 bg-slate-950/40 flex items-center justify-between shrink-0">
          {onDelete ? (
            <button
              type="button"
              onClick={() => {
                onClose();
                onDelete(message);
              }}
              className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-semibold text-rose-400 bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/20 transition-all shadow-sm"
              title="Delete Communication Log"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>Delete Message</span>
            </button>
          ) : (
            <span className="text-[11px] text-slate-500 italic">
              Audit trail preserved
            </span>
          )}

          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-xl text-xs font-medium text-slate-300 hover:bg-slate-800 transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
};
