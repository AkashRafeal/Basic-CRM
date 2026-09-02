import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import {
  CommunicationLog,
  CommunicationChannel,
  CommunicationDirection,
  MessageStatus,
  RelatedEntityType,
  CommunicationStats,
  SendMessageRequest,
} from '../types/communication';
import { Customer } from '../types/customer';
import { Lead } from '../types/lead';
import { Contact } from '../types/contact';
import { User } from '../types/auth';
import { communicationApi } from '../api/communicationApi';
import { customerApi } from '../api/customerApi';
import { leadApi } from '../api/leadApi';
import { contactApi } from '../api/contactApi';
import { userApi } from '../api/userApi';
import { ChannelBadge } from '../components/communications/ChannelBadge';
import { MessageStatusBadge } from '../components/communications/MessageStatusBadge';
import { ComposeMessageModal } from '../components/communications/ComposeMessageModal';
import { MessageDetailsModal } from '../components/communications/MessageDetailsModal';
import { DeleteMessageModal } from '../components/communications/DeleteMessageModal';
import { ConfigureGatewaysModal } from '../components/communications/ConfigureGatewaysModal';
import {
  Mail,
  MessageSquare,
  Send,
  Search,
  RefreshCw,
  Plus,
  Star,
  Download,
  CheckCircle2,
  TrendingUp,
  Inbox,
  Clock,
  Sparkles,
  Building2,
  Calendar,
  Layers,
  Paperclip,
  Shield,
  Users,
  UserCheck,
  Lock,
  Settings,
  Trash2,
  Maximize2,
} from 'lucide-react';
import { triggerRefreshBlink } from '../components/common/RefreshFeedbackOverlay';

