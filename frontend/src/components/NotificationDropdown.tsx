import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { 
  Bell, 
  Calendar, 
  Clock, 
  Video, 
  CheckCheck, 
  Trash2, 
  ExternalLink, 
  AlertCircle, 
  RefreshCw,
  Sparkles,
  ChevronRight,
  CheckCircle2,
  CalendarDays,
  Search,
  X,
  Boxes,
} from 'lucide-react';
import { notificationService, NotificationItem } from '../services/notificationService';
import { productApi } from '../api/productApi';
import { triggerRefreshBlink } from './common/RefreshFeedbackOverlay';

interface NotificationDropdownProps {
  onOpenAppointment?: (appointmentId: number) => void;
}

export const NotificationDropdown: React.FC<NotificationDropdownProps> = ({ onOpenAppointment }) => {
  const navigate = useNavigate();
  const [isOpen, setIsOpen] = useState(false);
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [unreadCount, setUnreadCount] = useState<number>(0);
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [priorityFilter, setPriorityFilter] = useState<'ALL' | 'HIGH' | 'MEDIUM' | 'LOW'>('ALL');
  const [activeTab, setActiveTab] = useState<'ALL' | 'UNREAD' | 'MEETINGS' | 'REMINDERS'>('ALL');
  const dropdownRef = useRef<HTMLDivElement>(null);

  const fetchUnreadCount = async () => {
    try {
      const [count, prodStats] = await Promise.all([
        notificationService.getUnreadCount().catch(() => 0),
        productApi.getProductStats().catch(() => null),
      ]);
      const lowStockCount = prodStats?.lowStockAlerts || 0;
      setUnreadCount(count + lowStockCount);
    } catch {
      // ignore
    }
  };

  const fetchNotifications = async () => {
    setLoading(true);
    try {
      const [data, lowStockRes] = await Promise.all([
        notificationService.getNotifications().catch(() => []),
        productApi.getProducts({ lowStockOnly: true, size: 20 }).catch(() => null),
      ]);

      const lowStockProducts = lowStockRes?.data || [];
      const stockNotifs: NotificationItem[] = lowStockProducts.map((p: any) => ({
        id: -p.id,
        recipientId: 0,
        title: `Low Stock Warning: ${p.name}`,
        message: `Only ${p.stockQuantity ?? 0} units left in stock (Safety threshold: ${p.lowStockThreshold} units). Click to restock.`,
        type: 'GENERAL' as const,
        priority: 'HIGH' as const,
        isRead: false,
        read: false,
        createdAt: p.updatedAt || p.createdAt || new Date().toISOString(),
      }));

      const merged = [...stockNotifs, ...data];
      setNotifications(merged);
      const unread = merged.filter((n) => !(n.isRead || n.read)).length;
      setUnreadCount(unread);
    } catch (err) {
      console.error('Failed to load notifications:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUnreadCount();
    const interval = setInterval(() => {
      fetchUnreadCount();
    }, 20000); // 20s poll for real-time notifications
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (isOpen) {
      fetchNotifications();
    }
  }, [isOpen]);

  // Click outside listener
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleMarkAsRead = async (id: number, e?: React.MouseEvent) => {
    e?.stopPropagation();
    try {
      await notificationService.markAsRead(id);
      setNotifications((prev) =>
        prev.map((n) => (n.id === id ? { ...n, isRead: true, read: true } : n))
      );
      setUnreadCount((prev) => Math.max(0, prev - 1));
    } catch (err) {
      console.error('Failed to mark read:', err);
    }
  };

  const handleMarkAllAsRead = async () => {
    try {
      await notificationService.markAllAsRead();
      setNotifications((prev) =>
        prev.map((n) => ({ ...n, isRead: true, read: true }))
      );
      setUnreadCount(0);
    } catch (err) {
      console.error('Failed to mark all as read:', err);
    }
  };

  const handleDelete = async (id: number, e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      await notificationService.deleteNotification(id);
      setNotifications((prev) => prev.filter((n) => n.id !== id));
      fetchUnreadCount();
    } catch (err) {
      console.error('Failed to delete notification:', err);
    }
  };

  const filteredNotifications = notifications.filter((n) => {
    const isUnread = !(n.isRead || n.read);
    if (activeTab === 'UNREAD' && !isUnread) return false;
    if (activeTab === 'MEETINGS' && !n.type.startsWith('MEETING_')) return false;
    if (activeTab === 'REMINDERS' && n.type !== 'MEETING_REMINDER' && n.type !== 'TASK_REMINDER') return false;

    if (priorityFilter !== 'ALL') {
      if (n.priority?.toUpperCase() !== priorityFilter) return false;
    }

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      const matchTitle = n.title?.toLowerCase().includes(q);
      const matchMsg = n.message?.toLowerCase().includes(q);
      const matchId = n.appointmentId ? String(n.appointmentId).includes(q) : false;
      const matchType = n.type.toLowerCase().includes(q);
      if (!matchTitle && !matchMsg && !matchId && !matchType) return false;
    }

    return true;
  });

  const getIconForType = (type: string, priority?: string, title?: string) => {
    if (title?.toLowerCase().includes('stock') || type?.toLowerCase().includes('stock')) {
      return <Boxes className="w-4 h-4 text-amber-400" />;
    }
    switch (type) {
      case 'MEETING_REMINDER':
        return <Clock className="w-4 h-4 text-amber-400" />;
      case 'MEETING_SCHEDULED':
        return <Calendar className="w-4 h-4 text-indigo-400" />;
      case 'MEETING_RESCHEDULED':
        return <RefreshCw className="w-4 h-4 text-sky-400" />;
      case 'MEETING_CANCELLED':
        return <AlertCircle className="w-4 h-4 text-rose-400" />;
      default:
        return priority === 'HIGH' ? (
          <Sparkles className="w-4 h-4 text-amber-400" />
        ) : (
          <Bell className="w-4 h-4 text-indigo-400" />
        );
    }
  };

  const handleNotificationClick = (notif: NotificationItem) => {
    const isUnread = !(notif.isRead || notif.read);
    if (isUnread) {
      handleMarkAsRead(notif.id);
    }
    setIsOpen(false);

    if (notif.meetingLink && (notif.meetingLink.startsWith('http://') || notif.meetingLink.startsWith('https://'))) {
      window.open(notif.meetingLink, '_blank', 'noopener,noreferrer');
      navigate('/appointments');
      if (notif.appointmentId && onOpenAppointment) {
        onOpenAppointment(notif.appointmentId);
      }
      return;
    }

    if (notif.appointmentId && onOpenAppointment) {
      onOpenAppointment(notif.appointmentId);
      return;
    }

    const typeUpper = (notif.type || '').toUpperCase();
    const titleLower = (notif.title || '').toLowerCase();
    const msgLower = (notif.message || '').toLowerCase();

    if (
      notif.id < 0 ||
      typeUpper.includes('STOCK') ||
      titleLower.includes('stock') ||
      msgLower.includes('stock')
    ) {
      navigate('/products');
      return;
    }

    if (
      typeUpper.startsWith('MEETING') ||
      typeUpper.startsWith('APPOINTMENT') ||
      notif.appointmentId ||
      titleLower.includes('meeting') ||
      msgLower.includes('meeting')
    ) {
      navigate('/appointments');
    } else if (
      typeUpper.includes('DEAL') ||
      typeUpper.includes('PIPELINE') ||
      titleLower.includes('deal') ||
      msgLower.includes('deal')
    ) {
      navigate('/pipeline');
    } else if (
      typeUpper.includes('LEAD') ||
      titleLower.includes('lead') ||
      msgLower.includes('lead')
    ) {
      navigate('/leads');
    } else if (
      typeUpper.includes('TASK') ||
      titleLower.includes('task') ||
      msgLower.includes('task')
    ) {
      navigate('/tasks');
    } else if (
      typeUpper.includes('FOLLOWUP') ||
      typeUpper.includes('CADENCE') ||
      typeUpper.includes('TOUCHPOINT') ||
      titleLower.includes('follow-up') ||
      msgLower.includes('cadence')
    ) {
      navigate('/cadence');
    } else if (
      typeUpper.includes('CUSTOMER') ||
      typeUpper.includes('ACCOUNT') ||
      titleLower.includes('customer') ||
      msgLower.includes('account')
    ) {
      navigate('/customers');
    } else if (
      typeUpper.includes('CONTACT') ||
      titleLower.includes('contact') ||
      msgLower.includes('contact')
    ) {
      navigate('/contacts');
    } else if (
      typeUpper.includes('CALL') ||
      typeUpper.includes('TELEPHONY') ||
      titleLower.includes('call') ||
      msgLower.includes('dialer')
    ) {
      navigate('/telephony');
    } else if (
      typeUpper.includes('COMMUNICATION') ||
      typeUpper.includes('MESSAGE') ||
      typeUpper.includes('INBOX') ||
      titleLower.includes('email') ||
      titleLower.includes('sms')
    ) {
      navigate('/inbox');
    } else if (
      typeUpper.includes('PRODUCT') ||
      titleLower.includes('product') ||
      msgLower.includes('catalog')
    ) {
      navigate('/products');
    } else if (
      typeUpper.includes('USER') ||
      titleLower.includes('user') ||
      titleLower.includes('team')
    ) {
      navigate('/users');
    } else {
      navigate('/dashboard');
    }
  };

  return (
    <div className="relative" ref={dropdownRef}>
      {/* Bell Trigger Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        title="Notifications & Meeting Reminders"
        className={`relative p-2.5 rounded-xl border transition-all duration-200 flex items-center justify-center ${
          isOpen
            ? 'bg-indigo-600/20 border-indigo-500/50 text-indigo-300 shadow-lg shadow-indigo-600/20'
            : 'bg-slate-800/80 border-slate-700/70 text-slate-300 hover:text-indigo-400 hover:border-slate-600 hover:bg-slate-800'
        }`}
      >
        <Bell className="w-4 h-4" />
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 flex h-5 w-5 items-center justify-center">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-400 opacity-75"></span>
            <span className="relative inline-flex items-center justify-center rounded-full h-4 min-w-[16px] px-1 bg-gradient-to-r from-rose-500 to-pink-600 text-[10px] font-bold text-white shadow-md shadow-rose-500/40">
              {unreadCount > 9 ? '9+' : unreadCount}
            </span>
          </span>
        )}
      </button>

      {/* Dropdown Panel */}
      {isOpen && (
        <div className="absolute right-0 mt-3 w-80 sm:w-96 rounded-2xl bg-slate-900/95 border border-slate-700/80 shadow-2xl backdrop-blur-xl z-50 overflow-hidden animate-in fade-in zoom-in-95 duration-150">
          {/* Header */}
          <div className="p-3.5 border-b border-slate-800 flex items-center justify-between bg-slate-800/40">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-lg bg-indigo-600/20 border border-indigo-500/30 flex items-center justify-center text-indigo-400">
                <Bell className="w-3.5 h-3.5" />
              </div>
              <h3 className="text-sm font-bold text-slate-100">Notifications & Reminders</h3>
              {unreadCount > 0 && (
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                  {unreadCount} new
                </span>
              )}
            </div>

            <div className="flex items-center gap-1.5">
              <button
                onClick={() => {
                  fetchNotifications();
                  triggerRefreshBlink('Notifications refreshed');
                }}
                disabled={loading}
                className="p-1.5 text-slate-400 hover:text-indigo-300 rounded-lg hover:bg-slate-800/80 transition-colors disabled:opacity-50"
                title="Refresh notifications"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin text-indigo-400' : ''}`} />
              </button>

              {unreadCount > 0 && (
                <button
                  onClick={handleMarkAllAsRead}
                  className="text-[11px] font-medium text-slate-400 hover:text-indigo-300 flex items-center gap-1 transition px-1.5 py-1 rounded-lg hover:bg-slate-800/60"
                  title="Mark all as read"
                >
                  <CheckCheck className="w-3.5 h-3.5" />
                  <span>Mark all read</span>
                </button>
              )}

              <button
                onClick={() => setIsOpen(false)}
                className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800/80 transition-colors"
                title="Close notifications"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Real-time Keyword Search Input */}
          <div className="p-2.5 bg-slate-950/60 border-b border-slate-800/80">
            <div className="relative">
              <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                placeholder="Search alerts, meetings, attendees..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-8 py-1.5 bg-slate-800/80 border border-slate-700/80 rounded-xl text-white placeholder-slate-500 text-xs focus:outline-none focus:ring-1 focus:ring-indigo-500"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white"
                >
                  <X className="w-3 h-3" />
                </button>
              )}
            </div>
          </div>

          {/* Tab Filter Pills & Priority Filter */}
          <div className="p-2 bg-slate-950/40 border-b border-slate-800/80 space-y-1.5 text-xs">
            <div className="flex items-center gap-1 overflow-x-auto pb-0.5">
              {(['ALL', 'UNREAD', 'MEETINGS', 'REMINDERS'] as const).map((tab) => (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  className={`px-2.5 py-1 rounded-lg font-medium whitespace-nowrap transition-all ${
                    activeTab === tab
                      ? 'bg-indigo-600 text-white shadow-sm shadow-indigo-600/30'
                      : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
                  }`}
                >
                  {tab === 'ALL' && 'All'}
                  {tab === 'UNREAD' && `Unread (${unreadCount})`}
                  {tab === 'MEETINGS' && 'Meetings 📅'}
                  {tab === 'REMINDERS' && 'Reminders ⏰'}
                </button>
              ))}
            </div>

            <div className="flex items-center gap-1 text-[11px] pt-1 border-t border-slate-800/40">
              <span className="text-slate-500 text-[10px] uppercase font-semibold mr-1">Priority:</span>
              {(['ALL', 'HIGH', 'MEDIUM', 'LOW'] as const).map((p) => (
                <button
                  key={p}
                  onClick={() => setPriorityFilter(p)}
                  className={`px-2 py-0.5 rounded-md font-medium transition ${
                    priorityFilter === p
                      ? 'bg-slate-700 text-white font-bold'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  {p === 'ALL' ? 'All' : p === 'HIGH' ? '⚡ High' : p.charAt(0) + p.slice(1).toLowerCase()}
                </button>
              ))}
            </div>
          </div>

          {/* List Area */}
          <div className="max-h-96 overflow-y-auto divide-y divide-slate-800/50">
            {loading && notifications.length === 0 ? (
              <div className="p-8 text-center text-slate-400 flex flex-col items-center gap-2">
                <RefreshCw className="w-5 h-5 animate-spin text-indigo-400" />
                <span className="text-xs">Checking alerts & reminders...</span>
              </div>
            ) : filteredNotifications.length === 0 ? (
              <div className="p-8 text-center text-slate-400 flex flex-col items-center gap-2">
                <div className="w-10 h-10 rounded-full bg-slate-800/60 border border-slate-700 flex items-center justify-center text-slate-500">
                  <CheckCircle2 className="w-5 h-5" />
                </div>
                <p className="text-xs font-semibold text-slate-300">You're all caught up!</p>
                <p className="text-[11px] text-slate-500">No {activeTab.toLowerCase()} notifications found.</p>
              </div>
            ) : (
              filteredNotifications.map((notif) => {
                const isUnread = !(notif.isRead || notif.read);
                return (
                  <div
                    key={notif.id}
                    onClick={() => handleNotificationClick(notif)}
                    className={`p-3.5 hover:bg-slate-800/70 transition-all group cursor-pointer relative flex gap-3 ${
                      isUnread ? 'bg-indigo-950/25' : ''
                    }`}
                  >
                    {/* Unread Left Border Accent */}
                    {isUnread && (
                      <div className="absolute left-0 top-0 bottom-0 w-1 bg-gradient-to-b from-indigo-500 to-violet-500" />
                    )}

                    {/* Icon Bubble */}
                    <div className="flex-shrink-0 mt-0.5">
                      <div className="w-8 h-8 rounded-xl bg-slate-800/80 border border-slate-700/60 flex items-center justify-center shadow-inner group-hover:border-indigo-500/50 transition">
                        {getIconForType(notif.type, notif.priority, notif.title)}
                      </div>
                    </div>

                    {/* Content */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-1">
                        <h4 className={`text-xs font-semibold tracking-tight group-hover:text-indigo-300 transition ${
                          isUnread ? 'text-slate-100 font-bold' : 'text-slate-300'
                        }`}>
                          {notif.title}
                        </h4>
                        <span className="text-[10px] text-slate-500 whitespace-nowrap">
                          {notif.timeAgo || 'Just now'}
                        </span>
                      </div>

                      <p className="text-[11px] text-slate-400 mt-1 line-clamp-2 leading-relaxed">
                        {notif.message}
                      </p>

                      {/* Action items inside notification */}
                      <div className="flex items-center justify-between gap-2 mt-2 pt-2 border-t border-slate-800/40">
                        <div className="flex items-center gap-2">
                          {notif.meetingLink && (
                            <a
                              href={notif.meetingLink}
                              target="_blank"
                              rel="noreferrer"
                              onClick={(e) => {
                                e.stopPropagation();
                                if (isUnread) handleMarkAsRead(notif.id);
                              }}
                              className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-emerald-600/25 hover:bg-emerald-600 text-emerald-300 hover:text-white border border-emerald-500/40 text-[10px] font-bold transition shadow-sm"
                            >
                              <Video className="w-3.5 h-3.5" />
                              <span>Join Meeting</span>
                              <ExternalLink className="w-2.5 h-2.5 opacity-80" />
                            </a>
                          )}

                          {notif.appointmentId && (
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                handleNotificationClick(notif);
                              }}
                              className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-[10px] text-slate-300 hover:text-white border border-slate-700/60 transition"
                            >
                              <CalendarDays className="w-3.5 h-3.5 text-indigo-400" />
                              <span>Meeting #{notif.appointmentId}</span>
                            </button>
                          )}
                        </div>

                        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                          {isUnread && (
                            <button
                              onClick={(e) => handleMarkAsRead(notif.id, e)}
                              title="Mark as read"
                              className="p-1 rounded text-slate-400 hover:text-indigo-300 hover:bg-slate-700/60 transition"
                            >
                              <CheckCheck className="w-3.5 h-3.5" />
                            </button>
                          )}
                          <button
                            onClick={(e) => handleDelete(notif.id, e)}
                            title="Dismiss notification"
                            className="p-1 rounded text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 transition"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>

          {/* Footer */}
          <div className="p-2.5 bg-slate-950/60 border-t border-slate-800 text-center">
            <Link
              to="/appointments"
              onClick={() => setIsOpen(false)}
              className="text-[11px] font-semibold text-indigo-400 hover:text-indigo-300 flex items-center justify-center gap-1 transition"
            >
              <span>View Appointment Schedule</span>
              <ChevronRight className="w-3 h-3" />
            </Link>
          </div>
        </div>
      )}
    </div>
  );
};
