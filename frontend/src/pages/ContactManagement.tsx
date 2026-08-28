import React, { useEffect, useState } from 'react';
import { contactApi } from '../api/contactApi';
import { customerApi } from '../api/customerApi';
import { userApi } from '../api/userApi';
import {
  Contact,
  ContactStats,
  ContactType,
  ContactStatus,
  CreateContactRequest,
  UpdateContactRequest,
  StakeholderTag,
  RelinkContactRequest,
  MergeContactsRequest,
  CreateTagRequest,
} from '../types/contact';
import { Customer } from '../types/customer';
import { User } from '../types/auth';
import { ContactTypeBadge } from '../components/contacts/ContactTypeBadge';
import { ContactStatusBadge } from '../components/contacts/ContactStatusBadge';
import { isPrimaryLead, isDecisionMaker, isChampion } from '../utils/contactSelectors';
import { CreateContactModal } from '../components/contacts/CreateContactModal';
import { EditContactModal } from '../components/contacts/EditContactModal';
import { ContactDetailsModal } from '../components/contacts/ContactDetailsModal';
import { DeleteContactModal } from '../components/contacts/DeleteContactModal';
import { ManageTagsModal } from '../components/contacts/ManageTagsModal';
import { MergeContactsModal } from '../components/contacts/MergeContactsModal';
import { RelinkContactModal } from '../components/contacts/RelinkContactModal';
import {
  Users,
  Crown,
  Sparkles,
  Building2,
  Search,
  Plus,
  Grid,
  List,
  Mail,
  Phone,
  Edit2,
  Trash2,
  Eye,
  FileSpreadsheet,
  CheckCircle2,
  Tag,
  GitMerge,
  Link2,
  Archive,
  RotateCcw,
  Lock,
  UserCheck,
} from 'lucide-react';

import { useAuth } from '../context/AuthContext';

