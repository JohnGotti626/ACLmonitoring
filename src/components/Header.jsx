import React from 'react';
import { Activity, ShieldCheck, UserCheck, Database, Menu } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export default function Header({ onToggleMobileSidebar, onOpenSqlModal, currentView }) {
  const { role } = useAuth();
  const isPortal = currentView === 'client-portal' || role === 'patient';

  return (
    <header className="sticky top-0 z-30 bg-white border-b border-slate-300/80 px-4 sm:px-6 py-3 flex items-center justify-between print:hidden shadow-xs">
      <div className="flex items-center gap-3">
        {!isPortal && (
          <button
            onClick={onToggleMobileSidebar}
            className="lg:hidden p-2 rounded-lg text-slate-600 hover:text-slate-900 hover:bg-slate-200/60 transition-colors cursor-pointer"
            aria-label="Menu"
          >
            <Menu className="w-5 h-5" />
          </button>
        )}

        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-xl bg-[#1D63FE] flex items-center justify-center shadow-xs">
            <Activity className="w-4 h-4 text-white" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-bold text-base sm:text-lg tracking-tight text-slate-900">
                ACL <span className="text-[#1D63FE]">RETURN TO SPORT</span>
              </span>
              <span className="hidden md:inline-block text-[10px] font-mono uppercase tracking-widest px-2.5 py-0.5 rounded-full bg-[#DCEBFE] text-[#1D63FE] border border-[#C5DCFA] font-bold">
                Clinical Suite
              </span>
            </div>
            <p className="text-[11px] text-slate-500 font-medium hidden sm:block">
              Monitoraggio Biomeccanico, Metriche Personalizzate &amp; Copilot Clinico
            </p>
          </div>
        </div>
      </div>

      <div className="flex items-center gap-2 sm:gap-2.5">
        {!isPortal && (
          <>
            <button
              onClick={onOpenSqlModal}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#DCEBFE] hover:bg-[#CBE0FC] border border-[#B9D5FA] text-xs font-bold text-slate-900 transition-all cursor-pointer"
              title="Apri Script SQL Supabase (staff_users, custom_metric_definitions, patient_custom_metrics)"
            >
              <Database className="w-3.5 h-3.5 text-[#1D63FE]" />
              <span>Script SQL Supabase</span>
            </button>

            <button
              onClick={onOpenSqlModal}
              className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-stone-50 hover:bg-slate-100 border border-slate-300/80 text-xs font-bold text-slate-800 transition-all cursor-pointer"
              title="Visualizza Schema SQL completo"
            >
              <Database className="w-3.5 h-3.5 text-[#F59E0B]" />
              <span>Schema SQL</span>
            </button>
          </>
        )}

        <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#D1F4E2] border border-[#B5E8CE]">
          {role === 'admin' ? (
            <>
              <ShieldCheck className="w-4 h-4 text-[#16A34A]" />
              <span className="text-xs font-bold text-emerald-950 hidden md:inline">Staff Clinico Autorizzato</span>
            </>
          ) : (
            <>
              <UserCheck className="w-4 h-4 text-[#16A34A]" />
              <span className="text-xs font-bold text-emerald-950 hidden md:inline">Vista Atleta</span>
            </>
          )}
        </div>
      </div>
    </header>
  );
}
