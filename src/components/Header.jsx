import React from 'react';
import { Activity, ShieldCheck, UserCheck, Database, Menu } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export default function Header({ onToggleMobileSidebar, onOpenSqlModal, currentView }) {
  const { role } = useAuth();
  const isPortal = currentView === 'client-portal' || role === 'patient';

  return (
    <header className="sticky top-0 z-30 bg-white/95 backdrop-blur-md border-b border-slate-200/80 px-4 sm:px-6 py-3 flex items-center justify-between print:hidden shadow-2xs">
      <div className="flex items-center gap-3">
        {!isPortal && (
          <button
            onClick={onToggleMobileSidebar}
            className="lg:hidden p-2 rounded-lg text-slate-500 hover:text-slate-900 hover:bg-slate-100 transition-colors cursor-pointer"
            aria-label="Menu"
          >
            <Menu className="w-5 h-5" />
          </button>
        )}

        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-xl bg-emerald-600 flex items-center justify-center shadow-xs">
            <Activity className="w-5 h-5 text-white" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-bold text-base sm:text-lg tracking-tight text-slate-900">
                ACL <span className="text-emerald-600">RETURN TO SPORT</span>
              </span>
              <span className="hidden md:inline-block text-[10px] font-mono uppercase tracking-widest px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 font-bold">
                NSCA Clinical Suite
              </span>
            </div>
            <p className="text-[11px] text-slate-500 hidden sm:block">
              Monitoraggio Biomeccanico, Metriche Personalizzate &amp; Clinical Copilot NSCA
            </p>
          </div>
        </div>
      </div>

      <div className="flex items-center gap-2 sm:gap-3">
        {!isPortal && (
          <button
            onClick={onOpenSqlModal}
            className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 border border-slate-200 text-xs font-bold text-slate-700 transition-all cursor-pointer"
            title="Visualizza lo Script SQL Supabase (staff_users, custom_metric_definitions, patient_custom_metrics)"
          >
            <Database className="w-3.5 h-3.5 text-emerald-600" />
            <span>Schema SQL</span>
          </button>
        )}

        <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-50 border border-emerald-200">
          {role === 'admin' ? (
            <>
              <ShieldCheck className="w-4 h-4 text-emerald-700" />
              <span className="text-xs font-bold text-emerald-800">Staff Clinico Autorizzato</span>
            </>
          ) : (
            <>
              <UserCheck className="w-4 h-4 text-emerald-700" />
              <span className="text-xs font-bold text-emerald-800">Vista Atleta</span>
            </>
          )}
        </div>
      </div>
    </header>
  );
}
