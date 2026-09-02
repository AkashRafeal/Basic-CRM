import React, { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { userApi } from '../api/userApi';
import { User, Role } from '../types/auth';
import { RoleBadge } from '../components/RoleBadge';
import { CreateUserModal } from '../components/users/CreateUserModal';
import { EditUserModal } from '../components/users/EditUserModal';
import { ResetPasswordModal } from '../components/users/ResetPasswordModal';
import { DeleteUserModal } from '../components/users/DeleteUserModal';
import { DepartmentHierarchyView } from '../components/users/DepartmentHierarchyView';
import { CreateDepartmentModal } from '../components/users/CreateDepartmentModal';
import { 
  Search, 
  RefreshCw, 
  Check, 
  AlertCircle, 
  Building, 
  Phone,
  Power,
  UserPlus,
  Edit2,
  KeyRound,
  Trash2,
  Users,
  GitFork,
  UserCheck,
  AlertTriangle
} from 'lucide-react';
import { triggerRefreshBlink } from '../components/common/RefreshFeedbackOverlay';

export const UserManagement: React.FC = () => {
  const { user: currentUser, isAdmin } = useAuth();
  const [users, setUsers] = useState<User[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState<string>('ALL');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [viewTab, setViewTab] = useState<'directory' | 'hierarchy'>('directory');
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // Modals state
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isCreateDeptOpen, setIsCreateDeptOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [passwordResetUser, setPasswordResetUser] = useState<User | null>(null);
  const [deletingUser, setDeletingUser] = useState<User | null>(null);

  const fetchUsers = async () => {
    setIsLoading(true);
    setError(null);
    try {
      let data: User[];
      if (isAdmin) {
        data = await userApi.getAllUsers();
      } else {
        const team = await userApi.getTeamMembers();
        data = team.filter((u) => u.role === 'ROLE_EMPLOYEE');
      }
      setUsers(data);
    } catch (err: any) {
      console.error(err);
      setError(
        err.response?.data?.message ||
        'Failed to fetch user directory. Ensure you have the appropriate permissions.'
      );
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const handleRoleChange = async (userId: number, newRole: Role) => {
    if (!isAdmin) {
      setError('Only Administrators can modify user roles.');
      return;
    }

    try {
      const updated = await userApi.updateUserRole(userId, newRole);
      setUsers((prev) => prev.map((u) => (u.id === userId ? updated : u)));
      setSuccessMsg(`User ${updated.name}'s role updated to ${newRole.replace('ROLE_', '')}`);
      setTimeout(() => setSuccessMsg(null), 3000);
    } catch (err: any) {
      console.error(err);
      setError(err.response?.data?.message || 'Failed to update user role.');
    }
  };

  const handleToggleStatus = async (userId: number) => {
    if (!isAdmin) {
      setError('Only Administrators can toggle user active status.');
      return;
    }

    try {
      const updated = await userApi.toggleUserStatus(userId);
      setUsers((prev) => prev.map((u) => (u.id === userId ? updated : u)));
      setSuccessMsg(`User ${updated.name} is now ${updated.active ? 'Active' : 'Disabled'}`);
      setTimeout(() => setSuccessMsg(null), 3000);
    } catch (err: any) {
      console.error(err);
      setError(err.response?.data?.message || 'Failed to toggle user status.');
    }
  };

  const handleUserCreated = (newUser: User) => {
    setUsers((prev) => [newUser, ...prev]);
    setSuccessMsg(`New user "${newUser.name}" created successfully.`);
    setTimeout(() => setSuccessMsg(null), 3000);
  };

  const handleUserUpdated = (updatedUser: User) => {
    setUsers((prev) => prev.map((u) => (u.id === updatedUser.id ? updatedUser : u)));
    setSuccessMsg(`User "${updatedUser.name}" details updated.`);
    setTimeout(() => setSuccessMsg(null), 3000);
  };

  const handleUserDeleted = (deletedId: number) => {
    setUsers((prev) => prev.filter((u) => u.id !== deletedId));
    setSuccessMsg('User deleted permanently.');
    setTimeout(() => setSuccessMsg(null), 3000);
  };

  const ROLE_HIERARCHY_RANK: Record<string, number> = {
    ROLE_ADMIN: 1,
    ROLE_MANAGER: 2,
    ROLE_EMPLOYEE: 3,
  };

  const filteredUsers = users
    .filter((u) => {
      const matchesSearch =
        u.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        u.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (u.department && u.department.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (u.managerName && u.managerName.toLowerCase().includes(searchTerm.toLowerCase()));

      const matchesRole = roleFilter === 'ALL' || u.role === roleFilter;
      const matchesStatus =
        statusFilter === 'ALL' ||
        (statusFilter === 'ACTIVE' && u.active) ||
        (statusFilter === 'DISABLED' && !u.active);

      return matchesSearch && matchesRole && matchesStatus;
    })
    .sort((a, b) => {
      // 1. Hierarchy rank: Admin (1) -> Manager (2) -> Employee (3)
      const rankA = ROLE_HIERARCHY_RANK[a.role] || 99;
      const rankB = ROLE_HIERARCHY_RANK[b.role] || 99;
      if (rankA !== rankB) {
        return rankA - rankB;
      }
      // 2. Department grouping
      const deptA = a.department || '';
      const deptB = b.department || '';
      const deptCompare = deptA.localeCompare(deptB);
      if (deptCompare !== 0) return deptCompare;

      // 3. Manager grouping
      const mgrA = a.managerName || '';
      const mgrB = b.managerName || '';
      const mgrCompare = mgrA.localeCompare(mgrB);
      if (mgrCompare !== 0) return mgrCompare;

      // 4. Name alphabetical
      return a.name.localeCompare(b.name);
    });

  return (
    <div className="space-y-6">
      {/* Top Title & Actions */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5 flex-wrap">
            <h2 className="text-xl sm:text-2xl font-extrabold text-slate-100">
              {isAdmin ? 'User Management & Organization Access' : 'Team Members & Staff Directory'}
            </h2>
            <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-slate-800 text-slate-300 border border-slate-700 whitespace-nowrap">
              {users.length} {isAdmin ? 'Total Users' : 'Team Members'}
            </span>
          </div>
          <p className="text-xs sm:text-sm text-slate-400 mt-1">
            {isAdmin
              ? 'Department-based hierarchy: organize employees under same-department managers, manage roles, and monitor org structures.'
              : 'Supervise direct reporting staff in your department, assign tasks, and track rep performance.'}
          </p>
        </div>

        <div className="flex items-center gap-3 shrink-0 flex-wrap">
          <button
            onClick={() => {
              setIsRefreshing(true);
              triggerRefreshBlink('Users refreshed');
              fetchUsers();
              setTimeout(() => setIsRefreshing(false), 600);
            }}
            title="Refresh Users"
            className="flex items-center gap-2 px-3.5 py-2.5 rounded-xl text-xs font-semibold text-slate-300 bg-slate-900 hover:bg-slate-800 border border-slate-700 transition whitespace-nowrap active:scale-95"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isRefreshing ? 'animate-spin text-indigo-400' : ''}`} />
            <span>Refresh</span>
          </button>

          {isAdmin && (
            <>
              <button
                onClick={() => setIsCreateDeptOpen(true)}
                className="flex items-center justify-center gap-2 px-3.5 py-2.5 rounded-xl text-xs font-semibold text-slate-200 bg-slate-800/90 hover:bg-slate-700 border border-slate-700 transition whitespace-nowrap shrink-0"
              >
                <Building className="w-4 h-4 text-indigo-400 shrink-0" />
                <span>Add Department</span>
              </button>
              <button
                onClick={() => setIsCreateOpen(true)}
                className="flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-500 transition shadow-lg shadow-indigo-600/30 whitespace-nowrap shrink-0"
              >
                <UserPlus className="w-4 h-4 shrink-0" />
                <span>Add New User</span>
              </button>
            </>
          )}
        </div>
      </div>

      {/* Notifications */}
      {successMsg && (
        <div className="p-3.5 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-300 text-xs flex items-center gap-2">
          <Check className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>{successMsg}</span>
        </div>
      )}

      {error && (
        <div className="p-3.5 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-400 text-xs flex items-center gap-2">
          <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* View Switcher Tabs (Directory vs Department Hierarchy) */}
      <div className="flex items-center gap-2 border-b border-slate-800 pb-3">
        <button
          onClick={() => setViewTab('directory')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold transition-all ${
            viewTab === 'directory'
              ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/20'
              : 'bg-slate-900 text-slate-400 hover:text-slate-200 border border-slate-800'
          }`}
        >
          <Users className="w-4 h-4" />
          <span>👥 User Directory</span>
        </button>

        <button
          onClick={() => setViewTab('hierarchy')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold transition-all ${
            viewTab === 'hierarchy'
              ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/20'
              : 'bg-slate-900 text-slate-400 hover:text-slate-200 border border-slate-800'
          }`}
        >
          <GitFork className="w-4 h-4" />
          <span>🌳 Department Hierarchy Tree</span>
        </button>
      </div>

      {/* VIEW 1: Department Hierarchy Tree */}
      {viewTab === 'hierarchy' ? (
        <DepartmentHierarchyView />
      ) : (
        /* VIEW 2: User Directory Table */
        <div className="space-y-4">
          {/* Filters & Search */}
          <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3 bg-slate-900/60 p-3.5 rounded-2xl border border-slate-800">
            <div className="relative flex-1">
              <Search className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search by name, email, department, or manager..."
                className="w-full bg-slate-950/70 border border-slate-800 rounded-xl pl-10 pr-4 py-2 text-xs text-slate-200 placeholder:text-slate-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
              />
            </div>

            <div className="flex items-center gap-3">
              <div className="flex items-center gap-1.5">
                <span className="text-xs text-slate-400 shrink-0">Role:</span>
                <select
                  value={roleFilter}
                  onChange={(e) => setRoleFilter(e.target.value)}
                  className="bg-slate-950/70 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-200 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                >
                  <option value="ALL">All Roles</option>
                  <option value="ROLE_ADMIN">Admin</option>
                  <option value="ROLE_MANAGER">Manager</option>
                  <option value="ROLE_EMPLOYEE">Employee</option>
                </select>
              </div>

              <div className="flex items-center gap-1.5">
                <span className="text-xs text-slate-400 shrink-0">Status:</span>
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="bg-slate-950/70 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-200 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                >
                  <option value="ALL">All Status</option>
                  <option value="ACTIVE">Active</option>
                  <option value="DISABLED">Disabled</option>
                </select>
              </div>
            </div>
          </div>

          {/* Users Table */}
          <div className="bg-slate-900/70 border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-950/60 text-slate-400 font-semibold border-b border-slate-800">
                  <tr>
                    <th className="px-5 py-3.5">Employee / User</th>
                    <th className="px-5 py-3.5">Department</th>
                    <th className="px-5 py-3.5">Assigned Manager</th>
                    <th className="px-5 py-3.5">Access Role</th>
                    <th className="px-5 py-3.5">Account Status</th>
                    {isAdmin && <th className="px-5 py-3.5 text-right">Actions</th>}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60">
                  {isLoading ? (
                    <tr>
                      <td colSpan={isAdmin ? 6 : 5} className="px-5 py-12 text-center text-slate-400">
                        <div className="flex flex-col items-center gap-2">
                          <div className="w-6 h-6 border-2 border-indigo-500/20 border-t-indigo-500 rounded-full animate-spin" />
                          <span>Loading user records...</span>
                        </div>
                      </td>
                    </tr>
                  ) : filteredUsers.length === 0 ? (
                    <tr>
                      <td colSpan={isAdmin ? 6 : 5} className="px-5 py-12 text-center text-slate-500">
                        No matching users found.
                      </td>
                    </tr>
                  ) : (
                    filteredUsers.map((u) => {
                      const isSelf = currentUser?.id === u.id;
                      return (
                        <tr key={u.id} className="hover:bg-slate-800/30 transition-colors">
                          {/* Employee / User Identity */}
                          <td className="px-5 py-4">
                            <div className="flex items-center gap-3">
                              <div className="w-9 h-9 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center font-bold text-slate-300 text-xs shrink-0">
                                {u.name.charAt(0).toUpperCase()}
                              </div>
                              <div>
                                <div className="flex items-center gap-1.5">
                                  <span className="font-semibold text-slate-200">{u.name}</span>
                                  {isSelf && (
                                    <span className="text-[10px] font-medium px-1.5 py-0.2 rounded bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                                      You
                                    </span>
                                  )}
                                </div>
                                <p className="text-slate-400 text-[11px]">{u.email}</p>
                                {u.phoneNumber && (
                                  <p className="text-slate-500 text-[10px] flex items-center gap-1 mt-0.5">
                                    <Phone className="w-2.5 h-2.5" />
                                    <span>{u.phoneNumber}</span>
                                  </p>
                                )}
                              </div>
                            </div>
                          </td>

                          {/* Department */}
                          <td className="px-5 py-4">
                            {u.role === 'ROLE_ADMIN' ? (
                              <span className="text-slate-500 text-xs font-medium italic">
                                —
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold bg-indigo-500/10 text-indigo-300 border border-indigo-500/20">
                                <Building className="w-3 h-3 text-indigo-400" />
                                {u.department || 'General'}
                              </span>
                            )}
                          </td>

                          {/* Assigned Manager */}
                          <td className="px-5 py-4">
                            {u.role === 'ROLE_EMPLOYEE' ? (
                              u.managerName ? (
                                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold bg-emerald-500/10 text-emerald-300 border border-emerald-500/20">
                                  <UserCheck className="w-3.5 h-3.5 text-emerald-400" />
                                  <span>{u.managerName}</span>
                                </span>
                              ) : (
                                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg text-[11px] font-medium bg-amber-500/10 text-amber-400 border border-amber-500/20">
                                  <AlertTriangle className="w-3 h-3 text-amber-400" />
                                  <span>Unassigned</span>
                                </span>
                              )
                            ) : u.role === 'ROLE_MANAGER' ? (
                              <span className="text-[11px] text-slate-500 font-medium italic">
                                Team Lead
                              </span>
                            ) : (
                              <span className="text-[11px] text-slate-500 font-medium italic">
                                Executive
                              </span>
                            )}
                          </td>

                          {/* Current Role / Role Switcher for Admin */}
                          <td className="px-5 py-4">
                            {isAdmin ? (
                              <div className="flex items-center gap-2">
                                <RoleBadge role={u.role} showIcon={false} />
                                <select
                                  value={u.role}
                                  disabled={isSelf}
                                  onChange={(e) => handleRoleChange(u.id, e.target.value as Role)}
                                  className="bg-slate-950 border border-slate-700/80 rounded-lg px-2 py-1 text-[11px] text-slate-300 focus:outline-none focus:ring-1 focus:ring-indigo-500 disabled:opacity-40"
                                >
                                  <option value="ROLE_EMPLOYEE">Employee</option>
                                  <option value="ROLE_MANAGER">Manager</option>
                                  <option value="ROLE_ADMIN">Admin</option>
                                </select>
                              </div>
                            ) : (
                              <RoleBadge role={u.role} />
                            )}
                          </td>

                          {/* Status */}
                          <td className="px-5 py-4">
                            <span
                              className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-medium ${
                                u.active
                                  ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                                  : 'bg-rose-500/10 text-rose-400 border border-rose-500/20'
                              }`}
                            >
                              <span
                                className={`w-1.5 h-1.5 rounded-full ${
                                  u.active ? 'bg-emerald-400' : 'bg-rose-400'
                                }`}
                              />
                              {u.active ? 'Active' : 'Disabled'}
                            </span>
                          </td>

                          {/* Action Menu (Admin only) */}
                          {isAdmin && (
                            <td className="px-5 py-4 text-right">
                              <div className="inline-flex items-center gap-1.5 justify-end">
                                {/* Edit Details */}
                                <button
                                  onClick={() => setEditingUser(u)}
                                  title="Edit user details"
                                  className="p-1.5 rounded-lg text-slate-400 hover:text-indigo-400 hover:bg-slate-800 border border-slate-700/60 transition"
                                >
                                  <Edit2 className="w-3.5 h-3.5" />
                                </button>

                                {/* Admin Reset Password */}
                                <button
                                  onClick={() => setPasswordResetUser(u)}
                                  title="Reset user password"
                                  className="p-1.5 rounded-lg text-slate-400 hover:text-amber-400 hover:bg-slate-800 border border-slate-700/60 transition"
                                >
                                  <KeyRound className="w-3.5 h-3.5" />
                                </button>

                                {/* Toggle Active Status */}
                                <button
                                  onClick={() => handleToggleStatus(u.id)}
                                  disabled={isSelf}
                                  title={u.active ? 'Disable account' : 'Enable account'}
                                  className={`p-1.5 rounded-lg border border-slate-700/60 transition disabled:opacity-30 ${
                                    u.active
                                      ? 'text-slate-400 hover:text-rose-400 hover:bg-rose-500/10'
                                      : 'text-emerald-400 hover:bg-emerald-500/10'
                                  }`}
                                >
                                  <Power className="w-3.5 h-3.5" />
                                </button>

                                {/* Delete User */}
                                <button
                                  onClick={() => setDeletingUser(u)}
                                  disabled={isSelf}
                                  title="Delete user"
                                  className="p-1.5 rounded-lg text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 border border-slate-700/60 transition disabled:opacity-30"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              </div>
                            </td>
                          )}
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Modals */}
      {isAdmin && (
        <>
          <CreateUserModal
            isOpen={isCreateOpen}
            onClose={() => setIsCreateOpen(false)}
            onUserCreated={handleUserCreated}
          />

          <CreateDepartmentModal
            isOpen={isCreateDeptOpen}
            onClose={() => setIsCreateDeptOpen(false)}
            onDepartmentCreated={(newDept) => {
              setSuccessMsg(`Department "${newDept.name}" (${newDept.code}) created successfully.`);
              setTimeout(() => setSuccessMsg(null), 3000);
            }}
          />
        </>
      )}

      <EditUserModal
        isOpen={Boolean(editingUser)}
        user={editingUser}
        onClose={() => setEditingUser(null)}
        onUserUpdated={handleUserUpdated}
      />

      {isAdmin && (
        <>
          <ResetPasswordModal
            isOpen={Boolean(passwordResetUser)}
            user={passwordResetUser}
            onClose={() => setPasswordResetUser(null)}
            onSuccess={(msg) => {
              setSuccessMsg(msg);
              setTimeout(() => setSuccessMsg(null), 3000);
            }}
          />

          <DeleteUserModal
            isOpen={Boolean(deletingUser)}
            user={deletingUser}
            onClose={() => setDeletingUser(null)}
            onUserDeleted={handleUserDeleted}
          />
        </>
      )}
    </div>
  );
};
