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
    <div className="flex flex-col h-full justify-between p-4 bg-white border-r border-slate-200/80 w-64 select-none text-slate-900">
      <div className="space-y-6">
        <div className="flex items-center justify-between lg:hidden pb-2 border-b border-slate-200">
          <span className="font-bold text-sm text-slate-700">Menu Navigazione</span>
          <button onClick={() => setMobileOpen(false)} className="p-1 text-slate-500 hover:text-slate-900">
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
                    ? 'bg-emerald-700 text-white shadow-sm'
                    : item.disabled
                    ? 'opacity-40 cursor-not-allowed text-slate-400'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-emerald-50/50'
                }`}
              >
                <Icon className={`w-4 h-4 ${active ? 'text-white' : 'text-emerald-600'}`} />
                <span className="truncate">{item.label}</span>
              </button>
            );
          })}
        </div>

        {/* Quick Tools */}
        <div className="space-y-1.5 pt-4 border-t border-slate-200">
          <div className="px-3 py-1 text-[10px] font-mono uppercase tracking-wider text-slate-500 font-bold">
            Strumenti &amp; Report
          </div>

          <button
            onClick={() => {
              onOpenSqlModal();
              setMobileOpen(false);
            }}
            className="w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-semibold text-slate-600 hover:text-slate-900 hover:bg-slate-100 transition-all cursor-pointer"
          >
            <div className="p-1 bg-slate-100 text-slate-600 rounded">
              <Database className="w-4 h-4 text-emerald-600" />
            </div>
            <span>Script SQL Supabase</span>
          </button>

          <button
            type="button"
            onClick={() => {
              if (onOpenPrintConfigurator) onOpenPrintConfigurator();
              setMobileOpen(false);
            }}
            className="w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-semibold text-slate-600 hover:text-slate-900 hover:bg-slate-100 transition-all cursor-pointer"
          >
            <div className="p-1 bg-slate-100 text-slate-600 rounded">
              <Printer className="w-4 h-4 text-emerald-600" />
            </div>
            <span>Stampa Report A4</span>
          </button>
        </div>
      </div>

      {/* Bottom Info Card */}
      <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 space-y-2">
        <div className="flex items-center gap-2 text-emerald-700 text-xs font-bold">
          <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600" />
          <span>NSCA Clinical Engine</span>
        </div>
        <p className="text-[11px] text-slate-500 leading-relaxed">
          LSI, Metriche Personalizzate, Sessioni 14gg e Copilot AI NSCA attivi.
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
            className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs"
            onClick={() => setMobileOpen(false)}
          />
          <div className="relative z-10">{sidebarContent}</div>
        </div>
      )}
    </>
  );
}
