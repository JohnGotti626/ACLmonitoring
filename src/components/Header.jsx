import React from 'react';
import { useAuth } from '../context/AuthContext';
import { Menu, LogOut, ShieldCheck, Database, Code, Activity, Smartphone } from 'lucide-react';

export default function Header({ onToggleMobileSidebar, onOpenSqlModal, currentView }) {
  const { user, role, logout, switchRoleForDemo, isSupabaseConfigured } = useAuth();

  return (
    <header className="sticky top-0 z-30 bg-[#0F172A]/95 backdrop-blur-xl border-b border-[#334155] px-4 py-3 shadow-md">
      <div className="max-w-7xl mx-auto flex items-center justify-between">
        
        {/* Left Section: Mobile Menu Toggle & App Title */}
        <div className="flex items-center gap-3">
          <button
            onClick={onToggleMobileSidebar}
            className="md:hidden p-2.5 rounded-xl bg-[#1E293B] text-[#94A3B8] hover:text-white hover:bg-slate-700 border border-[#334155] transition-colors"
            title="Apri Menu"
          >
            <Menu className="w-6 h-6" />
          </button>

          <div className="flex items-center gap-2.5">
            <div className="p-2.5 bg-[#1E293B] border border-[#334155] rounded-xl text-[#06B6D4]">
              <Activity className="w-5 h-5" />
            </div>
            <div>
              <h1 className="font-black text-white text-base tracking-tight leading-tight flex items-center gap-2">
                ACL-RTS <span className="text-[#06B6D4] font-bold text-xs bg-[#1E293B] px-2 py-0.5 rounded-md border border-[#334155] hidden sm:inline-block">MONITOR PRO</span>
              </h1>
              <span className="text-[11px] text-[#94A3B8] font-medium block capitalize">
                {currentView === 'dashboard' ? 'Dashboard Operativa' : currentView === 'patients' ? 'Database Pazienti' : 'Scheda Dettaglio'}
              </span>
            </div>
          </div>
        </div>

        {/* Right Section: Role Status, SQL Button, Supabase Indicator, User Info & Logout */}
        <div className="flex items-center gap-2 sm:gap-3">

          {/* Database Supabase Indicator */}
          <div className="hidden lg:flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#1E293B] border border-[#334155] text-xs font-semibold text-white">
            <Database className={`w-4 h-4 ${isSupabaseConfigured ? 'text-[#0D9488]' : 'text-amber-400'}`} />
            <span>{isSupabaseConfigured ? 'Supabase Live DB' : 'Local Mode'}</span>
          </div>

          {/* SQL Script Viewer Button */}
          <button
            onClick={onOpenSqlModal}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#1E293B] hover:bg-slate-700 border border-[#334155] text-xs font-bold text-[#06B6D4] transition-all cursor-pointer"
            title="Visualizza Script SQL per Supabase Editor"
          >
            <Code className="w-4 h-4 text-[#06B6D4]" />
            <span className="hidden sm:inline">Script SQL</span>
          </button>

          {/* RBAC Role Switcher Badge */}
          <div className="flex items-center gap-1 bg-[#1E293B] p-1 rounded-xl border border-[#334155]">
            <button
              onClick={() => switchRoleForDemo('ADMIN')}
              className={`px-2.5 py-1 rounded-lg text-xs font-extrabold transition-all flex items-center gap-1 cursor-pointer ${
                role === 'ADMIN'
                  ? 'bg-[#06B6D4] text-slate-950 shadow-sm'
                  : 'text-[#94A3B8] hover:text-white'
              }`}
              title="Passa a ruolo Lead Therapist (ADMIN)"
            >
              <ShieldCheck className="w-3.5 h-3.5" />
              <span className="hidden xs:inline">ADMIN</span>
            </button>

            <button
              onClick={() => switchRoleForDemo('STAFF')}
              className={`px-2.5 py-1 rounded-lg text-xs font-extrabold transition-all flex items-center gap-1 cursor-pointer ${
                role === 'STAFF'
                  ? 'bg-[#0D9488] text-white shadow-sm'
                  : 'text-[#94A3B8] hover:text-white'
              }`}
              title="Passa a ruolo Staff/Colleghi Mobile (STAFF)"
            >
              <Smartphone className="w-3.5 h-3.5" />
              <span className="hidden xs:inline">STAFF</span>
            </button>
          </div>

          {/* User Email & Logout */}
          <div className="flex items-center gap-2 pl-2 border-l border-[#334155]">
            <div className="hidden md:block text-right">
              <div className="text-xs font-extrabold text-white truncate max-w-[140px]">
                {user?.email || 'Fisioterapista Lead'}
              </div>
              <div className="text-[10px] text-[#06B6D4] font-mono font-bold uppercase">
                {role === 'ADMIN' ? 'Lead Therapist' : 'Staff Collega (Read-Only)'}
              </div>
            </div>

            <button
              onClick={logout}
              className="p-2 rounded-xl bg-[#1E293B] hover:bg-rose-600 hover:text-white border border-[#334155] text-rose-400 transition-all cursor-pointer"
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
