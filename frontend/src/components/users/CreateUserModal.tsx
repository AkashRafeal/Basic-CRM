import { ModalPortal } from '../ModalPortal';
import React, { useState, useEffect } from 'react';
import { userApi } from '../../api/userApi';
import { departmentApi } from '../../api/departmentApi';
import { User, Role, Department } from '../../types/auth';
import { validatePhoneNumber } from '../../utils/validation';
import { DepartmentCreatableSelect } from './DepartmentCreatableSelect';
import { X, UserPlus, Mail, Lock, Phone, Shield, UserCheck, AlertTriangle } from 'lucide-react';

interface CreateUserModalProps {
  isOpen: boolean;
  onClose: () => void;
  onUserCreated: (user: User) => void;
}

export const CreateUserModal: React.FC<CreateUserModalProps> = ({
  isOpen,
  onClose,
  onUserCreated,
}) => {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState<Role>('ROLE_EMPLOYEE');
  const [departmentId, setDepartmentId] = useState<number | ''>('');
  const [customDepartmentName, setCustomDepartmentName] = useState('');
  const [managerId, setManagerId] = useState<number | 'auto' | ''>('auto');
  const [phoneNumber, setPhoneNumber] = useState('');
  
  const [departments, setDepartments] = useState<Department[]>([]);
  const [allManagers, setAllManagers] = useState<User[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setError(null);
      // Fetch latest departments and active managers
      Promise.all([
        departmentApi.getAllDepartments().catch(() => []),
        userApi.getAllUsers({ role: 'ROLE_MANAGER', active: true }).catch(() => [])
      ]).then(([depts, managers]) => {
        setDepartments(depts);
        setAllManagers(managers);
      });
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const selectedDepartment = departments.find(d => d.id === Number(departmentId));
  const effectiveDeptName = customDepartmentName.trim() || selectedDepartment?.name || '';
  
  // Managers strictly belonging to the selected department
  const deptManagers = allManagers.filter(m => {
    if (departmentId && m.departmentId) {
      return m.departmentId === Number(departmentId);
    }
    if (effectiveDeptName && m.department) {
      return m.department.toLowerCase() === effectiveDeptName.toLowerCase();
    }
    return false;
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!effectiveDeptName && departmentId === '') {
      setError('Please select or type a department name.');
      return;
    }

    // Validate 10-digit phone number
    if (phoneNumber.trim()) {
      const phoneCheck = validatePhoneNumber(phoneNumber);
      if (!phoneCheck.isValid) {
        setError(phoneCheck.error || 'Phone number must be exactly 10 digits.');
        return;
      }
    }

    setIsSubmitting(true);

    try {
      let finalManagerId: number | undefined = undefined;
      let autoAssign: boolean | undefined = undefined;

      if (role === 'ROLE_EMPLOYEE') {
        if (managerId === 'auto') {
          autoAssign = true;
        } else if (typeof managerId === 'number') {
          finalManagerId = managerId;
        }
      }

      const cleanPhone = phoneNumber.trim() ? validatePhoneNumber(phoneNumber).cleanPhone : undefined;

      const newUser = await userApi.createUser({
        name,
        email,
        password,
        role,
        departmentId: role === 'ROLE_ADMIN' ? undefined : (departmentId !== '' ? Number(departmentId) : undefined),
        department: role === 'ROLE_ADMIN' ? undefined : effectiveDeptName,
        managerId: finalManagerId,
        autoAssignManager: autoAssign,
        phoneNumber: cleanPhone,
      });

      onUserCreated(newUser);
      onClose();
      // Reset form
      setName('');
      setEmail('');
      setPassword('');
      setRole('ROLE_EMPLOYEE');
      setDepartmentId('');
      setCustomDepartmentName('');
      setManagerId('auto');
      setPhoneNumber('');
    } catch (err: any) {
      console.error(err);
      setError(err.response?.data?.message || 'Failed to create user.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <ModalPortal>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 modal-overlay-blur animate-fadeIn">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-lg shadow-2xl relative">
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-slate-800">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-indigo-500/10 text-indigo-400 flex items-center justify-center">
              <UserPlus className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-100">Add New CRM User</h3>
              <p className="text-[11px] text-slate-400">Department-based manager hierarchy and security</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-200 p-1.5 rounded-lg hover:bg-slate-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {error && (
            <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-400 text-xs">
              {error}
            </div>
          )}

          <div>
            <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
              Full Name *
            </label>
            <input
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Rachel Green"
              className="w-full bg-slate-950/70 border border-slate-800 rounded-xl px-3.5 py-2.5 text-xs text-slate-100 placeholder:text-slate-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
              Email Address *
            </label>
            <div className="relative">
              <Mail className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="rachel@company.com"
                className="w-full bg-slate-950/70 border border-slate-800 rounded-xl pl-10 pr-3.5 py-2.5 text-xs text-slate-100 placeholder:text-slate-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                Initial Password *
              </label>
              <div className="relative">
                <Lock className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="password"
                  required
                  minLength={6}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Min 6 characters"
                  className="w-full bg-slate-950/70 border border-slate-800 rounded-xl pl-10 pr-3.5 py-2.5 text-xs text-slate-100 placeholder:text-slate-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                Assign Role *
              </label>
              <div className="relative">
                <Shield className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <select
                  value={role}
                  onChange={(e) => setRole(e.target.value as Role)}
                  className="w-full bg-slate-950/70 border border-slate-800 rounded-xl pl-10 pr-3.5 py-2.5 text-xs text-slate-100 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                >
                  <option value="ROLE_EMPLOYEE">Employee</option>
                  <option value="ROLE_MANAGER">Manager</option>
                  <option value="ROLE_ADMIN">Admin</option>
                </select>
              </div>
            </div>
          </div>

          {/* Department Selection */}
          {role !== 'ROLE_ADMIN' ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                  Department * (Select or Type Any)
                </label>
                <DepartmentCreatableSelect
                  departments={departments}
                  selectedDepartmentId={departmentId}
                  customDepartmentName={customDepartmentName}
                  required
                  onChange={(deptId, deptName) => {
                    setDepartmentId(deptId);
                    setCustomDepartmentName(deptName);
                    setManagerId('auto');
                  }}
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                  Phone Number (10 Digits)
                </label>
                <div className="relative">
                  <Phone className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="tel"
                    maxLength={10}
                    value={phoneNumber}
                    onChange={(e) => setPhoneNumber(e.target.value.replace(/\D/g, ''))}
                    placeholder="9876543210"
                    className="w-full bg-slate-950/70 border border-slate-800 rounded-xl pl-10 pr-3.5 py-2.5 text-xs text-slate-100 placeholder:text-slate-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 font-mono"
                  />
                </div>
              </div>
            </div>
          ) : (
            <div>
              <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                Phone Number (10 Digits)
              </label>
              <div className="relative">
                <Phone className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="tel"
                  maxLength={10}
                  value={phoneNumber}
                  onChange={(e) => setPhoneNumber(e.target.value.replace(/\D/g, ''))}
                  placeholder="9876543210"
                  className="w-full bg-slate-950/70 border border-slate-800 rounded-xl pl-10 pr-3.5 py-2.5 text-xs text-slate-100 placeholder:text-slate-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 font-mono"
                />
              </div>
            </div>
          )}

          {/* Strict Same-Department Manager Assignment for Employees */}
          {role === 'ROLE_EMPLOYEE' && (
            <div className="p-4 rounded-xl bg-slate-950/50 border border-slate-800 space-y-2">
              <div className="flex items-center justify-between">
                <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider">
                  Reporting Manager ({effectiveDeptName || 'Department'})
                </label>
                <span className="text-[10px] text-indigo-400 font-medium">
                  {deptManagers.length} Manager(s) in {effectiveDeptName || 'Department'}
                </span>
              </div>

              {deptManagers.length > 0 ? (
                <div className="relative">
                  <UserCheck className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                  <select
                    value={managerId}
                    onChange={(e) => {
                      const val = e.target.value;
                      if (val === 'auto') setManagerId('auto');
                      else if (val === '') setManagerId('');
                      else setManagerId(Number(val));
                    }}
                    className="w-full bg-slate-900 border border-slate-800 rounded-xl pl-10 pr-3.5 py-2.5 text-xs text-slate-100 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                  >
                    <option value="auto">✨ Auto-Assign (from {effectiveDeptName || 'Department'})</option>
                    {deptManagers.map((m) => (
                      <option key={m.id} value={m.id}>
                        {m.name} ({m.email})
                      </option>
                    ))}
                    <option value="">None (Assign Later)</option>
                  </select>
                </div>
              ) : (
                <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-300 text-xs flex items-start gap-2">
                  <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                  <div>
                    <span className="font-bold">No Manager currently available in {effectiveDeptName || 'this department'}.</span>
                    <p className="text-[11px] text-amber-400/80 mt-0.5">
                      Employee will be created unassigned. An Admin can create or assign a manager from the same department later.
                    </p>
                  </div>
                </div>
              )}
            </div>
          )}

          <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-800">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-400 hover:text-slate-200 bg-slate-800/60 hover:bg-slate-800 transition"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-4 py-2 rounded-xl text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 transition shadow-lg shadow-indigo-600/30"
            >
              {isSubmitting ? 'Creating...' : 'Create User'}
            </button>
          </div>
        </form>
      </div>
    </div>
    </ModalPortal>
  );
};