export const ContactManagement: React.FC = () => {
  const { user } = useAuth();
  const isAdmin = user?.role === 'ROLE_ADMIN';
  const isManager = user?.role === 'ROLE_MANAGER';
  const isEmployee = user?.role === 'ROLE_EMPLOYEE';

  const [contacts, setContacts] = useState<Contact[]>([]);
  const [stats, setStats] = useState<ContactStats | null>(null);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [teamMembers, setTeamMembers] = useState<User[]>([]);
  const [customTags, setCustomTags] = useState<StakeholderTag[]>([]);
  const [loading, setLoading] = useState(true);

  // Filters & Pagination
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCustomerId, setSelectedCustomerId] = useState<number | undefined>(undefined);
  const [selectedType, setSelectedType] = useState<ContactType | ''>('');
  const [selectedStatus, setSelectedStatus] = useState<ContactStatus | ''>('');
  const [activeTab, setActiveTab] = useState<'ALL' | 'MY' | 'TEAM' | 'DECISION_MAKER' | 'CHAMPION' | 'PRIMARY' | 'ARCHIVED'>('ALL');
  const [viewMode, setViewMode] = useState<'grid' | 'table'>('grid');
  const [currentPage, setCurrentPage] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [totalItems, setTotalItems] = useState(0);

  // Modals
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isDetailsOpen, setIsDetailsOpen] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [isManageTagsOpen, setIsManageTagsOpen] = useState(false);
  const [isMergeOpen, setIsMergeOpen] = useState(false);
  const [isRelinkOpen, setIsRelinkOpen] = useState(false);
  const [selectedContact, setSelectedContact] = useState<Contact | null>(null);

  // Success Feedback
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 4000);
  };

  const loadData = async () => {
    try {
      setLoading(true);

      let isPrimaryParam: boolean | undefined = undefined;
      let contactTypeParam: ContactType | undefined = selectedType ? (selectedType as ContactType) : undefined;
      let isArchivedParam: boolean | undefined = activeTab === 'ARCHIVED' ? true : false;
      let assignedIdParam: number | undefined = undefined;

      if (activeTab === 'MY' && user) {
        assignedIdParam = user.id;
      } else if (activeTab === 'PRIMARY') {
        isPrimaryParam = true;
      } else if (activeTab === 'DECISION_MAKER') {
        contactTypeParam = 'DECISION_MAKER';
      } else if (activeTab === 'CHAMPION') {
        contactTypeParam = 'CHAMPION';
      }

      const [contactRes, statsRes, custRes, teamRes, tagsRes] = await Promise.all([
        contactApi.getContacts({
          search: searchTerm || undefined,
          customerId: selectedCustomerId,
          assignedId: assignedIdParam,
          contactType: contactTypeParam,
          status: selectedStatus ? (selectedStatus as ContactStatus) : undefined,
          isPrimary: isPrimaryParam,
          isArchived: isArchivedParam,
          page: currentPage,
          size: 18,
          sortBy: 'createdAt',
          sortDir: 'desc',
        }),
        contactApi.getStats().catch(() => null),
        customerApi.getCustomers({ assignedId: isEmployee && user ? user.id : undefined }).catch(() => ({ data: [] })),
        isManager
          ? userApi.getTeamMembers().catch(() => [])
          : (isEmployee && user ? Promise.resolve([user]) : userApi.getAllUsers().catch(() => [])),
        contactApi.getAllTags().catch(() => []),
      ]);

      let loadedContacts = contactRes.data || [];
      let availableAssignees: User[] = [];

      if (isManager && user) {
        const team = teamRes || [];
        const teamMemberIds = new Set([user.id, ...team.map((u: User) => u.id)]);

        if (activeTab === 'TEAM') {
          loadedContacts = loadedContacts.filter(
            (c) => c.assignedToUserId && c.assignedToUserId !== user.id && teamMemberIds.has(c.assignedToUserId)
          );
        } else if (activeTab === 'ALL') {
          loadedContacts = loadedContacts.filter(
            (c) => !c.assignedToUserId || teamMemberIds.has(c.assignedToUserId)
          );
        }
        availableAssignees = [user, ...team];
      } else if (isEmployee && user) {
        loadedContacts = loadedContacts.filter(
          (c) => !c.assignedToUserId || c.assignedToUserId === user.id
        );
        availableAssignees = [user];
      } else {
        availableAssignees = teamRes || [];
      }

      setContacts(loadedContacts);
      setTotalPages(contactRes.totalPages || 1);
      setTotalItems(loadedContacts.length);
      if (statsRes) setStats(statsRes);
      if (custRes?.data) setCustomers(custRes.data);
      setTeamMembers(availableAssignees);
      setCustomTags(tagsRes || []);
    } catch (err) {
      console.error('Failed to load contacts:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [searchTerm, selectedCustomerId, selectedType, selectedStatus, activeTab, currentPage]);

  const handleCreate = async (data: CreateContactRequest) => {
    await contactApi.createContact(data);
    showToast('New stakeholder contact created successfully.');
    loadData();
  };

  const handleUpdate = async (id: number, data: UpdateContactRequest) => {
    await contactApi.updateContact(id, data);
    showToast('Contact details updated.');
    loadData();
  };

  const handleArchive = async (id: number) => {
    await contactApi.archiveContact(id);
    showToast('Contact moved to archive.');
    loadData();
  };

  const handleRestore = async (id: number) => {
    await contactApi.restoreContact(id);
    showToast('Contact restored to active pool.');
    loadData();
  };

  const handlePermanentDelete = async (id: number) => {
    await contactApi.permanentDeleteContact(id);
    showToast('Contact permanently deleted from database.');
    loadData();
  };

  const handleRelink = async (contactId: number, data: RelinkContactRequest) => {
    await contactApi.relinkContact(contactId, data);
    showToast('Contact successfully re-linked to customer account.');
    loadData();
  };

  const handleMerge = async (data: MergeContactsRequest) => {
    await contactApi.mergeContacts(data);
    showToast('Contacts merged and consolidated successfully.');
    loadData();
  };

  const handleCreateTag = async (data: CreateTagRequest) => {
    await contactApi.createTag(data);
    showToast(`Stakeholder tag "${data.name}" created.`);
    const tags = await contactApi.getAllTags();
    setCustomTags(tags);
  };

  const handleDeleteTag = async (id: number) => {
    await contactApi.deleteTag(id);
    showToast('Stakeholder tag deleted.');
    const tags = await contactApi.getAllTags();
    setCustomTags(tags);
  };

  const handleTogglePrimary = async (id: number, isPrimary: boolean) => {
    await contactApi.togglePrimary(id, isPrimary);
    showToast(isPrimary ? 'Designated as Primary Account Contact' : 'Removed Primary Contact designation');
    loadData();
  };

  const canEditContact = (c: Contact): boolean => {
    if (isAdmin) return true;
    if (isManager) return true;
    if (isEmployee) {
      return !c.assignedToUserId || c.assignedToUserId === user?.id;
    }
    return false;
  };

  const exportContactsCsv = () => {
    if (isEmployee) return; // Anti-theft restriction
    if (contacts.length === 0) return;
    const headers = ['ID', 'Name', 'Email', 'Phone', 'Job Title', 'Department', 'Company', 'Role', 'Status', 'Tags', 'Primary'];
    const rows = contacts.map((c) => [
      c.id,
      `"${c.fullName}"`,
      c.email,
      c.phone || '',
      `"${c.jobTitle || ''}"`,
      `"${c.department || ''}"`,
      `"${c.customerName || ''}"`,
      c.contactType,
      c.status,
      `"${c.tags || ''}"`,
      c.isPrimaryContact ? 'YES' : 'NO',
    ]);
    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `crm_contacts_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6 animate-fadeIn">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed top-5 right-5 z-50 p-4 rounded-xl bg-emerald-500/90 text-white shadow-2xl backdrop-blur-md flex items-center gap-2.5 text-sm font-medium border border-emerald-400/30 animate-bounce">
          <CheckCircle2 className="w-5 h-5 text-white" />
          {toastMessage}
        </div>
      )}

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <Users className="w-7 h-7 text-indigo-400" />
            <h1 className="text-2xl font-bold text-white">Contact & Stakeholder Management</h1>
            <span className="px-2.5 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 text-xs font-semibold">
              {isAdmin ? 'Admin 🛡️' : isManager ? 'Manager 👔' : 'Employee 👤'}
            </span>
          </div>
          <p className="text-sm text-slate-400 mt-1">
            Track key decision-makers, champions, stakeholder roles, and account coverage
          </p>
        </div>

        <div className="flex items-center flex-wrap gap-2.5">
          {/* Admin Custom Tags Button */}
          {isAdmin && (
            <button
              onClick={() => setIsManageTagsOpen(true)}
              className="px-3.5 py-2 rounded-xl bg-slate-900 border border-indigo-500/30 text-indigo-300 hover:text-indigo-200 hover:bg-indigo-950/30 text-xs font-semibold transition-all flex items-center gap-1.5"
            >
              <Tag className="w-3.5 h-3.5 text-indigo-400" />
              Customize Tags
            </button>
          )}

          {/* Export CSV (Admin: Full, Manager: Team, Employee: Disabled/Anti-theft) */}
          {!isEmployee ? (
            <button
              onClick={exportContactsCsv}
              disabled={contacts.length === 0}
              className="px-3.5 py-2 rounded-xl bg-slate-900 border border-slate-800 text-slate-300 hover:text-white hover:bg-slate-800 text-xs font-semibold transition-all flex items-center gap-1.5 disabled:opacity-50"
              title={isManager ? 'Export Team Contact List' : 'Export Full Contact List'}
            >
              <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-400" />
              Export CSV
            </button>
          ) : (
            <div
              className="px-3 py-2 rounded-xl bg-slate-950/60 border border-slate-800 text-slate-500 text-xs font-medium flex items-center gap-1.5 cursor-not-allowed"
              title="CSV export is restricted to Managers and Admins for CRM Anti-Theft security"
            >
              <Lock className="w-3 h-3 text-amber-500/60" />
              <span className="hidden sm:inline">Export Protected</span>
            </div>
          )}

          {/* Add Contact (All Roles) */}
          <button
            onClick={() => setIsCreateOpen(true)}
            className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold shadow-lg shadow-indigo-600/30 hover:shadow-indigo-600/50 transition-all flex items-center gap-1.5"
          >
            <Plus className="w-4 h-4" />
            Add Contact
          </button>
        </div>
      </div>

      {/* Top 4 KPI Metrics (Scoped to Role) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Metric 1: Total Contacts */}
        <div className="p-5 rounded-2xl bg-slate-900/60 border border-slate-800/80 backdrop-blur-sm relative overflow-hidden group hover:border-slate-700 transition-all">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
              {isAdmin ? 'Company Stakeholders' : isManager ? 'Team Stakeholders' : 'My Stakeholders'}
            </span>
            <div className="w-8 h-8 rounded-lg bg-indigo-500/10 flex items-center justify-center text-indigo-400">
              <Users className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-bold text-white mt-2">
            {isEmployee
              ? contacts.filter((c) => !c.isArchived).length
              : stats?.totalContacts ?? contacts.filter((c) => !c.isArchived).length}
          </div>
          <div className="text-xs text-slate-400 mt-1">
            Active: <span className="text-emerald-400 font-medium">{stats?.activeContacts ?? contacts.filter((c) => !c.isArchived && c.status === 'ACTIVE').length}</span>
          </div>
        </div>

        {/* Metric 2: Decision Makers */}
        <div className="p-5 rounded-2xl bg-slate-900/60 border border-slate-800/80 backdrop-blur-sm relative overflow-hidden group hover:border-slate-700 transition-all">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
              Decision Makers
            </span>
            <div className="w-8 h-8 rounded-lg bg-amber-500/10 flex items-center justify-center text-amber-400">
              <Crown className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-bold text-amber-400 mt-2">
            {isEmployee
              ? contacts.filter((c) => !c.isArchived && isDecisionMaker(c)).length
              : stats?.decisionMakers ?? contacts.filter((c) => !c.isArchived && isDecisionMaker(c)).length}
          </div>
          <div className="text-xs text-slate-400 mt-1">
            Champions: <span className="text-emerald-400 font-medium">{stats?.champions ?? contacts.filter((c) => !c.isArchived && isChampion(c)).length}</span>
          </div>
        </div>

        {/* Metric 3: Primary Account Leads */}
        <div className="p-5 rounded-2xl bg-slate-900/60 border border-slate-800/80 backdrop-blur-sm relative overflow-hidden group hover:border-slate-700 transition-all">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
              Primary Account Leads
            </span>
            <div className="w-8 h-8 rounded-lg bg-purple-500/10 flex items-center justify-center text-purple-400">
              <Sparkles className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-bold text-purple-400 mt-2">
            {isEmployee
              ? contacts.filter((c) => !c.isArchived && isPrimaryLead(c)).length
              : stats?.primaryContacts ?? contacts.filter((c) => !c.isArchived && isPrimaryLead(c)).length}
          </div>
          <div className="text-xs text-slate-400 mt-1">
            Designated primary leads
          </div>
        </div>

        {/* Metric 4: Accounts Covered */}
        <div className="p-5 rounded-2xl bg-slate-900/60 border border-slate-800/80 backdrop-blur-sm relative overflow-hidden group hover:border-slate-700 transition-all">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
              {isAdmin ? 'Company Accounts Covered' : isManager ? 'Team Accounts Covered' : 'Personal Accounts'}
            </span>
            <div className="w-8 h-8 rounded-lg bg-cyan-500/10 flex items-center justify-center text-cyan-400">
              <Building2 className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-bold text-cyan-400 mt-2">
            {isEmployee
              ? new Set(contacts.filter((c) => !c.isArchived).map((c) => c.customerId).filter(Boolean)).size
              : stats?.accountsCovered ?? new Set(contacts.filter((c) => !c.isArchived).map((c) => c.customerId).filter(Boolean)).size}
          </div>
          <div className="text-xs text-slate-400 mt-1">
            Accounts with active stakeholders
          </div>
        </div>
      </div>

      {/* Filter Tabs & Search Bar */}
      <div className="space-y-4">
        {/* Tab Navigation */}
        <div className="flex items-center justify-between border-b border-slate-800 pb-3 flex-wrap gap-3">
          <div className="flex items-center gap-2 overflow-x-auto pb-1">
            {[
              { id: 'ALL', label: isAdmin ? 'All Contacts' : isManager ? 'Department Contacts' : 'Assigned Contacts', icon: Users },
              { id: 'MY', label: 'My Contacts', icon: UserCheck },
              ...(isManager || isAdmin ? [{ id: 'TEAM', label: 'Team Members', icon: Users }] : []),
              { id: 'DECISION_MAKER', label: 'Decision Makers', icon: Crown },
              { id: 'CHAMPION', label: 'Champions', icon: Sparkles },
              { id: 'PRIMARY', label: 'Primary Leads', icon: Building2 },
              ...(isAdmin || isManager ? [{ id: 'ARCHIVED', label: 'Archived / Deleted', icon: Archive }] : []),
            ].map((tab) => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => {
                    setActiveTab(tab.id as any);
                    setCurrentPage(0);
                  }}
                  className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold flex items-center gap-2 transition-all whitespace-nowrap ${
                    isActive
                      ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30'
                      : 'bg-slate-900 text-slate-400 hover:text-slate-200 hover:bg-slate-800'
                  }`}
                >
                  <Icon className="w-3.5 h-3.5" />
                  {tab.label}
                </button>
              );
            })}
          </div>

          {/* View Mode Switcher */}
          <div className="flex items-center bg-slate-900 border border-slate-800 rounded-xl p-1">
            <button
              onClick={() => setViewMode('grid')}
              className={`p-1.5 rounded-lg transition-colors ${
                viewMode === 'grid' ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:text-slate-200'
              }`}
              title="Card Grid View"
            >
              <Grid className="w-4 h-4" />
            </button>
            <button
              onClick={() => setViewMode('table')}
              className={`p-1.5 rounded-lg transition-colors ${
                viewMode === 'table' ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:text-slate-200'
              }`}
              title="Table View"
            >
              <List className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Search & Dropdown Filters */}
        <div className="grid grid-cols-1 sm:grid-cols-5 gap-3">
          {/* Search Box */}
          <div className="relative sm:col-span-2">
            <Search className="w-4 h-4 text-slate-500 absolute left-3.5 top-3" />
            <input
              type="text"
              placeholder="Search by name, email, job title, tag, account..."
              value={searchTerm}
              onChange={(e) => {
                setSearchTerm(e.target.value);
                setCurrentPage(0);
              }}
              className="w-full pl-10 pr-4 py-2 rounded-xl bg-slate-900/80 border border-slate-800 text-slate-200 text-sm focus:outline-none focus:border-indigo-500 transition-colors placeholder:text-slate-500"
            />
          </div>

          {/* Customer Filter */}
          <select
            value={selectedCustomerId || ''}
            onChange={(e) => {
              setSelectedCustomerId(e.target.value ? Number(e.target.value) : undefined);
              setCurrentPage(0);
            }}
            className="px-3.5 py-2 rounded-xl bg-slate-900/80 border border-slate-800 text-slate-300 text-sm focus:outline-none focus:border-indigo-500 transition-colors"
          >
            <option value="">All Accounts</option>
            {customers.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>

          {/* Role Type Filter */}
          <select
            value={selectedType}
            onChange={(e) => {
              setSelectedType(e.target.value as ContactType | '');
              setCurrentPage(0);
            }}
            className="px-3.5 py-2 rounded-xl bg-slate-900/80 border border-slate-800 text-slate-300 text-sm focus:outline-none focus:border-indigo-500 transition-colors"
          >
            <option value="">All Stakeholder Roles</option>
            <option value="DECISION_MAKER">Decision Maker</option>
            <option value="CHAMPION">Champion</option>
            <option value="EXECUTIVE_SPONSOR">Executive Sponsor</option>
            <option value="TECHNICAL_EVALUATOR">Technical Evaluator</option>
            <option value="INFLUENCER">Influencer</option>
            <option value="BILLING_CONTACT">Billing Contact</option>
            <option value="END_USER">End User</option>
            <option value="OTHER">Other</option>
          </select>

          {/* Status Filter */}
          <select
            value={selectedStatus}
            onChange={(e) => {
              setSelectedStatus(e.target.value as ContactStatus | '');
              setCurrentPage(0);
            }}
            className="px-3.5 py-2 rounded-xl bg-slate-900/80 border border-slate-800 text-slate-300 text-sm focus:outline-none focus:border-indigo-500 transition-colors"
          >
            <option value="">All Statuses</option>
            <option value="ACTIVE">Active</option>
            <option value="PROSPECT">Prospect</option>
            <option value="INACTIVE">Inactive</option>
            <option value="FORMER_EMPLOYEE">Former Employee</option>
          </select>
        </div>
      </div>

      {/* Content Area */}
      {loading ? (
        <div className="py-20 flex flex-col items-center justify-center text-slate-400">
          <div className="w-8 h-8 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin mb-3" />
          <p className="text-sm">Loading contacts and stakeholders...</p>
        </div>
      ) : contacts.length === 0 ? (
        <div className="py-16 rounded-2xl bg-slate-900/30 border border-dashed border-slate-800 flex flex-col items-center justify-center text-center p-6">
          <div className="w-14 h-14 rounded-2xl bg-slate-800/60 flex items-center justify-center text-slate-400 mb-3">
            <Users className="w-7 h-7" />
          </div>
          <h3 className="text-base font-semibold text-white">No contacts found</h3>
          <p className="text-xs text-slate-400 max-w-sm mt-1 mb-4">
            {searchTerm || selectedCustomerId || selectedStatus || activeTab !== 'ALL'
              ? 'Try adjusting your search criteria or filter tags.'
              : 'Add your first stakeholder or decision maker to begin organizing company relationships.'}
          </p>
          <button
            onClick={() => setIsCreateOpen(true)}
            className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold rounded-xl transition-colors flex items-center gap-1.5"
          >
            <Plus className="w-4 h-4" />
            Add First Contact
          </button>
        </div>
      ) : viewMode === 'grid' ? (
        /* GRID VIEW */
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {contacts.map((c) => (
            <div
              key={c.id}
              className={`p-5 rounded-2xl border transition-all flex flex-col justify-between group shadow-lg shadow-black/20 ${
                c.isArchived ? 'bg-rose-950/10 border-rose-500/30' : 'bg-slate-900/70 border-slate-800 hover:border-slate-700'
              }`}
            >
              <div>
                {/* Card Top */}
                <div className="flex items-start justify-between gap-2 mb-3">
                  <div className="flex items-center gap-3">
                    <div className={`w-11 h-11 rounded-xl flex items-center justify-center font-bold text-base border ${
                      c.isArchived ? 'bg-rose-500/10 border-rose-500/30 text-rose-400' : 'bg-indigo-600/20 border-indigo-500/20 text-indigo-300'
                    }`}>
                      {c.firstName.charAt(0)}
                      {c.lastName.charAt(0)}
                    </div>
                    <div>
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <span className="font-bold text-white text-sm group-hover:text-indigo-400 transition-colors">
                          {c.fullName}
                        </span>
                        {isPrimaryLead(c) && (
                          <span
                            title="Primary Account Lead"
                            className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-purple-500/15 text-purple-300 border border-purple-500/30 shadow-sm"
                          >
                            <Sparkles className="w-3 h-3 text-purple-400" />
                            Primary Lead
                          </span>
                        )}
                        {c.isArchived && (
                          <span className="px-1.5 py-0.2 rounded text-[10px] font-bold bg-rose-500/20 text-rose-300">
                            ARCHIVED
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-slate-400 line-clamp-1">
                        {c.jobTitle || 'Stakeholder'}
                      </p>
                    </div>
                  </div>

                  {/* Actions Top */}
                  <div className="flex items-center gap-1">
                    {/* View Details (Everyone) */}
                    <button
                      onClick={() => {
                        setSelectedContact(c);
                        setIsDetailsOpen(true);
                      }}
                      className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors"
                      title="View Details"
                    >
                      <Eye className="w-3.5 h-3.5" />
                    </button>

                    {/* Re-link Account */}
                    {!c.isArchived && (
                      <button
                        onClick={() => {
                          setSelectedContact(c);
                          setIsRelinkOpen(true);
                        }}
                        className="p-1.5 text-slate-400 hover:text-cyan-300 hover:bg-cyan-500/10 rounded-lg transition-colors"
                        title="Re-link to another Customer Account"
                      >
                        <Link2 className="w-3.5 h-3.5" />
                      </button>
                    )}

                    {/* Merge Duplicates (Admin Only) */}
                    {!c.isArchived && isAdmin && (
                      <button
                        onClick={() => {
                          setSelectedContact(c);
                          setIsMergeOpen(true);
                        }}
                        className="p-1.5 text-slate-400 hover:text-amber-300 hover:bg-amber-500/10 rounded-lg transition-colors"
                        title="Merge Duplicate into this Contact"
                      >
                        <GitMerge className="w-3.5 h-3.5" />
                      </button>
                    )}

                    {/* Edit Contact (Admin, Manager, or Employee if own) */}
                    {!c.isArchived && canEditContact(c) && (
                      <button
                        onClick={() => {
                          setSelectedContact(c);
                          setIsEditOpen(true);
                        }}
                        className="p-1.5 text-slate-400 hover:text-indigo-300 hover:bg-indigo-500/10 rounded-lg transition-colors"
                        title="Edit Contact & Designate Roles"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>
                    )}

                    {/* Archive (Admin & Manager) */}
                    {!c.isArchived && (isAdmin || isManager) && (
                      <button
                        onClick={() => handleArchive(c.id)}
                        className="p-1.5 text-slate-400 hover:text-amber-400 hover:bg-amber-500/10 rounded-lg transition-colors"
                        title="Archive Contact"
                      >
                        <Archive className="w-3.5 h-3.5" />
                      </button>
                    )}

                    {/* Archived actions (Admin only) */}
                    {c.isArchived && isAdmin && (
                      <>
                        <button
                          onClick={() => handleRestore(c.id)}
                          className="p-1.5 text-emerald-400 hover:text-emerald-300 hover:bg-emerald-500/10 rounded-lg transition-colors"
                          title="Restore Contact"
                        >
                          <RotateCcw className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => handlePermanentDelete(c.id)}
                          className="p-1.5 text-rose-400 hover:text-rose-300 hover:bg-rose-500/10 rounded-lg transition-colors"
                          title="Permanently Delete Contact"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </>
                    )}
                  </div>
                </div>

                {/* Company & Badges */}
                <div className="flex items-center justify-between gap-2 mb-3">
                  <div className="flex items-center gap-1.5 text-xs text-slate-300">
                    <Building2 className="w-3.5 h-3.5 text-slate-500" />
                    <span className="font-medium line-clamp-1">
                      {c.customerName || 'Independent Contact'}
                    </span>
                  </div>
                  <ContactTypeBadge type={c.contactType} />
                </div>

                {/* Tags if any */}
                {c.tags && (
                  <div className="flex flex-wrap gap-1 mb-3">
                    {c.tags
                      .split(',')
                      .map((t) => t.trim())
                      .filter((t) => t && !t.toLowerCase().includes('primary lead') && !t.toLowerCase().includes('primary contact'))
                      .map((t, i) => (
                        <span key={i} className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-indigo-500/10 text-indigo-300 border border-indigo-500/20">
                          {t}
                        </span>
                      ))}
                  </div>
                )}

                {/* Contact Coordinates */}
                <div className="space-y-1.5 pt-3 border-t border-slate-800/80 text-xs">
                  <div className="flex items-center gap-2 text-slate-400">
                    <Mail className="w-3.5 h-3.5 text-slate-500 shrink-0" />
                    <span className="text-slate-300 truncate">{c.email}</span>
                  </div>

                  {(c.phone || c.mobile) && (
                    <div className="flex items-center gap-2 text-slate-400">
                      <Phone className="w-3.5 h-3.5 text-slate-500 shrink-0" />
                      <span className="text-slate-300">{c.phone || c.mobile}</span>
                    </div>
                  )}

                  <div className="flex items-center justify-between pt-1">
                    <ContactStatusBadge status={c.status} />
                    <span className="text-[11px] text-slate-500 truncate max-w-[120px]">
                      {c.assignedToUserName || 'Unassigned'}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        /* TABLE VIEW */
        <div className="rounded-2xl border border-slate-800 bg-slate-900/60 backdrop-blur-sm overflow-hidden shadow-xl shadow-black/20">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-slate-300">
              <thead className="bg-slate-950/60 border-b border-slate-800 text-[11px] font-bold uppercase tracking-wider text-slate-400">
                <tr>
                  <th className="py-3.5 px-4">Stakeholder</th>
                  <th className="py-3.5 px-4">Account</th>
                  <th className="py-3.5 px-4">Role & Tags</th>
                  <th className="py-3.5 px-4">Contact Info</th>
                  <th className="py-3.5 px-4">Status</th>
                  <th className="py-3.5 px-4">Assigned Rep</th>
                  <th className="py-3.5 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {contacts.map((c) => (
                  <tr
                    key={c.id}
                    className={`hover:bg-slate-800/30 transition-colors ${
                      c.isArchived ? 'bg-rose-950/5' : ''
                    }`}
                  >
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-3">
                        <div className={`w-8 h-8 rounded-lg flex items-center justify-center font-bold text-xs border ${
                          c.isArchived ? 'bg-rose-500/10 border-rose-500/30 text-rose-400' : 'bg-indigo-600/15 border-indigo-500/20 text-indigo-300'
                        }`}>
                          {c.firstName.charAt(0)}
                          {c.lastName.charAt(0)}
                        </div>
                        <div>
                          <div className="font-semibold text-white flex items-center gap-1.5 flex-wrap">
                            <span>{c.fullName}</span>
                            {isPrimaryLead(c) && (
                              <span
                                title="Primary Account Lead"
                                className="inline-flex items-center gap-1 px-1.5 py-0.2 rounded text-[10px] font-bold bg-purple-500/15 text-purple-300 border border-purple-500/30 shadow-sm"
                              >
                                <Sparkles className="w-3 h-3 text-purple-400" />
                                Primary Lead
                              </span>
                            )}
                            {c.isArchived && (
                              <span className="px-1.5 py-0.2 rounded text-[10px] font-bold bg-rose-500/20 text-rose-300">
                                ARCHIVED
                              </span>
                            )}
                          </div>
                          <div className="text-xs text-slate-400">{c.jobTitle || 'Stakeholder'}</div>
                        </div>
                      </div>
                    </td>

                    <td className="py-3 px-4">
                      <span className="text-slate-300 font-medium">{c.customerName || '—'}</span>
                    </td>

                    <td className="py-3 px-4">
                      <div className="space-y-1">
                        <ContactTypeBadge type={c.contactType} />
                        {c.tags && (
                          <div className="flex flex-wrap gap-1">
                            {c.tags
                              .split(',')
                              .map((t) => t.trim())
                              .filter((t) => t && !t.toLowerCase().includes('primary lead') && !t.toLowerCase().includes('primary contact'))
                              .map((t, idx) => (
                                <span key={idx} className="text-[10px] px-1.5 py-0.2 rounded bg-indigo-500/10 text-indigo-300 border border-indigo-500/20">
                                  {t}
                                </span>
                              ))}
                          </div>
                        )}
                      </div>
                    </td>

                    <td className="py-3 px-4 text-xs">
                      <div className="text-slate-200">{c.email}</div>
                      <div className="text-slate-400">{c.phone || c.mobile || '—'}</div>
                    </td>

                    <td className="py-3 px-4">
                      <ContactStatusBadge status={c.status} />
                    </td>

                    <td className="py-3 px-4 text-xs text-slate-400">
                      {c.assignedToUserName || '—'}
                    </td>

                    <td className="py-3 px-4 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          onClick={() => {
                            setSelectedContact(c);
                            setIsDetailsOpen(true);
                          }}
                          className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors"
                          title="View Details"
                        >
                          <Eye className="w-4 h-4" />
                        </button>

                        {!c.isArchived && (
                          <button
                            onClick={() => {
                              setSelectedContact(c);
                              setIsRelinkOpen(true);
                            }}
                            className="p-1.5 text-slate-400 hover:text-cyan-300 hover:bg-cyan-500/10 rounded-lg transition-colors"
                            title="Re-link Account"
                          >
                            <Link2 className="w-4 h-4" />
                          </button>
                        )}

                        {!c.isArchived && isAdmin && (
                          <button
                            onClick={() => {
                              setSelectedContact(c);
                              setIsMergeOpen(true);
                            }}
                            className="p-1.5 text-slate-400 hover:text-amber-300 hover:bg-amber-500/10 rounded-lg transition-colors"
                            title="Merge Duplicates"
                          >
                            <GitMerge className="w-4 h-4" />
                          </button>
                        )}

                        {!c.isArchived && canEditContact(c) && (
                          <button
                            onClick={() => {
                              setSelectedContact(c);
                              setIsEditOpen(true);
                            }}
                            className="p-1.5 text-slate-400 hover:text-indigo-300 hover:bg-indigo-500/10 rounded-lg transition-colors"
                            title="Edit Contact"
                          >
                            <Edit2 className="w-4 h-4" />
                          </button>
                        )}

                        {!c.isArchived && (isAdmin || isManager) && (
                          <button
                            onClick={() => handleArchive(c.id)}
                            className="p-1.5 text-slate-400 hover:text-amber-400 hover:bg-amber-500/10 rounded-lg transition-colors"
                            title="Archive Contact"
                          >
                            <Archive className="w-4 h-4" />
                          </button>
                        )}

                        {c.isArchived && isAdmin && (
                          <>
                            <button
                              onClick={() => handleRestore(c.id)}
                              className="p-1.5 text-emerald-400 hover:text-emerald-300 hover:bg-emerald-500/10 rounded-lg transition-colors"
                              title="Restore Contact"
                            >
                              <RotateCcw className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => handlePermanentDelete(c.id)}
                              className="p-1.5 text-rose-400 hover:text-rose-300 hover:bg-rose-500/10 rounded-lg transition-colors"
                              title="Permanently Delete Contact"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between pt-4 border-t border-slate-800 text-xs text-slate-400">
          <div>
            Showing Page {currentPage + 1} of {totalPages} ({totalItems} total contacts)
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setCurrentPage((p) => Math.max(0, p - 1))}
              disabled={currentPage === 0}
              className="px-3 py-1.5 rounded-lg bg-slate-900 border border-slate-800 hover:bg-slate-800 disabled:opacity-50 transition-colors"
            >
              Previous
            </button>
            <button
              onClick={() => setCurrentPage((p) => Math.min(totalPages - 1, p + 1))}
              disabled={currentPage >= totalPages - 1}
              className="px-3 py-1.5 rounded-lg bg-slate-900 border border-slate-800 hover:bg-slate-800 disabled:opacity-50 transition-colors"
            >
              Next
            </button>
          </div>
        </div>
      )}

      {/* Modals */}
      <CreateContactModal
        isOpen={isCreateOpen}
        onClose={() => setIsCreateOpen(false)}
        onSubmit={handleCreate}
        teamMembers={teamMembers}
        customers={customers}
        isEmployee={isEmployee}
        currentUser={user}
        customTags={customTags}
      />

      <EditContactModal
        isOpen={isEditOpen}
        onClose={() => setIsEditOpen(false)}
        onSubmit={handleUpdate}
        contact={selectedContact}
        teamMembers={teamMembers}
        customers={customers}
        isEmployee={isEmployee}
        customTags={customTags}
      />

      <ContactDetailsModal
        isOpen={isDetailsOpen}
        onClose={() => setIsDetailsOpen(false)}
        contact={selectedContact}
        onEdit={(c) => {
          setSelectedContact(c);
          setIsEditOpen(true);
        }}
        onTogglePrimary={handleTogglePrimary}
      />

      <DeleteContactModal
        isOpen={isDeleteOpen}
        onClose={() => setIsDeleteOpen(false)}
        onConfirm={handleArchive}
        contact={selectedContact}
      />

      {isAdmin && (
        <ManageTagsModal
          isOpen={isManageTagsOpen}
          onClose={() => setIsManageTagsOpen(false)}
          tags={customTags}
          onCreateTag={handleCreateTag}
          onDeleteTag={handleDeleteTag}
        />
      )}

      {isAdmin && (
        <MergeContactsModal
          isOpen={isMergeOpen}
          onClose={() => setIsMergeOpen(false)}
          onMerge={handleMerge}
          contacts={contacts}
          primaryContact={selectedContact}
        />
      )}

      <RelinkContactModal
        isOpen={isRelinkOpen}
        onClose={() => setIsRelinkOpen(false)}
        onRelink={handleRelink}
        contact={selectedContact}
        allowedCustomers={customers}
        userRoleLabel={isAdmin ? 'Company-wide' : isManager ? 'Department' : 'Personal'}
      />
    </div>
  );
};
