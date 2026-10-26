import React from 'react';
import {
  LayoutDashboard,
  Users,
  UserCheck,
  Database,
  X,
  CheckCircle2,
  Printer
} from 'lucide-react';

export default function Sidebar({
  currentView,
  setCurrentView,
  selectedPatient,
  mobileOpen,
  setMobileOpen,
  onOpenSqlModal,
  onOpenPrintConfigurator
}) {
  const navItems = [
    { id: 'dashboard', label: 'Dashboard Clinica', icon: LayoutDashboard },
    { id: 'patients', label: 'Elenco Pazienti', icon: Users },
    {
      id: 'patient-detail',
      label: selectedPatient ? `Scheda: ${selectedPatient.cognome}` : 'Scheda Paziente',
      icon: UserCheck,
      disabled: !selectedPatient
    }
  ];

  const handleNav = (id) => {
    setCurrentView(id);
    setMobileOpen(false);
  };

  const sidebarContent = (
    <div className="flex flex-col h-full justify-between p-4 bg-slate-50 border-r border-slate-300/60 w-64 select-none text-slate-800 shadow-none">
      <div className="space-y-6">
        <div className="flex items-center justify-between lg:hidden pb-2 border-b border-slate-300/60">
          <span className="font-bold text-sm text-slate-800">Menu Navigazione</span>
          <button onClick={() => setMobileOpen(false)} className="p-1 text-slate-500 hover:text-slate-800">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Navigation Links */}
        <div className="space-y-1.5">
          <div className="px-3 py-1 text-[10px] font-mono uppercase tracking-wider text-slate-500 font-bold">
            Area Clinica &amp; Riabilitativa
          </div>
          {navItems.map((item) => {
            const Icon = item.icon;
            const active = currentView === item.id;
            return (
              <button
                key={item.id}
                disabled={item.disabled}
                onClick={() => handleNav(item.id)}
                className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                  active
                    ? 'bg-emerald-100/80 text-emerald-900 border border-emerald-300/50'
                    : item.disabled
                    ? 'opacity-40 cursor-not-allowed text-slate-400'
                    : 'text-slate-600 hover:text-slate-800 hover:bg-slate-200/50'
                }`}
              >
                <Icon className={`w-4 h-4 ${active ? 'text-emerald-900' : 'text-slate-600'}`} />
                <span className="truncate">{item.label}</span>
              </button>
            );
          })}
        </div>

        {/* Quick Tools (Script SQL Supabase spostato nell'Header) */}
        <div className="space-y-1.5 pt-4 border-t border-slate-300/60">
          <div className="px-3 py-1 text-[10px] font-mono uppercase tracking-wider text-slate-500 font-bold">
            Strumenti &amp; Report
          </div>

          <button
            type="button"
            onClick={() => {
              if (onOpenPrintConfigurator) onOpenPrintConfigurator();
              setMobileOpen(false);
            }}
            className="w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-bold text-slate-700 hover:text-slate-800 hover:bg-slate-200/50 transition-all cursor-pointer"
          >
            <div className="p-1 bg-purple-100/80 text-purple-900 rounded">
              <Printer className="w-4 h-4 text-purple-900" />
            </div>
            <span>Stampa Report A4</span>
          </button>
        </div>
      </div>

      {/* Bottom Info Card */}
      <div className="p-3.5 rounded-xl bg-emerald-100/60 border border-emerald-300/50 space-y-2">
        <div className="flex items-center gap-2 text-emerald-900 text-xs font-bold">
          <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-900" />
          <span>Clinical Engine Attivo</span>
        </div>
        <p className="text-[11px] text-emerald-900/80 font-medium leading-relaxed">
          LSI, Metriche Personalizzate, Sessioni 14gg e Copilot attivi.
        </p>
      </div>
    </div>
  );

  return (
    <>
      <aside className="hidden lg:block shrink-0 print:hidden">{sidebarContent}</aside>

      {mobileOpen && (
        <div className="fixed inset-0 z-50 lg:hidden flex print:hidden">
          <div
            className="fixed inset-0 bg-stone-900/40 backdrop-blur-xs"
            onClick={() => setMobileOpen(false)}
          />
          <div className="relative z-10">{sidebarContent}</div>
        </div>
      )}
    </>
  );
}
