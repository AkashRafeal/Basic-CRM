import React, { useEffect, useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { departmentApi } from '../../api/departmentApi';
import { DepartmentHierarchy } from '../../types/auth';
import { CreateDepartmentModal } from './CreateDepartmentModal';
import { DeleteDepartmentModal } from './DeleteDepartmentModal';
import { 
  Building2, 
  Users, 
  UserCheck, 
  AlertCircle, 
  RefreshCw, 
  Layers, 
  UserX,
  PlusCircle,
  Trash2
} from 'lucide-react';
import { triggerRefreshBlink } from '../common/RefreshFeedbackOverlay';

export const DepartmentHierarchyView: React.FC = () => {
  const { isAdmin } = useAuth();
  const [hierarchies, setHierarchies] = useState<DepartmentHierarchy[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedDeptId, setSelectedDeptId] = useState<number | 'ALL'>('ALL');
  const [isCreateDeptOpen, setIsCreateDeptOpen] = useState(false);
  const [deletingDept, setDeletingDept] = useState<DepartmentHierarchy | null>(null);

  const fetchHierarchy = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await departmentApi.getHierarchy();
      setHierarchies(data);
    } catch (err: any) {
      console.error(err);
      setError(err.response?.data?.message || 'Failed to fetch organizational hierarchy.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchHierarchy();
  }, []);

  const filteredHierarchies = hierarchies.filter(
    h => selectedDeptId === 'ALL' || h.id === selectedDeptId
  );

  const totalDepartments = hierarchies.length;
  const totalManagers = hierarchies.reduce((acc, h) => acc + h.managers.length, 0);
  const totalEmployees = hierarchies.reduce(
    (acc, h) => acc + h.managers.reduce((sum, m) => sum + m.employees.length, 0) + h.unassignedEmployees.length,
    0
  );

  return (
    <div className="space-y-6">
      {/* Top Overview Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-slate-900/60 p-4 rounded-2xl border border-slate-800">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-indigo-600/10 border border-indigo-500/20 text-indigo-400 flex items-center justify-center">
            <Layers className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-slate-100">Organization Hierarchy & Reporting Tree</h3>
            <p className="text-xs text-slate-400">
              Department-based reporting structure: <span className="text-indigo-300 font-semibold">{totalDepartments} Departments</span> • <span className="text-emerald-300 font-semibold">{totalManagers} Managers</span> • <span className="text-blue-300 font-semibold">{totalEmployees} Employees</span>
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-2">
            <span className="text-xs text-slate-400">Filter Dept:</span>
            <select
              value={selectedDeptId}
              onChange={(e) => setSelectedDeptId(e.target.value === 'ALL' ? 'ALL' : Number(e.target.value))}
              className="bg-slate-950 border border-slate-800 rounded-xl px-3 py-1.5 text-xs text-slate-200 focus:outline-none focus:ring-1 focus:ring-indigo-500"
            >
              <option value="ALL">All Departments</option>
              {hierarchies.map(h => (
                <option key={h.id} value={h.id}>{h.name} ({h.code})</option>
              ))}
            </select>
          </div>

          <button
            onClick={() => setIsCreateDeptOpen(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-500 shadow-md shadow-indigo-600/20 transition"
          >
            <PlusCircle className="w-3.5 h-3.5" />
            <span>Add Department</span>
          </button>

          <button
            onClick={() => {
              fetchHierarchy();
              triggerRefreshBlink('Department hierarchy refreshed');
            }}
            disabled={loading}
            title="Refresh Hierarchy"
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold text-slate-300 bg-slate-800 hover:bg-slate-700 border border-slate-700 transition"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            <span>Refresh</span>
          </button>
        </div>
      </div>

      {/* Create Department Modal */}
      <CreateDepartmentModal
        isOpen={isCreateDeptOpen}
        onClose={() => setIsCreateDeptOpen(false)}
        onDepartmentCreated={() => {
          fetchHierarchy();
        }}
      />

      {/* Delete Department Modal */}
      <DeleteDepartmentModal
        isOpen={Boolean(deletingDept)}
        department={deletingDept}
        onClose={() => setDeletingDept(null)}
        onDepartmentDeleted={() => {
          fetchHierarchy();
        }}
      />

      {error && (
        <div className="p-4 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-400 text-xs flex items-center gap-2">
          <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Departments Grid */}
      {loading ? (
        <div className="p-12 text-center text-slate-400 bg-slate-900/40 border border-slate-800 rounded-2xl">
          <div className="w-8 h-8 border-2 border-indigo-500/20 border-t-indigo-500 rounded-full animate-spin mx-auto mb-3" />
          <p className="text-sm font-medium">Loading Department Hierarchy...</p>
        </div>
      ) : filteredHierarchies.length === 0 ? (
        <div className="p-12 text-center text-slate-500 bg-slate-900/40 border border-slate-800 rounded-2xl">
          No departments found.
        </div>
      ) : (
        <div className="space-y-6">
          {filteredHierarchies.map((dept) => {
            const deptEmployeeCount = dept.managers.reduce((sum, m) => sum + m.employees.length, 0) + dept.unassignedEmployees.length;

            return (
              <div
                key={dept.id}
                className="bg-slate-900/70 border border-slate-800 rounded-2xl p-5 shadow-xl hover:border-slate-700/80 transition-all"
              >
                {/* Department Header */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-800">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-indigo-600/30 to-purple-600/30 border border-indigo-500/30 flex items-center justify-center text-indigo-400 font-bold text-sm shrink-0">
                      <Building2 className="w-5 h-5" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h4 className="text-base font-extrabold text-slate-100">{dept.name} Department</h4>
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-800 text-indigo-400 border border-indigo-500/20 uppercase tracking-wider">
                          {dept.code}
                        </span>
                      </div>
                      {dept.description && (
                        <p className="text-xs text-slate-400 mt-0.5">{dept.description}</p>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-2 text-xs">
                    <span className="px-2.5 py-1 rounded-lg bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 font-semibold flex items-center gap-1.5">
                      <UserCheck className="w-3.5 h-3.5" />
                      {dept.managers.length} Manager{dept.managers.length !== 1 ? 's' : ''}
                    </span>
                    <span className="px-2.5 py-1 rounded-lg bg-blue-500/10 text-blue-400 border border-blue-500/20 font-semibold flex items-center gap-1.5">
                      <Users className="w-3.5 h-3.5" />
                      {deptEmployeeCount} Employee{deptEmployeeCount !== 1 ? 's' : ''}
                    </span>
                    {isAdmin && (
                      <button
                        onClick={() => setDeletingDept(dept)}
                        className="p-1.5 rounded-lg text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 border border-transparent hover:border-rose-500/20 transition ml-1"
                        title={`Delete ${dept.name} Department`}
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                </div>

                {/* Managers & Reporting Hierarchy Tree */}
                <div className="mt-5 space-y-4">
                  {dept.managers.length === 0 ? (
                    <div className="p-4 rounded-xl bg-slate-950/40 border border-slate-800/80 text-xs text-slate-400 flex items-center gap-2">
                      <AlertCircle className="w-4 h-4 text-amber-400 shrink-0" />
                      <span>No active managers currently assigned to {dept.name} Department.</span>
                    </div>
                  ) : (
                    dept.managers.map((manager) => (
                      <div
                        key={manager.id}
                        className="rounded-xl bg-slate-950/60 border border-slate-800/80 p-4 space-y-3"
                      >
                        {/* Manager Bar */}
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-full bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400 font-bold text-xs">
                              {manager.name.charAt(0).toUpperCase()}
                            </div>
                            <div>
                              <div className="flex items-center gap-2">
                                <span className="font-bold text-slate-100 text-xs">{manager.name}</span>
                                <span className="text-[10px] font-semibold px-2 py-0.2 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                                  Manager
                                </span>
                                {manager.teamName && (
                                  <span className="text-[10px] text-slate-400">
                                    • {manager.teamName}
                                  </span>
                                )}
                              </div>
                              <p className="text-[11px] text-slate-400">{manager.email}</p>
                            </div>
                          </div>

                          <span className="text-xs text-slate-400 font-medium">
                            Supervising <span className="text-slate-200 font-bold">{manager.employees.length}</span> Direct Rep(s)
                          </span>
                        </div>

                        {/* Direct Reporting Employees */}
                        <div className="pl-6 border-l-2 border-slate-800/80 space-y-2 mt-2">
                          {manager.employees.length === 0 ? (
                            <p className="text-[11px] text-slate-500 italic">
                              No employees currently reporting to {manager.name}.
                            </p>
                          ) : (
                            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2.5">
                              {manager.employees.map((emp) => (
                                <div
                                  key={emp.id}
                                  className="flex items-center justify-between p-2.5 rounded-lg bg-slate-900 border border-slate-800 text-xs hover:border-slate-700 transition"
                                >
                                  <div className="flex items-center gap-2.5 min-w-0">
                                    <div className="w-6 h-6 rounded-full bg-slate-800 flex items-center justify-center text-[10px] font-bold text-indigo-400 shrink-0">
                                      {emp.name.charAt(0).toUpperCase()}
                                    </div>
                                    <div className="truncate">
                                      <p className="font-semibold text-slate-200 text-xs truncate">{emp.name}</p>
                                      <p className="text-[10px] text-slate-400 truncate">{emp.email}</p>
                                    </div>
                                  </div>
                                  <span className="w-2 h-2 rounded-full bg-emerald-400 shrink-0" title="Active" />
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      </div>
                    ))
                  )}

                  {/* Unassigned Employees in this Department */}
                  {dept.unassignedEmployees.length > 0 && (
                    <div className="p-3.5 rounded-xl bg-amber-500/5 border border-amber-500/20 space-y-2">
                      <div className="flex items-center gap-2 text-xs font-semibold text-amber-400">
                        <UserX className="w-4 h-4" />
                        <span>Unassigned Employees in {dept.name} ({dept.unassignedEmployees.length})</span>
                      </div>
                      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2">
                        {dept.unassignedEmployees.map((emp) => (
                          <div
                            key={emp.id}
                            className="flex items-center justify-between p-2 rounded-lg bg-slate-900/90 border border-slate-800 text-xs"
                          >
                            <div className="flex items-center gap-2 min-w-0">
                              <div className="w-5 h-5 rounded-full bg-slate-800 text-[10px] text-slate-400 flex items-center justify-center">
                                {emp.name.charAt(0).toUpperCase()}
                              </div>
                              <span className="font-medium text-slate-300 truncate text-xs">{emp.name}</span>
                            </div>
                            <span className="text-[10px] text-amber-400/90 font-medium">Needs Manager</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
