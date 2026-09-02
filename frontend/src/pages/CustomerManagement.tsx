import React, { useEffect, useState } from 'react';
import { customerApi } from '../api/customerApi';
import { userApi } from '../api/userApi';
import {
  Customer,
  CustomerStatus,
  CustomerTier,
  Industry,
  CustomerStats,
  CreateCustomerRequest,
  UpdateCustomerRequest,
} from '../types/customer';
import { User } from '../types/auth';
import { CustomerStatusBadge } from '../components/customers/CustomerStatusBadge';
import { CustomerTierBadge } from '../components/customers/CustomerTierBadge';
import { CreateCustomerModal } from '../components/customers/CreateCustomerModal';
import { EditCustomerModal } from '../components/customers/EditCustomerModal';
import { CustomerDetailsModal } from '../components/customers/CustomerDetailsModal';
import { DeleteCustomerModal } from '../components/customers/DeleteCustomerModal';
import {
  Building2,
  IndianRupee,
  Crown,
  HeartHandshake,
  Plus,
  Search,
  LayoutGrid,
  List as ListIcon,
  Eye,
  Edit2,
  Trash2,
  RotateCcw,
  Mail,
  Phone,
  Archive,
  UserCheck,
  UserX,
  Users,
  UserPlus,
  ShieldCheck,
  RefreshCw,
} from 'lucide-react';
import { triggerRefreshBlink } from '../components/common/RefreshFeedbackOverlay';

import { useAuth } from '../context/AuthContext';

type ActiveTab = 'all' | 'my' | 'unassigned' | 'team' | 'trash';