export const CommunicationManagement: React.FC = () => {
  const { user, isAdmin, isManager, isEmployee } = useAuth();

  const [communications, setCommunications] = useState<CommunicationLog[]>([]);
  const [stats, setStats] = useState<CommunicationStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // Entities for Association
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [leads, setLeads] = useState<Lead[]>([]);
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [teamMembers, setTeamMembers] = useState<User[]>([]);

  // Search & Filter State
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedChannel, setSelectedChannel] = useState<CommunicationChannel | 'ALL'>('ALL');
  const [selectedDirection, setSelectedDirection] = useState<CommunicationDirection | 'ALL'>('ALL');
  const [selectedStatus, setSelectedStatus] = useState<MessageStatus | 'ALL'>('ALL');
  const [selectedEntity, setSelectedEntity] = useState<RelatedEntityType | 'ALL'>('ALL');
  const [starredOnly, setStarredOnly] = useState(false);
  const [unreadOnly, setUnreadOnly] = useState(false);

  // Selected Message for Inspector
  const [selectedMessage, setSelectedMessage] = useState<CommunicationLog | null>(null);

  // Modals
  const [isComposeOpen, setIsComposeOpen] = useState(false);
  const [isDetailsOpen, setIsDetailsOpen] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [isGatewaysOpen, setIsGatewaysOpen] = useState(false);
  const [activeMessage, setActiveMessage] = useState<CommunicationLog | null>(null);

  // Notifications
  const [toastMessage, setToastMessage] = useState<{ text: string; type: 'success' | 'error' } | null>(null);

  const showToast = (text: string, type: 'success' | 'error' = 'success') => {
    setToastMessage({ text, type });
    setTimeout(() => setToastMessage(null), 4000);
  };

  const fetchData = async () => {
    try {
      setLoading(true);
      const [commRes, statsRes, custRes, leadRes, contRes, userRes] = await Promise.all([
        communicationApi.getCommunications({
          query: searchQuery || undefined,
          channel: selectedChannel !== 'ALL' ? selectedChannel : undefined,
          direction: selectedDirection !== 'ALL' ? selectedDirection : undefined,
          status: selectedStatus !== 'ALL' ? selectedStatus : undefined,
          relatedToType: selectedEntity !== 'ALL' ? selectedEntity : undefined,
          isStarred: starredOnly ? true : undefined,
          isRead: unreadOnly ? false : undefined,
          size: 100,
        }),
        communicationApi.getStats().catch(() => ({ data: null })),
        customerApi.getCustomers().catch(() => ({ data: [] })),
        leadApi.getLeads().catch(() => ({ data: [] })),
        contactApi.getContacts().catch(() => ({ data: [] })),
        userApi.getAllUsers().catch(() => []),
      ]);

      const msgList = commRes.data || [];
      setCommunications(msgList);
      if (statsRes.data) setStats(statsRes.data);
      if (custRes.data) setCustomers(custRes.data);
      if (leadRes.data) setLeads(leadRes.data);
      if (contRes.data) setContacts(contRes.data);
      if (userRes) setTeamMembers(userRes);

      if (msgList.length > 0) {
        if (!selectedMessage || !msgList.some((m) => m.id === selectedMessage.id)) {
          setSelectedMessage(msgList[0]);
        }
      } else {
        setSelectedMessage(null);
      }
    } catch (err) {
      console.error('Failed to load communications:', err);
      showToast('Failed to load communication records', 'error');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [selectedChannel, selectedDirection, selectedStatus, selectedEntity, starredOnly, unreadOnly, user]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    fetchData();
  };

  const handleSendMessage = async (payload: SendMessageRequest) => {
    try {
      // If employee, guarantee assigned rep is self
      const finalPayload = isEmployee
        ? {
            ...payload,
            assignedToUserId: user?.id,
            assignedToUserName: user?.name,
          }
        : payload;

      const res = await communicationApi.sendMessage(finalPayload);
      if (res && (res.success || (res as any).data)) {
        showToast('Message sent successfully!');
        setIsComposeOpen(false);
        fetchData();
      }
    } catch (err: any) {
      console.error('Failed to send message:', err);
      const errMsg = err.response?.data?.message || err.message || 'Failed to dispatch message';
      showToast(errMsg, 'error');
      throw err;
    }
  };

  const handleToggleStar = async (msg: CommunicationLog, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    try {
      const res = await communicationApi.toggleStar(msg.id);
      if (res.success) {
        setCommunications((prev) =>
          prev.map((c) => (c.id === msg.id ? { ...c, isStarred: !c.isStarred } : c))
        );
        if (selectedMessage?.id === msg.id) {
          setSelectedMessage((prev) => (prev ? { ...prev, isStarred: !prev.isStarred } : null));
        }
      }
    } catch (err) {
      console.error('Failed to star message:', err);
    }
  };

  const handleMarkRead = async (msg: CommunicationLog, isRead: boolean) => {
    try {
      const res = await communicationApi.markRead(msg.id, isRead);
      if (res.success) {
        setCommunications((prev) =>
          prev.map((c) => (c.id === msg.id ? { ...c, isRead } : c))
        );
        if (selectedMessage?.id === msg.id) {
          setSelectedMessage((prev) => (prev ? { ...prev, isRead } : null));
        }
        if (stats) {
          setStats({
            ...stats,
            unreadMessages: Math.max(0, stats.unreadMessages + (isRead ? -1 : 1)),
          });
        }
      }
    } catch (err) {
      console.error('Failed to mark read/unread:', err);
    }
  };

  const handleDeleteMessage = async (id: number) => {
    if (!isAdmin) {
      showToast('Only Administrators can delete messages to preserve audit trails.', 'error');
      return;
    }
    try {
      const res = await communicationApi.deleteCommunication(id);
      if (res.success) {
        showToast('Communication log removed');
        setIsDeleteOpen(false);
        setActiveMessage(null);
        if (selectedMessage?.id === id) {
          setSelectedMessage(null);
        }
        fetchData();
      }
    } catch (err) {
      console.error('Failed to delete message:', err);
      showToast('Failed to delete message log', 'error');
    }
  };

  const handleExportCSV = async () => {
    if (isEmployee) {
      showToast('Communication log export is restricted for representative accounts (Anti-theft policy)', 'error');
      return;
    }
    try {
      await communicationApi.downloadCsvReport();
      showToast(isManager ? 'Team communication logs exported to CSV' : 'Full company communication logs exported to CSV');
    } catch (err) {
      console.error('Export failed:', err);
      showToast('Failed to export communication CSV', 'error');
    }
  };

  const channelTabs: { key: CommunicationChannel | 'ALL'; label: string; icon: any }[] = [
    { key: 'ALL', label: 'All Channels', icon: Inbox },
    { key: 'EMAIL', label: 'Email', icon: Mail },
    { key: 'SMS', label: 'SMS Text', icon: MessageSquare },
    { key: 'WHATSAPP', label: 'WhatsApp', icon: Send },
    { key: 'CHAT', label: 'Live Chat', icon: MessageSquare },
    { key: 'VIDEO_CALL', label: 'Video Meetings', icon: Calendar },
    { key: 'LINKEDIN', label: 'LinkedIn', icon: Layers },
  ];

  return (
    <div className="flex-1 overflow-y-auto bg-slate-950 text-slate-100 p-4 md:p-8 space-y-6">
      {/* Toast Notification */}
      {toastMessage && (
        <div
          className={`fixed bottom-6 right-6 z-50 px-4 py-3 rounded-xl shadow-2xl border flex items-center gap-2.5 text-xs font-medium animate-slideUp ${
            toastMessage.type === 'success'
              ? 'bg-emerald-950/90 border-emerald-500/30 text-emerald-300'
              : 'bg-rose-950/90 border-rose-500/30 text-rose-300'
          }`}
        >
          <Sparkles className="w-4 h-4" />
          <span>{toastMessage.text}</span>
        </div>
      )}

      {/* Header Banner & Role Scoping Indicator */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="p-2.5 rounded-2xl bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
              <MessageSquare className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-2xl font-bold text-white tracking-tight">
                  Communications & Unified Inbox
                </h1>
                {isAdmin && (
                  <span className="px-2.5 py-0.5 rounded-full bg-indigo-500/10 text-indigo-400 border border-indigo-500/30 text-xs font-semibold flex items-center gap-1">
                    <Shield className="w-3 h-3 text-indigo-400" />
                    <span>All Company Communications</span>
                  </span>
                )}
                {isManager && (
                  <span className="px-2.5 py-0.5 rounded-full bg-blue-500/10 text-blue-400 border border-blue-500/30 text-xs font-semibold flex items-center gap-1">
                    <Users className="w-3 h-3 text-blue-400" />
                    <span>Team Threads & Unassigned</span>
                  </span>
                )}
                {isEmployee && (
                  <span className="px-2.5 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 text-xs font-semibold flex items-center gap-1">
                    <UserCheck className="w-3 h-3 text-emerald-400" />
                    <span>Personal Assigned Inbox</span>
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-400">
                {isAdmin && 'Global omnichannel inbox across Email, SMS, WhatsApp, and Social channels.'}
                {isManager && 'Direct team communication stream, unassigned incoming inquiries, and team metrics.'}
                {isEmployee && 'Your assigned customer interactions, individual touchpoints, and unread replies.'}
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2.5 flex-wrap">
          <button
            onClick={() => {
              setRefreshing(true);
              triggerRefreshBlink('Communications refreshed');
              fetchData();
              setTimeout(() => setRefreshing(false), 600);
            }}
            className="flex items-center gap-1.5 px-3 py-2.5 rounded-xl bg-slate-900 border border-slate-800 text-xs font-semibold text-slate-300 hover:text-slate-200 hover:bg-slate-800 transition-colors active:scale-95"
            title="Refresh inbox"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${refreshing ? 'animate-spin text-indigo-400' : ''}`} />
            <span>Refresh</span>
          </button>

          {/* Admin Gateway Config Button */}
          {isAdmin && (
            <button
              onClick={() => setIsGatewaysOpen(true)}
              className="px-3.5 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-800 text-xs font-semibold text-indigo-300 flex items-center gap-1.5 transition-colors"
              title="Configure SMTP, Twilio, and WhatsApp API gateways"
            >
              <Settings className="w-4 h-4 text-indigo-400" />
              <span>Gateway Settings</span>
            </button>
          )}

          {/* Export CSV Button */}
          {isAdmin && (
            <button
              onClick={handleExportCSV}
              className="px-3.5 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-800 text-xs font-semibold text-slate-300 flex items-center gap-2 transition-colors"
            >
              <Download className="w-4 h-4 text-emerald-400" />
              <span>Export CSV</span>
            </button>
          )}

          {isManager && (
            <button
              onClick={handleExportCSV}
              className="px-3.5 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-800 text-xs font-semibold text-slate-300 flex items-center gap-2 transition-colors"
              title="Export communication logs for your team"
            >
              <Download className="w-4 h-4 text-blue-400" />
              <span>Team CSV Export</span>
            </button>
          )}

          {isEmployee && (
            <div
              className="flex items-center gap-1.5 px-3.5 py-2.5 rounded-xl bg-slate-900 border border-slate-800 text-slate-500 text-xs font-medium cursor-not-allowed"
              title="Bulk communication export is disabled for representative accounts (Anti-theft protection)"
            >
              <Lock className="w-3.5 h-3.5 text-rose-400" />
              <span>Exports Disabled (Anti-Theft)</span>
            </div>
          )}

          <button
            onClick={() => setIsComposeOpen(true)}
            className="px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-xs font-bold text-white shadow-lg shadow-indigo-600/30 flex items-center gap-2 transition-all transform active:scale-98"
          >
            <Plus className="w-4 h-4" />
            <span>Compose Message</span>
          </button>
        </div>
      </div>

      {/* 6 Analytics KPI Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3.5">
        <div className="p-4 rounded-2xl bg-slate-900/60 border border-slate-800/80">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-[11px] font-medium">
              {isAdmin ? 'Total Messages' : isManager ? 'Team Messages' : 'My Messages'}
            </span>
            <Inbox className="w-4 h-4 text-indigo-400" />
          </div>
          <div className="text-xl font-bold text-white">{stats?.totalMessages ?? communications.length}</div>
          <div className="text-[10px] text-slate-500 mt-0.5">All channels combined</div>
        </div>

        <div className="p-4 rounded-2xl bg-slate-900/60 border border-slate-800/80">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-[11px] font-medium">Outgoing</span>
            <Send className="w-4 h-4 text-sky-400" />
          </div>
          <div className="text-xl font-bold text-sky-400">{stats?.outgoingMessages ?? 0}</div>
          <div className="text-[10px] text-slate-500 mt-0.5">Dispatches sent</div>
        </div>

        <div className="p-4 rounded-2xl bg-slate-900/60 border border-slate-800/80">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-[11px] font-medium">Incoming</span>
            <Mail className="w-4 h-4 text-teal-400" />
          </div>
          <div className="text-xl font-bold text-teal-400">{stats?.incomingMessages ?? 0}</div>
          <div className="text-[10px] text-slate-500 mt-0.5">Replies & inbound</div>
        </div>

        <div className="p-4 rounded-2xl bg-slate-900/60 border border-slate-800/80">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-[11px] font-medium">Delivery Rate</span>
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="text-xl font-bold text-emerald-400">
            {stats ? `${stats.deliveredRate}%` : '98.5%'}
          </div>
          <div className="text-[10px] text-slate-500 mt-0.5">Successful transit</div>
        </div>

        <div className="p-4 rounded-2xl bg-slate-900/60 border border-slate-800/80">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-[11px] font-medium">Read / Opened</span>
            <TrendingUp className="w-4 h-4 text-amber-400" />
          </div>
          <div className="text-xl font-bold text-amber-400">
            {stats ? `${stats.readRate}%` : '74.2%'}
          </div>
          <div className="text-[10px] text-slate-500 mt-0.5">Open engagement</div>
        </div>

        <div className="p-4 rounded-2xl bg-slate-900/60 border border-slate-800/80">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-[11px] font-medium">
              {isAdmin ? 'Org Unread' : isManager ? 'Team Unread' : 'My Unread'}
            </span>
            <Clock className="w-4 h-4 text-purple-400" />
          </div>
          <div className="text-xl font-bold text-purple-400">{stats?.unreadMessages ?? 0}</div>
          <div className="text-[10px] text-slate-500 mt-0.5">Pending response</div>
        </div>
      </div>

      {/* Channel Switcher Tabs */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1 border-b border-slate-800/80">
        {channelTabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = selectedChannel === tab.key;
          return (
            <button
              key={tab.key}
              onClick={() => setSelectedChannel(tab.key)}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition-all ${
                isActive
                  ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/30'
                  : 'bg-slate-900/50 text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
              }`}
            >
              <Icon className="w-3.5 h-3.5" />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* Multi-Criteria Search & Filter Toolbar */}
      <div className="p-4 rounded-2xl bg-slate-900/60 border border-slate-800/80 space-y-3">
        <form onSubmit={handleSearchSubmit} className="flex flex-col md:flex-row items-center gap-3">
          <div className="relative flex-1 w-full">
            <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by subject, recipient address, sender name, or content..."
              className="w-full pl-10 pr-4 py-2 rounded-xl bg-slate-950/60 border border-slate-800 focus:border-indigo-500 text-xs text-slate-200 placeholder-slate-500"
            />
          </div>

          <div className="flex items-center gap-2.5 w-full md:w-auto flex-wrap">
            <select
              value={selectedDirection}
              onChange={(e) => setSelectedDirection(e.target.value as any)}
              className="px-3 py-2 rounded-xl bg-slate-950/60 border border-slate-800 text-xs text-slate-300"
            >
              <option value="ALL">All Directions</option>
              <option value="OUTGOING">Outgoing</option>
              <option value="INCOMING">Incoming</option>
            </select>

            <select
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value as any)}
              className="px-3 py-2 rounded-xl bg-slate-950/60 border border-slate-800 text-xs text-slate-300"
            >
              <option value="ALL">All Statuses</option>
              <option value="SENT">Sent</option>
              <option value="DELIVERED">Delivered</option>
              <option value="READ">Read / Opened</option>
              <option value="SCHEDULED">Scheduled</option>
              <option value="DRAFT">Draft</option>
              <option value="FAILED">Failed</option>
            </select>

            <select
              value={selectedEntity}
              onChange={(e) => setSelectedEntity(e.target.value as any)}
              className="px-3 py-2 rounded-xl bg-slate-950/60 border border-slate-800 text-xs text-slate-300"
            >
              <option value="ALL">All CRM Entities</option>
              <option value="LEAD">Leads</option>
              <option value="CUSTOMER">Customers</option>
              <option value="CONTACT">Contacts</option>
              <option value="DEAL">Deals</option>
              <option value="GENERAL">General Inquiries</option>
            </select>

            <button
              type="button"
              onClick={() => setStarredOnly(!starredOnly)}
              className={`px-3 py-2 rounded-xl text-xs font-semibold flex items-center gap-1.5 border transition-all ${
                starredOnly
                  ? 'bg-amber-500/20 border-amber-500/50 text-amber-300'
                  : 'bg-slate-950/60 border-slate-800 text-slate-400 hover:text-slate-200'
              }`}
            >
              <Star className={`w-3.5 h-3.5 ${starredOnly ? 'fill-amber-400 text-amber-400' : ''}`} />
              <span>Starred</span>
            </button>

            <button
              type="button"
              onClick={() => setUnreadOnly(!unreadOnly)}
              className={`px-3 py-2 rounded-xl text-xs font-semibold flex items-center gap-1.5 border transition-all ${
                unreadOnly
                  ? 'bg-purple-500/20 border-purple-500/50 text-purple-300'
                  : 'bg-slate-950/60 border-slate-800 text-slate-400 hover:text-slate-200'
              }`}
            >
              <Clock className="w-3.5 h-3.5" />
              <span>Unread</span>
            </button>
          </div>
        </form>
      </div>

      {/* Main Two-Column Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Column: Inbox Message Feed */}
        <div className="lg:col-span-5 space-y-3">
          {loading ? (
            <div className="p-8 rounded-2xl bg-slate-900/40 border border-slate-800 text-center text-xs text-slate-400">
              <RefreshCw className="w-6 h-6 animate-spin mx-auto mb-2 text-indigo-400" />
              Loading conversations...
            </div>
          ) : communications.length === 0 ? (
            <div className="p-10 rounded-2xl bg-slate-900/40 border border-slate-800/80 text-center space-y-3">
              <Inbox className="w-8 h-8 mx-auto text-slate-600" />
              <h3 className="text-sm font-semibold text-slate-300">No Messages Found</h3>
              <p className="text-xs text-slate-500 max-w-xs mx-auto">
                No matching messages found for current filter settings. Click "Compose Message" to start a conversation.
              </p>
              <button
                onClick={() => setIsComposeOpen(true)}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-indigo-600 text-xs font-semibold text-white shadow-md shadow-indigo-600/30"
              >
                <Plus className="w-3.5 h-3.5" />
                Compose Message
              </button>
            </div>
          ) : (
            <div className="space-y-2 max-h-[calc(100vh-20rem)] overflow-y-auto pr-1">
              {communications.map((msg) => {
                const isSelected = selectedMessage?.id === msg.id;
                return (
                  <div
                    key={msg.id}
                    onClick={() => {
                      setSelectedMessage(msg);
                      setActiveMessage(msg);
                      setIsDetailsOpen(true);
                    }}
                    className={`p-3.5 rounded-2xl border transition-all cursor-pointer relative ${
                      isSelected
                        ? 'bg-slate-900 border-indigo-500 shadow-lg shadow-indigo-500/10'
                        : 'bg-slate-900/60 border-slate-800/80 hover:bg-slate-900 hover:border-slate-700'
                    }`}
                  >
                    {!msg.isRead && (
                      <span className="absolute top-3.5 right-3 w-2 h-2 rounded-full bg-indigo-400 ring-4 ring-indigo-400/20" />
                    )}

                    <div className="flex items-center justify-between gap-2 mb-1.5">
                      <div className="flex items-center gap-2">
                        <ChannelBadge channel={msg.channel} />
                        <span className="text-xs font-bold text-slate-200 truncate max-w-[140px]">
                          {msg.recipientName || msg.recipientAddress || 'General Recipient'}
                        </span>
                      </div>
                      <span className="text-[10px] text-slate-500">
                        {new Date(msg.createdAt).toLocaleDateString()}
                      </span>
                    </div>

                    <h4 className="text-xs font-semibold text-slate-100 truncate mb-1">
                      {msg.subject}
                    </h4>

                    <p className="text-[11px] text-slate-400 line-clamp-2 leading-relaxed mb-2">
                      {msg.snippet || msg.body}
                    </p>

                    <div className="flex items-center justify-between pt-1 border-t border-slate-800/60 text-[11px]">
                      <div className="flex items-center gap-2 text-slate-500">
                        <span>{msg.relatedToName || msg.relatedToType}</span>
                        {msg.attachmentNames && (
                          <span className="flex items-center gap-0.5 text-indigo-400">
                            <Paperclip className="w-3 h-3" />
                          </span>
                        )}
                      </div>

                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={(e) => handleToggleStar(msg, e)}
                          className={`p-1 rounded transition-colors ${
                            msg.isStarred
                              ? 'text-amber-400'
                              : 'text-slate-500 hover:text-slate-300'
                          }`}
                          title={msg.isStarred ? 'Unstar' : 'Star message'}
                        >
                          <Star className={`w-3.5 h-3.5 ${msg.isStarred ? 'fill-amber-400' : ''}`} />
                        </button>
                        {isAdmin && (
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              setActiveMessage(msg);
                              setIsDeleteOpen(true);
                            }}
                            className="p-1 rounded text-slate-500 hover:text-rose-400 hover:bg-rose-500/10 transition-colors"
                            title="Delete Message"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        )}
                        <MessageStatusBadge status={msg.status} />
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Right Column: Message Reader & Thread Inspector */}
        <div className="lg:col-span-7">
          {selectedMessage ? (
            <div className="rounded-2xl bg-slate-900 border border-slate-800 shadow-2xl overflow-hidden flex flex-col">
              {/* Reader Header */}
              <div className="p-6 border-b border-slate-800 bg-slate-950/40 flex items-start justify-between gap-4">
                <div className="space-y-2">
                  <div className="flex items-center gap-2 flex-wrap">
                    <ChannelBadge channel={selectedMessage.channel} size="md" />
                    <MessageStatusBadge status={selectedMessage.status} />
                    {selectedMessage.priority === 'URGENT' && (
                      <span className="px-2 py-0.5 rounded-full text-[11px] font-bold bg-rose-500/20 text-rose-300 border border-rose-500/30">
                        URGENT
                      </span>
                    )}
                  </div>
                  <h2 className="text-lg font-bold text-white">{selectedMessage.subject}</h2>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => handleToggleStar(selectedMessage)}
                    className={`p-2 rounded-xl border transition-all ${
                      selectedMessage.isStarred
                        ? 'bg-amber-500/20 border-amber-500 text-amber-300'
                        : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-slate-200'
                    }`}
                    title="Toggle Star"
                  >
                    <Star className={`w-4 h-4 ${selectedMessage.isStarred ? 'fill-amber-400' : ''}`} />
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setActiveMessage(selectedMessage);
                      setIsDetailsOpen(true);
                    }}
                    className="px-3.5 py-2 rounded-xl bg-indigo-600/20 hover:bg-indigo-600/30 border border-indigo-500/30 text-xs font-semibold text-indigo-300 flex items-center gap-1.5 transition-all"
                    title="View Full Big Screen"
                  >
                    <Maximize2 className="w-3.5 h-3.5" />
                    <span>Big Screen View</span>
                  </button>
                </div>
              </div>

              {/* Reader Metadata Ribbon */}
              <div className="px-6 py-3 bg-slate-950/60 border-b border-slate-800 grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
                <div>
                  <span className="text-slate-500 block text-[10px]">Recipient</span>
                  <span className="font-semibold text-slate-200">
                    {selectedMessage.recipientName || selectedMessage.recipientAddress}
                  </span>
                  {selectedMessage.recipientAddress && (
                    <span className="text-slate-400 font-mono text-[11px] block truncate">
                      {selectedMessage.recipientAddress}
                    </span>
                  )}
                </div>

                <div>
                  <span className="text-slate-500 block text-[10px]">Related CRM Entity</span>
                  <span className="font-semibold text-slate-200 flex items-center gap-1">
                    <Building2 className="w-3 h-3 text-slate-400" />
                    {selectedMessage.relatedToName || selectedMessage.relatedToType}
                  </span>
                </div>

                <div>
                  <span className="text-slate-500 block text-[10px]">Sent Date & Opens</span>
                  <span className="font-semibold text-slate-200">
                    {new Date(selectedMessage.createdAt).toLocaleString()}
                  </span>
                  <span className="text-indigo-400 text-[11px] block">
                    {selectedMessage.openCount || 0} opens &bull; {selectedMessage.clickCount || 0} clicks
                  </span>
                </div>
              </div>

              {/* Message Content Body */}
              <div className="p-6 space-y-4">
                <div className="p-5 rounded-2xl bg-slate-950/40 border border-slate-800/80 text-xs text-slate-200 whitespace-pre-wrap leading-relaxed">
                  {selectedMessage.body}
                </div>

                {selectedMessage.attachmentNames && (
                  <div className="p-3.5 rounded-xl bg-slate-950/60 border border-slate-800 flex items-center justify-between text-xs">
                    <div className="flex items-center gap-2 text-slate-300">
                      <Paperclip className="w-4 h-4 text-indigo-400" />
                      <span>Attached Files: {selectedMessage.attachmentNames}</span>
                    </div>
                    <span className="text-[11px] text-slate-500">Verified</span>
                  </div>
                )}
              </div>

              {/* Reader Action Bar */}
              <div className="px-6 py-4 border-t border-slate-800 bg-slate-950/40 flex items-center justify-between">
                {isAdmin ? (
                  <button
                    type="button"
                    onClick={() => {
                      setActiveMessage(selectedMessage);
                      setIsDeleteOpen(true);
                    }}
                    className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-rose-400 bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/20 text-xs font-semibold transition-colors"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>Delete Message</span>
                  </button>
                ) : (
                  <span className="text-[11px] text-slate-500 italic">
                    Interaction trail preserved
                  </span>
                )}

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => handleMarkRead(selectedMessage, !selectedMessage.isRead)}
                    className="px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-semibold text-slate-300 transition-colors"
                  >
                    {selectedMessage.isRead ? 'Mark as Unread' : 'Mark as Read'}
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setActiveMessage(selectedMessage);
                      setIsDetailsOpen(true);
                    }}
                    className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-xs font-bold text-white shadow-md shadow-indigo-600/30 flex items-center gap-1.5 transition-all"
                  >
                    <Send className="w-3.5 h-3.5" />
                    Reply
                  </button>
                </div>
              </div>
            </div>
          ) : (
            <div className="p-12 rounded-2xl bg-slate-900/40 border border-slate-800/80 text-center space-y-2">
              <Mail className="w-10 h-10 mx-auto text-slate-600" />
              <h3 className="text-sm font-bold text-slate-300">Select a Message</h3>
              <p className="text-xs text-slate-500 max-w-sm mx-auto">
                Choose a conversation from the list to view the message thread, reply history, and delivery details.
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Modals */}
      <ComposeMessageModal
        isOpen={isComposeOpen}
        onClose={() => setIsComposeOpen(false)}
        onSend={handleSendMessage}
        customers={customers}
        leads={leads}
        contacts={contacts}
        teamMembers={teamMembers}
      />

      <MessageDetailsModal
        isOpen={isDetailsOpen}
        onClose={() => setIsDetailsOpen(false)}
        message={activeMessage}
        onDelete={
          isAdmin
            ? (msg) => {
                setIsDetailsOpen(false);
                setActiveMessage(msg);
                setIsDeleteOpen(true);
              }
            : undefined
        }
        onToggleStar={(msg) => handleToggleStar(msg)}
        onReplySent={() => {
          showToast('Reply dispatched successfully');
          fetchData();
        }}
      />

      <DeleteMessageModal
        isOpen={isDeleteOpen}
        onClose={() => {
          setIsDeleteOpen(false);
          setActiveMessage(null);
        }}
        onConfirm={handleDeleteMessage}
        message={activeMessage}
      />

      {isAdmin && (
        <ConfigureGatewaysModal
          isOpen={isGatewaysOpen}
          onClose={() => setIsGatewaysOpen(false)}
          onSuccess={(msg) => showToast(msg)}
        />
      )}
    </div>
  );
};
