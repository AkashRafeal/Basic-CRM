import { ModalPortal } from '../ModalPortal';
import React, { useState } from 'react';
import { departmentApi } from '../../api/departmentApi';
import { DepartmentHierarchy } from '../../types/auth';
import { X, Trash2, AlertTriangle, Building2 } from 'lucide-react';

interface DeleteDepartmentModalProps {
  isOpen: boolean;
  department: DepartmentHierarchy | null;
  onClose: () => void;
  onDepartmentDeleted: (id: number) => void;
}

export const DeleteDepartmentModal: React.FC<DeleteDepartmentModalProps> = ({
  isOpen,
  department,
  onClose,
  onDepartmentDeleted,
}) => {
  const [error, setError] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  if (!isOpen || !department) return null;

  const totalMembers =
    department.managers.length +
    department.managers.reduce((sum, m) => sum + m.employees.length, 0) +
    department.unassignedEmployees.length;

  const handleDelete = async () => {
    setIsDeleting(true);
    setError(null);
    try {
      await departmentApi.deleteDepartment(department.id);
      onDepartmentDeleted(department.id);
      onClose();
    } catch (err: any) {
      console.error(err);
      setError(err.response?.data?.message || 'Failed to delete department.');
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <ModalPortal>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 modal-overlay-blur animate-fadeIn">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-md shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-slate-800">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-rose-500/10 text-rose-400 flex items-center justify-center">
              <Trash2 className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-100">Delete Department</h3>
              <p className="text-[11px] text-slate-400">Remove department and unbind staff references</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-200 p-1.5 rounded-lg hover:bg-slate-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-4">
          {error && (
            <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-400 text-xs">
              {error}
            </div>
          )}

          <div className="p-4 rounded-xl bg-slate-950/60 border border-slate-800 flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-indigo-600/20 text-indigo-400 flex items-center justify-center font-bold">
              <Building2 className="w-5 h-5" />
            </div>
            <div>
              <h4 className="text-sm font-bold text-slate-100">{department.name} Department</h4>
              <p className="text-xs text-slate-400 font-mono">Code: {department.code}</p>
            </div>
          </div>

          <div className="p-3.5 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-300 text-xs flex items-start gap-2.5">
            <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
            <div>
              <p className="font-semibold">Are you sure you want to delete this department?</p>
              <p className="text-[11px] text-amber-200/80 mt-1">
                {totalMembers > 0
                  ? `There are currently ${totalMembers} staff member(s) in this department. Deleting the department will safely unbind their department assignment without removing their user accounts.`
                  : 'This department has no active staff members and can be safely removed.'}
              </p>
            </div>
          </div>

          <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-800">
            <button
              type="button"
              onClick={onClose}
              disabled={isDeleting}
              className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-400 hover:text-slate-200 hover:bg-slate-800 transition"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleDelete}
              disabled={isDeleting}
              className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold text-white bg-rose-600 hover:bg-rose-500 transition shadow-lg shadow-rose-600/30 disabled:opacity-50"
            >
              <Trash2 className="w-4 h-4" />
              <span>{isDeleting ? 'Deleting...' : 'Delete Department'}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
    </ModalPortal>
  );
};
