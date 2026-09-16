import React from 'react';
import { useAuth } from '../context/AuthContext';
import { Menu, LogOut, ShieldCheck, UserCheck, Database, Code, Activity, Smartphone } from 'lucide-react';

export default function Header({ onToggleMobileSidebar, onOpenSqlModal, currentView }) {
  const { user, role, logout, switchRoleForDemo, isSupabaseConfigured } = useAuth();

  return (
    <header className="sticky top-0 z-30 bg-slate-900/95 backdrop-blur-xl border-b border-slate-700/80 px-4 py-3 shadow-xl">
      <div className="max-w-7xl mx-auto flex items-center justify-between">
        
        {/* Left Section: Mobile Menu Toggle & App Title */}
        <div className="flex items-center gap-3">
          <button
            onClick={onToggleMobileSidebar}
            className="md:hidden p-2.5 rounded-xl bg-slate-800 text-slate-200 hover:text-white hover:bg-slate-700 border border-slate-700 transition-colors"
            title="Apri Menu"
          >
            <Menu className="w-6 h-6" />
          </button>

          <div className="flex items-center gap-2.5">
            <div className="p-2.5 bg-gradient-to-br from-cyan-500/20 to-blue-500/10 border border-cyan-500/40 rounded-xl text-cyan-400 shadow-md">
              <Activity className="w-5 h-5 animate-pulse" />
            </div>
            <div>
              <h1 className="font-black text-white text-base tracking-tight leading-tight flex items-center gap-2">
                ACL-RTS <span className="text-cyan-400 font-bold text-xs bg-cyan-950/80 px-2 py-0.5 rounded-md border border-cyan-500/40 hidden sm:inline-block">MONITOR PRO</span>
              </h1>
              <span className="text-[11px] text-slate-300 font-medium block capitalize">
                {currentView === 'dashboard' ? 'Dashboard Operativa' : currentView === 'patients' ? 'Database Pazienti' : 'Scheda Dettaglio'}
              </span>
            </div>
          </div>
        </div>

        {/* Right Section: Role Status, SQL Button, Supabase Indicator, User Info & Logout */}
        <div className="flex items-center gap-2 sm:gap-3">

          {/* Database Supabase Indicator */}
          <div className="hidden lg:flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-950 border border-slate-700 text-xs font-semibold text-slate-200 shadow-inner">
            <Database className={`w-4 h-4 ${isSupabaseConfigured ? 'text-emerald-400' : 'text-amber-400'}`} />
            <span>{isSupabaseConfigured ? 'Supabase Live DB' : 'Local Mode'}</span>
          </div>

          {/* SQL Script Viewer Button */}
          <button
            onClick={onOpenSqlModal}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-600 text-xs font-bold text-cyan-300 transition-all shadow-sm"
            title="Visualizza Script SQL per Supabase Editor"
          >
            <Code className="w-4 h-4 text-cyan-400" />
            <span className="hidden sm:inline">Script SQL</span>
          </button>

          {/* RBAC Role Switcher Badge */}
          <div className="flex items-center gap-1 bg-slate-950 p-1 rounded-xl border border-slate-700 shadow-inner">
            <button
              onClick={() => switchRoleForDemo('ADMIN')}
              className={`px-2.5 py-1 rounded-lg text-xs font-extrabold transition-all flex items-center gap-1 ${
                role === 'ADMIN'
                  ? 'bg-cyan-600 text-white border border-cyan-400 shadow-md ring-1 ring-cyan-400/50'
                  : 'text-slate-400 hover:text-slate-200'
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
                  ? 'bg-emerald-600 text-white border border-emerald-400 shadow-md ring-1 ring-emerald-400/50'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
              title="Passa a ruolo Staff/Colleghi Mobile (STAFF)"
            >
              <Smartphone className="w-3.5 h-3.5" />
              <span className="hidden xs:inline">STAFF</span>
            </button>
          </div>

          {/* User Email & Logout */}
          <div className="flex items-center gap-2 pl-2 border-l border-slate-700">
            <div className="hidden md:block text-right">
              <div className="text-xs font-extrabold text-white truncate max-w-[140px]">
                {user?.email || 'Fisioterapista Lead'}
              </div>
              <div className="text-[10px] text-cyan-400 font-mono font-bold uppercase">
                {role === 'ADMIN' ? 'Lead Therapist' : 'Staff Collega (Read-Only)'}
              </div>
            </div>

            <button
              onClick={logout}
              className="p-2 rounded-xl bg-red-950/60 hover:bg-red-600 hover:text-white border border-red-500/40 text-red-400 transition-all shadow-sm"
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
