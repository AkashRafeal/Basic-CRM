import React, { useEffect, useState } from 'react';
import { taskApi } from '../api/taskApi';
import { userApi } from '../api/userApi';
import {
  Task,
  TaskStatus,
  TaskPriority,
  TaskType,
  TaskStats,
  CreateTaskRequest,
  UpdateTaskRequest,
} from '../types/task';
import { User } from '../types/auth';
import { useAuth } from '../context/AuthContext';
import { TaskStatusBadge } from '../components/tasks/TaskStatusBadge';
import { TaskPriorityBadge } from '../components/tasks/TaskPriorityBadge';
import { CreateTaskModal } from '../components/tasks/CreateTaskModal';
import { EditTaskModal } from '../components/tasks/EditTaskModal';
import { TaskDetailsModal } from '../components/tasks/TaskDetailsModal';
import { DeleteTaskModal } from '../components/tasks/DeleteTaskModal';
import { checkTaskDeletePermission } from '../utils/taskPermissions';
import {
  CheckSquare,
  Clock,
  CheckCircle2,
  AlertTriangle,
  Plus,
  Search,
  LayoutGrid,
  List as ListIcon,
  Eye,
  Edit2,
  Trash2,
  Calendar,
  Link2,
  ShieldAlert,
  XCircle,
} from 'lucide-react';

const KANBAN_STAGES: { status: TaskStatus; label: string; dot: string }[] = [
  { status: 'TODO', label: 'To Do', dot: 'bg-blue-400' },
  { status: 'IN_PROGRESS', label: 'In Progress', dot: 'bg-amber-400' },
  { status: 'COMPLETED', label: 'Completed', dot: 'bg-emerald-400' },
  { status: 'CANCELLED', label: 'Cancelled', dot: 'bg-rose-400' },
];

