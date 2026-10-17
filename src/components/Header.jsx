import React from 'react';
import { useAuth } from '../context/AuthContext';
import { Menu, LogOut, ShieldCheck, Database, Code, Activity, Smartphone } from 'lucide-react';

export default function Header({ onToggleMobileSidebar, onOpenSqlModal, currentView }) {
  const { user, role, logout, switchRoleForDemo, isSupabaseConfigured } = useAuth();

  return (
    <header className="sticky top-0 z-30 bg-white/95 backdrop-blur-xl border-b border-slate-200 px-4 py-3 shadow-xs">
      <div className="max-w-7xl mx-auto flex items-center justify-between">
        
        {/* Left Section: Mobile Menu Toggle & App Title */}
        <div className="flex items-center gap-3">
          <button
            onClick={onToggleMobileSidebar}
            className="md:hidden p-2.5 rounded-xl bg-slate-100 text-slate-700 hover:text-slate-900 hover:bg-slate-200 border border-slate-200 transition-colors"
            title="Apri Menu"
          >
            <Menu className="w-6 h-6" />
          </button>

          <div className="flex items-center gap-2.5">
            <div className="p-2.5 bg-sky-50 border border-sky-200 rounded-xl text-sky-600 shadow-2xs">
              <Activity className="w-5 h-5" />
            </div>
            <div>
              <h1 className="font-black text-slate-900 text-base tracking-tight leading-tight flex items-center gap-2">
                ACL-RTS <span className="text-sky-700 font-bold text-xs bg-sky-50 px-2 py-0.5 rounded-md border border-sky-200 hidden sm:inline-block">MONITOR PRO</span>
              </h1>
              <span className="text-[11px] text-slate-500 font-medium block capitalize">
                {currentView === 'dashboard' ? 'Dashboard Operativa' : currentView === 'patients' ? 'Database Pazienti' : 'Scheda Dettaglio'}
              </span>
            </div>
          </div>
        </div>

        {/* Right Section: Role Status, SQL Button, Supabase Indicator, User Info & Logout */}
        <div className="flex items-center gap-2 sm:gap-3">

          {/* Database Supabase Indicator */}
          <div className="hidden lg:flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-50 border border-slate-200 text-xs font-semibold text-slate-700">
            <Database className={`w-4 h-4 ${isSupabaseConfigured ? 'text-emerald-600' : 'text-amber-600'}`} />
            <span>{isSupabaseConfigured ? 'Supabase Live DB' : 'Local Mode'}</span>
          </div>

          {/* SQL Script Viewer Button */}
          <button
            onClick={onOpenSqlModal}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 border border-slate-200 text-xs font-bold text-sky-700 transition-all"
            title="Visualizza Script SQL per Supabase Editor"
          >
            <Code className="w-4 h-4 text-sky-600" />
            <span className="hidden sm:inline">Script SQL</span>
          </button>

          {/* RBAC Role Switcher Badge */}
          <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl border border-slate-200">
            <button
              onClick={() => switchRoleForDemo('ADMIN')}
              className={`px-2.5 py-1 rounded-lg text-xs font-extrabold transition-all flex items-center gap-1 ${
                role === 'ADMIN'
                  ? 'bg-sky-600 text-white border border-sky-600 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
              title="Passa a ruolo Lead Therapist (ADMIN)"
            >
              <ShieldCheck className="w-3.5 h-3.5" />
              <span className="hidden xs:inline">ADMIN</span>
            </button>

            <button
              onClick={() => switchRoleForDemo('STAFF')}
              className={`px-2.5 py-1 rounded-lg text-xs font-extrabold transition-all flex items-center gap-1 ${
                role === 'STAFF'
                  ? 'bg-emerald-600 text-white border border-emerald-600 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
              title="Passa a ruolo Staff/Colleghi Mobile (STAFF)"
            >
              <Smartphone className="w-3.5 h-3.5" />
              <span className="hidden xs:inline">STAFF</span>
            </button>
          </div>

          {/* User Email & Logout */}
          <div className="flex items-center gap-2 pl-2 border-l border-slate-200">
            <div className="hidden md:block text-right">
              <div className="text-xs font-extrabold text-slate-900 truncate max-w-[140px]">
                {user?.email || 'Fisioterapista Lead'}
              </div>
              <div className="text-[10px] text-sky-700 font-mono font-bold uppercase">
                {role === 'ADMIN' ? 'Lead Therapist' : 'Staff Collega (Read-Only)'}
              </div>
            </div>

            <button
              onClick={logout}
              className="p-2 rounded-xl bg-rose-50 hover:bg-rose-600 hover:text-white border border-rose-200 text-rose-600 transition-all"
              title="Logout Sicuro"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>

        </div>

      </div>
    </header>
  );
}

