import React from 'react';
import { NavLink } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { 
  LayoutDashboard, 
  Users, 
  UserCircle,
  FileCode2,
  Lock,
  Target,
  Building2,
  CheckSquare,
  PhoneCall,
  TrendingUp,
  BarChart3,
  Contact as ContactIcon,
  Headphones,
  MessageSquare,
  Package,
  FileText,
  Calendar,
} from 'lucide-react';

export const Sidebar: React.FC = () => {
  const { user, isAdmin, isManager } = useAuth();

  const navItems = [
    {
      label: 'Dashboard',
      to: '/dashboard',
      icon: LayoutDashboard,
      roles: ['ROLE_ADMIN', 'ROLE_MANAGER', 'ROLE_EMPLOYEE'],
    },
    {
      label: 'Reports & Analytics',
      to: '/reports',
      icon: BarChart3,
      roles: ['ROLE_ADMIN', 'ROLE_MANAGER', 'ROLE_EMPLOYEE'],
    },
    {
      label: 'Deals & Pipeline',
      to: '/pipeline',
      icon: TrendingUp,
      roles: ['ROLE_ADMIN', 'ROLE_MANAGER', 'ROLE_EMPLOYEE'],
    },
    {
      label: 'Products & Catalog',
      to: '/products',
      icon: Package,
      roles: ['ROLE_ADMIN', 'ROLE_MANAGER', 'ROLE_EMPLOYEE'],
    },
    {
      label: 'Leads & Prospects',
      to: '/leads',
      icon: Target,
      roles: ['ROLE_ADMIN', 'ROLE_MANAGER', 'ROLE_EMPLOYEE'],
    },
    {
      label: 'Customer Accounts',
      to: '/customers',
      icon: Building2,
      roles: ['ROLE_ADMIN', 'ROLE_MANAGER', 'ROLE_EMPLOYEE'],
    },
    {
      label: 'Contacts & Stakeholders',
      to: '/contacts',
      icon: ContactIcon,
      roles: ['ROLE_ADMIN', 'ROLE_MANAGER', 'ROLE_EMPLOYEE'],
    },
    {
      label: 'Calls & Telephony',
      to: '/calls',
      icon: Headphones,
      roles: ['ROLE_ADMIN', 'ROLE_MANAGER', 'ROLE_EMPLOYEE'],
    },
    {
      label: 'Communications & Inbox',
      to: '/communications',
      icon: MessageSquare,
      roles: ['ROLE_ADMIN', 'ROLE_MANAGER', 'ROLE_EMPLOYEE'],
    },
    {
      label: 'Tasks & Activities',
      to: '/tasks',
      icon: CheckSquare,
      roles: ['ROLE_ADMIN', 'ROLE_MANAGER', 'ROLE_EMPLOYEE'],
    },
    {
      label: 'Follow-Up & Cadence',
      to: '/followups',
      icon: PhoneCall,
      roles: ['ROLE_ADMIN', 'ROLE_MANAGER', 'ROLE_EMPLOYEE'],
    },
    {
      label: 'Notes & Activities',
      to: '/notes-activities',
      icon: FileText,
      roles: ['ROLE_ADMIN', 'ROLE_MANAGER', 'ROLE_EMPLOYEE'],
    },
    {
      label: 'Meetings & Schedule',
      to: '/appointments',
      icon: Calendar,
      roles: ['ROLE_ADMIN', 'ROLE_MANAGER', 'ROLE_EMPLOYEE'],
    },
    {
      label: isAdmin ? 'User Management' : 'Team Members',
      to: '/users',
      icon: Users,
      roles: ['ROLE_ADMIN', 'ROLE_MANAGER'],
    },
    {
      label: 'My Profile',
      to: '/profile',
      icon: UserCircle,
      roles: ['ROLE_ADMIN', 'ROLE_MANAGER', 'ROLE_EMPLOYEE'],
    },
  ];

  return (
    <aside className="w-64 border-r border-slate-800/80 bg-slate-900/40 backdrop-blur-sm flex flex-col justify-between shrink-0">
      <div className="p-4 space-y-6">
        <div>
          <p className="px-3 text-[11px] font-semibold tracking-wider text-slate-500 uppercase">
            Navigation
          </p>
          <nav className="mt-2 space-y-1">
            {navItems
              .filter((item) => user && item.roles.includes(user.role))
              .map((item) => {
                const Icon = item.icon;
                return (
                  <NavLink
                    key={item.to}
                    to={item.to}
                    className={({ isActive }) =>
                      `flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-medium transition-colors ${
                        isActive
                          ? 'bg-indigo-600/15 text-indigo-400 border border-indigo-500/20 font-semibold'
                          : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
                      }`
                    }
                  >
                    <Icon className="w-4 h-4" />
                    <span>{item.label}</span>
                  </NavLink>
                );
              })}
          </nav>
        </div>

        <div>
          <p className="px-3 text-[11px] font-semibold tracking-wider text-slate-500 uppercase">
            Security & RBAC
          </p>
          <div className="mt-2 p-3 rounded-xl bg-slate-900/80 border border-slate-800 text-xs space-y-2 text-slate-400">
            <div className="flex items-center justify-between text-slate-300 font-medium">
              <span className="flex items-center gap-1.5">
                <Lock className="w-3.5 h-3.5 text-indigo-400" />
                Your Permissions
              </span>
            </div>
            <div className="space-y-1 text-[11px]">
              <div className="flex items-center justify-between">
                <span>View Dashboard:</span>
                <span className="text-emerald-400 font-semibold">Granted</span>
              </div>
              <div className="flex items-center justify-between">
                <span>View Team / Users:</span>
                <span className={isAdmin || isManager ? 'text-emerald-400 font-semibold' : 'text-slate-500'}>
                  {isAdmin || isManager ? 'Granted' : 'Denied'}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span>Role Assignment:</span>
                <span className={isAdmin ? 'text-emerald-400 font-semibold' : 'text-slate-500'}>
                  {isAdmin ? 'Granted' : 'Admin Only'}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="p-4 border-t border-slate-800/60">
        <a
          href="http://localhost:8080/swagger-ui.html"
          target="_blank"
          rel="noreferrer"
          className="flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-semibold text-indigo-300 bg-indigo-500/10 hover:bg-indigo-500/20 border border-indigo-500/20 transition-all duration-150"
        >
          <FileCode2 className="w-4 h-4 text-indigo-400" />
          <span>Open Swagger Docs</span>
        </a>
      </div>
    </aside>
  );
};
