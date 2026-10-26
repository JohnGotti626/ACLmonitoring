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
    <div className="flex flex-col h-full justify-between p-4 bg-stone-50 border-r border-stone-300/70 w-64 select-none text-stone-800 shadow-none">
      <div className="space-y-6">
        <div className="flex items-center justify-between lg:hidden pb-2 border-b border-stone-300/70">
          <span className="font-semibold text-sm text-stone-800">Menu Navigazione</span>
          <button onClick={() => setMobileOpen(false)} className="p-1 text-stone-500 hover:text-stone-800">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Navigation Links */}
        <div className="space-y-1.5">
          <div className="px-3 py-1 text-[10px] font-mono uppercase tracking-wider text-stone-500 font-semibold">
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
                className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                  active
                    ? 'bg-stone-800 text-stone-100'
                    : item.disabled
                    ? 'opacity-40 cursor-not-allowed text-stone-400'
                    : 'text-stone-600 hover:text-stone-800 hover:bg-stone-200/50'
                }`}
              >
                <Icon className={`w-4 h-4 ${active ? 'text-stone-100' : 'text-stone-700'}`} />
                <span className="truncate">{item.label}</span>
              </button>
            );
          })}
        </div>

        {/* Quick Tools */}
        <div className="space-y-1.5 pt-4 border-t border-stone-300/70">
          <div className="px-3 py-1 text-[10px] font-mono uppercase tracking-wider text-stone-500 font-semibold">
            Strumenti &amp; Report
          </div>

          <button
            onClick={() => {
              onOpenSqlModal();
              setMobileOpen(false);
            }}
            className="w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-semibold text-stone-700 hover:text-stone-800 hover:bg-stone-200/50 transition-all cursor-pointer"
          >
            <div className="p-1 bg-stone-200/60 text-stone-700 rounded">
              <Database className="w-4 h-4 text-stone-700" />
            </div>
            <span>Script SQL Supabase</span>
          </button>

          <button
            type="button"
            onClick={() => {
              if (onOpenPrintConfigurator) onOpenPrintConfigurator();
              setMobileOpen(false);
            }}
            className="w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-semibold text-stone-700 hover:text-stone-800 hover:bg-stone-200/50 transition-all cursor-pointer"
          >
            <div className="p-1 bg-stone-200/60 text-stone-700 rounded">
              <Printer className="w-4 h-4 text-stone-700" />
            </div>
            <span>Stampa Report A4</span>
          </button>
        </div>
      </div>

      {/* Bottom Info Card */}
      <div className="p-3.5 rounded-xl bg-stone-100 border border-stone-300/70 space-y-2">
        <div className="flex items-center gap-2 text-emerald-800 text-xs font-semibold">
          <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-800" />
          <span>Clinical Engine Attivo</span>
        </div>
        <p className="text-[11px] text-stone-500 font-medium leading-relaxed">
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
