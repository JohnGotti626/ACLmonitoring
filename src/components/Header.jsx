import React from 'react';
import { Activity, ShieldCheck, UserCheck, Database, Menu } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export default function Header({ onToggleMobileSidebar, onOpenSqlModal, currentView }) {
  const { role } = useAuth();
  const isPortal = currentView === 'client-portal' || role === 'patient';

  return (
    <header className="sticky top-0 z-30 bg-stone-50 border-b border-stone-300/70 px-4 sm:px-6 py-3 flex items-center justify-between print:hidden shadow-none">
      <div className="flex items-center gap-3">
        {!isPortal && (
          <button
            onClick={onToggleMobileSidebar}
            className="lg:hidden p-2 rounded-lg text-stone-500 hover:text-stone-800 hover:bg-stone-200/50 transition-colors cursor-pointer"
            aria-label="Menu"
          >
            <Menu className="w-5 h-5" />
          </button>
        )}

        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-xl bg-stone-800 flex items-center justify-center">
            <Activity className="w-4 h-4 text-stone-100" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-semibold text-base sm:text-lg tracking-tight text-stone-800">
                ACL <span className="text-emerald-800">RETURN TO SPORT</span>
              </span>
              <span className="hidden md:inline-block text-[10px] font-mono uppercase tracking-widest px-2 py-0.5 rounded-full bg-emerald-900/10 text-emerald-800 border border-emerald-300/40 font-semibold">
                Clinical Suite
              </span>
            </div>
            <p className="text-[11px] text-stone-500 font-medium hidden sm:block">
              Monitoraggio Biomeccanico, Metriche Personalizzate &amp; Copilot Clinico
            </p>
          </div>
        </div>
      </div>

      <div className="flex items-center gap-2 sm:gap-3">
        {!isPortal && (
          <button
            onClick={onOpenSqlModal}
            className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-stone-100 hover:bg-stone-200/50 border border-stone-300/70 text-xs font-semibold text-stone-800 transition-all cursor-pointer"
            title="Visualizza lo Script SQL Supabase (staff_users, custom_metric_definitions, patient_custom_metrics)"
          >
            <Database className="w-3.5 h-3.5 text-stone-700" />
            <span>Schema SQL</span>
          </button>
        )}

        <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-900/10 border border-emerald-300/40">
          {role === 'admin' ? (
            <>
              <ShieldCheck className="w-4 h-4 text-emerald-800" />
              <span className="text-xs font-semibold text-emerald-800">Staff Clinico Autorizzato</span>
            </>
          ) : (
            <>
              <UserCheck className="w-4 h-4 text-emerald-800" />
              <span className="text-xs font-semibold text-emerald-800">Vista Atleta</span>
            </>
          )}
        </div>
      </div>
    </header>
  );
}
