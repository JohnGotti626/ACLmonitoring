import React from 'react';
import { ShieldCheck, UserCheck, Database, Menu } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import LogoN from './LogoN';

export default function Header({ onToggleMobileSidebar, onOpenSqlModal, currentView }) {
  const { role } = useAuth();
  const isPortal = currentView === 'client-portal' || role === 'patient';

  return (
    <header className="sticky top-0 z-30 bg-[#f4f3ef] border-b border-stone-200 px-4 sm:px-6 py-3.5 flex items-center justify-between print:hidden shadow-xs">
      <div className="flex items-center gap-3.5">
        {!isPortal && (
          <button
            onClick={onToggleMobileSidebar}
            className="lg:hidden p-2 rounded-xl text-slate-700 hover:text-slate-900 hover:bg-stone-200/70 transition-colors cursor-pointer"
            aria-label="Menu"
          >
            <Menu className="w-5 h-5" />
          </button>
        )}

        <div className="flex items-center gap-3.5">
          <LogoN className="w-10 h-10 rounded-2xl shadow-sm shrink-0 border border-stone-200/80" />
          <div className="flex flex-col justify-center">
            <span className="font-black text-base sm:text-xl tracking-tight text-slate-900 leading-tight">
              ACL <span className="text-blue-600">RETURN TO SPORT</span>
            </span>
            <p className="text-[11px] text-slate-700 font-bold tracking-wider uppercase mt-0.5">
              Monitoring - Testing - Repeat
            </p>
          </div>
        </div>
      </div>

      <div className="flex items-center gap-2 sm:gap-2.5">
        {!isPortal && (
          <>
            <button
              onClick={onOpenSqlModal}
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-2xl bg-blue-50 hover:bg-blue-100 border border-blue-200 text-xs font-extrabold text-blue-900 transition-all cursor-pointer shadow-2xs"
              title="Apri Script SQL Supabase (staff_users, custom_metric_definitions, patient_custom_metrics)"
            >
              <Database className="w-3.5 h-3.5 text-blue-600" />
              <span>Script SQL Supabase</span>
            </button>

            <button
              onClick={onOpenSqlModal}
              className="hidden sm:flex items-center gap-1.5 px-3.5 py-2 rounded-2xl bg-white hover:bg-stone-50 border border-stone-200 text-xs font-extrabold text-slate-900 transition-all cursor-pointer shadow-2xs"
              title="Visualizza Schema SQL completo"
            >
              <Database className="w-3.5 h-3.5 text-amber-600" />
              <span>Schema SQL</span>
            </button>
          </>
        )}

        <div className="flex items-center gap-1.5 px-3.5 py-2 rounded-2xl bg-emerald-50 border border-emerald-200 shadow-2xs">
          {role === 'admin' ? (
            <>
              <ShieldCheck className="w-4 h-4 text-emerald-700" />
              <span className="text-xs font-extrabold text-emerald-900 hidden md:inline">
                Staff Clinico Autorizzato
              </span>
            </>
          ) : (
            <>
              <UserCheck className="w-4 h-4 text-emerald-700" />
              <span className="text-xs font-extrabold text-emerald-900 hidden md:inline">
                Vista Atleta
              </span>
            </>
          )}
        </div>
      </div>
    </header>
  );
}
