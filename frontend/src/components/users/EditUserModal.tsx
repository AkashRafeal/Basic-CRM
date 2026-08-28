import { ModalPortal } from '../ModalPortal';
import React, { useState, useEffect } from 'react';
import { userApi } from '../../api/userApi';
import { departmentApi } from '../../api/departmentApi';
import { User, Department } from '../../types/auth';
import { validatePhoneNumber } from '../../utils/validation';
import { DepartmentCreatableSelect } from './DepartmentCreatableSelect';
import { X, Edit3, Phone, UserCheck, AlertTriangle, AlertCircle, User as UserIcon } from 'lucide-react';

interface EditUserModalProps {
  isOpen: boolean;
  user: User | null;
  onClose: () => void;
  onUserUpdated: (user: User) => void;
}

export const EditUserModal: React.FC<EditUserModalProps> = ({
  isOpen,
  user,
  onClose,
  onUserUpdated,
}) => {
  const [name, setName] = useState('');
  const [departmentId, setDepartmentId] = useState<number | ''>('');
  const [customDepartmentName, setCustomDepartmentName] = useState('');
  const [managerId, setManagerId] = useState<number | ''>('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [active, setActive] = useState(true);

  const [departments, setDepartments] = useState<Department[]>([]);
  const [allManagers, setAllManagers] = useState<User[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (isOpen && user) {
      setName(user.name);
      setDepartmentId(user.departmentId || '');
      setCustomDepartmentName(user.department || '');
      setManagerId(user.managerId || '');
      setPhoneNumber(user.phoneNumber || '');
      setActive(user.active);
      setError(null);

      // Fetch departments and active managers
      Promise.all([
        departmentApi.getAllDepartments().catch(() => []),
        userApi.getAllUsers({ role: 'ROLE_MANAGER', active: true }).catch(() => [])
      ]).then(([depts, managers]) => {
        setDepartments(depts);
        setAllManagers(managers);

        // If departmentId is missing, resolve from department name
        if (!user.departmentId && user.department) {
          const matched = depts.find(d => d.name.toLowerCase() === user.department?.toLowerCase());
          if (matched) {
            setDepartmentId(matched.id);
          }
        }
      });
    }
  }, [isOpen, user]);

  if (!isOpen || !user) return null;

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

    if (phoneNumber.trim()) {
      const phoneCheck = validatePhoneNumber(phoneNumber);
      if (!phoneCheck.isValid) {
        setError(phoneCheck.error || 'Phone number must be exactly 10 digits.');
        return;
      }
    }

    setIsSubmitting(true);

    try {
      const cleanPhone = phoneNumber.trim() ? validatePhoneNumber(phoneNumber).cleanPhone : undefined;

      const updated = await userApi.updateUser(user.id, {
        name,
        departmentId: user.role === 'ROLE_ADMIN' ? undefined : (departmentId !== '' ? Number(departmentId) : undefined),
        department: user.role === 'ROLE_ADMIN' ? undefined : effectiveDeptName,
        managerId: user.role === 'ROLE_EMPLOYEE' ? (managerId !== '' ? Number(managerId) : undefined) : undefined,
        phoneNumber: cleanPhone,
        active,
      });
      onUserUpdated(updated);
      onClose();
    } catch (err: any) {
      console.error(err);
      setError(err.response?.data?.message || 'Failed to update user.');
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
              <Edit3 className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-100">Edit User Details</h3>
              <p className="text-[11px] text-slate-400">{user.email}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-200 p-1.5 rounded-lg hover:bg-slate-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {error && (
            <div className="p-3.5 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-400 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <div className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                Full Name *
              </label>
              <div className="relative">
                <UserIcon className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full bg-slate-950/70 border border-slate-800 rounded-xl pl-10 pr-3.5 py-2.5 text-xs text-slate-100 placeholder:text-slate-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                />
              </div>
            </div>

            {user.role !== 'ROLE_ADMIN' ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                    Department (Select or Type Any)
                  </label>
                  <DepartmentCreatableSelect
                    departments={departments}
                    selectedDepartmentId={departmentId}
                    customDepartmentName={customDepartmentName}
                    onChange={(deptId, deptName) => {
                      setDepartmentId(deptId);
                      setCustomDepartmentName(deptName);
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
          </div>

          {/* Strict Same-Department Manager Assignment for Employees */}
          {user.role === 'ROLE_EMPLOYEE' && (
            <div className="p-4 rounded-xl bg-slate-950/50 border border-slate-800 space-y-2">
              <div className="flex items-center justify-between">
                <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider">
                  Assigned Manager ({effectiveDeptName || 'Department'})
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
                    onChange={(e) => setManagerId(e.target.value ? Number(e.target.value) : '')}
                    className="w-full bg-slate-900 border border-slate-800 rounded-xl pl-10 pr-3.5 py-2.5 text-xs text-slate-100 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                  >
                    <option value="">Unassigned</option>
                    {deptManagers.map((m) => (
                      <option key={m.id} value={m.id}>
                        {m.name} ({m.email})
                      </option>
                    ))}
                  </select>
                </div>
              ) : (
                <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-300 text-xs flex items-start gap-2">
                  <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                  <div>
                    <span className="font-bold">No Manager available in {effectiveDeptName || 'this department'}.</span>
                    <p className="text-[11px] text-amber-400/80 mt-0.5">
                      Employees can only report to a Manager belonging to the same department.
                    </p>
                  </div>
                </div>
              )}
            </div>
          )}

          <div>
            <label className="flex items-center gap-2 cursor-pointer pt-2">
              <input
                type="checkbox"
                checked={active}
                onChange={(e) => setActive(e.target.checked)}
                className="w-4 h-4 rounded border-slate-700 bg-slate-950 text-indigo-600 focus:ring-indigo-500"
              />
              <span className="text-xs text-slate-300 font-medium">Account is Active</span>
            </label>
          </div>

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
              {isSubmitting ? 'Saving Changes...' : 'Save Changes'}
            </button>
          </div>
        </form>
      </div>
    </div>
    </ModalPortal>
  );
};