export const TaskManagement: React.FC = () => {
  const { user } = useAuth();
  const [tasks, setTasks] = useState<Task[]>([]);
  const [stats, setStats] = useState<TaskStats | null>(null);
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);

  // Filters & Search
  const [search, setSearch] = useState('');
  const [activeTab, setActiveTab] = useState<'all' | 'unassigned' | 'my' | 'team' | 'assigned_by_me' | 'overdue' | 'completed' | 'cancelled'>('all');
  const [statusFilter, setStatusFilter] = useState<TaskStatus | ''>('');
  const [priorityFilter, setPriorityFilter] = useState<TaskPriority | ''>('');
  const [typeFilter, setTypeFilter] = useState<TaskType | ''>('');
  const [viewMode, setViewMode] = useState<'kanban' | 'table'>('kanban');

  // Modals state
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isDetailsOpen, setIsDetailsOpen] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [deleteLoading, setDeleteLoading] = useState(false);

  const fetchTasksAndStats = async () => {
    try {
      setLoading(true);
      const isEmployee = user?.role === 'ROLE_EMPLOYEE';
      const isManager = user?.role === 'ROLE_MANAGER';

      const [tasksRes, statsRes, usersRes] = await Promise.all([
        taskApi.getTasks({
          search: search || undefined,
          status: statusFilter ? (statusFilter as TaskStatus) : undefined,
          priority: priorityFilter ? (priorityFilter as TaskPriority) : undefined,
          taskType: typeFilter ? (typeFilter as TaskType) : undefined,
        }),
        taskApi.getStats(),
        isManager ? userApi.getTeamMembers() : (isEmployee && user ? Promise.resolve([user]) : userApi.getAllUsers()),
      ]);

      let loadedTasks = tasksRes.success && tasksRes.data ? tasksRes.data : [];
      let availableAssignees: User[] = [];

      if (isManager && user) {
        const teamMembers = usersRes || [];
        const teamMemberIds = new Set([user.id, ...teamMembers.map((u: User) => u.id)]);

        // Manager can see: their assigned tasks, their team's tasks, created by them, AND ALL UNASSIGNED TASKS
        loadedTasks = loadedTasks.filter(
          (t) => !t.assignedToUserId || teamMemberIds.has(t.assignedToUserId) || t.createdByUserId === user.id
        );
        availableAssignees = [user, ...teamMembers];
      } else if (isEmployee && user) {
        // Employee can see: their assigned tasks, created by them, AND ALL UNASSIGNED TASKS
        loadedTasks = loadedTasks.filter(
          (t) => !t.assignedToUserId || t.assignedToUserId === user.id || t.createdByUserId === user.id
        );
        availableAssignees = [user];
      } else {
        availableAssignees = usersRes || [];
      }

      // Tab filtering
      if (activeTab === 'unassigned') {
        loadedTasks = loadedTasks.filter((t) => !t.assignedToUserId);
      } else if (activeTab === 'my' && user) {
        loadedTasks = loadedTasks.filter((t) => t.assignedToUserId === user.id);
      } else if (activeTab === 'team' && user) {
        loadedTasks = loadedTasks.filter((t) => t.assignedToUserId && t.assignedToUserId !== user.id);
      } else if (activeTab === 'assigned_by_me' && user) {
        loadedTasks = loadedTasks.filter((t) => t.createdByUserId === user.id);
      } else if (activeTab === 'overdue') {
        loadedTasks = loadedTasks.filter((t) => t.isOverdue);
      } else if (activeTab === 'completed') {
        loadedTasks = loadedTasks.filter((t) => t.status === 'COMPLETED');
      } else if (activeTab === 'cancelled') {
        loadedTasks = loadedTasks.filter((t) => t.status === 'CANCELLED');
      }

      setTasks(loadedTasks);
      setUsers(availableAssignees);

      // Scoped KPI calculation for Manager / Employee
      if (isManager || isEmployee) {
        const totalTasks = loadedTasks.length;
        const todoTasks = loadedTasks.filter((t) => t.status === 'TODO').length;
        const inProgressTasks = loadedTasks.filter((t) => t.status === 'IN_PROGRESS').length;
        const completedTasks = loadedTasks.filter((t) => t.status === 'COMPLETED').length;
        const cancelledTasks = loadedTasks.filter((t) => t.status === 'CANCELLED').length;
        const overdueTasks = loadedTasks.filter((t) => t.isOverdue).length;
        const completionRate = totalTasks > 0 ? Number(((completedTasks / totalTasks) * 100).toFixed(1)) : 0;

        setStats({
          totalTasks,
          todoTasks,
          inProgressTasks,
          completedTasks,
          cancelledTasks,
          overdueTasks,
          completionRate,
          tasksByPriority: {} as any,
          tasksByStatus: {} as any,
          tasksByType: {} as any,
        });
      } else if (statsRes.success && statsRes.data) {
        setStats(statsRes.data);
      }
    } catch (err) {
      console.error('Failed to load tasks data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTasksAndStats();
  }, [search, activeTab, statusFilter, priorityFilter, typeFilter]);

  // Handlers
  const handleCreateTask = async (data: CreateTaskRequest) => {
    const res = await taskApi.createTask(data);
    if (res.success) {
      fetchTasksAndStats();
    }
  };

  const handleUpdateTask = async (id: number, data: UpdateTaskRequest) => {
    const res = await taskApi.updateTask(id, data);
    if (res.success) {
      fetchTasksAndStats();
    }
  };

  const handleStatusChange = async (id: number, newStatus: TaskStatus) => {
    try {
      const res = await taskApi.updateTaskStatus(id, newStatus);
      if (res.success) {
        fetchTasksAndStats();
        if (selectedTask && selectedTask.id === id) {
          setSelectedTask(res.data || null);
        }
      }
    } catch (err) {
      console.error('Failed to update task status:', err);
    }
  };

  const handleDeleteTask = async (permanent?: boolean) => {
    if (!selectedTask) return;
    try {
      setDeleteLoading(true);
      const res = await taskApi.deleteTask(selectedTask.id, permanent);
      if (res.success) {
        setIsDeleteOpen(false);
        setSelectedTask(null);
        fetchTasksAndStats();
      }
    } catch (err) {
      console.error('Failed to delete task:', err);
    } finally {
      setDeleteLoading(false);
    }
  };

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2">
            <h1 className="text-2xl font-bold text-slate-100">Tasks & Activities</h1>
            <span className="px-2.5 py-0.5 rounded-full bg-indigo-500/10 text-indigo-400 border border-indigo-500/30 text-xs font-semibold">
              Live Tracker
            </span>
          </div>
          <p className="text-sm text-slate-400 mt-1">
            Prioritize follow-ups, client meetings, deal milestones, and team assignments
          </p>
        </div>

        <div className="flex items-center space-x-3">
          {/* View toggle */}
          <div className="flex items-center bg-slate-900 border border-slate-800 rounded-xl p-1">
            <button
              onClick={() => setViewMode('kanban')}
              className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
                viewMode === 'kanban'
                  ? 'bg-indigo-600 text-white shadow'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <LayoutGrid className="w-3.5 h-3.5" />
              <span>Kanban</span>
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
            onClick={() => setIsCreateOpen(true)}
            className="flex items-center space-x-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-semibold rounded-xl shadow-lg shadow-indigo-600/20 transition-all hover:shadow-indigo-600/40"
          >
            <Plus className="w-4 h-4" />
            <span>Create Task</span>
          </button>
        </div>
      </div>

      {/* KPI Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        <div className="bg-slate-900 border border-slate-800 p-5 rounded-2xl relative overflow-hidden group hover:border-slate-700 transition-all">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
              Total Activities
            </span>
            <div className="w-9 h-9 rounded-xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-blue-400">
              <CheckSquare className="w-5 h-5" />
            </div>
          </div>
          <div className="text-2xl font-bold text-slate-100 mt-2">
            {stats?.totalTasks ?? (loading ? '...' : 0)}
          </div>
          <div className="text-xs text-blue-400 mt-1 flex items-center space-x-1">
            <span>{stats?.todoTasks ?? 0} to do / upcoming</span>
          </div>
        </div>

        <div className="bg-slate-900 border border-slate-800 p-5 rounded-2xl relative overflow-hidden group hover:border-slate-700 transition-all">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
              In Progress
            </span>
            <div className="w-9 h-9 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400">
              <Clock className="w-5 h-5" />
            </div>
          </div>
          <div className="text-2xl font-bold text-amber-400 mt-2">
            {stats?.inProgressTasks ?? (loading ? '...' : 0)}
          </div>
          <div className="text-xs text-slate-400 mt-1">
            Active team efforts
          </div>
        </div>

        <div className="bg-slate-900 border border-slate-800 p-5 rounded-2xl relative overflow-hidden group hover:border-slate-700 transition-all">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
              Completed
            </span>
            <div className="w-9 h-9 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
              <CheckCircle2 className="w-5 h-5" />
            </div>
          </div>
          <div className="text-2xl font-bold text-emerald-400 mt-2">
            {stats?.completedTasks ?? (loading ? '...' : 0)}
          </div>
          <div className="text-xs text-emerald-400/80 mt-1">
            {stats?.completionRate ?? 0}% resolution rate
          </div>
        </div>

        <div className="bg-slate-900 border border-slate-800 p-5 rounded-2xl relative overflow-hidden group hover:border-slate-700 transition-all">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
              Cancelled
            </span>
            <div className="w-9 h-9 rounded-xl bg-rose-500/10 border border-rose-500/20 flex items-center justify-center text-rose-400">
              <XCircle className="w-5 h-5" />
            </div>
          </div>
          <div className="text-2xl font-bold text-rose-400 mt-2">
            {stats?.cancelledTasks ?? 0}
          </div>
          <div className="text-xs text-slate-400 mt-1">
            Archived / Cancelled
          </div>
        </div>

        <div className="bg-slate-900 border border-slate-800 p-5 rounded-2xl relative overflow-hidden group hover:border-slate-700 transition-all">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
              Overdue Alerts
            </span>
            <div className="w-9 h-9 rounded-xl bg-red-500/10 border border-red-500/20 flex items-center justify-center text-red-400">
              <AlertTriangle className="w-5 h-5" />
            </div>
          </div>
          <div className="text-2xl font-bold text-red-400 mt-2">
            {stats?.overdueTasks ?? 0}
          </div>
          <div className="text-xs text-red-400/80 mt-1">
            Missed target deadlines
          </div>
        </div>
      </div>

      {/* Quick Filter Tabs */}
      <div className="flex flex-wrap gap-2 border-b border-slate-800 pb-3">
        {[
          { id: 'all', label: 'All Tasks' },
          { id: 'unassigned', label: 'Unassigned Tasks' },
          { id: 'my', label: 'My Tasks' },
          ...(user?.role === 'ROLE_ADMIN' || user?.role === 'ROLE_MANAGER'
            ? [
                { id: 'team', label: user?.role === 'ROLE_ADMIN' ? 'All Team Tasks' : 'Team Tasks' },
                { id: 'assigned_by_me', label: 'Assigned by Me' },
              ]
            : []),
          { id: 'overdue', label: 'Overdue Deadlines' },
          { id: 'completed', label: 'Completed' },
          { id: 'cancelled', label: 'Cancelled' },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as any)}
            className={`px-4 py-2 rounded-xl text-xs font-semibold transition-all ${
              activeTab === tab.id
                ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/20'
                : 'bg-slate-900 text-slate-400 hover:text-slate-200 border border-slate-800'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Search and Filters */}
      <div className="bg-slate-900 border border-slate-800 p-4 rounded-2xl flex flex-col md:flex-row gap-3 items-center justify-between">
        <div className="relative w-full md:w-80">
          <Search className="w-4 h-4 text-slate-500 absolute left-3 top-3" />
          <input
            type="text"
            placeholder="Search tasks by title, notes, account..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2 bg-slate-950 border border-slate-800 rounded-xl text-slate-200 text-sm focus:outline-none focus:border-indigo-500 transition-colors"
          />
        </div>

        <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
          <div className="relative flex-1 md:flex-initial">
            <select
              value={priorityFilter}
              onChange={(e) => setPriorityFilter(e.target.value as TaskPriority | '')}
              className="w-full md:w-36 px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-slate-200 text-sm focus:outline-none focus:border-indigo-500"
            >
              <option value="">All Priorities</option>
              <option value="URGENT">Urgent (P0)</option>
              <option value="HIGH">High</option>
              <option value="MEDIUM">Medium</option>
              <option value="LOW">Low</option>
            </select>
          </div>

          <div className="relative flex-1 md:flex-initial">
            <select
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value as TaskType | '')}
              className="w-full md:w-40 px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-slate-200 text-sm focus:outline-none focus:border-indigo-500"
            >
              <option value="">All Task Types</option>
              <option value="FOLLOW_UP">Follow-up</option>
              <option value="CALL">Call</option>
              <option value="MEETING">Meeting</option>
              <option value="EMAIL">Email</option>
              <option value="PROPOSAL">Proposal</option>
              <option value="ONBOARDING">Onboarding</option>
              <option value="OTHER">General</option>
            </select>
          </div>

          <div className="relative flex-1 md:flex-initial">
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as TaskStatus | '')}
              className="w-full md:w-36 px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-slate-200 text-sm focus:outline-none focus:border-indigo-500"
            >
              <option value="">All Statuses</option>
              <option value="TODO">To Do</option>
              <option value="IN_PROGRESS">In Progress</option>
              <option value="COMPLETED">Completed</option>
              <option value="CANCELLED">Cancelled</option>
            </select>
          </div>
        </div>
      </div>

      {/* Main View: Kanban vs Table */}
      {viewMode === 'kanban' ? (
        /* KANBAN VIEW */
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4 items-start">
          {KANBAN_STAGES.map((stage) => {
            const columnTasks = tasks.filter((t) => t.status === stage.status);

            return (
              <div
                key={stage.status}
                className="bg-slate-900/70 border border-slate-800/80 rounded-2xl p-4 flex flex-col"
              >
                {/* Column Header */}
                <div className="flex items-center justify-between pb-3 mb-4 border-b border-slate-800">
                  <div className="flex items-center space-x-2">
                    <span className={`w-2.5 h-2.5 rounded-full ${stage.dot}`} />
                    <h3 className="text-sm font-bold text-slate-200 uppercase tracking-wider">
                      {stage.label}
                    </h3>
                  </div>
                  <span className="text-xs px-2.5 py-0.5 rounded-full bg-slate-800 text-slate-400 font-semibold">
                    {columnTasks.length}
                  </span>
                </div>

                {/* Cards Container */}
                <div className="space-y-3 min-h-[350px]">
                  {columnTasks.length === 0 ? (
                    <div className="h-28 border border-dashed border-slate-800 rounded-xl flex items-center justify-center text-slate-600 text-xs">
                      No tasks in {stage.label.toLowerCase()}
                    </div>
                  ) : (
                    columnTasks.map((t) => (
                      <div
                        key={t.id}
                        className="bg-slate-950 border border-slate-800 hover:border-indigo-500/50 rounded-xl p-4 shadow-md hover:shadow-indigo-500/10 transition-all cursor-pointer group space-y-3"
                        onClick={() => {
                          setSelectedTask(t);
                          setIsDetailsOpen(true);
                        }}
                      >
                        <div className="flex items-start justify-between gap-2">
                          <h4 className="text-sm font-bold text-slate-100 group-hover:text-indigo-400 transition-colors leading-snug">
                            {t.title}
                          </h4>
                        </div>

                        <div className="flex items-center space-x-2">
                          <TaskPriorityBadge priority={t.priority} />
                          <span className="text-[11px] px-2 py-0.5 rounded bg-slate-900 text-slate-400 border border-slate-800">
                            {t.taskTypeDisplayName}
                          </span>
                        </div>

                        {t.relatedEntityName && (
                          <div className="text-[11px] text-slate-400 flex items-center gap-1.5 truncate">
                            <Link2 className="w-3 h-3 text-slate-500 shrink-0" />
                            <span className="truncate">{t.relatedEntityName}</span>
                          </div>
                        )}

                        <div className="flex items-center justify-between pt-2 border-t border-slate-900 text-xs text-slate-400">
                          <span className={`flex items-center gap-1 text-[11px] ${t.isOverdue ? 'text-rose-400 font-bold' : ''}`}>
                            <Calendar className="w-3 h-3 text-slate-500" />
                            {t.dueDate || 'No due date'}
                          </span>
                          <span className="truncate max-w-[110px] text-[11px] text-right">
                            {t.assignedToUserName?.split(' ')[0] || 'Unassigned'}
                            {t.createdByUserName && (
                              <span className="block text-[9px] text-slate-500 truncate">
                                By {t.createdByUserName.split(' ')[0]}
                              </span>
                            )}
                          </span>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        /* TABLE VIEW */
        <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-800 bg-slate-900/80 text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                  <th className="px-6 py-4">Task / Activity</th>
                  <th className="px-6 py-4">Status</th>
                  <th className="px-6 py-4">Priority</th>
                  <th className="px-6 py-4">Type</th>
                  <th className="px-6 py-4">Due Date</th>
                  <th className="px-6 py-4">Assignee</th>
                  <th className="px-6 py-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 text-sm">
                {tasks.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="px-6 py-12 text-center text-slate-500 text-sm">
                      No tasks match your filter criteria.
                    </td>
                  </tr>
                ) : (
                  tasks.map((t) => (
                    <tr key={t.id} className="hover:bg-slate-800/30 transition-colors">
                      <td className="px-6 py-4">
                        <div>
                          <div className="font-semibold text-slate-100">{t.title}</div>
                          <div className="flex items-center gap-2 mt-0.5 text-xs text-slate-400">
                            {t.relatedEntityName && (
                              <span className="flex items-center gap-1">
                                <Link2 className="w-3 h-3 text-slate-500" />
                                <span>{t.relatedEntityName}</span>
                              </span>
                            )}
                            {t.createdByUserName && (
                              <span className="text-[10px] text-slate-500">
                                • By {t.createdByUserName} {t.createdByRole && `(${t.createdByRole.replace('ROLE_', '')})`}
                              </span>
                            )}
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <TaskStatusBadge status={t.status} />
                      </td>
                      <td className="px-6 py-4">
                        <TaskPriorityBadge priority={t.priority} />
                      </td>
                      <td className="px-6 py-4 text-xs text-slate-300">
                        {t.taskTypeDisplayName}
                      </td>
                      <td className="px-6 py-4 text-xs">
                        <span className={t.isOverdue ? 'text-rose-400 font-bold' : 'text-slate-300'}>
                          {t.dueDate || '—'}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-xs text-slate-300">
                        {t.assignedToUserName || <span className="text-slate-500">Unassigned</span>}
                      </td>
                      <td className="px-6 py-4 text-right">
                        <div className="flex items-center justify-end space-x-2">
                          <button
                            onClick={() => {
                              setSelectedTask(t);
                              setIsDetailsOpen(true);
                            }}
                            title="View Task Details"
                            className="p-1.5 text-slate-400 hover:text-indigo-400 rounded-lg hover:bg-slate-800 transition-colors"
                          >
                            <Eye className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => {
                              setSelectedTask(t);
                              setIsEditOpen(true);
                            }}
                            title="Edit Task"
                            className="p-1.5 text-slate-400 hover:text-amber-400 rounded-lg hover:bg-slate-800 transition-colors"
                          >
                            <Edit2 className="w-4 h-4" />
                          </button>
                          {(() => {
                            const perm = checkTaskDeletePermission(t, user);
                            return (
                              <button
                                onClick={() => {
                                  setSelectedTask(t);
                                  setIsDeleteOpen(true);
                                }}
                                title={
                                  perm.allowed
                                    ? user?.role === 'ROLE_MANAGER'
                                      ? 'Archive Task (Soft Delete)'
                                      : 'Delete Task'
                                    : perm.reason
                                }
                                className={`p-1.5 rounded-lg transition-colors ${
                                  perm.allowed
                                    ? 'text-slate-400 hover:text-rose-400 hover:bg-slate-800'
                                    : 'text-amber-500/70 hover:text-amber-400 hover:bg-amber-500/10'
                                }`}
                              >
                                {perm.allowed ? (
                                  <Trash2 className="w-4 h-4" />
                                ) : (
                                  <ShieldAlert className="w-4 h-4" />
                                )}
                              </button>
                            );
                          })()}
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
      <CreateTaskModal
        isOpen={isCreateOpen}
        onClose={() => setIsCreateOpen(false)}
        onSubmit={handleCreateTask}
        users={users}
      />

      <EditTaskModal
        isOpen={isEditOpen}
        onClose={() => {
          setIsEditOpen(false);
          setSelectedTask(null);
        }}
        onSubmit={handleUpdateTask}
        task={selectedTask}
        users={users}
      />

      <TaskDetailsModal
        isOpen={isDetailsOpen}
        onClose={() => {
          setIsDetailsOpen(false);
          setSelectedTask(null);
        }}
        task={selectedTask}
        onStatusChange={handleStatusChange}
        onEdit={(task: Task) => {
          setSelectedTask(task);
          setIsEditOpen(true);
        }}
      />

      <DeleteTaskModal
        isOpen={isDeleteOpen}
        onClose={() => {
          setIsDeleteOpen(false);
          setSelectedTask(null);
        }}
        onConfirm={handleDeleteTask}
        task={selectedTask}
        loading={deleteLoading}
      />
    </div>
  );
};