export const CustomerManagement: React.FC = () => {
  const { user } = useAuth();
  const isAdmin = user?.role === 'ROLE_ADMIN';
  const isManager = user?.role === 'ROLE_MANAGER';
  const isEmployee = user?.role === 'ROLE_EMPLOYEE';

  const [activeTab, setActiveTab] = useState<ActiveTab>('all');
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [trashCustomers, setTrashCustomers] = useState<Customer[]>([]);
  const [stats, setStats] = useState<CustomerStats | null>(null);
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);

  // Filters & Search
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<CustomerStatus | ''>('');
  const [tierFilter, setTierFilter] = useState<CustomerTier | ''>('');
  const [industryFilter, setIndustryFilter] = useState<Industry | ''>('');
  const [viewMode, setViewMode] = useState<'grid' | 'table'>('grid');

  // Modals state
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isDetailsOpen, setIsDetailsOpen] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [actionSuccessMessage, setActionSuccessMessage] = useState<string | null>(null);

  const showNotification = (msg: string) => {
    setActionSuccessMessage(msg);
    setTimeout(() => setActionSuccessMessage(null), 4000);
  };

  const fetchCustomersAndStats = async () => {
    try {
      setLoading(true);

      const [customersRes, statsRes, usersRes, trashRes] = await Promise.all([
        customerApi.getCustomers({
          search: search || undefined,
          status: statusFilter ? (statusFilter as CustomerStatus) : undefined,
          tier: tierFilter ? (tierFilter as CustomerTier) : undefined,
          industry: industryFilter ? (industryFilter as Industry) : undefined,
          isDeleted: false,
        }),
        customerApi.getStats(),
        isManager ? userApi.getTeamMembers() : (isEmployee && user ? Promise.resolve([user]) : userApi.getAllUsers()),
        isAdmin ? customerApi.getCustomers({ isDeleted: true }) : Promise.resolve({ success: true, data: [] }),
      ]);

      let loadedCustomers = customersRes.success && customersRes.data ? customersRes.data : [];
      let availableAssignees: User[] = [];

      if (isManager && user) {
        const teamMembers = usersRes || [];
        const teamMemberIds = new Set([user.id, ...teamMembers.map((u: User) => u.id)]);

        // Manager can only see: their assigned customers, their department team's customers, and UNASSIGNED customers
        loadedCustomers = loadedCustomers.filter(
          (c) => !c.assignedAccountManagerId || teamMemberIds.has(c.assignedAccountManagerId)
        );
        availableAssignees = [user, ...teamMembers];
      } else if (isEmployee && user) {
        // Employee can only see: their assigned customers and unassigned pool
        loadedCustomers = loadedCustomers.filter(
          (c) => !c.assignedAccountManagerId || c.assignedAccountManagerId === user.id
        );
        availableAssignees = [user];
      } else {
        availableAssignees = usersRes || [];
      }

      setCustomers(loadedCustomers);
      setUsers(availableAssignees);

      if (isAdmin && trashRes.success && trashRes.data) {
        setTrashCustomers(trashRes.data);
      }

      // Scoped KPI calculation for Manager / Employee
      if (isManager || isEmployee) {
        const totalCustomers = loadedCustomers.length;
        const activeCustomers = loadedCustomers.filter(c => c.customerStatus === 'ACTIVE').length;
        const onboardingCustomers = loadedCustomers.filter(c => c.customerStatus === 'ONBOARDING').length;
        const atRiskCustomers = loadedCustomers.filter(c => c.customerStatus === 'AT_RISK').length;
        const churnedCustomers = loadedCustomers.filter(c => c.customerStatus === 'CHURNED').length;
        const totalAnnualRevenue = loadedCustomers.reduce((sum, c) => sum + (c.annualRevenue || 0), 0);
        const activeAnnualRevenue = loadedCustomers
          .filter(c => c.customerStatus === 'ACTIVE')
          .reduce((sum, c) => sum + (c.annualRevenue || 0), 0);
        const retentionRate = totalCustomers > 0 ? Number((((totalCustomers - churnedCustomers) / totalCustomers) * 100).toFixed(1)) : 100;

        setStats({
          totalCustomers,
          activeCustomers,
          onboardingCustomers,
          atRiskCustomers,
          churnedCustomers,
          trashCustomersCount: 0,
          totalAnnualRevenue,
          activeAnnualRevenue,
          retentionRate,
          customersByTier: {} as any,
          customersByIndustry: {} as any,
          customersByStatus: {} as any,
        });
      } else if (statsRes.success && statsRes.data) {
        setStats(statsRes.data);
      }
    } catch (err) {
      console.error('Failed to load customers data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCustomersAndStats();
  }, [search, statusFilter, tierFilter, industryFilter]);

  // Tab Filtering
  const getDisplayCustomers = (): Customer[] => {
    if (activeTab === 'trash') {
      return trashCustomers;
    }
    if (activeTab === 'my') {
      return customers.filter((c) => c.assignedAccountManagerId === user?.id);
    }
    if (activeTab === 'unassigned') {
      return customers.filter((c) => !c.assignedAccountManagerId);
    }
    if (activeTab === 'team') {
      return customers.filter((c) => c.assignedAccountManagerId && c.assignedAccountManagerId !== user?.id);
    }
    return customers;
  };

  const displayedCustomers = getDisplayCustomers();

  // Handlers
  const handleCreateCustomer = async (data: CreateCustomerRequest) => {
    const res = await customerApi.createCustomer(data);
    if (res.success) {
      showNotification('Customer account created successfully.');
      fetchCustomersAndStats();
    }
  };

  const handleUpdateCustomer = async (id: number, data: UpdateCustomerRequest) => {
    const res = await customerApi.updateCustomer(id, data);
    if (res.success) {
      showNotification('Customer details updated successfully.');
      fetchCustomersAndStats();
    }
  };

  const handleStatusChange = async (id: number, newStatus: CustomerStatus) => {
    try {
      const res = await customerApi.updateCustomerStatus(id, newStatus);
      if (res.success) {
        showNotification(`Status updated to ${newStatus}.`);
        fetchCustomersAndStats();
        if (selectedCustomer && selectedCustomer.id === id) {
          setSelectedCustomer(res.data || null);
        }
      }
    } catch (err) {
      console.error('Failed to update status:', err);
    }
  };

  const handleDeleteConfirm = async (permanent: boolean, reason?: string) => {
    if (!selectedCustomer) return;
    try {
      setDeleteLoading(true);
      if (permanent && isAdmin) {
        const res = await customerApi.permanentlyDeleteCustomer(selectedCustomer.id);
        if (res.success) {
          showNotification('Customer account permanently deleted.');
        }
      } else {
        const res = await customerApi.deleteCustomer(selectedCustomer.id, reason);
        if (res.success) {
          showNotification(isManager ? 'Customer deletion requested and moved to archive.' : 'Customer moved to trash.');
        }
      }
      setIsDeleteOpen(false);
      setSelectedCustomer(null);
      fetchCustomersAndStats();
    } catch (err) {
      console.error('Failed to delete customer:', err);
    } finally {
      setDeleteLoading(false);
    }
  };

  const handleRestoreCustomer = async (customer: Customer) => {
    if (!isAdmin) return;
    try {
      setLoading(true);
      const res = await customerApi.restoreCustomer(customer.id);
      if (res.success) {
        showNotification(`Restored customer "${customer.name}" to active list.`);
        fetchCustomersAndStats();
      }
    } catch (err) {
      console.error('Failed to restore customer:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleClaimCustomer = async (customer: Customer) => {
    if (!user) return;
    try {
      setLoading(true);
      const res = await customerApi.assignAccountManager(customer.id, user.id, user.name);
      if (res.success) {
        showNotification(`Account "${customer.name}" claimed and assigned to ${user.name}!`);
        fetchCustomersAndStats();
      }
    } catch (err: any) {
      console.error('Failed to claim customer:', err);
    } finally {
      setLoading(false);
    }
  };

  const handlePermanentDeletePrompt = (customer: Customer) => {
    setSelectedCustomer(customer);
    setIsDeleteOpen(true);
  };

  // Helper check: Can current user edit this specific customer?
  const canEditCustomer = (customer: Customer): boolean => {
    if (isAdmin) return true;
    if (isManager) return true; // Manager can edit team/department & unassigned
    if (isEmployee) {
      // Employee can edit assigned customers OR unassigned customers to claim/configure them
      return !customer.assignedAccountManagerId || customer.assignedAccountManagerId === user?.id;
    }
    return false;
  };

  // Helper check: Can current user delete this specific customer?
  const canDeleteCustomer = (): boolean => {
    return isAdmin || isManager; // Employees: ❌ No delete
  };

  const formatCurrency = (val?: number) => {
    return '₹' + (val || 0).toLocaleString('en-IN', { maximumFractionDigits: 0 });
  };

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Toast Alert */}
      {actionSuccessMessage && (
        <div className="fixed top-20 right-6 z-50 p-4 bg-emerald-500/10 border border-emerald-500/30 rounded-2xl text-emerald-300 text-sm font-semibold shadow-2xl backdrop-blur-md flex items-center gap-2 animate-scale-up">
          <ShieldCheck className="w-5 h-5 text-emerald-400" />
          <span>{actionSuccessMessage}</span>
        </div>
      )}

      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2">
            <h1 className="text-2xl font-bold text-slate-100">Customer Accounts</h1>
            <span className="px-2.5 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 text-xs font-semibold">
              RBAC Enabled
            </span>
          </div>
          <p className="text-sm text-slate-400 mt-1">
            {isAdmin
              ? 'Admin Master View: Manage all client accounts, ARR revenue, assignment, and restore capabilities.'
              : isManager
              ? 'Manager View: Manage department client accounts, assignments, and deletion requests.'
              : 'Employee View: Manage your assigned customer accounts and client relationships.'}
          </p>
        </div>

        <div className="flex items-center space-x-3">
          {/* View toggle */}
          <div className="flex items-center bg-slate-900 border border-slate-800 rounded-xl p-1">
            <button
              onClick={() => setViewMode('grid')}
              className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
                viewMode === 'grid'
                  ? 'bg-indigo-600 text-white shadow'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <LayoutGrid className="w-3.5 h-3.5" />
              <span>Cards</span>
            </button>
            <button
              onClick={() => setViewMode('table')}
              className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
                viewMode === 'table'
                  ? 'bg-indigo-600 text-white shadow'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <ListIcon className="w-3.5 h-3.5" />
              <span>Table</span>
            </button>
          </div>

          <button
            onClick={() => {
              fetchCustomersAndStats();
              triggerRefreshBlink('Customers refreshed');
            }}
            disabled={loading}
            title="Refresh Customers"
            className="flex items-center space-x-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold text-slate-300 bg-slate-900 hover:bg-slate-800 border border-slate-700 transition disabled:opacity-50"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin text-indigo-400' : ''}`} />
            <span className="hidden sm:inline">Refresh</span>
          </button>

          <button
            onClick={() => setIsCreateOpen(true)}
            className="flex items-center space-x-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-semibold rounded-xl shadow-lg shadow-indigo-600/20 transition-all hover:shadow-indigo-600/40"
          >
            <Plus className="w-4 h-4" />
            <span>Add Customer</span>
          </button>
        </div>
      </div>

      {/* KPI Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-slate-900 border border-slate-800 p-5 rounded-2xl relative overflow-hidden group hover:border-slate-700 transition-all">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
              Active Accounts
            </span>
            <div className="w-9 h-9 rounded-xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-blue-400">
              <Building2 className="w-5 h-5" />
            </div>
          </div>
          <div className="text-2xl font-bold text-slate-100 mt-2">
            {stats?.activeCustomers ?? (loading ? '...' : 0)}
          </div>
          <div className="text-xs text-blue-400 mt-1 flex items-center space-x-1">
            <span>{stats?.totalCustomers ?? 0} active client accounts</span>
          </div>
        </div>

        <div className="bg-slate-900 border border-slate-800 p-5 rounded-2xl relative overflow-hidden group hover:border-slate-700 transition-all">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
              Total Annual ARR
            </span>
            <div className="w-9 h-9 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
              <IndianRupee className="w-5 h-5" />
            </div>
          </div>
          <div className="text-2xl font-bold text-emerald-400 mt-2">
            {formatCurrency(stats?.totalAnnualRevenue)}
          </div>
          <div className="text-xs text-emerald-400/80 mt-1">
            {formatCurrency(stats?.activeAnnualRevenue)} active contract value
          </div>
        </div>

        <div className="bg-slate-900 border border-slate-800 p-5 rounded-2xl relative overflow-hidden group hover:border-slate-700 transition-all">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
              Enterprise Clients
            </span>
            <div className="w-9 h-9 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400">
              <Crown className="w-5 h-5" />
            </div>
          </div>
          <div className="text-2xl font-bold text-amber-400 mt-2">
            {stats?.customersByTier?.TIER_1_ENTERPRISE ?? 0}
          </div>
          <div className="text-xs text-slate-400 mt-1">
            Tier 1 strategic contracts
          </div>
        </div>

        <div className="bg-slate-900 border border-slate-800 p-5 rounded-2xl relative overflow-hidden group hover:border-slate-700 transition-all">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
              Client Retention
            </span>
            <div className="w-9 h-9 rounded-xl bg-teal-500/10 border border-teal-500/20 flex items-center justify-center text-teal-400">
              <HeartHandshake className="w-5 h-5" />
            </div>
          </div>
          <div className="text-2xl font-bold text-teal-400 mt-2">
            {stats?.retentionRate ?? 100}%
          </div>
          <div className="text-xs text-teal-400/80 mt-1">
            {stats?.churnedCustomers ?? 0} churned accounts
          </div>
        </div>
      </div>

      {/* Tabs Navigation */}
      <div className="flex items-center space-x-2 border-b border-slate-800 pb-2 overflow-x-auto">
        <button
          onClick={() => setActiveTab('all')}
          className={`flex items-center space-x-2 px-4 py-2 rounded-xl text-xs font-semibold transition-all ${
            activeTab === 'all'
              ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/20'
              : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
          }`}
        >
          <Building2 className="w-3.5 h-3.5" />
          <span>{isAdmin ? 'All Customers' : isManager ? 'Department Accounts' : 'My Visible Accounts'}</span>
          <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-slate-950/60 text-slate-300">
            {customers.length}
          </span>
        </button>

        <button
          onClick={() => setActiveTab('my')}
          className={`flex items-center space-x-2 px-4 py-2 rounded-xl text-xs font-semibold transition-all ${
            activeTab === 'my'
              ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/20'
              : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
          }`}
        >
          <UserCheck className="w-3.5 h-3.5" />
          <span>My Assigned Accounts</span>
          <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-slate-950/60 text-slate-300">
            {customers.filter((c) => c.assignedAccountManagerId === user?.id).length}
          </span>
        </button>

        <button
          onClick={() => setActiveTab('unassigned')}
          className={`flex items-center space-x-2 px-4 py-2 rounded-xl text-xs font-semibold transition-all ${
            activeTab === 'unassigned'
              ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/20'
              : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
          }`}
        >
          <UserX className="w-3.5 h-3.5" />
          <span>Unassigned Pool</span>
          <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-slate-950/60 text-slate-300">
            {customers.filter((c) => !c.assignedAccountManagerId).length}
          </span>
        </button>

        {(isAdmin || isManager) && (
          <button
            onClick={() => setActiveTab('team')}
            className={`flex items-center space-x-2 px-4 py-2 rounded-xl text-xs font-semibold transition-all ${
              activeTab === 'team'
                ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/20'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
            }`}
          >
            <Users className="w-3.5 h-3.5" />
            <span>Team Members' Accounts</span>
            <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-slate-950/60 text-slate-300">
              {customers.filter((c) => c.assignedAccountManagerId && c.assignedAccountManagerId !== user?.id).length}
            </span>
          </button>
        )}

        {isAdmin && (
          <button
            onClick={() => setActiveTab('trash')}
            className={`flex items-center space-x-2 px-4 py-2 rounded-xl text-xs font-semibold transition-all ${
              activeTab === 'trash'
                ? 'bg-rose-600 text-white shadow-lg shadow-rose-600/20'
                : 'text-rose-400/80 hover:text-rose-300 hover:bg-slate-900'
            }`}
          >
            <Archive className="w-3.5 h-3.5" />
            <span>Trash / Soft-Deleted</span>
            <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-slate-950/60 text-rose-300">
              {trashCustomers.length}
            </span>
          </button>
        )}
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-slate-900 border border-slate-800 p-4 rounded-2xl flex flex-col md:flex-row gap-3 items-center justify-between">
        <div className="relative w-full md:w-80">
          <Search className="w-4 h-4 text-slate-500 absolute left-3 top-3" />
          <input
            type="text"
            placeholder="Search accounts by name, email, company..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2 bg-slate-950 border border-slate-800 rounded-xl text-slate-200 text-sm focus:outline-none focus:border-indigo-500 transition-colors"
          />
        </div>

        <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
          <div className="relative flex-1 md:flex-initial">
            <select
              value={tierFilter}
              onChange={(e) => setTierFilter(e.target.value as CustomerTier | '')}
              className="w-full md:w-40 px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-slate-200 text-sm focus:outline-none focus:border-indigo-500"
            >
              <option value="">All Tiers</option>
              <option value="TIER_1_ENTERPRISE">Tier 1 - Enterprise</option>
              <option value="STRATEGIC">Strategic</option>
              <option value="TIER_2_MID_MARKET">Tier 2 - Mid Market</option>
              <option value="TIER_3_SMB">Tier 3 - SMB</option>
            </select>
          </div>

          <div className="relative flex-1 md:flex-initial">
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as CustomerStatus | '')}
              className="w-full md:w-36 px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-slate-200 text-sm focus:outline-none focus:border-indigo-500"
            >
              <option value="">All Health</option>
              <option value="ACTIVE">Active</option>
              <option value="ONBOARDING">Onboarding</option>
              <option value="AT_RISK">At Risk</option>
              <option value="INACTIVE">Inactive</option>
              <option value="CHURNED">Churned</option>
            </select>
          </div>

          <div className="relative flex-1 md:flex-initial">
            <select
              value={industryFilter}
              onChange={(e) => setIndustryFilter(e.target.value as Industry | '')}
              className="w-full md:w-40 px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-slate-200 text-sm focus:outline-none focus:border-indigo-500"
            >
              <option value="">All Industries</option>
              <option value="TECHNOLOGY">Technology</option>
              <option value="FINANCE">Financial Services</option>
              <option value="HEALTHCARE">Healthcare</option>
              <option value="MANUFACTURING">Manufacturing</option>
              <option value="RETAIL">Retail & E-Commerce</option>
              <option value="EDUCATION">Education</option>
              <option value="SERVICES">Services</option>
              <option value="OTHER">Other</option>
            </select>
          </div>
        </div>
      </div>

      {/* Main View: Grid vs Table */}
      {viewMode === 'grid' ? (
        /* CARD GRID VIEW */
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {displayedCustomers.length === 0 ? (
            <div className="col-span-full py-16 text-center text-slate-500 bg-slate-900 border border-slate-800 rounded-2xl">
              {activeTab === 'trash'
                ? 'Trash pool is clean. No soft-deleted customer accounts found.'
                : 'No customer accounts match your search/filter criteria.'}
            </div>
          ) : (
            displayedCustomers.map((cust) => (
              <div
                key={cust.id}
                className={`bg-slate-900 border rounded-2xl p-5 shadow-xl transition-all flex flex-col justify-between group ${
                  cust.isDeleted
                    ? 'border-rose-500/30 bg-rose-950/10'
                    : 'border-slate-800 hover:border-indigo-500/50 hover:shadow-indigo-500/10'
                }`}
              >
                <div>
                  {/* Card Header */}
                  <div className="flex items-start justify-between">
                    <div className="flex items-start space-x-3">
                      <div
                        className={`w-10 h-10 rounded-xl flex items-center justify-center font-bold text-base border ${
                          cust.isDeleted
                            ? 'bg-rose-500/10 border-rose-500/30 text-rose-400'
                            : 'bg-indigo-600/15 border-indigo-500/25 text-indigo-400'
                        }`}
                      >
                        <Building2 className="w-5 h-5" />
                      </div>
                      <div>
                        <h3 className="text-base font-bold text-slate-100 group-hover:text-indigo-400 transition-colors">
                          {cust.name}
                        </h3>
                        <p className="text-xs text-slate-400 truncate max-w-[170px]">
                          {cust.company || cust.contactPerson || 'Direct Client'}
                        </p>
                      </div>
                    </div>
                    {cust.isDeleted ? (
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-500/20 text-rose-300 border border-rose-500/30">
                        DELETED
                      </span>
                    ) : (
                      <CustomerStatusBadge status={cust.customerStatus} />
                    )}
                  </div>

                  {/* Tier, Industry & Conversion Badges */}
                  <div className="flex flex-wrap items-center gap-1.5 mt-4">
                    <CustomerTierBadge tier={cust.customerTier} />
                    <span className="text-[11px] px-2 py-0.5 rounded-md bg-slate-950 text-slate-400 border border-slate-800 truncate max-w-[140px]">
                      {cust.industryDisplayName}
                    </span>
                    {cust.convertedFromLeadId && (
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-teal-500/15 text-teal-300 border border-teal-500/30 flex items-center gap-1">
                        ⚡ Converted Lead #{cust.convertedFromLeadId}
                      </span>
                    )}
                  </div>

                  {/* Account Manager Badge */}
                  <div className="mt-2 text-xs text-slate-400">
                    <span className="text-[11px] text-slate-500">Manager: </span>
                    <strong className="text-slate-300">
                      {cust.assignedAccountManagerName || 'Unassigned Pool'}
                    </strong>
                  </div>

                  {/* Contact Info */}
                  <div className="mt-4 space-y-1.5 text-xs text-slate-400 border-t border-slate-800/80 pt-3">
                    <div className="flex items-center space-x-2">
                      <Mail className="w-3.5 h-3.5 text-slate-500" />
                      <span className="truncate">{cust.email}</span>
                    </div>
                    {cust.phone && (
                      <div className="flex items-center space-x-2">
                        <Phone className="w-3.5 h-3.5 text-slate-500" />
                        <span>{cust.phone}</span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Footer with ARR and Actions */}
                <div className="mt-5 pt-3 border-t border-slate-800 flex items-center justify-between">
                  <div>
                    <span className="text-[10px] text-slate-500 uppercase tracking-wider block font-semibold">
                      Annual ARR
                    </span>
                    <span className="text-sm font-bold text-emerald-400">
                      {formatCurrency(cust.annualRevenue)}
                    </span>
                  </div>

                  <div className="flex items-center space-x-1.5">
                    {/* View Button */}
                    <button
                      onClick={() => {
                        setSelectedCustomer(cust);
                        setIsDetailsOpen(true);
                      }}
                      className="p-1.5 text-slate-400 hover:text-indigo-400 rounded-lg hover:bg-slate-800 transition-colors"
                      title="View Customer Profile"
                    >
                      <Eye className="w-4 h-4" />
                    </button>

                    {/* Active Customer Actions */}
                    {!cust.isDeleted && (
                      <>
                        {/* Unassigned quick claim / assign button for ANY role */}
                        {!cust.assignedAccountManagerId && (
                          <button
                            onClick={() => handleClaimCustomer(cust)}
                            className="px-2 py-1 bg-teal-500/10 hover:bg-teal-500/20 text-teal-300 border border-teal-500/30 rounded-lg transition-colors flex items-center gap-1 text-xs font-semibold"
                            title={isEmployee ? 'Claim this unassigned account to yourself' : 'Claim / Assign this account'}
                          >
                            <UserPlus className="w-3.5 h-3.5 text-teal-400" />
                            <span>{isEmployee ? 'Claim' : 'Assign'}</span>
                          </button>
                        )}

                        {/* Edit Button: Admin, Manager, or Employee if assigned or unassigned */}
                        {canEditCustomer(cust) && (
                          <button
                            onClick={() => {
                              setSelectedCustomer(cust);
                              setIsEditOpen(true);
                            }}
                            className="p-1.5 text-slate-400 hover:text-amber-400 rounded-lg hover:bg-slate-800 transition-colors"
                            title="Edit Customer"
                          >
                            <Edit2 className="w-4 h-4" />
                          </button>
                        )}

                        {/* Delete Button: Admin & Manager only (Hidden for Employee ❌) */}
                        {canDeleteCustomer() && (
                          <button
                            onClick={() => {
                              setSelectedCustomer(cust);
                              setIsDeleteOpen(true);
                            }}
                            className={`p-1.5 rounded-lg hover:bg-slate-800 transition-colors ${
                              isManager ? 'text-amber-400/80 hover:text-amber-300' : 'text-slate-400 hover:text-rose-400'
                            }`}
                            title={isManager ? 'Request Deletion / Soft Delete' : 'Delete Customer'}
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        )}
                      </>
                    )}

                    {/* Trash Pool Actions: Admin Only */}
                    {cust.isDeleted && isAdmin && (
                      <>
                        <button
                          onClick={() => handleRestoreCustomer(cust)}
                          className="p-1.5 text-emerald-400 hover:text-emerald-300 rounded-lg hover:bg-emerald-500/10 transition-colors"
                          title="Restore Customer Account"
                        >
                          <RotateCcw className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handlePermanentDeletePrompt(cust)}
                          className="p-1.5 text-rose-400 hover:text-rose-300 rounded-lg hover:bg-rose-500/10 transition-colors"
                          title="Permanently Delete Account"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </>
                    )}
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      ) : (
        /* TABLE VIEW */
        <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-800 bg-slate-900/80 text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                  <th className="px-6 py-4">Customer / Account</th>
                  <th className="px-6 py-4">Tier</th>
                  <th className="px-6 py-4">Health Status</th>
                  <th className="px-6 py-4">Annual ARR</th>
                  <th className="px-6 py-4">Industry</th>
                  <th className="px-6 py-4">Account Manager</th>
                  <th className="px-6 py-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 text-sm">
                {displayedCustomers.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="px-6 py-12 text-center text-slate-500 text-sm">
                      {activeTab === 'trash'
                        ? 'Trash pool is clean. No soft-deleted customer accounts found.'
                        : 'No customer accounts match your filter criteria.'}
                    </td>
                  </tr>
                ) : (
                  displayedCustomers.map((cust) => (
                    <tr
                      key={cust.id}
                      className={`hover:bg-slate-800/30 transition-colors ${
                        cust.isDeleted ? 'bg-rose-950/10' : ''
                      }`}
                    >
                      <td className="px-6 py-4">
                        <div className="flex items-center space-x-3">
                          <div
                            className={`w-9 h-9 rounded-xl flex items-center justify-center font-bold text-xs border ${
                              cust.isDeleted
                                ? 'bg-rose-500/10 border-rose-500/30 text-rose-400'
                                : 'bg-indigo-600/10 border-indigo-500/20 text-indigo-400'
                            }`}
                          >
                            {cust.name[0]}
                          </div>
                          <div>
                            <div className="font-semibold text-slate-100 flex items-center gap-2">
                              <span>{cust.name}</span>
                              {cust.convertedFromLeadId && (
                                <span className="px-1.5 py-0.2 rounded text-[10px] font-bold bg-teal-500/15 text-teal-300 border border-teal-500/30">
                                  ⚡ Lead #{cust.convertedFromLeadId}
                                </span>
                              )}
                              {cust.isDeleted && (
                                <span className="px-1.5 py-0.2 rounded text-[10px] font-bold bg-rose-500/20 text-rose-300">
                                  DELETED
                                </span>
                              )}
                            </div>
                            <div className="text-xs text-slate-400">{cust.email}</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <CustomerTierBadge tier={cust.customerTier} />
                      </td>
                      <td className="px-6 py-4">
                        {cust.isDeleted ? (
                          <span className="text-xs font-bold text-rose-400">Soft Deleted</span>
                        ) : (
                          <CustomerStatusBadge status={cust.customerStatus} />
                        )}
                      </td>
                      <td className="px-6 py-4 font-semibold text-emerald-400">
                        {formatCurrency(cust.annualRevenue)}
                      </td>
                      <td className="px-6 py-4 text-xs text-slate-300">
                        {cust.industryDisplayName}
                      </td>
                      <td className="px-6 py-4 text-xs text-slate-300">
                        {cust.assignedAccountManagerName || <span className="text-slate-500">Unassigned</span>}
                      </td>
                      <td className="px-6 py-4 text-right">
                        <div className="flex items-center justify-end space-x-2">
                          <button
                            onClick={() => {
                              setSelectedCustomer(cust);
                              setIsDetailsOpen(true);
                            }}
                            title="View Customer Profile"
                            className="p-1.5 text-slate-400 hover:text-indigo-400 rounded-lg hover:bg-slate-800 transition-colors"
                          >
                            <Eye className="w-4 h-4" />
                          </button>

                          {!cust.isDeleted && (
                            <>
                              {/* Unassigned quick claim / assign button for ANY role */}
                              {!cust.assignedAccountManagerId && (
                                <button
                                  onClick={() => handleClaimCustomer(cust)}
                                  className="px-2 py-1 bg-teal-500/10 hover:bg-teal-500/20 text-teal-300 border border-teal-500/30 rounded-lg transition-colors flex items-center gap-1 text-xs font-semibold"
                                  title={isEmployee ? 'Claim this unassigned account to yourself' : 'Claim / Assign this account'}
                                >
                                  <UserPlus className="w-3.5 h-3.5 text-teal-400" />
                                  <span className="hidden sm:inline">{isEmployee ? 'Claim' : 'Assign'}</span>
                                </button>
                              )}

                              {canEditCustomer(cust) && (
                                <button
                                  onClick={() => {
                                    setSelectedCustomer(cust);
                                    setIsEditOpen(true);
                                  }}
                                  title="Edit Customer"
                                  className="p-1.5 text-slate-400 hover:text-amber-400 rounded-lg hover:bg-slate-800 transition-colors"
                                >
                                  <Edit2 className="w-4 h-4" />
                                </button>
                              )}

                              {canDeleteCustomer() && (
                                <button
                                  onClick={() => {
                                    setSelectedCustomer(cust);
                                    setIsDeleteOpen(true);
                                  }}
                                  title={isManager ? 'Request Deletion / Soft Delete' : 'Delete Customer'}
                                  className={`p-1.5 rounded-lg hover:bg-slate-800 transition-colors ${
                                    isManager ? 'text-amber-400/80 hover:text-amber-300' : 'text-slate-400 hover:text-rose-400'
                                  }`}
                                >
                                  <Trash2 className="w-4 h-4" />
                                </button>
                              )}
                            </>
                          )}

                          {cust.isDeleted && isAdmin && (
                            <>
                              <button
                                onClick={() => handleRestoreCustomer(cust)}
                                className="p-1.5 text-emerald-400 hover:text-emerald-300 rounded-lg hover:bg-emerald-500/10 transition-colors"
                                title="Restore Customer"
                              >
                                <RotateCcw className="w-4 h-4" />
                              </button>
                              <button
                                onClick={() => handlePermanentDeletePrompt(cust)}
                                className="p-1.5 text-rose-400 hover:text-rose-300 rounded-lg hover:bg-rose-500/10 transition-colors"
                                title="Permanently Delete"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Modals */}
      <CreateCustomerModal
        isOpen={isCreateOpen}
        onClose={() => setIsCreateOpen(false)}
        onSubmit={handleCreateCustomer}
        users={users}
      />

      <EditCustomerModal
        isOpen={isEditOpen}
        onClose={() => {
          setIsEditOpen(false);
          setSelectedCustomer(null);
        }}
        onSubmit={handleUpdateCustomer}
        customer={selectedCustomer}
        users={users}
      />

      <CustomerDetailsModal
        isOpen={isDetailsOpen}
        onClose={() => {
          setIsDetailsOpen(false);
          setSelectedCustomer(null);
        }}
        customer={selectedCustomer}
        onStatusChange={handleStatusChange}
        onEdit={(customer: Customer) => {
          setSelectedCustomer(customer);
          setIsEditOpen(true);
        }}
      />

      <DeleteCustomerModal
        isOpen={isDeleteOpen}
        onClose={() => {
          setIsDeleteOpen(false);
          setSelectedCustomer(null);
        }}
        onConfirm={handleDeleteConfirm}
        customer={selectedCustomer}
        loading={deleteLoading}
      />
    </div>
  );
};
