import React from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { RoleBadge } from './RoleBadge';
import { LogOut, Shield } from 'lucide-react';
import { NotificationDropdown } from './NotificationDropdown';

interface NavbarProps {
  onToggleSidebar?: () => void;
}

export const Navbar: React.FC<NavbarProps> = () => {
  const { user, logout } = useAuth();

  return (
    <header className="h-16 border-b border-slate-800/80 bg-slate-950 sticky top-0 z-30 px-6 flex items-center justify-between w-full">
      <Link
        to="/dashboard"
        className="flex items-center gap-3 cursor-pointer select-none"
      >
        <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-indigo-600 to-violet-500 flex items-center justify-center text-white shadow-md shadow-indigo-600/30">
          <Shield className="w-5 h-5" />
        </div>
        <div>
          <h1 className="text-base font-bold text-slate-100 tracking-tight flex items-center gap-2">
            Basic CRM
            <span className="text-[10px] font-medium tracking-wider uppercase px-2 py-0.5 rounded bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
              Auth & Security
            </span>
          </h1>
        </div>
      </Link>

      {user && (
        <div className="flex items-center gap-3 sm:gap-4">
          <NotificationDropdown />

          <Link 
            to="/profile"
            className="hidden sm:flex items-center gap-3 pr-4 border-r border-slate-800 hover:opacity-90 transition group cursor-pointer"
          >
            <div className="w-9 h-9 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center text-slate-300 font-semibold text-sm group-hover:border-indigo-500 transition">
              {user.name.charAt(0).toUpperCase()}
            </div>
            <div className="text-left">
              <p className="text-sm font-semibold text-slate-200 leading-tight group-hover:text-indigo-300 transition">{user.name}</p>
              <div className="flex items-center gap-2 mt-0.5">
                <span className="text-xs text-slate-400">{user.email}</span>
                <RoleBadge role={user.role} showIcon={false} />
              </div>
            </div>
          </Link>

          <button
            onClick={logout}
            title="Logout"
            className="flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-semibold text-slate-300 hover:text-rose-400 bg-slate-800/80 hover:bg-rose-500/10 border border-slate-700/60 hover:border-rose-500/20 transition-all duration-150"
          >
            <LogOut className="w-4 h-4" />
            <span className="hidden md:inline">Sign Out</span>
          </button>
        </div>
      )}
    </header>
  );
};
